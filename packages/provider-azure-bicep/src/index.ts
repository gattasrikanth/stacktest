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

export function generateSafeResourceGroup(runId: string, testName: string): string {
  const sanitize = (val: string) => val.toLowerCase().replace(/[^a-z0-9-_()]/g, "-");
  const raw = `st-${sanitize(runId)}-${sanitize(testName)}`;
  if (raw.length > 90) {
    return raw.slice(0, 90);
  }
  return raw;
}

export function generateSafeDeploymentName(name: string): string {
  const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return sanitized.slice(0, 64);
}

function formatAzureParameters(parameters: Record<string, unknown>): string {
  const formatted: Record<string, { value: unknown }> = {};
  for (const [key, val] of Object.entries(parameters)) {
    formatted[key] = { value: val };
  }
  return JSON.stringify(formatted);
}

interface AzureOperation {
  properties?: {
    provisioningState?: string;
    timestamp?: string;
    targetResource?: {
      id?: string;
      resourceName?: string;
      resourceType?: string;
    };
  };
}

async function fetchDeploymentEvents(
  rgName: string,
  deploymentName: string,
): Promise<DeploymentEvent[]> {
  try {
    const { stdout } = await execAsync(
      `az deployment operation group list --resource-group "${rgName}" --name "${deploymentName}" --output json`,
    );
    const parsed: AzureOperation[] = JSON.parse(stdout);
    return parsed.map((op) => ({
      timestamp: op.properties?.timestamp ? new Date(op.properties.timestamp) : new Date(),
      resourceType: op.properties?.targetResource?.resourceType || "azure_resource",
      logicalResourceId:
        op.properties?.targetResource?.resourceName ||
        op.properties?.targetResource?.id ||
        "unknown",
      status: op.properties?.provisioningState || "UNKNOWN",
    }));
  } catch {
    return [];
  }
}

export class AzureBicepProvider implements DeploymentProvider {
  readonly name = "azure-bicep";

  async deploy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const rgName = generateSafeResourceGroup(plan.runId, plan.testName);
    const deployName = generateSafeDeploymentName(plan.deploymentName);
    const location = plan.region === "local" || !plan.region ? "eastus" : plan.region;

    const tempDir = path.resolve(process.cwd(), ".stacktest");
    const paramFilePath = path.join(tempDir, `azure-params-${plan.runId}-${plan.testName}.json`);

    try {
      // 1. Verify az CLI is installed
      try {
        await execAsync("az --version");
      } catch {
        throw new Error("Azure CLI (az) is not installed or not available in the system PATH.");
      }

      const templatePath = path.resolve(process.cwd(), plan.template);
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Azure Bicep template file does not exist: ${templatePath}`);
      }

      // 2. Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write parameters JSON file
      const paramsJson = formatAzureParameters(plan.parameters);
      fs.writeFileSync(paramFilePath, paramsJson, "utf8");

      // 3. Create isolated Resource Group
      await execAsync(`az group create --name "${rgName}" --location "${location}" --output json`);

      // 4. Deploy Bicep template
      const cmd = `az deployment group create --resource-group "${rgName}" --name "${deployName}" --template-file "${templatePath}" --parameters "@${paramFilePath}" --output json`;
      await execAsync(cmd);

      // 5. Gather deployment operations/events
      const events = await fetchDeploymentEvents(rgName, deployName);

      // Clean up parameters file
      if (fs.existsSync(paramFilePath)) {
        fs.unlinkSync(paramFilePath);
      }

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
      // Clean up parameters file
      if (fs.existsSync(paramFilePath)) {
        fs.unlinkSync(paramFilePath);
      }

      // Attempt to retrieve whatever events we can
      const events = await fetchDeploymentEvents(rgName, deployName);

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
    const rgName = generateSafeResourceGroup(plan.runId, plan.testName);

    try {
      // Safety guardrail check: Ensure resource group name starts with "st-"
      if (!rgName.startsWith("st-")) {
        throw new Error(
          `Safety Guardrail: Resource group name "${rgName}" does not start with "st-" prefix.`,
        );
      }

      // Delete the Resource Group and all contained resources
      await execAsync(`az group delete --name "${rgName}" --yes --output json`);

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
    const rgName = generateSafeResourceGroup(plan.runId, plan.testName);
    const deployName = generateSafeDeploymentName(plan.deploymentName);
    return fetchDeploymentEvents(rgName, deployName);
  }
}
