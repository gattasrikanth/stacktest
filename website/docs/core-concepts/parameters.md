# Parameters

**Parameters** represent settings injected into your templates at creation time.

```yaml
tests:
  basic:
    template: templates/sqs.yaml
    parameters:
      Environment: dev
      QueueName: $[stacktest_project_name]-$[stacktest_region]
```

Parameters support:
- Static values (strings, numbers, booleans)
- Project metadata references (via `$[stacktest_...]` interpolation)
- Dynamic utilities (such as random UUIDs or passwords)
- Downstream stage output routing
