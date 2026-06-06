import {
  VERSION,
  loadConfig,
  TestPlanner,
  RunOrchestrator,
  ProviderRegistry,
  ReportGenerator,
} from "@stacktest/core";
import { AwsCloudFormationProvider } from "@stacktest/provider-aws-cloudformation";
import { TerraformProvider } from "@stacktest/provider-terraform";
import { AwsCdkProvider } from "@stacktest/provider-aws-cdk";

// Auto-register default providers for CLI executions
ProviderRegistry.register(new AwsCloudFormationProvider());
ProviderRegistry.register(new TerraformProvider());
ProviderRegistry.register(new AwsCdkProvider());

export function handleArgs(
  args: string[],
): { exitCode: number; output: string } | Promise<{ exitCode: number; output: string }> {
  if (args.includes("--version") || args.includes("-v")) {
    return { exitCode: 0, output: `StackTest version ${VERSION}` };
  }

  const command = args[0];

  if (command === "lint") {
    let configPath: string | undefined;
    const configIdx = args.findIndex((arg) => arg === "--config" || arg === "-c");
    if (configIdx !== -1 && configIdx + 1 < args.length) {
      configPath = args[configIdx + 1];
    }

    try {
      const result = loadConfig(configPath);
      return {
        exitCode: 0,
        output: `✓ Configuration at ${result.configPath} is valid.`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        exitCode: 1,
        output: `✗ Configuration validation failed:\n${message}`,
      };
    }
  }

  if (command === "plan") {
    let configPath: string | undefined;
    const configIdx = args.findIndex((arg) => arg === "--config" || arg === "-c");
    if (configIdx !== -1 && configIdx + 1 < args.length) {
      configPath = args[configIdx + 1];
    }

    const isJson = args.includes("--json");

    try {
      const result = loadConfig(configPath);
      const planner = new TestPlanner(result.config);
      const plans = planner.generatePlan();

      if (isJson) {
        return {
          exitCode: 0,
          output: JSON.stringify(plans, null, 2),
        };
      }

      const runId = plans.length > 0 ? plans[0].runId : "N/A";
      const lines = [
        `StackTest Plan for project "${result.config.project.name}" (run ID: ${runId})`,
        `Planned Deployments (${plans.length} total):`,
      ];

      for (const plan of plans) {
        lines.push(`  - Test: "${plan.testName}"`);
        lines.push(`    Provider:        ${plan.providerName}`);
        lines.push(`    Region:          ${plan.region}`);
        lines.push(`    Deployment Name: ${plan.deploymentName}`);
        lines.push(`    Template Path:   ${plan.template}`);
      }

      return {
        exitCode: 0,
        output: lines.join("\n"),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        exitCode: 1,
        output: `✗ Planning failed:\n${message}`,
      };
    }
  }

  if (command === "run") {
    let configPath: string | undefined;
    const configIdx = args.findIndex((arg) => arg === "--config" || arg === "-c");
    if (configIdx !== -1 && configIdx + 1 < args.length) {
      configPath = args[configIdx + 1];
    }

    let providerOverride: string | undefined;
    const providerIdx = args.findIndex((arg) => arg === "--provider" || arg === "-p");
    if (providerIdx !== -1 && providerIdx + 1 < args.length) {
      providerOverride = args[providerIdx + 1];
    }

    const skipCleanup = args.includes("--skip-cleanup");
    const retainOnFailure = args.includes("--retain-on-failure");

    try {
      const result = loadConfig(configPath);
      const planner = new TestPlanner(result.config);
      let plans = planner.generatePlan();

      if (providerOverride) {
        plans = plans.map((plan) => ({
          ...plan,
          providerName: providerOverride,
        }));
      }

      const orchestrator = new RunOrchestrator({ skipCleanup, retainOnFailure });

      const runId = plans.length > 0 ? plans[0].runId : "N/A";
      const start = Date.now();

      const lines = [
        `StackTest Run for project "${result.config.project.name}" (run ID: ${runId})`,
        `Running ${plans.length} planned deployments...\n`,
      ];

      return (async () => {
        const runResults = await orchestrator.execute(plans);

        let passedCount = 0;
        let failedCount = 0;

        for (const res of runResults) {
          const matchingPlan = plans.find((p) => p.deploymentName === res.deploymentName);
          const pName = matchingPlan?.providerName || "unknown";
          const reg = matchingPlan?.region || "unknown";
          const tName = matchingPlan?.testName || "unknown";

          if (res.success) {
            passedCount++;
            lines.push(`PASS  ${pName}  ${reg}  ${tName} (${res.durationMs}ms)`);
          } else {
            failedCount++;
            lines.push(`FAIL  ${pName}  ${reg}  ${tName} (${res.durationMs}ms)`);
            if (res.error) {
              lines.push(`  Error: ${res.error.message}`);
            }
          }
        }

        const totalTime = Date.now() - start;
        lines.push(
          `\nSummary: ${passedCount} passed, ${failedCount} failed, ${plans.length} total (${totalTime}ms)`,
        );

        if (plans.length > 0) {
          try {
            const reportPaths = await ReportGenerator.writeReports(
              result.config.project.name,
              runId,
              plans,
              runResults,
            );
            lines.push(`\nReports generated:`);
            lines.push(`  JSON:  ${reportPaths.jsonPath}`);
            lines.push(`  JUnit: ${reportPaths.junitPath}`);
            lines.push(`  HTML:  ${reportPaths.htmlPath}`);
          } catch (reportErr) {
            const reportMsg = reportErr instanceof Error ? reportErr.message : String(reportErr);
            lines.push(`\nWarning: Report generation failed: ${reportMsg}`);
          }
        }

        const exitCode = failedCount > 0 ? 1 : 0;

        return {
          exitCode,
          output: lines.join("\n"),
        };
      })();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        exitCode: 1,
        output: `✗ Run execution failed:\n${message}`,
      };
    }
  }

  return {
    exitCode: 1,
    output:
      "Usage:\n  stacktest --version | -v\n  stacktest lint [--config <path>]\n  stacktest plan [--config <path>] [--json]\n  stacktest run [--config <path>] [--provider <name>] [--skip-cleanup] [--retain-on-failure]",
  };
}
