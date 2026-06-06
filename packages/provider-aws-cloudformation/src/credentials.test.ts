import { describe, it, expect } from "vitest";
import { getCloudFormationClient, getS3Client } from "./credentials.js";

describe("AWS Credential and Region Resolver", () => {
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
});
