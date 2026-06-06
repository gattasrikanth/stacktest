import { VERSION } from "@stacktest/core";

export function handleArgs(args: string[]): { exitCode: number; output: string } {
  if (args.includes("--version") || args.includes("-v")) {
    return { exitCode: 0, output: `StackTest version ${VERSION}` };
  }
  return { exitCode: 1, output: "StackTest: Use --version or -v to check version" };
}
