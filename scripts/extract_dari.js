// @ts-nocheck
/* global require, process */
const fs = require('fs');
const path = require('path');

const BOOK_ID = 14414;

function cleanText(s = '') {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\bMBDa\s*\d+(?:\.\d+)?\s*Paragraph\b/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(s = '') {
  return String(s)
    .replace(/^\s*[-:]+\s*/, '')
    .replace(/\s*[-:]+\s*$/g, '')
    .replace(/\s*[—–-]\s*/g, ' — ')
    .replace(/[*]+.*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getToken() {
  const tok = await fetch('https://egwwritings.org/api/getToken').then((r) => r.json());
  return tok.access_token;
}

(async () => {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}` };

  const toc = await fetch(`https://a.egwwritings.org/content/books/${BOOK_ID}/toc`, { headers }).then((r) => r.json());
  const sections = toc
    .filter((t) => Number(t.level) === 1)
    .map((t) => ({
      title: normalizeTitle(t.title || ''),
      start: Number(String(t.para_id || '').split('.')[1]),
    }))
    .filter((s) => Number.isFinite(s.start) && s.title);

  if (!sections.length) throw new Error('No Dari TOC sections found');

  const blocks = [];
  for (const section of sections) {
    const url = `https://a.egwwritings.org/content/books/${BOOK_ID}/chapter/${section.start}`;
    const items = await fetch(url, { headers }).then((r) => r.json());
    if (!Array.isArray(items)) throw new Error(`Unexpected chapter payload for ${section.start}`);

    blocks.push(`@@CHAPTER@@ ${section.title}`);
    blocks.push('');

    for (const it of items) {
      const type = String(it.element_type || '').toLowerCase();
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
  const outPath = path.join(process.cwd(), 'public', 'book-content', 'txt', 'GC-Dari.txt');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`wrote ${outPath} | sections=${sections.length} | chars=${out.length}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
