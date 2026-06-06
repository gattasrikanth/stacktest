const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generating CLI documentation...');
let usageStr = '';
try {
  execSync('node packages/cli/dist/index.js', { stdio: 'pipe' });
} catch (err) {
  usageStr = err.stdout ? err.stdout.toString() : err.stderr.toString();
}

const cliDocsContent = `# CLI Command Reference

The command-line interface exposes operations for validation, matrix planning, test execution, and cleanup.

## Usage

\`\`\`text
${usageStr.trim()}
\`\`\`

---

## Detailed Commands

### Version Query
Check the active version of your installed StackTest installation:
\`\`\`bash
npx stacktest --version
# or
npx stacktest -v
\`\`\`

### Linting Configurations (\`lint\`)
Validates the structure of \`stacktest.yaml\` and confirms referenced templates exist on disk.
\`\`\`bash
npx stacktest lint [--config <path>]
\`\`\`

### Plan Matrix (\`plan\`)
Prints the expanded deployment steps, including dynamic variable resolutions, without running any live requests.
\`\`\`bash
npx stacktest plan [--config <path>] [--json]
\`\`\`

### Run Tests (\`run\`)
Launches the test suite deployments.
\`\`\`bash
npx stacktest run [--config <path>] [--provider <name>] [--skip-cleanup] [--retain-on-failure] [--concurrency <num>]
\`\`\`
- \`--provider fake\`: Runs mock local deployments without hitting real clouds.
- \`--skip-cleanup\`: Prevents automatic teardown of stacks after execution.
- \`--retain-on-failure\`: Keeps only failed stacks active for manual debugging.
- \`--concurrency <num>\`: Sets the parallel deployment limit (defaults to 1).
`;

fs.writeFileSync(path.resolve(__dirname, '../website/docs/cli/reference.md'), cliDocsContent, 'utf8');
console.log('✓ CLI docs generated.');

console.log('Generating Configuration Schema documentation...');
const schemaDocsContent = `# Configuration Schema Reference

StackTest configurations are defined in \`stacktest.yaml\`. The file uses a structured layout validated by Zod models in the core engine.

---

## 1. Project Configuration (\`project\`)
Defines the namespace for the test execution.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| \`name\` | \`string\` | Yes | Unique project name. Must be lowercase, alphanumeric with hyphens, and start with a letter. Maximum 30 characters. |

---

## 2. Providers Configuration (\`providers\`)
A dictionary mapping provider identifiers (like \`aws-cloudformation\`) to settings.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| \`regions\` | \`string[]\` | No | List of deployment target environments (e.g. AWS regions). |

---

## 3. Tests Configuration (\`tests\`)
A dictionary mapping suite names to configurations.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| \`provider\` | \`string\` | No | Default provider name if not using sequential stages. |
| \`template\` | \`string\` | No | Default path to the IaC template file. |
| \`parameters\`| \`Record<string, any>\` | No | Default parameter values passed during creation. |
| \`stages\` | \`TestStageConfig[]\` | No | Array of sequential multi-provider stages. |
| \`regions\` | \`string[] / RegionConfig[]\` | No | Custom list of target regions to override default providers. |
`;

fs.writeFileSync(path.resolve(__dirname, '../website/docs/schema/stacktest-yml.md'), schemaDocsContent, 'utf8');
console.log('✓ Config schema docs generated.');

console.log('Running TypeDoc for programmatic API docs...');
try {
  execSync('npx typedoc --plugin typedoc-plugin-markdown --out website/docs/api packages/core/src/index.ts --name "@stacktest/core" --tsconfig packages/core/tsconfig.json --disableSources true --readme none --skipErrorChecking', { stdio: 'inherit' });
  console.log('✓ Programmatic API docs generated.');
} catch (err) {
  console.error('Failed to run TypeDoc:', err.message);
  process.exit(1);
}

console.log('All documentation generated successfully!');
