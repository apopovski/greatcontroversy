#!/usr/bin/env node
(async () => {
  const fs = require('fs');
  const path = require('path');

  const repoRoot = path.join(__dirname, '..');
  const htmlRoot = path.join(repoRoot, 'public', 'book-content', 'html');
  const outRoot = path.join(repoRoot, 'public', 'book-content', 'html-with-gc');
  const mapPath = path.join(repoRoot, 'data', 'gc-paragraph-map.json');

  if (!fs.existsSync(mapPath)) {
    console.error('Mapping not found at', mapPath);
    process.exit(1);
  }
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

  if (!fs.existsSync(outRoot)) fs.mkdirSync(outRoot, { recursive: true });

  const folders = fs.readdirSync(htmlRoot).filter((n) => {
    const p = path.join(htmlRoot, n);
    return fs.statSync(p).isDirectory();
  });

  console.log('Found', folders.length, 'language folders to process');

  for (const folder of folders) {
    const srcIndex = path.join(htmlRoot, folder, 'index.html');
    if (!fs.existsSync(srcIndex)) {
      // skip non-standard folders
      continue;
    }
    console.log('Processing', folder);
    const html = fs.readFileSync(srcIndex, 'utf8');

    // find TOC anchors for chapters 1..42
    const tocMatches = html.matchAll(/<nav[^>]*type="toc"[\s\S]*?<ol[\s\S]*?>([\s\S]*?)<\/ol>/ig);
    let tocHtml = null;
    for (const m of tocMatches) tocHtml = m[1];
    if (!tocHtml) {
      console.warn('No TOC found in', srcIndex);
      continue;
    }

    const idRe = /<a[^>]*href\s*=\s*"#([^"']+)"[^>]*>\s*Chapter\s*([0-9]{1,2})/ig;
    const chapIds = {};
    for (const m of tocHtml.matchAll(idRe)) {
      const id = m[1];
      const num = Number(m[2]);
      if (num >= 1 && num <= 42) chapIds[num] = id;
    }

    // make output folder mirroring
    const outDir = path.join(outRoot, folder);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    let outHtml = html;

    // For each chapter, find the slice and insert markers before paragraphs in order
    for (let i = 1; i <= 42; i++) {
      const id = chapIds[i];
      if (!id) continue;
      const startIdx = outHtml.indexOf(`id="${id}"`);
      if (startIdx === -1) continue;
      // find next chapter start
      let endIdx = outHtml.length;
      for (let j = i + 1; j <= 42; j++) {
        const nid = chapIds[j];
        if (!nid) continue;
        const pos = outHtml.indexOf(`id="${nid}"`);
        if (pos !== -1) {
          endIdx = pos;
          break;
        }
      }

      const slice = outHtml.slice(startIdx, endIdx);

      // find paragraphs in slice
      const paraRe = /<p\b[^>]*>[\s\S]*?<\/p>/ig;
      const paras = [];
      let m;
      while ((m = paraRe.exec(slice)) !== null) paras.push({ text: m[0], idx: m.index });

      const markers = map[i] || [];
      if (markers.length === 0 || paras.length === 0) continue;

      // Build new slice by replacing up to markers.length paragraphs
      let newSlice = '';
      let lastPos = 0;
      for (let p = 0; p < paras.length; p++) {
        const para = paras[p];
        const absStart = para.idx;
        newSlice += slice.slice(lastPos, absStart);
        let newPara = para.text;
        if (p < markers.length) {
          const marker = markers[p];
          // insert a span after the opening <p...>
          newPara = newPara.replace(/^(<p\b[^>]*>)/i, `$1<span class="gc-marker" data-gc="${marker}">${marker}</span> `);
        }
        newSlice += newPara;
        lastPos = absStart + para.text.length;
      }
      newSlice += slice.slice(lastPos);

      // replace the region in outHtml
      outHtml = outHtml.slice(0, startIdx) + newSlice + outHtml.slice(endIdx);
    }

    // write modified file
    const outPath = path.join(outDir, 'index.html');
    fs.writeFileSync(outPath, outHtml, 'utf8');
    // copy other assets (images, css) by naive copy if directory exists
    const srcDir = path.join(htmlRoot, folder);
    const assetFiles = fs.readdirSync(srcDir).filter((f) => f !== 'index.html');
    for (const f of assetFiles) {
      const s = path.join(srcDir, f);
      const d = path.join(outDir, f);
      try {
        const st = fs.statSync(s);
        if (st.isDirectory()) {
          // skip directories for now
          continue;
        } else {
          fs.copyFileSync(s, d);
        }
      } catch (e) {}
    }
    console.log('Wrote injected HTML to', outPath);
  }

  console.log('Injection complete. Backups written to', outRoot);
})();
