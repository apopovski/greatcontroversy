const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OG_DIR = path.join(ROOT, 'public', 'og');
const OG_IMAGES_DIR = path.join(OG_DIR, 'images');
const BASE_IMAGE = process.env.OG_BASE_IMAGE
  ? path.resolve(process.env.OG_BASE_IMAGE)
  : path.join(ROOT, 'public', 'GC-splash.png');

const WIDTH = 1200;
const HEIGHT = 630;
const TITLE_SPLIT_DASH = /\s+[—–-]\s+/;
const TITLE_VERTICAL_OFFSET = 34;

function escapeXml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function deriveBookTitle(ogTitle) {
  const full = (ogTitle || '').trim();
  if (!full) return 'The Great Controversy';
  const parts = full.split(TITLE_SPLIT_DASH);
  return (parts[0] || full).trim();
}

function splitTitleLines(title) {
  const t = (title || '').trim();
  if (!t) return ['The Great Controversy'];

  const hasCjk = /[\u3400-\u9fff]/u.test(t);
  const maxChars = hasCjk ? 10 : 24;
  const maxLines = 3;

  if (!/\s/u.test(t)) {
    const lines = [];
    for (let i = 0; i < t.length; i += maxChars) {
      lines.push(t.slice(i, i + maxChars));
      if (lines.length === maxLines) break;
    }
    return lines;
  }

  const words = t.split(/\s+/u).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) break;
  }

  if (current && lines.length < maxLines) lines.push(current);

  const consumedWords = lines.join(' ').split(/\s+/u).length;
  if (consumedWords < words.length) {
    const remaining = words.slice(consumedWords).join(' ');
    const last = lines[lines.length - 1] || '';
    lines[lines.length - 1] = `${last} ${remaining}`.trim();
  }

  return lines.slice(0, maxLines);
}

function getFontSize(lines) {
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const size = Math.round(78 - Math.max(0, longest - 14) * 1.7);
  return Math.max(42, Math.min(78, size));
}

function estimateLineWidthPx(line, fontSize) {
  const text = String(line || '');
  const cjkChars = (text.match(/[\u3400-\u9fff]/gu) || []).length;
  const latinChars = (text.match(/[A-Za-z\u00C0-\u024F]/g) || []).length;
  const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/gu) || []).length;
  const cyrillicChars = (text.match(/[\u0400-\u04FF]/gu) || []).length;
  const spaces = (text.match(/\s/g) || []).length;

  const fallbackChars = Math.max(0, text.length - cjkChars - latinChars - arabicChars - cyrillicChars - spaces);

  const emWidth =
    cjkChars * 0.98 +
    latinChars * 0.57 +
    arabicChars * 0.72 +
    cyrillicChars * 0.62 +
    spaces * 0.32 +
    fallbackChars * 0.62;

  return Math.round(emWidth * fontSize);
}

function createTextOverlaySvg(title) {
  const lines = splitTitleLines(title);
  const fontSize = getFontSize(lines);
  const lineHeight = Math.round(fontSize * 1.24);
  const blockHeight = lineHeight * lines.length;
  const startY = Math.round((HEIGHT - blockHeight) / 2 + fontSize * 0.86 + TITLE_VERTICAL_OFFSET);
  const maxLineWidth = lines.reduce((m, l) => Math.max(m, estimateLineWidthPx(l, fontSize)), 0);

  const panelPaddingX = Math.round(Math.max(44, fontSize * 0.95));
  const panelPaddingY = Math.round(Math.max(26, fontSize * 0.52));
  const panelWidth = Math.min(1020, Math.max(360, maxLineWidth + panelPaddingX * 2));
  const panelHeight = Math.min(420, Math.max(120, blockHeight + panelPaddingY * 2));
  const panelX = Math.round((WIDTH - panelWidth) / 2);
  const panelY = Math.round((HEIGHT - panelHeight) / 2 + TITLE_VERTICAL_OFFSET);
  const panelRadius = Math.round(Math.min(36, Math.max(18, fontSize * 0.38)));

  const tspans = lines
    .map((line, i) => `<tspan x="600" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#ffffff" flood-opacity="0.9" />
    </filter>
    <filter id="panelShadow" x="-20%" y="-30%" width="140%" height="180%">
      <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000000" flood-opacity="0.18" />
    </filter>
  </defs>
  <rect
    x="${panelX}"
    y="${panelY}"
    width="${panelWidth}"
    height="${panelHeight}"
    rx="${panelRadius}"
    ry="${panelRadius}"
    fill="#ffffff"
    fill-opacity="0.88"
    filter="url(#panelShadow)"
  />
  <text
    x="600"
    y="${startY}"
    text-anchor="middle"
    font-family="Noto Sans, Noto Sans Arabic, Noto Sans CJK SC, Arial Unicode MS, Segoe UI, Helvetica Neue, Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    letter-spacing="0.4"
    fill="#1f1f1f"
    filter="url(#softShadow)"
  >${tspans}</text>
</svg>`.trim();
}

function setOrInsertMeta(html, attrName, attrValue, contentValue) {
  const tagRe = new RegExp(`<meta\\s+${attrName}="${attrValue}"\\s+content="[^"]*"\\s*\\/?\\s*>`, 'i');
  const nextTag = `<meta ${attrName}="${attrValue}" content="${contentValue}" />`;
  if (tagRe.test(html)) return html.replace(tagRe, nextTag);
  return html.replace(/<\/head>/i, `  ${nextTag}\n</head>`);
}

async function updateOgHtmlImageRefs(code, absoluteImageUrl) {
  const htmlPath = path.join(OG_DIR, `${code}.html`);
  let html = await fs.readFile(htmlPath, 'utf8');

  html = setOrInsertMeta(html, 'property', 'og:image', absoluteImageUrl);
  html = setOrInsertMeta(html, 'name', 'twitter:image', absoluteImageUrl);

  await fs.writeFile(htmlPath, html, 'utf8');
}

async function generateLanguageImage(code, bookTitle) {
  const outPath = path.join(OG_IMAGES_DIR, `${code}.jpg`);
  const overlay = Buffer.from(createTextOverlaySvg(bookTitle));

  await sharp(BASE_IMAGE)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'center' })
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(outPath);

  return outPath;
}

async function run() {
  await fs.mkdir(OG_IMAGES_DIR, { recursive: true });

  const all = await fs.readdir(OG_DIR);
  const htmlFiles = all.filter((n) => /^[a-z]{2}\.html$/i.test(n));

  if (!htmlFiles.length) {
    throw new Error('No language OG HTML files found in public/og.');
  }

  for (const file of htmlFiles) {
    const code = file.replace(/\.html$/i, '').toLowerCase();
    const htmlPath = path.join(OG_DIR, file);
    const html = await fs.readFile(htmlPath, 'utf8');

    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"\s*\/?>/i);
    const ogTitle = ogTitleMatch?.[1] || '';
    const bookTitle = deriveBookTitle(ogTitle);

    await generateLanguageImage(code, bookTitle);

    const absoluteUrl = `https://greatcontroversy.vercel.app/og/images/${code}.jpg`;
    await updateOgHtmlImageRefs(code, absoluteUrl);

    console.log(`✓ ${code} -> ${bookTitle}`);
  }

  console.log(`\nDone. Generated localized OG images in: ${path.relative(ROOT, OG_IMAGES_DIR)}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
