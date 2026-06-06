import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { S3Client } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: Date;
}

export function getCloudFormationClient(region: string, credentials?: AwsCredentials): CloudFormationClient {
  return new CloudFormationClient({
    region,
    ...(credentials ? { credentials } : {}),
  });
}

export function getS3Client(region: string, credentials?: AwsCredentials): S3Client {
  return new S3Client({
    region,
    ...(credentials ? { credentials } : {}),
  });
}

export async function resolveAwsCredentials(
  region: string,
  providerConfig?: Record<string, any>,
): Promise<AwsCredentials | undefined> {
  const roleArn = providerConfig?.roleArn;
  if (!roleArn) {
    return undefined;
  }

  const stsClient = new STSClient({ region });
  try {
    const response = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `StackTest-${Date.now()}`,
      }),
    );

    if (!response.Credentials) {
      throw new Error(`STS AssumeRole did not return credentials for role ${roleArn}`);
    }

    return {
      accessKeyId: response.Credentials.AccessKeyId!,
      secretAccessKey: response.Credentials.SecretAccessKey!,
      sessionToken: response.Credentials.SessionToken!,
      expiration: response.Credentials.Expiration,
    };
  } finally {
    stsClient.destroy();
  }
}
