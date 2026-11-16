const path = require('path');
const http = require('http');
const fs = require('fs');

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
  const outDir = path.join(__dirname, '..', 'screenshots', 'ronda8');
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

  console.log('Starting Ronda 8 verification with Playwright...');

  for (const vp of viewports) {
    console.log(`\nTesting viewport ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });

    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 1. Hero
    const heroEl = await page.$('#hero');
    if (heroEl) {
      await heroEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const p = path.join(outDir, `hero-${vp.name}.png`);
      await heroEl.screenshot({ path: p });
      fs.copyFileSync(p, path.join(brainDir, `ronda8-hero-${vp.name}.png`));
      console.log(`Captured Hero at ${vp.name}px -> ${p}`);
    }

    // 2. Planes
    const planesEl = await page.$('#planes');
    if (planesEl) {
      await planesEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const p = path.join(outDir, `planes-${vp.name}.png`);
      await planesEl.screenshot({ path: p });
      fs.copyFileSync(p, path.join(brainDir, `ronda8-planes-${vp.name}.png`));
      console.log(`Captured Planes at ${vp.name}px -> ${p}`);
    }

    // 3. Demos
    const demosEl = await page.$('#demos');
    if (demosEl) {
      await demosEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const p = path.join(outDir, `demos-${vp.name}.png`);
      await demosEl.screenshot({ path: p });
      fs.copyFileSync(p, path.join(brainDir, `ronda8-demos-${vp.name}.png`));
      console.log(`Captured Demos at ${vp.name}px -> ${p}`);
    }

    // 4. A Medida
    const aMedidaEl = await page.$('#amedida');
    if (aMedidaEl) {
      await aMedidaEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const p = path.join(outDir, `amedida-${vp.name}.png`);
      await aMedidaEl.screenshot({ path: p });
      fs.copyFileSync(p, path.join(brainDir, `ronda8-amedida-${vp.name}.png`));
      console.log(`Captured A Medida at ${vp.name}px -> ${p}`);
    }

    // 5. FAQ
    const faqEl = await page.$('#preguntas');
    if (faqEl) {
      await faqEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      // Open the domain & hosting FAQ accordion
      const faqButtons = await faqEl.$$('.faq-toggle');
      if (faqButtons.length >= 5) {
        await faqButtons[4].click();
        await page.waitForTimeout(300);
      }
      const p = path.join(outDir, `faq-${vp.name}.png`);
      await faqEl.screenshot({ path: p });
      fs.copyFileSync(p, path.join(brainDir, `ronda8-faq-${vp.name}.png`));
      console.log(`Captured FAQ at ${vp.name}px -> ${p}`);
    }

    await page.close();
  }

  // Also capture simulador.html
  const simPage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2
  });
  await simPage.goto(`http://127.0.0.1:${port}/simulador.html`, { waitUntil: 'networkidle' });
  await simPage.waitForTimeout(400);
  const simP = path.join(outDir, `simulador-1280.png`);
  await simPage.screenshot({ path: simP, fullPage: true });
  fs.copyFileSync(simP, path.join(brainDir, `ronda8-simulador-1280.png`));
  console.log(`Captured simulador.html -> ${simP}`);
  await simPage.close();

  await browser.close();
  server.close();
  console.log('\nRonda 8 verification captures completed successfully!');
})();
