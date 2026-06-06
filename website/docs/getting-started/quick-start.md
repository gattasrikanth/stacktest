# Quick Start

Get up and running with StackTest in less than 2 minutes.

---

## 1. Initialize Your Project

Bootstrap your StackTest configuration:

```bash
npx stacktest init
```

This creates a `stacktest.yaml` config file and a sample template under `templates/sample.yaml`.

---

## 2. Dry-Run Planning

Generate and review your test planning matrix without making any live cloud requests:

```bash
npx stacktest plan
```

This displays the expanded deployment plan (providers, regions, test targets) and runs dynamic parameter interpolation.

---

## 3. Run Simulated Tests

Execute the test suites locally using the mock `fake` provider:

```bash
npx stacktest run --provider fake
```

The test runner will deploy the mock template, capture output events, tear down the simulated resources, and generate HTML, JSON, and JUnit XML reports inside the `.stacktest/runs/` directory.

After your first run, open the local dashboard to inspect the run history, deployment events, and artifacts:

```bash
npx stacktest dashboard
```
