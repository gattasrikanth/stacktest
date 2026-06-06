import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TerraformProvider } from "./index.js";
import { type DeploymentPlan } from "@stack-test/core";
import * as fs from "fs";
import * as path from "path";

const TEMP_DIR = path.resolve(
  process.cwd(),
  "packages/provider-terraform/src/temp-integration-test",
);

const runIntegrationTests = process.env.RUN_TERRAFORM_INTEGRATION_TESTS === "true";
const describeOrSkip = runIntegrationTests ? describe : describe.skip;

describeOrSkip("Terraform Provider Live Integration Tests", () => {
  beforeAll(() => {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  });

  it("should deploy a real local null_resource configuration and destroy it cleanly", async () => {
    const provider = new TerraformProvider();

    const tfContent = `
variable "test_value" {
  type = string
}

resource "null_resource" "int_test" {
  triggers = {
    val = var.test_value
  }
}
`;
    const tfFile = path.join(TEMP_DIR, "main.tf");
    fs.writeFileSync(tfFile, tfContent, "utf8");

    const plan: DeploymentPlan = {
      projectName: "tf-int-proj",
      testName: "int-test",
      providerName: "terraform",
      region: "local",
      runId: `run-${Date.now()}`,
      deploymentName: `tf-int-proj-int-test-${Date.now()}`,
      template: TEMP_DIR,
      parameters: {
        test_value: "hello-world",
      },
    };

    console.log(`Deploying Terraform integration workspace: ${plan.deploymentName}`);
    const deployResult = await provider.deploy(plan);
    expect(deployResult.success).toBe(true);
    expect(deployResult.status).toBe("APPLY_COMPLETE");
    expect(deployResult.events).toBeDefined();

    const workspaceDir = path.resolve(
      process.cwd(),
      `.stacktest/workspaces/${plan.runId}-${plan.testName}`,
    );
    expect(fs.existsSync(path.join(workspaceDir, "terraform.tfstate"))).toBe(true);

    console.log(`Destroying Terraform integration workspace: ${plan.deploymentName}`);
    const destroyResult = await provider.destroy(plan);
    expect(destroyResult.success).toBe(true);
    expect(destroyResult.status).toBe("DESTROY_COMPLETE");

    expect(fs.existsSync(workspaceDir)).toBe(false);
  }, 60000);
});
