[**@stack-test/core**](../README.md)

***

[@stack-test/core](../README.md) / ConfigLoaderResult

# Interface: ConfigLoaderResult

## Properties

### config

> **config**: `object`

#### project

> **project**: `object` = `ProjectConfigSchema`

##### project.name

> **name**: `string`

#### providers

> **providers**: `Record`\<`string`, `object` & `Record`\<`string`, `any`\>\> = `ProviderConfigSchema`

#### tests

> **tests**: `Record`\<`string`, \{ `parameters?`: `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\>; `provider?`: `string`; `regions?`: (`string` \| \{ `parameters?`: `Record`\<`string`, `string` \| `number` \| `boolean` \| `null`\>; `region`: `string`; \})[]; `stages?`: `object`[]; `template?`: `string`; \}\>

***

### configDir

> **configDir**: `string`

***

### configPath

> **configPath**: `string`
