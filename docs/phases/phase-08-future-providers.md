# Phase 08: AWS CDK Provider Integration

## Goal

Design and implement the AWS CDK provider (`@stack-test/provider-aws-cdk`) as the third concrete deployment backend. This provider will allow users to test CDK applications by executing `cdk synth` to generate CloudFormation templates and delegating deployment/cleanup operations to the existing `@stack-test/provider-aws-cloudformation` package.

## Deliverables

- **AWS CDK Provider Package**: A new package `@stack-test/provider-aws-cdk` under `packages/provider-aws-cdk` registered in the monorepo workspace.
- **CDK Synth Manager**: Core synthesis executor checking for `cdk` CLI availability, running `cdk synth -o <dir>`, and retrieving synthesized templates.
- **CDK Deployer wrapper**: Orchestrator executing the synthesis, then utilizing `AwsCloudFormationProvider` to deploy the output template to AWS.
- **CDK Destroyer wrapper**: Wrapper executing `AwsCloudFormationProvider.destroy` to tear down the infrastructure safely.
- **Mock and Integration Test Suite**: Complete unit tests mocking CLI synthesis and delegating calls, alongside opt-in local integration tests deploying a simple CDK application.

---

## GitHub Issues to Create

### Issue 8.1: Initialize `provider-aws-cdk` Package

- **Description**: Initialize the `@stack-test/provider-aws-cdk` package structure. Set up `package.json`, TypeScript configuration, and compiler build script using `tsup`.
- **Target Commit**: `chore: initialize provider-aws-cdk package`
- **Recommended Agent Role**: Architect

### Issue 8.2: Implement CDK Synth Manager

- **Description**: Create a synthesis manager that executes `cdk synth` inside an isolated workspace directory and extracts the generated CloudFormation template path.
- **Target Commit**: `feat(provider-aws-cdk): implement cdk synthesis executor`
- **Recommended Agent Role**: Implementation

### Issue 8.3: Implement CDK Deploy (Wrapper) Executor

- **Description**: Implement the `deploy` method conforming to `DeploymentProvider`. Synthesize the CDK application, then instantiate and delegate deployment to the `AwsCloudFormationProvider`.
- **Target Commit**: `feat(provider-aws-cdk): implement cdk deploy wrapper`
- **Recommended Agent Role**: Implementation

### Issue 8.4: Implement CDK Destroy (Wrapper) Executor

- **Description**: Implement the `destroy` method. Delegate cleanup of the synthesized stack to the `AwsCloudFormationProvider`.
- **Target Commit**: `feat(provider-aws-cdk): implement cdk destroy wrapper`
- **Recommended Agent Role**: Safety

### Issue 8.5: Add Mock and Unit Tests for CDK Provider

- **Description**: Add unit tests in `provider-aws-cdk` mocking CLI execution and CloudFormation client behaviors to verify success and failure paths.
- **Target Commit**: `test(provider-aws-cdk): add mock and unit tests`
- **Recommended Agent Role**: Test

### Issue 8.6: Add Opt-In Integration Tests for CDK Provider

- **Description**: Add integration tests that compile and deploy a basic SQS queue CDK app using real `cdk` CLI and CloudFormation calls, gated by `RUN_CDK_INTEGRATION_TESTS === "true"`.
- **Target Commit**: `test(provider-aws-cdk): add cdk integration tests`
- **Recommended Agent Role**: Test

---

## Acceptance Criteria

- The `@stack-test/provider-aws-cdk` package registers cleanly under the workspace.
- Executing `stacktest run --provider aws-cdk` is supported.
- CDK apps synthesize successfully at runtime.
- Synthesized stacks are deployed and destroyed safely using AWS CloudFormation credentials.
- The monorepo builds, lint checks pass, and all unit tests run successfully.
