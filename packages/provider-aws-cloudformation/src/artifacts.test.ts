import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand,
  PutBucketTaggingCommand,
  GetBucketTaggingCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteBucketCommand,
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import { S3ArtifactManager, generateSafeBucketName } from "./artifacts.js";
import { type DeploymentPlan } from "@stacktest/core";

const s3Mock = mockClient(S3Client);
const TEMP_DIR = path.resolve(
  process.cwd(),
  "packages/provider-aws-cloudformation/src/temp-s3-test",
);

describe("S3 Artifact Manager Naming", () => {
  it("should generate a valid staging bucket name", () => {
    const bucket = generateSafeBucketName("MyProject", "us-east-1", "st-12345");
    expect(bucket).toBe("stacktest-myproject-useast1-st12345");
  });

  it("should truncate and hash too long bucket names to stay under 63 chars", () => {
    const bucket = generateSafeBucketName("a".repeat(40), "us-west-2", "st-run-id-long-value");
    expect(bucket.length).toBeLessThanOrEqual(63);
    expect(bucket).toMatch(/^stacktest-a{20}-[a-f0-9]{8}$/);
  });
});

describe("S3ArtifactManager Client Operations", () => {
  beforeAll(() => {
    s3Mock.reset();
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  });

  it("should ensure bucket exists by calling create bucket with correct parameters", async () => {
    s3Mock.on(CreateBucketCommand).resolves({});

    const manager = new S3ArtifactManager("us-west-2");
    await expect(manager.ensureBucketExists("my-bucket")).resolves.toBeUndefined();

    const calls = s3Mock.commandCalls(CreateBucketCommand);
    expect(calls).toHaveLength(1);
    expect(calls[0].args[0].input.Bucket).toBe("my-bucket");
  });

  it("should tag bucket when plan is provided to ensureBucketExists", async () => {
    s3Mock.on(CreateBucketCommand).resolves({});
    s3Mock.on(PutBucketTaggingCommand).resolves({});

    const plan: DeploymentPlan = {
      projectName: "myproj",
      testName: "mytest",
      providerName: "aws-cloudformation",
      region: "us-east-1",
      runId: "run123",
      deploymentName: "myproj-mytest-us-east-1-run123",
      template: "dummy.yaml",
      parameters: {},
    };

    const manager = new S3ArtifactManager("us-east-1");
    await manager.ensureBucketExists("tagged-bucket", plan);

    const tagCalls = s3Mock.commandCalls(PutBucketTaggingCommand);
    expect(tagCalls).toHaveLength(1);
    expect(tagCalls[0].args[0].input.Bucket).toBe("tagged-bucket");
    expect(tagCalls[0].args[0].input.Tagging?.TagSet).toContainEqual({
      Key: "stacktest-project",
      Value: "myproj",
    });
  });

  it("should upload template content successfully and return HTTPS url", async () => {
    s3Mock.on(PutObjectCommand).resolves({});

    const tempFile = path.join(TEMP_DIR, "sqs.yaml");
    fs.writeFileSync(tempFile, "Resources: {}", "utf8");

    const manager = new S3ArtifactManager("us-east-1");
    const url = await manager.uploadTemplate("my-bucket", tempFile, "st-run/sqs.yaml");

    expect(url).toBe("https://my-bucket.s3.us-east-1.amazonaws.com/st-run/sqs.yaml");

    const calls = s3Mock.commandCalls(PutObjectCommand);
    expect(calls).toHaveLength(1);
    expect(calls[0].args[0].input.Bucket).toBe("my-bucket");
    expect(calls[0].args[0].input.Key).toBe("st-run/sqs.yaml");
  });

  it("should successfully delete bucket after verifying tags and emptying objects", async () => {
    s3Mock.on(GetBucketTaggingCommand).resolves({
      TagSet: [
        { Key: "stacktest-project", Value: "myproj" },
        { Key: "stacktest-run-id", Value: "run123" },
        { Key: "stacktest-test-name", Value: "mytest" },
      ],
    });
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [{ Key: "templates/dummy.yaml" }],
    });
    s3Mock.on(DeleteObjectsCommand).resolves({});
    s3Mock.on(DeleteBucketCommand).resolves({});

    const plan: DeploymentPlan = {
      projectName: "myproj",
      testName: "mytest",
      providerName: "aws-cloudformation",
      region: "us-east-1",
      runId: "run123",
      deploymentName: "myproj-mytest-us-east-1-run123",
      template: "dummy.yaml",
      parameters: {},
    };

    const manager = new S3ArtifactManager("us-east-1");
    await expect(manager.deleteBucket("tagged-bucket", plan)).resolves.toBeUndefined();

    expect(s3Mock.commandCalls(GetBucketTaggingCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(ListObjectsV2Command)).toHaveLength(1);
    expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(DeleteBucketCommand)).toHaveLength(1);
  });

  it("should fail bucket deletion if tags are missing or mismatched", async () => {
    s3Mock.on(GetBucketTaggingCommand).resolves({
      TagSet: [{ Key: "stacktest-project", Value: "mismatched" }],
    });

    const plan: DeploymentPlan = {
      projectName: "myproj",
      testName: "mytest",
      providerName: "aws-cloudformation",
      region: "us-east-1",
      runId: "run123",
      deploymentName: "myproj-mytest-us-east-1-run123",
      template: "dummy.yaml",
      parameters: {},
    };

    const manager = new S3ArtifactManager("us-east-1");
    await expect(manager.deleteBucket("tagged-bucket", plan)).rejects.toThrow(
      /missing required StackTest ownership tags/i,
    );
  });
});
