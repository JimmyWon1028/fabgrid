const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const packageDir = path.join(root, 'packages', 'fabui-jquery');
const sourceFile = path.join(packageDir, 'src', 'fabui-jquery.js');
const distDir = process.env.FABUI_PACKAGE_DIST_DIR ?
  path.resolve(process.env.FABUI_PACKAGE_DIST_DIR) :
  path.join(packageDir, 'dist');
const wrapperDistDir = process.env.FABUI_DIST_DIR ?
  path.join(path.resolve(process.env.FABUI_DIST_DIR), 'wrapper') :
  path.join(root, 'dist', 'wrapper');
const source = fs.readFileSync(sourceFile, 'utf8');
const browserSource = source
  .replace(/export function ([A-Za-z_$][\w$]*)/g, 'function $1')
  .replace(/export default createFabUiJQuery;?/, '');
const browserEntry = '(function(global) {\n' + browserSource + '\n' +
  'var plugin = createFabUiJQuery(global.jQuery, global.fabui);\n' +
  'global.fabuiJQuery = plugin;\n' +
  '})(typeof globalThis !== "undefined" ? globalThis : window);\n';
const minifiedBrowserEntry = esbuild.transformSync(browserEntry, {
  minify: true,
  target: 'es2017'
}).code.trim();

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(wrapperDistDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'fabui-jquery.js'), browserEntry);
fs.writeFileSync(path.join(distDir, 'fabui-jquery.min.js'), minifiedBrowserEntry);
fs.writeFileSync(path.join(wrapperDistDir, 'fabui-jquery.min.js'), minifiedBrowserEntry);

['fabui-jquery.js', 'fabui-jquery.min.js'].forEach(function(name) {
  var output = path.join(distDir, name);
  if (!fs.existsSync(output) || !fs.statSync(output).size) {
    throw new Error('Missing FabUI jQuery wrapper output: ' + name);
  }
});
if (!fs.existsSync(path.join(wrapperDistDir, 'fabui-jquery.min.js'))) {
  throw new Error('Missing shared FabUI jQuery wrapper output.');
}

console.log('Built FabUI jQuery wrapper bundles.');
