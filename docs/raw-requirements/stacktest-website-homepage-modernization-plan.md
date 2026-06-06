# StackTest Website Home Page Modernization Plan

**Repo:** `gattasrikanth/stacktest`  
**Area:** `website/` Docusaurus site  
**Goal:** Replace the current default-looking landing page with a modern, minimal, enthusiastic docs-first home page while keeping the site clean, maintainable, fast, and easy for AI agents to update.

---

## 1. Current Review Summary

The website is already on the right foundation: Docusaurus, TypeScript, sidebar-driven docs, strict broken-link checks, dark-mode support, and a good documentation taxonomy. The docs page itself is usable and already looks much better than the home page.

The home page, however, still feels like a lightly modified Docusaurus starter page. It has a basic hero, one CTA, three plain text feature blocks, and a large empty dark area before the footer. It does not yet communicate the energy, usefulness, or open-source ambition of StackTest.

### What is good already

- Docusaurus is a good choice for an open-source documentation portal.
- TypeScript is already enabled.
- `onBrokenLinks: 'throw'` and `onBrokenMarkdownLinks: 'throw'` are already configured, which is good for doc quality.
- Sidebar structure is strong: getting started, concepts, configuration, CLI, examples, architecture, API, schema, contributing, AI resources, troubleshooting, changelog.
- Dark mode is already the default, which fits a modern developer-tool site.

### What needs improvement

- Home page is too generic and too empty.
- Hero does not explain the practical value quickly enough.
- Only one CTA exists; users should see both “Get Started” and “View GitHub”.
- No quick CLI example is visible on the landing page.
- No workflow story is visible: plan → deploy → validate → cleanup → report.
- No visual system exists for cards, badges, code panels, feature icons, or section backgrounds.
- Some starter-template files and styles remain.
- No lint/format/test/site-quality script appears to be defined for the website.
- No visible lockfile exists inside `website/`; use the repo’s package-manager strategy consistently.
- Home page content is hardcoded directly in components. It is okay for now, but should be structured cleanly so future agents can modify it safely.

---

## 2. Desired Home Page Direction

Design the home page as a developer-focused product landing page, not a marketing-heavy startup page.

Style target:

- Modern, minimal, dark-first, energetic.
- Clean typography and spacing.
- Subtle gradients and grid effects, not flashy animations.
- Practical content over buzzwords.
- Fast static page, no heavy client-side dependencies.
- Works well on mobile, tablet, and desktop.
- Looks credible for an early open-source infrastructure testing tool.

Tone target:

> “StackTest helps developers safely test IaC stacks across providers, collect useful reports, and clean up without hurting existing infrastructure.”

---

## 3. New Home Page Content Architecture

Implement the home page with these sections in order.

### 3.1 Hero Section

Purpose: explain StackTest in 5 seconds.

Content:

- Small eyebrow badge: `Open-source infrastructure testing for IaC`
- H1: `Test infrastructure stacks before they surprise you.`
- Subtitle: `StackTest runs repeatable infrastructure tests across IaC tools and cloud providers, validates outcomes, protects cleanup with ownership checks, and produces CI-friendly reports.`
- CTA 1: `Get Started`
- CTA 2: `View on GitHub`
- Small trust hints under CTA:
  - `Provider-agnostic core`
  - `Safety-first cleanup`
  - `CI-ready reports`

Visual:

- Left side: text and CTAs.
- Right side: terminal/code card showing a realistic StackTest command and output.
- Background: dark gradient with subtle green/teal glow and faint grid.

Example terminal content:

```bash
npm create stacktest@latest
cd my-iac-tests
stacktest run --config stacktest.yml
```

Example output:

```text
✓ planned 3 regions
✓ validated ownership tags
✓ deployed test stack
✓ captured outputs
✓ destroyed test resources
✓ wrote reports/html/index.html
```

### 3.2 Problem / Promise Strip

Purpose: make the pain obvious.

Three compact cards:

1. `Failed test stacks leave expensive leftovers`
2. `Cleanup scripts can delete the wrong resources`
3. `IaC tools differ, but testing workflows repeat`

Then one sentence:

> StackTest separates test orchestration from provider-specific logic so every provider can follow the same safe lifecycle.

### 3.3 How It Works Section

Purpose: show the lifecycle visually.

Five steps:

1. `Plan` — read config, expand providers, regions, parameters.
2. `Deploy` — call provider adapter.
3. `Validate` — run assertions and collect events.
4. `Cleanup` — destroy only owned resources.
5. `Report` — JSON, JUnit, HTML dashboard.

Use a horizontal flow on desktop and stacked cards on mobile.

### 3.4 Feature Cards Section

Replace the current three plain text blocks with six strong cards:

- `Provider-agnostic core`
- `Safe cleanup by design`
- `Dynamic parameters`
- `CI-friendly reporting`
- `Local-first development`
- `Agent-friendly docs`

Each card should have:

- Small icon or emoji-style glyph using CSS/text only, no external icon package required.
- One heading.
- One tight paragraph.
- Optional doc link where appropriate.

### 3.5 Quick Start Preview

Purpose: make users feel “I can try this.”

Show a two-column section:

Left: short explanation and button to quick start docs.  
Right: YAML config preview.

Example YAML:

```yaml
name: cfn-smoke-test
providers:
  aws-cloudformation:
    regions: [us-east-1, us-west-2]

tests:
  - name: vpc-template
    template: ./templates/vpc.yml
    parameters:
      EnvironmentName: stacktest-dev
```

### 3.6 Reports Preview Section

Purpose: show output value.

Create a mock report card using HTML/CSS only:

- `Run summary`
- `3 passed / 0 failed`
- `Cleanup verified`
- Mini list: JSON, JUnit XML, HTML dashboard.

Do not use screenshots yet. Keep it static and maintainable.

### 3.7 Final CTA Section

Purpose: close the landing page.

Text:

> Start with one template. Add providers later.

Buttons:

- `Read the Quick Start`
- `Explore the Architecture`

---

## 4. Implementation Scope

### Files likely to change

- `website/src/pages/index.tsx`
- `website/src/pages/index.module.css`
- `website/src/components/HomepageFeatures/index.tsx`
- `website/src/components/HomepageFeatures/styles.module.css`
- `website/src/css/custom.css`
- `website/docusaurus.config.ts`
- `website/README.md`
- `website/package.json`

### Files to consider deleting or changing

- `website/src/pages/markdown-page.mdx` if it is still starter-template content and not intentionally used.
- Any unused `.featureSvg` style if no SVG feature icons exist.

Do not make large unrelated documentation rewrites in this task. This task is home-page modernization plus small website quality improvements only.

---

## 5. Engineering Standards for the Agent

### 5.1 Component Design

- Keep the home page mostly static and content-driven.
- Avoid adding heavy dependencies for icons, animation, analytics, or CSS frameworks.
- Prefer CSS modules for page-specific styling.
- Use Docusaurus `Link`, `Layout`, and `Heading` where appropriate.
- Avoid inline styles. Move all styling into CSS modules.
- Keep content arrays typed with TypeScript.
- Use semantic HTML: `section`, `header`, `article`, `ol`, `ul`, `pre`, `code`.
- Ensure all visible navigation links use valid Docusaurus routes.

### 5.2 Visual Design Requirements

- Preserve dark-mode excellence.
- Ensure light mode is acceptable even if dark mode is the primary design.
- Use CSS variables for recurring colors, borders, shadows, and gradients.
- Avoid huge empty vertical gaps.
- Use `max-width` and consistent section padding.
- Use responsive layouts with CSS grid/flex and media queries.
- Add hover states, but keep them subtle.
- Do not use autoplay animations or anything that hurts accessibility.

### 5.3 Accessibility Requirements

- One clear H1 on the page.
- Headings must be hierarchical.
- Buttons/links must have descriptive text.
- Color contrast must be readable in dark and light modes.
- Terminal/code blocks must be readable on mobile.
- Respect `prefers-reduced-motion` if any transitions are added.

### 5.4 SEO / Metadata

Update the `Layout` props on the home page:

- Title should be concise: `StackTest | Multi-cloud IaC Testing`
- Description should be specific: `StackTest is an open-source, provider-agnostic infrastructure testing framework for CloudFormation, Terraform, AWS CDK, Pulumi, Kubernetes, and Azure Bicep workflows.`

Consider adding theme metadata in `docusaurus.config.ts` later, but keep this task focused unless very quick.

---

## 6. Website Source Code Quality Improvements

### 6.1 Package scripts

Review and add these scripts if compatible with the repo’s package-manager approach:

```json
{
  "scripts": {
    "typecheck": "tsc",
    "build": "docusaurus build",
    "serve": "docusaurus serve",
    "clear": "docusaurus clear",
    "check": "npm run typecheck && npm run build"
  }
}
```

Use the existing package manager. If the repository uses npm, add/update `package-lock.json`. If it uses yarn, add/update `yarn.lock`. Do not create multiple lockfile types.

### 6.2 README cleanup

The current website README should be upgraded from starter-template text to project-specific instructions:

- What the website is.
- How to install dependencies.
- How to run locally.
- How to build.
- How to validate before PR.
- How to deploy to GitHub Pages if that is the chosen route.
- Troubleshooting: clear Docusaurus cache.

### 6.3 Remove starter artifacts

Remove unused starter markdown/page artifacts only if confirmed unused by routes or links.

### 6.4 Optional formatting/linting

If the root repo already has Prettier/ESLint conventions, apply them to `website/`. If not, do not introduce a large linting system in this task. Create a follow-up issue instead.

---

## 7. Suggested Implementation Steps

### Step 1 — Baseline validation

Run from repo root or website folder:

```bash
cd website
npm install
npm run typecheck
npm run build
```

If the project uses yarn instead of npm, use yarn consistently.

Record current failures before changing code.

### Step 2 — Refactor home page structure

Update `src/pages/index.tsx`:

- Replace `HomepageHeader` with a richer hero component.
- Add new sections in clean semantic order.
- Keep the page readable; avoid one giant JSX blob by extracting small internal components when helpful.
- Keep the existing `HomepageFeatures` component or rename it only if cleanly done.

### Step 3 — Redesign feature component

Update `src/components/HomepageFeatures/index.tsx`:

- Replace three-column plain feature text with six card-based features.
- Add typed feature data array.
- Use stable keys such as `feature.title`, not array index.
- Remove inline styles.

### Step 4 — Build the design system in CSS modules

Update CSS files:

- `index.module.css` for hero, lifecycle, quick start, report preview, final CTA.
- `HomepageFeatures/styles.module.css` for feature cards.
- `custom.css` for global Docusaurus theme variables and optional common CSS variables.

### Step 5 — Improve config/metadata lightly

Update `docusaurus.config.ts` only for low-risk improvements:

- Ensure navbar and footer links point to useful docs.
- Add a clearer tagline if desired.
- Keep `onBrokenLinks` and `onBrokenMarkdownLinks` as `throw`.

### Step 6 — README cleanup

Update `website/README.md` with project-specific commands and validation expectations.

### Step 7 — Validate and fix

Run:

```bash
npm run typecheck
npm run build
```

Optionally run:

```bash
npm run serve
```

Manually check:

- `/stacktest/` home page.
- `/stacktest/docs/getting-started/what-is-stacktest`.
- Mobile width around 390px.
- Tablet width around 768px.
- Desktop width around 1440px.
- Dark and light mode.

### Step 8 — Commit

Make one focused commit:

```bash
git status
git add website
git commit -m "Modernize StackTest website home page"
```

Commit only after typecheck/build pass or clearly document why they cannot pass locally.

---

## 8. Acceptance Criteria

The implementation is done only when all of these are true:

- Home page no longer looks like a default Docusaurus starter page.
- Hero has clear value proposition, two CTAs, and a terminal/code preview.
- Page includes lifecycle, features, quick-start preview, report preview, and final CTA sections.
- No large empty dark gap exists before the footer.
- Existing docs navigation still works.
- Broken link checks still fail the build when links are invalid.
- `npm run typecheck` passes.
- `npm run build` passes.
- Mobile layout is readable with no horizontal scrolling.
- Dark mode and light mode are both readable.
- No heavy UI dependency was added without a clear reason.
- All changed files are committed in one focused commit.

---

## 9. Non-Goals

Do not implement these in this task:

- Full documentation rewrite.
- Blog system.
- Search integration changes.
- Analytics.
- Backend services.
- Authentication.
- Dynamic API reference generation.
- Custom Docusaurus swizzling unless absolutely necessary.
- Large package-manager changes across the monorepo.

---

## 10. Follow-Up Ideas After This Task

Create separate GitHub issues for:

1. Add docs search if not already enabled or if default search is insufficient.
2. Add generated API reference from TypeScript source when core packages stabilize.
3. Add screenshot-based visual regression for the website.
4. Add `docs/website-style-guide.md` so future agents keep the design consistent.
5. Add docs freshness checks that compare source-code changes with docs updates.
6. Add Open Graph/social preview image for the docs site.
7. Add a simple examples gallery once real examples exist.

---

## 11. Agent Prompt

Copy/paste this to the implementation agent:

```text
You are working in the public StackTest repo. Focus only on the Docusaurus website under `website/`.

Goal: modernize the StackTest home page so it looks like a credible, modern, minimal, enthusiastic developer-tool landing page while keeping the docs site fast, static, accessible, and maintainable.

Please follow `stacktest-website-homepage-modernization-plan.md` exactly.

Important constraints:
- Do not rewrite all docs in this task.
- Do not add heavy UI/animation/icon dependencies.
- Do not change unrelated repo code.
- Keep Docusaurus, TypeScript, and existing docs sidebar structure.
- Use semantic HTML and CSS modules.
- Avoid inline styles.
- Keep dark mode excellent and light mode readable.
- Run typecheck and build before committing.
- Commit all website changes in one focused commit: `Modernize StackTest website home page`.

Implementation expectations:
1. Review current `website/` source.
2. Run baseline validation.
3. Replace the current default-looking home page with a polished landing page containing:
   - Hero with clear value proposition, Get Started CTA, GitHub CTA, terminal preview.
   - Problem/promise strip.
   - How-it-works lifecycle: Plan, Deploy, Validate, Cleanup, Report.
   - Six feature cards.
   - Quick-start YAML preview.
   - Report preview card.
   - Final CTA.
4. Clean up starter-template leftovers only if confirmed unused.
5. Update website README with project-specific commands.
6. Run `npm run typecheck` and `npm run build` or the repo’s equivalent package-manager commands.
7. Show the changed files, commands run, validation result, and commit hash.
```
