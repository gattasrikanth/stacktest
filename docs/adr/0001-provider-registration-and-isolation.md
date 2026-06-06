# ADR 0001: Provider Registration and Isolation

- **Status**: Accepted
- **Date**: 2026-06-06
- **Authors**: Architect Agent

---

## 1. Context and Problem Statement

StackTest is a test execution framework designed to validate cloud infrastructure configurations. The framework must support a variety of deployment backends (e.g., AWS CloudFormation, GCP Cloud Run, HashiCorp Terraform).

If concrete deployment logic and dependencies (like platform SDKs) are bundled directly into the core execution engine:

- The core package inherits deep, heavy dependencies from multiple cloud platforms, bloating install size.
- Adding a new provider requires modifications to core registry source code, creating bottlenecks for third-party contributors.
- Testing the core framework becomes difficult due to dependencies on live configurations or complex mocking across multiple SDKs.

We need a design that keeps the core package completely provider-agnostic while enabling easy, decoupled provider integration.

---

## 2. Decision

We establish strict logical boundaries between `@stacktest/core` and concrete providers using an **interface-registry pattern**:

1. **Agnostic Core Boundary**: `@stacktest/core` defines the `DeploymentProvider` interface. Core logic (planners, variable resolvers, orchestrators) depends _only_ on this interface, never on platform-specific clients or SDKs.
2. **Provider Modularity**: Each concrete provider is implemented in a separate workspace package (e.g., `packages/provider-aws-cloudformation` or as a standalone third-party npm library).
3. **Dynamic Registry Engine**: Core provides a static `ProviderRegistry` class.
4. **Auto-Registration**: Concrete provider packages register their instances with the registry when imported:

   ```typescript
   import { ProviderRegistry } from "@stacktest/core";
   import { MyProvider } from "./my-provider.js";

   ProviderRegistry.register(new MyProvider());
   ```

5. **Decoupled CLI Loading**: The user entrypoint (CLI) dynamically imports and registers built-in providers, ensuring the orchestrator resolves them at runtime based on user configurations.

---

## 3. Consequences

### Positive

- **Decoupled Codebase**: Core is entirely decoupled from external platform SDKs, simplifying unit testing and dependency resolution.
- **NPM Modularity**: Users install only the provider modules they need.
- **Extensible Contributor Experience**: Third-party developers can build, package, and publish custom providers as independent npm packages without needing upstream approval or code modifications in the core StackTest repository.

### Negative / Trade-offs

- **Registry State Management**: The provider registration state is global. Tests must ensure they reset the registry or ignore duplicate registration errors.
- **Double Imports**: Developers must ensure the provider module is imported/loaded once at startup so it runs its self-registration block before orchestration starts.
