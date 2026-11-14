const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

const demosMatches = content.match(/id="demos"/g);
console.log('Occurrences of id="demos":', demosMatches ? demosMatches.length : 0);

const demoCards = content.match(/class="[^"]*demo-card[^"]*"/g);
console.log('Total demo-card matches:', demoCards ? demoCards.length : 0);

const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('id="demos"') || line.includes('demo-card') || line.includes('demosCarousel') || line.includes('demosGrid')) {
    console.log(`L${index + 1}: ${line.trim().slice(0, 100)}`);
  }
});
