# Phase 03: AWS CloudFormation Provider

## Goal
Implement the first real-world infrastructure deployment provider targeting AWS CloudFormation. This phase introduces the AWS SDK v3, handles region and credential resolution, manages S3-based template uploading for nested/large templates, provides stack event aggregation for debugging failed deployments, and enforces rigorous safety guardrails during cleanups.

## Deliverables
- **AWS Provider Package**: `packages/provider-aws-cloudformation` codebase structured with TypeScript and target compile configurations.
- **AWS Credentials & Region Resolver**: Resolution logic traversing environmental keys, AWS profiles, and IAM role settings safely.
- **S3 Artifact Upload Manager**: Staging bucket lifecycle engine to automatically create regional buckets, upload template dependencies, and generate valid regional template URLs.
- **CloudFormation Engine**: Execution logic invoking Stack Creation, Stack Deletion, and polling status loops (Create Progress, Create Complete, etc.).
- **Failure Extractor**: Parser extracting exact failure triggers and resource-level error logs from CloudFormation events when a stack deployment rolls back or fails.
- **Safe Cleanup Guardrail**: Explicit tagging checker requiring all stacks and S3 objects deleted by StackTest to contain official ownership tags before execution.
- **Integration Test Suite**: An opt-in test harness executing actual cloud deployments of lightweight infrastructure (e.g. SQS queues).

## GitHub Issues to Create

### Issue 3.1: Initialize `provider-aws-cloudformation` Package
- **Description**: Setup workspace package configurations, base compilation setup (`tsup`), and configure AWS SDK v3 client dependencies.
- **Target Commit**: `chore: setup provider-aws-cloudformation workspace package`
- **Recommended Agent Role**: Architect

### Issue 3.2: Implement AWS Credential and Region Resolver
- **Description**: Write the credentials loading utility using standard AWS SDK provider chains, ensuring credentials are never saved or outputted in logs.
- **Target Commit**: `feat(provider-aws-cloudformation): implement credentials and region loading`
- **Recommended Agent Role**: Safety

### Issue 3.3: Implement S3 Artifact Upload Manager
- **Description**: Add regional S3 bucket creation and file upload utilities to store local CloudFormation templates and nested dependencies prior to deployment.
- **Target Commit**: `feat(provider-aws-cloudformation): implement regional s3 artifact manager`
- **Recommended Agent Role**: Implementation

### Issue 3.4: Implement Stack Deployer and Event Poller
- **Description**: Build the CloudFormation stack execution logic, status polling loops, and stack event aggregators.
- **Target Commit**: `feat(provider-aws-cloudformation): implement stack deployment and event polling`
- **Recommended Agent Role**: Implementation

### Issue 3.5: Implement Event Failure Extractor
- **Description**: Build parser logic that parses AWS stack events during rolling rollbacks/failures to extract specific details (e.g., `QueueName already exists` or `Access Denied`).
- **Target Commit**: `feat(provider-aws-cloudformation): add event failure logs extractor`
- **Recommended Agent Role**: Test

### Issue 3.6: Implement Stack Destroyer with Safety Guardrails
- **Description**: Write cleanup logic that deletes targeted CloudFormation stacks and temporary S3 staging objects. Implement tag validation to prevent deleting external stacks.
- **Target Commit**: `feat(provider-aws-cloudformation): implement stack destroyer with tag guardrails`
- **Recommended Agent Role**: Safety

### Issue 3.7: Add Opt-In Integration Tests
- **Description**: Integrate the AWS provider into the core registry and configure testing suites using live AWS targets, disabled by default.
- **Target Commit**: `test(provider-aws-cloudformation): add live cloud integration tests`
- **Recommended Agent Role**: Test

## Acceptance Criteria
- Running `stacktest run` with a valid AWS config deploys, queries, and terminates real AWS CloudFormation stacks successfully.
- Every resources created by StackTest carries mandatory tags: `stacktest-project`, `stacktest-run-id`, and `stacktest-test-name`.
- The cleanup mechanism fails immediately if attempting to delete a stack that does not contain the required tag pattern.
- Staging regional S3 buckets are deleted or emptied safely when tests conclude.
- AWS integration tests are skipped unless explicit environmental configuration (`RUN_AWS_INTEGRATION_TESTS=true`) is activated.

## Test Requirements
- Unit tests using mock clients (e.g. `aws-sdk-client-mock` library) to verify API parameters, loop behaviors, and extraction logic without hitting real endpoints.
- Integration tests deploying a single, fast AWS resource (like an SNS topic or SQS queue) to prove real-world compatibility.
- Negative tests ensuring the stack destroyer refuses to delete stacks without StackTest tagging metadata.

## Safety Notes
- **CRITICAL**: Stack deletion MUST require explicit verification of ownership tags. No wildcards or general regex naming matching should bypass tag validation.
- Do not commit any IAM credentials, account IDs, mock AWS credentials profiles, or secrets to Git. Use environment variables resolved locally.
- Keep S3 buckets private: ensure all staging S3 buckets are explicitly configured with blocked public access (BPA) enabled by default.
