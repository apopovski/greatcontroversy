// @ts-nocheck
/**
 * Generate English paragraph↔audio cue files (proportional-v1).
 * Same JSON shape can later be replaced by Whisper/forced-alignment output.
 *
 * Output: public/book-content/audio-alignments/en/chapter-{idx}.json
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, 'public/book-content/audio-manifests/gc-english.json');
const HTML_PATH = path.join(
  ROOT,
  'public/book-content/html/The Great Controversy - Ellen G. White 2/index.html',
);
const OUT_DIR = path.join(ROOT, 'public/book-content/audio-alignments/en');
const INTRO_RATIO = 0.04;
const MIN_CHARS = 24; // body weight threshold; short nodes still get IDs (match addParagraphIds)

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

function extractToc(html) {
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

function extractChapterParagraphs(html, chapterId, nextChapterId) {
  const startToken = `id="${chapterId}"`;
  const start = html.indexOf(startToken);
  if (start < 0) throw new Error(`Chapter id not found: ${chapterId}`);
  // Walk back to containing tag start for safer slice
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
    // Keep every block (including short/empty) so IDs match runtime addParagraphIds order.
    paras.push(stripTags(pm[2]));
  }
  return paras;
}

function buildCues(paragraphs, duration, chapterIdx) {
  const usable = Math.max(0.5, duration * (1 - INTRO_RATIO));
  const lead = duration * INTRO_RATIO;
  const weights = paragraphs.map((text) => (text.length >= MIN_CHARS ? text.length : 0));
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  const chapterNumber = chapterIdx + 1; // matches addParagraphIds()
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

(async () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const tracks = manifest.tracks || [];
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const toc = extractToc(html);

  if (toc.length < tracks.length) {
    console.warn(`TOC chapters (${toc.length}) < audio tracks (${tracks.length})`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = [];

  for (const track of tracks) {
    const chapterIdx = Number(track.chapterIdx);
    const tocEntry = toc[chapterIdx];
    if (!tocEntry) {
      console.warn(`No TOC entry for audio chapterIdx=${chapterIdx} (${track.title})`);
      continue;
    }
    const next = toc[chapterIdx + 1];
    const paragraphs = extractChapterParagraphs(html, tocEntry.id, next?.id);
    process.stdout.write(`ch ${chapterIdx} ${track.title}… `);
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
    const outFile = path.join(OUT_DIR, `chapter-${chapterIdx}.json`);
    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n');
    index.push({
      chapterIdx,
      file: `chapter-${chapterIdx}.json`,
      cues: cues.length,
      duration: payload.duration,
    });
    console.log(`duration=${payload.duration.toFixed(1)}s cues=${cues.length}`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify({ version: 1, lang: 'en', chapters: index }, null, 2) + '\n');
  console.log(`wrote ${index.length} alignment files → ${OUT_DIR}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
