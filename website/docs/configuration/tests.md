# Test Configuration

The `tests` block defines the list of test targets to execute.

```yaml
tests:
  basic:
    provider: aws-cloudformation
    template: templates/sqs.yaml
    stages:
      - name: deploy-queue
        provider: aws-cloudformation
        template: templates/sqs.yaml
        parameters:
          QueueName: $[stacktest_project_name]
```

- **`provider`**: The default provider for all stages in this test.
- **`template`**: The default template path for the test.
- **`parameters`**: Default key-value parameters passed to the template.
- **`stages`**: Optional list of stages to support multi-provider composition tests sequentially.
