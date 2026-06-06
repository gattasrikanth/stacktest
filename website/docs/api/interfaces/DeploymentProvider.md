[**@stack-test/core**](../README.md)

***

[@stack-test/core](../README.md) / DeploymentProvider

# Interface: DeploymentProvider

## Properties

### name

> **name**: `string`

## Methods

### deploy()

> **deploy**(`plan`): `Promise`\<[`DeploymentResult`](DeploymentResult.md)\>

#### Parameters

##### plan

[`DeploymentPlan`](DeploymentPlan.md)

#### Returns

`Promise`\<[`DeploymentResult`](DeploymentResult.md)\>

***

### destroy()

> **destroy**(`plan`): `Promise`\<[`DeploymentResult`](DeploymentResult.md)\>

#### Parameters

##### plan

[`DeploymentPlan`](DeploymentPlan.md)

#### Returns

`Promise`\<[`DeploymentResult`](DeploymentResult.md)\>

***

### getEvents()

> **getEvents**(`plan`): `Promise`\<[`DeploymentEvent`](DeploymentEvent.md)[]\>

#### Parameters

##### plan

[`DeploymentPlan`](DeploymentPlan.md)

#### Returns

`Promise`\<[`DeploymentEvent`](DeploymentEvent.md)[]\>
