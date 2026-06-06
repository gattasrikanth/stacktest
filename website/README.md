# StackTest Documentation Website

This directory contains the documentation portal and product landing page for StackTest, built using [Docusaurus](https://docusaurus.io/) with TypeScript, dark-mode styling, and SEO best practices.

## Installation

From the monorepo root directory, install all workspace dependencies using `pnpm`:

```bash
pnpm install
```

## Local Development

Start the local development server:

```bash
pnpm --filter website start
```

This starts a hot-reloading development server (by default at [http://localhost:3000](http://localhost:3000) or another open port).

## Code Validation

Before committing website changes or opening a pull request, run the following validation scripts:

### Typechecking
Verify TypeScript types:

```bash
pnpm --filter website typecheck
```

### Production Build
Test the production optimization bundle build:

```bash
pnpm --filter website build
```

This will run Docusaurus' production build compiler. Note that broken relative links or invalid markdown link targets will throw errors and fail the build.

### Serve Build locally
To serve and preview the compiled static site locally:

```bash
pnpm --filter website serve
```

## Troubleshooting

If you encounter stale layout bugs, MDX parse errors, or cached build inconsistencies, clear the Docusaurus cache:

```bash
pnpm --filter website clear
```
