const { execSync } = require('child_process');
const sizes = [16, 32, 48, 128];
const getCommand = (dir, size) => {
  return `convert assets/${dir}/icon.512x512.png -resize ${size}x${size} assets/${dir}/icon.${size}x${size}.png`;
};

for (const size of sizes) {
  execSync(getCommand('icons', size));
  execSync(getCommand('icons-dev', size));
}
