# CLI Command Reference

The command-line interface exposes operations for validation, matrix planning, test execution, and cleanup.

## Usage

```text
Usage:
  stacktest --version | -v
  stacktest lint [--config <path>]
  stacktest plan [--config <path>] [--json]
  stacktest run [--config <path>] [--provider <name>] [--skip-cleanup] [--retain-on-failure] [--concurrency <num>] [--dashboard] [--dashboard-port <num>]
  stacktest dashboard [--dir <path>] [--runs-dir <path>] [--port <num>] [--host <addr>] [--open | --no-open] [--mock] [--enable-actions]
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
- `--dashboard`: Starts the local dashboard after the run and opens the run detail page.
- `--dashboard-port <num>`: Sets the dashboard port for run integration.

### Local Dashboard (`dashboard`)
Starts the local-only dashboard for run history, deployment events, and artifacts.
```bash
npx stacktest dashboard [options]
```
- `--dir <path>`: StackTest data directory. Defaults to `.stacktest`.
- `--runs-dir <path>`: Override the run artifact directory. Defaults to `.stacktest/runs`.
- `--port <num>`: Dashboard port. Defaults to `3456`.
- `--host <addr>`: Bind address. Defaults to `127.0.0.1`.
- `--open`: Open the dashboard in the browser.
- `--no-open`: Print the URL without opening the browser.
- `--mock`: Serve deterministic mock data for demos and screenshots.
- `--enable-actions`: Parsed for future compatibility; browser-based test launching remains disabled in this release.
