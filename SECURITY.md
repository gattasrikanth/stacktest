# Security Policy

## Vulnerability Reporting

If you find a security issue or vulnerability in StackTest, please do not open a public issue. Instead, report it directly to the project maintainers. We will investigate the issue and coordinate a resolution.

## Guidelines for Safe Deployment Testing

StackTest creates, manages, and deletes real-world cloud resources. To maintain a secure environment, please follow these guidelines:

1. **Never Commit Secrets**: Do not check in private keys, AWS access keys, session tokens, or other credentials to git. Use environmental loading or local AWS configuration files.
2. **Access Control**: Always run test suites under accounts or IAM roles configured with the minimum required privileges necessary to build the targeted test template resources.
3. **Public Staging Isolation**: Keep deployment targets separated from production systems. Always use dedicated sandbox or testing AWS accounts.
