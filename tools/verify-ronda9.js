const path = require('path');
const http = require('http');
const fs = require('fs');
const assert = require('assert');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

function startServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(__dirname, '..', reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

(async () => {
  const { server, port } = await startServer();
  const outDir = path.join(__dirname, '..', 'screenshots', 'ronda9');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const brainDir = path.join('C:', 'Users', 'Portfolio', '.gemini', 'antigravity', 'brain', '23c387e2-1602-4d2b-a8ad-8404f4690242', 'screenshots');
  if (!fs.existsSync(brainDir)) {
    fs.mkdirSync(brainDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: '390', width: 390, height: 844 },
    { name: '1280', width: 1280, height: 900 },
    { name: '1920', width: 1920, height: 1080 }
  ];

  console.log('Starting Ronda 9 verification with Playwright...');

  for (const vp of viewports) {
    console.log(`\nTesting viewport ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });

    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Text Verifications (only on 1280 to avoid repetitive logs)
    if (vp.name === '1280') {
      const pageText = await page.content();

      // 1. Catálogo Móvil badge
      assert(pageText.includes('RECOMENDADO · PLAN PRINCIPAL'), 'Missing "RECOMENDADO · PLAN PRINCIPAL"');
      assert(!pageText.includes('MÁS ELEGIDO · EXPERIENCIA COMPLETA'), 'Old badge "MÁS ELEGIDO · EXPERIENCIA COMPLETA" still present');
      console.log('✓ Point 1 Verified: RECOMENDADO · PLAN PRINCIPAL badge present, old badge gone.');

      // 2. Dominio propio
      const matchDominio = pageText.match(/Dominio propio: te asesoramos para registrarlo/g) || [];
      assert.strictEqual(matchDominio.length, 2, `Expected 2 occurrences of "Dominio propio: te asesoramos para registrarlo", found ${matchDominio.length}`);
      assert(!pageText.includes('Dominio propio incluido'), 'Old string "Dominio propio incluido" still present');
      console.log('✓ Point 2 Verified: Exactly 2 occurrences of "Dominio propio: te asesoramos para registrarlo", "Dominio propio incluido" completely removed.');

      // 3. FAQ 5
      assert(pageText.includes('El costo del dominio y de la renovación del segundo año te lo informamos antes de que contrates.'), 'Missing concise FAQ 5 answer');
      console.log('✓ Point 3 Verified: FAQ 5 has the exact required single answer.');

      // 4. Buttons
      assert(!pageText.includes('<span>Ver ejemplo</span>'), 'Old button "Ver ejemplo" still present');
      assert(!pageText.includes('<span>Lo quiero</span>'), 'Old button "Lo quiero" still present');
      const matchVerDemo = pageText.match(/<span>Ver demo<\/span>/g) || [];
      assert.strictEqual(matchVerDemo.length, 3, `Expected 3 "Ver demo" buttons, found ${matchVerDemo.length}`);
      const matchQuieroPlan = pageText.match(/<span>Quiero este plan<\/span>/g) || [];
      assert.strictEqual(matchQuieroPlan.length, 2, `Expected 2 "Quiero este plan" buttons, found ${matchQuieroPlan.length}`);
      const matchConsultar = pageText.match(/<span>Consultar<\/span>/g) || [];
      assert(matchConsultar.length >= 1, 'Expected "Consultar" button present on Plan Corporativo');
      console.log('✓ Point 4 Verified: 3 "Ver demo" buttons, 2 "Quiero este plan" buttons, and "Consultar" button on Corporativo.');

      // 5. Invoices
      const matchFacturaIVA = pageText.match(/SIPAP · Factura con IVA incluido/g) || [];
      assert.strictEqual(matchFacturaIVA.length, 3, `Expected 3 occurrences of "SIPAP · Factura con IVA incluido", found ${matchFacturaIVA.length}`);
      assert(pageText.includes('IVA incluido en todos los pagos'), 'Missing "IVA incluido en todos los pagos" in FAQ 6');
      console.log('✓ Point 5 Verified: All 3 plan cards state "SIPAP · Factura con IVA incluido" and FAQ 6 mentions "IVA incluido".');
    }

    // 1. Hero
    const heroEl = await page.$('#hero');
    if (heroEl) {
      await heroEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const p = path.join(outDir, `hero-${vp.name}.png`);
      await heroEl.screenshot({ path: p });
      fs.copyFileSync(p, path.join(brainDir, `ronda9-hero-${vp.name}.png`));
      console.log(`Captured Hero at ${vp.name}px -> ${p}`);
    }

    // 2. Planes
    const planesEl = await page.$('#planes');
    if (planesEl) {
      await planesEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const p = path.join(outDir, `planes-${vp.name}.png`);
      await planesEl.screenshot({ path: p });
      fs.copyFileSync(p, path.join(brainDir, `ronda9-planes-${vp.name}.png`));
      console.log(`Captured Planes at ${vp.name}px -> ${p}`);
    }

    // 3. Demos
    const demosEl = await page.$('#demos');
    if (demosEl) {
      await demosEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const p = path.join(outDir, `demos-${vp.name}.png`);
      await demosEl.screenshot({ path: p });
      fs.copyFileSync(p, path.join(brainDir, `ronda9-demos-${vp.name}.png`));
      console.log(`Captured Demos at ${vp.name}px -> ${p}`);
    }

    // 4. FAQ
    const faqEl = await page.$('#preguntas');
    if (faqEl) {
      await faqEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      // Open the domain & hosting FAQ accordion (index 4)
      const faqButtons = await faqEl.$$('.faq-toggle');
      if (faqButtons.length >= 5) {
        await faqButtons[4].click();
        await page.waitForTimeout(300);
      }
      const p = path.join(outDir, `faq-${vp.name}.png`);
      await faqEl.screenshot({ path: p });
      fs.copyFileSync(p, path.join(brainDir, `ronda9-faq-${vp.name}.png`));
      console.log(`Captured FAQ at ${vp.name}px -> ${p}`);
    }

    await page.close();
  }

  await browser.close();
  server.close();
  console.log('\nRonda 9 verification captures completed successfully!');
})();
