# Reports

StackTest records every execution trace inside the `.stacktest/runs/<run-id>/` directory:

- **`report.json`**: Comprehensive machine-readable metrics, parameters, and events.
- **`junit.xml`**: Standardized XML report parsed by CI tools (Jenkins, GitHub Actions, CircleCI) for build dashboard rendering.
- **`report.html`**: A portable, standalone interactive dark-mode dashboard showing timelines, collapsible logs, parameters, and failure reasons.
- **`manifest.json`**, **`summary.json`**, **`events.jsonl`**, **`deployments.json`**, and **`assertions.json`**: Normalized local dashboard artifacts for run history, live event streaming, and tolerant parsing.

The local dashboard reads these files directly:

```bash
npx stacktest dashboard
```

The dashboard is local-only and binds to `127.0.0.1` by default.
