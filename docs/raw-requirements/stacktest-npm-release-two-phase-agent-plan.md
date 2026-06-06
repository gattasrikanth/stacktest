# StackTest npm Release: Two-Phase Agentic Implementation Plan

**Project:** `gattasrikanth/stacktest`  
**Target npm scope:** `@stack-test`  
**Current release state:** No GitHub releases yet; npm packages not yet published.  
**Goal:** Publish StackTest packages to npm cleanly first, then add a safe GitHub-driven release pipeline that publishes future releases to npm automatically.

---

## Executive Decision

Use the new npm organization scope:

```text
@stack-test
```

The public npm package names should become:

```text
@stack-test/core
@stack-test/cli
@stack-test/provider-aws-cloudformation
@stack-test/provider-aws-cdk
@stack-test/provider-terraform
@stack-test/provider-azure-bicep
@stack-test/provider-kubernetes
@stack-test/provider-pulumi
```

The CLI command should remain simple:

```bash
stacktest
```

Users should eventually install with:

```bash
npm install --save-dev @stack-test/cli
npx stacktest --help
```

Do **not** use these old names anymore:

```text
@stacktest/core
@stacktest/cli
@stacktest/provider-*
```

Because those belong to the unavailable `@stacktest` scope, not the new `@stack-test` organization.

---

# Phase 1 — Prepare, Document, and Publish First npm Release Manually from Local

## Objective

Make the monorepo npm-publish-ready, rename all packages to the new `@stack-test` scope, validate package contents, publish the first public npm release manually from the maintainer's local machine, and update documentation only after the packages are confirmed live.

This phase intentionally avoids automation for the first release because package name ownership, access level, package contents, dependency rewriting, and smoke testing should be verified by a human once.

---

## Phase 1 Agent Instructions

### 1. Create a dedicated branch

```bash
git checkout main
git pull origin main
git checkout -b chore/npm-first-release
```

Do not publish from this branch directly unless the maintainer explicitly approves. The preferred flow is:

```text
branch changes → PR/review → merge to main → local publish from clean main checkout
```

---

### 2. Rename package scope everywhere

Search for all old names:

```bash
rg "@stacktest"
```

Replace all occurrences:

```text
@stacktest/  →  @stack-test/
```

Files likely affected:

```text
package.json files under packages/*
source imports if any package-name imports exist
docs/**/*.md
website/docs/**/*.md
website/src/**/*.tsx
README.md
ARCHITECTURE.md
examples or generated docs
```

Required result:

```bash
rg "@stacktest" .
```

must return no results, except this migration plan if it is intentionally committed.

---

### 3. Keep the root package private

The root package should remain private:

```json
{
  "name": "stacktest-monorepo",
  "private": true
}
```

Do **not** publish the monorepo root.

Add or confirm root-level scripts similar to this:

```json
{
  "scripts": {
    "build": "pnpm -r build",
    "test": "vitest run",
    "lint": "eslint \"packages/**/src/**/*.ts\"",
    "docs:build": "pnpm --dir website build",
    "docs:generate": "node scripts/generate-docs.js",
    "docs:check": "pnpm docs:generate && git diff --exit-code website/docs/cli website/docs/schema website/docs/api && pnpm docs:build",
    "pack:dry-run": "node scripts/npm-pack-dry-run.mjs",
    "publish:local:first-release": "node scripts/npm-publish-local.mjs"
  }
}
```

The script names may differ, but the repo must have one repeatable way to dry-run package contents and one repeatable way to publish in safe topological order.

---

### 4. Normalize every publishable package.json

Each package under `packages/*` should have clean npm metadata.

Use this shape as the baseline, adapted per package:

```json
{
  "name": "@stack-test/core",
  "version": "0.1.0",
  "description": "StackTest core planning and orchestration engine",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/gattasrikanth/stacktest.git",
    "directory": "packages/core"
  },
  "homepage": "https://gattasrikanth.github.io/stacktest/",
  "bugs": {
    "url": "https://github.com/gattasrikanth/stacktest/issues"
  },
  "keywords": [
    "infrastructure-testing",
    "iac",
    "cloudformation",
    "terraform",
    "cdk",
    "testing",
    "stacktest"
  ],
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "engines": {
    "node": ">=20"
  }
}
```

For the CLI package, preserve the public command name:

```json
{
  "name": "@stack-test/cli",
  "bin": {
    "stacktest": "./dist/index.js"
  }
}
```

Confirm the CLI entry file retains the shebang:

```ts
#!/usr/bin/env node
```

---

### 5. Add package-level README and LICENSE files

For every package under `packages/*`, add:

```text
README.md
LICENSE
```

The package README should be short and npm-friendly.

Minimum `packages/cli/README.md` content:

````md
# @stack-test/cli

Command-line interface for StackTest, a provider-agnostic infrastructure testing framework.

## Install

```bash
npm install --save-dev @stack-test/cli
```
````

## Usage

```bash
npx stacktest --help
npx stacktest plan
npx stacktest run --provider fake
```

## Documentation

https://gattasrikanth.github.io/stacktest/

````

Minimum `packages/core/README.md` content:

```md
# @stack-test/core

Core planning, configuration, dynamic parameter resolution, and orchestration primitives for StackTest.

Most users should install `@stack-test/cli` instead of using this package directly.
````

Provider READMEs should clearly mark maturity:

```md
Status: early preview / experimental provider.
```

---

### 6. Decide whether to publish all providers now or trim CLI dependencies

Current CLI package depends on all provider packages. Therefore one of these must be true before publishing `@stack-test/cli`:

#### Preferred for this release: publish all packages

Publish the full current package graph:

```text
@stack-test/core
@stack-test/provider-aws-cloudformation
@stack-test/provider-aws-cdk
@stack-test/provider-terraform
@stack-test/provider-azure-bicep
@stack-test/provider-kubernetes
@stack-test/provider-pulumi
@stack-test/cli
```

#### Alternative: publish only core + CLI

Only choose this if the agent also removes provider packages from CLI runtime dependencies and loads providers lazily or marks them as optional. Do not leave unpublished provider packages as CLI dependencies.

Recommendation: publish all packages now, because this is still `0.1.0` and the current monorepo already models these packages.

---

### 7. Add packaging safety scripts

Create a script like:

```text
scripts/npm-package-order.mjs
```

It should discover publishable packages from `packages/*/package.json`, ignore private packages, and topologically sort by internal `@stack-test/*` dependencies.

Expected order for the first release:

```text
@stack-test/core
@stack-test/provider-aws-cloudformation
@stack-test/provider-aws-cdk
@stack-test/provider-azure-bicep
@stack-test/provider-kubernetes
@stack-test/provider-pulumi
@stack-test/provider-terraform
@stack-test/cli
```

`@stack-test/provider-aws-cdk` must publish after `@stack-test/provider-aws-cloudformation` because it depends on it.

Create:

```text
scripts/npm-pack-dry-run.mjs
```

Required behavior:

1. Run root build first or fail if `dist/` does not exist.
2. For each publishable package, run an npm/pnpm pack dry-run.
3. Print exactly what files would be published.
4. Fail if any package tarball includes unwanted content such as:
   - `src/`
   - `node_modules/`
   - `.env`
   - test output
   - screenshots
   - local artifacts
   - generated cache folders
5. Fail if `README.md`, `LICENSE`, `dist`, or type declarations are missing.

Create:

```text
scripts/npm-publish-local.mjs
```

Required behavior:

1. Refuse to run if `git status --porcelain` is not clean.
2. Refuse to run if current branch is not `main`, unless `--allow-non-main` is explicitly passed.
3. Confirm `npm whoami` succeeds.
4. Confirm no old `@stacktest/*` references exist.
5. Pack each package to a temporary `.artifacts/npm/` folder.
6. Publish tarballs in dependency order using:

```bash
npm publish <tarball.tgz> --access public
```

7. Stop immediately on failure.
8. Print post-publish verification commands.

Why publish tarballs instead of raw package directories? Because tarball packing from pnpm can correctly resolve workspace dependencies before npm publishes the package. This avoids accidentally publishing `workspace:*` dependency specifiers.

---

### 8. Update docs carefully

Update docs in two layers.

#### Before packages are live

Docs may say:

```md
The npm scope is `@stack-test`. Packages are being prepared for the first public release.
```

Do not claim npm install works until it really works.

#### After packages are live

Replace source-only install examples with:

```bash
npm install --save-dev @stack-test/cli
npx stacktest --help
npx stacktest plan
```

Keep source install instructions as a contributor path:

```bash
git clone https://github.com/gattasrikanth/stacktest.git
cd stacktest
pnpm install
pnpm build
pnpm test
```

Update at minimum:

```text
README.md
website/docs/getting-started/*
website/docs/cli/*
website/src/pages/index.tsx if it shows install commands
package-level README files
```

---

### 9. Run local validation before PR

Required commands:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
pnpm docs:check
pnpm pack:dry-run
rg "@stacktest"
```

Expected results:

```text
all checks pass
no @stacktest references remain
all publishable packages have @stack-test names
all package tarballs are clean
```

---

### 10. Commit and merge preparation work

Recommended commit:

```bash
git add .
git commit -m "chore: prepare @stack-test packages for npm publishing"
git push origin chore/npm-first-release
```

Open PR and verify CI.

After merge:

```bash
git checkout main
git pull origin main
```

---

## Phase 1 Manual npm Publish Runbook

The maintainer should run these from a clean `main` checkout.

### 1. Confirm npm identity and org access

```bash
npm login
npm whoami
npm org ls stack-test
```

The logged-in npm user must have publish rights to the `@stack-test` organization.

### 2. Run final verification

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
pnpm docs:check
pnpm pack:dry-run
```

### 3. Publish first npm packages

```bash
pnpm publish:local:first-release
```

The publish script should internally publish the package tarballs in dependency order.

If publishing manually without the script, use this order:

```bash
npm publish .artifacts/npm/stack-test-core-0.1.0.tgz --access public
npm publish .artifacts/npm/stack-test-provider-aws-cloudformation-0.1.0.tgz --access public
npm publish .artifacts/npm/stack-test-provider-aws-cdk-0.1.0.tgz --access public
npm publish .artifacts/npm/stack-test-provider-azure-bicep-0.1.0.tgz --access public
npm publish .artifacts/npm/stack-test-provider-kubernetes-0.1.0.tgz --access public
npm publish .artifacts/npm/stack-test-provider-pulumi-0.1.0.tgz --access public
npm publish .artifacts/npm/stack-test-provider-terraform-0.1.0.tgz --access public
npm publish .artifacts/npm/stack-test-cli-0.1.0.tgz --access public
```

Adjust tarball names to the actual names generated by `pnpm pack`.

### 4. Smoke test from an empty folder

```bash
mkdir -p /tmp/stacktest-npm-smoke
cd /tmp/stacktest-npm-smoke
npm init -y
npm install --save-dev @stack-test/cli
npx stacktest --help
npx stacktest plan
npx stacktest run --provider fake
```

If this fails, do not update docs yet. Fix, bump versions if required, republish, then smoke test again.

### 5. Update docs after npm is live

Create a follow-up branch:

```bash
git checkout -b docs/npm-install-live
```

Update docs to show npm install as the default path.

Run:

```bash
pnpm docs:check
```

Commit:

```bash
git add .
git commit -m "docs: add npm install instructions for @stack-test packages"
git push origin docs/npm-install-live
```

### 6. Create the first GitHub release record

Because the repo currently has no GitHub releases, create a first release after npm packages are confirmed live.

Recommended tag:

```text
v0.1.0
```

CLI option:

```bash
git tag v0.1.0
git push origin v0.1.0
gh release create v0.1.0 \
  --title "StackTest v0.1.0" \
  --notes "Initial public npm release under the @stack-test scope."
```

This first GitHub release is mainly a historical marker. Future releases should use the automated mechanism in Phase 2.

---

## Phase 1 Acceptance Criteria

Phase 1 is complete only when all are true:

```text
[ ] All package names use @stack-test/*.
[ ] No @stacktest/* references remain.
[ ] Root package remains private.
[ ] Every publishable package has clean npm metadata.
[ ] Every publishable package has README.md and LICENSE.
[ ] Package dry-run shows clean contents only.
[ ] @stack-test packages are visible on npm.
[ ] Empty-folder smoke test passes.
[ ] README and website docs show @stack-test install commands.
[ ] GitHub has initial v0.1.0 release record.
```

---

# Phase 2 — Automate GitHub Releases to npm Publishing

## Objective

Add a reliable mechanism so that future GitHub releases publish npm packages automatically.

Recommended automation model:

```text
Code PRs include changesets
→ merge to main
→ Changesets creates a Version Packages PR
→ maintainer reviews and merges Version Packages PR
→ maintainer publishes GitHub Release
→ GitHub Actions publishes npm packages using npm Trusted Publishing
```

This avoids silent publishing on every push to `main` and keeps release intent clear.

---

## Phase 2 Design Choices

### Use Changesets for versioning

Changesets gives the repo a clean release process:

```text
patch/minor/major intent is declared in PRs
package versions are bumped consistently
CHANGELOG files are generated
release PR is reviewable
```

### Use GitHub Release as the npm publish trigger

Use this event:

```yaml
on:
  release:
    types: [published]
```

That means npm publishing happens only when a GitHub release is intentionally published.

### Use npm Trusted Publishing, not long-lived npm tokens

Use npm Trusted Publishing with GitHub Actions OIDC.

Benefits:

```text
no long-lived NPM_TOKEN secret required
short-lived workflow credentials
automatic provenance for public packages from public repos
more secure release process
```

Important requirement:

```text
Trusted Publishing requires npm CLI 11.5.1+ and Node 22.14.0+.
```

Use Node 24 or newer in the publish workflow.

---

## Phase 2 Agent Instructions

### 1. Add Changesets

```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
```

Configure `.changeset/config.json`.

Recommended initial config:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

Keep `fixed` empty for independent package versioning unless the maintainer explicitly wants all packages to always share the same version.

Agent rule for future PRs:

```text
If a PR changes runtime behavior, CLI behavior, public APIs, package exports, docs that affect package usage, or provider behavior, include a changeset.
```

No changeset needed for:

```text
pure typo fixes
internal comments
non-user-facing refactors with no package output change
```

---

### 2. Add version PR workflow

Create:

```text
.github/workflows/changesets-version.yml
```

Recommended workflow:

```yaml
name: Version Packages

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write

jobs:
  version:
    runs-on: ubuntu-latest
    if: github.repository == 'gattasrikanth/stacktest'
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup pnpm
        uses: pnpm/action-setup@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "24"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Validate before creating version PR
        run: |
          pnpm lint
          pnpm test
          pnpm build
          pnpm docs:check

      - name: Create Version Packages PR
        uses: changesets/action@v1
        with:
          title: "chore: version packages"
          commit: "chore: version packages"
          version: pnpm changeset version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This workflow creates the version/changelog PR only. It does **not** publish to npm.

---

### 3. Add npm publish workflow triggered by GitHub releases

Create:

```text
.github/workflows/publish-npm.yml
```

Recommended workflow:

```yaml
name: Publish npm packages

on:
  release:
    types: [published]

concurrency: npm-publish-${{ github.ref }}

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    if: github.repository == 'gattasrikanth/stacktest'
    environment: npm-publish
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup pnpm
        uses: pnpm/action-setup@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: "24"
          registry-url: "https://registry.npmjs.org"
          package-manager-cache: false

      - name: Ensure npm supports trusted publishing
        run: |
          npm --version
          node --version

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Validate release build
        run: |
          pnpm lint
          pnpm test
          pnpm build
          pnpm docs:check
          pnpm pack:dry-run

      - name: Publish packages to npm
        run: node scripts/npm-publish-ci.mjs
```

Do not add `NODE_AUTH_TOKEN` for Trusted Publishing. The workflow should rely on OIDC.

---

### 4. Add CI publish script using tarballs

Create:

```text
scripts/npm-publish-ci.mjs
```

Required behavior:

1. Discover publishable packages in `packages/*`.
2. Sort packages by internal dependency order.
3. For each package:
   - Read package name and version.
   - Run `npm view <name>@<version> version`.
   - If the exact version exists, print `skip already published` and continue.
   - If missing, pack the package into `.artifacts/npm/` using pnpm.
   - Publish the generated tarball using npm CLI:

```bash
npm publish <tarball.tgz> --access public
```

4. Fail fast on publish error.
5. At the end, print all published packages and all skipped packages.

Important: publish the tarball, not the raw package directory, so workspace dependencies are rewritten correctly before publishing.

Pseudo-code outline:

```js
for (const pkg of sortedPackages) {
  const exists = await npmView(`${pkg.name}@${pkg.version}`);
  if (exists) {
    skip(pkg);
    continue;
  }

  const tarball = await pnpmPack(pkg.dir, artifactsDir);
  await npmPublishTarball(tarball, { access: "public" });
}
```

---

### 5. Configure npm Trusted Publisher for every package

After Phase 1 packages exist on npm, configure Trusted Publishing in npm package settings for each package.

For every `@stack-test/*` package:

```text
Package → Settings → Trusted Publisher → GitHub Actions
```

Use:

```text
GitHub organization/user: gattasrikanth
GitHub repository: stacktest
Workflow filename: publish-npm.yml
Environment name: npm-publish
Allowed action: npm publish
```

If npm asks for the workflow filename, enter only:

```text
publish-npm.yml
```

Do not enter:

```text
.github/workflows/publish-npm.yml
```

If the `npm-publish` environment is used in GitHub Actions, create it in GitHub repository settings and optionally require manual approval before production publishing.

---

### 6. Add release checklist to docs

Create or update:

```text
docs/RELEASING.md
website/docs/contributing/releasing.md
```

Minimum content:

````md
# Releasing StackTest

1. Every user-facing PR should include a changeset.
2. Merge feature PRs into `main`.
3. Wait for the `Version Packages` PR.
4. Review generated version bumps and changelogs.
5. Merge the `Version Packages` PR.
6. Create a GitHub release for the new version.
7. The `Publish npm packages` workflow will publish packages to npm.
8. Verify with:

```bash
npm view @stack-test/cli version
npm install --save-dev @stack-test/cli
npx stacktest --help
```
````

````

---

## Phase 2 Release Runbook

### For a normal release

1. Feature PR includes changeset:

```bash
pnpm changeset
````

2. Merge feature PR to `main`.
3. Changesets workflow opens `chore: version packages` PR.
4. Review version bumps and changelogs.
5. Merge version PR.
6. Create GitHub release:

```bash
gh release create v0.1.1 --generate-notes --target main
```

7. Confirm `Publish npm packages` GitHub Action succeeds.
8. Smoke test:

```bash
mkdir -p /tmp/stacktest-release-smoke
cd /tmp/stacktest-release-smoke
npm init -y
npm install --save-dev @stack-test/cli
npx stacktest --help
```

---

## Phase 2 Acceptance Criteria

Phase 2 is complete only when all are true:

```text
[ ] Changesets is initialized and documented.
[ ] PRs can include changesets.
[ ] Version Packages workflow opens a version PR on main.
[ ] publish-npm.yml exists and runs on GitHub Release published.
[ ] publish-npm.yml has id-token: write permission.
[ ] npm Trusted Publisher is configured for every @stack-test package.
[ ] No long-lived NPM_TOKEN is required for npm publishing.
[ ] CI publish script skips already-published versions safely.
[ ] CI publish script publishes new versions in dependency order.
[ ] GitHub release creation triggers npm publish.
[ ] Post-release empty-folder smoke test passes.
```

---

# Agent Guardrails

## Do not do these

```text
Do not publish the root monorepo package.
Do not leave @stacktest/* references anywhere.
Do not publish docs saying npm install works before the package is live.
Do not auto-publish every push to main.
Do not store npm auth tokens unless the maintainer explicitly rejects Trusted Publishing.
Do not publish with dirty git state.
Do not publish source, tests, screenshots, node_modules, .env files, or local artifacts.
Do not continue publishing after one package fails.
Do not overwrite or republish the same npm version; npm versions are immutable.
```

## Always do these

```text
Use @stack-test/* package names.
Keep CLI command as stacktest.
Run lint, tests, build, docs:check before publishing.
Run pack dry-run before publishing.
Publish dependency packages before dependents.
Smoke test from an empty folder after publishing.
Update docs only after smoke test passes.
Commit all release-process changes with clear messages.
```

---

# Recommended Agent Task Breakdown

## Task A — Scope migration and package metadata

```text
Rename @stacktest/* to @stack-test/* everywhere.
Normalize package.json metadata.
Add README.md and LICENSE to each package.
Add package files whitelist.
Ensure CLI bin works.
Run full validation.
Commit changes.
```

## Task B — Packaging scripts

```text
Create package discovery + topological sort utility.
Create npm pack dry-run script.
Create local first-publish script.
Validate tarball contents.
Commit changes.
```

## Task C — Docs update for first release

```text
Before npm publish: docs mention @stack-test scope but avoid claiming install works.
After npm publish: update README and website docs with npm install.
Commit changes.
```

## Task D — First manual publish support

```text
Guide maintainer through npm login and org access check.
Run full validation.
Run local publish script from clean main.
Run empty-folder smoke test.
Create v0.1.0 GitHub release.
```

## Task E — Changesets automation

```text
Install and initialize Changesets.
Add version PR workflow.
Add release docs.
Commit changes.
```

## Task F — GitHub Release to npm automation

```text
Add publish-npm.yml.
Add npm-publish-ci.mjs tarball publish script.
Configure Trusted Publisher instructions.
Test with next patch release.
Commit changes.
```

---

# Suggested First Release Naming

Use:

```text
v0.1.0
```

npm versions:

```text
0.1.0
```

Release title:

```text
StackTest v0.1.0
```

Release notes:

````md
Initial public npm release of StackTest under the `@stack-test` npm organization scope.

Published packages:

- `@stack-test/core`
- `@stack-test/cli`
- `@stack-test/provider-aws-cloudformation`
- `@stack-test/provider-aws-cdk`
- `@stack-test/provider-terraform`
- `@stack-test/provider-azure-bicep`
- `@stack-test/provider-kubernetes`
- `@stack-test/provider-pulumi`

Install:

```bash
npm install --save-dev @stack-test/cli
npx stacktest --help
```
````

````

---

# Final Expected User Experience

After Phase 1:

```bash
npm install --save-dev @stack-test/cli
npx stacktest plan
npx stacktest run --provider fake
````

After Phase 2:

```text
Maintainer publishes a GitHub Release
→ GitHub Actions validates repo
→ npm packages publish automatically
→ npm provenance is generated through Trusted Publishing
→ users install the new version from npm
```
