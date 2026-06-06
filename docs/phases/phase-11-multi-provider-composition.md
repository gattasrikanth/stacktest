# Phase 11: Multi-Provider Composition

## Goal

Design and implement support for composite orchestrations where one test suite references multiple distinct provider stages sequentially, propagating stage outputs dynamically to downstream parameters.

---

## Deliverables

- **Schema Extensions**: Added `stages` array validation supporting sequential named stages with strict name uniqueness validations.
- **Dynamic Parameters Output Resolver**: Implemented support for `$[stage:stageName:outputKey]` and `$[output:stageName:outputKey]` dynamic variables.
- **Sequential Deployment Planning**: Updated `TestPlanner` to output sequence arrays per stage for target regions.
- **Run Orchestration Execution Grouping**: Modified `RunOrchestrator` to group plans and execute deployments sequentially while collecting outputs, and executing teardowns in reverse order.
- **Provider Outputs Extraction**: Enhanced AWS CloudFormation and Terraform providers to parse and return deployment outputs.

---

## GitHub Issues

### Issue 11.1: Extend Config Schemas for Stages and Outputs

- **Description**: Add stages schema validation and strict mutual exclusivity checks.
- **Target Commit**: `feat(core): extend schema validation for sequential stages`

### Issue 11.2: Implement Output Resolution in Parameters Resolver

- **Description**: Add stage output reference parsing.
- **Target Commit**: `feat(core): implement stage outputs parameter resolver`

### Issue 11.3: Update planning matrix to support multi-stage plans

- **Description**: Generate sequential plans for stages.
- **Target Commit**: `feat(core): support generating multi-stage planning matrix`

### Issue 11.4: Refactor RunOrchestrator for sequential deploy & reverse cleanup

- **Description**: Run sequential deploy and reverse cleanup in the execution engine.
- **Target Commit**: `feat(core): refactor orchestrator for sequential multi-stages and reverse teardown`

### Issue 11.5: Populate outputs in AWS CFN and Terraform providers

- **Description**: Capture outputs on successful deployments.
- **Target Commit**: `feat(provider): extract outputs from CloudFormation and Terraform deploys`

### Issue 11.6: Add Unit and Integration Tests for composition

- **Description**: Add unit and mock tests.
- **Target Commit**: `test(core): add multi-provider stages unit tests`

---

## Acceptance Criteria

- All stage-based test configuration schemas parse successfully.
- Parameters resolve dynamically across stages using completed stage outputs.
- Destroys execute in reverse-order to prevent dependency locking.
- Workspace builds, lint checks pass, and tests succeed.
