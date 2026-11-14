const http = require('http');
const fs = require('fs');
const path = require('path');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const PORT = 5290;
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
  await page.waitForTimeout(500);

  const carousel = await page.$('#demosCarousel');
  await carousel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const box = await carousel.boundingBox();
  console.log('Carousel bounding box after scroll:', box);

  const initialScroll = await carousel.evaluate(el => el.scrollLeft);
  console.log('Initial scrollLeft:', initialScroll);

  // Perform mouse drag: start at card metadata area below iframe (e.g. y = box.y + 570)
  const startX = box.x + 350;
  const startY = box.y + 570;

  const targetElTag = await page.evaluate(({x, y}) => {
    const el = document.elementFromPoint(x, y);
    return el ? `${el.tagName}.${el.className}` : 'null';
  }, { x: startX, y: startY });
  console.log(`Element at drag start (${startX}, ${startY}):`, targetElTag);

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 200, startY, { steps: 10 });
  await page.mouse.up();

  await page.waitForTimeout(300);
  const draggedScroll = await carousel.evaluate(el => el.scrollLeft);
  console.log('ScrollLeft after mouse drag:', draggedScroll);

  const success = draggedScroll > initialScroll;
  console.log(`Mouse drag physics test: ${success ? 'PASS' : 'FAIL'} (${draggedScroll}px > ${initialScroll}px)`);

  // Test cursor spotlight values on a card
  const testCard = await page.$('.spotlight-card');
  await testCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  const cardBox = await testCard.boundingBox();
  await page.mouse.move(cardBox.x + 50, cardBox.y + 50);
  await page.waitForTimeout(100);

  const mouseXProp = await testCard.evaluate(el => el.style.getPropertyValue('--mouse-x'));
  const mouseYProp = await testCard.evaluate(el => el.style.getPropertyValue('--mouse-y'));
  console.log(`Card spotlight custom props: --mouse-x: ${mouseXProp}, --mouse-y: ${mouseYProp}`);

  await browser.close();
  server.close();
  process.exit(success ? 0 : 1);
});
