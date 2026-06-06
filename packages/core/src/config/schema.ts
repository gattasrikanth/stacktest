import { z } from "zod";

export const ProjectConfigSchema = z.object({
  name: z
    .string()
    .min(1, "Project name cannot be empty")
    .max(30, "Project name cannot exceed 30 characters")
    .regex(
      /^[a-z][a-z0-9-]*$/,
      "Project name must start with a lowercase letter and contain only lowercase alphanumeric characters and hyphens",
    ),
});

export const ProviderConfigSchema = z.record(
  z
    .object({
      regions: z.array(z.string().min(1)).optional(),
    })
    .and(z.record(z.any())),
);

export const TestStageConfigSchema = z.object({
  name: z
    .string()
    .min(1, "Stage name cannot be empty")
    .regex(/^[a-zA-Z0-9_-]+$/, "Stage name must be alphanumeric with dashes or underscores"),
  provider: z.string().min(1, "Provider name cannot be empty"),
  template: z.string().min(1, "Template path cannot be empty"),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export const TestConfigSchema = z
  .object({
    provider: z.string().min(1, "Provider name cannot be empty").optional(),
    template: z.string().min(1, "Template path cannot be empty").optional(),
    parameters: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
    stages: z.array(TestStageConfigSchema).optional(),
    regions: z
      .array(
        z.union([
          z.string().min(1),
          z.object({
            region: z.string().min(1, "Region name cannot be empty"),
            parameters: z
              .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
              .optional(),
          }),
        ]),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasSingle = data.provider !== undefined && data.template !== undefined;
    const hasStages = data.stages !== undefined && data.stages.length > 0;

    if (!hasSingle && !hasStages) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Test suite must either define a provider and template, or define a list of sequential stages.",
      });
    }

    if (hasSingle && hasStages) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Test suite cannot define both a top-level provider/template and a list of sequential stages.",
      });
    }

    if (hasStages && data.stages) {
      const names = new Set<string>();
      for (const [index, stage] of data.stages.entries()) {
        if (names.has(stage.name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["stages", index, "name"],
            message: `Duplicate stage name "${stage.name}" found in test suite stages.`,
          });
        }
        names.add(stage.name);
      }
    }
  });

export const StackTestConfigSchema = z
  .object({
    project: ProjectConfigSchema,
    providers: ProviderConfigSchema,
    tests: z.record(TestConfigSchema).refine((tests) => Object.keys(tests).length > 0, {
      message: "At least one test suite must be defined",
    }),
  })
  .superRefine((data, ctx) => {
    const definedProviders = Object.keys(data.providers);
    for (const [testName, testConfig] of Object.entries(data.tests)) {
      if (testConfig.provider) {
        if (!definedProviders.includes(testConfig.provider)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["tests", testName, "provider"],
            message: `Provider "${testConfig.provider}" used by test "${testName}" is not defined in the "providers" configuration block.`,
          });
        }
      }
      if (testConfig.stages) {
        for (const [stageIdx, stage] of testConfig.stages.entries()) {
          if (!definedProviders.includes(stage.provider)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["tests", testName, "stages", stageIdx, "provider"],
              message: `Provider "${stage.provider}" used by stage "${stage.name}" in test "${testName}" is not defined in the "providers" configuration block.`,
            });
          }
        }
      }
    }
  });

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type TestConfig = z.infer<typeof TestConfigSchema>;
export type StackTestConfig = z.infer<typeof StackTestConfigSchema>;
