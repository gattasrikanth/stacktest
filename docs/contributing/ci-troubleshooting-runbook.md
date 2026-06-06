# GitHub Actions Troubleshooting and Resolution Runbook

This runbook documents how to fetch logs from failing GitHub Actions runs, analyze their output, diagnose common failures, and apply standard fixes.

---

## 1. Fetching CI Run Logs

When a GitHub Actions workflow fails, you can inspect and download the logs using either the GitHub Web UI or the GitHub CLI.

### Option A: Via GitHub CLI (Recommended)

Using the GitHub CLI (`gh`) is often faster than using the Web UI.

1. **List Recent Runs** to identify the failing run ID:
   ```bash
   gh run list --workflow=ci.yml
   ```
2. **View the Run Status** and summary:
   ```bash
   gh run view <run-id>
   ```
3. **Fetch the Complete Logs** directly in your terminal:
   ```bash
   gh run view <run-id> --log
   ```

### Option B: Via GitHub Web UI

1. Navigate to the repository page on GitHub.
2. Click the **Actions** tab.
3. Select the failing run from the list (e.g., `https://github.com/gattasrikanth/stacktest/actions/runs/27053471647/job/79853184690`).
4. Click on the **Build & Test** job to see the step-by-step logs.

---

## 2. Diagnosing & Fixing Common CI Failures

The StackTest CI pipeline comprises five sequential checks. Below are standard diagnosis and resolution protocols for each:

### Pattern A: Node.js & Package Manager Version Mismatch

- **Diagnosis**:
  Look for logs stating that the package manager requirements are unsatisfied:
  ```text
  warn: This version of pnpm requires at least Node.js v22.13
  warn: The current version of Node.js is v20.20.2
  Error [ERR_UNKNOWN_BUILTIN_MODULE]: No such built-in module: node:sqlite
  ```
- **Resolution**:
  Update the Node.js version in the CI workflow file to meet the package manager's requirements:
  1. Open [ci.yml](file:///.github/workflows/ci.yml).
  2. Locate the `Setup Node.js` step:
     ```yaml
     - name: Setup Node.js
       uses: actions/setup-node@v4
       with:
         node-version: 22 # Update this value to a compatible version (e.g., 22 instead of 20)
         cache: "pnpm"
     ```

### Pattern B: Prettier Formatting Violations

- **Diagnosis**:
  Prettier check fails, listing files that do not comply with the repository style configuration:
  ```text
  Checking formatting...
  [warn] packages/provider-azure-bicep/src/index.ts
  [warn] Code style issues found in 1 files. Run Prettier with --write to fix.
  ```
- **Resolution**:
  Format the repository locally before committing:
  ```bash
  pnpm format
  ```

### Pattern C: ESLint Errors

- **Diagnosis**:
  ESLint flags rules violations (e.g., explicit use of `any` types):
  ```text
  /path/to/file.ts
    28:59  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  ```
- **Resolution**:
  Refactor the code to avoid TypeScript violations:
  1. Inspect the source file. Replace `any` types with `unknown` or concrete interfaces.
  2. Validate changes locally by running:
     ```bash
     pnpm lint
     ```

### Pattern D: Test Failures

- **Diagnosis**:
  Vitest reporting failed assertions:
  ```text
  FAIL  packages/core/src/resolver/resolver.test.ts
  ```
- **Resolution**:
  Identify the failing test block and corresponding source file, apply code/test fixes, and verify locally:
  ```bash
  pnpm test
  ```

---

## 3. Pre-Push Verification Checklist

To prevent CI pipeline breakages, run this validation sequence locally before pushing any commits:

```bash
# 1. Install dependencies
pnpm install

# 2. Run automatic formatting
pnpm format

# 3. Check for ESLint violations
pnpm lint

# 4. Run the Vitest test suite
pnpm test
```
