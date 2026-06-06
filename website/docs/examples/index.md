# Examples

Here are some typical configurations:

## AWS CloudFormation Basic Example

See [Minimal AWS CFN Example](https://github.com/gattasrikanth/stacktest/tree/main/examples/aws-cloudformation-basic) for a simple SQS template config.

You can test this example locally by running the helper commands from the root of the repository:
```bash
# Build the project
pnpm install && pnpm build

# Lint the configuration
pnpm sandbox:lint

# View the execution plan
pnpm sandbox:plan

# Deploy and automatically clean up the stack
pnpm sandbox:run
```

## Multi-Provider Composition Example

Deploys a Terraform stage first and feeds outputs directly to CloudFormation.
