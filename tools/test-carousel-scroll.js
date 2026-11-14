const path = require('path');
const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);
const http = require('http');
const fs = require('fs');

const PORT = 5289;
const server = http.createServer((req, res) => {
  const filePath = path.join(process.cwd(), req.url === '/' ? 'index.html' : req.url);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const mime = ext === '.html' ? 'text/html' : ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : 'application/octet-stream';
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
  await page.goto(`http://127.0.0.1:${PORT}/index.html`);
  await page.waitForTimeout(500);

  const metrics = await page.$eval('#demosCarousel', el => ({
    clientWidth: el.clientWidth,
    scrollWidth: el.scrollWidth,
    scrollLeft: el.scrollLeft,
    cardCount: el.children.length,
    overflowX: window.getComputedStyle(el).overflowX
  }));

  console.log('Carousel metrics:', metrics);

  // Test scrollBy directly
  await page.$eval('#demosCarousel', el => el.scrollBy({ left: 350, behavior: 'instant' }));
  const scrollAfterInstant = await page.$eval('#demosCarousel', el => el.scrollLeft);
  console.log('ScrollLeft after instant scrollBy:', scrollAfterInstant);

  // Test button click
  await page.$eval('#demosCarousel', el => el.scrollTo({ left: 0 }));
  const nextBtn = await page.$('#carouselNext');
  await nextBtn.click();
  await page.waitForTimeout(600);
  const scrollAfterBtn = await page.$eval('#demosCarousel', el => el.scrollLeft);
  console.log('ScrollLeft after nextBtn click (600ms):', scrollAfterBtn);

  await browser.close();
  server.close();
});
