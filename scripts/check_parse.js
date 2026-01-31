const fs = require('fs');
const esbuild = require('esbuild');
const s = fs.readFileSync('src/BookReader.tsx','utf8');
const lines = s.split('\n');
for (let n = 50; n <= lines.length; n += 10) {
  const chunk = lines.slice(0, n).join('\n');
  try {
    esbuild.transformSync(chunk, { loader: 'tsx', jsx: 'automatic' });
    console.log('OK up to line', n);
  } catch (e) {
    console.error('FAIL at line', n, e.message);
    process.exit(0);
  }
}
console.log('All chunks OK');
