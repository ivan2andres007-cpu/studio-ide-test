const path = require('path');
const fs = require('fs');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const projectRoot = path.resolve(__dirname, '..');
const indexHtml = 'file:///' + path.join(projectRoot, 'index.html').replace(/\\/g, '/');

const artifactDir = path.join('C:', 'Users', 'Portfolio', '.gemini', 'antigravity', 'brain', '23c387e2-1602-4d2b-a8ad-8404f4690242', 'screenshots');
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

const localScreenshotsDir = path.join(projectRoot, 'screenshots', 'ronda7');
if (!fs.existsSync(localScreenshotsDir)) {
  fs.mkdirSync(localScreenshotsDir, { recursive: true });
}

const viewports = [
  { width: 390, height: 844, name: '390' },
  { width: 1280, height: 900, name: '1280' },
  { width: 1920, height: 1080, name: '1920' }
];

async function verifyRonda7() {
  console.log('Starting Ronda 7 verification with Playwright...');
  const browser = await chromium.launch();

  for (const vp of viewports) {
    console.log(`\nTesting viewport ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.width === 390 ? 2 : 1
    });

    await page.goto(indexHtml, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Hero capture
    const heroEl = await page.$('section#hero') || await page.$('header.sticky + section') || await page.$('main section:first-of-type');
    const heroPathArtifact = path.join(artifactDir, `ronda7-hero-${vp.name}.png`);
    const heroPathLocal = path.join(localScreenshotsDir, `hero-${vp.name}.png`);
    if (heroEl) {
      await heroEl.screenshot({ path: heroPathLocal });
      fs.copyFileSync(heroPathLocal, heroPathArtifact);
      console.log(`Captured Hero at ${vp.name}px -> ${heroPathArtifact}`);
    } else {
      await page.screenshot({ path: heroPathLocal, clip: { x: 0, y: 0, width: vp.width, height: vp.height } });
      fs.copyFileSync(heroPathLocal, heroPathArtifact);
      console.log(`Captured Top/Hero at ${vp.name}px -> ${heroPathArtifact}`);
    }

    // 2. Planes capture
    const planesEl = await page.$('section#planes');
    const planesPathArtifact = path.join(artifactDir, `ronda7-planes-${vp.name}.png`);
    const planesPathLocal = path.join(localScreenshotsDir, `planes-${vp.name}.png`);
    if (planesEl) {
      await planesEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await planesEl.screenshot({ path: planesPathLocal });
      fs.copyFileSync(planesPathLocal, planesPathArtifact);
      console.log(`Captured Planes at ${vp.name}px -> ${planesPathArtifact}`);
    }

    // 3. Demos capture
    const demosEl = await page.$('section#demos');
    const demosPathArtifact = path.join(artifactDir, `ronda7-demos-${vp.name}.png`);
    const demosPathLocal = path.join(localScreenshotsDir, `demos-${vp.name}.png`);
    if (demosEl) {
      await demosEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      await demosEl.screenshot({ path: demosPathLocal });
      fs.copyFileSync(demosPathLocal, demosPathArtifact);
      console.log(`Captured Demos at ${vp.name}px -> ${demosPathArtifact}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('\nVerification captures finished successfully!');
}

verifyRonda7().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
