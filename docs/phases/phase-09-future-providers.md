# Phase 09: Kubernetes Provider Integration

## Goal

Design and implement the Kubernetes provider (`@stack-test/provider-kubernetes`) as the fourth concrete deployment backend. This provider will allow users to deploy, monitor, and clean up Kubernetes YAML manifests inside dynamically created, isolated namespaces using local `kubectl` command execution.

## Deliverables

- **Kubernetes Provider Package**: A new package `@stack-test/provider-kubernetes` under `packages/provider-kubernetes` registered in the monorepo workspace.
- **Namespace Isolation Manager**: Core namespace builder executing `kubectl create namespace <name>` to isolate deployment runs.
- **Kubernetes Apply (Deploy)**: Executor executing `kubectl apply -f <template> -n <namespace>` and monitoring resource rollout status.
- **Kubernetes Clean (Cleanup)**: Executor performing safety tag/namespace deletions that automatically tears down all child resources.
- **Mock and Integration Test Suite**: Complete unit tests mocking CLI executions, alongside opt-in local integration tests deploying simple Pod/Service configurations.

---

## GitHub Issues to Create

### Issue 9.1: Initialize `provider-kubernetes` Package

- **Description**: Initialize the `@stack-test/provider-kubernetes` package structure. Set up `package.json`, TypeScript configuration, and compiler build script using `tsup`.
- **Target Commit**: `chore: initialize provider-kubernetes package`
- **Recommended Agent Role**: Architect

### Issue 9.2: Implement Kubernetes Namespace Manager

- **Description**: Create a namespace manager that verifies `kubectl` CLI is available and creates run-specific isolated namespaces (e.g., `st-<runId>-<testName>`) for safety-first resource grouping.
- **Target Commit**: `feat(provider-kubernetes): implement isolated namespace manager`
- **Recommended Agent Role**: Safety

### Issue 9.3: Implement Kubernetes Apply (Deploy) Executor

- **Description**: Implement the `deploy` method conforming to `DeploymentProvider`. Run `kubectl apply` inside the isolated namespace and poll for resource status until rollout is complete.
- **Target Commit**: `feat(provider-kubernetes): implement kubernetes apply deployer`
- **Recommended Agent Role**: Implementation

### Issue 9.4: Implement Kubernetes Delete Executor with Safety Guardrails

- **Description**: Implement the `destroy` method. Delete the run-specific namespace, which automatically triggers cascading garbage collection of all deployed pods, services, and configurations.
- **Target Commit**: `feat(provider-kubernetes): implement kubernetes namespace destroyer`
- **Recommended Agent Role**: Safety

### Issue 9.5: Add Mock and Unit Tests for Kubernetes Provider

- **Description**: Add unit tests in `provider-kubernetes` mocking child process command execution to verify rollout check loops and failures.
- **Target Commit**: `test(provider-kubernetes): add mock and unit tests`
- **Recommended Agent Role**: Test

### Issue 9.6: Add Opt-In Integration Tests for Kubernetes Provider

- **Description**: Add integration tests that deploy and destroy a basic Pod configuration on a local cluster (like minikube or kind), gated by `RUN_KUBERNETES_INTEGRATION_TESTS === "true"`.
- **Target Commit**: `test(provider-kubernetes): add kubernetes integration tests`
- **Recommended Agent Role**: Test

---

## Acceptance Criteria

- The `@stack-test/provider-kubernetes` package registers cleanly under the workspace.
- Executing `stacktest run --provider kubernetes` is supported.
- Manifests apply cleanly inside run-isolated namespaces.
- Deleting namespaces cleans up all resources without orphans.
- The monorepo builds, lint checks pass, and all unit tests run successfully.
