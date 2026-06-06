# StackTest

StackTest is a provider-agnostic infrastructure testing framework. Deploy infrastructure templates across one or more regions or environments, validate whether they succeed, capture detailed event logs, clean up resources safely, and generate clean reports.

Inspired by the core concepts of `taskcat`, StackTest extends infrastructure testing to support multiple infrastructure providers and IaC frameworks dynamically (e.g. AWS CloudFormation, AWS CDK, Terraform) with a core emphasis on **safety** and **isolation**.

---

## Key Features

- **Provider-Agnostic Core**: Modular design decouples test planning and orchestration from cloud-specific logic.
- **Safety First**: Destructive cleanup operations are strictly gated by ownership tagging verification to ensure StackTest never deletes your external infrastructure.
- **Dynamic Parameter Resolution**: Inject dynamic variables (such as UUIDs, randomized passwords, project names, and region references) into deployment configurations before running tests.
- **Rich Reporting**: Outputs comprehensive JSON reports, JUnit XML for CI integrations, and (coming soon) static local HTML dashboards.

---

## Quick Start

### Installation

```bash
pnpm install
```

### Run Dry-Run Validation

Verify your test matrices and parameters locally using the dry-run command:

```bash
npx stacktest plan
```

### Run Local Orchestration Mock Tests

Execute test runs locally using a mock provider harness (zero cloud dependencies):

```bash
npx stacktest run --provider fake
```

---

## Project Structure

- `packages/core`: Core planning, dynamic resolver, and run orchestration engine.
- `packages/cli`: Thin CLI wrapper exposing command-line interfaces.
- `packages/provider-aws-cloudformation`: AWS CloudFormation target deployment provider (Phase 3).
- `docs/`: Design decisions, roadmap milestones, and phased execution backlogs.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
