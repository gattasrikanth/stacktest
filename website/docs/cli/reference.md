# CLI Command Reference

The command-line interface exposes operations for validation, matrix planning, test execution, and cleanup.

## Usage

```text
Usage:
  stacktest --version | -v
  stacktest lint [--config <path>]
  stacktest plan [--config <path>] [--json]
  stacktest run [--config <path>] [--provider <name>] [--skip-cleanup] [--retain-on-failure] [--concurrency <num>]
```

---

## Detailed Commands

### Version Query
Check the active version of your installed StackTest installation:
```bash
npx stacktest --version
# or
npx stacktest -v
```

### Linting Configurations (`lint`)
Validates the structure of `stacktest.yaml` and confirms referenced templates exist on disk.
```bash
npx stacktest lint [--config <path>]
```

### Plan Matrix (`plan`)
Prints the expanded deployment steps, including dynamic variable resolutions, without running any live requests.
```bash
npx stacktest plan [--config <path>] [--json]
```

### Run Tests (`run`)
Launches the test suite deployments.
```bash
npx stacktest run [--config <path>] [--provider <name>] [--skip-cleanup] [--retain-on-failure] [--concurrency <num>]
```
- `--provider fake`: Runs mock local deployments without hitting real clouds.
- `--skip-cleanup`: Prevents automatic teardown of stacks after execution.
- `--retain-on-failure`: Keeps only failed stacks active for manual debugging.
- `--concurrency <num>`: Sets the parallel deployment limit (defaults to 1).
