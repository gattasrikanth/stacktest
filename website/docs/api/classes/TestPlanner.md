[**@stack-test/core**](../README.md)

***

[@stack-test/core](../README.md) / TestPlanner

# Class: TestPlanner

## Constructors

### Constructor

> **new TestPlanner**(`config`): `TestPlanner`

#### Parameters

##### config

###### project

\{ `name`: `string`; \} = `ProjectConfigSchema`

###### project.name

`string` = `...`

###### providers

`Record`\<`string`, `object` & `Record`\<`string`, `any`\>\> = `ProviderConfigSchema`

###### tests

`Record`\<`string`, \{ `parameters?`: `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\>; `provider?`: `string`; `regions?`: (`string` \| \{ `parameters?`: `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\>; `region`: `string`; \})[]; `stages?`: `object`[]; `template?`: `string`; \}\> = `...`

#### Returns

`TestPlanner`

## Methods

### generatePlan()

> **generatePlan**(`runId?`): [`DeploymentPlan`](../interfaces/DeploymentPlan.md)[]

#### Parameters

##### runId?

`string` = `...`

#### Returns

[`DeploymentPlan`](../interfaces/DeploymentPlan.md)[]
