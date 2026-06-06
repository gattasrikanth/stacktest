import { type DeploymentPlan } from "../planner/planner.js";

export interface DeploymentEvent {
  timestamp: Date;
  resourceType: string;
  logicalResourceId: string;
  status: string;
  statusReason?: string;
}

export interface DeploymentResult {
  success: boolean;
  status: string;
  runId: string;
  deploymentName: string;
  durationMs: number;
  error?: Error;
  events?: DeploymentEvent[];
  resolvedParameters?: Record<string, unknown>;
}

export interface DeploymentProvider {
  name: string;
  deploy(plan: DeploymentPlan): Promise<DeploymentResult>;
  destroy(plan: DeploymentPlan): Promise<DeploymentResult>;
  getEvents(plan: DeploymentPlan): Promise<DeploymentEvent[]>;
}
