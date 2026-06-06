import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getPublishablePackages } from './npm-package-order.mjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const artifactsDir = path.resolve(workspaceRoot, '.artifacts/npm');
fs.mkdirSync(artifactsDir, { recursive: true });

console.log('Running npm-publish-ci.mjs...');

const packages = getPublishablePackages();
const published = [];
const skipped = [];

for (const pkg of packages) {
  const specifier = `${pkg.name}@${pkg.version}`;
  console.log(`\nChecking registry status for ${specifier}...`);
  
  let exists = false;
  try {
    const regVersion = execSync(`npm view "${specifier}" version`, { stdio: 'pipe' }).toString().trim();
    if (regVersion === pkg.version) {
      exists = true;
    }
  } catch (err) {
    exists = false;
  }

  if (exists) {
    console.log(`➡️ Skip: ${specifier} is already published.`);
    skipped.push(specifier);
    continue;
  }

  console.log(`📦 Version ${pkg.version} not found. Preparing to publish...`);
  
  const tarballName = pkg.name.replace(/^@/, '').replace(/\//g, '-') + '-' + pkg.version + '.tgz';
  const tarballPath = path.join(artifactsDir, tarballName);
  
  console.log(`Packing ${pkg.name} to ${tarballPath}...`);
  try {
    execSync(`pnpm pack --pack-destination "${artifactsDir}"`, { cwd: pkg.dir, stdio: 'pipe' });
    if (!fs.existsSync(tarballPath)) {
      throw new Error(`Expected tarball not found at ${tarballPath}`);
    }
  } catch (err) {
    console.error(`❌ Error packing ${pkg.name}:`, err.message);
    process.exit(1);
  }

  console.log(`Publishing ${pkg.name} from ${tarballPath}...`);
  try {
    execSync(`npm publish "${tarballPath}" --access public`, { stdio: 'inherit' });
    published.push(specifier);
  } catch (err) {
    console.error(`❌ Error publishing ${pkg.name}:`, err.message);
    process.exit(1);
  }
}

console.log('\n======================================');
console.log('Publish Summary:');
console.log(`Published (${published.length}):`);
for (const p of published) {
  console.log(`  - ${p}`);
}
console.log(`Skipped (${skipped.length}):`);
for (const s of skipped) {
  console.log(`  - ${s}`);
}
console.log('======================================');
