import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { AzureBicepProvider, generateSafeResourceGroup } from "./index.js";
import { type DeploymentPlan } from "@stack-test/core";

vi.mock("child_process", () => ({
  exec: vi.fn(),
}));

const TEMP_DIR = path.resolve(process.cwd(), "packages/provider-azure-bicep/src/temp-test");

describe("AzureBicepProvider Mock Tests", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a valid safe resource group name", () => {
    const rg = generateSafeResourceGroup("st-run123", "MyTest");
    expect(rg).toBe("st-st-run123-mytest");
  });

  it("should deploy a Bicep template successfully and query operations", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("az --version")) {
        cb(null, { stdout: "azure-cli 2.61.0" }, "");
      } else if (cmd.includes("az group create")) {
        cb(null, { stdout: '{"properties": {"provisioningState": "Succeeded"}}' }, "");
      } else if (cmd.includes("az deployment group create")) {
        cb(null, { stdout: '{"properties": {"provisioningState": "Succeeded"}}' }, "");
      } else if (cmd.includes("az deployment operation group list")) {
        const mockOps = [
          {
            properties: {
              timestamp: "2026-06-06T00:00:00Z",
              provisioningState: "Succeeded",
              targetResource: {
                id: "/subscriptions/123/resourceGroups/st-run-test/providers/Microsoft.Storage/storageAccounts/sa",
                resourceName: "sa",
                resourceType: "Microsoft.Storage/storageAccounts",
              },
            },
          },
        ];
        cb(null, { stdout: JSON.stringify(mockOps) }, "");
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const tempBicep = path.join(TEMP_DIR, "main.bicep");
    fs.writeFileSync(tempBicep, "param name string = 'test'", "utf8");

    const plan: DeploymentPlan = {
      projectName: "azureproj",
      testName: "basic",
      providerName: "azure-bicep",
      region: "eastus",
      runId: "st-run999",
      deploymentName: "azureproj-basic-eastus-st-run999",
      template: tempBicep,
      parameters: { name: "stacktest-sa" },
    };

    const provider = new AzureBicepProvider();
    const result = await provider.deploy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("ACTIVE");
    expect(result.events).toHaveLength(1);
    expect(result.events?.[0].logicalResourceId).toBe("sa");
    expect(result.events?.[0].status).toBe("Succeeded");

    expect(mockExec).toHaveBeenCalledWith("az --version", expect.any(Function));
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining('az group create --name "st-st-run999-basic" --location "eastus"'),
      expect.any(Function),
    );
  });

  it("should fail deployment when az CLI check fails", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("az --version")) {
        cb(new Error("az not found"), null, "");
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const tempBicep = path.join(TEMP_DIR, "main.bicep");
    fs.writeFileSync(tempBicep, "param name string = 'test'", "utf8");

    const plan: DeploymentPlan = {
      projectName: "azureproj",
      testName: "basic",
      providerName: "azure-bicep",
      region: "eastus",
      runId: "st-run999",
      deploymentName: "azureproj-basic-eastus-st-run999",
      template: tempBicep,
      parameters: {},
    };

    const provider = new AzureBicepProvider();
    const result = await provider.deploy(plan);

    expect(result.success).toBe(false);
    expect(result.status).toBe("FAILED");
    expect(result.error?.message).toContain("Azure CLI (az) is not installed");
  });

  it("should delete resource group successfully on destroy", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("az group delete")) {
        cb(null, { stdout: '{"status": "deleted"}' }, "");
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const plan: DeploymentPlan = {
      projectName: "azureproj",
      testName: "basic",
      providerName: "azure-bicep",
      region: "eastus",
      runId: "st-run999",
      deploymentName: "azureproj-basic-eastus-st-run999",
      template: path.join(TEMP_DIR, "main.bicep"),
      parameters: {},
    };

    const provider = new AzureBicepProvider();
    const result = await provider.destroy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("TERMINATED");
    expect(mockExec).toHaveBeenCalledWith(
      'az group delete --name "st-st-run999-basic" --yes --output json',
      expect.any(Function),
    );
  });
});
