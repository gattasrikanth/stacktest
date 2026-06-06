[**@stack-test/core**](../README.md)

***

[@stack-test/core](../README.md) / FakeProvider

# Class: FakeProvider

## Implements

- [`DeploymentProvider`](../interfaces/DeploymentProvider.md)

## Constructors

### Constructor

> **new FakeProvider**(): `FakeProvider`

#### Returns

`FakeProvider`

## Properties

### name

> `readonly` **name**: `"fake"` = `"fake"`

#### Implementation of

[`DeploymentProvider`](../interfaces/DeploymentProvider.md).[`name`](../interfaces/DeploymentProvider.md#name)

## Methods

### deploy()

> **deploy**(`plan`): `Promise`\<[`DeploymentResult`](../interfaces/DeploymentResult.md)\>

#### Parameters

##### plan

[`DeploymentPlan`](../interfaces/DeploymentPlan.md)

#### Returns

`Promise`\<[`DeploymentResult`](../interfaces/DeploymentResult.md)\>

#### Implementation of

[`DeploymentProvider`](../interfaces/DeploymentProvider.md).[`deploy`](../interfaces/DeploymentProvider.md#deploy)

***

### destroy()

> **destroy**(`plan`): `Promise`\<[`DeploymentResult`](../interfaces/DeploymentResult.md)\>

#### Parameters

##### plan

[`DeploymentPlan`](../interfaces/DeploymentPlan.md)

#### Returns

`Promise`\<[`DeploymentResult`](../interfaces/DeploymentResult.md)\>

#### Implementation of

[`DeploymentProvider`](../interfaces/DeploymentProvider.md).[`destroy`](../interfaces/DeploymentProvider.md#destroy)

***

### getEvents()

> **getEvents**(`plan`): `Promise`\<[`DeploymentEvent`](../interfaces/DeploymentEvent.md)[]\>

#### Parameters

##### plan

[`DeploymentPlan`](../interfaces/DeploymentPlan.md)

#### Returns

`Promise`\<[`DeploymentEvent`](../interfaces/DeploymentEvent.md)[]\>

#### Implementation of

[`DeploymentProvider`](../interfaces/DeploymentProvider.md).[`getEvents`](../interfaces/DeploymentProvider.md#getevents)
