import * as fs from "fs";
import * as crypto from "crypto";
import {
  S3Client,
  CreateBucketCommand,
  type CreateBucketCommandInput,
  PutBucketEncryptionCommand,
  PutPublicAccessBlockCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getS3Client } from "./credentials.js";

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

  constructor(private region: string) {
    this.client = getS3Client(region);
  }

  async ensureBucketExists(bucketName: string): Promise<void> {
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
    } catch (err) {
      if (err && typeof err === "object" && "name" in err) {
        const errorName = (err as { name: string }).name;
        if (errorName === "BucketAlreadyExists" || errorName === "BucketAlreadyOwnedByYou") {
          return;
        }
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to ensure S3 staging bucket exists: ${message}`);
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
