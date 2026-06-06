import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getPublishablePackages } from './npm-package-order.mjs';

console.log('Starting npm pack dry-run checks...');

let failed = false;
const packages = getPublishablePackages();

for (const pkg of packages) {
  console.log(`\nChecking package: ${pkg.name}...`);
  
  // 1. Confirm dist directory exists
  const distDir = path.join(pkg.dir, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error(`❌ Error: dist/ directory does not exist for ${pkg.name}. Run 'pnpm build' first.`);
    failed = true;
    continue;
  }

  // 2. Run npm pack dry-run
  let output;
  try {
    output = execSync('npm pack --dry-run --json', { cwd: pkg.dir, stdio: 'pipe' }).toString();
  } catch (err) {
    console.error(`❌ Error: 'npm pack --dry-run' failed for ${pkg.name}:`, err.message);
    failed = true;
    continue;
  }

  let packInfo;
  try {
    packInfo = JSON.parse(output)[0];
  } catch (err) {
    console.error(`❌ Error: Failed to parse pack dry-run JSON for ${pkg.name}:`, err.message);
    failed = true;
    continue;
  }

  const files = packInfo.files.map(f => f.path);
  console.log(`Files to be published for ${pkg.name} (${files.length} files):`);
  for (const file of files) {
    console.log(`  - ${file}`);
  }

  // 3. Check for mandatory files
  const requiredFiles = ['README.md', 'LICENSE'];
  for (const req of requiredFiles) {
    if (!files.includes(req)) {
      console.error(`❌ Error: Mandatory file '${req}' is missing from the package.`);
      failed = true;
    }
  }

  const hasDistJs = files.some(f => f.startsWith('dist/') && (f.endsWith('.js') || f.endsWith('.mjs')));
  const hasDistDts = files.some(f => f.startsWith('dist/') && (f.endsWith('.d.ts') || f.endsWith('.d.mts')));
  if (!hasDistJs) {
    console.error(`❌ Error: Missing build artifacts (.js or .mjs) in dist/ directory.`);
    failed = true;
  }
  if (!hasDistDts) {
    console.error(`❌ Error: Missing type declarations (.d.ts or .d.mts) in dist/ directory.`);
    failed = true;
  }

  // 4. Check for unwanted files
  const unwantedPatterns = [
    /^src\//,
    /node_modules/,
    /\.env/,
    /test/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.map$/
  ];

  for (const file of files) {
    for (const pattern of unwantedPatterns) {
      if (pattern.test(file)) {
        console.error(`❌ Error: Unwanted file '${file}' is included in the package package.`);
        failed = true;
      }
    }
  }
}

if (failed) {
  console.error('\n❌ Dry-run check failed! Please fix the errors listed above.');
  process.exit(1);
} else {
  console.log('\n✅ Dry-run check completed successfully! All packages are clean.');
}
