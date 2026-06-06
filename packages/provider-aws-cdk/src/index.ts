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
import { AwsCloudFormationProvider } from "@stacktest/provider-aws-cloudformation";

const execAsync = promisify(exec);

export class AwsCdkProvider implements DeploymentProvider {
  readonly name = "aws-cdk";

  private getWorkspaceDir(plan: DeploymentPlan): string {
    return path.resolve(process.cwd(), `.stacktest/workspaces/cdk-${plan.runId}-${plan.testName}`);
  }

  async deploy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const workspaceDir = this.getWorkspaceDir(plan);

    try {
      // 1. Verify cdk CLI is installed
      try {
        await execAsync("cdk --version");
      } catch {
        throw new Error("AWS CDK CLI is not installed or not available in the system PATH.");
      }

      // 2. Resolve source directory from template path
      let sourceDir = path.resolve(process.cwd(), plan.template);
      const stat = await fs.promises.stat(sourceDir).catch(() => null);
      if (stat && stat.isFile()) {
        sourceDir = path.dirname(sourceDir);
      }

      if (!fs.existsSync(sourceDir)) {
        throw new Error(`CDK source directory does not exist: ${sourceDir}`);
      }

      // 3. Create isolated run-specific workspace and copy files
      await fs.promises.mkdir(workspaceDir, { recursive: true });
      await fs.promises.cp(sourceDir, workspaceDir, { recursive: true });

      // 4. Run CDK Synth
      await execAsync("cdk synth -o cdk.out --no-color", { cwd: workspaceDir });

      const cdkOutDir = path.join(workspaceDir, "cdk.out");
      const files = await fs.promises.readdir(cdkOutDir).catch(() => []);
      const templateFile = files.find((f) => f.endsWith(".template.json"));

      if (!templateFile) {
        throw new Error(
          "No synthesized CloudFormation template (.template.json) found in cdk.out.",
        );
      }

      const synthesizedTemplatePath = path.join(cdkOutDir, templateFile);

      // 5. Delegate deployment to AwsCloudFormationProvider
      const cfnPlan: DeploymentPlan = {
        ...plan,
        template: synthesizedTemplatePath,
      };

      const cfnProvider = new AwsCloudFormationProvider();
      const result = await cfnProvider.deploy(cfnPlan);

      return {
        ...result,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return {
        success: false,
        status: "CREATE_FAILED",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        error,
      };
    }
  }

  async destroy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const workspaceDir = this.getWorkspaceDir(plan);

    try {
      // Delegate destroy call to AwsCloudFormationProvider (which only needs plan.deploymentName and tags to verify and delete stack)
      const cfnProvider = new AwsCloudFormationProvider();
      const result = await cfnProvider.destroy(plan);

      // Clean up temporary workspace directory
      if (fs.existsSync(workspaceDir)) {
        await fs.promises.rm(workspaceDir, { recursive: true, force: true });
      }

      return {
        ...result,
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
    const cfnProvider = new AwsCloudFormationProvider();
    return cfnProvider.getEvents(plan);
  }
}
