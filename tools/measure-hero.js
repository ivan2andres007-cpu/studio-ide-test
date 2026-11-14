const path = require('path');
const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

(async () => {
  const browser = await chromium.launch();
  const testViewports = [
    { name: 'mobile-390 (iphone 14)', width: 390, height: 844, isMobile: true },
    { name: '1366x768 (standard laptop)', width: 1366, height: 768 },
    { name: '1440x900 (macbook / desktop)', width: 1440, height: 900 },
    { name: '1920x1080 (fhd monitor)', width: 1920, height: 1080 }
  ];

  for (const vp of testViewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile });
    await page.goto('file:///' + path.join(process.cwd(), 'index.html').replace(/\\/g, '/'));
    await page.waitForTimeout(300);

    const ctaBottom = await page.$eval('#inicio .btn-primary', el => el.getBoundingClientRect().bottom);
    const heroBox = await page.$eval('#inicio', el => {
      const r = el.getBoundingClientRect();
      return { top: r.top, height: r.height, bottom: r.bottom };
    });
    const h1Box = await page.$eval('#inicio h1', el => {
      const r = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return { height: r.height, fontSize: style.fontSize, lineHeight: style.lineHeight };
    });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    console.log(`Viewport ${vp.name}:`);
    console.log(`  - H1 font-size: ${h1Box.fontSize}, H1 height: ${h1Box.height.toFixed(1)}px`);
    console.log(`  - CTA bottom: ${ctaBottom.toFixed(1)}px (viewport height: ${vp.height}px)`);
    console.log(`  - Fits 100% in viewport without scroll? ${ctaBottom <= vp.height ? 'YES! (PASS)' : 'NO (FAIL)'}`);
    console.log(`  - Horizontal overflow: ${scrollWidth > clientWidth ? 'FAIL' : 'PASS'}`);
    await page.close();
  }

  await browser.close();
})();
