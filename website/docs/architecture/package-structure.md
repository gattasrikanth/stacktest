# Package Structure

StackTest is built as a TypeScript monorepo:

- **`packages/core`**: Provider-agnostic planning, resolver, and execution orchestrator.
- **`packages/cli`**: Thin entrypoint wrapper.
- **`packages/provider-*`**: Decoupled deployment providers (AWS CloudFormation, Terraform, Kubernetes, etc.).
