import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  buildPropertyGridGroups,
  createPropertyGridFactory,
  normalizePropertyEditor,
  normalizePropertyGridData,
  normalizePropertyGridTheme
} from '../src/propertygrid/propertygrid.js';

test('FabUI core publishes PropertyGrid as a Control', function() {
  assert.equal(typeof fabui.PropertyGrid, 'function');
  assert.equal(Object.getPrototypeOf(fabui.PropertyGrid.prototype), fabui.Control.prototype);
});

test('PropertyGrid exposes the documented EasyUI-compatible defaults', function() {
  assert.equal(fabui.PropertyGrid.defaults.showGroup, false);
  assert.equal(fabui.PropertyGrid.defaults.groupField, 'group');
  assert.equal(fabui.PropertyGrid.defaults.showHeader, true);
  assert.equal(fabui.PropertyGrid.defaults.method, 'get');
  assert.equal(fabui.PropertyGrid.defaults.editable, true);
  assert.deepEqual(fabui.PropertyGrid.defaults.data, []);
});

test('PropertyGrid publishes all required locale packs', function() {
  assert.deepEqual(Object.keys(fabui.PropertyGrid.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.equal(fabui.PropertyGrid.locales.en.name, 'Name');
  assert.equal(fabui.PropertyGrid.locales['zh-TW'].value, '值');
  assert.equal(fabui.PropertyGrid.locales['zh-CN'].propertyGrid, '属性表');
});

test('PropertyGrid normalizes supported themes and alias', function() {
  assert.equal(normalizePropertyGridTheme('material-teal'), 'material-teal');
  assert.equal(normalizePropertyGridTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizePropertyGridTheme(' BLACK '), 'black');
  assert.equal(normalizePropertyGridTheme('unknown'), 'default');
});

test('PropertyGrid normalizes arrays and DataGrid row envelopes without mutating source', function() {
  var source = { total: 1, rows: [{ name: 'Age', value: 40 }] };
  var rows = normalizePropertyGridData(source);
  assert.deepEqual(rows, source.rows);
  assert.notEqual(rows, source.rows);
  assert.notEqual(rows[0], source.rows[0]);
  rows[0].value = 41;
  assert.equal(source.rows[0].value, 40);
});

test('PropertyGrid groups preserve first-seen order and row references', function() {
  var rows = [
    { name: 'Name', group: 'Identity' },
    { name: 'Email', group: 'Marketing' },
    { name: 'Age', group: 'Identity' }
  ];
  var groups = buildPropertyGridGroups(rows, 'group');
  assert.deepEqual(groups.map(function(group) { return group.value; }), ['Identity', 'Marketing']);
  assert.deepEqual(groups.map(function(group) { return group.rows.length; }), [2, 1]);
  assert.equal(groups[0].rows[1], rows[2]);
  assert.equal(groups[1].startIndex, 1);
});

test('PropertyGrid editor aliases reuse FabUI editor names', function() {
  assert.deepEqual(normalizePropertyEditor('textbox'), { type: 'text', options: {} });
  assert.equal(normalizePropertyEditor({ type: 'numberbox' }).type, 'number');
  assert.equal(normalizePropertyEditor({ type: 'datebox' }).type, 'date');
  assert.equal(normalizePropertyEditor({ type: 'combobox' }).type, 'combo');
  assert.equal(normalizePropertyEditor({ type: 'checkbox' }).type, 'boolean');
  assert.equal(normalizePropertyEditor(null), null);
});

test('PropertyGrid factory exposes lifecycle, group and change APIs', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  function EditBox() {}
  var PropertyGrid = createPropertyGridFactory(
    Control,
    function() {},
    function() {},
    EditBox
  );
  assert.equal(typeof PropertyGrid, 'function');
  assert.equal(PropertyGrid.normalizeTheme('sunny'), 'sunny');
  assert.equal(PropertyGrid.prototype.dispose, PropertyGrid.prototype.destroy);
  assert.equal(typeof PropertyGrid.prototype.groups, 'function');
  assert.equal(typeof PropertyGrid.prototype.expandGroup, 'function');
  assert.equal(typeof PropertyGrid.prototype.collapseGroup, 'function');
  assert.equal(typeof PropertyGrid.prototype.getChanges, 'function');
  assert.equal(typeof PropertyGrid.prototype.rejectChanges, 'function');
});

test('PropertyGrid source keeps editing in shared EditBox and restores its host', function() {
  var source = readFileSync(
    new URL('../src/propertygrid/propertygrid.js', import.meta.url),
    'utf8'
  );
  var css = readFileSync(
    new URL('../src/propertygrid/propertygrid.css', import.meta.url),
    'utf8'
  );
  assert.match(source, /this\._editor = new EditBox\(input, options\)/);
  assert.match(source, /groupFormatter\.call\(this, group\.value, group\.rows\)/);
  assert.match(source, /registerControl\(this\.hostElement, this\)/);
  assert.match(source, /unregisterControl\(this\.hostElement, this\)/);
  assert.match(source, /restorePropertyGridAttribute/);
  assert.match(css, /\.fui-propertygrid-group-toggle\[aria-expanded="false"\]::before/);
  assert.match(css, /var\(--fui-control-selected/);
  assert.match(css, /var\(--fui-propertygrid-selected-text\)/);
});
