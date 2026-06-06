# Project Layout

A typical StackTest project structure includes your infrastructure templates, a `stacktest.yaml` configuration file, and the automatically generated run cache folder.

```text
my-project/
  ├── templates/
  │   ├── sqs.yaml
  │   └── main-stack.yaml
  ├── stacktest.yaml
  └── .stacktest/
      └── runs/
          └── <run-id>/
              ├── report.json
              ├── junit.xml
              └── report.html
```

---

## Folder Breakdown

- **`templates/`**: Directory containing your declarative IaC resource configurations (e.g. CloudFormation templates, Terraform configurations, Kubernetes YAML definitions).
- **`stacktest.yaml`**: The primary configuration file mapping providers, regions, parameters, and test execution behaviors.
- **`.stacktest/`**: Created automatically. Contains execution metadata, generated logs, and JUnit, JSON, and HTML reports indexed by run ID. Do not commit this directory to source control.
