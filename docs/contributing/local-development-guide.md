# Local Development Guide

This document details how to set up, build, test, and contribute to the StackTest repository.

---

## 1. Project Modularity

StackTest is configured as a `pnpm` monorepo workspace. The codebase is divided into modular packages:

- `packages/core`: Contains config loaders, planning logic, orchestration executors, variables resolvers, and report generation utilities.
- `packages/cli`: Thin user CLI commands entrypoint wrapper.
- `packages/provider-aws-cloudformation`: AWS CloudFormation provider implementation.

---

## 2. Setting Up Locally

### Prerequisites

- Node.js (v20 or higher is recommended)
- `pnpm` package manager (`npm install -g pnpm`)

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/gattasrikanth/stacktest.git
   cd stacktest
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Compile all packages:
   ```bash
   pnpm build
   ```

---

## 3. Tooling and Code Hygiene

We use ESLint and Prettier to maintain consistent style guidelines.

- **Lint checking**:
  ```bash
  pnpm lint
  ```
- **Code formatting**:
  ```bash
  pnpm format
  ```

Run these scripts before committing changes or opening pull requests to prevent build pipeline failures.

---

## 4. Testing Paradigm

StackTest requires all logic to be tested locally without hitting live cloud targets by default.

### Running Tests

To run the full test suite locally:

```bash
pnpm test
```

### Mocking External APIs

When writing provider tests, mock the cloud SDK clients using dedicated testing mock frameworks (such as `aws-sdk-client-mock` library for AWS SDK v3). Do not connect to real APIs during local unit tests.

### Opt-In Integration Tests

To verify compatibility against live cloud setups, we write opt-in integration tests. These tests deploy light, fast resources (such as an SQS queue) and verify deployment and safety deletion flows.

Enable integration tests by defining env flags:

```bash
RUN_AWS_INTEGRATION_TESTS=true AWS_REGION=us-east-1 pnpm test
```

_Note: Make sure your local AWS CLI is configured with credentials prior to running integration tests._

---

## 5. Submitting Contributions

1. Create a branch matching our naming convention:
   ```bash
   git checkout -b issue/<number>-short-description
   ```
2. Make your code adjustments. Include unit tests.
3. Verify lint, formatting, building, and unit tests:
   ```bash
   pnpm lint && pnpm format && pnpm build && pnpm test
   ```
4. Commit your changes using structured prefixes:
   - `feat(core): ...`
   - `feat(cli): ...`
   - `test(provider-aws-cloudformation): ...`
   - `chore: ...`
   - `docs: ...`
5. Open a Pull Request referencing the Issue number.
