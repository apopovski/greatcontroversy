// @ts-nocheck
/**
 * Generate paragraph↔audio cue files (proportional-v1) for one or more languages.
 * Same JSON shape can later be replaced by Whisper/forced-alignment output.
 *
 * Usage:
 *   node scripts/generate_audio_alignments.js en
 *   node scripts/generate_audio_alignments.js he ml ur fa ksw
 *   node scripts/generate_audio_alignments.js --txt-priority
 *
 * Output: public/book-content/audio-alignments/{code}/chapter-{idx}.json
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, 'public/book-content/audio-alignments');
const INTRO_RATIO = 0.04;
const MIN_CHARS = 24;

/** Manifest code → chapter text source (@@CHAPTER@@ txt books). */
const TXT_LANGS = {
  he: 'public/book-content/txt/GC-Hebrew.txt',
  ml: 'public/book-content/txt/GC-Malayalam.txt',
  ur: 'public/book-content/txt/GC-Urdu.txt',
  fa: 'public/book-content/txt/GC-Farsi.txt',
  prs: 'public/book-content/txt/GC-Dari.txt',
  tr: 'public/book-content/txt/GC-Turkish.txt',
  mg: 'public/book-content/txt/GC-Malagasy.txt',
  lus: 'public/book-content/txt/GC-Mizo.txt',
  cnh: 'public/book-content/txt/GC-Hakha.txt',
  zo: 'public/book-content/txt/GC-Zomi.txt',
  nd: 'public/book-content/txt/GC-Ndebele.txt',
  ksw: 'public/book-content/txt/GC-SgawKaren.txt',
  hi: 'public/book-content/txt/GC-Hindi.txt',
  bn: 'public/book-content/txt/GC-Bengali.txt',
  sr: 'public/book-content/txt/GC-Serbian.txt',
  af: 'public/book-content/txt/GC-Afrikaans.txt',
};

const PRIORITY_TXT = ['he', 'ml', 'ur', 'fa', 'ksw'];

function decodeEntities(s = '') {
  return String(s)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripTags(s = '') {
  return decodeEntities(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function probeDuration(url) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', url],
    { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 },
  );
  const n = Number(String(out).trim());
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Bad duration for ${url}: ${out}`);
  return n;
}

function buildCues(paragraphs, duration, chapterIdx) {
  const usable = Math.max(0.5, duration * (1 - INTRO_RATIO));
  const lead = duration * INTRO_RATIO;
  const weights = paragraphs.map((text) => (text.length >= MIN_CHARS ? text.length : 0));
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  const chapterNumber = chapterIdx + 1;
  let cursor = lead;
  const cues = [];

  paragraphs.forEach((text, i) => {
    const weight = weights[i];
    const span = (weight / total) * usable;
    const start = Number(cursor.toFixed(3));
    const end = weight > 0 ? Number(Math.min(duration, cursor + span).toFixed(3)) : start;
    cues.push({
      id: `gc-p-${chapterNumber}-${i + 1}`,
      start,
      end: weight > 0 ? Math.max(end, start + 0.05) : start,
      chars: text.length,
    });
    cursor += span;
  });

  const lastSpoken = [...cues].reverse().find((c) => c.end > c.start);
  if (lastSpoken) lastSpoken.end = Number(duration.toFixed(3));
  return cues;
}

function loadTracks(code) {
  if (code === 'en') {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'public/book-content/audio-manifests/gc-english.json'), 'utf8'),
    );
    return (manifest.tracks || []).map((t) => ({
      chapterIdx: Number(t.chapterIdx),
      url: t.url,
      title: t.title || `Chapter ${t.chapterIdx}`,
    }));
  }
  const main = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'public/book-content/audio-manifests/gc-multilang.json'), 'utf8'),
  );
  const extra = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'public/book-content/audio-manifests/gc-multilang-extra.json'), 'utf8'),
  );
  const tracks = main[code] || extra[code];
  if (!Array.isArray(tracks) || !tracks.length) {
    throw new Error(`No audio tracks for language code "${code}"`);
  }
  return tracks.map((t) => ({
    chapterIdx: Number(t.chapterIdx),
    url: t.url,
    title: t.title || `Chapter ${t.chapterIdx}`,
  }));
}

function extractTocEn(html) {
  const navMatch = html.match(/<nav[^>]*type=["']toc["'][^>]*>([\s\S]*?)<\/nav>/i);
  if (!navMatch) throw new Error('TOC nav not found');
  const entries = [];
  const re = /<a\s+[^>]*href=["']#([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(navMatch[1]))) {
    const id = m[1];
    const title = stripTags(m[2]);
    if (!title) continue;
    if (/^\s*information\s+about.*book/i.test(title)) continue;
    if (/^\s*(?:preface|foreword)\b/i.test(title)) continue;
    if (/^[\[(]?\d{1,4}[\])]?\.?$/u.test(title)) continue;
    entries.push({ id, title });
  }
  const introIdx = entries.findIndex((e) => /\bintroduction\b/i.test(e.title));
  return introIdx >= 0 ? entries.slice(introIdx) : entries;
}

function extractChapterParagraphsEn(html, chapterId, nextChapterId) {
  const startToken = `id="${chapterId}"`;
  const start = html.indexOf(startToken);
  if (start < 0) throw new Error(`Chapter id not found: ${chapterId}`);
  const tagStart = html.lastIndexOf('<', start);
  let end = html.length;
  if (nextChapterId) {
    const nextToken = `id="${nextChapterId}"`;
    const nextPos = html.indexOf(nextToken, start + startToken.length);
    if (nextPos > start) {
      end = html.lastIndexOf('<', nextPos);
      if (end <= start) end = nextPos;
    }
  }
  const slice = html.slice(tagStart >= 0 ? tagStart : start, end);
  const paras = [];
  const pre = /<(p|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let pm;
  while ((pm = pre.exec(slice))) {
    paras.push(stripTags(pm[2]));
  }
  return paras;
}

/** Parse @@CHAPTER@@ books the same way BookReader paragraphizes them. */
function parseChapterMarkedSections(raw) {
  const lines = String(raw || '').replace(/\r\n?/g, '\n').split('\n');
  const chapterMarker = /^\s*@@CHAPTER@@\s*(.+?)\s*$/;
  const sections = [];
  let current = null;

  const push = () => {
    if (!current) return;
    sections.push(current);
    current = null;
  };

  for (const line of lines) {
    const trimmed = (line || '').trim();
    const match = trimmed.match(chapterMarker);
    if (match) {
      push();
      current = { title: (match[1] || '').trim(), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  push();

  return sections.map((sec) => {
    const paras = [];
    let buf = [];
    const flush = () => {
      const t = buf.join(' ').replace(/\s+/g, ' ').trim();
      if (t) paras.push(t);
      buf = [];
    };
    sec.lines.forEach((ln) => {
      const t = (ln || '').trim();
      if (!t) flush();
      else buf.push(t);
    });
    flush();
    return { title: sec.title, paragraphs: paras };
  });
}

async function generateEn() {
  const tracks = loadTracks('en');
  const htmlPath = path.join(
    ROOT,
    'public/book-content/html/The Great Controversy - Ellen G. White 2/index.html',
  );
  const html = fs.readFileSync(htmlPath, 'utf8');
  const toc = extractTocEn(html);
  const outDir = path.join(OUT_ROOT, 'en');
  fs.mkdirSync(outDir, { recursive: true });
  const index = [];

  for (const track of tracks) {
    const chapterIdx = track.chapterIdx;
    const tocEntry = toc[chapterIdx];
    if (!tocEntry) {
      console.warn(`[en] No TOC entry for chapterIdx=${chapterIdx}`);
      continue;
    }
    const next = toc[chapterIdx + 1];
    const paragraphs = extractChapterParagraphsEn(html, tocEntry.id, next?.id);
    process.stdout.write(`[en] ch ${chapterIdx}… `);
    const duration = probeDuration(track.url);
    const cues = buildCues(paragraphs, duration, chapterIdx);
    const payload = {
      version: 1,
      lang: 'en',
      chapterIdx,
      title: track.title,
      duration: Number(duration.toFixed(3)),
      method: 'proportional-v1',
      introRatio: INTRO_RATIO,
      sourceAudioUrl: track.url,
      cues,
    };
    fs.writeFileSync(path.join(outDir, `chapter-${chapterIdx}.json`), JSON.stringify(payload, null, 2) + '\n');
    index.push({ chapterIdx, file: `chapter-${chapterIdx}.json`, cues: cues.length, duration: payload.duration });
    console.log(`duration=${payload.duration.toFixed(1)}s cues=${cues.length}`);
  }

  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({ version: 1, lang: 'en', chapters: index }, null, 2) + '\n');
  console.log(`[en] wrote ${index.length} alignment files → ${outDir}`);
}

async function generateTxtLang(code) {
  const rel = TXT_LANGS[code];
  if (!rel) throw new Error(`No @@CHAPTER@@ text mapping for "${code}"`);
  const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const sections = parseChapterMarkedSections(raw);
  const tracks = loadTracks(code);
  const outDir = path.join(OUT_ROOT, code);
  fs.mkdirSync(outDir, { recursive: true });
  const index = [];

  for (const track of tracks) {
    const chapterIdx = track.chapterIdx;
    const section = sections[chapterIdx];
    if (!section) {
      console.warn(`[${code}] No text section for chapterIdx=${chapterIdx}`);
      continue;
    }
    process.stdout.write(`[${code}] ch ${chapterIdx} (${section.title.slice(0, 40)})… `);
    const duration = probeDuration(track.url);
    const cues = buildCues(section.paragraphs, duration, chapterIdx);
    const payload = {
      version: 1,
      lang: code,
      chapterIdx,
      title: section.title || track.title,
      duration: Number(duration.toFixed(3)),
      method: 'proportional-v1',
      introRatio: INTRO_RATIO,
      sourceAudioUrl: track.url,
      cues,
    };
    fs.writeFileSync(path.join(outDir, `chapter-${chapterIdx}.json`), JSON.stringify(payload, null, 2) + '\n');
    index.push({ chapterIdx, file: `chapter-${chapterIdx}.json`, cues: cues.length, duration: payload.duration });
    console.log(`duration=${payload.duration.toFixed(1)}s cues=${cues.length}`);
  }

  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({ version: 1, lang: code, chapters: index }, null, 2) + '\n');
  console.log(`[${code}] wrote ${index.length} alignment files → ${outDir}`);
}

(async () => {
  let args = process.argv.slice(2).filter(Boolean);
  if (!args.length || args.includes('--txt-priority')) {
    args = PRIORITY_TXT;
  }
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/generate_audio_alignments.js [en|he|ml|…] [--txt-priority]');
    process.exit(0);
  }

  for (const code of args) {
    const lang = String(code).trim().toLowerCase();
    if (lang === 'en') await generateEn();
    else if (TXT_LANGS[lang]) await generateTxtLang(lang);
    else throw new Error(`Unsupported language "${lang}". Known txt: ${Object.keys(TXT_LANGS).join(', ')}, plus en.`);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
