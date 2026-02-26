// @ts-nocheck
/* global require, process */
const fs = require('fs');
const path = require('path');

const BOOK_ID = 12876;

// Deterministic, user-validated section order from EGW Indonesian TOC.
// We intentionally skip "DAFTAR ISI" and keep KATA PENGANTAR + PENDAHULUAN.
const SECTIONS = [
  { title: 'KATA PENGANTAR', start: 7 },
  { title: 'PENDAHULUAN', start: 21 },
  { title: 'Bab 1—Keruntuhan Kota Yerusalem', start: 65 },
  { title: 'Bab 2—Penganiayaan pada Abad-abad Permulaan', start: 161 },
  { title: 'Bab 3—Zaman Kegelapan Rohani', start: 207 },
  { title: 'Bab 4—Orang-orang Waldensia', start: 264 },
  { title: 'Bab 5—John Wycliffe', start: 344 },
  { title: 'Bab 6—Huss dan Jerome', start: 431 },
  { title: 'Bab 7—Pemisahan Diri Luther dari Roma', start: 545 },
  { title: 'Bab 8—Luther di Hadapan Mahkamah', start: 668 },
  { title: 'Bab 9—Pembaru Swiss', start: 789 },
  { title: 'Bab 10—Kemajuan Pembaruan di Jerman', start: 855 },
  { title: 'Bab 11—Protes Para Pangeran', start: 919 },
  { title: 'Bab 12—Reformasi di Perancis', start: 986 },
  { title: 'Bab 13—Negeri Belanda dan Skandinavia', start: 1103 },
  { title: 'Bab 14—Para Pembaru Inggris yang Muncul Kemudian', start: 1143 },
  { title: 'Bab 15—Alkitab dan Revolusi Perancis', start: 1240 },
  { title: 'Bab 16—Bapa-bapa Musafir', start: 1351 },
  { title: 'Bab 17—Berita Kedatangan Kristus', start: 1399 },
  { title: 'Bab 18—Pembaru Amerika', start: 1489 },
  { title: 'Bab 19—Terang Menerobos Kegelapan', start: 1604 },
  { title: 'Bab 20—Kebangunan Keagamaan yang Besar', start: 1660 },
  { title: 'Bab 21—Amaran Ditolak', start: 1749 },
  { title: 'Bab 22—Nubuatan-nubuatan Digenapi', start: 1817 },
  { title: 'Bab 23—Apakah Bait Suci Itu?', start: 1898 },
  { title: 'Bab 24—Di Bilik yang Mahakudus', start: 1966 },
  { title: 'Bab 25—Hukum Allah yang Tidak Dapat Diubah', start: 2008 },
  { title: 'Bab 26—Pekerjaan Pembaruan', start: 2091 },
  { title: 'Bab 27—Kebangunan Rohani Modern', start: 2139 },
  { title: 'Bab 28—Pengadilan Pemeriksaan', start: 2227 },
  { title: 'Bab 29—Asai Mula Dosa', start: 2288 },
  { title: 'Bab 30—Permusuhan antara Manusia dan Setan', start: 2347 },
  { title: 'Bab 31—Agen Roh-roh Jahat', start: 2376 },
  { title: 'Bab 32—Jerat-jerat Setan', start: 2411 },
  { title: 'Bab 33—Penipuan Besar Pertama', start: 2477 },
  { title: 'Bab 34—Spiritisme', start: 2571 },
  { title: 'Bab 35—Tujuan Kepausan', start: 2623 },
  { title: 'Bab 36—Pertentangan yang Segera akan Terjadi', start: 2716 },
  { title: 'Bab 37—Alkitab Suatu Perlindungan', start: 2761 },
  { title: 'Bab 38—Amaran Terakhir', start: 2809 },
  { title: 'Bab 39—Waktu Kesesakan yang Besar', start: 2854 },
  { title: 'Bab 40—Umat Allah Dilepaskan', start: 2954 },
  { title: 'Bab 41—Dunia Sunyi Senyap', start: 3031 },
  { title: 'Bab 42—Pertikaian Berakhir', start: 3078 },
];

async function getToken() {
  const tok = await fetch('https://egwwritings.org/api/getToken').then((r) => r.json());
  return tok.access_token;
}

function cleanText(s = '') {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\b[A-Z][A-Za-z]{1,8}\s+\d+(?:\.\d+)?\s+Paragraph\b/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(s = '') {
  return String(s)
    .replace(/^\s*[-:]+\s*/, '')
    .replace(/\s*[-:]+\s*$/g, '')
    .replace(/\s*[—–-]\s*/g, '—')
    .replace(/[*]+.*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

(async () => {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}` };

  const blocks = [];

  for (const section of SECTIONS) {
    const url = `https://a.egwwritings.org/content/books/${BOOK_ID}/chapter/${section.start}`;
    const items = await fetch(url, { headers }).then((r) => r.json());

    blocks.push(`@@CHAPTER@@ ${normalizeTitle(section.title)}`);
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
  const outPath = path.join(process.cwd(), 'public', 'book-content', 'txt', 'GC-Indonesian.txt');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`wrote ${outPath} | sections=${SECTIONS.length} | chars=${out.length}`);
})();
