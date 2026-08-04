import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

import fabui from '../src/fabui.js?v=20260728-locale-packs-v1';

var locales = ['en', 'zh-TW', 'zh-CN'];
var localePackPromise;
var themes = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono'
];

test('Chart API is published only through the fabui.chart namespace', function() {
  assert.equal(fabui.Chart, undefined);
  assert.equal(typeof fabui.chart.Chart, 'function');
  assert.equal(typeof fabui.chart.Pie, 'function');
});

function assertLocalePack(componentName, component) {
  var packs = component.locales;
  var expectedKeys;
  assert.ok(packs, componentName + ' locales');
  assert.deepEqual(Object.keys(packs), locales, componentName + ' locale names');
  expectedKeys = Object.keys(packs.en).sort();
  locales.forEach(function(locale) {
    var pack = packs[locale];
    assert.deepEqual(
      Object.keys(pack).sort(),
      expectedKeys,
      componentName + ' ' + locale + ' keys'
    );
    expectedKeys.forEach(function(key) {
      var value = pack[key];
      assert.ok(
        Array.isArray(value) ? value.length > 0 : String(value || '').length > 0,
        componentName + ' ' + locale + '.' + key
      );
    });
  });
}

function loadLocalePacks() {
  if (!localePackPromise) {
    globalThis.fabui = fabui;
    localePackPromise = import('../src/locales/fabui-locale.zh-TW.js')
      .then(function() {
        return import('../src/locales/fabui-locale.zh-CN.js');
      })
      .then(function() {
        return import('../src/locales/fabui-locale.en.js');
      });
  }
  return localePackPromise;
}

function loadStandaloneLocalePack(locale) {
  var registration;
  var context = {};
  context.window = context;
  context.fabui = {
    addLocale: function(name, pack) {
      registration = { name: name, pack: pack };
    }
  };
  runInNewContext(
    readFileSync(
      new URL('../src/locales/fabui-locale.' + locale + '.js', import.meta.url),
      'utf8'
    ),
    context
  );
  assert.equal(registration.name, locale);
  return registration.pack;
}

function getLocaleLeafPaths(value, prefix, result) {
  var key;
  result = result || [];
  prefix = prefix || '';
  if (Array.isArray(value)) {
    result.push(prefix);
    return result;
  }
  if (value && typeof value === 'object') {
    for (key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        getLocaleLeafPaths(value[key], prefix ? prefix + '.' + key : key, result);
      }
    }
    return result;
  }
  result.push(prefix);
  return result;
}

test('English locale pack contains the same complete message structure as Chinese packs', function() {
  var english = loadStandaloneLocalePack('en');
  var englishPaths = getLocaleLeafPaths(english).sort();
  var traditionalPaths = getLocaleLeafPaths(
    loadStandaloneLocalePack('zh-TW')
  ).sort();
  var simplifiedPaths = getLocaleLeafPaths(
    loadStandaloneLocalePack('zh-CN')
  ).sort();

  assert.ok(englishPaths.length > 0);
  assert.deepEqual(englishPaths, traditionalPaths);
  assert.deepEqual(englishPaths, simplifiedPaths);
});

test('Loading a locale pack overwrites loaded component English defaults', function() {
  var registration;
  var context = {};
  context.window = context;
  context.fabui = {
    addLocale: function(name, pack) {
      registration = { name: name, pack: pack };
    },
    Accordion: {
      locales: {
        en: {
          untitled: 'Untitled',
          expand: 'Expand {title}',
          collapse: 'Collapse {title}'
        }
      }
    },
    chart: {
      Chart: {
        locales: {
          en: { emptyText: 'No data', value: 'Value', percent: 'Percent' }
        }
      },
      Pie: {
        locales: {
          en: { emptyText: 'No data', value: 'Value', percent: 'Percent' }
        }
      }
    }
  };
  runInNewContext(
    readFileSync(
      new URL('../src/locales/fabui-locale.zh-TW.js', import.meta.url),
      'utf8'
    ),
    context
  );

  assert.equal(registration.name, 'zh-TW');
  assert.equal(context.fabui.Accordion.locales.en.untitled, '未命名');
  assert.equal(context.fabui.chart.Chart.locales.en.emptyText, '沒有資料');
  assert.equal(context.fabui.chart.Pie.locales.en.emptyText, '沒有資料');
});

test('FabUI core publishes English locale only', function() {
  [
    'Calendar', 'CheckBox', 'CheckGroup', 'Diagram', 'EditBox', 'FileBox',
    'Form', 'Layout', 'Menu', 'Panel', 'PropertyGrid', 'RadioButton',
    'RadioGroup', 'SwitchButton', 'Tabs', 'Tree', 'Window'
  ].forEach(function(name) {
    assert.deepEqual(Object.keys(fabui[name].locales), ['en'], name);
  });
  assert.deepEqual(Object.keys(fabui.chart.Chart.locales), ['en']);
  assert.deepEqual(Object.keys(fabui.chart.Pie.locales), ['en']);
  assert.deepEqual(Object.keys(fabui.Messager.locales), ['en']);
  assert.deepEqual(fabui.getLocales(), ['en']);
  fabui.setLocale('zh-TW');
  assert.equal(fabui.getLocale(), 'en');
});

test('On-demand locale packs register all messages and set the global locale', async function() {
  await loadLocalePacks();
  await Promise.all([
    import('../src/fabui.gantt.js?v=20260728-locale-packs-v1'),
    import('../src/fabui.scheduler.js?v=20260728-locale-packs-v1'),
    import('../src/fabui.htmleditor.js?v=20260728-locale-packs-v1')
  ]);
  [
    'Calendar', 'CheckBox', 'CheckGroup', 'Diagram', 'EditBox', 'FileBox',
    'Form', 'Layout', 'Menu', 'Panel', 'PropertyGrid', 'RadioButton',
    'RadioGroup', 'SwitchButton', 'Tabs', 'Tree', 'Window'
  ].forEach(function(name) {
    assertLocalePack(name, fabui[name]);
  });
  assertLocalePack('Chart', fabui.chart.Chart);
  assertLocalePack('Pie', fabui.chart.Pie);
  assertLocalePack('Messager', fabui.Messager);
  assertLocalePack('Gantt', fabui.Gantt);
  assertLocalePack('Scheduler', fabui.Scheduler);
  assertLocalePack('HtmlEditor', fabui.HtmlEditor);
  assert.deepEqual(fabui.getLocales(), locales);
  assert.equal(fabui.getLocale(), 'en');
  assert.equal(fabui.Form.locales['zh-TW'].valueMissing, '此欄位為必填。');
  assert.equal(fabui.Form.locales['zh-CN'].valueMissing, '此字段为必填项。');
  assert.equal(fabui.Diagram.locales['zh-TW'].snapSize, '吸附間距');
  assert.equal(fabui.Diagram.locales['zh-CN'].snapSize, '吸附间距');
});

test('Loaded public components normalize Traditional and Simplified Chinese aliases', async function() {
  await loadLocalePacks();
  [
    fabui.Calendar,
    fabui.chart.Chart,
    fabui.chart.Pie,
    fabui.CheckBox,
    fabui.CheckGroup,
    fabui.Diagram,
    fabui.FabGrid,
    fabui.FileBox,
    fabui.Form,
    fabui.Layout,
    fabui.Menu,
    fabui.Messager,
    fabui.Panel,
    fabui.PropertyGrid,
    fabui.RadioButton,
    fabui.RadioGroup,
    fabui.SwitchButton,
    fabui.Tabs,
    fabui.Tree,
    fabui.Window
  ].forEach(function(component) {
    assert.equal(component.normalizeLocale('zh-Hant'), 'zh-TW');
    assert.equal(component.normalizeLocale('zh_Hant_TW'), 'zh-TW');
    assert.equal(component.normalizeLocale('zh-Hans'), 'zh-CN');
    assert.equal(component.normalizeLocale('zh_CN'), 'zh-CN');
    assert.equal(component.normalizeLocale('en-US'), 'en');
  });
});

test('Every theme-aware public component publishes the same 17-theme contract', function() {
  [
    'Button', 'Calendar', 'CheckBox', 'CheckGroup', 'Diagram', 'EditBox',
    'FabGrid', 'FileBox', 'Form', 'Layout', 'Menu', 'MenuButton', 'Panel',
    'PropertyGrid', 'RadioButton', 'RadioGroup', 'SplitButton', 'Tabs',
    'SwitchButton', 'Tree', 'Tooltip', 'Window'
  ].forEach(function(name) {
    assert.deepEqual(fabui[name].themes, themes, name);
  });
  assert.deepEqual(fabui.chart.Chart.themes, themes, 'Chart');
  assert.deepEqual(fabui.chart.Pie.themes, themes, 'Pie');
  assert.deepEqual(fabui.Messager.themes, themes, 'Messager');
  [
    'PivotChart', 'PivotGrid', 'PivotPanel', 'PivotSlicer', 'PivotWorkspace'
  ].forEach(function(name) {
    assert.deepEqual(fabui.pivot[name].themes, themes, name);
  });
});

test('Detached Form, ComboBox and ColorBox popups carry their active theme', function() {
  var formSource = readFileSync(
    new URL('../src/form/form.js', import.meta.url),
    'utf8'
  );
  var comboSource = readFileSync(
    new URL('../src/editbox/combo-popup.js', import.meta.url),
    'utf8'
  );
  var colorSource = readFileSync(
    new URL('../src/editbox/color-popup.js', import.meta.url),
    'utf8'
  );
  assert.match(formSource, /this\._applyThemeClass\(tip\)/);
  assert.match(formSource, /Form\.prototype\.setTheme/);
  assert.match(comboSource, /ComboPopup\.prototype\.setTheme/);
  assert.match(comboSource, /this\.setTheme\(this\.options\.theme\)/);
  assert.match(colorSource, /ColorPopup\.prototype\.setTheme/);
  assert.match(colorSource, /this\.setTheme\(this\.options\.theme\)/);
});

test('Chart and Form visual states consume their public theme variables', function() {
  var chartCss = readFileSync(
    new URL('../src/chart/chart.css', import.meta.url),
    'utf8'
  );
  var formCss = readFileSync(
    new URL('../src/form/form.css', import.meta.url),
    'utf8'
  );
  var colorCss = readFileSync(
    new URL('../src/editbox/color-editbox.css', import.meta.url),
    'utf8'
  );
  assert.match(chartCss, /var\(--fui-panel-bg/);
  assert.match(chartCss, /var\(--fui-panel-text/);
  assert.match(chartCss, /var\(--fui-propertygrid-border/);
  assert.match(chartCss, /var\(--fui-control-selected/);
  assert.match(formCss, /var\(--fui-form-validation-tip-bg/);
  assert.match(formCss, /var\(--fui-form-validation-tip-text/);
  assert.match(colorCss, /background:\s*var\(--fui-panel-bg/);
  assert.match(colorCss, /color:\s*var\(--fui-panel-text/);
});

test('FabGrid pagination aria label comes from the active locale', function() {
  var gridSource = readFileSync(
    new URL('../src/grid/fabgrid.js', import.meta.url),
    'utf8'
  );
  var viewSource = readFileSync(
    new URL('../src/grid/fabgrid-view.js', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(gridSource, /aria-label="Pagination"/);
  assert.match(
    viewSource,
    /setAttribute\('aria-label', this\.getText\('pagination\.ariaLabel'\)\)/
  );
});
