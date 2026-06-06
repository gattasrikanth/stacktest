import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AzureBicepProvider } from "./index.js";
import { type DeploymentPlan } from "@stacktest/core";
import * as fs from "fs";
import * as path from "path";

const TEMP_DIR = path.resolve(
  process.cwd(),
  "packages/provider-azure-bicep/src/temp-integration-test",
);

const runIntegrationTests = process.env.RUN_AZURE_INTEGRATION_TESTS === "true";
const describeOrSkip = runIntegrationTests ? describe : describe.skip;

describeOrSkip("Azure Bicep Provider Live Integration Tests", () => {
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

  it("should deploy a basic Bicep storage account and destroy the resource group cleanly", async () => {
    const provider = new AzureBicepProvider();

    // Unique storage account name must be lowercase and between 3-24 characters
    const storageAccountName = `sttest${Date.now().toString().slice(-10)}`;

    const bicepContent = `
param location string = resourceGroup().location
param storageAccountName string

resource storageAccount 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}
`;
    const bicepFilePath = path.join(TEMP_DIR, "storage.bicep");
    fs.writeFileSync(bicepFilePath, bicepContent, "utf8");

    const plan: DeploymentPlan = {
      projectName: "az-int-proj",
      testName: "az-test",
      providerName: "azure-bicep",
      region: "eastus",
      runId: `run-${Date.now()}`,
      deploymentName: `az-int-proj-az-test-${Date.now()}`,
      template: bicepFilePath,
      parameters: { storageAccountName },
    };

    console.log(`Deploying Azure Resource Group and Bicep storage: ${plan.deploymentName}`);
    const deployResult = await provider.deploy(plan);
    expect(deployResult.success).toBe(true);
    expect(deployResult.status).toBe("ACTIVE");
    expect(deployResult.events).toBeDefined();

    console.log(`Destroying Azure Resource Group: ${plan.deploymentName}`);
    const destroyResult = await provider.destroy(plan);
    expect(destroyResult.success).toBe(true);
    expect(destroyResult.status).toBe("TERMINATED");
  }, 180000);
});
