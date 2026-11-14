const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('Total lines in index.html:', lines.length);

lines.forEach((line, i) => {
  if (line.includes('<section') || line.includes('</section>') || line.includes('<main') || line.includes('</main>')) {
    console.log(`L${i+1}: ${line.trim()}`);
  }
});
