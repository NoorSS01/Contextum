import { rmSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const target = process.argv[2];

if (!target) {
  console.error('Usage: node scripts/clean-dir.mjs <relative-directory>');
  process.exit(1);
}

const cwd = process.cwd();
const resolvedTarget = resolve(cwd, target);
const relativeTarget = relative(cwd, resolvedTarget);

if (
  relativeTarget.startsWith('..') ||
  relativeTarget === '' ||
  relativeTarget.includes(':') ||
  target.includes('*')
) {
  console.error(`Refusing to clean unsafe path: ${target}`);
  process.exit(1);
}

rmSync(resolvedTarget, { recursive: true, force: true });
