const http = require('http');
const fs = require('fs');
const path = require('path');

// Resolve playwright from npm cache
const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const PORT = 5210;
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, '.playwright-audit');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Static file server
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
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`[HTTP Server] Listening on http://localhost:${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const pagesToTest = [
    { name: 'Punto Prisma Studio (Principal)', file: 'index.html', prefix: 'studio-principal' },
    { name: 'Demo - La Forja Barber Studio', file: 'demos/la-forja/index.html', prefix: 'la-forja' }
  ];

  const results = [];

  for (const item of pagesToTest) {
    console.log(`\n========================================`);
    console.log(`Auditing: ${item.name} (${item.file})`);
    console.log(`========================================`);

    const pageResult = {
      name: item.name,
      file: item.file,
      consoleErrors: [],
      jsExceptions: [],
      waLinksValid: true,
      waLinkCount: 0,
      tldDetected: false,
      desktopScreenshot: '',
      mobileScreenshot: ''
    };

    // 1. Desktop Test (1280x800)
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1
      });
      const page = await context.newPage();

      page.on('console', msg => {
        if (msg.type() === 'error') {
          pageResult.consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', err => {
        pageResult.jsExceptions.push(err.message);
      });

      const url = `http://localhost:${PORT}/${item.file}`;
      await page.goto(url, { waitUntil: 'networkidle' });

      // Verify WhatsApp links
      const waLinks = await page.$$eval('a[href*="wa.me"]', anchors => anchors.map(a => a.href));
      pageResult.waLinkCount = waLinks.length;
      for (const link of waLinks) {
        if (!link.includes('wa.me/595986125649')) {
          pageResult.waLinksValid = false;
          console.error(`Invalid WhatsApp link: ${link}`);
        }
      }

      // Check TLD mentions (.store, .shop, etc.)
      const bodyText = await page.textContent('body');
      pageResult.tldDetected = bodyText.includes('.store') || bodyText.includes('.shop') || bodyText.includes('.studio');

      // Test specific interactivity if present
      if (item.file === 'index.html') {
        const asuncionDay6Btn = await page.$('.asuncion-proc-btn[data-day="6"]');
        if (asuncionDay6Btn) {
          await asuncionDay6Btn.click();
          const badgeText = await page.$eval('#asuncionProcBadge', el => el.textContent.trim());
          const simTitle = await page.$eval('#asuncionSimTitle', el => el.textContent.trim());
          console.log(`  [Asunción 7-Day Timeline Test] Clicked Day 06 -> Badge: "${badgeText}" | Telemetry: "${simTitle}"`);
        }

        // Test scroll-driven progression
        await page.evaluate(() => {
          const el = document.getElementById('proceso');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        });
        await page.waitForTimeout(200);

        // Test gTLD Domain input
        await page.fill('#asuncionBrandInput', 'boutiquecarmelitas');
        await page.dispatchEvent('#asuncionBrandInput', 'input');
        const brandPrev = await page.$eval('#domainBrandPreview', el => el.textContent.trim());
        const gtldPrev = await page.$eval('#domainGtldPreview', el => el.textContent.trim());
        console.log(`  [Domain Test] Domain preview for 'boutiquecarmelitas': ${brandPrev}${gtldPrev}`);

        const tabBtn = await page.$('.case-tab-btn[data-case="barberia"]');
        if (tabBtn) {
          await tabBtn.click();
          console.log(`  [Case Tab Test] Switched to Barbería case successfully`);
        }
      }

      // Screenshot Desktop
      const desktopShot = path.join(OUT_DIR, `${item.prefix}-desktop-1280.png`);
      await page.screenshot({ path: desktopShot, fullPage: false });
      pageResult.desktopScreenshot = desktopShot;
      console.log(`  [Screenshot] Desktop captured: ${path.basename(desktopShot)}`);

      await context.close();
    }

    // 2. Mobile Test (390x844 - iPhone 14 / modern Android)
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      });
      const page = await context.newPage();

      page.on('console', msg => {
        if (msg.type() === 'error') {
          pageResult.consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', err => {
        pageResult.jsExceptions.push(err.message);
      });

      const url = `http://localhost:${PORT}/${item.file}`;
      await page.goto(url, { waitUntil: 'networkidle' });

      // Test Mobile Menu Toggle if exists
      const menuBtn = await page.$('#mobileMenuBtn');
      if (menuBtn) {
        await menuBtn.click();
        const menuVisible = await page.$eval('#mobileMenu', el => !el.classList.contains('hidden'));
        console.log(`  [Mobile Nav Test] Menu open toggle: ${menuVisible ? 'SUCCESS' : 'FAILED'}`);
      }

      // Check horizontal overflow on mobile
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const hasHorizontalScroll = scrollWidth > clientWidth;
      pageResult.mobileOverflow = hasHorizontalScroll;

      // Screenshot Mobile
      const mobileShot = path.join(OUT_DIR, `${item.prefix}-mobile-390.png`);
      await page.screenshot({ path: mobileShot, fullPage: false });
      pageResult.mobileScreenshot = mobileShot;
      console.log(`  [Screenshot] Mobile captured: ${path.basename(mobileShot)} (Overflow: ${hasHorizontalScroll ? 'FAIL' : 'PASS'})`);

      await context.close();
    }

    results.push(pageResult);
  }

  await browser.close();
  server.close();

  console.log(`\n========================================`);
  console.log(`AUDIT SUMMARY REPORT`);
  console.log(`========================================`);
  for (const r of results) {
    console.log(`\nPage: ${r.name}`);
    console.log(`- File: ${r.file}`);
    console.log(`- Console Errors: ${r.consoleErrors.length === 0 ? '0 (CLEAN)' : r.consoleErrors.join(', ')}`);
    console.log(`- JS Exceptions: ${r.jsExceptions.length === 0 ? '0 (CLEAN)' : r.jsExceptions.join(', ')}`);
    console.log(`- WhatsApp Links: ${r.waLinkCount} links, all strictly 595986125649: ${r.waLinksValid ? 'PASS' : 'FAIL'}`);
    console.log(`- Identity TLD (.store/.shop): ${r.tldDetected ? 'CONFIRMED' : 'NONE'}`);
    console.log(`- Mobile Horizontal Overflow: ${r.mobileOverflow ? 'FAIL (overflow detected)' : 'PASS (clean fit)'}`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(results, null, 2));
  console.log(`\nSummary JSON written to: ${path.join(OUT_DIR, 'summary.json')}`);
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
