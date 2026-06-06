# Phase 07: Terraform Provider Integration

## Goal

Design and implement the HashiCorp Terraform provider (`@stack-test/provider-terraform`) as the second concrete deployment backend. This will validate that the framework's core planning, resolution, orchestration, and reporting engines are fully provider-agnostic, and support directory-based infrastructure-as-code deployments.

## Deliverables

- **Terraform Provider Package**: A new package `@stack-test/provider-terraform` under `packages/provider-terraform` registered in the monorepo workspace.
- **Terraform Workspace and Initialization**: Dynamic workspace directory management that runs `terraform init` locally to prepare providers and modules.
- **Terraform Apply (Deploy)**: Map planned parameters to Terraform input variables (`-var` flags or temporary `.tfvars` files) and run `terraform apply -auto-approve`.
- **Terraform Destroy (Cleanup)**: Execution of `terraform destroy -auto-approve` inside the managed workspace to tear down resources.
- **Mock and Integration Test Suite**: Complete unit tests mocking the CLI command execution, alongside opt-in local integration tests executing real Terraform commands.

---

## GitHub Issues to Create

### Issue 7.1: Initialize `provider-terraform` Package

- **Description**: Initialize the `@stack-test/provider-terraform` workspace package structure. Set up `package.json`, TypeScript configuration, and compiler build script using `tsup`.
- **Target Commit**: `chore: initialize provider-terraform package`
- **Recommended Agent Role**: Architect

### Issue 7.2: Implement Terraform Workspace and Init Manager

- **Description**: Create a workspace manager class that verifies the local `terraform` executable is available on the system path and runs `terraform init` asynchronously.
- **Target Commit**: `feat(provider-terraform): implement terraform workspace and init manager`
- **Recommended Agent Role**: Implementation

### Issue 7.3: Implement Terraform Apply (Deploy) Executor

- **Description**: Implement the `deploy` method conforming to `DeploymentProvider`. Map plan parameters to Terraform variables, execute `terraform apply`, parse logs, and capture results.
- **Target Commit**: `feat(provider-terraform): implement terraform apply deployer`
- **Recommended Agent Role**: Implementation

### Issue 7.4: Implement Terraform Destroy Executor with Safety Guardrails

- **Description**: Implement the `destroy` method. Ensure execution is restricted to the specific StackTest workspace state to prevent deleting external resources. Execute `terraform destroy` cleanly.
- **Target Commit**: `feat(provider-terraform): implement terraform destroy manager`
- **Recommended Agent Role**: Safety

### Issue 7.5: Add Mock and Unit Tests for Terraform Provider

- **Description**: Add unit tests in `provider-terraform` mocking CLI execution using Vitest to verify success and failure execution paths without calling the real `terraform` binary.
- **Target Commit**: `test(provider-terraform): add mock and unit tests`
- **Recommended Agent Role**: Test

### Issue 7.6: Add Opt-In Integration Tests for Terraform Provider

- **Description**: Add local integration tests that deploy and destroy a basic local/null resource using a real `terraform` CLI call, gated by `RUN_TERRAFORM_INTEGRATION_TESTS === "true"`.
- **Target Commit**: `test(provider-terraform): add terraform integration tests`
- **Recommended Agent Role**: Test

---

## Acceptance Criteria

- The `@stack-test/provider-terraform` package registers cleanly under the workspace.
- Executing `stacktest run --provider terraform` is supported.
- Workspace parameters map successfully to Terraform variables.
- StackTest ownership and state scoping prevent unintended resource deletes.
- The monorepo builds, lint checks pass, and all unit tests run successfully.
