import typescript from '@rollup/plugin-typescript';

const production = process.env.BUILD === 'production';

const config = [];

const inputs = [
  'background.ts',
  'toolbar.ts',
  'popup.ts',
  'options.ts',
  'sites/hasznaltauto.hu.ts',
  'sites/ingatlan.com.ts',
  'sites/ingatlan.jofogas.hu.ts',
];

const rootDir = production ? 'build' : 'build-dev';

for (const input of inputs) {
  if (!production && input === 'background.ts') {
    config.push({
      input: `src/background-dev.ts`,
      output: [
        {
          file: 'build-dev/background.js',
          format: 'esm'
        }
      ],
      plugins: [typescript()]
    });

    continue;
  }

  config.push({
    input: `src/${input}`,
    output: [
      {
        dir: `${rootDir}${input.indexOf('sites/') === 0 ? '/sites' : ''}`,
        format: 'esm'
      }
    ],
    plugins: [typescript()]
  });
}

export default config;
