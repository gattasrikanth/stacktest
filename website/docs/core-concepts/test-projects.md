# Test Projects

In StackTest, a **Project** represents a logical testing namespace. It is defined in the `project` section of your configuration.

```yaml
project:
  name: billing-pipeline
```

The project name is used for:
- Resource naming prefixes (e.g. `billing-pipeline-stage1-us-east-1-st-run123`)
- Tagging keys for tracking ownership of infrastructure
- Staging buckets used for template uploads
