const http = require('http');
const fs = require('fs');
const path = require('path');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const PORT = 5292;
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
  const filePath = path.join(process.cwd(), reqPath.replace(/^\//, ''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

const ARTIFACT_SHOTS_DIR = 'C:\\Users\\Portfolio\\.gemini\\antigravity\\brain\\23c387e2-1602-4d2b-a8ad-8404f4690242\\screenshots';
if (!fs.existsSync(ARTIFACT_SHOTS_DIR)) fs.mkdirSync(ARTIFACT_SHOTS_DIR, { recursive: true });

server.listen(PORT, async () => {
  const browser = await chromium.launch();

  // Desktop captures (1280x900)
  const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await desktopPage.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(600);

  // Trigger reveals so elements are visible
  await desktopPage.evaluate(() => {
    document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-revealed'));
  });
  await desktopPage.waitForTimeout(300);

  const hero = await desktopPage.$('#inicio');
  if (hero) await hero.screenshot({ path: path.join(ARTIFACT_SHOTS_DIR, 'after-hero-desktop.png') });

  const razones = await desktopPage.$('section[aria-label="Tres razones principales"]');
  if (razones) await razones.screenshot({ path: path.join(ARTIFACT_SHOTS_DIR, 'after-razones-desktop.png') });

  const planes = await desktopPage.$('#planes');
  if (planes) await planes.screenshot({ path: path.join(ARTIFACT_SHOTS_DIR, 'after-planes-desktop.png') });

  const demos = await desktopPage.$('#demos');
  if (demos) await demos.screenshot({ path: path.join(ARTIFACT_SHOTS_DIR, 'after-demos-desktop.png') });

  const garantias = await desktopPage.$('#garantias');
  if (garantias) await garantias.screenshot({ path: path.join(ARTIFACT_SHOTS_DIR, 'after-garantias-desktop.png') });

  const proceso = await desktopPage.$('#proceso');
  if (proceso) await proceso.screenshot({ path: path.join(ARTIFACT_SHOTS_DIR, 'after-proceso-desktop.png') });

  await desktopPage.close();

  // Mobile captures (390x844)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobilePage.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(600);

  await mobilePage.evaluate(() => {
    document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-revealed'));
  });
  await mobilePage.waitForTimeout(300);

  const mHero = await mobilePage.$('#inicio');
  if (mHero) await mHero.screenshot({ path: path.join(ARTIFACT_SHOTS_DIR, 'after-hero-mobile.png') });

  const mPlanes = await mobilePage.$('#planes');
  if (mPlanes) await mPlanes.screenshot({ path: path.join(ARTIFACT_SHOTS_DIR, 'after-planes-mobile.png') });

  const mDemos = await mobilePage.$('#demos');
  if (mDemos) await mDemos.screenshot({ path: path.join(ARTIFACT_SHOTS_DIR, 'after-demos-mobile.png') });

  await mobilePage.close();

  await browser.close();
  server.close();
  console.log('All screenshots captured successfully into', ARTIFACT_SHOTS_DIR);
});
