# Configuration Schema Reference

StackTest configurations are defined in `stacktest.yaml`. The file uses a structured layout validated by Zod models in the core engine.

---

## 1. Project Configuration (`project`)
Defines the namespace for the test execution.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | Unique project name. Must be lowercase, alphanumeric with hyphens, and start with a letter. Maximum 30 characters. |

---

## 2. Providers Configuration (`providers`)
A dictionary mapping provider identifiers (like `aws-cloudformation`) to settings.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `regions` | `string[]` | No | List of deployment target environments (e.g. AWS regions). |

---

## 3. Tests Configuration (`tests`)
A dictionary mapping suite names to configurations.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `provider` | `string` | No | Default provider name if not using sequential stages. |
| `template` | `string` | No | Default path to the IaC template file. |
| `parameters`| `Record<string, any>` | No | Default parameter values passed during creation. |
| `stages` | `TestStageConfig[]` | No | Array of sequential multi-provider stages. |
| `regions` | `string[] / RegionConfig[]` | No | Custom list of target regions to override default providers. |
