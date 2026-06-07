# Agent Task Tracker

## Local Dashboard MVP + Live Run Viewer

- **Status**: Complete
- **Scope**: Implement local dashboard server, React UI, normalized run artifacts, live event stream support, deterministic mock mode, docs, and screenshots. Browser-based test launcher remains disabled.
- **Docs reviewed**: `README.md`, `website/docs/cli/reference.md`, `website/docs/getting-started/quick-start.md`, `website/docs/core-concepts/reports.md`, `website/docs/architecture/system-overview.md`, `docs/agent-documentation-sync-policy.md`, `docs/raw-requirements/stacktest-local-dashboard-design.md`
- **Docs updated**: `README.md`, `website/docs/cli/reference.md`, `website/docs/getting-started/quick-start.md`, `website/docs/core-concepts/reports.md`, `website/docs/architecture/system-overview.md`, `website/docs/core-concepts/local-dashboard.md`, `website/sidebars.ts`, `docs/design/local-dashboard-design.md`
- **Verification run**: `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm docs:build`, `pnpm docs:screenshots`, local mock dashboard HTTP probes on `127.0.0.1:4567`
- **Known limitations**: The launch-test UI and actions API are intentionally disabled for this release.

## GitHub Actions Dashboard Follow-Up

- **Status**: Complete
- **Scope**: Diagnose and fix failing GitHub Actions runs after the dashboard MVP commit.
- **Docs reviewed**: `.github/workflows/ci.yml`, `.github/workflows/docs.yml`, `.github/workflows/docs-quality.yml`, `scripts/generate-docs.js`, `docs/agent-documentation-sync-policy.md`
- **Docs updated**: `scripts/generate-docs.js`, generated `website/docs/cli/reference.md`, generated `website/docs/api/**`
- **Verification run**: `pnpm exec prettier --check "packages/**/src/**/*.ts" "docs/**/*.md"`, `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm docs:build`
- **Known limitations**: `pnpm docs:check` was run and correctly reported generated docs drift before the generated docs were committed; it should pass after this fix commit is included.
