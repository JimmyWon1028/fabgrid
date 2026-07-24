const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const distDir = process.env.FABUI_DIST_DIR ?
  path.resolve(process.env.FABUI_DIST_DIR) :
  path.join(root, 'dist');
const domSourceFile = path.join(root, 'src', 'fabdom', 'fabDom.js');
const loaderSourceFile = path.join(root, 'src', 'fabloader', 'fabLoader.js');
const regularOutputFile = path.join(distDir, 'fabLoader.js');
const minifiedOutputFile = path.join(distDir, 'fabLoader.min.js');
const args = process.argv.slice(2);
const invalidArgs = args.filter(function(arg) {
  return arg !== 'min';
});
const minOnly = args.indexOf('min') >= 0;

if (invalidArgs.length) {
  throw new Error('fabLoader build only accepts the optional "min" argument.');
}

function banner(name) {
  return '/*! fabLoader 0.12.0 | ' + name + ' */\n';
}

function minifyJs(source) {
  return esbuild.transformSync(source, {
    legalComments: 'none',
    minify: true,
    target: 'es2017'
  }).code.trim();
}

function verifyBrowserGlobal(outputFile) {
  const output = fs.readFileSync(outputFile, 'utf8');
  if (
    output.indexOf('fabLoader') < 0 ||
    output.indexOf('fabDom') < 0 ||
    !/(?:dom\s*:|\.dom=)/.test(output) ||
    output.indexOf('useDom') < 0 ||
    output.indexOf('wait') < 0 ||
    !/(?:prototype\.load|\.load=function)/.test(output) ||
    output.indexOf('loadScript') < 0 ||
    output.indexOf('loadCss') < 0 ||
    output.indexOf('preloadImage') < 0 ||
    output.indexOf('setConfig') < 0 ||
    output.indexOf('cancel') < 0 ||
    output.indexOf('loadText') < 0 ||
    output.indexOf('getText') < 0 ||
    output.indexOf('loadXml') < 0 ||
    output.indexOf('clearTextCache') < 0 ||
    output.indexOf('vue') < 0 ||
    output.indexOf('mountHtml') < 0
  ) {
    throw new Error('fabLoader browser output is incomplete.');
  }
  if (/\b(?:import|export)\s/.test(output)) {
    throw new Error('fabLoader output must remain a browser global.');
  }
}

function verifyOutput() {
  if (!fs.existsSync(minifiedOutputFile)) {
    throw new Error('Missing fabLoader minified output.');
  }
  if (minOnly && fs.existsSync(regularOutputFile)) {
    throw new Error('fabLoader min build must not retain regular output.');
  }
  if (!minOnly && !fs.existsSync(regularOutputFile)) {
    throw new Error('Missing fabLoader regular output.');
  }
  if (!minOnly) verifyBrowserGlobal(regularOutputFile);
  verifyBrowserGlobal(minifiedOutputFile);
}

const source = [
  fs.readFileSync(domSourceFile, 'utf8'),
  fs.readFileSync(loaderSourceFile, 'utf8')
].join('\n');

fs.mkdirSync(distDir, { recursive: true });
[
  'fabLoader.js',
  'fabLoader.min.js',
  'fabLoader.esm.js',
  'fabLoader.esm.min.js'
].forEach(function(file) {
  fs.rmSync(path.join(distDir, file), { force: true });
});
if (!minOnly) {
  fs.writeFileSync(
    regularOutputFile,
    banner('Standalone browser resource loader') + source,
    'utf8'
  );
}
fs.writeFileSync(
  minifiedOutputFile,
  banner('Standalone browser resource loader min') + minifyJs(source),
  'utf8'
);
verifyOutput();

console.log(minOnly ?
  'Built minified standalone dist/fabLoader.min.js.' :
  'Built standalone dist/fabLoader.js and dist/fabLoader.min.js.');
