import { describe, it, expect } from "vitest";
import { resolveParameters } from "./resolver.js";

describe("Dynamic Value Resolver", () => {
  const context = {
    projectName: "my-proj",
    testName: "basic",
    providerName: "aws-cfn",
    region: "us-east-1",
    runId: "st-run123",
  };

  it("should resolve built-in environment context values", () => {
    const params = {
      Project: "$[stacktest_project_name]",
      Test: "$[stacktest_test_name]",
      Provider: "$[stacktest_provider]",
      Region: "$[stacktest_region]",
      RunId: "$[stacktest_run_id]",
    };

    const resolved = resolveParameters(params, context);
    expect(resolved.Project).toBe("my-proj");
    expect(resolved.Test).toBe("basic");
    expect(resolved.Provider).toBe("aws-cfn");
    expect(resolved.Region).toBe("us-east-1");
    expect(resolved.RunId).toBe("st-run123");
  });

  it("should generate random UUIDs", () => {
    const params = {
      Id: "$[stacktest_genuuid]",
    };

    const resolved = resolveParameters(params, context);
    expect(resolved.Id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("should generate random passwords of specified lengths", () => {
    const params = {
      Pass16: "$[stacktest_genpass_16]",
      Pass32: "$[stacktest_genpass_32]",
    };

    const resolved = resolveParameters(params, context);
    expect(typeof resolved.Pass16).toBe("string");
    expect((resolved.Pass16 as string).length).toBe(16);
    expect(typeof resolved.Pass32).toBe("string");
    expect((resolved.Pass32 as string).length).toBe(32);
  });

  it("should throw an error for unknown variables", () => {
    const params = {
      BadVal: "$[stacktest_unrecognized]",
    };

    expect(() => resolveParameters(params, context)).toThrow(
      /Unknown dynamic value: "\$\[stacktest_unrecognized\]"/,
    );
  });

  it("should leave non-string values unmodified", () => {
    const params = {
      Num: 123,
      Bool: true,
      Null: null,
    };

    const resolved = resolveParameters(params, context);
    expect(resolved.Num).toBe(123);
    expect(resolved.Bool).toBe(true);
    expect(resolved.Null).toBeNull();
  });
});
