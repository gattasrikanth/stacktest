import {
  type DeploymentProvider,
  type DeploymentResult,
  type DeploymentEvent,
  type DeploymentPlan,
} from "@stacktest/core";

export class PulumiProvider implements DeploymentProvider {
  readonly name = "pulumi";

  async deploy(_plan: DeploymentPlan): Promise<DeploymentResult> {
    throw new Error("Not implemented");
  }

  async destroy(_plan: DeploymentPlan): Promise<DeploymentResult> {
    throw new Error("Not implemented");
  }

  async getEvents(_plan: DeploymentPlan): Promise<DeploymentEvent[]> {
    return [];
  }
}
