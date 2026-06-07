[**@stack-test/core**](../README.md)

***

[@stack-test/core](../README.md) / createRunEvent

# Function: createRunEvent()

> **createRunEvent**(`runId`, `eventId`, `type`, `timestamp`, `fields?`): [`DashboardRunEvent`](../interfaces/DashboardRunEvent.md)

## Parameters

### runId

`string`

### eventId

`string`

### type

`"run_started"` \| `"run_config_loaded"` \| `"deployment_started"` \| `"deployment_event"` \| `"assertion_started"` \| `"assertion_passed"` \| `"assertion_failed"` \| `"cleanup_started"` \| `"cleanup_event"` \| `"cleanup_completed"` \| `"run_failed"` \| `"run_completed"` \| `"warning"` \| `"log"`

### timestamp

`string`

### fields?

`Omit`\<`Partial`\<[`DashboardRunEvent`](../interfaces/DashboardRunEvent.md)\>, `"schemaVersion"` \| `"runId"` \| `"eventId"` \| `"type"` \| `"timestamp"`\> = `{}`

## Returns

[`DashboardRunEvent`](../interfaces/DashboardRunEvent.md)
