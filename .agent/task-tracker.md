# Agent Task Tracker

## Local Dashboard MVP + Live Run Viewer

- **Status**: Complete
- **Scope**: Implement local dashboard server, React UI, normalized run artifacts, live event stream support, deterministic mock mode, docs, and screenshots. Browser-based test launcher remains disabled.
- **Docs reviewed**: `README.md`, `website/docs/cli/reference.md`, `website/docs/getting-started/quick-start.md`, `website/docs/core-concepts/reports.md`, `website/docs/architecture/system-overview.md`, `docs/agent-documentation-sync-policy.md`, `docs/raw-requirements/stacktest-local-dashboard-design.md`
- **Docs updated**: `README.md`, `website/docs/cli/reference.md`, `website/docs/getting-started/quick-start.md`, `website/docs/core-concepts/reports.md`, `website/docs/architecture/system-overview.md`, `website/docs/core-concepts/local-dashboard.md`, `website/sidebars.ts`, `docs/design/local-dashboard-design.md`
- **Verification run**: `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm docs:build`, `pnpm docs:screenshots`, local mock dashboard HTTP probes on `127.0.0.1:4567`
- **Known limitations**: The launch-test UI and actions API are intentionally disabled for this release.
