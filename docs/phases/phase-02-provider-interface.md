# Phase 02: Provider Interface and Orchestration

## Goal

Define the core abstraction contracts that allow StackTest to remain provider-agnostic, implement a dynamic value replacement engine, and build a local execution harness using a Fake Provider. This allows testing of execution scheduling, parallelism, and error boundaries entirely in memory without hitting any cloud providers.

## Deliverables

- **Provider Contracts**:
  - `DeploymentProvider` interface: Defining lifecycle operations (`deploy`, `destroy`, `getEvents`).
  - `ProviderRegistry`: Core catalog storing and matching config-defined providers to implementations.
- **Dynamic Value Parser & Resolver**:
  - A utility processing `$[stacktest_...]` syntax in deployment parameters.
  - Built-in resolvers for run-specific variables (e.g. `$[stacktest_project_name]`, `$[stacktest_region]`, `$[stacktest_run_id]`, `$[stacktest_genuuid]`, `$[stacktest_genpass_16]`).
- **Run Orchestrator**: The execution engine in `packages/core` that schedules, runs, and monitors multiple planned deployments.
- **Fake Provider**: A mock implementation package representing cloud behavior (supports simulated deployment lag, successful creation, rollback, and custom failure flags).
- **Execution CLI**: `stacktest run` command integrating planning, value replacement, orchestration, and a basic console status reporter.

## GitHub Issues to Create

### Issue 2.1: Define `DeploymentProvider` and Results Interfaces

- **Description**: Add core TS interfaces for `DeploymentProvider`, `DeploymentResult`, `DeploymentEvents`, and associated error classes in `packages/core`.
- **Target Commit**: `feat(core): define provider and result interface contracts`
- **Recommended Agent Role**: Architect

### Issue 2.2: Implement `ProviderRegistry`

- **Description**: Create the registration engine to handle loading, listing, and retrieving provider modules dynamically using logical identifiers.
- **Target Commit**: `feat(core): implement core provider registration engine`
- **Recommended Agent Role**: Architect

### Issue 2.3: Implement `DynamicValueParser` and Built-in Resolvers

- **Description**: Build a parser to extract `$[...]` dynamic syntax from configuration parameters. Implement resolvers for project name, region, run ID, and utility functions like random UUID and password generators.
- **Target Commit**: `feat(core): add dynamic value parser and default resolvers`
- **Recommended Agent Role**: Implementation

### Issue 2.4: Build the Mock `FakeProvider`

- **Description**: Create a fully featured mock provider to simulate stack creation, stack update, stack deletion, and realistic failure/rollback states based on input parameters.
- **Target Commit**: `feat(core): implement FakeProvider for safe local testing`
- **Recommended Agent Role**: Test

### Issue 2.5: Implement Run Orchestrator

- **Description**: Build the scheduling engine to execute planned deployment steps. Support sequential processing (with potential future parallel execution hooks).
- **Target Commit**: `feat(core): implement orchestration scheduler for deployments`
- **Recommended Agent Role**: Implementation

### Issue 2.6: Connect CLI `run` Command with Console Reporter

- **Description**: Add the `run` command to CLI. When executed with `--provider fake`, it resolves configs, runs them through the orchestrator using `FakeProvider`, and displays a clean visual report of results.
- **Target Commit**: `feat(cli): add run command supporting fake provider`
- **Recommended Agent Role**: Implementation

## Acceptance Criteria

- `stacktest run --provider fake` correctly parses inputs, resolves variables, runs simulated tasks, and logs statistics of passed/failed deployments.
- Dynamic values like `$[stacktest_genuuid]` resolve to actual unique UUID strings during pre-execution.
- If a simulated deployment fails, the orchestrator triggers a cleanup (destruction) of the corresponding resources.
- Zero network or cloud provider SDK dependencies are required.

## Test Requirements

- Vitest unit tests verifying that all dynamic values resolve correctly and throw helpful errors on unknown tokens.
- Orchestrator tests verifying behavior when multiple deployments are executed (e.g. tracking that subsequent tasks run even if an earlier task fails).
- Verification that generated random passwords have requested lengths and characters.

## Safety Notes

- **CRITICAL**: Ensure generated sensitive properties (like passwords from `$[stacktest_genpass_16]`) are redacted from log outputs, plans, and summaries to prevent secret leaks.
- Ensure that the execution engine handles graceful exit (SIGINT/SIGTERM) by attempting to trigger cleanup on currently running mock deployments.
