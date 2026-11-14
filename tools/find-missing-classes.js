const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('assets/css/styles.css', 'utf8');

// Extract all class names from index.html
const classRegex = /class="([^"]+)"/g;
let match;
const usedClasses = new Set();

while ((match = classRegex.exec(html)) !== null) {
  match[1].split(/\s+/).forEach(cls => {
    if (cls && !cls.startsWith('!') && !cls.includes('${')) {
      usedClasses.add(cls);
    }
  });
}

console.log('Total unique classes in index.html:', usedClasses.size);

const missingClasses = [];
usedClasses.forEach(cls => {
  // Check if class exists in css
  // Need to handle escaped characters like \/, \:, \[, \]
  const escaped = cls.replace(/[/\\:\[\].#]/g, '\\$&');
  const pattern = new RegExp(`\\.${escaped}(?=[^a-zA-Z0-9_-]|$)`);
  if (!pattern.test(css) && !cls.startsWith('js-') && !cls.startsWith('is-')) {
    missingClasses.push(cls);
  }
});

console.log('Missing classes count:', missingClasses.length);
console.log('Missing classes:', missingClasses);
