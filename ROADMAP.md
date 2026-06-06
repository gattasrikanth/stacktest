# StackTest Roadmap

This document outlines the current plan and long-term direction of the StackTest framework.

---

## Near-Term Milestones (MVP)

- [ ] **Milestone A — Local-only Engine**: Configuration parsing, planning, validation, dynamic value resolver, and local orchestration scheduling with simulated fakes.
- [ ] **Milestone B — AWS CloudFormation Deploy**: Live stack deployment, event tracking, rollback failure analysis, and safe tag-scoped cleanup.
- [ ] **Milestone C — Reporting & CI**: Outputting standardized JSON reports, JUnit XML files, and console logs fit for automated pipeline tasks.
- [ ] **Milestone D — Contributor Ready Provider API**: Clear separation of internal interfaces to enable developers to author and package standalone providers.

---

## Future Direction (Post-MVP)

- [ ] **Terraform Provider Support**: Adding support for Terraform plans and state execution cycles.
- [ ] **AWS CDK Integration**: Direct parsing of CDK output configurations and synthesized cloud assembly templates.
- [ ] **Interactive Web UI Dashboard**: Local/CI reporting dashboard allowing developers to view logs and errors in real-time.
- [ ] **Multi-account and Cross-region Parallel Scheduling**: Enhanced orchestrator enabling test executions across multiple target accounts concurrently.
