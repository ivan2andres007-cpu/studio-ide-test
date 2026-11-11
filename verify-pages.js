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
    { name: 'Original', file: 'index.html', prefix: 'original' },
    { name: 'Variante 01 - Atelier Suizo', file: 'index-atelier-suizo.html', prefix: 'atelier-suizo' },
    { name: 'Variante 02 - Industrial Lab', file: 'index-industrial-lab.html', prefix: 'industrial-lab' },
    { name: 'Variante 03 - Modernismo Asunción', file: 'index-modernismo-asuncion.html', prefix: 'modernismo-asuncion' },
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
        const day3Btn = await page.$('.proc-day-btn[data-day="3"]');
        if (day3Btn) {
          await day3Btn.click();
          const badgeText = await page.$eval('#procDayBadge', el => el.textContent.trim());
          const simTitle = await page.$eval('#procSimulatorTitle', el => el.textContent.trim());
          console.log(`  [7-Day Timeline Test] Clicked Day 03 -> Badge: "${badgeText}" | Sim: "${simTitle}"`);
        }

        // Test scroll-driven progression
        await page.evaluate(() => {
          const el = document.getElementById('proceso');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        });
        await page.waitForTimeout(200);
        const scrolledBadge = await page.$eval('#procDayBadge', el => el.textContent.trim());
        console.log(`  [Scroll Progression Test] Scrolled to #proceso -> Badge: "${scrolledBadge}"`);

        // Test gTLD domain preview
        await page.fill('#gtldBrandInput', 'supermercado');
        const storeDomain = await page.$eval('.gtld-preview-store', el => el.textContent.trim());
        console.log(`  [gTLD Test] Domain preview for 'supermercado': ${storeDomain}`);
      }

      if (item.file === 'index-industrial-lab.html') {
        const step4Btn = await page.$('.lab-step-btn[data-step="4"]');
        if (step4Btn) {
          await step4Btn.click();
          const badgeText = await page.$eval('#labStepBadge', el => el.textContent.trim());
          const oscilloTitle = await page.$eval('#labMonitorTitle', el => el.textContent.trim());
          console.log(`  [Console Sequencer Test] Clicked Step 04 -> Badge: "${badgeText}" | Monitor: "${oscilloTitle}"`);
        }

        // Test gTLD domain preview
        await page.fill('#labBrandInput', 'repuestosdeleste');
        const storeDomain = await page.$eval('.lab-preview-store', el => el.textContent.trim());
        console.log(`  [gTLD Test] Domain preview for 'repuestosdeleste': ${storeDomain}`);

        const initialDisplay = await page.$eval('#totalQuoteDisplay', el => el.textContent.trim());
        await page.fill('#skuRange', '150');
        await page.dispatchEvent('#skuRange', 'input');
        const updatedDisplay = await page.$eval('#totalQuoteDisplay', el => el.textContent.trim());
        console.log(`  [Calculator Test] Initial: ${initialDisplay} -> Updated (150 SKUs): ${updatedDisplay}`);

        // Test toggle modSync
        await page.click('#modSync');
        const syncDisplay = await page.$eval('#totalQuoteDisplay', el => el.textContent.trim());
        console.log(`  [Calculator Test] With Google Sheets Sync: ${syncDisplay}`);
      }

      if (item.file === 'index-atelier-suizo.html') {
        const swissDay5Btn = await page.$('.swiss-proc-btn[data-day="5"]');
        if (swissDay5Btn) {
          await swissDay5Btn.click();
          const badgeText = await page.$eval('#swissProcBadge', el => el.textContent.trim());
          const simTitle = await page.$eval('#swissProcSimTitle', el => el.textContent.trim());
          console.log(`  [Swiss 7-Day Timeline Test] Clicked Day 05 -> Badge: "${badgeText}" | Telemetry: "${simTitle}"`);
        }

        await page.fill('#demoSearchInput', 'barber');
        await page.dispatchEvent('#demoSearchInput', 'input');
        const count = await page.$eval('#demoCountLabel', el => el.textContent.trim());
        console.log(`  [Search Filter Test] Result with 'barber': "${count}"`);
        await page.click('#clearSearchBtn');

        // Test WhatsApp Simulator
        const addBtns = await page.$$('.sim-add-btn');
        if (addBtns.length > 0) {
          await addBtns[0].click();
          await addBtns[1].click();
          const simTotal = await page.$eval('#simTotalDisplay', el => el.textContent.trim());
          console.log(`  [Simulator Test] Total after adding 2 items: ${simTotal}`);
        }

        // Test Domain input
        await page.fill('#domainBrandInput', 'autocentro');
        const firstDomain = await page.$eval('.swiss-preview-store', el => el.textContent.trim());
        console.log(`  [gTLD Domain Test] Domain preview for 'autocentro': ${firstDomain}`);
      }

      if (item.file === 'index-modernismo-asuncion.html') {
        const asuncionDay6Btn = await page.$('.asuncion-proc-btn[data-day="6"]');
        if (asuncionDay6Btn) {
          await asuncionDay6Btn.click();
          const badgeText = await page.$eval('#asuncionProcBadge', el => el.textContent.trim());
          const simTitle = await page.$eval('#asuncionSimTitle', el => el.textContent.trim());
          console.log(`  [Asuncion 7-Day Timeline Test] Clicked Day 06 -> Badge: "${badgeText}" | Telemetry: "${simTitle}"`);
        }

        // Test gTLD Domain input
        await page.fill('#asuncionBrandInput', 'boutiquecarmelitas');
        const storeDomain = await page.$eval('.asuncion-preview-store', el => el.textContent.trim());
        console.log(`  [gTLD Domain Test] Domain preview for 'boutiquecarmelitas': ${storeDomain}`);

        const tabBtn = await page.$('.case-tab-btn[data-case="barberia"]');
        if (tabBtn) {
          await tabBtn.click();
          const caseTitle = await page.$eval('#beforeTitle', el => el.textContent.trim());
          console.log(`  [Case Tab Test] Switched to Barbería case: "${caseTitle}"`);
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
