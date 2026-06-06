import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import {
  type DeploymentProvider,
  type DeploymentResult,
  type DeploymentEvent,
  type DeploymentPlan,
} from "@stack-test/core";

const execAsync = promisify(exec);

function formatVariables(params: Record<string, string | number | boolean | null>): string[] {
  return Object.entries(params).map(([key, value]) => {
    const strValue = value === null ? "" : String(value);
    const escaped = strValue.replace(/"/g, '\\"');
    return `-var="${key}=${escaped}"`;
  });
}

function parseTerraformEvents(stdout: string): DeploymentEvent[] {
  const events: DeploymentEvent[] = [];
  const lines = stdout.split("\n");
  const regex =
    /([a-zA-Z0-9_.-]+): (Creating\.\.\.|Creation complete|Destroying\.\.\.|Destruction complete|Modifying\.\.\.|Modifications complete)/i;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const resourceId = match[1];
      const status = match[2];
      const resourceType = resourceId.split(".")[0] || "terraform_resource";
      events.push({
        timestamp: new Date(),
        resourceType,
        logicalResourceId: resourceId,
        status,
      });
    }
  }
  return events;
}

export class TerraformProvider implements DeploymentProvider {
  readonly name = "terraform";

  private getWorkspaceDir(plan: DeploymentPlan): string {
    return path.resolve(process.cwd(), `.stacktest/workspaces/${plan.runId}-${plan.testName}`);
  }

  async deploy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const workspaceDir = this.getWorkspaceDir(plan);

    try {
      // 1. Verify terraform CLI is installed
      try {
        await execAsync("terraform version");
      } catch {
        throw new Error("Terraform CLI is not installed or not available in the system PATH.");
      }

      // 2. Resolve source directory from template path
      let sourceDir = path.resolve(process.cwd(), plan.template);
      const stat = await fs.promises.stat(sourceDir).catch(() => null);
      if (stat && stat.isFile()) {
        sourceDir = path.dirname(sourceDir);
      }

      if (!fs.existsSync(sourceDir)) {
        throw new Error(`Terraform source template path does not exist: ${sourceDir}`);
      }

      // 3. Create isolated run-specific workspace and copy files
      await fs.promises.mkdir(workspaceDir, { recursive: true });
      await fs.promises.cp(sourceDir, workspaceDir, { recursive: true });

      // 4. Initialize terraform workspace
      await execAsync("terraform init -no-color", { cwd: workspaceDir });

      // 5. Apply Terraform plan
      const vars = formatVariables(plan.parameters).join(" ");
      const cmd = `terraform apply -auto-approve -no-color ${vars}`;
      const { stdout } = await execAsync(cmd, { cwd: workspaceDir });

      const events = parseTerraformEvents(stdout);

      // Fetch outputs
      const outputs: Record<string, unknown> = {};
      try {
        const { stdout: outputsJson } = await execAsync("terraform output -json", {
          cwd: workspaceDir,
        });
        const parsed = JSON.parse(outputsJson);
        for (const [key, val] of Object.entries(parsed)) {
          outputs[key] = (val as { value: unknown }).value;
        }
      } catch {
        // Ignore output errors
      }

      return {
        success: true,
        status: "APPLY_COMPLETE",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        events,
        resolvedParameters: plan.parameters,
        outputs,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return {
        success: false,
        status: "APPLY_FAILED",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        error,
        resolvedParameters: plan.parameters,
      };
    }
  }

  async destroy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const workspaceDir = this.getWorkspaceDir(plan);

    try {
      if (!fs.existsSync(workspaceDir)) {
        return {
          success: true,
          status: "DESTROY_COMPLETE",
          runId: plan.runId,
          deploymentName: plan.deploymentName,
          durationMs: Date.now() - start,
        };
      }

      // Run terraform destroy
      const vars = formatVariables(plan.parameters).join(" ");
      const cmd = `terraform destroy -auto-approve -no-color ${vars}`;
      const { stdout } = await execAsync(cmd, { cwd: workspaceDir });

      const events = parseTerraformEvents(stdout);

      // Clean up temporary workspace directory
      await fs.promises.rm(workspaceDir, { recursive: true, force: true });

      return {
        success: true,
        status: "DESTROY_COMPLETE",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        events,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return {
        success: false,
        status: "DESTROY_FAILED",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        error,
      };
    }
  }

  async getEvents(_plan: DeploymentPlan): Promise<DeploymentEvent[]> {
    return [];
  }
}
