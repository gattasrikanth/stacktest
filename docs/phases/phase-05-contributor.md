# Phase 05: Contributor Experience

## Goal

Make it seamless and safe for external developers to contribute to the StackTest project, write and register custom deployment providers, run monorepo workflows locally, and maintain core decoupling through formalized architectural decision records (ADRs).

## Deliverables

- **Provider Authoring Guide**: A comprehensive markdown guide detailing how to implement, mock, and register a custom `DeploymentProvider` with core engines.
- **Local Development Guide**: A technical reference covering monorepo workspace scripts, compiling, formatting, and executing unit and integration tests.
- **GitHub Templates**:
  - Issue templates: Bug Report, Feature Request, and Provider Request.
  - Pull Request template.
- **Architecture Decision Record (ADR)**: ADR 0001 documenting core provider-agnosticism, separate package boundaries, and registry design.

## GitHub Issues to Create

### Issue 5.1: Create Local Development and Provider Authoring Guides

- **Description**: Author `docs/contributing/local-development-guide.md` and `docs/contributing/provider-authoring-guide.md` to guide new developers in monorepo development and custom provider package development.
- **Target Commit**: `docs: add local development and provider authoring guides`
- **Recommended Agent Role**: Documentation

### Issue 5.2: Set Up GitHub Issue and PR Templates

- **Description**: Add issue templates (`.github/ISSUE_TEMPLATE/`) and pull request template (`.github/pull_request_template.md`) to standardise bug reports, feature requests, and provider contributions.
- **Target Commit**: `chore: configure github issue and pull request templates`
- **Recommended Agent Role**: Documentation

### Issue 5.3: Document Architecture Decision Record (ADR 0001)

- **Description**: Formulate ADR `docs/adr/0001-provider-registration-and-isolation.md` explaining provider modularity and the Registry design.
- **Target Commit**: `docs: add adr for provider registration and isolation`
- **Recommended Agent Role**: Architect

## Acceptance Criteria

- All documentation files are cleanly formatted and linked.
- Issue and PR templates are located in standard `.github/` directories.
- The monorepo compiles and runs test suites cleanly.
