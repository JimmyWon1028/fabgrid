import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const nativeControlCss = readFileSync(
  new URL('src/core/native-controls.css', root),
  'utf8'
);
const fabuiCss = readFileSync(new URL('src/fabui.css', root), 'utf8');
const iconCss = readFileSync(new URL('src/fabui.icon.css', root), 'utf8');

const coreCssFiles = [
  'src/button/button.css',
  'src/accordion/accordion.css',
  'src/calendar/calendar.css',
  'src/checkbox/checkbox.css',
  'src/checkgroup/checkgroup.css',
  'src/switchbutton/switchbutton.css',
  'src/radiobutton/radiobutton.css',
  'src/radiogroup/radiogroup.css',
  'src/chart/chart.css',
  'src/grid/fabgrid.css',
  'src/pivot/pivot-chart.css',
  'src/pivot/pivot-grid.css',
  'src/pivot/pivot-panel.css',
  'src/pivot/pivot-slicer.css',
  'src/pivot/pivot-workspace.css',
  'src/editbox/editbox.css',
  'src/editbox/text-editbox.css',
  'src/editbox/number-editbox.css',
  'src/editbox/time-editbox.css',
  'src/editbox/date-editbox.css',
  'src/editbox/date-editbox-theme.css',
  'src/editbox/combo-editbox.css',
  'src/editbox/color-editbox.css',
  'src/filebox/filebox.css',
  'src/form/form.css',
  'src/menu/menu.css',
  'src/menubutton/menubutton.css',
  'src/splitbutton/splitbutton.css',
  'src/panel/panel.css',
  'src/propertygrid/propertygrid.css',
  'src/tabs/tabs.css',
  'src/tree/tree.css',
  'src/tooltip/tooltip.css',
  'src/layout/layout.css',
  'src/window/window.css',
  'src/messager/messager.css',
  'src/fabui.icon.css'
];

const protectedControls = {
  'src/button/button.css': ['fui-button'],
  'src/checkbox/checkbox.css': ['fui-checkbox-input', 'fui-checkbox-label'],
  'src/switchbutton/switchbutton.css': ['fui-switchbutton-input', 'fui-switchbutton-label'],
  'src/radiobutton/radiobutton.css': ['fui-radiobutton-input', 'fui-radiobutton-label'],
  'src/grid/fabgrid.css': [
    'fg-column-chooser-trigger',
    'fg-header-search-input',
    'fg-header-search-icon',
    'fg-pagination-button',
    'fg-selection-checkbox',
    'fg-editor',
    'fg-editor-trigger',
    'fg-excel-filter-button',
    'fg-excel-filter-search',
    'fg-top-left-menu-item',
    'fg-column-chooser-item',
    'fg-column-chooser-check'
  ],
  'src/pivot/pivot-grid.css': ['fg-pivot-toggle', 'fg-pivot-detail-close'],
  'src/pivot/pivot-panel.css': [
    'fg-pivot-panel-field-control',
    'fg-pivot-panel-field-check',
    'fg-pivot-panel-filter-search',
    'fg-pivot-panel-filter-select-all',
    'fg-pivot-panel-filter-value',
    'fg-pivot-panel-action'
  ],
  'src/pivot/pivot-slicer.css': [
    'fg-pivot-slicer-search',
    'fg-pivot-slicer-select-all',
    'fg-pivot-slicer-value',
    'fg-pivot-slicer-button'
  ],
  'src/pivot/pivot-workspace.css': ['fg-pivot-workspace-control'],
  'src/editbox/text-editbox.css': [
    'fui-textbox-text',
    'fui-textbox-icon',
    'fui-textbox-button',
    'fui-textbox-label'
  ],
  'src/editbox/number-editbox.css': ['fui-numberbox-spinner-button'],
  'src/editbox/date-editbox.css': [
    'fui-calendar-title',
    'fui-calendar-nav',
    'fui-calendar-day',
    'fui-calendar-menu-year',
    'fui-calendar-menu-year-nav',
    'fui-calendar-menu-month',
    'fui-datebox-button'
  ],
  'src/editbox/color-editbox.css': ['fui-colorbox-swatch'],
  'src/panel/panel.css': ['fui-panel-tool'],
  'src/propertygrid/propertygrid.css': [
    'fui-propertygrid-group-toggle',
    'fui-propertygrid-boolean-editor'
  ],
  'src/tabs/tabs.css': ['fui-tabs-tab', 'fui-tabs-tool', 'fui-tabs-scroll'],
  'src/tree/tree.css': ['fui-tree-expander', 'fui-tree-checkbox', 'fui-tree-editor'],
  'src/layout/layout.css': ['fui-layout-expand-button'],
  'src/window/window.css': ['fui-window-tool'],
  'src/messager/messager.css': ['fui-messager-input']
};

const nativeTagPattern =
  /(^|[\s>+~,])(button|input|label|select|textarea|a|div|span|i|img|svg|canvas|table|thead|tbody|tfoot|tr|th|td|ul|ol|li|p|section|strong)(?=$|[\s.:#\[\]>+~,])/i;

function cssRules(source) {
  const normalized = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return Array.from(normalized.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .map(function(match) {
      return {
        selector: match[1].trim(),
        body: match[2]
      };
    })
    .filter(function(rule) {
      return rule.selector && rule.selector.charAt(0) !== '@';
    });
}

test('FabUI imports native control isolation before component styles', function() {
  const isolationIndex = fabuiCss.indexOf('./core/native-controls.css');
  const buttonIndex = fabuiCss.indexOf('./button/button.css');
  assert.ok(isolationIndex >= 0);
  assert.ok(buttonIndex > isolationIndex);
});

test('FabUI core native control classes receive shared normalization', function() {
  Object.values(protectedControls).flat().forEach(function(className) {
    assert.match(
      nativeControlCss,
      new RegExp('\\.' + className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:[,\\s)])'),
      className
    );
  });
  assert.match(nativeControlCss, /:root\s+:where\(/);
  assert.match(nativeControlCss, /:root\s+:is\(/);
  assert.match(nativeControlCss, /appearance:\s*none;/);
  assert.match(nativeControlCss, /appearance:\s*auto;/);
  assert.match(nativeControlCss, /\[class\^='fui-'\]/);
  assert.match(nativeControlCss, /\[class\*=' fui-'\]/);
  assert.match(nativeControlCss, /\[class\^='fg-'\]/);
  assert.match(nativeControlCss, /\[class\*=' fg-'\]/);
  assert.doesNotMatch(
    nativeControlCss,
    /\):is\(:hover,\s*:focus,\s*:focus-visible,\s*:active,\s*:disabled,\s*:checked\)/
  );
});

test('FabUI core selectors stay inside the root scope', function() {
  coreCssFiles.forEach(function(file) {
    const source = readFileSync(new URL(file, root), 'utf8');
    cssRules(source).forEach(function(rule) {
      rule.selector.split(',').forEach(function(selector) {
        const value = selector.trim();
        if (/^(?:from|to|\d+(?:\.\d+)?%)$/.test(value)) return;
        assert.match(value, /^:root\b/, file + ': ' + value);
      });
    });
  });
});

test('FabUI core native control base selectors outrank generic pseudo states', function() {
  Object.entries(protectedControls).forEach(function(entry) {
    const file = entry[0];
    const source = readFileSync(new URL(file, root), 'utf8');
    entry[1].forEach(function(className) {
      assert.match(
        source,
        new RegExp(
          ':root\\s+[^,{]*\\.' +
            className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
            '(?=[\\s,{.:#\\[>+~]|$)'
        ),
        file + ': ' + className
      );
    });
  });
});

test('FabUI core JavaScript assigns stable classes to native Pivot controls', function() {
  const panel = readFileSync(new URL('src/pivot/pivot-panel.js', root), 'utf8');
  const slicer = readFileSync(new URL('src/pivot/pivot-slicer.js', root), 'utf8');
  assert.match(panel, /label\.className = 'fg-pivot-panel-field-control'/);
  assert.match(panel, /selectAll\.className = 'fg-pivot-panel-filter-check'/);
  assert.match(panel, /input\.className = 'fg-pivot-panel-filter-check'/);
  assert.match(slicer, /this\.selectAllInput\.className = 'fg-pivot-slicer-check'/);
  assert.match(slicer, /this\.applyButton\.className = 'fg-pivot-slicer-button'/);
  assert.match(slicer, /this\.clearButton\.className = 'fg-pivot-slicer-button'/);
  assert.match(slicer, /input\.className = 'fg-pivot-slicer-check'/);
});

test('All 19 FabUI themes avoid raw native control selectors', function() {
  const themeDirectory = new URL('src/theme/', root);
  const themes = readdirSync(themeDirectory)
    .filter(function(name) {
      return /^fabgrid\.[a-z0-9-]+\.css$/.test(name);
    })
    .sort();
  assert.equal(themes.length, 19);

  themes.forEach(function(name) {
    const source = readFileSync(new URL(name, themeDirectory), 'utf8');
    const themeName = name.slice('fabgrid.'.length, -'.css'.length);
    const componentSource = readFileSync(
      new URL(themeName + '/components.css', themeDirectory),
      'utf8'
    );
    const tabsSource = readFileSync(
      new URL(themeName + '/tabs.css', themeDirectory),
      'utf8'
    );
    [
      [name, source],
      [themeName + '/components.css', componentSource],
      [themeName + '/tabs.css', tabsSource]
    ].forEach(function(entry) {
      cssRules(entry[1]).forEach(function(rule) {
        rule.selector.split(',').forEach(function(selector) {
          const value = selector.trim();
          if (/^(?:from|to|\d+(?:\.\d+)?%)$/.test(value)) return;
          assert.equal(
            nativeTagPattern.test(value),
            false,
            entry[0] + ': ' + value
          );
          assert.match(value, /^:root\b/, entry[0] + ': ' + value);
        });
      });
    });
    assert.match(source, /@import ['"]\.\/[a-z0-9-]+\/components\.css/);
    if (/\.fui-button\s*\{/.test(componentSource)) {
      assert.doesNotMatch(componentSource, /(^|\n)\.fui-button\s*\{/);
      assert.match(componentSource, /:root\s+\.fui-button\s*\{/);
    }
  });
});

test('Built-in icons keep their images above generic native selectors', function() {
  [
    'icon-datebox',
    'icon-refwin',
    'icon-search',
    'icon-clear',
    'icon-row-number'
  ].forEach(function(className) {
    assert.match(iconCss, new RegExp(':root\\s+\\.' + className + '\\b'));
  });
  assert.match(iconCss, /:root\s+\.fui-panel-tool-minimize/);
  assert.match(iconCss, /:root\s+\.fui-layout-button-up/);

  ['mono', 'mono-red', 'mono-green'].forEach(function(themeName) {
    const source = readFileSync(
      new URL('src/theme/' + themeName + '/components.css', root),
      'utf8'
    );
    assert.match(source, /:root\s+\.icon-search\s*\{/);
    assert.match(source, /:root\s+\.pagination-first\s*\{/);
  });
});
