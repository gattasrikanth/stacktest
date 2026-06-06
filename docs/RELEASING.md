# Releasing StackTest

StackTest uses a two-phase implementation approach for releases: local first-release verification followed by automated CI releases.

## Phase 1 — First npm Release (Manual)

To publish the first public release of StackTest:

1. Confirm your NPM organization membership permissions:

   ```bash
   npm whoami
   npm org ls stack-test
   ```

2. Run the local publish verification checks:

   ```bash
   pnpm install --frozen-lockfile
   pnpm lint
   pnpm test
   pnpm build
   pnpm docs:check
   pnpm pack:dry-run
   ```

3. Publish the packages using the local publication helper:

   ```bash
   pnpm publish:local:first-release --allow-non-main
   ```

4. Create the initial GitHub release record:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   gh release create v0.1.0 --title "StackTest v0.1.0" --notes "Initial public npm release under the @stack-test scope."
   ```

## Phase 2 — Future Releases (Automated)

Subsequent package updates and releases are automated using Changesets and npm Trusted Publishing:

1. **Include a Changeset**: For any pull request modifying core behavior, CLI, or providers, run:

   ```bash
   pnpm changeset
   ```

   Follow the prompts to specify whether the change is a `patch`, `minor`, or `major` version bump and write a short summary.

2. **Merge PRs**: Merge PRs into `main`. The `Version Packages` action will automatically compile changesets and open/update a `chore: version packages` Pull Request.

3. **Merge Version PR**: Review and merge the Version PR. This bumps versions in `package.json` files and generates `CHANGELOG.md` files.

4. **Publish GitHub Release**:
   Create a new GitHub release pointing to the version tag (e.g. `v0.1.1`):
   ```bash
   gh release create v0.1.1 --generate-notes --target main
   ```
   Publishing the GitHub Release triggers the OIDC-based Trusted Publishing workflow which publishes the updated packages to npm automatically without long-lived NPM tokens.

> [!TIP]
> If you need to dry-run package packing locally before triggering a release, you can run:
>
> ```bash
> pnpm pack:dry-run
> ```
