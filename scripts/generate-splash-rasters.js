const sharp = require('sharp');
const path = require('path');

const input = path.join(__dirname, '..', 'public', 'graphics', 'gc-splash.min.svg');
const outDir = path.join(__dirname, '..', 'public', 'graphics');

const sizes = [
  { name: '3840w', width: 3840, height: 2160 },
  { name: '2560w', width: 2560, height: 1440 },
  { name: '1920w', width: 1920, height: 1080 },
  { name: '1080x1920', width: 1080, height: 1920 }
];

async function gen() {
  for (const s of sizes) {
    const base = path.join(outDir, `gc-splash-${s.name}`);
    console.log('Generating', s.name);
    await sharp(input)
      .resize(s.width, s.height, { fit: 'contain', background: { r:255,g:255,b:255,alpha:1 } })
      .avif({ quality: 60 })
      .toFile(base + '.avif');

    await sharp(input)
      .resize(s.width, s.height, { fit: 'contain', background: { r:255,g:255,b:255,alpha:1 } })
      .webp({ quality: 80 })
      .toFile(base + '.webp');

    await sharp(input)
      .resize(s.width, s.height, { fit: 'contain', background: { r:255,g:255,b:255,alpha:1 } })
      .png()
      .toFile(base + '.png');
  }
  console.log('Done');
}

gen().catch(err => { console.error(err); process.exit(1); });
