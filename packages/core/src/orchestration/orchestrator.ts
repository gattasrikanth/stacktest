import { type DeploymentPlan } from "../planner/planner.js";
import { type DeploymentResult } from "../providers/types.js";
import { ProviderRegistry } from "../providers/registry.js";
import { resolveParameters } from "../resolver/resolver.js";

export interface OrchestratorOptions {
  skipCleanup?: boolean;
  retainOnFailure?: boolean;
}

export class RunOrchestrator {
  constructor(private options: OrchestratorOptions = {}) {}

  async execute(plans: DeploymentPlan[]): Promise<DeploymentResult[]> {
    const results: DeploymentResult[] = [];

    for (const plan of plans) {
      const provider = ProviderRegistry.get(plan.providerName);

      const context = {
        projectName: plan.projectName,
        testName: plan.testName,
        providerName: plan.providerName,
        region: plan.region,
        runId: plan.runId,
      };

      const resolvedPlan: DeploymentPlan = {
        ...plan,
        parameters: resolveParameters(plan.parameters, context),
      };

      let deployResult: DeploymentResult;

      try {
        deployResult = await provider.deploy(resolvedPlan);
        deployResult.resolvedParameters =
          deployResult.resolvedParameters || resolvedPlan.parameters;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        deployResult = {
          success: false,
          status: "CREATE_FAILED",
          runId: plan.runId,
          deploymentName: plan.deploymentName,
          durationMs: 0,
          error,
          resolvedParameters: resolvedPlan.parameters,
        };
      }

      // Collect deployment events for reporting
      try {
        deployResult.events = await provider.getEvents(resolvedPlan);
      } catch {
        // Ignore errors when fetching events
      }

      results.push(deployResult);

      if (!this.options.skipCleanup) {
        const skipDestroy = this.options.retainOnFailure && !deployResult.success;
        if (!skipDestroy) {
          try {
            await provider.destroy(resolvedPlan);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(`Failed to destroy deployment "${plan.deploymentName}":`, error.message);
          }
        } else {
          console.log(
            `[Retain-on-failure] Skipping cleanup for failed deployment: ${plan.deploymentName}`,
          );
        }
      }
    }

    return results;
  }
}
