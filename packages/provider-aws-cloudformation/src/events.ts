import { type DeploymentEvent } from "@stack-test/core";

export function extractFailureReason(events: DeploymentEvent[]): string | undefined {
  const failures = events.filter((e) => {
    const isFailureStatus =
      e.status === "CREATE_FAILED" || e.status === "UPDATE_FAILED" || e.status === "DELETE_FAILED";
    const isNotStack = e.resourceType !== "AWS::CloudFormation::Stack";
    return isFailureStatus && isNotStack;
  });

  if (failures.length === 0) {
    return undefined;
  }

  const logs = failures.map((f) => {
    return `- Resource "${f.logicalResourceId}" (${f.resourceType}): ${
      f.statusReason || "No status reason provided."
    }`;
  });

  return `Failed Resources:\n${logs.join("\n")}`;
}
