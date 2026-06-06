import {
  VERSION,
  loadConfig,
  TestPlanner,
  RunOrchestrator,
  ProviderRegistry,
  ReportGenerator,
} from "@stack-test/core";
import { AwsCloudFormationProvider } from "@stack-test/provider-aws-cloudformation";
import { TerraformProvider } from "@stack-test/provider-terraform";
import { AwsCdkProvider } from "@stack-test/provider-aws-cdk";
import { KubernetesProvider } from "@stack-test/provider-kubernetes";
import { AzureBicepProvider } from "@stack-test/provider-azure-bicep";
import { PulumiProvider } from "@stack-test/provider-pulumi";
import { spawn } from "child_process";

// Auto-register default providers for CLI executions
ProviderRegistry.register(new AwsCloudFormationProvider());
ProviderRegistry.register(new TerraformProvider());
ProviderRegistry.register(new AwsCdkProvider());
ProviderRegistry.register(new KubernetesProvider());
ProviderRegistry.register(new AzureBicepProvider());
ProviderRegistry.register(new PulumiProvider());

export type CliResult = { exitCode: number; output: string; keepAlive?: boolean };

function readOption(args: string[], longName: string, shortName?: string): string | undefined {
  const idx = args.findIndex((arg) => arg === longName || (shortName ? arg === shortName : false));
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

function openBrowser(url: string): void {
  const opener =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(opener, args, { detached: true, stdio: "ignore" });
  child.unref();
}

export function handleArgs(args: string[]): CliResult | Promise<CliResult> {
  if (args.includes("--version") || args.includes("-v")) {
    return { exitCode: 0, output: `StackTest version ${VERSION}` };
  }

  const command = args[0];

  if (command === "dashboard") {
    const port = Number(readOption(args, "--port") || "3456");
    const host = readOption(args, "--host") || "127.0.0.1";
    const dataDir = readOption(args, "--dir") || ".stacktest";
    const runsDir = readOption(args, "--runs-dir");
    const shouldOpen = args.includes("--no-open") ? false : args.includes("--open") || true;
    const mock = args.includes("--mock");
    const enableActions = args.includes("--enable-actions");

    return (async () => {
      try {
        const { startDashboardServer } = await import("@stack-test/dashboard");
        const server = await startDashboardServer({
          dataDir,
          runsDir,
          host,
          port,
          open: shouldOpen,
          mock,
          enableActions,
        });
        if (shouldOpen) {
          openBrowser(server.url);
        }
        return {
          exitCode: 0,
          keepAlive: true,
          output: [
            `StackTest dashboard running at ${server.url}`,
            `Reading runs from ${runsDir || `${dataDir}/runs`}`,
            mock ? "Serving deterministic mock dashboard data." : "",
            enableActions ? "Run launcher is parsed but disabled in this release." : "",
          ]
            .filter(Boolean)
            .join("\n"),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const hint = message.includes("EADDRINUSE")
          ? `\nPort ${port} is already in use. Try: stacktest dashboard --port ${port + 1}`
          : "";
        return {
          exitCode: 1,
          output: `✗ Dashboard failed to start:\n${message}${hint}`,
        };
      }
    })();
  }

  if (command === "lint") {
    const configPath =
      readOption(args, "--config", "-c") || (args[1]?.startsWith("-") ? undefined : args[1]);

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
    const configPath =
      readOption(args, "--config", "-c") || (args[1]?.startsWith("-") ? undefined : args[1]);

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
    const configPath =
      readOption(args, "--config", "-c") || (args[1]?.startsWith("-") ? undefined : args[1]);

    const providerOverride = readOption(args, "--provider", "-p");

    const skipCleanup = args.includes("--skip-cleanup");
    const retainOnFailure = args.includes("--retain-on-failure");
    const dashboard = args.includes("--dashboard");
    const dashboardPort = Number(readOption(args, "--dashboard-port") || "3456");

    let concurrency: number | undefined;
    const concurrencyIdx = args.findIndex((arg) => arg === "--concurrency");
    if (concurrencyIdx !== -1 && concurrencyIdx + 1 < args.length) {
      const parsed = parseInt(args[concurrencyIdx + 1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        concurrency = parsed;
      }
    }

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

      const orchestrator = new RunOrchestrator({ skipCleanup, retainOnFailure, concurrency });

      const runId = plans.length > 0 ? plans[0].runId : "N/A";
      const start = Date.now();
      let dashboardStarted = false;

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

        if (dashboard && plans.length > 0) {
          const dashboardUrl = `http://127.0.0.1:${dashboardPort}/runs/${encodeURIComponent(runId)}`;
          try {
            const { startDashboardServer } = await import("@stack-test/dashboard");
            await startDashboardServer({
              host: "127.0.0.1",
              port: dashboardPort,
              open: true,
            });
            dashboardStarted = true;
            openBrowser(dashboardUrl);
            lines.push(`\nDashboard: ${dashboardUrl}`);
          } catch (dashboardErr) {
            const dashboardMsg =
              dashboardErr instanceof Error ? dashboardErr.message : String(dashboardErr);
            lines.push(`\nDashboard URL: ${dashboardUrl}`);
            lines.push(`Warning: Dashboard server was not started: ${dashboardMsg}`);
          }
        }

        const exitCode = failedCount > 0 ? 1 : 0;

        return {
          exitCode,
          keepAlive: dashboardStarted,
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
      "Usage:\n  stacktest --version | -v\n  stacktest lint [--config <path>]\n  stacktest plan [--config <path>] [--json]\n  stacktest run [--config <path>] [--provider <name>] [--skip-cleanup] [--retain-on-failure] [--concurrency <num>] [--dashboard] [--dashboard-port <num>]\n  stacktest dashboard [--dir <path>] [--runs-dir <path>] [--port <num>] [--host <addr>] [--open | --no-open] [--mock] [--enable-actions]",
  };
}
