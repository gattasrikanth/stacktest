[**@stack-test/core**](../README.md)

***

[@stack-test/core](../README.md) / DashboardRunEvent

# Interface: DashboardRunEvent

## Properties

### deploymentId?

> `optional` **deploymentId?**: `string`

***

### durationSincePriorMs?

> `optional` **durationSincePriorMs?**: `number`

***

### eventId

> **eventId**: `string`

***

### message?

> `optional` **message?**: `string`

***

### resourceLogicalId?

> `optional` **resourceLogicalId?**: `string`

***

### resourceType?

> `optional` **resourceType?**: `string`

***

### runId

> **runId**: `string`

***

### schemaVersion

> **schemaVersion**: `"1.0"`

***

### status?

> `optional` **status?**: `string`

***

### statusReason?

> `optional` **statusReason?**: `string`

***

### timestamp

> **timestamp**: `string`

***

### type

> **type**: `"run_started"` \| `"run_config_loaded"` \| `"deployment_started"` \| `"deployment_event"` \| `"assertion_started"` \| `"assertion_passed"` \| `"assertion_failed"` \| `"cleanup_started"` \| `"cleanup_event"` \| `"cleanup_completed"` \| `"run_failed"` \| `"run_completed"` \| `"warning"` \| `"log"`
