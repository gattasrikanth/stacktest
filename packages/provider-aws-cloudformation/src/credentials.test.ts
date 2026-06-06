import { describe, it, expect, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { getCloudFormationClient, getS3Client, resolveAwsCredentials } from "./credentials.js";

const stsMock = mockClient(STSClient);

describe("AWS Credential and Region Resolver", () => {
  beforeEach(() => {
    stsMock.reset();
  });

  it("should create a CloudFormationClient instance for the correct region", () => {
    const client = getCloudFormationClient("us-west-2");
    expect(client).toBeDefined();
    expect(client.config.region()).resolves.toBe("us-west-2");
  });

  it("should create an S3Client instance for the correct region", () => {
    const client = getS3Client("us-east-1");
    expect(client).toBeDefined();
    expect(client.config.region()).resolves.toBe("us-east-1");
  });

  it("should return undefined if roleArn is not provided in providerConfig", async () => {
    const creds = await resolveAwsCredentials("us-east-1", {});
    expect(creds).toBeUndefined();
  });

  it("should assume role via STS and return temporary credentials when roleArn is provided", async () => {
    const mockCreds = {
      AccessKeyId: "mock-access-key-id",
      SecretAccessKey: "mock-secret-access-key",
      SessionToken: "mock-session-token",
      Expiration: new Date(Date.now() + 3600 * 1000),
    };

    stsMock.on(AssumeRoleCommand).resolves({
      Credentials: mockCreds,
    });

    const providerConfig = {
      roleArn: "arn:aws:iam::123456789012:role/MyTestRole",
    };

    const creds = await resolveAwsCredentials("us-east-1", providerConfig);

    expect(creds).toBeDefined();
    expect(creds?.accessKeyId).toBe("mock-access-key-id");
    expect(creds?.secretAccessKey).toBe("mock-secret-access-key");
    expect(creds?.sessionToken).toBe("mock-session-token");
    expect(creds?.expiration).toEqual(mockCreds.Expiration);

    const calls = stsMock.commandCalls(AssumeRoleCommand);
    expect(calls).toHaveLength(1);
    expect(calls[0].args[0].input.RoleArn).toBe(providerConfig.roleArn);
  });

  it("should configure credentials on CloudFormation and S3 client builders when passed", async () => {
    const customCreds = {
      accessKeyId: "custom-key",
      secretAccessKey: "custom-secret",
      sessionToken: "custom-token",
    };

    const cfnClient = getCloudFormationClient("us-east-1", customCreds);
    const s3Client = getS3Client("us-east-1", customCreds);

    const resolvedCfnCreds = await cfnClient.config.credentials();
    const resolvedS3Creds = await s3Client.config.credentials();

    expect(resolvedCfnCreds.accessKeyId).toBe("custom-key");
    expect(resolvedS3Creds.accessKeyId).toBe("custom-key");
  });
});
