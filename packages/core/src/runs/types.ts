export type DashboardRunStatus = "PASSED" | "FAILED" | "RUNNING" | "CANCELLED" | "UNKNOWN";

export interface RunManifest {
  schemaVersion: "1.0";
  runId: string;
  scenarioName: string;
  status: DashboardRunStatus;
  startedAt: string;
  endedAt?: string;
  durationMs: number;
  provider: string;
  regions: string[];
  summaryPath: string;
  eventsPath: string;
  deploymentsPath: string;
  assertionsPath: string;
}

export interface RunSummary {
  runId: string;
  status: DashboardRunStatus;
  totals: {
    tests: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  durationMs: number;
  deployments: DashboardDeploymentSummary[];
}

export interface DashboardDeploymentSummary {
  id: string;
  name: string;
  provider: string;
  region: string;
  template?: string;
  stackName?: string;
  parameters?: Record<string, unknown>;
  status: string;
  durationMs: number;
  success?: boolean;
  error?: string;
  resourceCount?: number;
}

export interface DashboardRunEvent {
  schemaVersion: "1.0";
  eventId: string;
  runId: string;
  timestamp: string;
  type:
    | "run_started"
    | "run_config_loaded"
    | "deployment_started"
    | "deployment_event"
    | "assertion_started"
    | "assertion_passed"
    | "assertion_failed"
    | "cleanup_started"
    | "cleanup_event"
    | "cleanup_completed"
    | "run_failed"
    | "run_completed"
    | "warning"
    | "log";
  message?: string;
  status?: string;
  deploymentId?: string;
  resourceLogicalId?: string;
  resourceType?: string;
  statusReason?: string;
  durationSincePriorMs?: number;
}

export interface DashboardRunListItem {
  runId: string;
  scenarioName: string;
  provider: string;
  regions: string[];
  status: DashboardRunStatus;
  startedAt?: string;
  endedAt?: string;
  durationMs: number;
  totals: RunSummary["totals"];
  runDir: string;
  isPartial: boolean;
}

export interface DashboardRunDetail extends DashboardRunListItem {
  summary?: RunSummary;
  manifest?: RunManifest;
  deployments: DashboardDeploymentSummary[];
  events: DashboardRunEvent[];
  rawJson?: unknown;
  artifactFiles: ArtifactTreeNode[];
}

export interface ArtifactTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: ArtifactTreeNode[];
}

export interface DashboardSettings {
  port: number;
  runsDir: string;
  autoOpen: boolean;
  theme: "system" | "light" | "dark";
  retentionWarningThreshold: number;
  enableExperimentalLauncher: boolean;
}
