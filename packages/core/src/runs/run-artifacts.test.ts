import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  buildArtifactTree,
  listRuns,
  readRunDetail,
  resolveArtifactPath,
  writeNormalizedRunArtifacts,
} from "./run-artifacts.js";
import { parseEventsJsonl } from "./run-events.js";
import { readDashboardSettings, writeDashboardSettings } from "./settings.js";
import { type DeploymentPlan } from "../planner/planner.js";
import { type DeploymentResult } from "../providers/types.js";

const TEST_DIR = path.resolve(process.cwd(), "packages/core/src/runs/temp-runs-test");

const plans: DeploymentPlan[] = [
  {
    projectName: "dashboard-project",
    testName: "queue",
    providerName: "aws-cloudformation",
    region: "us-east-1",
    runId: "st-test-001",
    deploymentName: "dashboard-project-queue-us-east-1-st-test-001",
    template: "templates/queue.yaml",
    parameters: { Env: "test" },
  },
];

const results: DeploymentResult[] = [
  {
    success: true,
    status: "CREATE_COMPLETE",
    runId: "st-test-001",
    deploymentName: "dashboard-project-queue-us-east-1-st-test-001",
    durationMs: 1234,
    events: [
      {
        timestamp: new Date("2026-06-06T12:00:01.000Z"),
        resourceType: "AWS::SQS::Queue",
        logicalResourceId: "Queue",
        status: "CREATE_COMPLETE",
      },
    ],
  },
];

describe("run artifact utilities", () => {
  beforeEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("writes normalized dashboard files and reads them back", () => {
    writeNormalizedRunArtifacts(TEST_DIR, {
      projectName: "dashboard-project",
      runId: "st-test-001",
      plans,
      results,
      startedAt: "2026-06-06T12:00:00.000Z",
      endedAt: "2026-06-06T12:00:02.000Z",
    });

    const detail = readRunDetail(TEST_DIR, "st-test-001");

    expect(detail.runId).toBe("st-test-001");
    expect(detail.status).toBe("PASSED");
    expect(detail.totals.passed).toBe(1);
    expect(detail.deployments[0].provider).toBe("aws-cloudformation");
    expect(detail.events.map((event) => event.type)).toContain("deployment_event");
  });

  it("infers legacy run metadata from report.json", () => {
    const runDir = path.join(TEST_DIR, "st-legacy");
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(
      path.join(runDir, "report.json"),
      JSON.stringify({
        projectName: "legacy-project",
        runId: "st-legacy",
        timestamp: "2026-06-05T10:00:00.000Z",
        summary: { total: 1, passed: 0, failed: 1, durationMs: 99 },
        deployments: [
          {
            testName: "bucket-policy",
            provider: "aws-cloudformation",
            region: "us-west-2",
            deploymentName: "legacy-bucket",
            success: false,
            status: "CREATE_FAILED",
            durationMs: 99,
            error: "Policy failed",
          },
        ],
      }),
      "utf8",
    );

    const detail = readRunDetail(TEST_DIR, "st-legacy");

    expect(detail.isPartial).toBe(true);
    expect(detail.scenarioName).toBe("legacy-project");
    expect(detail.status).toBe("FAILED");
    expect(detail.deployments[0].error).toBe("Policy failed");
  });

  it("ignores partial and malformed JSONL records", () => {
    const events = parseEventsJsonl(
      '{"schemaVersion":"1.0","eventId":"evt-1","runId":"st","timestamp":"2026-06-06T00:00:00.000Z","type":"run_started"}\n{"partial":',
    );

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("run_started");
  });

  it("builds artifact trees and blocks path traversal", () => {
    const runDir = path.join(TEST_DIR, "st-artifacts");
    fs.mkdirSync(path.join(runDir, "logs"), { recursive: true });
    fs.writeFileSync(path.join(runDir, "logs", "run.log"), "ok", "utf8");

    const tree = buildArtifactTree(runDir);

    expect(tree[0].name).toBe("logs");
    expect(resolveArtifactPath(runDir, "logs/run.log")).toBe(path.join(runDir, "logs", "run.log"));
    expect(() => resolveArtifactPath(runDir, "../secret.txt")).toThrow(/escapes/);
  });

  it("lists runs newest first", () => {
    writeNormalizedRunArtifacts(TEST_DIR, {
      projectName: "old",
      runId: "st-old",
      plans: [{ ...plans[0], runId: "st-old" }],
      results: [{ ...results[0], runId: "st-old" }],
      startedAt: "2026-06-05T12:00:00.000Z",
      endedAt: "2026-06-05T12:00:01.000Z",
    });
    writeNormalizedRunArtifacts(TEST_DIR, {
      projectName: "new",
      runId: "st-new",
      plans: [{ ...plans[0], runId: "st-new" }],
      results: [{ ...results[0], runId: "st-new" }],
      startedAt: "2026-06-06T12:00:00.000Z",
      endedAt: "2026-06-06T12:00:01.000Z",
    });

    expect(listRuns(TEST_DIR).map((run) => run.runId)).toEqual(["st-new", "st-old"]);
  });

  it("persists dashboard settings", () => {
    const originalCwd = process.cwd;
    process.cwd = () => TEST_DIR;
    try {
      const settings = writeDashboardSettings({ port: 4567, theme: "dark" });

      expect(settings.port).toBe(4567);
      expect(readDashboardSettings().theme).toBe("dark");
    } finally {
      process.cwd = originalCwd;
    }
  });
});
