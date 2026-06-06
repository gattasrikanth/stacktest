import {
  type DeploymentProvider,
  type DeploymentResult,
  type DeploymentEvent,
  type DeploymentPlan,
} from "@stacktest/core";

export class AwsCloudFormationProvider implements DeploymentProvider {
  readonly name = "aws-cloudformation";

  async deploy(plan: DeploymentPlan): Promise<DeploymentResult> {
    return {
      success: true,
      status: "CREATE_COMPLETE",
      runId: plan.runId,
      deploymentName: plan.deploymentName,
      durationMs: 0,
    };
  }

  async destroy(plan: DeploymentPlan): Promise<DeploymentResult> {
    return {
      success: true,
      status: "DELETE_COMPLETE",
      runId: plan.runId,
      deploymentName: plan.deploymentName,
      durationMs: 0,
    };
  }

  async getEvents(_plan: DeploymentPlan): Promise<DeploymentEvent[]> {
    return [];
  }
}
