import { describe, it, expect } from "vitest";
import { handleArgs } from "./cli.js";
import { VERSION } from "@stacktest/core";

describe("CLI Argument Handling", () => {
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
    expect(res.output).toContain("Use --version or -v");
  });
});
