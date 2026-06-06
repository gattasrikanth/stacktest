import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { ReportGenerator } from "./generator.js";
import { type DeploymentPlan } from "../planner/planner.js";
import { type DeploymentResult } from "../providers/types.js";

const TEST_DIR = path.resolve(process.cwd(), "packages/core/src/reporting/temp-test-reports");

describe("ReportGenerator", () => {
  beforeAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  const plans: DeploymentPlan[] = [
    {
      projectName: "myproj",
      testName: "test-success",
      providerName: "fake",
      region: "us-east-1",
      runId: "st-run999",
      deploymentName: "myproj-test-success-us-east-1-st-run999",
      template: "sqs.yaml",
      parameters: { Env: "dev" },
    },
    {
      projectName: "myproj",
      testName: "test-failure",
      providerName: "fake",
      region: "us-east-1",
      runId: "st-run999",
      deploymentName: "myproj-test-failure-us-east-1-st-run999",
      template: "sns.yaml",
      parameters: { Topic: "alerts" },
    },
  ];

  const results: DeploymentResult[] = [
    {
      success: true,
      status: "CREATE_COMPLETE",
      runId: "st-run999",
      deploymentName: "myproj-test-success-us-east-1-st-run999",
      durationMs: 1500,
      events: [
        {
          timestamp: new Date("2026-06-06T00:00:00.000Z"),
          resourceType: "AWS::SQS::Queue",
          logicalResourceId: "MyQueue",
          status: "CREATE_COMPLETE",
        },
      ],
    },
    {
      success: false,
      status: "CREATE_FAILED",
      runId: "st-run999",
      deploymentName: "myproj-test-failure-us-east-1-st-run999",
      durationMs: 2500,
      error: new Error("QueueAlreadyExists: Name is in use"),
      events: [
        {
          timestamp: new Date("2026-06-06T00:00:01.000Z"),
          resourceType: "AWS::SNS::Topic",
          logicalResourceId: "MyTopic",
          status: "CREATE_FAILED",
          statusReason: "TopicName is already registered",
        },
      ],
    },
  ];

  it("should generate a valid JSON report model", () => {
    const report = ReportGenerator.generateJson("myproj", "st-run999", plans, results);

    expect(report.projectName).toBe("myproj");
    expect(report.runId).toBe("st-run999");
    expect(report.summary.total).toBe(2);
    expect(report.summary.passed).toBe(1);
    expect(report.summary.failed).toBe(1);
    expect(report.summary.durationMs).toBe(4000);

    expect(report.deployments).toHaveLength(2);
    expect(report.deployments[0].success).toBe(true);
    expect(report.deployments[1].success).toBe(false);
    expect(report.deployments[1].error).toBe("QueueAlreadyExists: Name is in use");
    expect(report.deployments[1].events?.[0].statusReason).toBe("TopicName is already registered");
  });

  it("should generate a valid JUnit XML string", () => {
    const xml = ReportGenerator.generateJunit("myproj", "st-run999", plans, results);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<testsuites name="StackTest Run" tests="2" failures="1" time="4.000">');
    expect(xml).toContain('<testsuite name="st-run999" tests="2" failures="1"');
    expect(xml).toContain(
      '<testcase classname="fake.us-east-1.test-success" name="myproj-test-success-us-east-1-st-run999" time="1.500">',
    );
    expect(xml).toContain(
      '<testcase classname="fake.us-east-1.test-failure" name="myproj-test-failure-us-east-1-st-run999" time="2.500">',
    );
    expect(xml).toContain('<failure message="QueueAlreadyExists: Name is in use">');
  });

  it("should generate a valid HTML report with inlined JSON data script block", () => {
    const html = ReportGenerator.generateHtml("myproj", "st-run999", plans, results);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>StackTest Report - myproj</title>");
    expect(html).toContain('id="report-data" type="application/json"');
    expect(html).toContain('"projectName":"myproj"');
    expect(html).toContain('"runId":"st-run999"');
  });

  it("should write files to runs directory cleanly", async () => {
    // Override standard process.cwd() for testing to write to our temporary TEST_DIR
    const originalCwd = process.cwd;
    process.cwd = () => TEST_DIR;

    try {
      const paths = await ReportGenerator.writeReports("myproj", "st-run999", plans, results);

      expect(fs.existsSync(paths.jsonPath)).toBe(true);
      expect(fs.existsSync(paths.junitPath)).toBe(true);
      expect(fs.existsSync(paths.htmlPath)).toBe(true);

      const jsonContent = JSON.parse(fs.readFileSync(paths.jsonPath, "utf8"));
      expect(jsonContent.runId).toBe("st-run999");
    } finally {
      process.cwd = originalCwd;
    }
  });
});
