import { describe, it, expect } from "vitest";
import { extractFailureReason } from "./events.js";
import { type DeploymentEvent } from "@stacktest/core";

describe("Event Failure Extractor", () => {
  it("should return undefined if no resource failures are found", () => {
    const events: DeploymentEvent[] = [
      {
        timestamp: new Date(),
        resourceType: "AWS::SQS::Queue",
        logicalResourceId: "MyQueue",
        status: "CREATE_COMPLETE",
      },
    ];

    expect(extractFailureReason(events)).toBeUndefined();
  });

  it("should extract resource failures and exclude the stack resource itself", () => {
    const events: DeploymentEvent[] = [
      {
        timestamp: new Date(),
        resourceType: "AWS::SQS::Queue",
        logicalResourceId: "MyQueue",
        status: "CREATE_FAILED",
        statusReason: "QueueName already exists",
      },
      {
        timestamp: new Date(),
        resourceType: "AWS::CloudFormation::Stack",
        logicalResourceId: "my-stack",
        status: "CREATE_FAILED",
        statusReason: "The following resource(s) failed to create: [MyQueue]",
      },
    ];

    const reason = extractFailureReason(events);
    expect(reason).toBeDefined();
    expect(reason).toContain('Resource "MyQueue" (AWS::SQS::Queue)');
    expect(reason).toContain("QueueName already exists");
    expect(reason).not.toContain("my-stack");
  });
});
