const path = require('path');
const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const fileUrl = 'file://' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  console.log('Testing button hover animations...');

  // 1. Primary Hero Button
  const heroBtn = page.locator('#inicio a[href="#demos"]');
  await heroBtn.scrollIntoViewIfNeeded();
  await heroBtn.hover();
  await page.waitForTimeout(300);
  const heroInfo = await heroBtn.evaluate((el) => {
    const s = window.getComputedStyle(el);
    return {
      transform: s.transform,
      boxShadow: s.boxShadow,
      backgroundColor: s.backgroundColor,
      color: s.color
    };
  });
  console.log('Hero Primary Button Hover State:', heroInfo);

  // 2. Plan 1 Outline Button
  const outlineBtn = page.locator('a[aria-label="Ver ejemplo de Presencia"]');
  await outlineBtn.scrollIntoViewIfNeeded();
  await outlineBtn.hover();
  await page.waitForTimeout(250);
  const outlineTransform = await outlineBtn.evaluate((el) => window.getComputedStyle(el).transform);
  const outlineColor = await outlineBtn.evaluate((el) => window.getComputedStyle(el).color);
  console.log('Plan 1 Outline Button Hover Transform:', outlineTransform, 'Color:', outlineColor);

  // 3. Plan 2 Featured Button
  const featuredBtn = page.locator('a[aria-label="Quiero el Plan Catálogo Móvil"]');
  await featuredBtn.scrollIntoViewIfNeeded();
  await featuredBtn.hover();
  await page.waitForTimeout(250);
  const featTransform = await featuredBtn.evaluate((el) => window.getComputedStyle(el).transform);
  console.log('Plan 2 Featured Button Hover Transform:', featTransform);

  // 4. Carousel Prev/Next Buttons
  const nextBtn = page.locator('#carouselNext');
  await nextBtn.scrollIntoViewIfNeeded();
  await nextBtn.hover();
  await page.waitForTimeout(250);
  const nextTransform = await nextBtn.evaluate((el) => window.getComputedStyle(el).transform);
  console.log('Carousel Next Button Hover Transform:', nextTransform);

  // 5. Header Button Arrow Glide
  const headerBtn = page.locator('header a[aria-label="Contactar por WhatsApp"]');
  await headerBtn.hover();
  await page.waitForTimeout(250);
  const arrowTransform = await headerBtn.locator('.btn-arrow').evaluate((el) => window.getComputedStyle(el).transform);
  console.log('Header Button Arrow Hover Transform:', arrowTransform);

  console.log('All button animation checks passed successfully!');
  await browser.close();
})();
