import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PulumiProvider } from "./index.js";
import { type DeploymentPlan } from "@stack-test/core";
import * as fs from "fs";
import * as path from "path";

const TEMP_DIR = path.resolve(process.cwd(), "packages/provider-pulumi/src/temp-integration-test");

const runIntegrationTests = process.env.RUN_PULUMI_INTEGRATION_TESTS === "true";
const describeOrSkip = runIntegrationTests ? describe : describe.skip;

describeOrSkip("Pulumi Provider Live Integration Tests", () => {
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

  it("should deploy a basic Pulumi YAML project and destroy the stack cleanly", async () => {
    const provider = new PulumiProvider();

    const pulumiYaml = `
name: integration-yaml
runtime: yaml
description: A simple Pulumi YAML project
resources:
  my-random-pet:
    type: random:RandomPet
    properties:
      length: 2
`;
    fs.writeFileSync(path.join(TEMP_DIR, "Pulumi.yaml"), pulumiYaml, "utf8");

    const plan: DeploymentPlan = {
      projectName: "pulumi-int-proj",
      testName: "pulumi-test",
      providerName: "pulumi",
      region: "local",
      runId: `run-${Date.now()}`,
      deploymentName: `pulumi-int-proj-pulumi-test-${Date.now()}`,
      template: TEMP_DIR,
      parameters: {},
    };

    console.log(`Deploying Pulumi Stack: ${plan.deploymentName}`);
    const deployResult = await provider.deploy(plan);
    expect(deployResult.success).toBe(true);
    expect(deployResult.status).toBe("ACTIVE");
    expect(deployResult.events).toBeDefined();

    console.log(`Destroying Pulumi Stack: ${plan.deploymentName}`);
    const destroyResult = await provider.destroy(plan);
    expect(destroyResult.success).toBe(true);
    expect(destroyResult.status).toBe("TERMINATED");
  }, 180000);
});
