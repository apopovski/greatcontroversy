// @ts-nocheck
/* global require, process */
const fs = require('fs');
const path = require('path');

const BOOK_ID = 13973;

const SECTIONS = [
  { title: 'পাঠকের উদ্দেশে', start: 10 },
  { title: 'মুখবন্ধ:', start: 17 },
  { title: '১ম অধ্যায় - শয়তানের পতন', start: 36 },
  { title: '২য় অধ্যায় - মানবের পতন', start: 43 },
  { title: '৩য় অধ্যায় - পরিত্রাণ পরিকল্পনা', start: 51 },
  { title: '৪র্থ অধ্যায় - খৃষ্টের প্রথম আগমন', start: 66 },
  { title: '৫ম অধ্যায় - খৃষ্টের পরিচর্যা কার্য', start: 86 },
  { title: '৬ষ্ঠ অধ্যায় - রূপান্তর', start: 99 },
  { title: '৭ম অধ্যায় - খৃষ্টের সাথে বিশ্বাসঘাতকতা', start: 111 },
  { title: '৮ম অধ্যায় - খৃষ্টের বিচার', start: 125 },
  { title: '৯ম অধ্যায় - খৃষ্টের ক্রুশারোপ', start: 144 },
  { title: '১০ম অধ্যায় - খৃষ্টের পুনঃউত্থান', start: 162 },
  { title: '১১শ অধ্যায় - খৃষ্টের স্বর্গারোহণ', start: 188 },
  { title: '১২শ অধ্যায় - খৃষ্টের শিষ্যগণ', start: 194 },
  { title: '১৩শ অধ্যায় - স্তিফানের মৃত্যু', start: 209 },
  { title: '১৪শ অধ্যায় - শৌলের মনপরিবর্তন', start: 216 },
  { title: '১৫শ অধ্যায় - যিহূদীরা পৌলকে হত্যা করার সিদ্ধান্ত নেয়', start: 223 },
  { title: '১৬শ অধ্যায় - পৌল যিরূশালেম পরিদর্শন করেন', start: 235 },
  { title: '১৭শ অধ্যায় - মহা ধর্মভ্রষ্টতা', start: 248 },
  { title: '১৮শ অধ্যায় - অধৰ্ম্মের নিগূঢ়তত্ব', start: 259 },
  { title: '১৯শ অধ্যায় - দুর্দশায় অনন্ত জীবন নয়, মৃত্যু', start: 273 },
  { title: '২০ অধ্যায় - ধর্মসংস্কার', start: 288 },
  { title: '২১শ অধ্যায় - মন্ডলী ও জগৎ মিলিত হয়।', start: 298 },
  { title: '২২শ অধ্যায় - উইলিয়াম মিলার', start: 307 },
  { title: '২৩শ অধ্যায় - প্রথম দূতের বার্তা', start: 318 },
  { title: '২৪শ অধ্যায় - দ্বিতীয় দূতের বার্তা', start: 332 },
  { title: '২৫শ অধ্যায় - আগমনের আন্দোলন চিত্রিত হয়', start: 341 },
  { title: '২৬শ অধ্যায় - আরেকটি দৃষ্টান্ত', start: 355 },
  { title: '২৭শ অধ্যায় - ধর্মধাম', start: 367 },
  { title: '২৮শ অধ্যায় - তৃতীয় দূতের বার্তা', start: 376 },
  { title: '২৯শ অধ্যায় - এক দৃঢ় মঞ্চ', start: 388 },
  { title: '৩০শ অধ্যায় - প্রেততত্ব', start: 398 },
  { title: '৩১শ অধ্যায় - লোভ', start: 413 },
  { title: '৩২শ অধ্যায় - বিচলিত হওন', start: 422 },
  { title: '৩৩শ অধ্যায় - বাবিলের পাপরাশি', start: 439 },
  { title: '৩৪শ অধ্যায় - উচ্চ রব (ঘোষণা)', start: 449 },
  { title: '৩৫শ অধ্যায় - তৃতীয় বার্তাটির সমাপ্তি', start: 457 },
  { title: '৩৬শ অধ্যায় - যাকোবের সঙ্কট-সময়', start: 469 },
  { title: '৩৭শ অধ্যায় - ধার্মিকগণের উদ্ধার', start: 476 },
  { title: '৩৮শ অধ্যায় - সাধুগণের পুরস্কার', start: 488 },
  { title: '৩৯শ অধ্যায় - পৃথিবী জনশূন্য হয়', start: 493 },
  { title: '৪০শ অধ্যায় - দ্বিতীয় পুনঃউত্থান', start: 501 },
  { title: '৪১শ অধ্যায় - দ্বিতীয় মৃত্যু', start: 508 },
];

async function getToken() {
  const tok = await fetch('https://egwwritings.org/api/getToken').then((r) => r.json());
  return tok.access_token;
}

function cleanText(s = '') {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\bGCBen\s*\d+(?:\.\d+)?\s*Paragraph\b/gi, ' ')
    .replace(/\bGCBen\s*\.0\s*Paragraph\b/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(s = '') {
  return String(s)
    .replace(/^\s*[-:]+\s*/, '')
    .replace(/\s*[-:]+\s*$/g, '')
    .replace(/\s*[—–-]\s*/g, ' - ')
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
  const outPath = path.join(process.cwd(), 'public', 'book-content', 'txt', 'GC-Bengali.txt');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`wrote ${outPath} | sections=${SECTIONS.length} | chars=${out.length}`);
})();
