# Test Runs

A **Test Run** is a single execution of your planned test matrix. Every time you invoke `stacktest run`, a unique, randomized run ID is generated:

```text
Run ID format: st-run-<hash>
Example: st-run-f9a2c
```

The run ID is injected into dynamic values and tag metadata, isolating deployments across different developers or concurrent CI pipeline builds.
