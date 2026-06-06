import * as path from "path";
import {
  type DeploymentProvider,
  type DeploymentResult,
  type DeploymentEvent,
  type DeploymentPlan,
} from "@stack-test/core";
import {
  CreateStackCommand,
  DescribeStacksCommand,
  DescribeStackEventsCommand,
  DeleteStackCommand,
} from "@aws-sdk/client-cloudformation";
import { getCloudFormationClient, resolveAwsCredentials } from "./credentials.js";
import { S3ArtifactManager, generateSafeBucketName } from "./artifacts.js";
import { extractFailureReason } from "./events.js";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

function parseSecretSpec(spec: string): { secretId: string; jsonKey?: string } {
  if (spec.startsWith("arn:aws:secretsmanager:")) {
    const parts = spec.split(":");
    if (parts.length > 7) {
      const jsonKey = parts[parts.length - 1];
      const secretId = parts.slice(0, parts.length - 1).join(":");
      return { secretId, jsonKey };
    }
    return { secretId: spec };
  } else {
    const firstColonIdx = spec.indexOf(":");
    if (firstColonIdx !== -1) {
      const secretId = spec.slice(0, firstColonIdx);
      const jsonKey = spec.slice(firstColonIdx + 1);
      return { secretId, jsonKey };
    }
    return { secretId: spec };
  }
}

function formatParameters(
  params: Record<string, string | number | boolean | null>,
): Array<{ ParameterKey: string; ParameterValue: string }> {
  return Object.entries(params).map(([key, value]) => ({
    ParameterKey: key,
    ParameterValue: value === null ? "" : String(value),
  }));
}

function getTags(plan: DeploymentPlan): Array<{ Key: string; Value: string }> {
  return [
    { Key: "stacktest-project", Value: plan.projectName },
    { Key: "stacktest-run-id", Value: plan.runId },
    { Key: "stacktest-test-name", Value: plan.testName },
  ];
}

export class AwsCloudFormationProvider implements DeploymentProvider {
  readonly name = "aws-cloudformation";

  async deploy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const region = plan.region;

    let cfnClient;
    let ssmClient;
    let secretsClient;
    const resolvedParameters = { ...plan.parameters };

    try {
      const credentials = await resolveAwsCredentials(region, plan.providerConfig);
      cfnClient = getCloudFormationClient(region, credentials);
      ssmClient = new SSMClient({ region, ...(credentials ? { credentials } : {}) });
      secretsClient = new SecretsManagerClient({ region, ...(credentials ? { credentials } : {}) });

      for (const [key, value] of Object.entries(resolvedParameters)) {
        if (typeof value === "string") {
          if (value.startsWith("$[aws_ssm:")) {
            const match = value.match(/^\$\[aws_ssm:(.+)\]$/);
            if (match) {
              const paramName = match[1];
              const ssmRes = await ssmClient.send(
                new GetParameterCommand({
                  Name: paramName,
                  WithDecryption: true,
                }),
              );
              if (ssmRes.Parameter?.Value === undefined) {
                throw new Error(`SSM Parameter "${paramName}" returned no value.`);
              }
              resolvedParameters[key] = ssmRes.Parameter.Value;
            }
          } else if (value.startsWith("$[aws_secret:")) {
            const match = value.match(/^\$\[aws_secret:(.+)\]$/);
            if (match) {
              const spec = match[1];
              const { secretId, jsonKey } = parseSecretSpec(spec);
              const secretRes = await secretsClient.send(
                new GetSecretValueCommand({
                  SecretId: secretId,
                }),
              );
              const secretString = secretRes.SecretString;
              if (secretString === undefined) {
                throw new Error(
                  `Secrets Manager Secret "${secretId}" returned no SecretString value.`,
                );
              }
              if (jsonKey) {
                try {
                  const parsed = JSON.parse(secretString);
                  if (parsed[jsonKey] === undefined) {
                    throw new Error(`Key "${jsonKey}" not found in secret JSON for "${secretId}".`);
                  }
                  resolvedParameters[key] = parsed[jsonKey];
                } catch (jsonErr) {
                  const msg = jsonErr instanceof Error ? jsonErr.message : String(jsonErr);
                  throw new Error(
                    `Failed to parse secret JSON or extract key "${jsonKey}" for "${secretId}": ${msg}`,
                  );
                }
              } else {
                resolvedParameters[key] = secretString;
              }
            }
          }
        }
      }

      const bucketName = generateSafeBucketName(plan.projectName, plan.region, plan.runId);
      const artifactManager = new S3ArtifactManager(region, credentials);

      await artifactManager.ensureBucketExists(bucketName, plan);

      const resolvedTemplatePath = path.resolve(process.cwd(), plan.template);
      const objectKey = `templates/${plan.runId}-${path.basename(plan.template)}`;
      const templateUrl = await artifactManager.uploadTemplate(
        bucketName,
        resolvedTemplatePath,
        objectKey,
      );

      await cfnClient.send(
        new CreateStackCommand({
          StackName: plan.deploymentName,
          TemplateURL: templateUrl,
          Parameters: formatParameters(resolvedParameters),
          Tags: getTags(plan),
          Capabilities: ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM", "CAPABILITY_AUTO_EXPAND"],
        }),
      );

      const successStatus = ["CREATE_COMPLETE"];
      const failureStatus = [
        "CREATE_FAILED",
        "ROLLBACK_IN_PROGRESS",
        "ROLLBACK_FAILED",
        "ROLLBACK_COMPLETE",
      ];

      let active = true;
      while (active) {
        const describeRes = await cfnClient.send(
          new DescribeStacksCommand({
            StackName: plan.deploymentName,
          }),
        );

        const stack = describeRes.Stacks?.[0];
        if (!stack) {
          throw new Error(`Stack "${plan.deploymentName}" was not found after creation call.`);
        }

        const status = stack.StackStatus || "UNKNOWN";

        if (successStatus.includes(status)) {
          active = false;
          const outputs: Record<string, string> = {};
          if (stack.Outputs) {
            for (const out of stack.Outputs) {
              if (out.OutputKey) {
                outputs[out.OutputKey] = out.OutputValue || "";
              }
            }
          }
          return {
            success: true,
            status,
            runId: plan.runId,
            deploymentName: plan.deploymentName,
            durationMs: Date.now() - start,
            resolvedParameters,
            outputs,
          };
        }

        if (failureStatus.includes(status)) {
          active = false;
          const events = await this.getEvents(plan);
          const failureReason = extractFailureReason(events);
          const errMsg = failureReason
            ? `CloudFormation Stack creation failed with status: ${status}.\n${failureReason}`
            : `CloudFormation Stack creation failed with status: ${status}`;

          return {
            success: false,
            status,
            runId: plan.runId,
            deploymentName: plan.deploymentName,
            durationMs: Date.now() - start,
            error: new Error(errMsg),
            resolvedParameters,
          };
        }

        // Wait 2 seconds before polling again (keep it fast for mock testing, real tests can configure)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      throw new Error(`Deployment loop terminated unexpectedly for stack: ${plan.deploymentName}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return {
        success: false,
        status: "CREATE_FAILED",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        error,
        resolvedParameters,
      };
    } finally {
      if (ssmClient) ssmClient.destroy();
      if (secretsClient) secretsClient.destroy();
    }
  }

  async destroy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    const region = plan.region;

    try {
      const credentials = await resolveAwsCredentials(region, plan.providerConfig);
      const cfnClient = getCloudFormationClient(region, credentials);
      // 1. Describe stack to verify ownership tags before calling delete
      let stackExists = false;
      try {
        const describeRes = await cfnClient.send(
          new DescribeStacksCommand({
            StackName: plan.deploymentName,
          }),
        );
        const stack = describeRes.Stacks?.[0];
        if (stack) {
          stackExists = true;

          // Verify safety tags
          const tags = stack.Tags || [];
          const projectTag = tags.find((t) => t.Key === "stacktest-project");
          const runTag = tags.find((t) => t.Key === "stacktest-run-id");
          const testTag = tags.find((t) => t.Key === "stacktest-test-name");

          if (!projectTag || !runTag || !testTag) {
            throw new Error(
              `Safety Check Failed: Stack "${plan.deploymentName}" is missing required StackTest ownership tags. Deletion aborted.`,
            );
          }

          if (
            projectTag.Value !== plan.projectName ||
            runTag.Value !== plan.runId ||
            testTag.Value !== plan.testName
          ) {
            throw new Error(
              `Safety Check Failed: Stack "${plan.deploymentName}" ownership tags do not match deployment plan. Deletion aborted.`,
            );
          }
        }
      } catch (err) {
        if (err && typeof err === "object") {
          const errObj = err as Record<string, unknown>;
          const errName = typeof errObj.name === "string" ? errObj.name : "";
          const errMsg = typeof errObj.message === "string" ? errObj.message : "";
          if (errName === "ValidationError" || errMsg.includes("does not exist")) {
            // Stack does not exist, nothing to delete
            stackExists = false;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      // 2. Perform stack deletion if it exists
      if (stackExists) {
        await cfnClient.send(
          new DeleteStackCommand({
            StackName: plan.deploymentName,
          }),
        );

        let active = true;
        while (active) {
          try {
            const describeRes = await cfnClient.send(
              new DescribeStacksCommand({
                StackName: plan.deploymentName,
              }),
            );

            const stack = describeRes.Stacks?.[0];
            if (!stack) {
              active = false;
              break;
            }

            const status = stack.StackStatus || "UNKNOWN";
            if (status === "DELETE_COMPLETE") {
              active = false;
              break;
            }

            if (status === "DELETE_FAILED") {
              active = false;
              const events = await this.getEvents(plan);
              const failureReason = extractFailureReason(events);
              const errMsg = failureReason
                ? `CloudFormation Stack deletion failed with status: ${status}.\n${failureReason}`
                : `CloudFormation Stack deletion failed with status: ${status}`;

              return {
                success: false,
                status,
                runId: plan.runId,
                deploymentName: plan.deploymentName,
                durationMs: Date.now() - start,
                error: new Error(errMsg),
              };
            }
          } catch (err) {
            if (err && typeof err === "object") {
              const errObj = err as Record<string, unknown>;
              const errName = typeof errObj.name === "string" ? errObj.name : "";
              const errMsg = typeof errObj.message === "string" ? errObj.message : "";
              if (errName === "ValidationError" || errMsg.includes("does not exist")) {
                active = false;
                break;
              }
            }
            throw err;
          }

          // Poll deletion every 2 seconds
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // 3. Delete the S3 staging bucket
      const bucketName = generateSafeBucketName(plan.projectName, plan.region, plan.runId);
      const artifactManager = new S3ArtifactManager(region, credentials);
      await artifactManager.deleteBucket(bucketName, plan);

      return {
        success: true,
        status: "DELETE_COMPLETE",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return {
        success: false,
        status: "DELETE_FAILED",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        error,
      };
    }
  }

  async getEvents(plan: DeploymentPlan): Promise<DeploymentEvent[]> {
    const region = plan.region;

    try {
      const credentials = await resolveAwsCredentials(region, plan.providerConfig);
      const cfnClient = getCloudFormationClient(region, credentials);
      const res = await cfnClient.send(
        new DescribeStackEventsCommand({
          StackName: plan.deploymentName,
        }),
      );

      const events: DeploymentEvent[] = (res.StackEvents || []).map((e) => ({
        timestamp: e.Timestamp || new Date(),
        resourceType: e.ResourceType || "Unknown",
        logicalResourceId: e.LogicalResourceId || "Unknown",
        status: e.ResourceStatus || "Unknown",
        statusReason: e.ResourceStatusReason,
      }));

      return events;
    } catch {
      return [];
    }
  }
}
