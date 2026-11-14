const http = require('http');
const fs = require('fs');
const path = require('path');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const PORT = 5260;
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'tools', '.playwright-audit', 'before-after');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath.replace(/^\//, ''));

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

async function main() {
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  // Desktop 1280
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });

    // Capture Hero
    const heroEl = await page.$('#inicio');
    if (heroEl) {
      await heroEl.screenshot({ path: path.join(OUT_DIR, 'before-hero-desktop.png') });
    }

    // Capture Planes
    const planesEl = await page.$('#soluciones');
    if (planesEl) {
      await planesEl.screenshot({ path: path.join(OUT_DIR, 'before-planes-desktop.png') });
    }

    // Capture Demos
    const demosEl = await page.$('#demos');
    if (demosEl) {
      await demosEl.screenshot({ path: path.join(OUT_DIR, 'before-demos-desktop.png') });
    }

    await page.close();
  }

  // Mobile 390
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });

    const heroEl = await page.$('#inicio');
    if (heroEl) {
      await heroEl.screenshot({ path: path.join(OUT_DIR, 'before-hero-mobile.png') });
    }

    const planesEl = await page.$('#soluciones');
    if (planesEl) {
      await planesEl.screenshot({ path: path.join(OUT_DIR, 'before-planes-mobile.png') });
    }

    const demosEl = await page.$('#demos');
    if (demosEl) {
      await demosEl.screenshot({ path: path.join(OUT_DIR, 'before-demos-mobile.png') });
    }

    await page.close();
  }

  console.log('Before screenshots captured in:', OUT_DIR);
  await browser.close();
  server.close();
}

main().catch(console.error);
