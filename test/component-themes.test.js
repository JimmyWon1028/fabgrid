import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

var themes = [
  'default',
  'black',
  'bootstrap',
  'cupertino',
  'dark-hive',
  'material',
  'material-blue',
  'material-teal',
  'metro',
  'metro-blue',
  'metro-gray',
  'metro-green',
  'metro-orange',
  'metro-red',
  'pepper-grinder',
  'sunny'
];

test('Every FabUI theme defines the new component palette variables', function() {
  themes.forEach(function(theme) {
    var css = readFileSync(
      new URL('../src/theme/' + theme + '/components.css', import.meta.url),
      'utf8'
    );
    assert.match(css, /--fui-checkbox-accent:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-propertygrid-border:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-propertygrid-group-bg:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-propertygrid-header-text:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-propertygrid-group-text:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-panel-bg:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-panel-text:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-control-placeholder:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-control-selected:\s*#[0-9a-f]{3,6}/i, theme);
    assert.match(css, /--fui-control-selected-text:\s*#[0-9a-f]{3,6}/i, theme);
  });
});

test('Today component styles consume theme variables without res dependencies', function() {
  var files = [
    '../src/tabs/tabs.css',
    '../src/propertygrid/propertygrid.css',
    '../src/checkbox/checkbox.css',
    '../src/filebox/filebox.css',
    '../src/checkgroup/checkgroup.css',
    '../src/switchbutton/switchbutton.css',
    '../src/radiobutton/radiobutton.css',
    '../src/radiogroup/radiogroup.css',
    '../src/tree/tree.css'
  ];
  var css = files.map(function(file) {
    return readFileSync(new URL(file, import.meta.url), 'utf8');
  }).join('\n');
  assert.match(css, /--fui-tabs-border/);
  assert.match(css, /--fui-propertygrid-group-bg/);
  assert.match(css, /--fui-checkbox-accent/);
  assert.match(css, /--fui-filebox-button-bg/);
  assert.match(css, /--fui-checkgroup-text/);
  assert.match(css, /--fui-switchbutton-on-bg/);
  assert.match(css, /--fui-radiobutton-accent/);
  assert.match(css, /--fui-radiogroup-text/);
  assert.match(css, /--fui-tree-icons/);
  assert.doesNotMatch(css, /(?:^|[('"\s])\.\.\/\.\.\/res\//m);
});
