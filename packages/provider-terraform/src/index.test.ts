import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { TerraformProvider } from "./index.js";
import { type DeploymentPlan } from "@stacktest/core";

vi.mock("child_process", () => ({
  exec: vi.fn(),
}));

const TEMP_DIR = path.resolve(process.cwd(), "packages/provider-terraform/src/temp-test");

describe("TerraformProvider Mock Tests", () => {
  beforeAll(() => {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    const stacktestDir = path.resolve(process.cwd(), ".stacktest");
    if (fs.existsSync(stacktestDir)) {
      fs.rmSync(stacktestDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should deploy terraform templates successfully by running init and apply", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("version")) {
        cb(null, { stdout: "Terraform v1.8.0" }, "");
      } else if (cmd.includes("init")) {
        cb(null, { stdout: "Initialized!" }, "");
      } else if (cmd.includes("apply")) {
        cb(
          null,
          {
            stdout: `
null_resource.test: Creating...
null_resource.test: Creation complete after 1s
`,
          },
          "",
        );
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const tempTf = path.join(TEMP_DIR, "main.tf");
    fs.writeFileSync(tempTf, 'resource "null_resource" "test" {}', "utf8");

    const plan: DeploymentPlan = {
      projectName: "tfproj",
      testName: "basic",
      providerName: "terraform",
      region: "local",
      runId: "st-run999",
      deploymentName: "tfproj-basic-local-st-run999",
      template: tempTf,
      parameters: {
        Foo: "bar",
      },
    };

    const provider = new TerraformProvider();
    const result = await provider.deploy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("APPLY_COMPLETE");
    expect(result.events).toHaveLength(2);
    expect(result.events?.[0].logicalResourceId).toBe("null_resource.test");
    expect(result.events?.[0].status).toBe("Creating...");
    expect(result.events?.[1].status).toBe("Creation complete");

    expect(mockExec).toHaveBeenCalledWith("terraform version", expect.any(Function));
    expect(mockExec).toHaveBeenCalledWith(
      "terraform init -no-color",
      expect.any(Object),
      expect.any(Function),
    );
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining('terraform apply -auto-approve -no-color -var="Foo=bar"'),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it("should fail deployment when terraform execution returns an error", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("version")) {
        cb(null, { stdout: "Terraform v1.8.0" }, "");
      } else if (cmd.includes("init")) {
        cb(null, { stdout: "Initialized!" }, "");
      } else if (cmd.includes("apply")) {
        cb(new Error("Variables are missing"), null, "Missing value for variable");
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const tempTf = path.join(TEMP_DIR, "main-fail.tf");
    fs.writeFileSync(tempTf, 'variable "foo" {}', "utf8");

    const plan: DeploymentPlan = {
      projectName: "tfproj",
      testName: "fail",
      providerName: "terraform",
      region: "local",
      runId: "st-run999",
      deploymentName: "tfproj-fail-local-st-run999",
      template: tempTf,
      parameters: {},
    };

    const provider = new TerraformProvider();
    const result = await provider.deploy(plan);

    expect(result.success).toBe(false);
    expect(result.status).toBe("APPLY_FAILED");
    expect(result.error?.message).toContain("Variables are missing");
  });

  it("should destroy resources successfully", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("destroy")) {
        cb(
          null,
          {
            stdout: `
null_resource.test: Destroying...
null_resource.test: Destruction complete after 0s
`,
          },
          "",
        );
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const workspaceDir = path.resolve(process.cwd(), ".stacktest/workspaces/st-run999-basic");
    fs.mkdirSync(workspaceDir, { recursive: true });

    const plan: DeploymentPlan = {
      projectName: "tfproj",
      testName: "basic",
      providerName: "terraform",
      region: "local",
      runId: "st-run999",
      deploymentName: "tfproj-basic-local-st-run999",
      template: path.join(TEMP_DIR, "main.tf"),
      parameters: {},
    };

    const provider = new TerraformProvider();
    const result = await provider.destroy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("DESTROY_COMPLETE");
    expect(result.events).toHaveLength(2);
    expect(result.events?.[0].status).toBe("Destroying...");

    expect(fs.existsSync(workspaceDir)).toBe(false);
  });
});
