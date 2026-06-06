import { describe, it, expect } from "vitest";
import { RunOrchestrator } from "./orchestrator.js";
import { type DeploymentPlan } from "../planner/planner.js";
import { ProviderRegistry } from "../providers/registry.js";
import { type DeploymentProvider, type DeploymentResult } from "../providers/types.js";

describe("RunOrchestrator", () => {
  it("should execute plans successfully and resolve parameters", async () => {
    let capturedPlan: DeploymentPlan | null = null;

    const captureProvider: DeploymentProvider = {
      name: "capture",
      deploy: async (plan: DeploymentPlan): Promise<DeploymentResult> => {
        capturedPlan = plan;
        return {
          success: true,
          status: "CREATE_COMPLETE",
          runId: plan.runId,
          deploymentName: plan.deploymentName,
          durationMs: 10,
        };
      },
      destroy: async (plan: DeploymentPlan): Promise<DeploymentResult> => ({
        success: true,
        status: "DELETE_COMPLETE",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: 5,
      }),
      getEvents: async () => [],
    };

    ProviderRegistry.register(captureProvider);

    const plans: DeploymentPlan[] = [
      {
        projectName: "demo",
        testName: "basic",
        providerName: "capture",
        region: "us-east-1",
        runId: "st-run123",
        deploymentName: "demo-basic-us-east-1-st-run123",
        template: "sqs.yaml",
        parameters: {
          RegionParam: "$[stacktest_region]",
          StaticParam: "hello",
        },
      },
    ];

    const orchestrator = new RunOrchestrator();
    const results = await orchestrator.execute(plans);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].status).toBe("CREATE_COMPLETE");

    expect(capturedPlan).not.toBeNull();
    if (capturedPlan) {
      expect(capturedPlan.parameters.RegionParam).toBe("us-east-1");
      expect(capturedPlan.parameters.StaticParam).toBe("hello");
    }
  });

  it("should handle deploy failures and invoke cleanup", async () => {
    let destroyInvoked = false;

    const failingProvider: DeploymentProvider = {
      name: "failing-prov",
      deploy: async (): Promise<DeploymentResult> => {
        throw new Error("Deploy failed");
      },
      destroy: async (plan): Promise<DeploymentResult> => {
        destroyInvoked = true;
        return {
          success: true,
          status: "DELETE_COMPLETE",
          runId: plan.runId,
          deploymentName: plan.deploymentName,
          durationMs: 5,
        };
      },
      getEvents: async () => [],
    };

    ProviderRegistry.register(failingProvider);

    const plans: DeploymentPlan[] = [
      {
        projectName: "demo",
        testName: "basic",
        providerName: "failing-prov",
        region: "us-east-1",
        runId: "st-run123",
        deploymentName: "demo-basic-us-east-1-st-run123",
        template: "sqs.yaml",
        parameters: {},
      },
    ];

    const orchestrator = new RunOrchestrator();
    const results = await orchestrator.execute(plans);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error?.message).toBe("Deploy failed");
    expect(destroyInvoked).toBe(true);
  });

  it("should skip cleanup on failure when retainOnFailure is true", async () => {
    let destroyInvoked = false;

    const failingProvider: DeploymentProvider = {
      name: "failing-retain",
      deploy: async (): Promise<DeploymentResult> => {
        throw new Error("Deploy failed");
      },
      destroy: async (plan): Promise<DeploymentResult> => {
        destroyInvoked = true;
        return {
          success: true,
          status: "DELETE_COMPLETE",
          runId: plan.runId,
          deploymentName: plan.deploymentName,
          durationMs: 5,
        };
      },
      getEvents: async () => [],
    };

    ProviderRegistry.register(failingProvider);

    const plans: DeploymentPlan[] = [
      {
        projectName: "demo",
        testName: "basic",
        providerName: "failing-retain",
        region: "us-east-1",
        runId: "st-run123",
        deploymentName: "demo-basic-us-east-1-st-run123",
        template: "sqs.yaml",
        parameters: {},
      },
    ];

    const orchestrator = new RunOrchestrator({ retainOnFailure: true });
    const results = await orchestrator.execute(plans);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(destroyInvoked).toBe(false);
  });

  it("should run multi-stage execution sequentially, propagate outputs, and cleanup in reverse order", async () => {
    const deployOrder: string[] = [];
    const destroyOrder: string[] = [];

    const stage1Provider: DeploymentProvider = {
      name: "stage1-prov",
      deploy: async (plan: DeploymentPlan): Promise<DeploymentResult> => {
        deployOrder.push(plan.stageName || "stage1");
        return {
          success: true,
          status: "CREATE_COMPLETE",
          runId: plan.runId,
          deploymentName: plan.deploymentName,
          durationMs: 10,
          outputs: { VpcId: "vpc-777" },
        };
      },
      destroy: async (plan: DeploymentPlan): Promise<DeploymentResult> => {
        destroyOrder.push(plan.stageName || "stage1");
        return {
          success: true,
          status: "DELETE_COMPLETE",
          runId: plan.runId,
          deploymentName: plan.deploymentName,
          durationMs: 5,
        };
      },
      getEvents: async () => [],
    };

    const stage2Provider: DeploymentProvider = {
      name: "stage2-prov",
      deploy: async (plan: DeploymentPlan): Promise<DeploymentResult> => {
        deployOrder.push(plan.stageName || "stage2");
        expect(plan.parameters.VpcId).toBe("vpc-777");
        return {
          success: true,
          status: "CREATE_COMPLETE",
          runId: plan.runId,
          deploymentName: plan.deploymentName,
          durationMs: 10,
        };
      },
      destroy: async (plan: DeploymentPlan): Promise<DeploymentResult> => {
        destroyOrder.push(plan.stageName || "stage2");
        return {
          success: true,
          status: "DELETE_COMPLETE",
          runId: plan.runId,
          deploymentName: plan.deploymentName,
          durationMs: 5,
        };
      },
      getEvents: async () => [],
    };

    ProviderRegistry.register(stage1Provider);
    ProviderRegistry.register(stage2Provider);

    const plans: DeploymentPlan[] = [
      {
        projectName: "demo",
        testName: "multi",
        providerName: "stage1-prov",
        region: "us-east-1",
        runId: "st-run123",
        deploymentName: "demo-multi-stage1-us-east-1-st-run123",
        template: "net.yaml",
        parameters: {},
        stageName: "stage1",
      },
      {
        projectName: "demo",
        testName: "multi",
        providerName: "stage2-prov",
        region: "us-east-1",
        runId: "st-run123",
        deploymentName: "demo-multi-stage2-us-east-1-st-run123",
        template: "app.yaml",
        parameters: {
          VpcId: "$[stage:stage1:VpcId]",
        },
        stageName: "stage2",
      },
    ];

    const orchestrator = new RunOrchestrator();
    const results = await orchestrator.execute(plans);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);

    expect(deployOrder).toEqual(["stage1", "stage2"]);
    expect(destroyOrder).toEqual(["stage2", "stage1"]);
  });
});
