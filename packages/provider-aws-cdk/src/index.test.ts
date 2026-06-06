import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { AwsCdkProvider } from "./index.js";
import { AwsCloudFormationProvider } from "@stack-test/provider-aws-cloudformation";
import { type DeploymentPlan } from "@stack-test/core";

vi.mock("child_process", () => ({
  exec: vi.fn(),
}));

vi.mock("@stack-test/provider-aws-cloudformation", () => {
  return {
    AwsCloudFormationProvider: vi.fn().mockImplementation(() => ({
      deploy: vi.fn().mockResolvedValue({
        success: true,
        status: "CREATE_COMPLETE",
        runId: "st-run999",
        deploymentName: "cdkproj-basic-us-east-1-st-run999",
        durationMs: 100,
      }),
      destroy: vi.fn().mockResolvedValue({
        success: true,
        status: "DELETE_COMPLETE",
        runId: "st-run999",
        deploymentName: "cdkproj-basic-us-east-1-st-run999",
        durationMs: 50,
      }),
      getEvents: vi.fn().mockResolvedValue([]),
    })),
  };
});

const TEMP_DIR = path.resolve(process.cwd(), "packages/provider-aws-cdk/src/temp-test");

describe("AwsCdkProvider Mock Tests", () => {
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

  it("should synthesize and delegate cdk deploy calls to CloudFormation provider", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      const opts = typeof options === "object" ? options : {};

      if (cmd.includes("version")) {
        cb(null, { stdout: "2.100.0" }, "");
      } else if (cmd.includes("synth")) {
        const cdkOut = path.join(opts.cwd, "cdk.out");
        fs.mkdirSync(cdkOut, { recursive: true });
        fs.writeFileSync(path.join(cdkOut, "MyStack.template.json"), "{}", "utf8");
        cb(null, { stdout: "Synthesized successfully" }, "");
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const tempApp = path.join(TEMP_DIR, "app.ts");
    fs.writeFileSync(tempApp, "// cdk app entry", "utf8");

    const plan: DeploymentPlan = {
      projectName: "cdkproj",
      testName: "basic",
      providerName: "aws-cdk",
      region: "us-east-1",
      runId: "st-run999",
      deploymentName: "cdkproj-basic-us-east-1-st-run999",
      template: tempApp,
      parameters: {},
    };

    const provider = new AwsCdkProvider();
    const result = await provider.deploy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("CREATE_COMPLETE");

    expect(mockExec).toHaveBeenCalledWith("cdk --version", expect.any(Function));
    expect(mockExec).toHaveBeenCalledWith(
      "cdk synth -o cdk.out --no-color",
      expect.any(Object),
      expect.any(Function),
    );

    // Verify delegation
    const CfnMockClass = AwsCloudFormationProvider as unknown as ReturnType<typeof vi.fn>;
    expect(CfnMockClass).toHaveBeenCalled();
    const mockCfnInstance = CfnMockClass.mock.results[0].value;
    expect(mockCfnInstance.deploy).toHaveBeenCalledWith(
      expect.objectContaining({
        template: expect.stringContaining("MyStack.template.json"),
      }),
    );
  });

  it("should delegate destroy calls to CloudFormation provider and clean up workspaces", async () => {
    const workspaceDir = path.resolve(process.cwd(), ".stacktest/workspaces/cdk-st-run999-basic");
    fs.mkdirSync(workspaceDir, { recursive: true });

    const plan: DeploymentPlan = {
      projectName: "cdkproj",
      testName: "basic",
      providerName: "aws-cdk",
      region: "us-east-1",
      runId: "st-run999",
      deploymentName: "cdkproj-basic-us-east-1-st-run999",
      template: path.join(TEMP_DIR, "app.ts"),
      parameters: {},
    };

    const provider = new AwsCdkProvider();
    const result = await provider.destroy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("DELETE_COMPLETE");

    // Verify CFN destroy was delegated
    const CfnMockClass = AwsCloudFormationProvider as unknown as ReturnType<typeof vi.fn>;
    const mockCfnInstance = CfnMockClass.mock.results[0].value;
    expect(mockCfnInstance.destroy).toHaveBeenCalledWith(plan);

    // Verify workspace dir cleanup
    expect(fs.existsSync(workspaceDir)).toBe(false);
  });
});
