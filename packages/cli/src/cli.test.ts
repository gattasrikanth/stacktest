import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { handleArgs } from "./cli.js";
import { VERSION } from "@stacktest/core";

const TEMP_DIR = path.resolve(process.cwd(), "packages/cli/src/temp-cli-dir");

describe("CLI Argument Handling", () => {
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

  it("should output the correct version when --version is passed", () => {
    const res = handleArgs(["--version"]);
    expect(res.exitCode).toBe(0);
    expect(res.output).toContain(VERSION);
  });

  it("should output the correct version when -v is passed", () => {
    const res = handleArgs(["-v"]);
    expect(res.exitCode).toBe(0);
    expect(res.output).toContain(VERSION);
  });

  it("should exit with code 1 and show usage instructions when no arguments are provided", () => {
    const res = handleArgs([]);
    expect(res.exitCode).toBe(1);
    expect(res.output).toContain("Usage:");
  });

  it("should return success when linting a valid configuration file", () => {
    const configPath = path.join(TEMP_DIR, "stacktest.yaml");
    const templatePath = path.join(TEMP_DIR, "sqs.yaml");

    const configContent = `
project:
  name: demo-cli-project
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

    const res = handleArgs(["lint", "--config", configPath]);
    expect(res.exitCode).toBe(0);
    expect(res.output).toContain("is valid");
  });

  it("should return failure when linting an invalid configuration file", () => {
    const configPath = path.join(TEMP_DIR, "stacktest-invalid.yaml");
    const configContent = `
project:
  name: Invalid-Name
`;
    fs.writeFileSync(configPath, configContent, "utf8");

    const res = handleArgs(["lint", "--config", configPath]);
    expect(res.exitCode).toBe(1);
    expect(res.output).toContain("Configuration validation failed");
  });

  it("should output a structured text plan when plan command is run", async () => {
    const configPath = path.join(TEMP_DIR, "stacktest-plan.yaml");
    const templatePath = path.join(TEMP_DIR, "sqs.yaml");

    const configContent = `
project:
  name: plan-project
providers:
  fake:
    regions:
      - us-east-1
      - us-west-2
tests:
  basic:
    provider: fake
    template: sqs.yaml
`;
    fs.writeFileSync(configPath, configContent, "utf8");
    fs.writeFileSync(templatePath, "Resources: {}", "utf8");

    const res = handleArgs(["plan", "--config", configPath]);
    expect(res.exitCode).toBe(0);
    expect(res.output).toContain('Plan for project "plan-project"');
    expect(res.output).toContain("us-east-1");
    expect(res.output).toContain("us-west-2");
  });

  it("should output a JSON plan when plan command is run with --json", async () => {
    const configPath = path.join(TEMP_DIR, "stacktest-plan-json.yaml");
    const templatePath = path.join(TEMP_DIR, "sqs.yaml");

    const configContent = `
project:
  name: json-project
providers:
  fake:
    regions:
      - local-region
tests:
  basic:
    provider: fake
    template: sqs.yaml
`;
    fs.writeFileSync(configPath, configContent, "utf8");
    fs.writeFileSync(templatePath, "Resources: {}", "utf8");

    const res = handleArgs(["plan", "--config", configPath, "--json"]);
    expect(res.exitCode).toBe(0);

    const parsed = JSON.parse(res.output);
    expect(parsed).toBeInstanceOf(Array);
    expect(parsed[0].projectName).toBe("json-project");
    expect(parsed[0].region).toBe("local-region");
  });
});
