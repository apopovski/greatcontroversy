// @ts-nocheck
const fs = require('fs');
const path = require('path');

const BOOKS = [
  { code: 'mg', bookId: 12537, out: 'GC-Malagasy.txt' },
  { code: 'lus', bookId: 14343, out: 'GC-Mizo.txt' },
  { code: 'cnh', bookId: 14337, out: 'GC-Hakha.txt' },
  { code: 'zo', bookId: 14342, out: 'GC-Zomi.txt' },
  { code: 'nd', bookId: 14656, out: 'GC-Ndebele.txt' },
  { code: 'ksw', bookId: 14354, out: 'GC-SgawKaren.txt' },
];

function cleanText(s = '') {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\b(?:HM|IR|DL|KL|IEP|GCsk|AK)\s*\d+[A-Za-z]?(?:\.\d+)?\s*Paragraph\b/gi, ' ')
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
  for (const book of BOOKS) {
    const toc = await fetch(`https://a.egwwritings.org/content/books/${book.bookId}/toc`, { headers }).then((r) => r.json());
    const sections = toc
      .filter((t) => Number(t.level) === 1)
      .map((t) => ({
        title: normalizeTitle(t.title || ''),
        start: Number(String(t.para_id || '').split('.')[1]),
      }))
      .filter((s) => Number.isFinite(s.start) && s.title);
    const blocks = [];
    for (const section of sections) {
      const items = await fetch(`https://a.egwwritings.org/content/books/${book.bookId}/chapter/${section.start}`, { headers }).then((r) => r.json());
      blocks.push(`@@CHAPTER@@ ${section.title}`, '');
      for (const it of items) {
        const type = String(it.element_type || '').toLowerCase();
        if (type === 'p' || type === 'blockquote') {
          const txt = cleanText(it.content || '');
          if (txt) blocks.push(txt, '');
        }
      }
    }
    const out = blocks.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    const outPath = path.join(process.cwd(), 'public', 'book-content', 'txt', book.out);
    fs.writeFileSync(outPath, out, 'utf8');
    console.log(`wrote ${book.out} sections=${sections.length} chars=${out.length}`);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
