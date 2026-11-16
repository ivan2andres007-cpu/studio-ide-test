const path = require('path');
const fs = require('fs');

const playwrightPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

const projectRoot = path.resolve(__dirname, '..');

const targets = [
  {
    name: 'Presencia (La Forja)',
    file: path.join(projectRoot, 'demos', 'la-forja', 'index.html'),
    webpOut: path.join(projectRoot, 'assets', 'img', 'solucion-presencia.webp'),
    jpgOut: path.join(projectRoot, 'assets', 'img', 'solucion-presencia.jpg'),
  },
  {
    name: 'Catálogo (Ferretería San José)',
    file: path.join(projectRoot, 'demos', 'ferreteria-san-jose', 'index.html'),
    webpOut: path.join(projectRoot, 'assets', 'img', 'solucion-catalogo.webp'),
    jpgOut: path.join(projectRoot, 'assets', 'img', 'solucion-catalogo.jpg'),
  },
  {
    name: 'Corporativo (Industrial Lab)',
    file: path.join(projectRoot, 'demos', 'industrial-lab', 'index.html'),
    webpOut: path.join(projectRoot, 'assets', 'img', 'solucion-sistemas.webp'),
    jpgOut: path.join(projectRoot, 'assets', 'img', 'solucion-sistemas.jpg'),
  }
];

async function captureCapsules() {
  console.log('Launching browser to capture 390x844 real demo screenshots...');
  const browser = await chromium.launch();

  for (const t of targets) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2
    });

    let fileUrl = 'file:///' + t.file.replace(/\\/g, '/');
    if (t.name.includes('La Forja')) {
      fileUrl += '?demo=1';
    }
    console.log(`Loading ${t.name}: ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Capture as PNG buffer at 390x844 (rendered at 780x1688 via 2x retina)
    const pngBuffer = await page.screenshot({
      clip: { x: 0, y: 0, width: 390, height: 844 },
      type: 'png'
    });

    // Convert to WebP and JPEG using canvas inside browser context
    const base64Png = pngBuffer.toString('base64');
    const { webpBase64, jpegBase64 } = await page.evaluate(async (b64) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const webp = canvas.toDataURL('image/webp', 0.92).split(',')[1];
          const jpeg = canvas.toDataURL('image/jpeg', 0.90).split(',')[1];
          resolve({ webpBase64: webp, jpegBase64: jpeg });
        };
        img.src = 'data:image/png;base64,' + b64;
      });
    }, base64Png);

    fs.writeFileSync(t.webpOut, Buffer.from(webpBase64, 'base64'));
    fs.writeFileSync(t.jpgOut, Buffer.from(jpegBase64, 'base64'));
    console.log(`Saved: ${t.webpOut} (${fs.statSync(t.webpOut).size} bytes)`);
    console.log(`Saved fallback: ${t.jpgOut} (${fs.statSync(t.jpgOut).size} bytes)`);

    await page.close();
  }

  await browser.close();
  console.log('All real demo screenshots captured successfully!');
}

captureCapsules().catch((err) => {
  console.error('Error capturing capsules:', err);
  process.exit(1);
});
