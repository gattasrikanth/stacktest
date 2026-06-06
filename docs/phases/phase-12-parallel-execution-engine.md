# Phase 12: Parallel Execution Engine

## Goal

Optimize test suite runs by executing non-dependent test configurations and regional runs concurrently, maximizing hardware utilization and minimizing pipeline execution times.

---

## Deliverables

- **Concurrency Limiter Helper**: A zero-dependency concurrent worker pool mapping groups executions to available threads.
- **Orchestrator Refactoring**: Extract group-specific execution logic and apply the concurrency limiter over grouped plans.
- **CLI Options Integration**: Add support for the `--concurrency <number>` flag in the CLI `run` command.
- **Unit and Concurrency Tests**: Build tests checking concurrent scheduler ordering, resource isolation, and limit enforcement.

---

## GitHub Issues to Create

### Issue 12.1: Implement Concurrency Limiter Pool

- **Description**: Implement a concurrent promise worker pool helper `runWithConcurrencyLimit` inside the core engine.
- **Target Commit**: `feat(core): implement zero-dependency concurrency promise pool helper`
- **Recommended Agent Role**: Architect

### Issue 12.2: Refactor Orchestrator for Concurrent Groups Execution

- **Description**: Refactor `RunOrchestrator` to execute independent plan groups (runId-testName-region) in parallel using the concurrency pool.
- **Target Commit**: `feat(core): support parallel execution of run groups in orchestrator`
- **Recommended Agent Role**: Implementation

### Issue 12.3: Integrate Concurrency CLI Flags

- **Description**: Parse `--concurrency` arguments inside the CLI entrypoint and propagate them to the orchestrator.
- **Target Commit**: `feat(cli): add --concurrency flag to CLI run command`
- **Recommended Agent Role**: Implementation

### Issue 12.4: Add Concurrency Test Suite

- **Description**: Add unit tests verifying concurrency limit enforcement, timing logic, and resource separation.
- **Target Commit**: `test(core): add orchestrator concurrency validation tests`
- **Recommended Agent Role**: Test

---

## Acceptance Criteria

- Parallel execution runs successfully when concurrency is configured.
- Concurrency limit is strictly enforced (e.g. no more than $N$ groups run concurrently).
- CLI `--concurrency <num>` flag behaves correctly.
- Test suite compiles, passes lint, and runs successfully.
