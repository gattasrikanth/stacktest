# Phase 00: Foundation

## Goal

Establish a clean, robust, and well-governed TypeScript monorepo with pnpm workspaces, essential tooling (linting, formatting, testing), CI automation, and governance files. This phase also implements the basic command-line interface skeleton to confirm the monorepo functions together.

## Deliverables

- **Root Configuration**: Monorepo root `package.json`, `pnpm-workspace.yaml`, and `tsconfig.base.json`.
- **Package Structures**:
  - `packages/core`: The core logic container.
  - `packages/cli`: The user-facing command-line entrypoint.
- **Tooling Stack**: Vitest config for unit testing, ESLint for code linting, Prettier for formatting, and `tsup` for compiling/bundling.
- **CI Configuration**: GitHub Actions workflow (`.github/workflows/ci.yml`) to automatically install, build, lint, and run tests on push and PR.
- **Governance Documents**: Drafts/stubs for `README.md`, `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md`, `ARCHITECTURE.md`, and `AGENTS.md`.
- **Version Check MVP**: A command-line utility `stacktest --version` / `stacktest -v` that prints the active version.

## GitHub Issues to Create

### Issue 0.1: Initialize Monorepo Project Structure

- **Description**: Configure pnpm workspaces, TS base configurations, and create initial package directory structures for `packages/core` and `packages/cli`.
- **Target Commit**: `chore: initialize monorepo workspaces and typescript configs`
- **Recommended Agent Role**: Architect

### Issue 0.2: Add Repository Governance and Contributor Guidelines

- **Description**: Author the root governance documents (`README.md`, `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md`, `ARCHITECTURE.md`, and `AGENTS.md`) matching the StackTest vision.
- **Target Commit**: `docs: add repository governance and guidelines`
- **Recommended Agent Role**: Documentation

### Issue 0.3: Setup Linter, Formatter, and Unit Testing Tools

- **Description**: Integrate Vitest, ESLint, Prettier, and `tsup` at the root and package levels. Verify rules pass across the project.
- **Target Commit**: `chore: configure eslint, prettier, tsup, and vitest`
- **Recommended Agent Role**: Test

### Issue 0.4: Implement CLI Skeleton with Version Query Command

- **Description**: Scaffold the `cli` package using a simple command parser (e.g. `commander` or vanilla argv processing) to output the tool version. Export package information from `core`.
- **Target Commit**: `feat(cli): implement basic version command`
- **Recommended Agent Role**: Implementation

### Issue 0.5: Setup GitHub Actions CI Workflow

- **Description**: Create `.github/workflows/ci.yml` that checks out code, sets up Node.js and pnpm, runs `pnpm install`, builds the monorepo, runs linter checks, and executes unit tests.
- **Target Commit**: `chore: add github actions ci workflow`
- **Recommended Agent Role**: Documentation

## Acceptance Criteria

- Running `pnpm install`, `pnpm build`, `pnpm test`, and `pnpm lint` in the root must complete successfully with zero warnings/errors.
- Executing the built CLI with `-v` or `--version` flags outputs the correct version string (e.g., `StackTest v0.1.0`).
- The repository compiles cleanly with no implicit `any` TS errors.

## Test Requirements

- Unit tests verifying the version output string format.
- Mocks to capture `console.log` output when CLI command is run.
- Tests validating that `packages/core` exports match package config expectations.

## Safety Notes

- Ensure no cloud provider dependencies or credentials configurations are introduced yet.
- Configure `.gitignore` to prevent any build logs, temporary cache directories, or local IDE configs from being committed.
