const http = require('http');
const fs = require('fs');
const path = require('path');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const OUT_DIR = path.join(__dirname, 'assets', 'flyers');
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
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/flyers-instagram.html';
  const filePath = path.join(__dirname, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(5288, async () => {
  console.log('[Server] Running on http://localhost:5288');
  try {
    const browser = await chromium.launch({ headless: true });
    // Viewport big enough for full 1080x1920 rendering
    const page = await browser.newPage({
      viewport: { width: 1920, height: 2400 },
      deviceScaleFactor: 1
    });

    console.log('[Browser] Navigating to flyers-instagram.html...');
    await page.goto('http://localhost:5288/flyers-instagram.html', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // Remove preview zoom so screenshots capture at native 1080x1920
    await page.evaluate(() => {
      document.querySelectorAll('.story-preview').forEach(el => {
        el.style.zoom = '1';
      });
    });
    await page.waitForTimeout(1000);

    const flyers = [
      { id: '#flyer-1', name: 'historia-01-manifiesto-asuncion-1080x1920.png', label: 'Variante 1 (Lunes: Manifiesto)' },
      { id: '#flyer-2', name: 'historia-02-whatsapp-roi-1080x1920.png', label: 'Variante 2 (Miércoles: WhatsApp & ROI)' },
      { id: '#flyer-3', name: 'historia-03-sprint-7dias-1080x1920.png', label: 'Variante 3 (Viernes: Sprint 7 Días)' }
    ];

    for (const f of flyers) {
      console.log(`[Exporting] ${f.label}...`);
      const el = await page.$(f.id);
      if (el) {
        const outPath = path.join(OUT_DIR, f.name);
        await el.screenshot({ path: outPath });
        const stat = fs.statSync(outPath);
        console.log(`  -> Saved: ${outPath} (${Math.round(stat.size / 1024)} KB)`);
      } else {
        console.error(`  -> Element ${f.id} not found!`);
      }
    }

    await browser.close();
    console.log('[Export] All 3 Instagram Story flyers exported successfully!');
  } catch (err) {
    console.error('[Export Error]', err);
  } finally {
    server.close();
  }
});
