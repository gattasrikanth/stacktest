import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import {
  type DeploymentProvider,
  type DeploymentResult,
  type DeploymentEvent,
  type DeploymentPlan,
} from "@stacktest/core";

const execAsync = promisify(exec);

export function generateSafeStackName(runId: string, testName: string): string {
  const sanitize = (val: string) => val.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const raw = `st-${sanitize(runId)}-${sanitize(testName)}`;
  if (raw.length > 100) {
    return raw.slice(0, 100);
  }
  return raw;
}

interface PulumiState {
  deployment?: {
    resources?: Array<{
      type: string;
      urn: string;
      id?: string;
    }>;
  };
}

async function fetchPulumiEvents(projectDir: string, stackName: string): Promise<DeploymentEvent[]> {
  try {
    const { stdout } = await execAsync(
      `pulumi stack export --stack "${stackName}" --cwd "${projectDir}"`,
    );
    const parsed: PulumiState = JSON.parse(stdout);
    const resources = parsed.deployment?.resources || [];
    return resources.map((res) => {
      const urnParts = res.urn.split("::");
      const logicalResourceId = urnParts[urnParts.length - 1] || res.id || "resource";
      return {
        timestamp: new Date(),
        resourceType: res.type,
        logicalResourceId,
        status: "ACTIVE",
      };
    });
  } catch {
    return [];
  }
}

export class PulumiProvider implements DeploymentProvider {
  readonly name = "pulumi";

  async deploy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const stackName = generateSafeStackName(plan.runId, plan.testName);

    try {
      // 1. Verify Pulumi CLI is installed
      try {
        await execAsync("pulumi version");
      } catch {
        throw new Error("Pulumi CLI is not installed or not available in the system PATH.");
      }

      let projectDir = path.resolve(process.cwd(), plan.template);
      const stat = await fs.promises.stat(projectDir).catch(() => null);
      if (stat && stat.isFile()) {
        projectDir = path.dirname(projectDir);
      }

      if (!fs.existsSync(projectDir)) {
        throw new Error(`Pulumi project directory does not exist: ${projectDir}`);
      }

      // 2. Initialize local login (local filesystem storage)
      await execAsync("pulumi login --local");

      // 3. Create or select stack
      await execAsync(`pulumi stack select --create "${stackName}" --cwd "${projectDir}"`);

      // 4. Set parameters as configuration keys
      for (const [key, value] of Object.entries(plan.parameters)) {
        const valStr = typeof value === "object" ? JSON.stringify(value) : String(value);
        await execAsync(`pulumi config set "${key}" "${valStr}" --cwd "${projectDir}"`);
      }

      // 5. Deploy stack
      await execAsync(`pulumi up --yes --skip-preview --cwd "${projectDir}"`);

      // 6. Query stack state for events
      const events = await fetchPulumiEvents(projectDir, stackName);

      return {
        success: true,
        status: "ACTIVE",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        events,
        resolvedParameters: plan.parameters,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      let projectDir = path.resolve(process.cwd(), plan.template);
      const stat = await fs.promises.stat(projectDir).catch(() => null);
      if (stat && stat.isFile()) {
        projectDir = path.dirname(projectDir);
      }
      const events = fs.existsSync(projectDir) ? await fetchPulumiEvents(projectDir, stackName) : [];

      return {
        success: false,
        status: "FAILED",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        error,
        events,
        resolvedParameters: plan.parameters,
      };
    }
  }

  async destroy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const stackName = generateSafeStackName(plan.runId, plan.testName);

    try {
      let projectDir = path.resolve(process.cwd(), plan.template);
      const stat = await fs.promises.stat(projectDir).catch(() => null);
      if (stat && stat.isFile()) {
        projectDir = path.dirname(projectDir);
      }

      if (!fs.existsSync(projectDir)) {
        throw new Error(`Pulumi project directory does not exist: ${projectDir}`);
      }

      // 1. Initialize local login
      await execAsync("pulumi login --local");

      // 2. Select stack
      await execAsync(`pulumi stack select "${stackName}" --cwd "${projectDir}"`);

      // 3. Destroy infrastructure
      await execAsync(`pulumi destroy --yes --cwd "${projectDir}"`);

      // 4. Delete the stack record
      await execAsync(`pulumi stack rm --yes "${stackName}" --cwd "${projectDir}"`);

      return {
        success: true,
        status: "TERMINATED",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return {
        success: false,
        status: "DELETE_FAILED",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        error,
      };
    }
  }

  async getEvents(plan: DeploymentPlan): Promise<DeploymentEvent[]> {
    let projectDir = path.resolve(process.cwd(), plan.template);
    const stat = await fs.promises.stat(projectDir).catch(() => null);
    if (stat && stat.isFile()) {
      projectDir = path.dirname(projectDir);
    }
    const stackName = generateSafeStackName(plan.runId, plan.testName);
    return fetchPulumiEvents(projectDir, stackName);
  }
}
