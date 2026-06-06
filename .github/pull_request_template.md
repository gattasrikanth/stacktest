## Summary

Provide a description of the changes made and the rationale behind the implementation.

## Related Issues

Resolves # (issue number)

## Scope of Changes
- [ ] Core package (`packages/core`)
- [ ] CLI package (`packages/cli`)
- [ ] AWS Provider (`packages/provider-aws-cloudformation`)
- [ ] Documentation / Tooling
- [ ] Other:

## Checklist
- [ ] Checked naming conventions on branch and commits.
- [ ] Code compiles cleanly locally (`pnpm build`).
- [ ] Lint check passes (`pnpm lint`).
- [ ] Prettier formatting has been applied (`pnpm format`).
- [ ] Added unit tests covering the new paths.
- [ ] All unit tests pass locally (`pnpm test`).

## Safety Validation
- [ ] Verified that any destructive actions (like stack deletions) strictly enforce metadata tag checks.
- [ ] No AWS or other cloud credentials/keys have been hardcoded or checked into git.
