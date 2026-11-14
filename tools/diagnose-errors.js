const http = require('http');
const fs = require('fs');
const path = require('path');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const PORT = 5288;
const MIME_TYPES = {
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
  const parsed = new URL(req.url, `http://127.0.0.1:${PORT}`);
  let pathname = parsed.pathname;
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(process.cwd(), pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + pathname);
  }
});

server.listen(PORT, async () => {
  console.log(`[Diagnostic Server] Running on http://127.0.0.1:${PORT}`);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const errors = [];
  const warnings = [];
  const networkFailures = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({ type: 'console.error', text: msg.text(), location: msg.location() });
    } else if (msg.type() === 'warning') {
      warnings.push({ type: 'console.warn', text: msg.text() });
    }
  });

  page.on('pageerror', err => {
    errors.push({ type: 'pageerror', text: err.message, stack: err.stack });
  });

  page.on('requestfailed', req => {
    networkFailures.push({ url: req.url(), failure: req.failure() });
  });

  console.log('Loading index.html...');
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 1. Check basic page health
  console.log('Checking basic DOM health...');
  const title = await page.title();
  console.log('Title:', title);

  // 2. Simulate mousemove
  console.log('Simulating mouse movements...');
  for (let x = 100; x < 1200; x += 300) {
    for (let y = 100; y < 800; y += 300) {
      await page.mouse.move(x, y);
    }
  }

  // 3. Test Carousel navigation
  console.log('Testing Carousel navigation...');
  const carousel = await page.$('#demosCarousel');
  const prevBtn = await page.$('#carouselPrev');
  const nextBtn = await page.$('#carouselNext');

  if (nextBtn && carousel) {
    await nextBtn.click();
    await page.waitForTimeout(300);
    const scrollLeft = await carousel.evaluate(el => el.scrollLeft);
    console.log('Carousel scrollLeft after Next click:', scrollLeft);
  }

  if (prevBtn && carousel) {
    await prevBtn.click();
    await page.waitForTimeout(300);
    const scrollLeft = await carousel.evaluate(el => el.scrollLeft);
    console.log('Carousel scrollLeft after Prev click:', scrollLeft);
  }

  // 4. Test Demos filter buttons
  console.log('Testing Demos filter buttons...');
  const filterBtns = await page.$$('.demo-filter-btn');
  console.log(`Found ${filterBtns.length} filter buttons.`);
  for (const btn of filterBtns) {
    const text = await btn.innerText();
    await btn.click();
    await page.waitForTimeout(150);
    const visibleCount = await page.$$eval('.demo-card:not(.hidden)', c => c.length);
    console.log(`Filter [${text.trim()}]: visible cards = ${visibleCount}`);
  }

  // 5. Test Rubro select
  console.log('Testing Rubro filter select...');
  const select = await page.$('#rubroFilter');
  if (select) {
    const options = await page.$$eval('#rubroFilter option', opts => opts.map(o => o.value));
    console.log('Select options:', options);
    for (const val of options) {
      await select.selectOption(val);
      await page.waitForTimeout(100);
      const visibleCount = await page.$$eval('.demo-card:not(.hidden)', c => c.length);
      console.log(`Rubro [${val}]: visible cards = ${visibleCount}`);
    }
    // reset select
    await select.selectOption('all');
    // reset plan to all
    const allBtn = await page.$('.demo-filter-btn[data-filter="all"]');
    if (allBtn) await allBtn.click();
  }

  // 6. Test FAQ accordions
  console.log('Testing FAQ accordion toggles...');
  const faqs = await page.$$('.faq-toggle');
  console.log(`Found ${faqs.length} FAQ items.`);
  for (let i = 0; i < faqs.length; i++) {
    await faqs[i].click();
    await page.waitForTimeout(50);
  }

  // 7. Check viewports for overflow
  const testViewports = [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1280', width: 1280, height: 900 },
    { name: 'desktop-1920', width: 1920, height: 1080 }
  ];

  for (const vp of testViewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(300);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const hasOverflow = scrollWidth > clientWidth;
    console.log(`Viewport ${vp.name} (${vp.width}x${vp.height}): client=${clientWidth}, scroll=${scrollWidth}, overflow=${hasOverflow ? 'FAIL' : 'PASS'}`);
    if (hasOverflow) {
      errors.push({ type: 'overflow', text: `Horizontal overflow in ${vp.name}: ${scrollWidth} > ${clientWidth}` });
    }
  }

  // 8. Check all interactive buttons and anchors
  const anchors = await page.$$eval('a', as => as.map(a => ({ href: a.getAttribute('href'), text: a.innerText.trim() })));
  console.log(`Total anchor links found: ${anchors.length}`);

  // Summary
  console.log('\n========================================');
  console.log('DIAGNOSTIC REPORT:');
  console.log('========================================');
  console.log(`Total errors: ${errors.length}`);
  errors.forEach(e => console.error('  ERROR:', JSON.stringify(e)));
  console.log(`Total warnings: ${warnings.length}`);
  warnings.forEach(w => console.warn('  WARN:', JSON.stringify(w)));
  console.log(`Total network failures: ${networkFailures.length}`);
  networkFailures.forEach(nf => console.error('  NET FAIL:', JSON.stringify(nf)));

  await browser.close();
  server.close();
  process.exit(errors.length > 0 ? 1 : 0);
});
