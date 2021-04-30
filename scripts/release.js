const { execSync } = require('child_process');
const fs = require('fs');

execSync('rm -rf build');
execSync('npm run build');

const { version } = JSON.parse(fs.readFileSync('build/manifest.json').toString());

execSync(`mkdir -p releases; cd build; zip -r ../releases/meerkat-extension-${version}.zip .`);
