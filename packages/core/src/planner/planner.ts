import * as crypto from "crypto";
import { type StackTestConfig } from "../config/schema.js";

export interface DeploymentPlan {
  projectName: string;
  testName: string;
  providerName: string;
  region: string;
  runId: string;
  deploymentName: string;
  template: string;
  parameters: Record<string, string | number | boolean | null>;
  providerConfig?: Record<string, unknown>;
  stageName?: string;
}

export function generateRunId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // e.g. 20260606
  const randSuffix = crypto.randomBytes(3).toString("hex"); // 6 character hex suffix
  return `st-${dateStr}-${randSuffix}`;
}

export function generateSafeDeploymentName(
  projectName: string,
  testName: string,
  region: string,
  runId: string,
): string {
  const sanitize = (val: string) => val.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const pName = sanitize(projectName);
  const tName = sanitize(testName);
  const rName = sanitize(region);
  const rId = sanitize(runId);

  const rawName = `${pName}-${tName}-${rName}-${rId}`;

  // CloudFormation stack name limit is 128 characters.
  if (rawName.length > 128) {
    const suffix = `-${rId}`;
    const allowedPrefixLen = 128 - suffix.length;
    const truncatedPrefix = rawName.slice(0, allowedPrefixLen);
    return `${truncatedPrefix}${suffix}`;
  }

  return rawName;
}

export class TestPlanner {
  constructor(private config: StackTestConfig) {}

  generatePlan(runId = generateRunId()): DeploymentPlan[] {
    const plans: DeploymentPlan[] = [];
    const projectName = this.config.project.name;

    for (const [testName, testConfig] of Object.entries(this.config.tests)) {
      let regions = testConfig.regions;
      if (!regions || regions.length === 0) {
        if (testConfig.provider) {
          const providerConfig = this.config.providers[testConfig.provider];
          regions = providerConfig?.regions || ["us-east-1"];
        } else if (testConfig.stages && testConfig.stages.length > 0) {
          const firstProvider = testConfig.stages[0].provider;
          const providerConfig = this.config.providers[firstProvider];
          regions = providerConfig?.regions || ["us-east-1"];
        } else {
          regions = ["us-east-1"];
        }
      }

      for (const r of regions) {
        let regionName: string;
        let regionParams: Record<string, string | number | boolean | null> = {};

        if (typeof r === "string") {
          regionName = r;
        } else {
          regionName = r.region;
          regionParams = r.parameters || {};
        }

        if (testConfig.stages && testConfig.stages.length > 0) {
          for (const stage of testConfig.stages) {
            const providerName = stage.provider;
            const providerConfig = this.config.providers[providerName];
            const deploymentName = generateSafeDeploymentName(
              projectName,
              `${testName}-${stage.name}`,
              regionName,
              runId,
            );

            plans.push({
              projectName,
              testName,
              providerName,
              region: regionName,
              runId,
              deploymentName,
              template: stage.template,
              parameters: {
                ...(stage.parameters || {}),
                ...regionParams,
              },
              providerConfig: providerConfig || {},
              stageName: stage.name,
            });
          }
        } else if (testConfig.provider && testConfig.template) {
          const providerName = testConfig.provider;
          const providerConfig = this.config.providers[providerName];
          const deploymentName = generateSafeDeploymentName(
            projectName,
            testName,
            regionName,
            runId,
          );

          plans.push({
            projectName,
            testName,
            providerName,
            region: regionName,
            runId,
            deploymentName,
            template: testConfig.template,
            parameters: {
              ...(testConfig.parameters || {}),
              ...regionParams,
            },
            providerConfig: providerConfig || {},
          });
        }
      }
    }

    return plans;
  }
}
