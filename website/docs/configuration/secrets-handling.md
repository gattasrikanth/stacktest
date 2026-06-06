# Secrets Handling

StackTest redacts sensitive parameters (such as passwords generated via `$[stacktest_genpass_16]`) from standard outputs, plans, and console logs.

Additionally, AWS secrets can be retrieved dynamically:

```text
$[aws_secret:my-secret-id:password]
```

This extracts the `password` property of a JSON-formatted AWS Secrets Manager secret.
