import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { S3Client } from "@aws-sdk/client-s3";

export function getCloudFormationClient(region: string): CloudFormationClient {
  return new CloudFormationClient({
    region,
  });
}

export function getS3Client(region: string): S3Client {
  return new S3Client({
    region,
  });
}
