import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AwsCdkProvider } from "./index.js";
import { type DeploymentPlan } from "@stack-test/core";
import * as fs from "fs";
import * as path from "path";

const TEMP_DIR = path.resolve(process.cwd(), "packages/provider-aws-cdk/src/temp-integration-test");

const runIntegrationTests = process.env.RUN_CDK_INTEGRATION_TESTS === "true";
const describeOrSkip = runIntegrationTests ? describe : describe.skip;

describeOrSkip("AWS CDK Provider Live Integration Tests", () => {
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

  it("should synthesize a real CDK app and deploy it via CloudFormation and destroy cleanly", async () => {
    const provider = new AwsCdkProvider();

    // Create a very basic cdk app structure with cdk.json and a basic ts entrypoint
    const cdkJson = {
      app: "npx ts-node app.ts",
    };
    fs.writeFileSync(path.join(TEMP_DIR, "cdk.json"), JSON.stringify(cdkJson, null, 2), "utf8");

    const appTsContent = `
import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'IntegrationCdkStack');
new sqs.Queue(stack, 'IntegrationQueue', {
  queueName: 'cdk-int-test-queue',
});
`;
    fs.writeFileSync(path.join(TEMP_DIR, "app.ts"), appTsContent, "utf8");

    const pkgJson = {
      dependencies: {
        "aws-cdk-lib": "^2.100.0",
        constructs: "^10.0.0",
      },
      devDependencies: {
        "ts-node": "^10.9.1",
        typescript: "^5.0.0",
      },
    };
    fs.writeFileSync(path.join(TEMP_DIR, "package.json"), JSON.stringify(pkgJson, null, 2), "utf8");

    const plan: DeploymentPlan = {
      projectName: "cdk-int-proj",
      testName: "cdk-test",
      providerName: "aws-cdk",
      region: process.env.AWS_REGION || "us-east-1",
      runId: `run-${Date.now()}`,
      deploymentName: `cdk-int-proj-cdk-test-${Date.now()}`,
      template: TEMP_DIR,
      parameters: {},
    };

    console.log(`Deploying CDK integration workspace: ${plan.deploymentName}`);
    const deployResult = await provider.deploy(plan);
    expect(deployResult.success).toBe(true);

    console.log(`Destroying CDK integration workspace: ${plan.deploymentName}`);
    const destroyResult = await provider.destroy(plan);
    expect(destroyResult.success).toBe(true);
  }, 180000);
});
