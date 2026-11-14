const path = require('path');
const fs = require('fs');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

async function exportOg() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1
  });

  const filePath = path.resolve('og-source.html');
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000); // ensure webfonts finish rendering

  const outPath = path.resolve('assets/og.png');
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log('Exported og-source.html to:', outPath);

  await browser.close();
}

exportOg().catch(console.error);
