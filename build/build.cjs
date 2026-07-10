const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const localesDir = path.join(root, 'src', 'locales');
const corePath = path.join(root, 'src', 'fabgrid-core.js');
const cssPath = path.join(root, 'src', 'styles', 'fabgrid.css');
const iconCssPath = path.join(root, 'src', 'styles', 'my.icon.css');
const stylesDir = path.join(root, 'src', 'styles');
const themeSourceDir = path.join(stylesDir, 'themes');
const imagesDir = path.join(root, 'src', 'images');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function banner(name) {
  return '/*! FabGrid ' + name + ' | performance-first data grid */\n';
}

function stripExport(source) {
  return source.replace(/export function createFabGridFactory/, 'function createFabGridFactory');
}

function minifyJs(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\s+/g, ' ')
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

function writeLocaleFiles() {
  const outputDir = path.join(distDir, 'locales');
  const entries = fs.readdirSync(localesDir, { withFileTypes: true });
  ensureDir(outputDir);
  for (const entry of entries) {
    const file = entry.name;
    if (!entry.isFile() || path.extname(file) !== '.js') {
      continue;
    }
    const sourcePath = path.join(localesDir, file);
    const source = fs.readFileSync(sourcePath, 'utf8');
    fs.writeFileSync(path.join(outputDir, file), banner(file) + source, 'utf8');
    fs.writeFileSync(path.join(outputDir, file.replace(/\.js$/, '.min.js')), banner(file + ' min') + minifyJs(source), 'utf8');
  }
}

function getCssBlock(source, selector) {
  const pattern = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([\\s\\S]*?)\\}', 'm');
  const match = source.match(pattern);
  return match ? match[1] : '';
}

function getCssDeclaration(block, property, fallback) {
  const normalized = String(block || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const pattern = new RegExp('(?:^|[;\\n\\r])\\s*' + property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:\\s*([^;]+)', 'i');
  const match = normalized.match(pattern);
  return match ? match[1].trim() : fallback;
}

function getCssShadowColor(value, fallback) {
  const match = String(value || '').match(/(#[0-9a-f]{3,8}|rgba?\([^)]+\))\s*$/i);
  return match ? match[1] : fallback;
}

function getWijmoThemeSuffix(file) {
  const match = file.match(/^my\.wijmo\.([^.]+)\.css$/);
  return match ? match[1] : '';
}

function readWijmoTheme(file) {
  const source = fs.readFileSync(path.join(stylesDir, file), 'utf8');
  const content = getCssBlock(source, '.wj-content');
  const cell = getCssBlock(source, '.wj-flexgrid .wj-cell');
  const header = getCssBlock(source, '.wj-cell.wj-header');
  const headerHover = getCssBlock(source, '.wj-cell.wj-header:hover');
  const selected = getCssBlock(source, '.wj-flexgrid.wj-state-focused .wj-cell.wj-state-selected');
  const rowSelected = getCssBlock(source, '.wj-cells .wj-row .wj-cell.wj-state-multi-selected');
  const alt = getCssBlock(source, '.wj-cell.wj-alt:not(.wj-header):not(.wj-group):not(.wj-state-selected):not(.wj-state-multi-selected)');
  const rowHover = getCssBlock(source, '.wj-cells .wj-row:hover .wj-cell:not(.wj-state-selected):not(.wj-state-multi-selected):not(input)');
  const sort = getCssBlock(source, '.wj-glyph-up, .wj-glyph-down');
  const editor = getCssBlock(source, '.wj-cell:has(input.wj-grid-editor.wj-form-control)');

  return {
    border: getCssDeclaration(cell, 'border-color', getCssDeclaration(content, 'border-color', '#c9c9c9')),
    borderStrong: getCssDeclaration(content, 'border-color', '#b8c4d4'),
    rootBg: getCssDeclaration(content, 'background-color', '#ffffff'),
    text: getCssDeclaration(content, 'color', '#000000'),
    headerBg: getCssDeclaration(header, 'background-color', '#efefef'),
    headerText: getCssDeclaration(header, 'color', '#808080'),
    headerHoverBg: getCssDeclaration(headerHover, 'background-color', '#eef6ff'),
    selectedBg: getCssDeclaration(selected, 'background-color', '#dceeff'),
    selectedText: getCssDeclaration(selected, 'color', getCssDeclaration(content, 'color', '#000000')),
    selectedBorder: getCssShadowColor(getCssDeclaration(selected, 'box-shadow', ''), '#2b7fd3'),
    rowSelectedBg: getCssDeclaration(rowSelected, 'background-color', '#ffe68a'),
    rowSelectedText: getCssDeclaration(rowSelected, 'color', getCssDeclaration(content, 'color', '#000000')),
    altBg: getCssDeclaration(alt, 'background-color', '#fafafa'),
    altText: getCssDeclaration(alt, 'color', getCssDeclaration(content, 'color', '#000000')),
    rowHoverBg: getCssDeclaration(rowHover, 'background', getCssDeclaration(rowHover, 'background-color', '#edf6ff')),
    rowHoverText: getCssDeclaration(rowHover, 'color', getCssDeclaration(content, 'color', '#000000')),
    sortColor: getCssDeclaration(sort, 'color', '#6190cd'),
    editorBorder: getCssShadowColor(getCssDeclaration(editor, 'box-shadow', ''), '#2563eb')
  };
}

function writeFabGridTheme(outputDir, suffix, theme) {
  const className = '.fg-root.fg-theme-' + suffix;
  const content = [
    banner('theme ' + suffix).trimEnd(),
    className + ' {',
    '  --fg-border: ' + theme.border + ';',
    '  --fg-border-strong: ' + theme.borderStrong + ';',
    '  --fg-header-bg: ' + theme.headerBg + ';',
    '  --fg-header-text: ' + theme.headerText + ';',
    '  --fg-cell-bg: ' + theme.rootBg + ';',
    '  --fg-cell-alt-bg: ' + theme.altBg + ';',
    '  --fg-cell-text: ' + theme.text + ';',
    '  --fg-cell-hover-bg: ' + theme.headerHoverBg + ';',
    '  --fg-row-hover-bg: ' + theme.rowHoverBg + ';',
    '  --fg-row-selected-bg: ' + theme.rowSelectedBg + ';',
    '  --fg-row-header-bg: ' + theme.headerBg + ';',
    '  --fg-row-header-text: ' + theme.headerText + ';',
    '  --fg-selected-bg: ' + theme.selectedBg + ';',
    '  --fg-selected-border: ' + theme.selectedBorder + ';',
    '  --fg-editor-border: ' + theme.editorBorder + ';',
    '  background: ' + theme.rootBg + ';',
    '  color: ' + theme.text + ';',
    '}',
    '',
    className + ' .fg-header,',
    className + ' .fg-header-frozen,',
    className + ' .fg-header-frozen-right,',
    className + ' .fg-footer,',
    className + ' .fg-footer-frozen,',
    className + ' .fg-footer-frozen-right {',
    '  background: ' + theme.headerBg + ';',
    '}',
    '',
    className + ' .fg-row-header-top,',
    className + ' .fg-selection-top,',
    className + ' .fg-header-cell,',
    className + ' .fg-footer-row-header,',
    className + ' .fg-footer-selection,',
    className + ' .fg-footer-cell,',
    className + ' .fg-row-header-cell {',
    '  background-color: ' + theme.headerBg + ';',
    '  color: ' + theme.headerText + ';',
    '}',
    '',
    className + ' .fg-body,',
    className + ' .fg-frozen-pane,',
    className + ' .fg-frozen-pane-right,',
    className + ' .fg-selection-pane,',
    className + ' .fg-cell,',
    className + ' .fg-selection-cell {',
    '  background: ' + theme.rootBg + ';',
    '  color: ' + theme.text + ';',
    '}',
    '',
    className + ' .fg-cell.fg-row-even,',
    className + ' .fg-selection-cell.fg-row-even,',
    className + ' .fg-selection-cell.fg-row-alt,',
    className + ' .fg-cell.fg-row-alt {',
    '  background-color: ' + theme.altBg + ';',
    '  color: ' + theme.altText + ';',
    '}',
    '',
    className + ' .fg-cell.fg-row-hovered,',
    className + ' .fg-selection-cell.fg-row-hovered,',
    className + ' .fg-cell:hover,',
    className + ' .fg-cell.fg-row-hovered:hover {',
    '  background: ' + theme.rowHoverBg + ';',
    '  color: ' + theme.rowHoverText + ';',
    '}',
    '',
    className + ' .fg-cell.fg-row-selected,',
    className + ' .fg-selection-cell.fg-row-selected,',
    className + ' .fg-cell.fg-row-selected:hover,',
    className + ' .fg-row-selected.fg-selected {',
    '  background: ' + theme.rowSelectedBg + ';',
    '  color: ' + theme.rowSelectedText + ';',
    '}',
    '',
    className + ' .fg-selected {',
    '  background: ' + theme.selectedBg + ';',
    '  color: ' + theme.selectedText + ';',
    '  outline-color: ' + theme.selectedBorder + ';',
    '}',
    '',
    className + ' .fg-cell.fg-row-selected.fg-selected {',
    '  background: var(--fg-row-hover-bg);',
    '  color: var(--fg-cell-text);',
    '}',
    '',
    className + ' .fg-sort-asc {',
    '  border-bottom-color: ' + theme.sortColor + ';',
    '}',
    '',
    className + ' .fg-sort-desc {',
    '  border-top-color: ' + theme.sortColor + ';',
    '}',
    '',
    className + ' .fg-editor {',
    '  border-color: ' + theme.editorBorder + ';',
    '}',
    ''
  ].join('\n');

  fs.writeFileSync(path.join(outputDir, 'fabgrid.' + suffix + '.css'), content, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'fabgrid.' + suffix + '.min.css'), banner('theme ' + suffix + ' min') + minifyCss(content), 'utf8');
}

function writeSourceThemeFiles(outputDir) {
  const entries = fs.existsSync(themeSourceDir) ? fs.readdirSync(themeSourceDir, { withFileTypes: true }) : [];
  let source;
  let outputName;
  for (const entry of entries) {
    if (!entry.isFile() || !/^fabgrid\.[^.]+(?:-[^.]+)*\.css$/.test(entry.name) || /\.min\.css$/.test(entry.name)) {
      continue;
    }
    source = fs.readFileSync(path.join(themeSourceDir, entry.name), 'utf8');
    outputName = entry.name;
    fs.writeFileSync(path.join(outputDir, outputName), source, 'utf8');
    fs.writeFileSync(path.join(outputDir, outputName.replace(/\.css$/, '.min.css')), banner(outputName + ' min') + minifyCss(source), 'utf8');
  }
}

function writeThemeFiles() {
  const outputDir = path.join(distDir, 'themes');
  const entries = fs.readdirSync(stylesDir, { withFileTypes: true });
  ensureDir(outputDir);
  writeSourceThemeFiles(outputDir);
  for (const entry of entries) {
    const suffix = entry.isFile() ? getWijmoThemeSuffix(entry.name) : '';
    if (!suffix) {
      continue;
    }
    writeFabGridTheme(outputDir, suffix, readWijmoTheme(entry.name));
  }
}

ensureDir(distDir);

const source = fs.readFileSync(corePath, 'utf8');
const core = stripExport(source);
const css = fs.readFileSync(cssPath, 'utf8');

const esm = banner('ESM') + source + '\nvar FabGrid = createFabGridFactory();\nvar FabGridLocales = FabGrid.locales;\nexport { FabGrid, FabGridLocales };\nexport default FabGrid;\n';
const global = banner('Global') + '(function(global) {\n' + core + '\nglobal.FabGrid = createFabGridFactory();\nif (global.FabGridLocales) {\n  Object.keys(global.FabGridLocales).forEach(function(name) {\n    global.FabGrid.addLocale(name, global.FabGridLocales[name]);\n  });\n}\nglobal.FabGridLocales = global.FabGrid.locales;\n}(typeof window !== "undefined" ? window : this));\n';

write('fabgrid.esm.js', esm);
write('fabgrid.esm.min.js', banner('ESM min') + minifyJs(esm));
write('fabgrid.js', global);
write('fabgrid.min.js', banner('Global min') + minifyJs(global));
write('fabgrid.css', css);
write('fabgrid.min.css', minifyCss(css));
if (fs.existsSync(iconCssPath)) {
  const iconCss = fs.readFileSync(iconCssPath, 'utf8').replace(/\.\.\/images\//g, 'images/');
  write('my.icon.css', iconCss);
  write('my.icon.min.css', minifyCss(iconCss));
}
writeLocaleFiles();
writeThemeFiles();
if (fs.existsSync(imagesDir)) {
  copyDir(imagesDir, path.join(distDir, 'images'));
}

console.log('Built FabGrid dist files.');
