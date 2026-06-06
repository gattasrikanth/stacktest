import * as crypto from "crypto";

export function generateRandomPassword(length: number): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

export function resolveValue(
  value: string,
  context: {
    projectName: string;
    testName: string;
    providerName: string;
    region: string;
    runId: string;
    stageOutputs?: Record<string, Record<string, unknown>>;
  },
): string {
  const regex = /\$\[([a-zA-Z0-9_:-]+)\]/g;

  return value.replace(regex, (match, token) => {
    if (token === "stacktest_project_name") return context.projectName;
    if (token === "stacktest_test_name") return context.testName;
    if (token === "stacktest_provider") return context.providerName;
    if (token === "stacktest_region") return context.region;
    if (token === "stacktest_run_id") return context.runId;
    if (token === "stacktest_genuuid") return crypto.randomUUID();

    const genpassMatch = token.match(/^stacktest_genpass_(\d+)$/);
    if (genpassMatch) {
      const len = parseInt(genpassMatch[1], 10);
      if (isNaN(len) || len <= 0) {
        throw new Error(`Invalid password length requested: "${token}"`);
      }
      return generateRandomPassword(len);
    }

    if (token.startsWith("stage:") || token.startsWith("output:")) {
      const parts = token.split(":");
      if (parts.length === 3) {
        const stageName = parts[1];
        const outputKey = parts[2];
        const stageOuts = context.stageOutputs?.[stageName];
        if (!stageOuts) {
          throw new Error(`Stage "${stageName}" outputs are not available.`);
        }
        if (stageOuts[outputKey] === undefined) {
          throw new Error(`Output key "${outputKey}" not found in stage "${stageName}".`);
        }
        return String(stageOuts[outputKey]);
      }
    }

    throw new Error(`Unknown dynamic value: "${match}"`);
  });
}

export function resolveParameters(
  params: Record<string, string | number | boolean | null>,
  context: {
    projectName: string;
    testName: string;
    providerName: string;
    region: string;
    runId: string;
    stageOutputs?: Record<string, Record<string, unknown>>;
  },
): Record<string, string | number | boolean | null> {
  const resolved: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      resolved[key] = resolveValue(value, context);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}
