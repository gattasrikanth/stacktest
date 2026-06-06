import { VERSION, loadConfig } from "@stacktest/core";

export function handleArgs(args: string[]): { exitCode: number; output: string } {
  if (args.includes("--version") || args.includes("-v")) {
    return { exitCode: 0, output: `StackTest version ${VERSION}` };
  }

  const command = args[0];

  if (command === "lint") {
    let configPath: string | undefined;
    const configIdx = args.findIndex((arg) => arg === "--config" || arg === "-c");
    if (configIdx !== -1 && configIdx + 1 < args.length) {
      configPath = args[configIdx + 1];
    }

    try {
      const result = loadConfig(configPath);
      return {
        exitCode: 0,
        output: `✓ Configuration at ${result.configPath} is valid.`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        exitCode: 1,
        output: `✗ Configuration validation failed:\n${message}`,
      };
    }
  }

  return {
    exitCode: 1,
    output: "Usage:\n  stacktest --version | -v\n  stacktest lint [--config <path>]",
  };
}
