import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  GetBucketTaggingCommand,
  ListObjectsV2Command,
  DeleteBucketCommand,
} from "@aws-sdk/client-s3";
import {
  CloudFormationClient,
  CreateStackCommand,
  DescribeStacksCommand,
  DescribeStackEventsCommand,
  DeleteStackCommand,
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
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    s3Mock.reset();
    cfnMock.reset();
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

  it("should fail deployment when stack status is CREATE_FAILED and extract event failures", async () => {
    s3Mock.on(CreateBucketCommand).resolves({});
    s3Mock.on(PutObjectCommand).resolves({});

    cfnMock.on(CreateStackCommand).resolves({ StackId: "my-stack-id" });
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: "my-stack", StackStatus: "CREATE_FAILED" }],
    });

    const timestamp = new Date();
    cfnMock.on(DescribeStackEventsCommand).resolves({
      StackEvents: [
        {
          Timestamp: timestamp,
          ResourceType: "AWS::SQS::Queue",
          LogicalResourceId: "MyQueue",
          ResourceStatus: "CREATE_FAILED",
          ResourceStatusReason: "QueueName already exists",
        },
        {
          Timestamp: timestamp,
          ResourceType: "AWS::CloudFormation::Stack",
          LogicalResourceId: "my-stack",
          ResourceStatus: "CREATE_FAILED",
          ResourceStatusReason: "The following resource(s) failed to create: [MyQueue]",
        },
      ],
    });

    const tempFile = path.join(TEMP_DIR, "sqs-fail.yaml");
    fs.writeFileSync(tempFile, "Resources: {}", "utf8");

    const plan: DeploymentPlan = {
      projectName: "myproj",
      testName: "basic",
      providerName: "aws-cloudformation",
      region: "us-east-1",
      runId: "st-run123",
      deploymentName: "myproj-basic-us-east-1-st-run123",
      template: "packages/provider-aws-cloudformation/src/temp-deploy-test/sqs-fail.yaml",
      parameters: {},
    };

    const provider = new AwsCloudFormationProvider();
    const result = await provider.deploy(plan);

    expect(result.success).toBe(false);
    expect(result.status).toBe("CREATE_FAILED");
    expect(result.error?.message).toContain("QueueName already exists");
    expect(result.error?.message).not.toContain("my-stack (AWS::CloudFormation::Stack)");
  });

  it("should successfully destroy stack when it exists with correct tags and deletes staging bucket", async () => {
    cfnMock
      .on(DescribeStacksCommand)
      .resolvesOnce({
        Stacks: [
          {
            StackName: "myproj-basic-us-east-1-st-run123",
            StackStatus: "CREATE_COMPLETE",
            Tags: [
              { Key: "stacktest-project", Value: "myproj" },
              { Key: "stacktest-run-id", Value: "st-run123" },
              { Key: "stacktest-test-name", Value: "basic" },
            ],
          },
        ],
      })
      .resolvesOnce({
        Stacks: [
          {
            StackName: "myproj-basic-us-east-1-st-run123",
            StackStatus: "DELETE_IN_PROGRESS",
          },
        ],
      })
      .resolves({
        Stacks: [],
      });

    cfnMock.on(DeleteStackCommand).resolves({});

    s3Mock.on(GetBucketTaggingCommand).resolves({
      TagSet: [
        { Key: "stacktest-project", Value: "myproj" },
        { Key: "stacktest-run-id", Value: "st-run123" },
        { Key: "stacktest-test-name", Value: "basic" },
      ],
    });
    s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });
    s3Mock.on(DeleteBucketCommand).resolves({});

    const plan: DeploymentPlan = {
      projectName: "myproj",
      testName: "basic",
      providerName: "aws-cloudformation",
      region: "us-east-1",
      runId: "st-run123",
      deploymentName: "myproj-basic-us-east-1-st-run123",
      template: "sqs.yaml",
      parameters: {},
    };

    const provider = new AwsCloudFormationProvider();
    const result = await provider.destroy(plan);

    expect(result.success).toBe(true);
    expect(result.status).toBe("DELETE_COMPLETE");

    expect(cfnMock.commandCalls(DeleteStackCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(DeleteBucketCommand)).toHaveLength(1);
  });

  it("should abort deletion if stack exists but is missing safety tags", async () => {
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [
        {
          StackName: "myproj-basic-us-east-1-st-run123",
          StackStatus: "CREATE_COMPLETE",
          Tags: [], // Missing tags
        },
      ],
    });

    const plan: DeploymentPlan = {
      projectName: "myproj",
      testName: "basic",
      providerName: "aws-cloudformation",
      region: "us-east-1",
      runId: "st-run123",
      deploymentName: "myproj-basic-us-east-1-st-run123",
      template: "sqs.yaml",
      parameters: {},
    };

    const provider = new AwsCloudFormationProvider();
    const result = await provider.destroy(plan);

    expect(result.success).toBe(false);
    expect(result.status).toBe("DELETE_FAILED");
    expect(result.error?.message).toContain("missing required StackTest ownership tags");
  });

  it("should abort deletion if stack exists but has mismatched safety tags", async () => {
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [
        {
          StackName: "myproj-basic-us-east-1-st-run123",
          StackStatus: "CREATE_COMPLETE",
          Tags: [
            { Key: "stacktest-project", Value: "different-project" },
            { Key: "stacktest-run-id", Value: "st-run123" },
            { Key: "stacktest-test-name", Value: "basic" },
          ],
        },
      ],
    });

    const plan: DeploymentPlan = {
      projectName: "myproj",
      testName: "basic",
      providerName: "aws-cloudformation",
      region: "us-east-1",
      runId: "st-run123",
      deploymentName: "myproj-basic-us-east-1-st-run123",
      template: "sqs.yaml",
      parameters: {},
    };

    const provider = new AwsCloudFormationProvider();
    const result = await provider.destroy(plan);

    expect(result.success).toBe(false);
    expect(result.status).toBe("DELETE_FAILED");
    expect(result.error?.message).toContain("ownership tags do not match deployment plan");
  });
});
