import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AwsCloudFormationProvider } from "./index.js";
import { type DeploymentPlan } from "@stacktest/core";
import * as fs from "fs";
import * as path from "path";
import { DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { getCloudFormationClient } from "./credentials.js";

const TEMP_DIR = path.resolve(
  process.cwd(),
  "packages/provider-aws-cloudformation/src/temp-integration-test",
);

// Only run these tests if RUN_AWS_INTEGRATION_TESTS is explicitly true
const runIntegrationTests = process.env.RUN_AWS_INTEGRATION_TESTS === "true";

const describeOrSkip = runIntegrationTests ? describe : describe.skip;

describeOrSkip("AWS CloudFormation Provider Live Integration Tests", () => {
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

  it("should deploy a real CloudFormation stack (SQS queue) and destroy it cleanly", async () => {
    const provider = new AwsCloudFormationProvider();

    // Create a very simple template for an SQS Queue
    const templateContent = `
AWSTemplateFormatVersion: '2010-09-09'
Description: 'StackTest Integration Test SQS Queue'
Resources:
  IntegrationTestQueue:
    Type: 'AWS::SQS::Queue'
    Properties:
      QueueName: !Sub 'st-int-test-\${AWS::Region}-\${AWS::StackName}'
`;
    const templateFile = path.join(TEMP_DIR, "sqs-int-test.yaml");
    fs.writeFileSync(templateFile, templateContent, "utf8");

    const plan: DeploymentPlan = {
      projectName: "st-int-proj",
      testName: "int-test",
      providerName: "aws-cloudformation",
      region: process.env.AWS_REGION || "us-east-1",
      runId: `run-${Date.now()}`,
      deploymentName: `st-int-proj-int-test-${Date.now()}`,
      template: templateFile,
      parameters: {},
    };

    // 1. Deploy the stack
    console.log(`Deploying integration stack: ${plan.deploymentName}`);
    const deployResult = await provider.deploy(plan);
    expect(deployResult.success).toBe(true);
    expect(deployResult.status).toBe("CREATE_COMPLETE");

    // Double check that stack exists and has tags
    const cfnClient = getCloudFormationClient(plan.region);
    const describeRes = await cfnClient.send(
      new DescribeStacksCommand({
        StackName: plan.deploymentName,
      }),
    );
    const stack = describeRes.Stacks?.[0];
    expect(stack).toBeDefined();

    const tags = stack?.Tags || [];
    expect(tags).toContainEqual({ Key: "stacktest-project", Value: plan.projectName });
    expect(tags).toContainEqual({ Key: "stacktest-run-id", Value: plan.runId });
    expect(tags).toContainEqual({ Key: "stacktest-test-name", Value: plan.testName });

    // 2. Destroy the stack
    console.log(`Destroying integration stack: ${plan.deploymentName}`);
    const destroyResult = await provider.destroy(plan);
    expect(destroyResult.success).toBe(true);
    expect(destroyResult.status).toBe("DELETE_COMPLETE");

    // Verify stack no longer exists
    let deleted = false;
    try {
      await cfnClient.send(
        new DescribeStacksCommand({
          StackName: plan.deploymentName,
        }),
      );
    } catch (err) {
      if (err && typeof err === "object") {
        const errObj = err as Record<string, unknown>;
        const errName = typeof errObj.name === "string" ? errObj.name : "";
        const errMsg = typeof errObj.message === "string" ? errObj.message : "";
        if (errName === "ValidationError" || errMsg.includes("does not exist")) {
          deleted = true;
        }
      }
    }
    expect(deleted).toBe(true);
  }, 120000); // 2 minute timeout since CloudFormation can take time

  it("should fail stack destruction when trying to delete a stack that has mismatched tags", async () => {
    const provider = new AwsCloudFormationProvider();

    const templateContent = `
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  IntegrationTestQueue2:
    Type: 'AWS::SQS::Queue'
`;
    const templateFile = path.join(TEMP_DIR, "sqs-int-test-2.yaml");
    fs.writeFileSync(templateFile, templateContent, "utf8");

    const plan: DeploymentPlan = {
      projectName: "st-int-proj",
      testName: "int-test-2",
      providerName: "aws-cloudformation",
      region: process.env.AWS_REGION || "us-east-1",
      runId: `run-${Date.now()}`,
      deploymentName: `st-int-proj-int-test-2-${Date.now()}`,
      template: templateFile,
      parameters: {},
    };

    // 1. Deploy
    console.log(`Deploying integration stack 2: ${plan.deploymentName}`);
    const deployResult = await provider.deploy(plan);
    expect(deployResult.success).toBe(true);

    // 2. Try to destroy with mismatched plan
    const mismatchedPlan = {
      ...plan,
      projectName: "wrong-project",
    };

    console.log(`Attempting safe destroy with mismatched project name...`);
    const destroyFailResult = await provider.destroy(mismatchedPlan);
    expect(destroyFailResult.success).toBe(false);
    expect(destroyFailResult.error?.message).toContain(
      "ownership tags do not match deployment plan",
    );

    // 3. Clean up the stack properly using correct plan
    console.log(`Cleaning up integration stack 2: ${plan.deploymentName}`);
    const destroySuccessResult = await provider.destroy(plan);
    expect(destroySuccessResult.success).toBe(true);
  }, 240000);
});
