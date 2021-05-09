const { execSync } = require('child_process');

const generateScreenshot = (dir, lang) => {
  const command = `docker run --shm-size 1G --rm --network host -u root -v ${dir}:/screenshots alekzonder/puppeteer:latest full_screenshot 'http://localhost:3000/?noframe=1&lang=${lang}' 640x400`;

  console.log(command);

  const result = execSync(command);

  execSync(`mv ${dir}/${JSON.parse(result.toString()).filename} ${dir}/${lang}.png`);
};

generateScreenshot(`${__dirname}/result`, 'hu');
generateScreenshot(`${__dirname}/result`, 'en');
