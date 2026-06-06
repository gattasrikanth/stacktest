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

    // Group plans by: `${runId}-${testName}-${region}`
    const groups: Map<string, DeploymentPlan[]> = new Map();
    for (const plan of plans) {
      const key = `${plan.runId}-${plan.testName}-${plan.region}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(plan);
    }

    // Process each group
    for (const [, groupPlans] of groups.entries()) {
      const stageOutputs: Record<string, Record<string, unknown>> = {};
      const deployedPlans: { plan: DeploymentPlan; result: DeploymentResult }[] = [];
      let groupFailed = false;

      // Deploy phase
      for (const plan of groupPlans) {
        if (groupFailed) {
          results.push({
            success: false,
            status: "SKIPPED",
            runId: plan.runId,
            deploymentName: plan.deploymentName,
            durationMs: 0,
            error: new Error(`Skipped because a previous stage failed.`),
          });
          continue;
        }

        const provider = ProviderRegistry.get(plan.providerName);

        const context = {
          projectName: plan.projectName,
          testName: plan.testName,
          providerName: plan.providerName,
          region: plan.region,
          runId: plan.runId,
          stageOutputs,
        };

        let resolvedPlan: DeploymentPlan;
        try {
          resolvedPlan = {
            ...plan,
            parameters: resolveParameters(plan.parameters, context),
          };
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          const deployResult = {
            success: false,
            status: "RESOLVE_FAILED",
            runId: plan.runId,
            deploymentName: plan.deploymentName,
            durationMs: 0,
            error,
          };
          results.push(deployResult);
          groupFailed = true;
          continue;
        }

        let deployResult: DeploymentResult;
        const start = Date.now();
        try {
          deployResult = await provider.deploy(resolvedPlan);
          deployResult.resolvedParameters =
            deployResult.resolvedParameters || resolvedPlan.parameters;
          deployResult.durationMs = Date.now() - start;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          deployResult = {
            success: false,
            status: "CREATE_FAILED",
            runId: plan.runId,
            deploymentName: plan.deploymentName,
            durationMs: Date.now() - start,
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
        deployedPlans.push({ plan: resolvedPlan, result: deployResult });

        if (!deployResult.success) {
          groupFailed = true;
        } else if (plan.stageName && deployResult.outputs) {
          stageOutputs[plan.stageName] = deployResult.outputs;
        }
      }

      // Cleanup phase (in reverse order of deployed stages)
      if (!this.options.skipCleanup) {
        for (let i = deployedPlans.length - 1; i >= 0; i--) {
          const { plan, result } = deployedPlans[i];
          const provider = ProviderRegistry.get(plan.providerName);
          const skipDestroy = this.options.retainOnFailure && !result.success;

          if (!skipDestroy) {
            try {
              await provider.destroy(plan);
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
    }

    return results;
  }
}
