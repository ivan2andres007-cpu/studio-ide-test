const http = require('http');
const fs = require('fs');
const path = require('path');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const PORT = 5291;
const server = http.createServer((req, res) => {
  let pathname = new URL(req.url, `http://127.0.0.1:${PORT}`).pathname;
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(process.cwd(), pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });

  // Test 1: clicking "Quiero este modelo" button on first card
  const btn = await page.$('a[aria-label="Quiero el modelo La Forja"]');
  await btn.scrollIntoViewIfNeeded();

  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 3000 }).catch(() => null),
    btn.click()
  ]);

  console.log('Popup opened when clicking button normally:', Boolean(popup));
  if (popup) await popup.close();

  // Test 2: clicking "Abrir demo en pestaña nueva" icon
  const openIcon = await page.$('a[title="Abrir demo en pestaña nueva"]');
  const [popup2] = await Promise.all([
    page.waitForEvent('popup', { timeout: 3000 }).catch(() => null),
    openIcon.click()
  ]);
  console.log('Popup opened when clicking open icon normally:', Boolean(popup2));
  if (popup2) await popup2.close();

  await browser.close();
  server.close();
});
