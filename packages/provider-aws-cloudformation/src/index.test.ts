import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client, CreateBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  CloudFormationClient,
  CreateStackCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import * as fs from "fs";
import * as path from "path";
import { AwsCloudFormationProvider } from "./index.js";
import { type DeploymentPlan } from "@stacktest/core";

const s3Mock = mockClient(S3Client);
const cfnMock = mockClient(CloudFormationClient);
const TEMP_DIR = path.resolve(
  process.cwd(),
  "packages/provider-aws-cloudformation/src/temp-deploy-test",
);

describe("AwsCloudFormationProvider Deployment", () => {
  beforeAll(() => {
    s3Mock.reset();
    cfnMock.reset();
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  });

  it("should upload template, call create stack, and poll status until CREATE_COMPLETE", async () => {
    s3Mock.on(CreateBucketCommand).resolves({});
    s3Mock.on(PutObjectCommand).resolves({});

    cfnMock.on(CreateStackCommand).resolves({ StackId: "my-stack-id" });

    cfnMock
      .on(DescribeStacksCommand)
      .resolvesOnce({
        Stacks: [{ StackName: "my-stack", StackStatus: "CREATE_IN_PROGRESS" }],
      })
      .resolves({
        Stacks: [{ StackName: "my-stack", StackStatus: "CREATE_COMPLETE" }],
      });

    const tempFile = path.join(TEMP_DIR, "sqs.yaml");
    fs.writeFileSync(tempFile, "Resources: {}", "utf8");

    const plan: DeploymentPlan = {
      projectName: "myproj",
      testName: "basic",
      providerName: "aws-cloudformation",
      region: "us-east-1",
      runId: "st-run123",
      deploymentName: "myproj-basic-us-east-1-st-run123",
      template: "packages/provider-aws-cloudformation/src/temp-deploy-test/sqs.yaml",
      parameters: {
        Env: "prod",
      },
    };

    const provider = new AwsCloudFormationProvider();
    const result = await provider.deploy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("CREATE_COMPLETE");

    const createCalls = cfnMock.commandCalls(CreateStackCommand);
    expect(createCalls).toHaveLength(1);
    expect(createCalls[0].args[0].input.StackName).toBe(plan.deploymentName);

    const describeCalls = cfnMock.commandCalls(DescribeStacksCommand);
    expect(describeCalls).toHaveLength(2);
  });
});
