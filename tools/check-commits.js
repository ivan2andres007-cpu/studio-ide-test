const { execSync } = require('child_process');

['2322bb0', '8b50ec1'].forEach(commit => {
  const content = execSync(`git show ${commit}:index.html`, { encoding: 'utf8' });
  const lines = content.split('\n');
  const demoIds = (content.match(/id="demos"/g) || []).length;
  const navs = (content.match(/<nav /g) || []).length;
  const headers = (content.match(/<header /g) || []).length;
  console.log(`Commit ${commit}: lines=${lines.length}, id="demos"=${demoIds}, <nav>=${navs}, <header>=${headers}`);
});
