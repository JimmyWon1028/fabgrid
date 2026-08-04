const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src', 'locales');
const distDir = process.env.FABUI_DIST_DIR ?
  path.join(path.resolve(process.env.FABUI_DIST_DIR), 'locales') :
  path.join(root, 'dist', 'locales');
const minOnly = process.argv.slice(2).indexOf('min') >= 0;
const locales = ['en', 'zh-TW', 'zh-CN'];

function banner(locale, minified) {
  return '/*! FabUI locale ' + locale + (minified ? ' min' : '') +
    ' | Load after FabUI core */\n';
}

function minifyJavascript(source) {
  return esbuild.transformSync(source, {
    format: 'iife',
    legalComments: 'none',
    minify: true,
    target: 'es2017'
  }).code.trim();
}

fs.mkdirSync(distDir, { recursive: true });

locales.forEach(function(locale) {
  const sourceName = 'fabui-locale.' + locale + '.js';
  const minName = 'fabui-locale.' + locale + '.min.js';
  const source = fs.readFileSync(path.join(srcDir, sourceName), 'utf8');
  if (minOnly) {
    fs.rmSync(path.join(distDir, sourceName), { force: true });
  } else {
    fs.writeFileSync(
      path.join(distDir, sourceName),
      banner(locale, false) + source,
      'utf8'
    );
  }
  fs.writeFileSync(
    path.join(distDir, minName),
    banner(locale, true) + minifyJavascript(source),
    'utf8'
  );
});

locales.forEach(function(locale) {
  const required = minOnly ?
    ['fabui-locale.' + locale + '.min.js'] :
    [
      'fabui-locale.' + locale + '.js',
      'fabui-locale.' + locale + '.min.js'
    ];
  required.forEach(function(file) {
    const output = path.join(distDir, file);
    if (!fs.existsSync(output) || !fs.statSync(output).size) {
      throw new Error('Missing locale output: ' + file);
    }
  });
});

console.log('Built FabUI locale packs: ' + locales.join(', ') + '.');
