# Provider Authoring Guide

This guide explains how to write and register a custom `DeploymentProvider` in StackTest. By writing a custom provider, you can extend StackTest to target any cloud platform, deployment engine, or localized mock infrastructure.

---

## 1. The Provider Contract

Every provider in StackTest must implement the `DeploymentProvider` interface defined in `@stacktest/core`:

```typescript
import { type DeploymentPlan, type DeploymentResult, type DeploymentEvent } from "@stacktest/core";

export interface DeploymentProvider {
  /**
   * Unique identifier name for the provider (e.g. 'aws-cloudformation', 'google-cloud-run').
   * This matches the provider name used in stacktest.yaml configurations.
   */
  readonly name: string;

  /**
   * Deploys the infrastructure planned in the DeploymentPlan.
   * Returns a result representing success, final status, or failure diagnostic.
   */
  deploy(plan: DeploymentPlan): Promise<DeploymentResult>;

  /**
   * Terminates the infrastructure deployment and frees all allocated staging objects/resources.
   * Security warning: Must verify ownership tags before performing destructive tasks.
   */
  destroy(plan: DeploymentPlan): Promise<DeploymentResult>;

  /**
   * Queries and returns the chronological execution event log.
   * Useful for debugging failures.
   */
  getEvents(plan: DeploymentPlan): Promise<DeploymentEvent[]>;
}
```

---

## 2. Anatomy of a Custom Provider

Here is a template structure for a custom provider:

```typescript
import {
  type DeploymentProvider,
  type DeploymentPlan,
  type DeploymentResult,
  type DeploymentEvent,
} from "@stacktest/core";

export class MyCustomProvider implements DeploymentProvider {
  readonly name = "my-custom-provider";

  async deploy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    try {
      // 1. Resolve parameters from plan.parameters
      const connectionUrl = plan.parameters.ConnectionUrl || "default";

      // 2. Perform deployment (e.g., calling REST APIs or using an SDK client)
      // await client.deploy(plan.deploymentName, plan.template, connectionUrl);

      // 3. Poll status until complete
      // const status = await this.pollStatus(plan.deploymentName);

      return {
        success: true,
        status: "DEPLOYMENT_COMPLETE",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return {
        success: false,
        status: "DEPLOYMENT_FAILED",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        error,
      };
    }
  }

  async destroy(plan: DeploymentPlan): Promise<DeploymentResult> {
    const start = Date.now();
    try {
      // CRITICAL: Describe resources and verify ownership tags before deletion
      // const resourceTags = await client.getTags(plan.deploymentName);
      // if (resourceTags['stacktest-run-id'] !== plan.runId) {
      //   throw new Error("Aborting destroy: Resource was not created by this run.");
      // }

      // Perform deletion
      // await client.delete(plan.deploymentName);

      return {
        success: true,
        status: "DESTROY_COMPLETE",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      return {
        success: false,
        status: "DESTROY_FAILED",
        runId: plan.runId,
        deploymentName: plan.deploymentName,
        durationMs: Date.now() - start,
        error,
      };
    }
  }

  async getEvents(plan: DeploymentPlan): Promise<DeploymentEvent[]> {
    try {
      // Fetch execution events/history
      // const events = await client.listEvents(plan.deploymentName);
      return [];
    } catch {
      return [];
    }
  }
}
```

---

## 3. Dynamic Values and Parameters

Before your provider's `deploy` method is called, the StackTest orchestrator automatically parses and resolves dynamic values in variables.
If the configuration contains:

```yaml
parameters:
  MyRegion: "$[stacktest_region]"
  MyPassword: "$[random_password(16)]"
```

The `plan.parameters` received by your provider will already contain the resolved values (e.g. `MyRegion: "us-east-1"`, `MyPassword: "aBcD1234eFgH5678"`). Do not rewrite parameter substitution logic within your provider.

---

## 4. Safety Guardrails

Destructive cleanup methods (`destroy`) must enforce the following safety rules:

1. **Metadata Verification**: Query the target stack/infrastructure metadata before executing delete operations.
2. **Tag Matching**: Ensure the target resource contains all StackTest metadata tags:
   - `stacktest-project`
   - `stacktest-run-id`
   - `stacktest-test-name`
3. **Abortion**: Throw an error and abort deletion immediately if tags are missing or contain mismatched project/run metadata. This prevents accidental deletion of production or external staging configurations.

---

## 5. Registering the Provider

To activate your provider for run execution pipelines, register it with the `ProviderRegistry` class:

```typescript
import { ProviderRegistry } from "@stacktest/core";
import { MyCustomProvider } from "./my-provider.js";

// Register custom provider instance
ProviderRegistry.register(new MyCustomProvider());
```

Once registered, any test suite config with `provider: my-custom-provider` will route deployments to your class.
