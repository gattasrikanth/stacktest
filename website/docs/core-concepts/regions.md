# Regions / Locations

**Regions** represent the target environment locations configured for test executions.

```yaml
providers:
  aws-cloudformation:
    regions:
      - us-east-1
      - us-west-2
```

The planner takes each test target and multiplies it by the list of configured regions. For instance, testing a single template in 3 regions produces 3 distinct deployment plans executed concurrently or sequentially based on options.
