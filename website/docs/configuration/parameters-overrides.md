# Parameter Overrides

Parameters can be overridden on a per-region or per-stage basis.

```yaml
tests:
  basic:
    provider: aws-cloudformation
    template: templates/sqs.yaml
    parameters:
      Environment: dev
    overrides:
      regions:
        us-west-2:
          Environment: production
```

This ensures that the test planning engine injects the correct custom configurations depending on the environment.
