import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { createDashboardServer } from "./index.js";

const TEST_DIR = path.resolve(process.cwd(), "packages/dashboard/src/server/temp-dashboard-test");

describe("dashboard server", () => {
  beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(path.join(TEST_DIR, "runs", "st-one"), { recursive: true });
    fs.writeFileSync(
      path.join(TEST_DIR, "runs", "st-one", "report.json"),
      JSON.stringify({
        projectName: "server-test",
        runId: "st-one",
        summary: { total: 1, passed: 1, failed: 0, durationMs: 10 },
        deployments: [
          {
            testName: "basic",
            provider: "fake",
            region: "local",
            status: "CREATE_COMPLETE",
            success: true,
          },
        ],
      }),
      "utf8",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "runs", "st-one", "events.jsonl"),
      '{"schemaVersion":"1.0","eventId":"evt-1","runId":"st-one","timestamp":"2026-06-06T00:00:00.000Z","type":"run_started"}\n',
      "utf8",
    );
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("serves health and run list endpoints", async () => {
    const app = createDashboardServer({ dataDir: TEST_DIR, runsDir: path.join(TEST_DIR, "runs") });

    const health = await app.inject({ method: "GET", url: "/api/health" });
    const runs = await app.inject({ method: "GET", url: "/api/runs" });

    expect(health.statusCode).toBe(200);
    expect(JSON.parse(health.body).ok).toBe(true);
    expect(JSON.parse(runs.body)[0].runId).toBe("st-one");
  });

  it("returns run detail and events", async () => {
    const app = createDashboardServer({ runsDir: path.join(TEST_DIR, "runs") });

    const detail = await app.inject({ method: "GET", url: "/api/runs/st-one" });
    const events = await app.inject({ method: "GET", url: "/api/runs/st-one/events" });

    expect(detail.statusCode).toBe(200);
    expect(JSON.parse(detail.body).scenarioName).toBe("server-test");
    expect(JSON.parse(events.body)[0].type).toBe("run_started");
  });

  it("returns 404 for missing runs", async () => {
    const app = createDashboardServer({ runsDir: path.join(TEST_DIR, "runs") });

    const response = await app.inject({ method: "GET", url: "/api/runs/missing" });

    expect(response.statusCode).toBe(404);
  });

  it("blocks artifact path traversal", async () => {
    const app = createDashboardServer({ runsDir: path.join(TEST_DIR, "runs") });

    const response = await app.inject({
      method: "GET",
      url: "/api/runs/st-one/artifacts/file?path=../secret.txt",
    });

    expect(response.statusCode).toBe(400);
  });

  it("keeps actions disabled", async () => {
    const app = createDashboardServer({
      runsDir: path.join(TEST_DIR, "runs"),
      enableActions: true,
    });

    const response = await app.inject({ method: "POST", url: "/api/actions/run", payload: {} });

    expect(response.statusCode).toBe(403);
  });

  it("serves deterministic mock runs", async () => {
    const app = createDashboardServer({ mock: true });

    const response = await app.inject({ method: "GET", url: "/api/runs" });
    const runs = JSON.parse(response.body) as Array<{ runId: string }>;

    expect(runs.map((run) => run.runId)).toContain("st-20260606-live01");
  });
});
