# Contributing to StackTest

First off, thank you for considering contributing to StackTest! We want to make contributing to this project as easy and safe as possible.

Refer to the [CI Troubleshooting and Resolution Runbook](docs/contributing/ci-troubleshooting-runbook.md) for detailed instructions on debugging and resolving failing GitHub Actions runs.

---

## Development Workflow

We follow a structured branching and commit workflow to keep the main branch stable and easy to track.

### 1. Branch Naming Conventions

When working on a new task or issue, create a branch using the following pattern:

```text
main
 └── issue/<number>-short-description
```

Example:
```bash
git checkout -b issue/4-cli-version-command
```

### 2. Commit Message Formats

We use structured prefixes to make git history legible:

- `chore:` - Tooling config, dependencies, monorepo initialization.
- `feat:` - Implementing a new user-facing feature or logic block.
- `test:` - Adding unit tests or mock configurations.
- `docs:` - Editing guides, decision records, or architectural text.
- `fix:` - Addressing code bugs or error conditions.

### 3. Documentation Sync Requirement

To prevent implementation and documentation from drifting out of sync:
- Contributors (including human developers and AI agents) must review and update relevant documentation for any behavioral, configuration, API, CLI, or testing changes.
- Refer to the [Agent Documentation Sync Policy](file:///Users/srikanth/Desktop/Personal/Github/stacktest/docs/agent-documentation-sync-policy.md) for full instructions, checks, and checklists.
- Be sure to complete the Documentation Sync Checklist when submitting a Pull Request.

### 4. Release Planning & Changesets

We use Changesets to plan releases and bump versions. If your PR changes runtime behavior, CLI commands, APIs, or provider behavior, run:
```bash
pnpm changeset
```
Follow the prompts to add a changeset detailing the changes.
For full details on the release process, refer to the [Releasing Guide](docs/RELEASING.md).

---

## Testing Guidelines

We prioritize **safety** and **local isolation**.

1. **Unit Tests**: All core logic, planners, and parsers must have unit tests. Running `pnpm test` should run entirely in-memory with zero network connections.
2. **Cloud Mocking**: When developing provider code, mock external API endpoints (using libraries like `aws-sdk-client-mock`).
3. **Opt-in Integration Tests**: Integration tests executing actual cloud deployments must be explicitly enabled using the `RUN_AWS_INTEGRATION_TESTS=true` environment flag. They are skipped by default.
