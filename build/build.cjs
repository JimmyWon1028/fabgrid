const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const corePath = path.join(root, 'src', 'fastgrid-core.js');
const cssPath = path.join(root, 'src', 'styles', 'fastgrid.css');
const imagesDir = path.join(root, 'src', 'images');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function banner(name) {
  return '/*! FastGrid ' + name + ' | performance-first data grid */\n';
}

function stripExport(source) {
  return source.replace(/^export function createFastGridFactory/, 'function createFastGridFactory');
}

function minifyJs(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}()[\];,:=+\-*\/<>?])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function write(file, content) {
  fs.writeFileSync(path.join(distDir, file), content, 'utf8');
}

function copyDir(source, target) {
  const entries = fs.readdirSync(source, { withFileTypes: true });
  ensureDir(target);
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

ensureDir(distDir);

const source = fs.readFileSync(corePath, 'utf8');
const core = stripExport(source);
const css = fs.readFileSync(cssPath, 'utf8');

const esm = banner('ESM') + source + '\nvar FastGrid = createFastGridFactory();\nexport { FastGrid };\nexport default FastGrid;\n';
const global = banner('Global') + '(function(global) {\n' + core + '\nglobal.FastGrid = createFastGridFactory();\n}(typeof window !== "undefined" ? window : this));\n';

write('fastgrid.esm.js', esm);
write('fastgrid.esm.min.js', banner('ESM min') + minifyJs(esm));
write('fastgrid.js', global);
write('fastgrid.min.js', banner('Global min') + minifyJs(global));
write('fastgrid.css', css);
write('fastgrid.min.css', minifyCss(css));
if (fs.existsSync(imagesDir)) {
  copyDir(imagesDir, path.join(distDir, 'images'));
}

console.log('Built FastGrid dist files.');
