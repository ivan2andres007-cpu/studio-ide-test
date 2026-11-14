const http = require('http');
const fs = require('fs');
const path = require('path');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const PORT = 5275;
const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
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

async function runTests() {
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[HTTP Server] Listening on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 }
  });

  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });

  console.log('\n--- 1. Testing Scroll Reveal ---');
  // Check how many .reveal-on-scroll elements exist
  const totalReveals = await page.$$eval('.reveal-on-scroll', els => els.length);
  console.log(`Total .reveal-on-scroll elements found: ${totalReveals}`);

  // Check initial state before scrolling
  const planesHeaderRevealedBefore = await page.$eval('#planes .reveal-on-scroll', el => el.classList.contains('is-revealed'));
  console.log(`Planes header revealed before scrolling down: ${planesHeaderRevealedBefore}`);

  // Scroll down to Planes
  await page.evaluate(() => {
    document.querySelector('#planes').scrollIntoView();
  });
  await page.waitForTimeout(300);

  const planesHeaderRevealedAfter = await page.$eval('#planes .reveal-on-scroll', el => el.classList.contains('is-revealed'));
  console.log(`Planes header revealed after scrolling to it: ${planesHeaderRevealedAfter}`);

  // Scroll down to Preguntas header (instant jump for testing or wait for smooth scroll)
  await page.evaluate(() => {
    const el = document.querySelector('#preguntas');
    window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  });
  await page.waitForTimeout(100);

  const faqHeaderRevealed = await page.$eval('#preguntas .reveal-on-scroll', el => el.classList.contains('is-revealed'));
  console.log(`FAQ header revealed after scrolling to #preguntas: ${faqHeaderRevealed}`);

  // Scroll directly to FAQ accordion items
  await page.evaluate(() => {
    const el = document.querySelector('#preguntas .clean-card');
    window.scrollTo({ top: el.offsetTop - 100, behavior: 'instant' });
  });
  await page.waitForTimeout(100);

  const faqCardRevealed = await page.$eval('#preguntas .clean-card', el => el.classList.contains('is-revealed'));
  console.log(`FAQ accordion card revealed when scrolled directly into view: ${faqCardRevealed}`);

  console.log('\n--- 2. Testing Magnetic Floating WhatsApp Button ---');
  const btnWrapper = await page.$('#floatingWaWrapper');
  const btnAnchor = await page.$('#floatingWaBtn');
  const btnBox = await btnAnchor.boundingBox();
  console.log(`WhatsApp button center: x=${btnBox.x + btnBox.width / 2}, y=${btnBox.y + btnBox.height / 2}`);

  // Initial transform of wrapper
  const initialTransform = await page.$eval('#floatingWaWrapper', el => el.style.transform);
  console.log(`Initial button wrapper transform: "${initialTransform}"`);

  // Move mouse close to button (say 40px away from its center)
  const targetMouseX = btnBox.x + btnBox.width / 2 - 30;
  const targetMouseY = btnBox.y + btnBox.height / 2 - 30;
  await page.mouse.move(targetMouseX, targetMouseY);
  await page.waitForTimeout(200);

  const movedTransform = await page.$eval('#floatingWaWrapper', el => el.style.transform);
  console.log(`Button wrapper transform after mouse moves near button: "${movedTransform}"`);

  // Move mouse to top-left of page
  await page.mouse.move(100, 100);
  await page.waitForTimeout(300);

  const distantTransform = await page.$eval('#floatingWaWrapper', el => el.style.transform);
  console.log(`Button wrapper transform when mouse moves away: "${distantTransform}"`);

  // Trigger mouseleave
  await page.evaluate(() => {
    document.dispatchEvent(new Event('mouseleave'));
  });
  await page.waitForTimeout(300);

  const resetTransform = await page.$eval('#floatingWaWrapper', el => el.style.transform);
  console.log(`Button wrapper transform after mouseleave: "${resetTransform}"`);

  console.log('\n--- 3. Testing Prefers-Reduced-Motion ---');
  const contextRM = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1280, height: 900 }
  });
  const pageRM = await contextRM.newPage();
  await pageRM.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });

  const rmOpacity = await pageRM.$eval('.reveal-on-scroll', el => window.getComputedStyle(el).opacity);
  console.log(`Computed opacity of .reveal-on-scroll with prefers-reduced-motion: ${rmOpacity}`);

  await browser.close();
  server.close();
  console.log('\nAll interaction tests complete!');
}

runTests().catch(err => {
  console.error(err);
  server.close();
  process.exit(1);
});
