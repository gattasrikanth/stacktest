# Core Concepts

StackTest operates on a set of provider-neutral core concepts that separate the test orchestration engine from cloud-specific logic.

Before deploying templates, it helps to understand these primary abstractions:

1. **Test Projects**: Defined by the `project` node in configuration. Collects multiple suites under a single namespace.
2. **Test Runs**: An execution of the planned deployment matrix, marked by a unique runtime ID.
3. **Providers**: Concrete deployment plugins (e.g. AWS CloudFormation, Terraform, Pulumi) that manage resources.
4. **Regions**: The targeting environments or cloud locations where resources are deployed.
5. **Parameters**: Key-value settings injected into templates during creation, including dynamic values.
6. **Artifacts**: Staging buckets and files created temporarily for templates.
7. **Reports**: Outputs (JSON, HTML, XML) documenting the run execution.
8. **Cleanup & Destroy**: The teardown flow that executes safely using tag-scoped gates.
