const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5250;
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'tools', '.playwright-audit');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
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

async function main() {
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[HTTP Server] Listening on http://127.0.0.1:${PORT}`);

  const lhModule = require(path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', '0f94ee7615faf582', 'node_modules', 'lighthouse'));
  const puppeteer = require(path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', '0f94ee7615faf582', 'node_modules', 'puppeteer-core'));

  const chromePath = 'C:\\Users\\Portfolio\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';

  console.log('[Puppeteer] Launching Chrome in mobile viewport...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'shell',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=390,844'
    ]
  });

  const url = `http://127.0.0.1:${PORT}/index.html`;
  console.log('[Lighthouse] Running mobile audit with DEFAULT SIMULATED THROTTLING on ' + url + '...');

  try {
    const lighthouseFn = lhModule.default || lhModule;
    // Note: throttlingMethod: 'simulate' is Lighthouse's default mobile throttling!
    const runnerResult = await lighthouseFn(url, {
      port: new URL(browser.wsEndpoint()).port,
      output: 'json',
      logLevel: 'error',
      formFactor: 'mobile',
      throttlingMethod: 'simulate',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        disabled: false
      },
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    });

    console.log('\n========================================');
    console.log('LIGHTHOUSE MOBILE AUDIT (SIMULATED THROTTLING)');
    console.log('========================================');
    const categories = runnerResult.lhr.categories;
    for (const [k, v] of Object.entries(categories)) {
      console.log(`${v.title.padEnd(20)}: ${Math.round(v.score * 100)} / 100`);
    }
    console.log('========================================\n');

    // Performance metrics
    const audits = runnerResult.lhr.audits;
    console.log('Core Metrics (Simulated Mobile 4G & 4x CPU Slowdown):');
    const metricsToLog = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'total-blocking-time',
      'cumulative-layout-shift',
      'speed-index'
    ];
    metricsToLog.forEach(m => {
      if (audits[m]) {
        console.log(`- ${audits[m].title.padEnd(30)}: ${audits[m].displayValue} (Score: ${Math.round(audits[m].score * 100)})`);
      }
    });

    const reportPath = path.join(OUT_DIR, 'lighthouse-simulated.json');
    fs.writeFileSync(reportPath, JSON.stringify(runnerResult.lhr, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);
  } catch (err) {
    console.error('Lighthouse run error:', err.message);
  } finally {
    await browser.close();
    server.close();
    console.log('[HTTP Server] Stopped');
  }
}

main().catch(console.error);
