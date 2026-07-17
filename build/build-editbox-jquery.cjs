const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const packageDir = path.join(root, 'packages', 'fabeditbox-jquery');
const sourceFile = path.join(packageDir, 'src', 'fabeditbox-jquery.js');
const distDir = process.env.FABUI_PACKAGE_DIST_DIR ?
  path.resolve(process.env.FABUI_PACKAGE_DIST_DIR) :
  path.join(packageDir, 'dist');
const wrapperDistDir = process.env.FABUI_DIST_DIR ?
  path.join(path.resolve(process.env.FABUI_DIST_DIR), 'wrapper') :
  path.join(root, 'dist', 'wrapper');
const source = fs.readFileSync(sourceFile, 'utf8');
const browserSource = source
  .replace(/export function ([A-Za-z_$][\w$]*)/g, 'function $1')
  .replace(/export default createFabEditBoxJQuery;?/, '');
const browserEntry = '(function(global) {\n' + browserSource + '\n' +
  'var plugin = createFabEditBoxJQuery(global.jQuery, global.fabui);\n' +
  'global.fabuiEditBoxJQuery = plugin;\n' +
  '})(typeof globalThis !== "undefined" ? globalThis : window);\n';
const minifiedBrowserEntry = esbuild.transformSync(browserEntry, {
  minify: true,
  target: 'es2017'
}).code.trim();

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(wrapperDistDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'fabeditbox-jquery.js'), browserEntry);
fs.writeFileSync(path.join(distDir, 'fabeditbox-jquery.min.js'), minifiedBrowserEntry);
fs.writeFileSync(path.join(wrapperDistDir, 'fabeditbox-jquery.min.js'), minifiedBrowserEntry);
fs.writeFileSync(path.join(distDir, 'fabeditbox-jquery.esm.js'), source);
fs.writeFileSync(
  path.join(distDir, 'fabeditbox-jquery.esm.min.js'),
  esbuild.transformSync(source, {
    format: 'esm',
    minify: true,
    target: 'es2017'
  }).code.trim()
);

[
  'fabeditbox-jquery.js',
  'fabeditbox-jquery.min.js',
  'fabeditbox-jquery.esm.js',
  'fabeditbox-jquery.esm.min.js'
].forEach(function(name) {
  if (!fs.existsSync(path.join(distDir, name)) || !fs.statSync(path.join(distDir, name)).size) {
    throw new Error('Missing EditBox jQuery wrapper output: ' + name);
  }
});
if (!fs.existsSync(path.join(wrapperDistDir, 'fabeditbox-jquery.min.js'))) {
  throw new Error('Missing shared EditBox jQuery wrapper output.');
}

console.log('Built FabEditBox jQuery wrapper bundles.');
