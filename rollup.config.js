import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import pjson from './package.json';

const production = process.env.BUILD === 'production';

const config = [];

const inputs = [
  'background.ts',
  'toolbar.ts',
  'popup.ts',
  'options.ts',
  'content.ts',
  'sites/hasznaltauto.hu.ts',
  'sites/ingatlan.com.ts',
  'sites/ingatlan.jofogas.hu.ts',
  'sites/mobile.de.ts',
  'sites/immobilienscout24.de.ts',
];

const rootDir = production ? 'build' : 'build-dev';

const commonPlugins = [
  typescript(),
  replace({
    __buildEnv__: JSON.stringify(production ? 'production' : 'development'),
    __buildVersion__: JSON.stringify(pjson.version)
  })
];

for (const input of inputs) {
  if (!production && input === 'background.ts') {
    config.push({
      input: `src/background-dev.ts`,
      output: [
        {
          file: 'build-dev/background.js',
          format: 'iife'
        }
      ],
      plugins: [
        ...commonPlugins
      ]
    });

    continue;
  }

  config.push({
    input: `src/${input}`,
    output: [
      {
        dir: `${rootDir}${input.indexOf('sites/') === 0 ? '/sites' : ''}`,
        format: 'iife'
      }
    ],
    plugins: [
      ...commonPlugins
    ]
  });
}

config[0].plugins.push(copy({
  targets: [
    { src: `assets/${production ? 'icons' : 'icons-dev'}/*`, dest: `${rootDir}/icons` },
    { src: 'assets/options.html', dest: rootDir },
    { src: 'assets/popup.html', dest: rootDir },
    {
      src: 'assets/manifest.json',
      dest: rootDir,
      transform: (contents) => contents.toString().replace('__VERSION__', pjson.version)
    }
  ]
}));

export default config;
