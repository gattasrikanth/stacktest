# Phase 06: Advanced AWS Compatibility

## Goal

Expand the AWS CloudFormation provider capabilities with advanced enterprise-grade features: dynamic IAM Role Assumption, SSM Parameter Store and Secrets Manager dynamic parameter resolvers, region-specific configuration overrides, and a `--retain-on-failure` debugging option.

## Deliverables

- **AWS Role Assumption**: Resolve temporary regional credentials by assuming a specified IAM Role ARN before creating AWS client instances.
- **SSM and Secrets Dynamic Resolvers**: Custom resolvers in the parser supporting `$[aws_ssm:/path/to/param]` and `$[aws_secret:secret-id:json-key]` parameters.
- **Region Overrides**: Configuration-level enhancements permitting parameter sets mapped specifically per region.
- **Retain-On-Failure Flag**: Command-line flag (`--retain-on-failure`) preventing orchestrator cleanup of failed deployments, allowing manual inspection of resources in the AWS Console.

## GitHub Issues to Create

### Issue 6.1: Implement AWS IAM Role Assumption

- **Description**: Extend AWS credentials resolver in `provider-aws-cloudformation` to support assuming a specified IAM Role ARN. Retrieve temporary credentials using AWS STS `AssumeRoleCommand`.
- **Target Commit**: `feat(provider-aws-cloudformation): support aws iam role assumption`
- **Recommended Agent Role**: Safety

### Issue 6.2: Implement SSM and Secrets Manager Dynamic Resolvers

- **Description**: Add dynamic value parser plugins in `@stacktest/core` that query AWS SSM Parameter Store (`$[aws_ssm:...]`) and Secrets Manager (`$[aws_secret:...]`) at runtime using real/mock AWS clients.
- **Target Commit**: `feat(core): resolve ssm parameters and secrets manager values`
- **Recommended Agent Role**: Implementation

### Issue 6.3: Support Region-Specific Parameter Overrides

- **Description**: Update the configuration schema and loader to support region-scoped parameter overrides under test suite definitions.
- **Target Commit**: `feat(core): support region-specific parameter overrides`
- **Recommended Agent Role**: Architect

### Issue 6.4: Add `--retain-on-failure` Option to Orchestration and CLI

- **Description**: Integrate the `--retain-on-failure` execution option. If a deployment fails, bypass the `destroy` cleanup call to leave the stack available for manual debugging.
- **Target Commit**: `feat(cli): add retain-on-failure flag support`
- **Recommended Agent Role**: Implementation

## Acceptance Criteria

- Providing a `RoleArn` in configuration uses STS to assume the role.
- Parameters starting with `$[aws_ssm:` or `$[aws_secret:` are resolved successfully at runtime.
- Specifying region overrides compiles and applies overrides cleanly during planning.
- Passing `--retain-on-failure` skips deletion only if the deployment status is failed.
- The monorepo builds, lint checks pass, and all unit tests run successfully.
