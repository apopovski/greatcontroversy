(async () => {
  const fs = require('fs');
  const path = require('path');

  const BASE = 'https://greatcontroversy.pub';
  const bookRoot = `${BASE}/read/132`;

  // fetch helper (Node has global fetch in modern versions)
  async function fetchText(u) {
    const r = await fetch(u, { headers: { 'User-Agent': 'the-great-controversy-mapper/1.0 (+https://example.org)' } });
    if (!r.ok) throw new Error(`Fetch ${u} failed ${r.status}`);
    return await r.text();
  }

  console.log('Fetching book root', bookRoot);
  const rootHtml = await fetchText(bookRoot);

  // Some reader pages are not linked statically in the root HTML; probe numeric
  // /read/132.<id> pages until we discover all 42 chapter pages. Stop early
  // once all chapters 1..42 are found.
  const chapMap = {};
  const maxProbe = process.env.MAX_PROBE ? Number(process.env.MAX_PROBE) : (process.argv[2] ? Number(process.argv[2]) : 600);
  console.log('Probing individual reader pages to discover chapter URLs (may take a bit)');
  for (let pid = 1; pid <= maxProbe && Object.keys(chapMap).length < 42; pid++) {
    const url = `${BASE}/read/132.${pid}`;
    try {
      const page = await fetchText(url);
      // look for a chapter heading like "Chapter 1—" or "Chapter 1 —" or "Chapter 1 — Title"
      const chMatch = page.match(/Chapter\s*(\d{1,2})\s*[^\w\d\s]/i) || page.match(/<h\d[^>]*>\s*Chapter\s*(\d{1,2})/i);
      if (chMatch) {
        const num = Number(chMatch[1]);
        if (num >= 1 && num <= 42 && !chapMap[num]) {
          chapMap[num] = url;
          console.log(`Discovered chapter ${num} at ${url}`);
        }
      }
    } catch (e) {
      // ignore fetch errors / 404s
    }
    await new Promise((r) => setTimeout(r, 220));
  }

  // Ensure data dir exists
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const gcRe = /GC\s+[0-9IVXLCDMivxlcdm]+\.[0-9]+/g;
  const out = {};

  for (let i = 1; i <= 42; i++) {
    const url = chapMap[i];
    if (!url) {
      out[i] = [];
      console.log(`Chapter ${i}: no live URL found`);
      continue;
    }
    try {
      console.log(`Fetching chapter ${i} -> ${url}`);
      const h = await fetchText(url);
      const matches = h.match(gcRe) || [];
      const seen = new Set();
      const list = [];
      for (const s of matches) {
        const t = s.replace(/\s+/g, ' ').trim();
        if (!seen.has(t)) {
          seen.add(t);
          list.push(t);
        }
      }
      out[i] = list;
      console.log(`Chapter ${i}: ${list.length} markers`);
    } catch (e) {
      console.error(`Chapter ${i} fetch error:`, e.message || e);
      out[i] = [];
    }
    // be polite
    await new Promise((r) => setTimeout(r, 300));
  }

  const outPath = path.join(dataDir, 'gc-paragraph-map.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote mapping to', outPath);
})();
