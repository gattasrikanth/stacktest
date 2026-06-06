import * as fs from "fs";
import * as path from "path";
import { type DeploymentPlan } from "../planner/planner.js";
import { type DeploymentResult } from "../providers/types.js";
import {
  type ArtifactTreeNode,
  type DashboardDeploymentSummary,
  type DashboardRunDetail,
  type DashboardRunEvent,
  type DashboardRunListItem,
  type DashboardRunStatus,
  type RunManifest,
  type RunSummary,
} from "./types.js";
import { readEventsFile } from "./run-events.js";

export interface WriteNormalizedRunArtifactsOptions {
  projectName: string;
  runId: string;
  plans: DeploymentPlan[];
  results: DeploymentResult[];
  startedAt?: string;
  endedAt?: string;
}

function readJsonFile<T>(filePath: string): T | undefined {
  try {
    if (!fs.existsSync(filePath)) {
      return undefined;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return undefined;
  }
}

function writeJsonFile(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function deriveDashboardStatus(results: DeploymentResult[]): DashboardRunStatus {
  if (results.length === 0) {
    return "UNKNOWN";
  }
  return results.some((result) => !result.success) ? "FAILED" : "PASSED";
}

export function createRunSummary(
  runId: string,
  plans: DeploymentPlan[],
  results: DeploymentResult[],
): RunSummary {
  const deployments: DashboardDeploymentSummary[] = results.map((result) => {
    const plan = plans.find((candidate) => candidate.deploymentName === result.deploymentName);
    return {
      id: result.deploymentName,
      name: plan?.testName || result.deploymentName,
      provider: plan?.providerName || "unknown",
      region: plan?.region || "unknown",
      template: plan?.template,
      stackName: result.deploymentName,
      parameters: result.resolvedParameters || plan?.parameters,
      status: result.status,
      durationMs: result.durationMs,
      success: result.success,
      error: result.error?.message,
      resourceCount: result.events?.length,
    };
  });

  const passed = results.filter((result) => result.success).length;
  const failed = results.filter((result) => !result.success).length;
  const skipped = results.filter((result) => result.status === "SKIPPED").length;

  return {
    runId,
    status: deriveDashboardStatus(results),
    totals: {
      tests: results.length,
      passed,
      failed,
      skipped,
    },
    durationMs: results.reduce((sum, result) => sum + result.durationMs, 0),
    deployments,
  };
}

export function createRunEvents(
  runId: string,
  results: DeploymentResult[],
  startedAt: string,
  endedAt: string,
): DashboardRunEvent[] {
  const events: DashboardRunEvent[] = [
    {
      schemaVersion: "1.0",
      eventId: "evt-0001",
      runId,
      timestamp: startedAt,
      type: "run_started",
      message: "Run started",
    },
  ];

  let eventCounter = 2;
  let previousTimestamp = new Date(startedAt).getTime();

  for (const result of results) {
    for (const event of result.events || []) {
      const timestamp = event.timestamp.toISOString();
      const currentTimestamp = event.timestamp.getTime();
      events.push({
        schemaVersion: "1.0",
        eventId: `evt-${String(eventCounter).padStart(4, "0")}`,
        runId,
        timestamp,
        type: "deployment_event",
        deploymentId: result.deploymentName,
        resourceLogicalId: event.logicalResourceId,
        resourceType: event.resourceType,
        status: event.status,
        statusReason: event.statusReason,
        message: event.statusReason || event.status,
        durationSincePriorMs: Math.max(0, currentTimestamp - previousTimestamp),
      });
      previousTimestamp = currentTimestamp;
      eventCounter++;
    }
  }

  events.push({
    schemaVersion: "1.0",
    eventId: `evt-${String(eventCounter).padStart(4, "0")}`,
    runId,
    timestamp: endedAt,
    type: deriveDashboardStatus(results) === "FAILED" ? "run_failed" : "run_completed",
    status: deriveDashboardStatus(results),
    message: "Run completed",
    durationSincePriorMs: Math.max(0, new Date(endedAt).getTime() - previousTimestamp),
  });

  return events;
}

export function writeNormalizedRunArtifacts(
  runsRoot: string,
  options: WriteNormalizedRunArtifactsOptions,
): { manifestPath: string; summaryPath: string; eventsPath: string; deploymentsPath: string; assertionsPath: string } {
  const runDir = path.resolve(runsRoot, options.runId);
  fs.mkdirSync(runDir, { recursive: true });

  const endedAt = options.endedAt || new Date().toISOString();
  const startedAt =
    options.startedAt || new Date(new Date(endedAt).getTime() - options.results.reduce((sum, result) => sum + result.durationMs, 0)).toISOString();
  const summary = createRunSummary(options.runId, options.plans, options.results);
  const manifest: RunManifest = {
    schemaVersion: "1.0",
    runId: options.runId,
    scenarioName: options.projectName,
    status: summary.status,
    startedAt,
    endedAt,
    durationMs: summary.durationMs,
    provider: options.plans[0]?.providerName || summary.deployments[0]?.provider || "unknown",
    regions: Array.from(new Set(options.plans.map((plan) => plan.region))),
    summaryPath: "summary.json",
    eventsPath: "events.jsonl",
    deploymentsPath: "deployments.json",
    assertionsPath: "assertions.json",
  };

  const events = createRunEvents(options.runId, options.results, startedAt, endedAt);
  const manifestPath = path.join(runDir, "manifest.json");
  const summaryPath = path.join(runDir, "summary.json");
  const eventsPath = path.join(runDir, "events.jsonl");
  const deploymentsPath = path.join(runDir, "deployments.json");
  const assertionsPath = path.join(runDir, "assertions.json");

  writeJsonFile(manifestPath, manifest);
  writeJsonFile(summaryPath, summary);
  fs.writeFileSync(eventsPath, events.map((event) => JSON.stringify(event)).join("\n") + "\n", "utf8");
  writeJsonFile(deploymentsPath, summary.deployments);
  writeJsonFile(assertionsPath, []);

  return { manifestPath, summaryPath, eventsPath, deploymentsPath, assertionsPath };
}

function inferStatusFromReport(report: { summary?: { failed?: number } } | undefined): DashboardRunStatus {
  if (!report?.summary) {
    return "UNKNOWN";
  }
  return (report.summary.failed || 0) > 0 ? "FAILED" : "PASSED";
}

function normalizeReportDeployment(deployment: {
  testName?: string;
  provider?: string;
  region?: string;
  deploymentName?: string;
  template?: string;
  parameters?: Record<string, unknown>;
  success?: boolean;
  status?: string;
  durationMs?: number;
  error?: string;
  events?: unknown[];
}): DashboardDeploymentSummary {
  return {
    id: deployment.deploymentName || deployment.testName || "unknown",
    name: deployment.testName || deployment.deploymentName || "unknown",
    provider: deployment.provider || "unknown",
    region: deployment.region || "unknown",
    template: deployment.template,
    stackName: deployment.deploymentName,
    parameters: deployment.parameters,
    success: deployment.success,
    status: deployment.status || "UNKNOWN",
    durationMs: deployment.durationMs || 0,
    error: deployment.error,
    resourceCount: deployment.events?.length,
  };
}

function createListItemFromDetail(detail: DashboardRunDetail): DashboardRunListItem {
  return {
    runId: detail.runId,
    scenarioName: detail.scenarioName,
    provider: detail.provider,
    regions: detail.regions,
    status: detail.status,
    startedAt: detail.startedAt,
    endedAt: detail.endedAt,
    durationMs: detail.durationMs,
    totals: detail.totals,
    runDir: detail.runDir,
    isPartial: detail.isPartial,
  };
}

export function listRuns(runsRoot: string): DashboardRunListItem[] {
  const root = path.resolve(runsRoot);
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readRunDetail(root, entry.name))
    .map(createListItemFromDetail)
    .sort((a, b) => {
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bTime - aTime || b.runId.localeCompare(a.runId);
    });
}

export function readRunDetail(runsRoot: string, runId: string): DashboardRunDetail {
  const root = path.resolve(runsRoot);
  const runDir = path.resolve(root, runId);
  const safeRoot = `${root}${path.sep}`;
  if (runDir !== root && !runDir.startsWith(safeRoot)) {
    throw new Error("Run path escapes runs directory.");
  }

  const manifest = readJsonFile<RunManifest>(path.join(runDir, "manifest.json"));
  const summary = readJsonFile<RunSummary>(path.join(runDir, manifest?.summaryPath || "summary.json"));
  const report = readJsonFile<{
    projectName?: string;
    runId?: string;
    timestamp?: string;
    summary?: { total?: number; passed?: number; failed?: number; durationMs?: number };
    deployments?: Array<Parameters<typeof normalizeReportDeployment>[0]>;
  }>(path.join(runDir, "report.json"));
  const events = readEventsFile(path.join(runDir, manifest?.eventsPath || "events.jsonl"));

  const deployments =
    summary?.deployments || report?.deployments?.map((deployment) => normalizeReportDeployment(deployment)) || [];
  const status = manifest?.status || summary?.status || inferStatusFromReport(report);
  const totals = summary?.totals || {
    tests: report?.summary?.total || deployments.length,
    passed: report?.summary?.passed || deployments.filter((deployment) => deployment.success).length,
    failed: report?.summary?.failed || deployments.filter((deployment) => deployment.success === false).length,
    skipped: deployments.filter((deployment) => deployment.status === "SKIPPED").length,
  };

  return {
    runId: manifest?.runId || report?.runId || runId,
    scenarioName: manifest?.scenarioName || report?.projectName || "unknown",
    provider: manifest?.provider || deployments[0]?.provider || "unknown",
    regions: manifest?.regions || Array.from(new Set(deployments.map((deployment) => deployment.region).filter(Boolean))),
    status,
    startedAt: manifest?.startedAt || report?.timestamp,
    endedAt: manifest?.endedAt,
    durationMs: manifest?.durationMs || summary?.durationMs || report?.summary?.durationMs || 0,
    totals,
    runDir,
    isPartial: !manifest || !summary,
    summary,
    manifest,
    deployments,
    events,
    rawJson: report,
    artifactFiles: buildArtifactTree(runDir),
  };
}

export function resolveArtifactPath(runDir: string, relativePath: string): string {
  const root = path.resolve(runDir);
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Artifact path escapes run directory.");
  }
  if (!fs.existsSync(resolved)) {
    throw new Error("Artifact does not exist.");
  }
  if (!fs.statSync(resolved).isFile()) {
    throw new Error("Artifact path is not a file.");
  }
  return resolved;
}

export function buildArtifactTree(runDir: string): ArtifactTreeNode[] {
  const root = path.resolve(runDir);
  if (!fs.existsSync(root)) {
    return [];
  }

  function walk(currentDir: string, relativeBase = ""): ArtifactTreeNode[] {
    return fs
      .readdirSync(currentDir, { withFileTypes: true })
      .filter((entry) => entry.name !== ".DS_Store")
      .map((entry) => {
        const absolutePath = path.join(currentDir, entry.name);
        const relativePath = path.join(relativeBase, entry.name);
        if (entry.isDirectory()) {
          return {
            name: entry.name,
            path: relativePath,
            type: "directory" as const,
            children: walk(absolutePath, relativePath),
          };
        }
        return {
          name: entry.name,
          path: relativePath,
          type: "file" as const,
          size: fs.statSync(absolutePath).size,
        };
      })
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "directory" ? -1 : 1));
  }

  return walk(root);
}
