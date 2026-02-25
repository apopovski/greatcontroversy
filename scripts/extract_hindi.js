// @ts-nocheck
/* global require, process */
const fs = require('fs');
const path = require('path');

const BOOK_ID = 13971;

const SECTIONS = [
  { title: 'सम्पादकीय', start: 11 },
  { title: 'भूमिका', start: 19 },
  { title: 'पाठ 1 - शैतान का, पाप में गिरना', start: 33 },
  { title: 'पाठ 2 - मनुष्य का पतन', start: 44 },
  { title: 'पाठ 3 - उद्धार की योजना', start: 53 },
  { title: 'पाठ 4 - ख्रीस्त-यीशु का पहला आगमन', start: 72 },
  { title: 'पाठ 5 - यीशु की सेवकाई', start: 98 },
  { title: 'पाठ 6 - यीशु का बदला हुआ रूप', start: 114 },
  { title: 'पाठ 7 - ख्रीस्त का पकड़वाया जाना', start: 131 },
  { title: 'पाठ 8 - यीशु का न्याय होता है।', start: 146 },
  { title: 'पाठ 9 - ख्रीस्त का क्रूसघात', start: 175 },
  { title: 'पाठ 10 - ख्रीस्त का पुनरुज्जीवन', start: 201 },
  { title: 'पाठ 11 - ख्रीस्त का स्वर्गारोहण', start: 236 },
  { title: 'पाठ 12 - ख्रीस्त के चेले', start: 243 },
  { title: 'पाठ 13 - स्तिफनुस की मृत्यु', start: 264 },
  { title: 'पाठ 14 - साऊल का मन परिवर्तन', start: 276 },
  { title: 'पाठ 15 - यहूदियों ने पौलुस को मार डालने का निर्णय किया', start: 287 },
  { title: 'पाठ 16 - पौलुस यरूशलेम जाता है', start: 302 },
  { title: 'पाठ 17 - महान धर्मपतन', start: 318 },
  { title: 'पाठ 18 - पाप का रहस्य', start: 334 },
  { title: 'पाठ 19 - मृत्यु अनन्त काल तक का दुःखमय जीवन नहीं', start: 354 },
  { title: 'पाठ 20 - धर्म सुधार', start: 377 },
  { title: 'पाठ 21 - मण्डली और दुनिया में एकता होती है', start: 392 },
  { title: 'पाठ 22 - विलियम मिल्लर', start: 405 },
  { title: 'पाठ 23 - पहिला दूत के समाचार', start: 420 },
  { title: 'पाठ 24 - दूसरा दूत के समाचार', start: 444 },
  { title: 'पाठ 25 - आगमन के आन्दोलन का उदाहरण', start: 455 },
  { title: 'पाठ 26 - दूसरा उदाहरण', start: 476 },
  { title: 'पाठ 27 - पवित्र स्थान', start: 499 },
  { title: 'पाठ 28 - तीसरे दूत के समाचार', start: 514 },
  { title: 'पाठ 29 - एक मजबूत बेदी', start: 537 },
  { title: 'पाठ 30 - प्रेतवाद', start: 552 },
  { title: 'पाठ 31 - लालच', start: 576 },
  { title: 'पाठ 32 - डगमगाहट', start: 591 },
  { title: 'पाठ 33 - बाबुल के पाप', start: 614 },
  { title: 'पाठ 34 - जोरों की पुकार', start: 627 },
  { title: 'पाठ 35 - तीसरा दूत के समाचार बन्द हुए', start: 637 },
  { title: 'पाठ 36 - याकूब की विपत्ति का समय', start: 653 },
  { title: 'पाठ 37 - सन्तों को छुटकारा मिला', start: 665 },
  { title: 'पाठ 38 - सन्तों को पुरस्कार मिलता है', start: 680 },
  { title: 'पाठ 39 - पृथ्वी उजाड़ की दशा में', start: 686 },
  { title: 'पाठ 40 - दूसरा पुनरुत्थान', start: 698 },
  { title: 'पाठ 41 - दूसरी मृत्यु', start: 708 },
];

async function getToken() {
  const tok = await fetch('https://egwwritings.org/api/getToken').then((r) => r.json());
  return tok.access_token;
}

function cleanText(s = '') {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\bGCH\s*\d+(?:\.\d+)?\s*Paragraph\b/gi, ' ')
    .replace(/\bGCH\s*\.0\s*Paragraph\b/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(s = '') {
  return String(s)
    .replace(/^\s*[-:]+\s*/, '')
    .replace(/\s*[-:]+\s*$/g, '')
    .replace(/^\s*पाठ\s*([०-९0-9]+)\s*[-—–:]?\s*/u, 'पाठ $1 - ')
    .replace(/^\s*पाठ\s*([०-९0-9]+)\s*-\s*/u, 'पाठ $1 - ')
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
  const outPath = path.join(process.cwd(), 'public', 'book-content', 'txt', 'GC-Hindi.txt');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`wrote ${outPath} | sections=${SECTIONS.length} | chars=${out.length}`);
})();
