const path = require('path');
const fs = require('fs');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const images = [
  { name: 'asuncion-district.jpg', targetWidth: 1920, targetHeight: 800, quality: 0.82 },
  { name: 'solucion-catalogo.jpg', targetWidth: 1376, targetHeight: 768, quality: 0.88 },
  { name: 'solucion-presencia.jpg', targetWidth: 1376, targetHeight: 768, quality: 0.88 },
  { name: 'solucion-sistemas.jpg', targetWidth: 1376, targetHeight: 768, quality: 0.88 }
];

async function convert() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();

  for (const item of images) {
    const srcPath = path.resolve('assets/img', item.name);
    const destName = item.name.replace(/\.jpg$/, '.webp');
    const destPath = path.resolve('assets/img', destName);

    const base64Data = fs.readFileSync(srcPath).toString('base64');
    const mime = 'image/jpeg';
    const dataUri = `data:${mime};base64,${base64Data}`;

    const webpBase64 = await page.evaluate(async ({ dataUri, targetWidth, targetHeight, quality }) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth || img.naturalWidth;
          canvas.height = targetHeight || img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = reject;
        img.src = dataUri;
      });
    }, {
      dataUri,
      targetWidth: item.targetWidth,
      targetHeight: item.targetHeight,
      quality: item.quality
    });

    const buf = Buffer.from(webpBase64, 'base64');
    fs.writeFileSync(destPath, buf);
    console.log(`Converted ${item.name} -> ${destName}: ${(buf.length / 1024).toFixed(1)} KB`);
  }

  await browser.close();
}

convert().catch(console.error);
