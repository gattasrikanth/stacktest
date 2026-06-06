# Configuration Overview

StackTest is configured using a `stacktest.yaml` or `stacktest.yml` file placed at the root of your project.

Here is a full example showing the three main configuration blocks:

```yaml
project:
  name: billing-infrastructure

providers:
  aws-cloudformation:
    regions:
      - us-east-1
      - us-west-2
    roleArn: arn:aws:iam::123456789012:role/StackTestExecutionRole

tests:
  basic-queue:
    provider: aws-cloudformation
    template: templates/sqs.yaml
    parameters:
      QueueName: $[stacktest_project_name]-$[stacktest_region]-$[stacktest_run_id]
```

## Structure Sections

1. **`project`**: Metadata like name.
2. **`providers`**: Settings specific to infrastructure deployment plugins.
3. **`tests`**: Define your test target matrix, template location, and parameter bindings.
