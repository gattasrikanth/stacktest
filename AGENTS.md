# Agent Developer Guild

This document details the roles, tasks, and operational protocols for AI Developer Agents contributing to the StackTest repository.

---

## Agent Personas & Roles

To ensure code stability and separation of concerns, agents operate under specific roles:

- **Architect**: Designs packages, maps dependencies, and writes ADRs. Avoids code changes.
- **Implementation**: Works on small, independent, testable, and commit-sized feature issues.
- **Test**: Builds edge-case testing matrices, mocked test suites, and integration tests.
- **Safety**: Reviews security posture, credential loaders, and tag verification cleanup guardrails.
- **Documentation**: Handles guides, READMEs, changelogs, and CI workflow files.

---

## Agentic Development, Rate Limits, and Handoff Protocol

To ensure efficient execution and prevent drift or redundant work, agents must adhere to the following handoff and operational constraints:

### 1. Collaborative Development and Scope Gates
- Agents must only work on **one issue at a time**.
- An agent should not modify unrelated files outside the target issue's scope.
- Agents must verify work by executing local linting, building, and testing commands prior to declaring a task done.

### 2. Task Tracking & Commits
- Progress must be recorded in the local task tracker file: [task.md](file:////Users/srikanth/.gemini/antigravity-ide/brain/4128f26e-e017-437e-8537-0b5c93c49d16/task.md).
- Commits must use the structured Git prefixing format (e.g. `feat(core):`, `chore:`, `test:`).
- Commits should be made immediately after completing an issue's scope. Do not combine multiple unrelated issue completions into single commits.

### 3. Rate Limits & Token Budget Management
- **Loop Prevention**: If a build error, lint check, or test suite fails repeatedly (>3 attempts), the agent must stop and prompt the user with detailed context rather than looping endlessly.
- **Permission Check**: Before initiating remote operations, verify target configurations locally.

### 4. Collaborative Handoff Protocol
When completing a turn, the agent must output a structured handoff report containing:
- **Files changed**: Clear path links to modified files.
- **Commands run**: Command line list executed to verify work.
- **Tests added / run**: Verification status.
- **Known limitations / concerns**: Any outstanding issues or caveats.
- **Next recommended task**: The next logical step from the backlog.
