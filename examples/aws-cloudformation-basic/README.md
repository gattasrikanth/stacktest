# AWS CloudFormation Basic Sandbox

This is a local, sandbox-style test environment for verifying **StackTest** with real AWS CloudFormation resources. 

It deploys a single, lightweight AWS SQS queue template to verify deployment flow, status polling, event streams, failure reporting, and safety-guarded resource cleanup.

---

## 1. Prerequisites

First, build the StackTest monorepo packages from the repository root:

```bash
# From the repository root
pnpm install
pnpm build
```

---

## 2. Configure AWS Credentials

StackTest automatically resolves credentials using the standard AWS SDK credential provider chain. Ensure you have AWS credentials set in your shell environment:

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-east-1"
# Alternatively, if you use profiles:
# export AWS_PROFILE="your-aws-profile-name"
```

---

## 3. Running StackTest Commands

You can run the CLI commands either using the helper scripts in the root `package.json` (recommended) or calling the compiled CLI directly.

### Option A: Using Workspace NPM Scripts (Recommended)

From the root of the repository, execute:

1. **Lint Configuration**:
   Validates the configuration structure and confirms all referenced templates exist on disk.
   ```bash
   pnpm sandbox:lint
   ```

2. **Generate Matrix Plan**:
   Prints the expanded planned deployments including naming strategies without modifying your cloud resources.
   ```bash
   pnpm sandbox:plan
   ```

3. **Run Suite (Deploy & Clean Up)**:
   Deploys the SQS queue stack, logs output, validates its success, and automatically deletes the resources on completion.
   ```bash
   pnpm sandbox:run
   ```

4. **Run Suite (Retaining Resources)**:
   Runs the test deployment but skips teardown so you can inspect the resources in your AWS Console. Remember to run a standard deployment afterwards or delete the stack manually to clean up.
   ```bash
   pnpm sandbox:run-no-cleanup
   ```

### Option B: Executing the CLI Directly

You can execute the CLI binary relative to the root directory:

```bash
# Lint config
node packages/cli/dist/index.js lint --config examples/aws-cloudformation-basic/stacktest.yaml

# Plan matrix
node packages/cli/dist/index.js plan --config examples/aws-cloudformation-basic/stacktest.yaml

# Run tests
node packages/cli/dist/index.js run --config examples/aws-cloudformation-basic/stacktest.yaml
```

---

## 4. Inspecting Reports

After executing `run`, StackTest outputs generated reports to the `.stacktest/runs/` folder at the root of the repository.

Inside `.stacktest/runs/<run-id>/`, you will find:
- **`report.json`**: Machine-readable JSON output containing full plan, execution duration, and statuses.
- **`junit.xml`**: JUnit-compatible test result XML (ideal for CI/CD pipelines).
- **`report.html`**: Interactive, responsive HTML report showcasing the execution timeline, resources, and log results.
