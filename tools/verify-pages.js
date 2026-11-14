const http = require('http');
const fs = require('fs');
const path = require('path');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const PORT = 5270;
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'tools', '.playwright-audit');
const BA_DIR = path.join(OUT_DIR, 'before-after');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(BA_DIR)) fs.mkdirSync(BA_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
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

async function runAudit() {
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[HTTP Server] Listening on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const viewports = [
    { name: 'mobile-390', width: 390, height: 844, isMobile: true },
    { name: 'desktop-1280', width: 1280, height: 900, isMobile: false },
    { name: 'desktop-1920', width: 1920, height: 1080, isMobile: false }
  ];

  const report = {
    viewportsTested: [],
    consoleErrors: [],
    jsExceptions: [],
    waLinksValid: true,
    overflowCheck: {}
  };

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile
    });
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') report.consoleErrors.push(`[${vp.name}] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      report.jsExceptions.push(`[${vp.name}] ${err.message}`);
    });

    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });

    // Check horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const overflow = scrollWidth > clientWidth;
    report.overflowCheck[vp.name] = { scrollWidth, clientWidth, overflow };
    console.log(`  - Widths: client=${clientWidth}, scroll=${scrollWidth}. Overflow: ${overflow ? 'FAIL' : 'PASS'}`);

    // Full page screenshot
    const fullShot = path.join(OUT_DIR, `clean-redesign-${vp.name}.png`);
    await page.screenshot({ path: fullShot, fullPage: false });

    // Section specific screenshots for Before / After comparison
    if (vp.width === 1280 || vp.width === 390) {
      const mode = vp.width === 1280 ? 'desktop' : 'mobile';

      const heroEl = await page.$('#inicio');
      if (heroEl) await heroEl.screenshot({ path: path.join(BA_DIR, `after-hero-${mode}.png`) });

      const planesEl = await page.$('#planes');
      if (planesEl) await planesEl.screenshot({ path: path.join(BA_DIR, `after-planes-${mode}.png`) });

      const demosEl = await page.$('#demos');
      if (demosEl) await demosEl.screenshot({ path: path.join(BA_DIR, `after-demos-${mode}.png`) });

      console.log(`  - After sections captured for ${mode} (hero, planes, demos)`);
    }

    // Check all wa.me links
    const waLinks = await page.$$eval('a[href*="wa.me"]', anchors => anchors.map(a => a.href));
    for (const link of waLinks) {
      if (!link.includes('wa.me/595986125649')) {
        report.waLinksValid = false;
        console.error(`Invalid WhatsApp link: ${link}`);
      }
    }

    // Test Demo Filter on desktop
    if (vp.width === 1280) {
      const filterBtn = await page.$('.demo-filter-btn[data-filter="catalogo"]');
      if (filterBtn) {
        await filterBtn.click();
        const visibleCards = await page.$$eval('.demo-card:not(.hidden)', cards => cards.length);
        console.log(`  - Filter test: "Catálogo Móvil" filter active, ${visibleCards} cards visible`);
      }

      // Test FAQ toggle
      const faqBtn = await page.$('.faq-toggle');
      if (faqBtn) {
        await faqBtn.click();
        const expanded = await page.$eval('.faq-toggle', b => b.getAttribute('aria-expanded'));
        console.log(`  - FAQ test: Accordion toggled, aria-expanded: ${expanded}`);
      }
    }

    await context.close();
  }

  await browser.close();
  server.close();

  console.log('\n========================================');
  console.log('AUDIT VERIFICATION SUMMARY');
  console.log('========================================');
  console.log(`- Console Errors: ${report.consoleErrors.length}`);
  console.log(`- JS Exceptions: ${report.jsExceptions.length}`);
  console.log(`- All WhatsApp links valid: ${report.waLinksValid ? 'PASS' : 'FAIL'}`);
  for (const [vp, data] of Object.entries(report.overflowCheck)) {
    console.log(`- Overflow at ${vp}: ${data.overflow ? 'FAIL' : 'PASS'} (${data.clientWidth}px)`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'summary-redesign.json'), JSON.stringify(report, null, 2));
}

runAudit().catch(console.error);
