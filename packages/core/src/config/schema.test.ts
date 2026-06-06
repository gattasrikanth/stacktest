import { describe, it, expect } from "vitest";
import { StackTestConfigSchema } from "./schema.js";

describe("StackTest Config Schema Validation", () => {
  it("should validate a correct configuration successfully", () => {
    const validConfig = {
      project: {
        name: "demo-project",
      },
      providers: {
        "aws-cloudformation": {
          regions: ["us-east-1", "us-west-2"],
        },
      },
      tests: {
        basic: {
          provider: "aws-cloudformation",
          template: "templates/sqs.yaml",
          parameters: {
            Environment: "test",
            QueueName: "my-queue",
          },
        },
      },
    };

    const result = StackTestConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("should validate a configuration with region overrides successfully", () => {
    const validConfig = {
      project: {
        name: "demo-project",
      },
      providers: {
        "aws-cloudformation": {
          regions: ["us-east-1"],
        },
      },
      tests: {
        basic: {
          provider: "aws-cloudformation",
          template: "templates/sqs.yaml",
          parameters: {
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

    const result = StackTestConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("should reject invalid project names", () => {
    const invalidConfigs = [
      { name: "Demo-Project" }, // uppercase letters
      { name: "demo_project" }, // underscores
      { name: "" }, // empty
      { name: "a".repeat(31) }, // too long
      { name: "-demo" }, // starts with hyphen
    ];

    for (const project of invalidConfigs) {
      const config = {
        project,
        providers: {
          fake: { regions: ["local"] },
        },
        tests: {
          basic: {
            provider: "fake",
            template: "templates/main.yaml",
          },
        },
      };

      const result = StackTestConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    }
  });

  it("should reject config with empty tests block", () => {
    const config = {
      project: { name: "demo" },
      providers: {
        fake: { regions: ["local"] },
      },
      tests: {},
    };

    const result = StackTestConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("should reject tests using a provider that is not declared in the providers block", () => {
    const config = {
      project: { name: "demo" },
      providers: {
        fake: { regions: ["local"] },
      },
      tests: {
        basic: {
          provider: "aws-cloudformation", // not defined in providers block
          template: "templates/main.yaml",
        },
      },
    };

    const result = StackTestConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue.message).toContain(
        'Provider "aws-cloudformation" used by test "basic" is not defined',
      );
    }
  });

  it("should validate a configuration with sequential stages successfully", () => {
    const validConfig = {
      project: { name: "demo-project" },
      providers: {
        "aws-cloudformation": { regions: ["us-east-1"] },
        "kubernetes": { regions: ["local"] },
      },
      tests: {
        compositeTest: {
          stages: [
            {
              name: "stage1",
              provider: "aws-cloudformation",
              template: "templates/sqs.yaml",
              parameters: { QueueName: "my-queue" },
            },
            {
              name: "stage2",
              provider: "kubernetes",
              template: "templates/k8s.yaml",
              parameters: { QueueUrl: "$[stage:stage1:QueueUrl]" },
            },
          ],
        },
      },
    };

    const result = StackTestConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it("should reject stages with duplicate names", () => {
    const config = {
      project: { name: "demo-project" },
      providers: {
        fake: { regions: ["local"] },
      },
      tests: {
        compositeTest: {
          stages: [
            { name: "dup", provider: "fake", template: "temp.yaml" },
            { name: "dup", provider: "fake", template: "temp2.yaml" },
          ],
        },
      },
    };

    const result = StackTestConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Duplicate stage name "dup"');
    }
  });

  it("should reject a test defining both a single provider and stages", () => {
    const config = {
      project: { name: "demo-project" },
      providers: {
        fake: { regions: ["local"] },
      },
      tests: {
        compositeTest: {
          provider: "fake",
          template: "temp.yaml",
          stages: [
            { name: "stage1", provider: "fake", template: "temp.yaml" },
          ],
        },
      },
    };

    const result = StackTestConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});
