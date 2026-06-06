# Provider Configuration

The `providers` block configures deployment backends and their properties (such as regions or credentials).

```yaml
providers:
  aws-cloudformation:
    regions:
      - us-east-1
      - us-west-2
    roleArn: arn:aws:iam::123456789012:role/StackTestExecutionRole
  terraform:
    regions:
      - local
```

- **`regions`**: A list of targets (regions or environments) for deployments.
- **`roleArn`**: (AWS specific) Optional IAM role to assume during execution.
