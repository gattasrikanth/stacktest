# Continuous Integration Guide

Integrate StackTest in your GitHub Actions pipeline:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: npx stacktest run --provider fake
```
