[**@stack-test/core**](../README.md)

***

[@stack-test/core](../README.md) / ReportGenerator

# Class: ReportGenerator

## Constructors

### Constructor

> **new ReportGenerator**(): `ReportGenerator`

#### Returns

`ReportGenerator`

## Methods

### generateHtml()

> `static` **generateHtml**(`projectName`, `runId`, `plans`, `results`): `string`

#### Parameters

##### projectName

`string`

##### runId

`string`

##### plans

[`DeploymentPlan`](../interfaces/DeploymentPlan.md)[]

##### results

[`DeploymentResult`](../interfaces/DeploymentResult.md)[]

#### Returns

`string`

***

### generateJson()

> `static` **generateJson**(`projectName`, `runId`, `plans`, `results`): [`ReportJson`](../interfaces/ReportJson.md)

#### Parameters

##### projectName

`string`

##### runId

`string`

##### plans

[`DeploymentPlan`](../interfaces/DeploymentPlan.md)[]

##### results

[`DeploymentResult`](../interfaces/DeploymentResult.md)[]

#### Returns

[`ReportJson`](../interfaces/ReportJson.md)

***

### generateJunit()

> `static` **generateJunit**(`projectName`, `runId`, `plans`, `results`): `string`

#### Parameters

##### projectName

`string`

##### runId

`string`

##### plans

[`DeploymentPlan`](../interfaces/DeploymentPlan.md)[]

##### results

[`DeploymentResult`](../interfaces/DeploymentResult.md)[]

#### Returns

`string`

***

### writeReports()

> `static` **writeReports**(`projectName`, `runId`, `plans`, `results`): `Promise`\<\{ `htmlPath`: `string`; `jsonPath`: `string`; `junitPath`: `string`; \}\>

#### Parameters

##### projectName

`string`

##### runId

`string`

##### plans

[`DeploymentPlan`](../interfaces/DeploymentPlan.md)[]

##### results

[`DeploymentResult`](../interfaces/DeploymentResult.md)[]

#### Returns

`Promise`\<\{ `htmlPath`: `string`; `jsonPath`: `string`; `junitPath`: `string`; \}\>
