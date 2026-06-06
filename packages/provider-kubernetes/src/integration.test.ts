import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { KubernetesProvider } from "./index.js";
import { type DeploymentPlan } from "@stack-test/core";
import * as fs from "fs";
import * as path from "path";

const TEMP_DIR = path.resolve(
  process.cwd(),
  "packages/provider-kubernetes/src/temp-integration-test",
);

const runIntegrationTests = process.env.RUN_KUBERNETES_INTEGRATION_TESTS === "true";
const describeOrSkip = runIntegrationTests ? describe : describe.skip;

describeOrSkip("Kubernetes Provider Live Integration Tests", () => {
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

  it("should deploy a real Pod manifest to Kubernetes cluster and destroy it cleanly", async () => {
    const provider = new KubernetesProvider();

    const podYaml = `
apiVersion: v1
kind: Pod
metadata:
  name: integration-nginx
spec:
  containers:
  - name: nginx
    image: nginx:alpine
    resources:
      limits:
        memory: "128Mi"
        cpu: "500m"
`;
    const tfFile = path.join(TEMP_DIR, "pod.yaml");
    fs.writeFileSync(tfFile, podYaml, "utf8");

    const plan: DeploymentPlan = {
      projectName: "k8s-int-proj",
      testName: "k8s-test",
      providerName: "kubernetes",
      region: "local",
      runId: `run-${Date.now()}`,
      deploymentName: `k8s-int-proj-k8s-test-${Date.now()}`,
      template: tfFile,
      parameters: {},
    };

    console.log(`Deploying Kubernetes integration namespace: ${plan.deploymentName}`);
    const deployResult = await provider.deploy(plan);
    expect(deployResult.success).toBe(true);
    expect(deployResult.status).toBe("ACTIVE");
    expect(deployResult.events).toBeDefined();

    console.log(`Destroying Kubernetes integration namespace: ${plan.deploymentName}`);
    const destroyResult = await provider.destroy(plan);
    expect(destroyResult.success).toBe(true);
    expect(destroyResult.status).toBe("TERMINATED");
  }, 120000);
});
