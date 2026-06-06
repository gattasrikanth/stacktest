# Providers

A **Provider** is a concrete deployment backend plugin. Providers implement the standard `DeploymentProvider` interface defined in `@stack-test/core`.

Built-in providers include:
- `aws-cloudformation`: Deploys CloudFormation templates using the AWS SDK.
- `terraform`: Manages workspaces and runs plan/apply/destroy operations.
- `aws-cdk`: Synthesizes and deploys CDK stacks.
- `kubernetes`: Deploys resource manifests into namespace-isolated environments.
- `azure-bicep`: Deploys Bicep files to resource groups.
- `pulumi`: Manages state and runs Pulumi updates.
- `fake`: A dry-run provider that mocks cloud deployments for testing configurations locally.
