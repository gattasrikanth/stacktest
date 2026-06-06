# Dynamic Parameter Overrides

Ensure regional dependencies map properly using overrides:

```yaml
tests:
  app:
    template: templates/app.yaml
    overrides:
      regions:
        us-east-1:
          VpcId: vpc-123456
        us-west-2:
          VpcId: vpc-789012
```
