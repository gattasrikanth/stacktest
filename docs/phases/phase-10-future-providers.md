# Phase 10: Future Providers (Azure Bicep and Pulumi)

## Goal

Design and implement the Azure Bicep provider (`@stacktest/provider-azure-bicep`) and the Pulumi provider (`@stacktest/provider-pulumi`) as the fifth and sixth concrete deployment backends. These providers validate the complete platform-agnostic capability of the StackTest framework across public clouds (Azure) and modern Infrastructure-as-Code (IaC) programmatic workflows (Pulumi).

---

## Deliverables

### Azure Bicep Provider Package
- **Package**: `@stacktest/provider-azure-bicep` under `packages/provider-azure-bicep`.
- **Resource Group Isolation Manager**: Generates a run-isolated resource group (e.g. `st-${runId}-${testName}`) inside Azure, ensuring concurrent test runs do not conflict.
- **Bicep Deployer**: Executes `az deployment group create` using Bicep templates and collects resource lifecycle events.
- **Resource Group Cleanup**: Deletes the run-isolated resource group, ensuring cascading garbage collection of all deployed resources.
- **Mock and Unit Tests**: Unit tests mocking `az` CLI executions, alongside opt-in integration tests deploying a simple Bicep resource, gated by `RUN_AZURE_INTEGRATION_TESTS === "true"`.

### Pulumi Provider Package
- **Package**: `@stacktest/provider-pulumi` under `packages/provider-pulumi`.
- **Local State Backend Configuration**: Automatically runs `pulumi login --local` to initialize a local, zero-dependency storage system.
- **Stack Isolation**: Creates a run-specific Pulumi stack (e.g., `st-${runId}-${testName}`) inside the template target directory.
- **Pulumi Deployer & Destroyer**: Wrapper executing `pulumi up --yes` and `pulumi destroy --yes` to manage resources.
- **Mock and Unit Tests**: Unit tests mocking `pulumi` CLI executions, alongside opt-in integration tests deploying a simple Pulumi project, gated by `RUN_PULUMI_INTEGRATION_TESTS === "true"`.

---

## GitHub Issues to Create

### Issue 10.1: Initialize Azure Bicep Package
- **Description**: Initialize the `@stacktest/provider-azure-bicep` package structure, `package.json`, TypeScript configuration, and `tsup` build configurations.
- **Target Commit**: `chore: initialize provider-azure-bicep package`
- **Recommended Agent Role**: Architect

### Issue 10.2: Implement Azure Bicep Deployer and Event Collector
- **Description**: Implement `deploy` conforming to `DeploymentProvider`. Checks `az` CLI availability, creates an isolated resource group, deploys the Bicep template, and parses deployment operations into `DeploymentEvent[]`.
- **Target Commit**: `feat(provider-azure-bicep): implement azure bicep deployer`
- **Recommended Agent Role**: Implementation

### Issue 10.3: Implement Azure Bicep Destroyer with Safety Guardrails
- **Description**: Implement `destroy` to delete the run-specific resource group. Validate name structure starts with `st-` to avoid deleting external production resources.
- **Target Commit**: `feat(provider-azure-bicep): implement azure bicep group destroyer`
- **Recommended Agent Role**: Safety

### Issue 10.4: Add Tests for Azure Bicep Provider
- **Description**: Add unit tests mocking AZ CLI commands, and opt-in integration tests deploying a basic Azure resource.
- **Target Commit**: `test(provider-azure-bicep): add azure bicep tests`
- **Recommended Agent Role**: Test

### Issue 10.5: Initialize Pulumi Package
- **Description**: Initialize the `@stacktest/provider-pulumi` package structure, config files, and build script.
- **Target Commit**: `chore: initialize provider-pulumi package`
- **Recommended Agent Role**: Architect

### Issue 10.6: Implement Pulumi Deployer and Destroyer
- **Description**: Implement `deploy` and `destroy` for the Pulumi provider. Initialize local state using `pulumi login --local` and run `pulumi up --yes` / `pulumi destroy --yes --stack <name>`.
- **Target Commit**: `feat(provider-pulumi): implement pulumi deployer and destroyer`
- **Recommended Agent Role**: Implementation

### Issue 10.7: Add Tests for Pulumi Provider
- **Description**: Add unit tests mocking Pulumi command execution, and opt-in integration tests deploying a local file resource.
- **Target Commit**: `test(provider-pulumi): add pulumi tests`
- **Recommended Agent Role**: Test

### Issue 10.8: Register Providers in CLI
- **Description**: Register `AzureBicepProvider` and `PulumiProvider` in the CLI registry.
- **Target Commit**: `feat(cli): register azure bicep and pulumi providers`
- **Recommended Agent Role**: Implementation

---

## Acceptance Criteria
- Both new packages compile, build, and register cleanly in the monorepo.
- `stacktest run --provider azure-bicep` and `stacktest run --provider pulumi` are fully supported.
- Stacks/resources deploy and destroy safely.
- Linter checks, formatter checks, and Vitest test suites pass successfully.
