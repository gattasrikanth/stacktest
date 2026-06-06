# Phase 01: Configuration and Planning

## Goal

Implement configuration loading, syntax validation, and dry-run test planning. This phase allows users to define infrastructure deployments across different regions and run dry-run validation checks, creating deterministic deployment plans without executing any network/cloud calls.

## Deliverables

- **Config Schema**: Zod-based configuration schema in `packages/core` targeting properties: `project` (name), `providers` (names and settings), and `tests` (template paths, provider mappings, parameters).
- **Config Loader**: A utility that searches for, loads, parses, and validates `stacktest.yaml`/`stacktest.yml`.
- **Validation Engine**: Detailed structural error messages highlighting incorrect YAML definitions or missing files.
- **Test Planner**: Core class `TestPlanner` that transforms parsed configurations into a concrete, deterministic `DeploymentPlan` matrix.
- **Run ID Generator**: Unique run identifier generator (e.g. timestamp + short random string) for separating deployments.
- **CLI Commands**:
  - `stacktest lint`: Validates the structure and file existence of config, exiting non-zero if invalid.
  - `stacktest plan`: Outputs the expanded deployment matrix of templates, providers, and regions (supports standard terminal output and JSON via `--json`).

## GitHub Issues to Create

### Issue 1.1: Define Configuration Schema Models

- **Description**: Add TypeScript types and Zod schemas inside `packages/core` representing the official configuration layout (project configuration, provider region lists, test suites).
- **Target Commit**: `feat(core): define configuration schemas and typings`
- **Recommended Agent Role**: Architect

### Issue 1.2: Implement Config Loader and YAML Validator

- **Description**: Implement loader functions to locate, parse, and validate YAML configurations. Generate helpful, human-readable error messages for schema violations.
- **Target Commit**: `feat(core): implement yaml config loader and schema validation`
- **Recommended Agent Role**: Implementation

### Issue 1.3: Add `stacktest lint` Command to CLI

- **Description**: Integrate the configuration loader into the CLI. Expose the `lint` command that prints error logs on validation failure and exits with non-zero exit codes.
- **Target Commit**: `feat(cli): add lint command`
- **Recommended Agent Role**: Implementation

### Issue 1.4: Implement Deterministic Planning Engine

- **Description**: Write the `TestPlanner` logic that expands configured tests across providers and regions. Add a `RunIdGenerator` and a deployment naming strategy ensuring name safety.
- **Target Commit**: `feat(core): implement deployment planner and run-id generator`
- **Recommended Agent Role**: Architect

### Issue 1.5: Add `stacktest plan` Command to CLI

- **Description**: Expose the `plan` command in CLI to format and display the execution plan matrix. Implement the `--json` option for CI/machine reading.
- **Target Commit**: `feat(cli): add plan command with json output option`
- **Recommended Agent Role**: Implementation

## Acceptance Criteria

- `stacktest lint` must pass (exit code 0) for valid files and report structural path/value errors (exit code 1) for missing fields or templates.
- `stacktest plan` translates 3 tests across 3 regions into exactly 9 distinct deployment steps.
- Generated deployment names must be safe for cloud consumption (e.g., lowercase, alphanumeric, max 128 characters, no forbidden characters).
- Running these commands does not make any external network requests.

## Test Requirements

- Schema testing covering multiple invalid configuration cases (missing name, invalid structures, unsupported types).
- Fixture tests using mock file systems (or in-memory configs) to test files not existing on disk.
- Unit tests for the planning engine confirming expected matrix expansions.
- Naming generator unit tests ensuring generated deployment names remain within standard CloudFormation limitations (128 chars).

## Safety Notes

- The planning engine must be completely provider-agnostic. No provider-specific imports or dependencies should leak into the orchestrator.
- Maintain strict local isolation: do not attempt to contact AWS or any local credentials helper during planning and validation.
