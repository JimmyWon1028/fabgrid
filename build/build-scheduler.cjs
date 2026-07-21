const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const distDir = process.env.FABUI_DIST_DIR ?
  path.resolve(process.env.FABUI_DIST_DIR) :
  path.join(root, 'dist');
const buildDate = new Date();
const buildVersion = buildDate.getFullYear() + '.' +
  (buildDate.getMonth() + 1) + '.' + buildDate.getDate();

function banner(name) {
  return '/*! FabUI Scheduler ' + name +
    ' | Optional extension; load FabUI core first */\n';
}

function stripExports(source) {
  return source
    .replace(/import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?/g, '')
    .replace(/export\s+(var|let|const)\s+/g, '$1 ')
    .replace(/export function ([A-Za-z_$][\w$]*)/g, 'function $1')
    .replace(/export\s+default\s+[A-Za-z_$][\w$]*\s*;?/g, '');
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
  return esbuild.transformSync(source, {
    loader: 'css',
    legalComments: 'none',
    minify: true,
    target: 'es2017'
  }).code.trim();
}

function verifyCoreDoesNotContainScheduler() {
  const coreFile = path.join(distDir, 'fabui.js');
  const sourceEntry = fs.readFileSync(path.join(srcDir, 'fabui.js'), 'utf8');
  if (/\bScheduler\b/.test(sourceEntry)) {
    throw new Error('FabUI core source must not import or publish Scheduler.');
  }
  if (fs.existsSync(coreFile)) {
    const core = fs.readFileSync(coreFile, 'utf8');
    if (/global\.fabui\.Scheduler\s*=/.test(core)) {
      throw new Error('FabUI core bundle must not publish Scheduler.');
    }
  }
}

function verifyOutput() {
  const browser = fs.readFileSync(
    path.join(distDir, 'fabui.scheduler.js'),
    'utf8'
  );
  if (browser.indexOf('global.fabui.Scheduler = createSchedulerFactory') < 0) {
    throw new Error('Scheduler browser global attachment is missing.');
  }
  if (browser.indexOf('Load fabui.* first') < 0) {
    throw new Error('Scheduler core load-order guard is missing.');
  }
  [
    'fabui.scheduler.js',
    'fabui.scheduler.min.js',
    'fabui.scheduler.css',
    'fabui.scheduler.min.css'
  ].forEach(function(file) {
    const output = path.join(distDir, file);
    if (!fs.existsSync(output) || !fs.statSync(output).size) {
      throw new Error('Missing Scheduler output: ' + file);
    }
  });
}

fs.mkdirSync(distDir, { recursive: true });
verifyCoreDoesNotContainScheduler();

const moduleSource = stripExports(
  fs.readFileSync(path.join(srcDir, 'scheduler/scheduler.js'), 'utf8')
);
const browserSource = banner('browser global') +
  '(function(global) {\n' +
  "'use strict';\n" +
  'if (!global.fabui || !global.fabui.Control) {\n' +
  "  throw new Error('FabUI Scheduler requires FabUI core. Load fabui.* first.');\n" +
  '}\n' +
  moduleSource + '\n' +
  'global.fabui.Scheduler = createSchedulerFactory(global.fabui);\n' +
  'global.fabui.Scheduler.version = ' + JSON.stringify(buildVersion) + ';\n' +
  '}(typeof window !== "undefined" ? window : this));\n';
const cssSource = banner('styles') + fs.readFileSync(
  path.join(srcDir, 'scheduler/scheduler.css'),
  'utf8'
);

[
  'fabui.scheduler.esm.js',
  'fabui.scheduler.esm.min.js'
].forEach(function(file) {
  fs.rmSync(path.join(distDir, file), { force: true });
});

fs.writeFileSync(
  path.join(distDir, 'fabui.scheduler.js'),
  browserSource,
  'utf8'
);
fs.writeFileSync(
  path.join(distDir, 'fabui.scheduler.min.js'),
  banner('browser global min') + minifyJs(browserSource, 'iife'),
  'utf8'
);
fs.writeFileSync(
  path.join(distDir, 'fabui.scheduler.css'),
  cssSource,
  'utf8'
);
fs.writeFileSync(
  path.join(distDir, 'fabui.scheduler.min.css'),
  minifyCss(cssSource),
  'utf8'
);

verifyOutput();
console.log('Built optional FabUI Scheduler bundles.');
