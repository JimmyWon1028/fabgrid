const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const packageDir = path.join(root, 'packages', 'fabgrid-vue');
const sourceFile = path.join(packageDir, 'src', 'fabgrid-vue.js');
const distDir = path.join(packageDir, 'dist');
const source = fs.readFileSync(sourceFile, 'utf8');
const browserSource = source
  .replace(/export function ([A-Za-z_$][\w$]*)/g, 'function $1');
const browserEntry = '(function(global) {\n' + browserSource + '\n' +
  'var plugin = createFabGridVue(global.Vue, global.fabui);\n' +
  'global.fabuiVue = plugin;\n' +
  'global.Vue.use(plugin);\n' +
  '})(typeof globalThis !== "undefined" ? globalThis : window);\n';
const esmEntry = source + '\nexport default createFabGridVue;\n';

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'fabgrid-vue.js'), browserEntry);
fs.writeFileSync(path.join(distDir, 'fabgrid-vue.min.js'), esbuild.transformSync(browserEntry, {
  minify: true,
  target: 'es2017'
}).code.trim());
fs.writeFileSync(path.join(distDir, 'fabgrid-vue.esm.js'), esmEntry);
fs.writeFileSync(path.join(distDir, 'fabgrid-vue.esm.min.js'), esbuild.transformSync(esmEntry, {
  format: 'esm',
  minify: true,
  target: 'es2017'
}).code.trim());

['fabgrid-vue.js', 'fabgrid-vue.min.js', 'fabgrid-vue.esm.js', 'fabgrid-vue.esm.min.js'].forEach(function(name) {
  if (!fs.existsSync(path.join(distDir, name)) || !fs.statSync(path.join(distDir, name)).size) throw new Error('Missing Vue wrapper output: ' + name);
});

console.log('Built FabGrid Vue 2 wrapper bundles.');
