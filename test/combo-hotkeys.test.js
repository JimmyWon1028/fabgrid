import test from 'node:test';
import assert from 'node:assert/strict';
import { ComboPopup } from '../src/editbox/combo-popup.js';
import { createComboBoxFactory } from '../src/editbox/combo-editbox.js';
import { createFabGridFactory } from '../src/grid/fabgrid.js';

function keyEvent(key, options) {
  return Object.assign({
    key: key,
    prevented: false,
    stopped: false,
    preventDefault: function() { this.prevented = true; },
    stopPropagation: function() { this.stopped = true; }
  }, options || {});
}

function popupFixture(items) {
  var popup = Object.create(ComboPopup.prototype);
  popup.items = items;
  popup.activeIndex = 0;
  popup.visible = true;
  popup.selected = [];
  popup.options = {
    closeOnSelect: true,
    onSelect: function(item) { popup.selected.push(item.value); }
  };
  popup.panel = {
    querySelectorAll: function() { return []; },
    querySelector: function() { return null; }
  };
  popup.show = function() { this.visible = true; return this; };
  popup.hide = function() { this.visible = false; return this; };
  return popup;
}

var items = [
  { value: 'receipt' },
  { value: 'disabled', disabled: true },
  { value: 'invoice' },
  { value: 'discount' }
];

test('combo navigation previews enabled items, stops at boundaries and confirms with Enter', function() {
  var popup = popupFixture(items);
  popup.handleKeyDown(keyEvent('ArrowDown'), { wrap: false });
  assert.equal(popup.activeIndex, 2);
  popup.handleKeyDown(keyEvent('ArrowUp'), { wrap: false });
  assert.equal(popup.activeIndex, 0);
  popup.handleKeyDown(keyEvent('ArrowUp'), { wrap: false });
  assert.equal(popup.activeIndex, 0);
  popup.handleKeyDown(keyEvent('End'));
  popup.handleKeyDown(keyEvent('ArrowDown'), { wrap: false });
  assert.equal(popup.activeIndex, 3);
  assert.deepEqual(popup.selected, []);
  popup.handleKeyDown(keyEvent('Enter'));
  assert.deepEqual(popup.selected, ['discount']);
  assert.equal(popup.visible, false);
});

test('combo Home/End skips disabled boundary items and no disabled item can be accepted', function() {
  var popup = popupFixture([{ disabled: true }, { value: 'enabled' }, { disabled: true }]);
  popup.handleKeyDown(keyEvent('Home'));
  assert.equal(popup.activeIndex, 1);
  popup.handleKeyDown(keyEvent('End'));
  assert.equal(popup.activeIndex, 1);
  popup.items = [{ disabled: true }, { disabled: true }];
  popup.setActiveIndex(0);
  assert.equal(popup.activeIndex, -1);
  popup.handleKeyDown(keyEvent('ArrowDown'), { wrap: false });
  popup.handleKeyDown(keyEvent('Enter'));
  assert.deepEqual(popup.selected, []);
});

test('combo Escape and Tab close without accepting a preview and Tab retains host navigation', function() {
  ['Escape', 'Tab'].forEach(function(key) {
    var popup = popupFixture(items);
    var event = keyEvent(key, { shiftKey: true });
    popup.handleKeyDown(keyEvent('ArrowDown'), { wrap: false });
    assert.equal(popup.handleKeyDown(event), key === 'Escape');
    assert.equal(popup.visible, false);
    assert.deepEqual(popup.selected, []);
    assert.equal(event.prevented, key === 'Escape');
  });
});

test('combo hotkeys leave composition and closed text-caret keys untouched', function() {
  var popup = popupFixture(items);
  ['ArrowDown', 'Enter', 'Escape'].forEach(function(key) {
    var event = keyEvent(key, { isComposing: true });
    assert.equal(popup.handleKeyDown(event), false);
    assert.equal(event.prevented, false);
  });
  popup.visible = false;
  assert.equal(popup.handleKeyDown(keyEvent('Home')), false);
  assert.equal(popup.handleKeyDown(keyEvent('End')), false);
});

test('Grid combo hotkeys share preview, cancellation and repeated-open behavior', function() {
  var FabGrid = createFabGridFactory({});
  var popup = popupFixture(items);
  var opens = 0;
  var grid = {
    editorConfig: { type: 'combo' },
    comboPopup: popup,
    isComboboxPanelOpen: function() { return popup.visible; },
    showComboboxPanel: function() { opens += 1; popup.show(); }
  };
  var event = keyEvent('ArrowDown', { altKey: true });
  popup.visible = false;
  assert.equal(FabGrid.prototype.handleComboboxKeyDown.call(grid, event), true);
  assert.equal(event.stopped, true);
  popup.activeIndex = 2;
  FabGrid.prototype.handleComboboxKeyDown.call(grid, keyEvent('ArrowDown', { altKey: true }));
  assert.equal(opens, 1);
  assert.equal(popup.activeIndex, 2);
  FabGrid.prototype.handleComboboxKeyDown.call(grid, keyEvent('Escape'));
  assert.deepEqual(popup.selected, []);
});

test('Combo EditBox uses the same popup navigation and defaults to preview only', function() {
  var ComboBox = createComboBoxFactory(function TextBox() {}, {});
  var popup = popupFixture(items);
  var combo = {
    _options: { selectOnNavigation: false },
    _comboPopup: popup,
    showPanel: function() { popup.show(); }
  };
  assert.equal(ComboBox.defaults.selectOnNavigation, false);
  ComboBox.prototype._handleKeyDown.call(combo, keyEvent('ArrowDown'));
  assert.equal(popup.activeIndex, 2);
  assert.deepEqual(popup.selected, []);
  ComboBox.prototype._handleKeyDown.call(combo, keyEvent('Escape'));
  assert.equal(popup.visible, false);
  assert.deepEqual(popup.selected, []);
});

test('Search Row shares boundary navigation and repeated-open hotkeys retain the preview', function() {
  var FabGrid = createFabGridFactory({});
  var popup = popupFixture(items);
  var input = { getAttribute: function() { return '0'; } };
  var opens = 0;
  var grid = {
    visibleColumns: [{ binding: 'kind', editor: 'combo' }],
    comboPopup: popup,
    comboboxTarget: null,
    isComboboxPanelOpen: function() { return popup.visible; },
    showHeaderSearchComboboxPanel: function() {
      opens += 1;
      this.comboboxTarget = { input: input };
      popup.show();
    }
  };
  popup.visible = false;
  FabGrid.prototype.handleHeaderSearchComboboxKeyDown.call(grid, keyEvent('F4'), input);
  FabGrid.prototype.handleHeaderSearchComboboxKeyDown.call(grid, keyEvent('End'), input);
  FabGrid.prototype.handleHeaderSearchComboboxKeyDown.call(grid, keyEvent('F4'), input);
  assert.equal(opens, 1);
  assert.equal(popup.activeIndex, 3);
  FabGrid.prototype.handleHeaderSearchComboboxKeyDown.call(grid, keyEvent('Escape'), input);
  assert.equal(popup.visible, false);
  assert.deepEqual(popup.selected, []);
});

test('active Grid combo cell opens directly with Alt+Down and does not move selection', function() {
  var FabGrid = createFabGridFactory({});
  var ownerDocument = {};
  var root = { nodeType: 1, tagName: 'DIV', className: 'fg-root', parentNode: null, ownerDocument: ownerDocument };
  var calls = [];
  var grid = {
    root: root,
    selection: { row: 0, col: 0 },
    options: { allowEditing: true },
    visibleColumns: [{ binding: 'kind', editor: 'combo' }],
    isHeaderToggleKey: function() { return false; },
    _startEditingVisible: function(row, col) { calls.push(['edit', row, col]); return true; },
    showComboboxPanel: function() { calls.push(['open']); }
  };
  ownerDocument.activeElement = root;
  var event = keyEvent('ArrowDown', { target: root, altKey: true });
  FabGrid.prototype.handleKeyDown.call(grid, event);
  assert.deepEqual(calls, [['edit', 0, 0], ['open']]);
  assert.deepEqual(grid.selection, { row: 0, col: 0 });
  assert.equal(event.prevented, true);
  assert.equal(event.stopped, true);
});

test('open Grid combo keeps arrow navigation inside the popup when focus returns to Grid root', function() {
  var FabGrid = createFabGridFactory({});
  [false, true].forEach(function(editOnSelect) {
    var ownerDocument = {};
    var root = { nodeType: 1, tagName: 'DIV', className: 'fg-root', parentNode: null, ownerDocument: ownerDocument };
    var popup = popupFixture(items);
    var grid = {
      root: root,
      editor: {},
      selection: { row: 0, col: 0 },
      options: { editOnSelect: editOnSelect },
      editing: { row: 0, col: 0 },
      editorConfig: { type: 'combo' },
      comboPopup: popup,
      isHeaderToggleKey: function() { return false; },
      isComboboxPanelOpen: function() { return popup.visible; },
      handleComboboxKeyDown: FabGrid.prototype.handleComboboxKeyDown,
      commitEditingAndMoveVertical: function() { assert.fail('popup navigation must not commit or move Grid rows'); }
    };
    ownerDocument.activeElement = root;
    ['ArrowDown', 'ArrowUp'].forEach(function(key, index) {
      var event = keyEvent(key, { target: root });
      FabGrid.prototype.handleKeyDown.call(grid, event);
      assert.equal(popup.visible, true);
      assert.equal(popup.activeIndex, index === 0 ? 2 : 0);
      assert.equal(event.prevented, true);
      assert.equal(event.stopped, true);
      assert.deepEqual(grid.selection, { row: 0, col: 0 });
      assert.deepEqual(popup.selected, []);
    });
  });
});
