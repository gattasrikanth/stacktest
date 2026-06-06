import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { loadConfig } from "./loader.js";

const TEMP_DIR = path.resolve(process.cwd(), "packages/core/src/config/temp-test-dir");

describe("Config Loader", () => {
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

  it("should successfully load a valid config when template files exist", () => {
    const configPath = path.join(TEMP_DIR, "stacktest.yaml");
    const templatePath = path.join(TEMP_DIR, "sqs.yaml");

    const configContent = `
project:
  name: test-proj
providers:
  fake:
    regions:
      - local
tests:
  basic:
    provider: fake
    template: sqs.yaml
`;

    fs.writeFileSync(configPath, configContent, "utf8");
    fs.writeFileSync(templatePath, "Resources: {}", "utf8");

    const result = loadConfig(configPath);
    expect(result.config.project.name).toBe("test-proj");
    expect(result.configPath).toBe(configPath);
    expect(result.configDir).toBe(TEMP_DIR);
  });

  it("should fail if config yaml references a template that does not exist", () => {
    const configPath = path.join(TEMP_DIR, "stacktest-invalid-template.yaml");
    const configContent = `
project:
  name: test-proj
providers:
  fake:
    regions:
      - local
tests:
  basic:
    provider: fake
    template: non-existent.yaml
`;

    fs.writeFileSync(configPath, configContent, "utf8");
    expect(() => loadConfig(configPath)).toThrow(/references a template file that does not exist/i);
  });

  it("should fail on invalid yaml syntax", () => {
    const configPath = path.join(TEMP_DIR, "stacktest-bad-yaml.yaml");
    const configContent = `
project:
  name: [unclosed brackets
`;

    fs.writeFileSync(configPath, configContent, "utf8");
    expect(() => loadConfig(configPath)).toThrow(/Failed to parse configuration as valid YAML/i);
  });

  it("should fail when config does not exist at path", () => {
    expect(() => loadConfig(path.join(TEMP_DIR, "does-not-exist.yaml"))).toThrow(
      /Configuration file not found at/i,
    );
  });
});
