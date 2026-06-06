import * as path from "path";
import {
  type DeploymentProvider,
  type DeploymentResult,
  type DeploymentEvent,
  type DeploymentPlan,
} from "@stacktest/core";
import {
  CreateStackCommand,
  DescribeStacksCommand,
  DescribeStackEventsCommand,
} from "@aws-sdk/client-cloudformation";
import { getCloudFormationClient } from "./credentials.js";
import { S3ArtifactManager, generateSafeBucketName } from "./artifacts.js";

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
    const cfnClient = getCloudFormationClient(region);

    try {
      const bucketName = generateSafeBucketName(plan.projectName, plan.region, plan.runId);
      const artifactManager = new S3ArtifactManager(region);

      await artifactManager.ensureBucketExists(bucketName);

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
          Parameters: formatParameters(plan.parameters),
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
          return {
            success: true,
            status,
            runId: plan.runId,
            deploymentName: plan.deploymentName,
            durationMs: Date.now() - start,
          };
        }

        if (failureStatus.includes(status)) {
          active = false;
          return {
            success: false,
            status,
            runId: plan.runId,
            deploymentName: plan.deploymentName,
            durationMs: Date.now() - start,
            error: new Error(`CloudFormation Stack creation failed with status: ${status}`),
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
      };
    }
  }

  async destroy(plan: DeploymentPlan): Promise<DeploymentResult> {
    // Placeholder - will implement in Issue 3.6
    return {
      success: true,
      status: "DELETE_COMPLETE",
      runId: plan.runId,
      deploymentName: plan.deploymentName,
      durationMs: 0,
    };
  }

  async getEvents(plan: DeploymentPlan): Promise<DeploymentEvent[]> {
    const region = plan.region;
    const cfnClient = getCloudFormationClient(region);

    try {
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
