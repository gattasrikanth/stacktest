import * as fs from "fs";
import * as crypto from "crypto";
import {
  S3Client,
  CreateBucketCommand,
  type CreateBucketCommandInput,
  PutBucketEncryptionCommand,
  PutPublicAccessBlockCommand,
  PutObjectCommand,
  PutBucketTaggingCommand,
  GetBucketTaggingCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteBucketCommand,
} from "@aws-sdk/client-s3";
import { getS3Client } from "./credentials.js";
import { type DeploymentPlan } from "@stacktest/core";

export function generateSafeBucketName(projectName: string, region: string, runId: string): string {
  const sanitize = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/g, "");
  const pName = sanitize(projectName);
  const rName = sanitize(region);
  const rId = sanitize(runId);
  const raw = `stacktest-${pName}-${rName}-${rId}`;

  if (raw.length > 63) {
    const hash = crypto.createHash("md5").update(raw).digest("hex").slice(0, 8);
    return `stacktest-${pName.slice(0, 20)}-${hash}`;
  }
  return raw;
}

export class S3ArtifactManager {
  private client: S3Client;

  constructor(private region: string, credentials?: any) {
    this.client = getS3Client(region, credentials);
  }

  async ensureBucketExists(bucketName: string, plan?: DeploymentPlan): Promise<void> {
    try {
      const createParams: CreateBucketCommandInput = { Bucket: bucketName };
      if (this.region !== "us-east-1") {
        createParams.CreateBucketConfiguration = {
          LocationConstraint: this.region,
        };
      }
      await this.client.send(new CreateBucketCommand(createParams));

      await this.client.send(
        new PutPublicAccessBlockCommand({
          Bucket: bucketName,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            IgnorePublicAcls: true,
            BlockPublicPolicy: true,
            RestrictPublicBuckets: true,
          },
        }),
      );

      await this.client.send(
        new PutBucketEncryptionCommand({
          Bucket: bucketName,
          ServerSideEncryptionConfiguration: {
            Rules: [
              {
                ApplyServerSideEncryptionByDefault: {
                  SSEAlgorithm: "AES256",
                },
              },
            ],
          },
        }),
      );

      if (plan) {
        await this.client.send(
          new PutBucketTaggingCommand({
            Bucket: bucketName,
            Tagging: {
              TagSet: [
                { Key: "stacktest-project", Value: plan.projectName },
                { Key: "stacktest-run-id", Value: plan.runId },
                { Key: "stacktest-test-name", Value: plan.testName },
              ],
            },
          }),
        );
      }
    } catch (err) {
      if (err && typeof err === "object" && "name" in err) {
        const errorName = (err as { name: string }).name;
        if (errorName === "BucketAlreadyExists" || errorName === "BucketAlreadyOwnedByYou") {
          // If it already exists, let's still make sure it's tagged if plan is provided
          if (plan) {
            try {
              await this.client.send(
                new PutBucketTaggingCommand({
                  Bucket: bucketName,
                  Tagging: {
                    TagSet: [
                      { Key: "stacktest-project", Value: plan.projectName },
                      { Key: "stacktest-run-id", Value: plan.runId },
                      { Key: "stacktest-test-name", Value: plan.testName },
                    ],
                  },
                }),
              );
            } catch (tagErr) {
              // Ignore tagging errors for existing buckets that might be owned by other tests in rare cases,
              // but throw in general if it fails.
              const tagMsg = tagErr instanceof Error ? tagErr.message : String(tagErr);
              throw new Error(`Failed to tag existing S3 staging bucket: ${tagMsg}`);
            }
          }
          return;
        }
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to ensure S3 staging bucket exists: ${message}`);
    }
  }

  async deleteBucket(bucketName: string, plan: DeploymentPlan): Promise<void> {
    try {
      // Fetch bucket tags to verify ownership
      try {
        const taggingRes = await this.client.send(
          new GetBucketTaggingCommand({
            Bucket: bucketName,
          }),
        );
        const tags = taggingRes.TagSet || [];
        const projectTag = tags.find((t) => t.Key === "stacktest-project");
        const runTag = tags.find((t) => t.Key === "stacktest-run-id");
        const testTag = tags.find((t) => t.Key === "stacktest-test-name");

        if (!projectTag || !runTag || !testTag) {
          throw new Error(
            `S3 bucket "${bucketName}" is missing required StackTest ownership tags.`,
          );
        }
        if (
          projectTag.Value !== plan.projectName ||
          runTag.Value !== plan.runId ||
          testTag.Value !== plan.testName
        ) {
          throw new Error(`S3 bucket "${bucketName}" has mismatched StackTest ownership tags.`);
        }
      } catch (tagErr) {
        if (tagErr && typeof tagErr === "object") {
          const errObj = tagErr as Record<string, unknown>;
          const errName = typeof errObj.name === "string" ? errObj.name : "";
          const errMsg = typeof errObj.message === "string" ? errObj.message : "";
          if (errName === "NoSuchBucket" || errMsg.includes("does not exist")) {
            return;
          }
          if (errName === "NoSuchTagSet") {
            throw new Error(
              `S3 bucket "${bucketName}" has no tagging metadata and cannot be safely deleted by StackTest.`,
            );
          }
        }
        throw tagErr;
      }

      // 1. List and delete all objects (S3 buckets must be empty before deletion)
      const listRes = await this.client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
        }),
      );

      const objects = listRes.Contents || [];
      if (objects.length > 0) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: objects.map((obj) => ({ Key: obj.Key })),
              Quiet: true,
            },
          }),
        );
      }

      // 2. Delete the bucket itself
      await this.client.send(
        new DeleteBucketCommand({
          Bucket: bucketName,
        }),
      );
    } catch (err) {
      if (err && typeof err === "object" && "name" in err) {
        const errorName = (err as { name: string }).name;
        if (errorName === "NoSuchBucket") {
          return;
        }
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to delete S3 staging bucket: ${message}`);
    }
  }

  async uploadTemplate(
    bucketName: string,
    localFilePath: string,
    objectKey: string,
  ): Promise<string> {
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`Template file not found on disk at: ${localFilePath}`);
    }

    const content = fs.readFileSync(localFilePath, "utf8");

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          Body: content,
          ContentType: "application/x-yaml",
        }),
      );

      return `https://${bucketName}.s3.${this.region}.amazonaws.com/${objectKey}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to upload template to S3 bucket "${bucketName}": ${message}`);
    }
  }
}
