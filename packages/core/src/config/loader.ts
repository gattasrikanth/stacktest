import * as fs from "fs";
import * as path from "path";
import { parse as parseYaml } from "yaml";
import { ZodError } from "zod";
import { StackTestConfigSchema, type StackTestConfig } from "./schema.js";

export interface ConfigLoaderResult {
  config: StackTestConfig;
  configPath: string;
  configDir: string;
}

export function formatZodError(error: ZodError): string {
  const messages = error.issues.map((issue) => {
    const pathStr = issue.path.join(".");
    return `- At path '${pathStr}': ${issue.message}`;
  });
  return `Configuration validation failed:\n${messages.join("\n")}`;
}

export function loadConfig(targetPath?: string): ConfigLoaderResult {
  let configFilePath = targetPath ? path.resolve(targetPath) : null;

  if (!configFilePath) {
    const cwd = process.cwd();
    const potentialPaths = [path.join(cwd, "stacktest.yaml"), path.join(cwd, "stacktest.yml")];

    for (const p of potentialPaths) {
      if (fs.existsSync(p)) {
        configFilePath = p;
        break;
      }
    }

    if (!configFilePath) {
      throw new Error(
        "Could not find configuration file stacktest.yaml or stacktest.yml in the current directory.",
      );
    }
  } else {
    if (!fs.existsSync(configFilePath)) {
      throw new Error(`Configuration file not found at: ${configFilePath}`);
    }
  }

  const configDir = path.dirname(configFilePath);
  const fileContent = fs.readFileSync(configFilePath, "utf8");

  let rawConfig: unknown;
  try {
    rawConfig = parseYaml(fileContent);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse configuration as valid YAML: ${message}`);
  }

  const parsed = StackTestConfigSchema.safeParse(rawConfig);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  const config = parsed.data;

  // Validate that all test template files exist on disk and resolve their absolute paths
  for (const [testName, testConfig] of Object.entries(config.tests)) {
    if (testConfig.template) {
      const templatePath = path.resolve(configDir, testConfig.template);
      if (!fs.existsSync(templatePath)) {
        throw new Error(
          `Validation failed: Test "${testName}" references a template file that does not exist at "${testConfig.template}" (resolved to "${templatePath}").`,
        );
      }
      testConfig.template = templatePath;
    }
    if (testConfig.stages) {
      for (const stage of testConfig.stages) {
        const templatePath = path.resolve(configDir, stage.template);
        if (!fs.existsSync(templatePath)) {
          throw new Error(
            `Validation failed: Test "${testName}" Stage "${stage.name}" references a template file that does not exist at "${stage.template}" (resolved to "${templatePath}").`,
          );
        }
        stage.template = templatePath;
      }
    }
  }

  return {
    config,
    configPath: configFilePath,
    configDir,
  };
}
