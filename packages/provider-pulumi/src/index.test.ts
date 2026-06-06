import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { PulumiProvider, generateSafeStackName } from "./index.js";
import { type DeploymentPlan } from "@stack-test/core";

vi.mock("child_process", () => ({
  exec: vi.fn(),
}));

const TEMP_DIR = path.resolve(process.cwd(), "packages/provider-pulumi/src/temp-test");

describe("PulumiProvider Mock Tests", () => {
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

  it("should generate a valid safe stack name", () => {
    const stack = generateSafeStackName("st-run123", "MyTest");
    expect(stack).toBe("st-st-run123-mytest");
  });

  it("should deploy a Pulumi stack successfully and query events", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("pulumi version")) {
        cb(null, { stdout: "v3.118.0" }, "");
      } else if (cmd.includes("pulumi login")) {
        cb(null, { stdout: "logged in" }, "");
      } else if (cmd.includes("pulumi stack select")) {
        cb(null, { stdout: "stack selected" }, "");
      } else if (cmd.includes("pulumi config set")) {
        cb(null, { stdout: "config set" }, "");
      } else if (cmd.includes("pulumi up")) {
        cb(null, { stdout: "update succeeded" }, "");
      } else if (cmd.includes("pulumi stack export")) {
        const mockState = {
          deployment: {
            resources: [
              {
                type: "pulumi:providers:random",
                urn: "urn:pulumi:st-run::proj::pulumi:providers:random::prov",
              },
              {
                type: "random:index/randomPassword:RandomPassword",
                urn: "urn:pulumi:st-run::proj::random:index/randomPassword:RandomPassword::db-pass",
                id: "secret",
              },
            ],
          },
        };
        cb(null, { stdout: JSON.stringify(mockState) }, "");
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const tempProj = path.join(TEMP_DIR, "Pulumi.yaml");
    fs.writeFileSync(tempProj, "name: proj\nruntime: nodejs\n", "utf8");

    const plan: DeploymentPlan = {
      projectName: "pulumiproj",
      testName: "basic",
      providerName: "pulumi",
      region: "local",
      runId: "st-run999",
      deploymentName: "pulumiproj-basic-local-st-run999",
      template: TEMP_DIR,
      parameters: { length: 16 },
    };

    const provider = new PulumiProvider();
    const result = await provider.deploy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("ACTIVE");
    expect(result.events).toHaveLength(2);
    expect(result.events?.[1].logicalResourceId).toBe("db-pass");
    expect(result.events?.[1].resourceType).toBe("random:index/randomPassword:RandomPassword");

    expect(mockExec).toHaveBeenCalledWith("pulumi version", expect.any(Function));
    expect(mockExec).toHaveBeenCalledWith("pulumi login --local", expect.any(Function));
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining('pulumi config set "length" "16"'),
      expect.any(Function),
    );
  });

  it("should fail deployment when Pulumi CLI check fails", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("pulumi version")) {
        cb(new Error("pulumi not found"), null, "");
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const plan: DeploymentPlan = {
      projectName: "pulumiproj",
      testName: "basic",
      providerName: "pulumi",
      region: "local",
      runId: "st-run999",
      deploymentName: "pulumiproj-basic-local-st-run999",
      template: TEMP_DIR,
      parameters: {},
    };

    const provider = new PulumiProvider();
    const result = await provider.deploy(plan);

    expect(result.success).toBe(false);
    expect(result.status).toBe("FAILED");
    expect(result.error?.message).toContain("Pulumi CLI is not installed");
  });

  it("should destroy and remove stack successfully", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("pulumi destroy")) {
        cb(null, { stdout: "destroyed" }, "");
      } else if (cmd.includes("pulumi stack rm")) {
        cb(null, { stdout: "stack removed" }, "");
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const plan: DeploymentPlan = {
      projectName: "pulumiproj",
      testName: "basic",
      providerName: "pulumi",
      region: "local",
      runId: "st-run999",
      deploymentName: "pulumiproj-basic-local-st-run999",
      template: TEMP_DIR,
      parameters: {},
    };

    const provider = new PulumiProvider();
    const result = await provider.destroy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("TERMINATED");
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining("pulumi destroy --yes"),
      expect.any(Function),
    );
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining('pulumi stack rm --yes "st-st-run999-basic"'),
      expect.any(Function),
    );
  });
});
