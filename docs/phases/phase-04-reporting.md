# Phase 04: Reporting & Dashboarding

## Goal

Generate comprehensive local JSON, JUnit XML, and beautiful interactive HTML report dashboards for test executions. Reports should make failed resources easy to identify, include detailed metadata (provider, region, test name, duration, and failure reason), and supply standard JUnit XML fixtures for CI system integrations.

## Deliverables

- **DeploymentResult Update**: Extend `DeploymentResult` to include optional `events: DeploymentEvent[]` so that all events are propagated from providers during orchestration.
- **Report Generator Utility**: A module in `packages/core/src/reporting/generator.ts` that writes execution records.
- **JSON Report**: `report.json` containing structured run execution details and summary metrics.
- **JUnit Report**: `junit.xml` parsing results into standardized XML suitable for CI engines.
- **HTML Dashboard**: A portable, self-contained interactive dashboard (`report.html`) utilizing Inter typography, sleek dark mode theme, glassmorphism cards, collapsible event grids, and responsive layouts.
- **CLI Integration**: Automatically trigger report generation upon completion of `stacktest run` and print the output path of the generated dashboard.

## GitHub Issues to Create

### Issue 4.1: Extend Result Interfaces and Event Collection

- **Description**: Add `events` array to `DeploymentResult` model. Update `RunOrchestrator` to fetch provider events upon deployment end and attach them to the result objects.
- **Target Commit**: `feat(core): extend deployment result with events collection`
- **Recommended Agent Role**: Architect

### Issue 4.2: Implement Core Report Generator Engine

- **Description**: Create the generator utility in `packages/core` that writes the `report.json` and standard `junit.xml` to `.stacktest/runs/<run-id>/`.
- **Target Commit**: `feat(core): implement json and junit xml report generator`
- **Recommended Agent Role**: Implementation

### Issue 4.3: Build Premium HTML Dashboard Report

- **Description**: Design and build the single-file interactive HTML dashboard template. Inline the runtime data as JSON and render a responsive, dark-themed dashboard.
- **Target Commit**: `feat(core): build interactive html dashboard report`
- **Recommended Agent Role**: Implementation

### Issue 4.4: Integrate Report Generation into CLI Run Command

- **Description**: Integrate the report generation engine into CLI `run` command execution flow. Print report paths to the console upon completion.
- **Target Commit**: `feat(cli): generate execution reports on run completion`
- **Recommended Agent Role**: Implementation

## Acceptance Criteria

- Running `stacktest run` creates a folder at `.stacktest/runs/<run-id>/` containing `report.json`, `junit.xml`, and `report.html`.
- The HTML report renders a stunning dashboard, featuring dark mode, clear pass/fail status, duration info, parameters, and collapsible deployment event logs.
- Failed deployments display the exact resource error status and reasons clearly.
- The JUnit XML report parses correctly under XML schema validators and formats test cases matching classname hierarchies.
- The monorepo compiles and runs tests cleanly.

## Test Requirements

- Unit tests in `packages/core/src/reporting/generator.test.ts` mocking various results (success, failure, multiple regions) and asserting JSON, XML, and HTML structure.
- CLI tests validating that `run` execution writes the files and outputs the paths.
