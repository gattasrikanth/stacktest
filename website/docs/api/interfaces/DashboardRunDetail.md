[**@stack-test/core**](../README.md)

***

[@stack-test/core](../README.md) / DashboardRunDetail

# Interface: DashboardRunDetail

## Extends

- [`DashboardRunListItem`](DashboardRunListItem.md)

## Properties

### artifactFiles

> **artifactFiles**: [`ArtifactTreeNode`](ArtifactTreeNode.md)[]

***

### deployments

> **deployments**: [`DashboardDeploymentSummary`](DashboardDeploymentSummary.md)[]

***

### durationMs

> **durationMs**: `number`

#### Inherited from

[`DashboardRunListItem`](DashboardRunListItem.md).[`durationMs`](DashboardRunListItem.md#durationms)

***

### endedAt?

> `optional` **endedAt?**: `string`

#### Inherited from

[`DashboardRunListItem`](DashboardRunListItem.md).[`endedAt`](DashboardRunListItem.md#endedat)

***

### events

> **events**: [`DashboardRunEvent`](DashboardRunEvent.md)[]

***

### isPartial

> **isPartial**: `boolean`

#### Inherited from

[`DashboardRunListItem`](DashboardRunListItem.md).[`isPartial`](DashboardRunListItem.md#ispartial)

***

### manifest?

> `optional` **manifest?**: [`RunManifest`](RunManifest.md)

***

### provider

> **provider**: `string`

#### Inherited from

[`DashboardRunListItem`](DashboardRunListItem.md).[`provider`](DashboardRunListItem.md#provider)

***

### rawJson?

> `optional` **rawJson?**: `unknown`

***

### regions

> **regions**: `string`[]

#### Inherited from

[`DashboardRunListItem`](DashboardRunListItem.md).[`regions`](DashboardRunListItem.md#regions)

***

### runDir

> **runDir**: `string`

#### Inherited from

[`DashboardRunListItem`](DashboardRunListItem.md).[`runDir`](DashboardRunListItem.md#rundir)

***

### runId

> **runId**: `string`

#### Inherited from

[`DashboardRunListItem`](DashboardRunListItem.md).[`runId`](DashboardRunListItem.md#runid)

***

### scenarioName

> **scenarioName**: `string`

#### Inherited from

[`DashboardRunListItem`](DashboardRunListItem.md).[`scenarioName`](DashboardRunListItem.md#scenarioname)

***

### startedAt?

> `optional` **startedAt?**: `string`

#### Inherited from

[`DashboardRunListItem`](DashboardRunListItem.md).[`startedAt`](DashboardRunListItem.md#startedat)

***

### status

> **status**: [`DashboardRunStatus`](../type-aliases/DashboardRunStatus.md)

#### Inherited from

[`DashboardRunListItem`](DashboardRunListItem.md).[`status`](DashboardRunListItem.md#status)

***

### summary?

> `optional` **summary?**: [`RunSummary`](RunSummary.md)

***

### totals

> **totals**: `object`

#### failed

> **failed**: `number`

#### passed

> **passed**: `number`

#### skipped

> **skipped**: `number`

#### tests

> **tests**: `number`

#### Inherited from

[`DashboardRunListItem`](DashboardRunListItem.md).[`totals`](DashboardRunListItem.md#totals)
