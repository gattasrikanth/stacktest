# StackTest Roadmap

This document outlines the current plan and long-term direction of the StackTest framework.

---

## Near-Term Milestones (MVP)

- [x] **Milestone A — Local-only Engine**: Configuration parsing, planning, validation, dynamic value resolver, and local orchestration scheduling with simulated fakes.
- [x] **Milestone B — AWS CloudFormation Deploy**: Live stack deployment, event tracking, rollback failure analysis, and safe tag-scoped cleanup.
- [x] **Milestone C — Reporting & CI**: Outputting standardized JSON reports, JUnit XML files, and console logs fit for automated pipeline tasks.
- [x] **Milestone D — Contributor Ready Provider API**: Clear separation of internal interfaces to enable developers to author and package standalone providers.

---

## Future Direction (Post-MVP)

- [x] **Terraform Provider Support**: Adding support for Terraform plans and state execution cycles.
- [x] **AWS CDK Integration**: Direct parsing of CDK output configurations and synthesized cloud assembly templates.
- [x] **Kubernetes, Azure Bicep, and Pulumi Providers**: Built standalone provider packages supporting Kubernetes namespace isolation, Azure Bicep resource group deployments, and Pulumi local workspace state execution.
- [x] **Multi-account and Cross-region Parallel Scheduling**: Enhanced orchestrator with inline concurrency pool enabling test runs across regions and providers concurrently.
- [ ] **Interactive Web UI Dashboard**: Local/CI reporting dashboard allowing developers to view logs and errors in real-time.
