import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getPublishablePackages } from './npm-package-order.mjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

console.log('Running npm-publish-local.mjs...');

// 1. Check git status is clean
const gitStatus = execSync('git status --porcelain', { cwd: workspaceRoot }).toString().trim();
if (gitStatus) {
  console.error('❌ Error: Git working tree is dirty. Commit or stash changes before publishing.');
  process.exit(1);
}

// 2. Check branch is main (unless --allow-non-main)
const branch = execSync('git branch --show-current', { cwd: workspaceRoot }).toString().trim();
const allowNonMain = process.argv.includes('--allow-non-main');
if (branch !== 'main' && !allowNonMain) {
  console.error(`❌ Error: Current branch is '${branch}'. Publishing is restricted to 'main' branch unless '--allow-non-main' is passed.`);
  process.exit(1);
}

// 3. Confirm npm whoami succeeds
try {
  const npmUser = execSync('npm whoami', { stdio: 'pipe' }).toString().trim();
  console.log(`Logged into npm as: ${npmUser}`);
} catch (err) {
  console.error("❌ Error: Not logged in to npm. Run 'npm login' first.");
  process.exit(1);
}

// 4. Confirm no legacy @stacktest/ references exist in dependencies
const packages = getPublishablePackages();
for (const pkg of packages) {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(pkg.dir, 'package.json'), 'utf8'));
  const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
  for (const dep of Object.keys(deps)) {
    if (dep.startsWith('@stacktest/')) {
      console.error(`❌ Error: Found legacy reference '${dep}' in package.json at ${pkg.name}.`);
      process.exit(1);
    }
  }
}

// 5. Pack each package into .artifacts/npm/
const artifactsDir = path.resolve(workspaceRoot, '.artifacts/npm');
fs.mkdirSync(artifactsDir, { recursive: true });

console.log('\nPacking packages...');
const tarballs = [];
for (const pkg of packages) {
  const tarballName = pkg.name.replace(/^@/, '').replace(/\//g, '-') + '-' + pkg.version + '.tgz';
  const tarballPath = path.join(artifactsDir, tarballName);
  
  console.log(`Packing ${pkg.name} to ${tarballPath}...`);
  try {
    execSync(`pnpm pack --pack-destination "${artifactsDir}"`, { cwd: pkg.dir, stdio: 'pipe' });
    if (!fs.existsSync(tarballPath)) {
      throw new Error(`Expected tarball not found at ${tarballPath}`);
    }
    tarballs.push({ pkg, tarballPath });
  } catch (err) {
    console.error(`❌ Error packing ${pkg.name}:`, err.message);
    process.exit(1);
  }
}

// 6. Publish tarballs in dependency order
console.log('\nPublishing packages...');
for (const item of tarballs) {
  console.log(`Publishing ${item.pkg.name} from ${item.tarballPath}...`);
  try {
    execSync(`npm publish "${item.tarballPath}" --access public`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Error publishing ${item.pkg.name}:`, err.message);
    process.exit(1);
  }
}

console.log('\n✅ Local publish completed successfully!');
console.log('Post-publish verification commands:');
console.log('  npm view @stack-test/cli version');
