import { describe, it, expect } from "vitest";
import { generateRunId, generateSafeDeploymentName, TestPlanner } from "./planner.js";
import { type StackTestConfig } from "../config/schema.js";

describe("Planner Utilities", () => {
  it("should generate run ID matching the date and random suffix", () => {
    const runId = generateRunId();
    expect(runId).toMatch(/^st-\d{8}-[a-f0-9]{6}$/);
  });

  it("should sanitize and format safe deployment names", () => {
    const name = generateSafeDeploymentName("My_Project", "Basic_Test", "us-east-1", "st-12345");
    expect(name).toBe("my-project-basic-test-us-east-1-st-12345");
  });

  it("should truncate long names gracefully to 128 characters while keeping run ID suffix", () => {
    const longProject = "a".repeat(100);
    const longTest = "b".repeat(50);
    const region = "us-east-1";
    const runId = "st-20260606-abcdef";

    const name = generateSafeDeploymentName(longProject, longTest, region, runId);
    expect(name.length).toBe(128);
    expect(name.endsWith(`-${runId}`)).toBe(true);
  });
});

describe("TestPlanner", () => {
  it("should expand matrix by regions correctly using test overrides", () => {
    const config: StackTestConfig = {
      project: { name: "demo" },
      providers: {
        fake: { regions: ["us-east-1"] },
      },
      tests: {
        basic: {
          provider: "fake",
          template: "template.yaml",
          regions: ["us-west-2", "eu-west-1"],
        },
      },
    };

    const planner = new TestPlanner(config);
    const plans = planner.generatePlan("test-run");

    expect(plans).toHaveLength(2);
    expect(plans[0].region).toBe("us-west-2");
    expect(plans[1].region).toBe("eu-west-1");
  });

  it("should fall back to provider regions when test overrides are absent", () => {
    const config: StackTestConfig = {
      project: { name: "demo" },
      providers: {
        fake: { regions: ["us-east-1", "us-west-2"] },
      },
      tests: {
        basic: {
          provider: "fake",
          template: "template.yaml",
        },
      },
    };

    const planner = new TestPlanner(config);
    const plans = planner.generatePlan("test-run");

    expect(plans).toHaveLength(2);
    expect(plans[0].region).toBe("us-east-1");
    expect(plans[1].region).toBe("us-west-2");
  });

  it("should fallback to us-east-1 when regions are completely omitted", () => {
    const config: StackTestConfig = {
      project: { name: "demo" },
      providers: {
        fake: {},
      },
      tests: {
        basic: {
          provider: "fake",
          template: "template.yaml",
        },
      },
    };

    const planner = new TestPlanner(config);
    const plans = planner.generatePlan("test-run");

    expect(plans).toHaveLength(1);
    expect(plans[0].region).toBe("us-east-1");
  });

  it("should merge parameters with region-specific overrides correctly", () => {
    const config: StackTestConfig = {
      project: { name: "demo" },
      providers: {
        fake: { regions: ["us-east-1"], customConfigKey: "my-value" },
      },
      tests: {
        basic: {
          provider: "fake",
          template: "template.yaml",
          parameters: {
            Env: "prod",
            QueueName: "default-queue",
          },
          regions: [
            "us-east-1",
            {
              region: "us-west-2",
              parameters: {
                QueueName: "west-queue",
              },
            },
          ],
        },
      },
    };

    const planner = new TestPlanner(config);
    const plans = planner.generatePlan("test-run");

    expect(plans).toHaveLength(2);

    // us-east-1 has default parameters
    expect(plans[0].region).toBe("us-east-1");
    expect(plans[0].parameters.Env).toBe("prod");
    expect(plans[0].parameters.QueueName).toBe("default-queue");
    expect(plans[0].providerConfig?.customConfigKey).toBe("my-value");

    // us-west-2 has overridden QueueName parameter
    expect(plans[1].region).toBe("us-west-2");
    expect(plans[1].parameters.Env).toBe("prod");
    expect(plans[1].parameters.QueueName).toBe("west-queue");
    expect(plans[1].providerConfig?.customConfigKey).toBe("my-value");
  });
});
