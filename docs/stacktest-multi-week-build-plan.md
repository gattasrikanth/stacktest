# StackTest — Multi-Week Build Plan

> Repository: `gattasrikanth/stacktest`  
> Project type: public open-source infrastructure testing framework  
> Primary language: TypeScript  
> First provider target: AWS CloudFormation  
> Long-term direction: provider-agnostic testing for infrastructure stacks across clouds and IaC frameworks

---

## 1. Project Vision

StackTest is a provider-agnostic infrastructure testing framework.

The initial goal is to build a TypeScript-native tool inspired by the core idea of taskcat: deploy infrastructure templates across one or more environments, validate whether they succeed, capture useful failure details, clean up safely, and produce reports.

The long-term goal is broader than AWS CloudFormation.

StackTest should eventually support multiple infrastructure providers and frameworks, such as:

- AWS CloudFormation
- AWS CDK synthesized templates
- Terraform
- Pulumi
- Azure Bicep / ARM
- Google Cloud deployment workflows
- Kubernetes manifests / Helm charts

The first implementation will focus on AWS CloudFormation because it gives the project a concrete, useful starting point.

---

## 2. Guiding Principles

### 2.1 Provider-Agnostic Core

The core engine must not be tightly coupled to AWS, CloudFormation, S3, or any single cloud.

Core concepts should use neutral names:

- `Provider`
- `Deployment`
- `Environment`
- `TestRun`
- `Artifact`
- `Reporter`
- `Planner`
- `Result`

Avoid AWS-specific names in the core package.

Good:

```ts
DeploymentProvider
ArtifactProvider
TestPlanner
RunOrchestrator
```

Avoid in core:

```ts
CloudFormationRunner
S3ArtifactManager
AwsStackPlanner
```

AWS-specific logic belongs in a provider package.

---

### 2.2 AWS CloudFormation Is the First Provider

The first useful provider should be:

```text
provider-aws-cloudformation
```

This package can own AWS-specific concerns:

- AWS SDK v3 clients
- CloudFormation stack create/delete/status/events
- S3 artifact upload
- regional artifact buckets
- AWS credential resolution
- AWS region handling
- CloudFormation capabilities
- stack event failure extraction
- safe cleanup tags

---

### 2.3 Safety Before Power

This tool creates and deletes real infrastructure.

Every destructive operation must be guarded.

Rules:

- Do not delete resources unless StackTest created them.
- Every deployment must include StackTest-managed tags where the provider supports tags.
- Cleanup should be scoped by run ID, project name, and provider metadata.
- Real cloud integration tests must be opt-in.
- Default tests should use fake providers and mocks.
- No AWS credentials, account IDs, profile names, or secrets should be committed.

---

### 2.4 Agentic Development Must Be Controlled

AI agents should not work on large vague goals.

Every agent task should be:

- small
- scoped
- testable
- committed independently
- reviewable by a human
- safe to run locally

A good agent task is one GitHub issue.

A bad agent task is: “Build StackTest.”

---

## 3. Recommended Initial Repository Structure

```text
stacktest/
  packages/
    cli/
      src/
        index.ts
        commands/
    core/
      src/
        config/
        planner/
        providers/
        orchestration/
        reporting/
        results/
        errors/
    provider-aws-cloudformation/
      src/
        cloudformation/
        artifacts/
        credentials/
        regions/
        cleanup/
    reporter-json/
      src/
    reporter-html/
      src/
    test-fixtures/
      configs/
      templates/
  docs/
    architecture/
    decisions/
    phases/
  examples/
    aws-cloudformation-basic/
  .github/
    workflows/
      ci.yml
    ISSUE_TEMPLATE/
  AGENTS.md
  ARCHITECTURE.md
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
  LICENSE
  README.md
  ROADMAP.md
  SECURITY.md
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
```

---

## 4. Core Packages

### 4.1 `packages/core`

Purpose:

The provider-neutral engine.

Responsibilities:

- config model
- config validation
- test planning
- provider registry
- run orchestration
- result model
- shared errors
- reporter interfaces
- fake provider test harness

Must not directly import AWS SDKs.

---

### 4.2 `packages/cli`

Purpose:

User-facing command-line interface.

Initial commands:

```bash
stacktest --version
stacktest init
stacktest lint
stacktest plan
stacktest run
stacktest clean
stacktest report
```

The CLI should be thin. Most logic should live in `core` or provider packages.

---

### 4.3 `packages/provider-aws-cloudformation`

Purpose:

First real deployment provider.

Responsibilities:

- validate CloudFormation templates
- deploy stacks
- wait for stack completion
- collect stack events
- detect failure reasons
- destroy stacks safely
- manage S3 artifacts
- handle region-specific deployment behavior

---

### 4.4 `packages/reporter-json`

Purpose:

Machine-readable report output.

---

### 4.5 `packages/reporter-html`

Purpose:

Human-readable local HTML report.

This can be added after JSON reporting is stable.

---

## 5. Agent Roles

This project should use AI agents as specialized contributors.

### 5.1 Human Maintainer

Owner: Srikanth

Responsibilities:

- final architecture decisions
- reviewing PRs / commits
- approving destructive cloud workflows
- deciding public API shape
- cutting releases
- validating security posture
- ensuring the project does not drift into unsafe behavior

The human maintainer should approve every phase transition.

---

### 5.2 Architect Agent

Purpose:

Create and refine design documents.

Good tasks:

- create architecture diagrams in markdown / Mermaid
- propose package boundaries
- write ADRs
- refine provider interface contracts
- identify edge cases before implementation

Should not:

- implement large features directly
- add cloud credentials
- run cloud deployments

Example prompt:

```text
You are the Architect Agent for StackTest. Review the current architecture and propose an ADR for the provider interface. Keep the core provider-agnostic. Do not write implementation code unless explicitly asked.
```

---

### 5.3 Implementation Agent

Purpose:

Implement small scoped features.

Good tasks:

- add config parser
- add planner unit tests
- add CLI command
- add fake provider
- add JSON reporter

Rules:

- one issue at a time
- tests required
- no real cloud calls unless explicitly allowed
- commit after each completed issue

Example prompt:

```text
You are the Implementation Agent for StackTest. Implement GitHub issue #X only. Add tests. Do not modify unrelated files. Do not add AWS SDK code unless the issue explicitly requires it. Commit changes when tests pass.
```

---

### 5.4 Test Agent

Purpose:

Strengthen test coverage.

Good tasks:

- add edge case tests
- add fixture-based tests
- add mock-provider tests
- test failure modes
- test cleanup guardrails
- test schema validation

Should not:

- rewrite implementation unnecessarily
- make broad refactors without approval

Example prompt:

```text
You are the Test Agent for StackTest. Add missing tests for the config parser and planner. Focus on edge cases and failure cases. Avoid changing production code unless necessary.
```

---

### 5.5 Safety Agent

Purpose:

Review infrastructure safety.

Good tasks:

- inspect cleanup logic
- ensure destructive actions are tagged and scoped
- verify integration tests are opt-in
- check that secrets are not logged
- check that AWS account IDs are not hardcoded
- review IAM assumptions

Example prompt:

```text
You are the Safety Agent for StackTest. Review the current AWS provider cleanup design. Identify unsafe behavior, missing guardrails, and tests required before real AWS usage.
```

---

### 5.6 Documentation Agent

Purpose:

Keep public docs useful.

Good tasks:

- README updates
- examples
- contributor docs
- command reference
- provider authoring guide
- troubleshooting guide

Example prompt:

```text
You are the Documentation Agent for StackTest. Update the README and docs for the newly implemented `stacktest plan` command. Include examples and expected output.
```

---

### 5.7 Release Agent

Purpose:

Prepare releases.

Good tasks:

- changelog updates
- version bump PRs
- npm package checklist
- GitHub release notes
- verify CI
- verify package contents

Should not release without human approval.

---

## 6. Multi-Week Phase Plan

## Phase 0 — Public Repo Foundation

Estimated duration: 2–4 days

Goal:

Create a clean public open-source TypeScript monorepo.

Deliverables:

- README
- LICENSE
- CODE_OF_CONDUCT
- CONTRIBUTING
- SECURITY
- AGENTS
- ROADMAP
- ARCHITECTURE
- pnpm workspace
- TypeScript config
- Vitest
- ESLint
- Prettier
- GitHub Actions CI
- basic CLI version command

Definition of done:

```bash
pnpm install
pnpm build
pnpm test
```

All pass locally and in GitHub Actions.

Suggested first commit:

```text
chore: initialize stacktest monorepo
```

---

## Phase 1 — Core Config Model

Estimated duration: 1 week

Goal:

Define the first StackTest config format and validate it.

Initial config example:

```yaml
project:
  name: demo

providers:
  aws-cloudformation:
    regions:
      - us-east-1
      - us-west-2

tests:
  basic:
    provider: aws-cloudformation
    template: templates/main.yaml
    parameters:
      Environment: test
```

Deliverables:

- config schema
- config loader
- validation errors
- fixture-based tests
- CLI command: `stacktest lint`

Definition of done:

- valid config passes
- invalid config shows useful error messages
- config parser has unit tests
- CLI exits non-zero on invalid config

---

## Phase 2 — Planning Engine

Estimated duration: 1 week

Goal:

Turn config into deployment plans without making cloud calls.

Example:

```text
1 test × 2 regions = 2 planned deployments
```

Deliverables:

- `TestPlanner`
- `DeploymentPlan`
- `RunIdGenerator`
- stable stack/deployment naming strategy
- CLI command: `stacktest plan`
- JSON output option

Definition of done:

- planner is deterministic where needed
- run IDs are unique
- names are safe for provider usage
- tests cover region expansion and test expansion

---

## Phase 3 — Provider Interface and Fake Provider

Estimated duration: 1 week

Goal:

Create the provider abstraction and a fake provider for safe local orchestration.

Deliverables:

- `DeploymentProvider` interface
- `ProviderRegistry`
- `FakeProvider`
- `RunOrchestrator`
- result model
- failure model
- basic console reporting

Definition of done:

- `stacktest run --provider fake` works locally
- fake success/failure cases are testable
- no cloud calls are made
- orchestration can run multiple planned deployments

---

## Phase 4 — Dynamic Values MVP

Estimated duration: 1 week

Goal:

Resolve generated values before deployment.

Initial dynamic values:

```text
$[stacktest_project_name]
$[stacktest_test_name]
$[stacktest_provider]
$[stacktest_region]
$[stacktest_run_id]
$[stacktest_genuuid]
$[stacktest_genpass_16]
```

Deliverables:

- dynamic value parser
- resolver interface
- built-in resolver
- tests for deterministic and non-deterministic values
- validation for unknown dynamic values

Definition of done:

- dynamic values resolve correctly in parameters
- unknown dynamic values fail clearly
- no secrets are logged

---

## Phase 5 — AWS CloudFormation Provider MVP

Estimated duration: 2–3 weeks

Goal:

Deploy and clean up a tiny CloudFormation template in one or more AWS regions.

Deliverables:

- AWS SDK v3 CloudFormation client integration
- stack create
- stack status polling
- stack event collection
- failure reason extraction
- safe stack deletion
- opt-in integration tests

Safety requirements:

- only manage stacks with StackTest tags
- only delete stacks created by StackTest
- integration tests require:

```bash
RUN_AWS_INTEGRATION_TESTS=true
```

Definition of done:

- deploys a tiny SQS or SNS template
- reports success/failure
- cleans up safely
- integration tests are disabled by default
- unit tests use mocks only

---

## Phase 6 — AWS Artifact Management

Estimated duration: 2 weeks

Goal:

Support real CloudFormation templates that require uploaded artifacts.

Deliverables:

- regional S3 artifact bucket strategy
- template upload
- nested template handling
- artifact key naming
- artifact cleanup guardrails
- tests using mocks

Definition of done:

- template artifacts upload before deployment
- generated TemplateURL values are correct
- cleanup does not delete unrelated buckets or objects

---

## Phase 7 — Reporting

Estimated duration: 1–2 weeks

Goal:

Generate useful reports for local users and CI systems.

Deliverables:

- JSON report
- JUnit report
- console summary
- HTML report

Suggested output:

```text
.stacktest/
  runs/
    <run-id>/
      report.json
      junit.xml
      report.html
      events/
```

Definition of done:

- failed resources are easy to identify
- report includes provider, region, test name, duration, status, and failure reason
- JUnit report can be consumed by CI

---

## Phase 8 — Public Contributor Experience

Estimated duration: 1 week

Goal:

Make the project easy for contributors.

Deliverables:

- provider authoring guide
- issue templates
- pull request template
- good first issues
- architecture decision records
- local development guide
- examples

Definition of done:

- a new contributor can run tests locally
- a contributor can understand how to add a provider
- docs explain safe development workflow

---

## Phase 9 — Advanced AWS Compatibility

Estimated duration: 3–6 weeks

Goal:

Expand AWS CloudFormation support.

Possible features:

- IAM capabilities
- parameter overrides
- region-specific overrides
- account-specific overrides
- role assumption
- SSM dynamic values
- Secrets Manager dynamic values
- AZ generation
- Lambda packaging
- nested stacks
- stack update mode
- retain-on-failure option
- richer cleanup commands

Definition of done:

- features are added incrementally
- all destructive paths have tests
- docs include examples

---

## Phase 10 — Future Providers

Estimated duration: future contributor-driven work

Possible provider packages:

```text
provider-terraform
provider-aws-cdk
provider-azure-bicep
provider-pulumi
provider-kubernetes
```

Before adding a second provider, the provider interface should be reviewed carefully.

The second provider will reveal whether the core abstraction is truly provider-agnostic.

---

## 7. First GitHub Issues

Create these issues first.

### Issue 1 — Initialize TypeScript monorepo

Scope:

- pnpm workspace
- packages/cli
- packages/core
- TypeScript
- Vitest
- tsup
- ESLint
- Prettier
- basic version command
- CI workflow

---

### Issue 2 — Add public repo governance docs

Scope:

- LICENSE
- CODE_OF_CONDUCT
- CONTRIBUTING
- SECURITY
- ROADMAP
- AGENTS
- ARCHITECTURE

---

### Issue 3 — Implement config schema

Scope:

- YAML config parser
- schema validation
- fixtures
- useful validation errors

---

### Issue 4 — Add `stacktest lint`

Scope:

- CLI command
- reads config
- validates config
- prints errors
- exits with proper code

---

### Issue 5 — Implement planning engine

Scope:

- expand tests by provider and region
- create deployment plan
- generate run ID
- generate safe deployment names

---

### Issue 6 — Add `stacktest plan`

Scope:

- prints deployment plan
- supports JSON output
- no cloud calls

---

### Issue 7 — Add provider interface

Scope:

- provider contract
- provider registry
- provider result types

---

### Issue 8 — Add fake provider

Scope:

- fake success mode
- fake failure mode
- fake delay mode
- orchestration tests

---

### Issue 9 — Add dynamic value resolver MVP

Scope:

- parse `$[...]`
- resolve built-in values
- fail on unknown values
- tests

---

### Issue 10 — Add AWS CloudFormation provider skeleton

Scope:

- package setup
- AWS SDK v3 dependencies
- no real deployment yet
- mocked tests only

---

### Issue 11 — Implement CloudFormation deploy MVP

Scope:

- create stack
- poll stack
- collect events
- report result
- integration test opt-in only

---

### Issue 12 — Implement safe cleanup

Scope:

- delete only tagged StackTest stacks
- test safety guardrails
- integration test opt-in only

---

## 8. Development Workflow

Recommended branch flow:

```text
main
  └── issue/<number>-short-description
```

Recommended commit style:

```text
chore: initialize monorepo
feat(core): add config schema
feat(cli): add lint command
test(core): add planner edge cases
docs: add provider authoring guide
fix(provider-aws-cloudformation): handle rollback complete
```

Recommended local commands:

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

Real cloud tests should require explicit flags.

Example:

```bash
RUN_AWS_INTEGRATION_TESTS=true pnpm test:integration
```

---

## 9. Definition of Done for Any Agent Task

Every completed task must include:

- implementation
- tests
- passing local command output
- no unrelated changes
- no secrets
- no generated junk files
- updated docs if behavior changed
- commit with clear message

Agent should report:

```text
Files changed:
Commands run:
Tests added:
Known limitations:
Next recommended task:
```

---

## 10. First Agent Prompt

Use this prompt for the first implementation session.

```text
We are starting a new public open-source TypeScript project named StackTest.

Repository:
https://github.com/gattasrikanth/stacktest

Vision:
StackTest is a provider-agnostic infrastructure testing framework. The first provider will be AWS CloudFormation, but the core architecture must support future providers such as Terraform, Pulumi, Azure Bicep, and Kubernetes.

Your task:
Initialize the repository foundation only.

Requirements:
1. Use pnpm workspaces.
2. Create packages/cli and packages/core.
3. Use TypeScript.
4. Use Vitest for tests.
5. Use tsup for package builds.
6. Add ESLint and Prettier.
7. Add a basic CLI command that prints the package version.
8. Add one unit test.
9. Add GitHub Actions workflow that runs install, build, lint, and test.
10. Add README.md, LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md, SECURITY.md, ROADMAP.md, ARCHITECTURE.md, and AGENTS.md.
11. Keep the core provider-agnostic.
12. Do not add AWS SDK code yet.
13. Do not add real cloud integration logic yet.
14. Do not copy code from aws-ia/taskcat.
15. Commit all changes with message: chore: initialize stacktest monorepo.

After completion, report:
- files changed
- commands run
- test results
- next recommended issue
```

---

## 11. Early Architecture Decision Records

Create these ADRs during the first few phases.

```text
docs/decisions/0001-use-typescript.md
docs/decisions/0002-use-provider-agnostic-core.md
docs/decisions/0003-aws-cloudformation-first-provider.md
docs/decisions/0004-use-pnpm-workspaces.md
docs/decisions/0005-integration-tests-are-opt-in.md
docs/decisions/0006-cleanup-requires-managed-tags.md
```

---

## 12. Near-Term Milestones

### Milestone A — Local-only engine

Target:

```text
stacktest lint
stacktest plan
stacktest run --provider fake
```

No cloud calls.

This milestone proves the core architecture.

---

### Milestone B — AWS CloudFormation basic deploy

Target:

```text
stacktest run
stacktest clean
```

Using a tiny AWS template.

This milestone proves real-world usefulness.

---

### Milestone C — Reports and CI

Target:

```text
.stacktest/runs/<run-id>/report.json
.stacktest/runs/<run-id>/junit.xml
.stacktest/runs/<run-id>/report.html
```

This milestone makes the tool useful in pipelines.

---

### Milestone D — Contributor-ready provider API

Target:

A contributor can understand how to add a new provider.

This milestone makes StackTest a real open-source framework, not just an AWS-only utility.

---

## 13. What Not To Build Early

Avoid these until the basics are stable:

- full taskcat compatibility
- multi-account support
- Lambda packaging
- Terraform provider
- Pulumi provider
- web UI
- database storage
- complex plugin loading
- advanced report dashboards
- automatic cleanup across accounts
- destructive bulk commands

These are valuable later, but they will slow down the first working version.

---

## 14. Recommended First 4 Weeks

### Week 1

- repo foundation
- public docs
- monorepo
- CLI skeleton
- CI
- config schema

### Week 2

- planner
- provider interface
- fake provider
- local run orchestration

### Week 3

- dynamic values MVP
- JSON reporting
- AWS CloudFormation provider skeleton
- mocked AWS tests

### Week 4

- first real AWS deploy
- stack status polling
- stack event collection
- safe cleanup
- opt-in integration test

At the end of Week 4, StackTest should be able to deploy a tiny CloudFormation template into one or two AWS regions, report results, and clean up safely.

---

## 15. Success Criteria for MVP

MVP is complete when this works:

```bash
stacktest lint
stacktest plan
stacktest run
stacktest clean
```

Against this kind of config:

```yaml
project:
  name: demo

providers:
  aws-cloudformation:
    regions:
      - us-east-1
      - us-west-2

tests:
  basic:
    provider: aws-cloudformation
    template: templates/sqs.yaml
    parameters:
      QueueName: $[stacktest_project_name]-$[stacktest_region]-$[stacktest_run_id]
```

And produces:

```text
PASS aws-cloudformation us-east-1 basic
PASS aws-cloudformation us-west-2 basic
```

With a report:

```text
.stacktest/runs/<run-id>/report.json
```

---

## 16. Final Recommendation

Build StackTest as a cloud-neutral framework from day one, but keep the first working path narrow:

```text
Provider-agnostic core
+
AWS CloudFormation first provider
+
safe local-first development
+
small AI-agent tasks
```

Do not chase multi-cloud implementation early.

Design for multi-cloud now.

Implement AWS first.

Expand later when the architecture has proven itself.
