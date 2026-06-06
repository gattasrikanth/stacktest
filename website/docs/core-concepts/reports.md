# Reports

StackTest records every execution trace inside the `.stacktest/runs/<run-id>/` directory:

- **`report.json`**: Comprehensive machine-readable metrics, parameters, and events.
- **`junit.xml`**: Standardized XML report parsed by CI tools (Jenkins, GitHub Actions, CircleCI) for build dashboard rendering.
- **`report.html`**: A portable, standalone interactive dark-mode dashboard showing timelines, collapsible logs, parameters, and failure reasons.
