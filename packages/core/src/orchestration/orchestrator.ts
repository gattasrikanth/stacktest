import { type DeploymentPlan } from "../planner/planner.js";
import { type DeploymentResult } from "../providers/types.js";
import { ProviderRegistry } from "../providers/registry.js";
import { resolveParameters } from "../resolver/resolver.js";

export interface OrchestratorOptions {
  skipCleanup?: boolean;
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
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        deployResult = {
          success: false,
          status: "CREATE_FAILED",
          runId: plan.runId,
          deploymentName: plan.deploymentName,
          durationMs: 0,
          error,
        };
      }

      results.push(deployResult);

      if (!this.options.skipCleanup) {
        try {
          await provider.destroy(resolvedPlan);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error(`Failed to destroy deployment "${plan.deploymentName}":`, error.message);
        }
      }
    }

    return results;
  }
}
