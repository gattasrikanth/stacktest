# Dynamic Values

StackTest supports dynamic variables interpolated at runtime before template deployments.

## Supported Dynamic Variables

- **`$[stacktest_project_name]`**: Resolves to the project name.
- **`$[stacktest_test_name]`**: Resolves to the test target name.
- **`$[stacktest_region]`**: Resolves to the execution region.
- **`$[stacktest_run_id]`**: Resolves to the unique run ID.
- **`$[stacktest_genuuid]`**: Generates a random UUID.
- **`$[stacktest_genpass_16]`**: Generates a 16-character secure random password.
