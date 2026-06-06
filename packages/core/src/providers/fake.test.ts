import { describe, it, expect } from "vitest";
import { FakeProvider } from "./fake.js";
import { type DeploymentPlan } from "../planner/planner.js";

describe("FakeProvider", () => {
  const provider = new FakeProvider();

  const mockPlan: DeploymentPlan = {
    projectName: "demo",
    testName: "basic",
    providerName: "fake",
    region: "us-east-1",
    runId: "st-run",
    deploymentName: "demo-basic-us-east-1-st-run",
    template: "sqs.yaml",
    parameters: {},
  };

  it("should deploy successfully by default", async () => {
    const result = await provider.deploy(mockPlan);
    expect(result.success).toBe(true);
    expect(result.status).toBe("CREATE_COMPLETE");
    expect(result.deploymentName).toBe(mockPlan.deploymentName);
  });

  it("should simulate rollback failure when SimulateFailure is set to true", async () => {
    const failPlan = {
      ...mockPlan,
      parameters: { SimulateFailure: "true" },
    };
    const result = await provider.deploy(failPlan);
    expect(result.success).toBe(false);
    expect(result.status).toBe("ROLLBACK_COMPLETE");
    expect(result.error?.message).toContain("Simulated deployment failure");
  });

  it("should destroy successfully", async () => {
    const result = await provider.destroy(mockPlan);
    expect(result.success).toBe(true);
    expect(result.status).toBe("DELETE_COMPLETE");
  });

  it("should provide mock deployment events", async () => {
    const events = await provider.getEvents(mockPlan);
    expect(events.length).toBe(2);
    expect(events[0].status).toBe("CREATE_IN_PROGRESS");
    expect(events[1].status).toBe("CREATE_COMPLETE");
  });

  it("should provide mock failure deployment events on failure config", async () => {
    const failPlan = {
      ...mockPlan,
      parameters: { SimulateFailure: "true" },
    };
    const events = await provider.getEvents(failPlan);
    expect(events.length).toBe(2);
    expect(events[0].status).toBe("CREATE_IN_PROGRESS");
    expect(events[1].status).toBe("CREATE_FAILED");
    expect(events[1].statusReason).toBe(
      "Simulated resource creation failed because of bad parameters.",
    );
  });
});
