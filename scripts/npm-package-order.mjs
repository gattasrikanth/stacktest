import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const packagesDir = path.join(workspaceRoot, 'packages');

export function getPublishablePackages() {
  const packageDirs = fs.readdirSync(packagesDir).filter(name => {
    const stat = fs.statSync(path.join(packagesDir, name));
    return stat.isDirectory() && fs.existsSync(path.join(packagesDir, name, 'package.json'));
  });

  const packages = packageDirs.map(name => {
    const dir = path.join(packagesDir, name);
    const pkgJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    return {
      name: pkgJson.name,
      version: pkgJson.version,
      dir,
      private: pkgJson.private || false,
      dependencies: Object.keys(pkgJson.dependencies || {}).filter(dep => dep.startsWith('@stack-test/'))
    };
  }).filter(pkg => !pkg.private);

  // Topological sort
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(pkg) {
    if (visited.has(pkg.name)) return;
    if (visiting.has(pkg.name)) {
      throw new Error(`Circular dependency detected: ${pkg.name}`);
    }
    visiting.add(pkg.name);

    for (const depName of pkg.dependencies) {
      const depPkg = packages.find(p => p.name === depName);
      if (depPkg) {
        visit(depPkg);
      }
    }

    visiting.delete(pkg.name);
    visited.add(pkg.name);
    sorted.push(pkg);
  }

  for (const pkg of packages) {
    visit(pkg);
  }

  return sorted;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const sorted = getPublishablePackages();
    console.log(sorted.map(pkg => pkg.name).join('\n'));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
