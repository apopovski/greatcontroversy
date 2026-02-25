const fs = require('fs');
const path = require('path');

async function getToken() {
  const tok = await fetch('https://egwwritings.org/api/getToken').then((r) => r.json());
  return tok.access_token;
}

function cleanText(s = '') {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

(async () => {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const toc = await fetch('https://a.egwwritings.org/content/books/14085/toc', { headers }).then((r) => r.json());
  const chapters = toc.filter((x) => x.level === 2 && /^Поглавље/i.test(x.title || ''));

  const blocks = [];

  for (const ch of chapters) {
    const paraId = String(ch.para_id || '');
    const startNum = paraId.split('.')[1];
    const url = `https://a.egwwritings.org/content/books/14085/chapter/${startNum}`;
    const items = await fetch(url, { headers }).then((r) => r.json());

    const heading =
      items.find((it) => /^h[1-6]$/i.test(it.element_type || '') && /Поглавље/i.test(it.content || ''))
        ?.content || ch.title;

    blocks.push(cleanText(heading));
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
  const outPath = path.join(process.cwd(), 'public', 'book-content', 'txt', 'GC-Serbian.txt');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`wrote ${outPath} | chapters=${chapters.length} | chars=${out.length}`);
})();
