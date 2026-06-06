import { type DeploymentProvider, type DeploymentResult, type DeploymentEvent } from "./types.js";
import { type DeploymentPlan } from "../planner/planner.js";

export class FakeProvider implements DeploymentProvider {
  readonly name = "fake";

  async deploy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const delay = plan.parameters.SimulateDelay ? Number(plan.parameters.SimulateDelay) : 50;

    await new Promise((resolve) => setTimeout(resolve, delay));

    const durationMs = Date.now() - start;

    if (plan.parameters.SimulateFailure === true || plan.parameters.SimulateFailure === "true") {
      const rollbackDelay = plan.parameters.SimulateRollbackDelay
        ? Number(plan.parameters.SimulateRollbackDelay)
        : 20;
      await new Promise((resolve) => setTimeout(resolve, rollbackDelay));

      return {
        success: false,
        status: "ROLLBACK_COMPLETE",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: durationMs + rollbackDelay,
        error: new Error(`Simulated deployment failure for stack: ${plan.deploymentName}`),
      };
    }

    return {
      success: true,
      status: "CREATE_COMPLETE",
      runId: plan.runId,
      deploymentName: plan.deploymentName,
      durationMs,
    };
  }

  async destroy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const delay = plan.parameters.SimulateDelay ? Number(plan.parameters.SimulateDelay) : 20;

    await new Promise((resolve) => setTimeout(resolve, delay));

    const durationMs = Date.now() - start;

    return {
      success: true,
      status: "DELETE_COMPLETE",
      runId: plan.runId,
      deploymentName: plan.deploymentName,
      durationMs,
    };
  }

  async getEvents(plan: DeploymentPlan): Promise<DeploymentEvent[]> {
    const timestamp = new Date();

    const events: DeploymentEvent[] = [
      {
        timestamp,
        resourceType: "Fake::Resource::One",
        logicalResourceId: "FakeResourceOne",
        status: "CREATE_IN_PROGRESS",
      },
    ];

    if (plan.parameters.SimulateFailure === true || plan.parameters.SimulateFailure === "true") {
      events.push({
        timestamp: new Date(timestamp.getTime() + 10),
        resourceType: "Fake::Resource::One",
        logicalResourceId: "FakeResourceOne",
        status: "CREATE_FAILED",
        statusReason: "Simulated resource creation failed because of bad parameters.",
      });
    } else {
      events.push({
        timestamp: new Date(timestamp.getTime() + 10),
        resourceType: "Fake::Resource::One",
        logicalResourceId: "FakeResourceOne",
        status: "CREATE_COMPLETE",
      });
    }

    return events;
  }
}
