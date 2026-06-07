import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import chokidar from "chokidar";
import Fastify, { type FastifyInstance } from "fastify";
import {
  listRuns,
  readDashboardSettings,
  readEventsFile,
  readRunDetail,
  resolveArtifactPath,
  writeDashboardSettings,
} from "@stack-test/core";
import { getMockFile, mockRunList, mockRuns } from "./mock-data.js";

export interface DashboardServerOptions {
  dataDir?: string;
  runsDir?: string;
  host?: string;
  port?: number;
  open?: boolean;
  mock?: boolean;
  enableActions?: boolean;
}

export interface StartedDashboardServer {
  app: FastifyInstance;
  url: string;
  close: () => Promise<void>;
}

function resolveRunsDir(options: DashboardServerOptions): string {
  if (options.runsDir) {
    return path.resolve(process.cwd(), options.runsDir);
  }
  return path.resolve(process.cwd(), options.dataDir || ".stacktest", "runs");
}

function webDistDir(): string {
  const serverDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(serverDir, "..", "web");
}

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

export function createDashboardServer(options: DashboardServerOptions = {}): FastifyInstance {
  const runsDir = resolveRunsDir(options);
  const dataDir = options.dataDir || ".stacktest";
  const app = Fastify({ logger: false });

  app.get("/api/health", async () => ({
    ok: true,
    mock: Boolean(options.mock),
    runsDir,
    actionsEnabled: false,
  }));

  app.get("/api/runs", async () => (options.mock ? mockRunList() : listRuns(runsDir)));

  app.get<{ Params: { runId: string } }>("/api/runs/:runId", async (request, reply) => {
    if (options.mock) {
      const run = mockRuns.find((candidate) => candidate.runId === request.params.runId);
      if (!run) return reply.code(404).send({ error: "Run not found" });
      return run;
    }

    const runDir = path.join(runsDir, request.params.runId);
    if (!fs.existsSync(runDir)) {
      return reply.code(404).send({ error: "Run not found" });
    }
    return readRunDetail(runsDir, request.params.runId);
  });

  app.get<{ Params: { runId: string } }>("/api/runs/:runId/events", async (request, reply) => {
    if (options.mock) {
      const run = mockRuns.find((candidate) => candidate.runId === request.params.runId);
      if (!run) return reply.code(404).send({ error: "Run not found" });
      return run.events;
    }

    const eventsPath = path.join(runsDir, request.params.runId, "events.jsonl");
    return readEventsFile(eventsPath);
  });

  app.get<{ Params: { runId: string } }>(
    "/api/runs/:runId/events/stream",
    async (request, reply) => {
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const send = (event: unknown): void => {
        reply.raw.write(`event: stacktest-event\n`);
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      const eventsPath = path.join(runsDir, request.params.runId, "events.jsonl");
      const initialEvents = options.mock
        ? mockRuns.find((candidate) => candidate.runId === request.params.runId)?.events || []
        : readEventsFile(eventsPath);
      initialEvents.forEach(send);

      if (options.mock) {
        const timer = setTimeout(() => {
          send({
            schemaVersion: "1.0",
            eventId: "evt-live-mock",
            runId: request.params.runId,
            timestamp: "2026-06-06T23:04:40.000Z",
            type: "deployment_event",
            status: "CREATE_COMPLETE",
            message: "Mock live event completed",
          });
        }, 250);
        request.raw.on("close", () => clearTimeout(timer));
        return reply;
      }

      let offset = fs.existsSync(eventsPath) ? fs.statSync(eventsPath).size : 0;
      let buffer = "";
      const watcher = chokidar.watch(eventsPath, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 75, pollInterval: 25 },
      });
      watcher.on("change", () => {
        if (!fs.existsSync(eventsPath)) return;
        const stat = fs.statSync(eventsPath);
        if (stat.size < offset) offset = 0;
        const stream = fs.createReadStream(eventsPath, { start: offset, end: stat.size });
        offset = stat.size;
        stream.on("data", (chunk) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              send(JSON.parse(line));
            } catch {
              buffer = `${line}\n${buffer}`;
            }
          }
        });
      });
      request.raw.on("close", () => void watcher.close());
      return reply;
    },
  );

  app.get<{ Params: { runId: string } }>("/api/runs/:runId/artifacts", async (request, reply) => {
    if (options.mock) {
      const run = mockRuns.find((candidate) => candidate.runId === request.params.runId);
      if (!run) return reply.code(404).send({ error: "Run not found" });
      return run.artifactFiles;
    }
    return readRunDetail(runsDir, request.params.runId).artifactFiles;
  });

  app.get<{ Params: { runId: string }; Querystring: { path?: string } }>(
    "/api/runs/:runId/artifacts/file",
    async (request, reply) => {
      const artifactPath = request.query.path || "";
      if (options.mock) {
        return reply
          .type(artifactPath.endsWith(".json") ? "application/json" : "text/plain")
          .send(getMockFile(artifactPath));
      }
      try {
        const runDir = path.join(runsDir, request.params.runId);
        const filePath = resolveArtifactPath(runDir, artifactPath);
        return reply.type("text/plain; charset=utf-8").send(fs.readFileSync(filePath, "utf8"));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.code(message.includes("escapes") ? 400 : 404).send({ error: message });
      }
    },
  );

  app.get("/api/settings", async () => readDashboardSettings(dataDir));
  app.put<{ Body: Record<string, unknown> }>("/api/settings", async (request) =>
    writeDashboardSettings(request.body, dataDir),
  );
  app.post("/api/actions/run", async (request, reply) =>
    reply.code(403).send({ error: "Dashboard run launcher is disabled in this release." }),
  );
  app.post("/api/actions/reveal", async (request, reply) =>
    reply.code(403).send({ error: "Reveal actions are disabled in this release." }),
  );

  app.get("/*", async (request, reply) => {
    const dist = webDistDir();
    const requestPath = request.url.split("?")[0] || "/";
    const candidate =
      requestPath === "/" ? path.join(dist, "index.html") : path.join(dist, requestPath);
    const resolved = path.resolve(candidate);
    const filePath =
      resolved.startsWith(dist) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()
        ? resolved
        : path.join(dist, "index.html");

    if (!fs.existsSync(filePath)) {
      return reply
        .type("text/html; charset=utf-8")
        .send(
          "<!doctype html><title>StackTest Dashboard</title><main>Dashboard assets have not been built.</main>",
        );
    }

    return reply.type(contentTypeFor(filePath)).send(fs.readFileSync(filePath));
  });

  return app;
}

export async function startDashboardServer(
  options: DashboardServerOptions = {},
): Promise<StartedDashboardServer> {
  const host = options.host || "127.0.0.1";
  const port = options.port || 3456;
  const app = createDashboardServer(options);
  await app.listen({ host, port });
  return {
    app,
    url: `http://${host}:${port}`,
    close: () => app.close(),
  };
}
