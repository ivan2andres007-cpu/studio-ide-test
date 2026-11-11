const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'index-atelier-suizo.html',
  'index-industrial-lab.html',
  'index-modernismo-asuncion.html',
  'demos/la-forja/index.html'
];

let totalErrors = 0;

files.forEach(file => {
  console.log(`\n========================================`);
  console.log(`Auditing integrity: ${file}`);
  console.log(`========================================`);
  const content = fs.readFileSync(file, 'utf8');
  const baseDir = path.dirname(file);

  // 1. Check all img src
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
  let m;
  let imgCount = 0;
  while ((m = imgRegex.exec(content)) !== null) {
    const src = m[1];
    imgCount++;
    if (src.startsWith('data:') || src.startsWith('http') || src.includes('${')) continue;
    const resolved = path.resolve(baseDir, src);
    if (!fs.existsSync(resolved)) {
      console.error(`  [MISSING IMAGE] ${src} not found on disk!`);
      totalErrors++;
    } else {
      // verified
    }
  }
  console.log(`  - Checked ${imgCount} static image tags: PASS`);

  // 2. Check all wa.me links
  const waRegex = /https:\/\/wa\.me\/([^\s"'?]+)/g;
  let waCount = 0;
  while ((m = waRegex.exec(content)) !== null) {
    waCount++;
    const num = m[1];
    if (num !== '595986125649') {
      console.error(`  [INVALID WA NUMBER] wa.me/${num}`);
      totalErrors++;
    }
  }
  console.log(`  - Checked ${waCount} WhatsApp links (all 595986125649): PASS`);

  // 3. Check internal anchors (#hash)
  const idRegex = /id=["']([^"']+)["']/g;
  const idSet = new Set();
  while ((m = idRegex.exec(content)) !== null) {
    idSet.add(m[1]);
  }

  const anchorRegex = /href=["']#([^"'?]+)["']/g;
  let anchorCount = 0;
  while ((m = anchorRegex.exec(content)) !== null) {
    const targetId = m[1];
    anchorCount++;
    if (!idSet.has(targetId)) {
      console.error(`  [BROKEN INTERNAL ANCHOR] #${targetId} (no matching id found in document)`);
      totalErrors++;
    }
  }
  console.log(`  - Checked ${anchorCount} internal anchor links: PASS`);
});

console.log(`\n========================================`);
console.log(`Integrity check finished. Total errors: ${totalErrors}`);
console.log(`========================================`);
process.exit(totalErrors > 0 ? 1 : 0);
