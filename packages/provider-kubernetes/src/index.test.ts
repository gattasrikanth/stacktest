import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { KubernetesProvider, generateSafeNamespace } from "./index.js";
import { type DeploymentPlan } from "@stack-test/core";

vi.mock("child_process", () => ({
  exec: vi.fn(),
}));

const TEMP_DIR = path.resolve(process.cwd(), "packages/provider-kubernetes/src/temp-test");

describe("KubernetesProvider Mock Tests", () => {
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

  it("should generate a valid safe namespace name", () => {
    const ns = generateSafeNamespace("st-run123", "MyTest");
    expect(ns).toBe("st-st-run123-mytest");
  });

  it("should deploy manifests successfully and verify rollout status", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("version")) {
        cb(null, { stdout: "Client Version: v1.30.0" }, "");
      } else if (cmd.includes("create namespace")) {
        cb(null, { stdout: "namespace created" }, "");
      } else if (cmd.includes("apply")) {
        cb(
          null,
          {
            stdout: `
pod/nginx-pod created
service/nginx-service created
`,
          },
          "",
        );
      } else if (cmd.includes("get pods")) {
        const podsJson = {
          items: [
            {
              metadata: { name: "nginx-pod" },
              status: {
                phase: "Running",
                containerStatuses: [{ name: "nginx", ready: true }],
              },
            },
          ],
        };
        cb(null, { stdout: JSON.stringify(podsJson) }, "");
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const tempYaml = path.join(TEMP_DIR, "pod.yaml");
    fs.writeFileSync(tempYaml, "apiVersion: v1\nkind: Pod\nmetadata:\n  name: nginx", "utf8");

    const plan: DeploymentPlan = {
      projectName: "k8sproj",
      testName: "basic",
      providerName: "kubernetes",
      region: "local",
      runId: "st-run999",
      deploymentName: "k8sproj-basic-local-st-run999",
      template: tempYaml,
      parameters: {},
    };

    const provider = new KubernetesProvider();
    const result = await provider.deploy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("ACTIVE");
    expect(result.events).toHaveLength(2);
    expect(result.events?.[0].logicalResourceId).toBe("nginx-pod");
    expect(result.events?.[0].status).toBe("CREATED");

    expect(mockExec).toHaveBeenCalledWith("kubectl version --client", expect.any(Function));
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining("kubectl create namespace st-st-run999-basic"),
      expect.any(Function),
    );
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining(`kubectl apply -f "${tempYaml}" -n st-st-run999-basic`),
      expect.any(Function),
    );
  });

  it("should fail deployment when namespace creation fails", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("version")) {
        cb(null, { stdout: "Client Version: v1.30.0" }, "");
      } else if (cmd.includes("create namespace")) {
        cb(new Error("Namespace already exists"), null, "Conflict error");
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const plan: DeploymentPlan = {
      projectName: "k8sproj",
      testName: "basic",
      providerName: "kubernetes",
      region: "local",
      runId: "st-run999",
      deploymentName: "k8sproj-basic-local-st-run999",
      template: path.join(TEMP_DIR, "pod.yaml"),
      parameters: {},
    };

    const provider = new KubernetesProvider();
    const result = await provider.deploy(plan);

    expect(result.success).toBe(false);
    expect(result.status).toBe("FAILED");
    expect(result.error?.message).toContain("Namespace already exists");
  });

  it("should delete namespace successfully on destroy", async () => {
    const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
    mockExec.mockImplementation((cmd, options, callback) => {
      const cb = typeof options === "function" ? options : callback;
      if (cmd.includes("delete namespace")) {
        cb(null, { stdout: "namespace deleted" }, "");
      } else {
        cb(null, { stdout: "" }, "");
      }
    });

    const plan: DeploymentPlan = {
      projectName: "k8sproj",
      testName: "basic",
      providerName: "kubernetes",
      region: "local",
      runId: "st-run999",
      deploymentName: "k8sproj-basic-local-st-run999",
      template: path.join(TEMP_DIR, "pod.yaml"),
      parameters: {},
    };

    const provider = new KubernetesProvider();
    const result = await provider.destroy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("TERMINATED");
    expect(mockExec).toHaveBeenCalledWith(
      "kubectl delete namespace st-st-run999-basic",
      expect.any(Function),
    );
  });
});
