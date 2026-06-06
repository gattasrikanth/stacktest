import { VERSION, loadConfig, TestPlanner } from "@stacktest/core";

export function handleArgs(args: string[]): { exitCode: number; output: string } {
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

  return {
    exitCode: 1,
    output:
      "Usage:\n  stacktest --version | -v\n  stacktest lint [--config <path>]\n  stacktest plan [--config <path>] [--json]",
  };
}
