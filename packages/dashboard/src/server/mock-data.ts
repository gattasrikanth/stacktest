import {
  type ArtifactTreeNode,
  type DashboardRunDetail,
  type DashboardRunEvent,
  type DashboardRunListItem,
} from "@stack-test/core";

const artifacts: ArtifactTreeNode[] = [
  { name: "manifest.json", path: "manifest.json", type: "file", size: 410 },
  { name: "summary.json", path: "summary.json", type: "file", size: 720 },
  { name: "events.jsonl", path: "events.jsonl", type: "file", size: 1480 },
  { name: "report.html", path: "report.html", type: "file", size: 18400 },
  {
    name: "logs",
    path: "logs",
    type: "directory",
    children: [{ name: "deploy.log", path: "logs/deploy.log", type: "file", size: 2048 }],
  },
];

function event(
  runId: string,
  eventId: string,
  timestamp: string,
  status: string,
  message: string,
): DashboardRunEvent {
  return {
    schemaVersion: "1.0",
    eventId,
    runId,
    timestamp,
    type: "deployment_event",
    deploymentId: "sqs-queue",
    resourceLogicalId: status.includes("S3") ? "BucketPolicy" : "SandboxQueue",
    resourceType: status.includes("S3") ? "AWS::S3::BucketPolicy" : "AWS::SQS::Queue",
    status,
    message,
    durationSincePriorMs: 1200,
  };
}

export const mockRuns: DashboardRunDetail[] = [
  {
    runId: "st-20260606-6e0feb",
    scenarioName: "aws-basic-sandbox",
    provider: "aws-cloudformation",
    regions: ["us-east-1"],
    status: "PASSED",
    startedAt: "2026-06-06T22:50:27.000Z",
    endedAt: "2026-06-06T22:51:33.750Z",
    durationMs: 66750,
    totals: { tests: 1, passed: 1, failed: 0, skipped: 0 },
    runDir: ".stacktest/runs/st-20260606-6e0feb",
    isPartial: false,
    deployments: [
      {
        id: "sqs-queue",
        name: "sqs-queue",
        provider: "aws-cloudformation",
        region: "us-east-1",
        template: "examples/aws-cloudformation-basic/templates/sqs-queue.yaml",
        stackName: "st-aws-basic-sandbox-sqs-queue",
        parameters: { QueueName: "stacktest-demo-queue" },
        status: "CREATE_COMPLETE",
        durationMs: 66750,
        success: true,
        resourceCount: 3,
      },
    ],
    events: [
      event("st-20260606-6e0feb", "evt-001", "2026-06-06T22:50:29.000Z", "CREATE_IN_PROGRESS", "Resource creation started"),
      event("st-20260606-6e0feb", "evt-002", "2026-06-06T22:51:32.000Z", "CREATE_COMPLETE", "Resource creation complete"),
    ],
    artifactFiles: artifacts,
  },
  {
    runId: "st-20260606-8f9db5",
    scenarioName: "s3-policy-hardening",
    provider: "aws-cloudformation",
    regions: ["us-west-2"],
    status: "FAILED",
    startedAt: "2026-06-06T21:14:10.000Z",
    endedAt: "2026-06-06T21:15:02.000Z",
    durationMs: 52000,
    totals: { tests: 1, passed: 0, failed: 1, skipped: 0 },
    runDir: ".stacktest/runs/st-20260606-8f9db5",
    isPartial: false,
    deployments: [
      {
        id: "bucket-policy",
        name: "bucket-policy",
        provider: "aws-cloudformation",
        region: "us-west-2",
        template: "examples/aws-cloudformation-basic/templates/s3-policy.yaml",
        stackName: "st-s3-policy-hardening-bucket-policy",
        parameters: { AccountId: "123456789012" },
        status: "CREATE_FAILED",
        durationMs: 52000,
        success: false,
        error: "Bucket policy blocks required StackTest validation principal.",
        resourceCount: 4,
      },
    ],
    events: [
      event("st-20260606-8f9db5", "evt-001", "2026-06-06T21:14:12.000Z", "CREATE_IN_PROGRESS", "S3 policy creation started"),
      event("st-20260606-8f9db5", "evt-002", "2026-06-06T21:14:59.000Z", "CREATE_FAILED", "Bucket policy validation failed"),
    ],
    artifactFiles: artifacts,
  },
  {
    runId: "st-20260606-live01",
    scenarioName: "multi-region-network",
    provider: "aws-cloudformation",
    regions: ["us-east-1", "us-west-2"],
    status: "RUNNING",
    startedAt: "2026-06-06T23:04:00.000Z",
    durationMs: 0,
    totals: { tests: 2, passed: 1, failed: 0, skipped: 0 },
    runDir: ".stacktest/runs/st-20260606-live01",
    isPartial: false,
    deployments: [
      {
        id: "vpc-east",
        name: "vpc-east",
        provider: "aws-cloudformation",
        region: "us-east-1",
        status: "CREATE_COMPLETE",
        durationMs: 33000,
        success: true,
      },
      {
        id: "vpc-west",
        name: "vpc-west",
        provider: "aws-cloudformation",
        region: "us-west-2",
        status: "CREATE_IN_PROGRESS",
        durationMs: 0,
      },
    ],
    events: [
      event("st-20260606-live01", "evt-001", "2026-06-06T23:04:04.000Z", "CREATE_IN_PROGRESS", "West region VPC creation started"),
    ],
    artifactFiles: artifacts,
  },
  {
    runId: "st-20260605-333e11",
    scenarioName: "cleanup-verification",
    provider: "aws-cloudformation",
    regions: ["us-east-2"],
    status: "PASSED",
    startedAt: "2026-06-05T18:22:00.000Z",
    endedAt: "2026-06-05T18:22:24.000Z",
    durationMs: 24000,
    totals: { tests: 1, passed: 1, failed: 0, skipped: 0 },
    runDir: ".stacktest/runs/st-20260605-333e11",
    isPartial: false,
    deployments: [
      {
        id: "cleanup",
        name: "cleanup",
        provider: "aws-cloudformation",
        region: "us-east-2",
        status: "DELETE_COMPLETE",
        durationMs: 24000,
        success: true,
      },
    ],
    events: [
      event("st-20260605-333e11", "evt-001", "2026-06-05T18:22:04.000Z", "DELETE_IN_PROGRESS", "Cleanup started"),
      event("st-20260605-333e11", "evt-002", "2026-06-05T18:22:24.000Z", "DELETE_COMPLETE", "Cleanup completed"),
    ],
    artifactFiles: artifacts,
  },
];

export function mockRunList(): DashboardRunListItem[] {
  return mockRuns.map((run) => ({
    runId: run.runId,
    scenarioName: run.scenarioName,
    provider: run.provider,
    regions: run.regions,
    status: run.status,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    durationMs: run.durationMs,
    totals: run.totals,
    runDir: run.runDir,
    isPartial: run.isPartial,
  }));
}

export function getMockFile(filePath: string): string {
  if (filePath.endsWith(".json")) {
    return JSON.stringify({ mock: true, filePath, generatedAt: "2026-06-06T00:00:00.000Z" }, null, 2);
  }
  return "StackTest mock artifact log\nCREATE_IN_PROGRESS SandboxQueue\nCREATE_COMPLETE SandboxQueue\n";
}
