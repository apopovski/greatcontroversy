// @ts-nocheck
/* global require, process */
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, 'public');
const outPath = path.join(publicDir, 'offline-precache.json');

// Keep this focused on reading content + app shell resources.
const INCLUDE_PREFIXES = [
  '/book-content/html/',
  '/book-content/txt/',
  '/book-content/htmlz/',
  '/book-content/ePub/',
  '/book-content/html-with-gc/',
];

const INCLUDE_EXACT = [
  '/',
  '/index.html',
  '/manifest.json',
  '/The-Great-Controversy.txt',
];

const EXCLUDE_FILE_BASENAMES = new Set(['.DS_Store']);

function walk(dir, acc) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, acc);
    } else if (entry.isFile()) {
      if (EXCLUDE_FILE_BASENAMES.has(entry.name)) continue;
      const rel = '/' + path.relative(publicDir, abs).split(path.sep).join('/');
      acc.push(rel);
    }
  }
}

function shouldInclude(relPath) {
  if (INCLUDE_EXACT.includes(relPath)) return true;
  return INCLUDE_PREFIXES.some((p) => relPath.startsWith(p));
}

(function main() {
  const all = [];
  walk(publicDir, all);

  const selected = all.filter(shouldInclude);
  const uniqueSorted = Array.from(new Set([...INCLUDE_EXACT, ...selected])).sort();

  const payload = {
    generatedAt: new Date().toISOString(),
    count: uniqueSorted.length,
    assets: uniqueSorted,
  };

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`wrote ${outPath} | assets=${payload.count}`);
})();
