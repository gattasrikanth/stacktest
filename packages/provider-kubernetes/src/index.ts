import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import {
  type DeploymentProvider,
  type DeploymentResult,
  type DeploymentEvent,
  type DeploymentPlan,
} from "@stacktest/core";

const execAsync = promisify(exec);

export function generateSafeNamespace(runId: string, testName: string): string {
  const sanitize = (val: string) => val.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const raw = `st-${sanitize(runId)}-${sanitize(testName)}`;
  if (raw.length > 63) {
    return raw.slice(0, 63);
  }
  return raw;
}

function parseKubectlEvents(stdout: string): DeploymentEvent[] {
  const events: DeploymentEvent[] = [];
  const lines = stdout.split("\n");
  for (const line of lines) {
    const match = line
      .trim()
      .match(/^([a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)?) (created|configured|unchanged|deleted)$/i);
    if (match) {
      const resourceId = match[1];
      const status = match[2];
      const parts = resourceId.split("/");
      const resourceType = parts[0] || "kubernetes_resource";
      const logicalResourceId = parts[1] || resourceId;
      events.push({
        timestamp: new Date(),
        resourceType,
        logicalResourceId,
        status: status.toUpperCase(),
      });
    }
  }
  return events;
}

interface KubernetesPod {
  status?: {
    phase?: string;
    containerStatuses?: Array<{
      ready: boolean;
    }>;
  };
}

export class KubernetesProvider implements DeploymentProvider {
  readonly name = "kubernetes";

  async deploy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const namespace = generateSafeNamespace(plan.runId, plan.testName);

    try {
      // 1. Verify kubectl CLI
      try {
        await execAsync("kubectl version --client");
      } catch {
        throw new Error("kubectl CLI is not installed or not available in the system PATH.");
      }

      const templatePath = path.resolve(process.cwd(), plan.template);
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Kubernetes template manifest path does not exist: ${templatePath}`);
      }

      // 2. Create isolated namespace
      await execAsync(`kubectl create namespace ${namespace}`);

      // 3. Apply manifests
      const { stdout } = await execAsync(`kubectl apply -f "${templatePath}" -n ${namespace}`);
      const events = parseKubectlEvents(stdout);

      // 4. Poll for Deployment and Pod readiness
      const deployments = events.filter((e) => e.resourceType.includes("deployment"));
      for (const dep of deployments) {
        await execAsync(
          `kubectl rollout status deployment/${dep.logicalResourceId} -n ${namespace} --timeout=15s`,
        ).catch(() => {});
      }

      // Query Pod readiness status
      let active = true;
      const successTimeout = Date.now() + 60000; // 1 minute max wait
      while (active) {
        const { stdout: podsJson } = await execAsync(
          `kubectl get pods -n ${namespace} -o json`,
        ).catch(() => ({ stdout: '{"items":[]}' }));
        let items: KubernetesPod[] = [];
        try {
          const parsed = JSON.parse(podsJson);
          items = parsed.items || [];
        } catch {
          // Ignore JSON parse errors
        }

        if (items.length === 0) {
          active = false;
          break;
        }

        let allReady = true;
        for (const pod of items) {
          const phase = pod.status?.phase;
          if (phase !== "Running" && phase !== "Succeeded") {
            allReady = false;
            break;
          }
          const containerStatuses = pod.status?.containerStatuses || [];
          if (containerStatuses.length > 0 && containerStatuses.some((c) => !c.ready)) {
            allReady = false;
            break;
          }
        }

        if (allReady) {
          active = false;
          break;
        }

        if (Date.now() > successTimeout) {
          throw new Error(
            `Kubernetes rollout timed out: pods in namespace ${namespace} are not ready.`,
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));
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
      return {
        success: false,
        status: "FAILED",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        error,
        resolvedParameters: plan.parameters,
      };
    }
  }

  async destroy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const namespace = generateSafeNamespace(plan.runId, plan.testName);

    try {
      // Delete namespace cascadingly removes all child resources
      await execAsync(`kubectl delete namespace ${namespace}`);

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

  async getEvents(_plan: DeploymentPlan): Promise<DeploymentEvent[]> {
    return [];
  }
}
