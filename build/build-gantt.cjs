const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const distDir = process.env.FABUI_DIST_DIR ?
  path.resolve(process.env.FABUI_DIST_DIR) :
  path.join(root, 'dist');
const sourceFile = path.join(root, 'src', 'gantt', 'gantt.js');
const styleFile = path.join(root, 'src', 'gantt', 'gantt.css');

function banner(name) {
  return '/*! FabUI Gantt ' + name + ' | Requires FabUI core */\n';
}

function stripExports(source) {
  return source
    .replace(/export function ([A-Za-z_$][\w$]*)/g, 'function $1')
    .replace(/export\s+(var|let|const)\s+/g, '$1 ');
}

function minifyJs(source, format) {
  return esbuild.transformSync(source, {
    format: format,
    legalComments: 'none',
    minify: true,
    target: 'es2017'
  }).code.trim();
}

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function createBrowserBundle(source) {
  return banner('browser global') +
    '(function(global) {\n' +
    'if (!global.fabui || typeof global.fabui.Control !== "function") {\n' +
    '  throw new Error("Load fabui.js before fabui.gantt.js.");\n' +
    '}\n' +
    source + '\n' +
    'global.fabui.Gantt = createGanttFactory(global.fabui);\n' +
    '}(typeof window !== "undefined" ? window : this));\n';
}

function verifyOutput() {
  const coreFile = path.join(distDir, 'fabui.js');
  const browserFile = path.join(distDir, 'fabui.gantt.js');
  const core = fs.readFileSync(coreFile, 'utf8');
  const browser = fs.readFileSync(browserFile, 'utf8');
  if (/createGanttFactory|global\.fabui\.Gantt/.test(core)) {
    throw new Error('FabUI core bundle must not contain Gantt.');
  }
  if (browser.indexOf('Load fabui.js before fabui.gantt.js.') < 0 ||
      browser.indexOf('global.fabui.Gantt = createGanttFactory(global.fabui)') < 0) {
    throw new Error('FabUI Gantt browser bundle dependency contract is incomplete.');
  }
}

if (!fs.existsSync(path.join(distDir, 'fabui.js'))) {
  throw new Error('Build FabUI core before building fabui.gantt.*.');
}

const source = stripExports(fs.readFileSync(sourceFile, 'utf8'));
const styles = banner('styles') + fs.readFileSync(styleFile, 'utf8');
const browser = createBrowserBundle(source);

fs.mkdirSync(distDir, { recursive: true });
[
  'fabui.gantt.esm.js',
  'fabui.gantt.esm.min.js'
].forEach(function(file) {
  fs.rmSync(path.join(distDir, file), { force: true });
});
fs.writeFileSync(path.join(distDir, 'fabui.gantt.js'), browser, 'utf8');
fs.writeFileSync(
  path.join(distDir, 'fabui.gantt.min.js'),
  banner('browser global min') + minifyJs(browser, 'iife'),
  'utf8'
);
fs.writeFileSync(path.join(distDir, 'fabui.gantt.css'), styles, 'utf8');
fs.writeFileSync(path.join(distDir, 'fabui.gantt.min.css'), minifyCss(styles), 'utf8');
verifyOutput();

console.log('Built standalone FabUI Gantt bundles.');
