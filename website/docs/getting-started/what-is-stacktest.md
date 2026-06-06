# What is StackTest?

StackTest is a provider-agnostic infrastructure testing framework. It allows you to deploy infrastructure templates (such as CloudFormation, Terraform, AWS CDK, Pulumi, Kubernetes, and Azure Bicep) across one or more regions or environments, validate whether they succeed, collect events, clean up resources safely, and produce comprehensive reports.

Inspired by the core concepts of `taskcat`, StackTest provides multi-provider extensibility with an absolute focus on **safety** and **isolation**.

---

## Why StackTest?

Testing cloud infrastructure templates is notoriously difficult:
- **State Pollution**: Leftover resources from failed runs accumulate costs and pollute cloud accounts.
- **Accidental Deletions**: Automated cleanup scripts can easily delete critical external resources if not carefully gated.
- **Provider Coupling**: Most tools are tightly coupled to a single cloud provider or IaC framework.
- **Dynamic Values**: Injecting dynamic variables (like random passwords, unique IDs, or region names) into templates is often clunky.

StackTest addresses these issues by decoupling test planning and orchestration from provider-specific logic, enforcing tag-based ownership checks for cleanups, and allowing simple dynamic value interpolation in parameters.
