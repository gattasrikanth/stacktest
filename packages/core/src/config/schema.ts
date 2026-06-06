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

export const TestConfigSchema = z.object({
  provider: z.string().min(1, "Provider name cannot be empty"),
  template: z.string().min(1, "Template path cannot be empty"),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  regions: z.array(z.string().min(1)).optional(),
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
      if (!definedProviders.includes(testConfig.provider)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tests", testName, "provider"],
          message: `Provider "${testConfig.provider}" used by test "${testName}" is not defined in the "providers" configuration block.`,
        });
      }
    }
  });

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type TestConfig = z.infer<typeof TestConfigSchema>;
export type StackTestConfig = z.infer<typeof StackTestConfigSchema>;
