# StackTest Documentation Portal — Repository Audit

## 1. Repository Overview

StackTest is a monorepo containing multiple packages under `packages/`:

- `packages/cli`: A thin command-line entrypoint.
- `packages/core`: Core planning, parsing, validation, and run orchestration engine.
- `packages/provider-aws-cdk`: AWS CDK deployment provider.
- `packages/provider-aws-cloudformation`: AWS CloudFormation deployment provider.
- `packages/provider-azure-bicep`: Azure Bicep deployment provider.
- `packages/provider-kubernetes`: Kubernetes deployment provider.
- `packages/provider-pulumi`: Pulumi deployment provider.
- `packages/provider-terraform`: Terraform deployment provider.

## 2. Package Manager and Build Tooling

- **Package Manager**: `pnpm`
- **Build Commands**:
  - Root: `pnpm build` (runs `tsup` in all packages)
  - Root tests: `vitest run` via `pnpm test`
  - Lint: `pnpm lint` (runs ESLint on package source files)
  - Format: `pnpm format` (runs Prettier)

## 3. Existing Documentation and Workflows

- **Root files**: `README.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, and `AGENTS.md`.
- **Docs directory (`docs/`)**:
  - `docs/adr/0001-provider-registration-and-isolation.md`
  - Phased backlog sheets and development plans under `docs/phases/` and `docs/backlog.md`.
- **Workflows**: GitHub Actions workflow under `.github/workflows/ci.yml`.

## 4. Current CLI, Schema, and API Surfaces

- **CLI Commands**:
  - `stacktest --version` / `-v`
  - `stacktest lint`
  - `stacktest plan`
  - `stacktest run`
- **Config Schemas**: Located in `packages/core/src/config/schema.ts` (Zod-based).
- **Public API**: Decoupled registry, planner, resolver, and orchestrator exported from `packages/core/src/index.ts`.

## 5. Documentation Portal Integration Strategy

We will initialize a Docusaurus application inside the `website/` directory. It will be added to the pnpm monorepo workspace to ease dependency sharing and build step execution. We will write automation scripts to generate CLI help documentation, schema details, and integrate TypeDoc for automatic API surface extraction.
