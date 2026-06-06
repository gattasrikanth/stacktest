# Provider Plugin Model

All providers implement the standard interface defined in `core`:

```typescript
export interface DeploymentProvider {
  readonly name: string;
  deploy(plan: DeploymentPlan): Promise<DeploymentResult>;
  destroy(plan: DeploymentPlan): Promise<DeploymentResult>;
  getEvents(plan: DeploymentPlan): Promise<DeploymentEvent[]>;
}
```
