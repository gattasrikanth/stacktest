# Contributing to StackTest

First off, thank you for considering contributing to StackTest! We want to make contributing to this project as easy and safe as possible.

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

---

## Testing Guidelines

We prioritize **safety** and **local isolation**.

1. **Unit Tests**: All core logic, planners, and parsers must have unit tests. Running `pnpm test` should run entirely in-memory with zero network connections.
2. **Cloud Mocking**: When developing provider code, mock external API endpoints (using libraries like `aws-sdk-client-mock`).
3. **Opt-in Integration Tests**: Integration tests executing actual cloud deployments must be explicitly enabled using the `RUN_AWS_INTEGRATION_TESTS=true` environment flag. They are skipped by default.
