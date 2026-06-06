# Cleanup and Destroy

Safety is a core tenet of StackTest. Destructive cleanups are protected by several safety gates:

- **Ownership Tagging**: All resources created by StackTest are labeled with project, run-id, and test name tags.
- **Pre-Deletion Checks**: Before deleting a stack or state, StackTest queries the resource and verifies these exact ownership tags exist and match. If the tags are missing or incorrect, execution immediately aborts with a safety validation failure.
- **Reverse-Order Teardown**: In composite multi-stage test executions, resources are torn down in the exact reverse order of their deployment to satisfy dependency constraints.
