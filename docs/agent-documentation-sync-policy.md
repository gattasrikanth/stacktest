# Agent Documentation Sync Policy

## Purpose

This document defines a generic documentation-sync workflow for AI-assisted software development.

The goal is to prevent source code and documentation from drifting out of sync when humans or AI agents make commits, merge changes, or push updates to the main branch.

This policy can be used in any source code repository and may be copied into:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/agent-documentation-sync-policy.md`
- repository onboarding docs
- AI agent steering instructions

---

## Core Rule

Source code and documentation must stay aligned.

Every AI agent working in this repository must treat documentation review as part of the development lifecycle, not as an optional cleanup task.

A task is not considered complete until the agent has:

1. Reviewed the relevant documentation.
2. Updated documentation if behavior changed.
3. Recorded why no documentation update was needed if no update was made.
4. Committed changes in small, logical commits.

---

## When Agents Must Review Documentation

Agents must review documentation in the following situations:

1. At the start of every work session.
2. After pulling or fetching the latest changes from the main branch.
3. After detecting new commits on the main branch.
4. Before committing source code changes.
5. Before pushing changes.
6. Before opening a pull request.
7. After resolving merge conflicts.
8. After changing any public behavior, developer workflow, API, schema, configuration, deployment flow, UI, CLI, or test workflow.

---

## Required Start-of-Session Checks

At the beginning of every agent session, run:

```bash
git status
git branch --show-current
git fetch origin
git log --oneline --decorate -10
```

If the repository has a `main` branch, also run:

```bash
git diff --name-status HEAD..origin/main
git log --oneline HEAD..origin/main
```

If the repository uses `master`, `trunk`, or another default branch, replace `main` with the repository's default branch.

The agent must inspect any new commits before starting new work.

---

## Required Pre-Commit Checks

Before every commit, agents must run:

```bash
git status
git diff --name-status
git diff --cached --name-status
```

Then the agent must answer:

1. Did source behavior change?
2. Did configuration change?
3. Did setup or runtime instructions change?
4. Did API, CLI, UI, schema, or workflow behavior change?
5. Did test commands or validation steps change?
6. Did security, permissions, credentials, or operational assumptions change?
7. Are existing docs now inaccurate or incomplete?

If the answer to any question is yes, documentation must be reviewed and updated.

---

## Documentation Files to Inspect

Agents should inspect any documentation relevant to the changed code, including but not limited to:

- `README.md`
- `AGENTS.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `docs/**/*.md`
- architecture documents
- design documents
- setup guides
- runbooks
- API documentation
- CLI documentation
- database or schema documentation
- environment variable documentation
- deployment documentation
- testing documentation
- troubleshooting documentation
- security documentation
- local task tracker files

---

## Documentation Update Rules

Documentation must describe the current implemented behavior.

Agents must not document planned behavior as if it already exists.

Use clear status labels where needed:

- `Implemented`
- `Partially implemented`
- `Planned`
- `Deprecated`
- `Removed`
- `Experimental`

If documentation and source code disagree, the agent must verify the current implementation using source code, tests, configuration, and runtime behavior where practical. Then the agent must update the documentation to match the implementation.

---

## Main Branch Sync Workflow

When the user says new commits were pushed to the main branch, or when the agent detects that the local branch is behind the remote default branch, the agent must follow this workflow before new feature work:

```bash
git fetch origin
git status
git log --oneline HEAD..origin/main
git diff --name-status HEAD..origin/main
git diff --stat HEAD..origin/main
```

Then:

1. Inspect the changed files.
2. Identify behavior changes.
3. Search docs for related sections.
4. Update stale documentation.
5. Add missing documentation if needed.
6. Update the local task tracker.
7. Commit documentation sync separately when appropriate.

Suggested commit message:

```bash
git commit -m "docs: sync documentation with latest main changes"
```

If the default branch is not `main`, use the actual default branch name.

---

## Documentation Drift Detection Checklist

Agents should look for documentation drift in these areas:

### Setup and Installation

- package manager changed
- dependency changed
- environment variable added, renamed, or removed
- local setup command changed
- service startup command changed
- database migration step changed

### Runtime Behavior

- feature behavior changed
- default setting changed
- new mode added
- old mode removed
- error handling changed
- retry behavior changed
- performance-sensitive path changed

### APIs and Interfaces

- endpoint added, changed, or removed
- request or response shape changed
- event payload changed
- CLI command changed
- function contract changed
- configuration schema changed

### Data and Storage

- database schema changed
- migration added
- new table, column, index, or constraint added
- local file format changed
- cache behavior changed
- retention behavior changed

### UI and UX

- new screen added
- workflow changed
- button or action renamed
- status indicator changed
- validation message changed
- important screenshot or instruction became outdated

### Testing and Validation

- test command changed
- new test suite added
- mock behavior changed
- required test data changed
- CI behavior changed
- manual validation steps changed

### Security and Operations

- credential handling changed
- permissions changed
- token flow changed
- logging behavior changed
- sensitive data handling changed
- audit trail changed
- deployment or rollback behavior changed

---

## Local Task Tracker Requirement

Agents should maintain a local tracker file for multi-step work.

Recommended path:

```text
.agent/task-tracker.md
```

If the repo already has a preferred tracker location, use that instead.

Each task entry should include:

```md
## Task: <short task name>

Status: In progress / Complete / Blocked

Code changes:
- ...

Docs reviewed:
- ...

Docs updated:
- ...

Tests run:
- ...

Commits made:
- ...

Known gaps:
- ...
```

If no documentation update was required, the agent must explicitly record the reason:

```md
Docs updated:
- None

Reason:
- Internal refactor only. No behavior, configuration, API, schema, UI, setup, deployment, or testing instructions changed.
```

---

## Commit Strategy

Agents must commit in small, logical chunks.

Preferred pattern:

```bash
git commit -m "feat: add new capability"
git commit -m "docs: update usage guide for new capability"
git commit -m "test: add coverage for new capability"
```

For small changes, source, test, and documentation updates may be combined:

```bash
git commit -m "feat: add new capability with docs and tests"
```

Agents should avoid large mixed commits that combine unrelated source, documentation, formatting, and test changes.

---

## Definition of Done

A task is complete only when all applicable items are done:

- Source code implemented.
- Relevant tests added or updated.
- Existing tests run where practical.
- Documentation reviewed.
- Documentation updated if needed.
- Reason recorded if documentation was not updated.
- Local task tracker updated.
- Changes committed in small logical commits.
- No known source/documentation drift remains.

---

## Suggested Agent Instruction Prompt

Use this prompt with AI coding agents when starting a session:

```text
Before starting new implementation work, review the repository state and check for documentation drift.

1. Run git status and fetch the latest default branch.
2. Inspect recent commits and changed files.
3. Identify whether README, docs, AGENTS.md, setup guides, API docs, schema docs, testing docs, or runbooks are stale.
4. Update documentation to match the current source code behavior.
5. Do not document planned behavior as completed.
6. Use clear labels such as Implemented, Planned, Deprecated, or Removed where needed.
7. Maintain a local task tracker with code changes, docs reviewed, docs updated, tests run, and commits made.
8. Commit changes in small logical chunks.
9. Do not start unrelated new feature work until source and documentation are reconciled.
```

---

## Suggested Pull Request Checklist

Add this checklist to pull requests:

```md
## Documentation Sync Checklist

- [ ] I reviewed the relevant documentation.
- [ ] I updated documentation for behavior, API, config, schema, UI, setup, testing, or deployment changes.
- [ ] If no documentation update was needed, I recorded the reason.
- [ ] I verified that documented commands and examples are still accurate.
- [ ] I avoided documenting planned behavior as implemented behavior.
- [ ] I updated the local task tracker or implementation notes.
```

---

## Recommended Repository Files

For best results, add one or more of these files to each repo:

```text
AGENTS.md
CONTRIBUTING.md
docs/agent-documentation-sync-policy.md
.github/pull_request_template.md
.agent/task-tracker.md
```

---

## Optional Automation Ideas

This policy can be strengthened with automation:

1. Pull request template requiring documentation confirmation.
2. CI check that warns when source files changed but docs did not.
3. Script that maps source paths to documentation paths.
4. Commit hook that reminds agents to update docs.
5. Release checklist requiring docs review.
6. Changelog generation from commits.

Automation should assist the agent, but it should not replace the agent's responsibility to verify documentation accuracy.

---

## Final Principle

Documentation sync is not a separate task after coding.

Documentation sync is part of coding.

Agents must leave the repository in a state where future humans and agents can understand the actual current behavior without reverse-engineering the source code from scratch.
