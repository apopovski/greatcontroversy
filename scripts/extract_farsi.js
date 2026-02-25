// @ts-nocheck
/* global require, process */
const fs = require('fs');
const path = require('path');

async function getToken() {
  const tok = await fetch('https://egwwritings.org/api/getToken').then((r) => r.json());
  return tok.access_token;
}

function cleanText(s = '') {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\bNA\s+\d+(?:\.\d+)?\s+Paragraph\b/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

(async () => {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}` };

  const toc = await fetch('https://a.egwwritings.org/content/books/14426/toc', { headers }).then((r) => r.json());
  const sections = toc
    .filter((x) => x.level === 1)
    .map((x) => ({
      title: cleanText(x.title || ''),
      paraId: String(x.para_id || ''),
    }))
    .filter((x) => x.title && x.paraId.includes('.'));

  const blocks = [];

  for (const section of sections) {
    const startNum = section.paraId.split('.')[1];
    const url = `https://a.egwwritings.org/content/books/14426/chapter/${startNum}`;
    const items = await fetch(url, { headers }).then((r) => r.json());

    blocks.push(`@@CHAPTER@@ ${section.title}`);
    blocks.push('');

    for (const it of items) {
      const type = (it.element_type || '').toLowerCase();
      if (type === 'p' || type === 'blockquote') {
        const txt = cleanText(it.content || '');
        if (txt) {
          blocks.push(txt);
          blocks.push('');
        }
      }
    }
  }

  const out = blocks.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  const outPath = path.join(process.cwd(), 'public', 'book-content', 'txt', 'GC-Farsi.txt');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`wrote ${outPath} | sections=${sections.length} | chars=${out.length}`);
})();
