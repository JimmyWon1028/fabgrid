import test from 'node:test';
import assert from 'node:assert/strict';
import { installFabGridDrag } from '../src/grid/fabgrid-drag.js';

function createGrid(rows, allowDragging) {
  function TestGrid() {}
  installFabGridDrag(TestGrid, {});
  var grid = new TestGrid();
  grid.options = {
    allowDragging: allowDragging,
    remote: false
  };
  grid.source = rows.slice();
  grid.isTreeGrid = function() { return false; };
  grid.refreshRowsAfterDrop = function() {};
  return grid;
}

test('row dragging modes enable rows and all for local data', function() {
  var grid = createGrid([], 'Rows');
  assert.equal(grid.canDragRows(), true);
  grid.options.allowDragging = 'All';
  assert.equal(grid.canDragRows(), true);
  grid.options.allowDragging = 'Columns';
  assert.equal(grid.canDragRows(), false);
  grid.options.allowDragging = 'Rows';
  grid.options.remote = true;
  assert.equal(grid.canDragRows(), false);
});

test('flat row helpers reorder, insert and remove items', function() {
  var a = { id: 'A' };
  var b = { id: 'B' };
  var c = { id: 'C' };
  var x = { id: 'X' };
  var grid = createGrid([a, b, c], 'Rows');
  assert.ok(grid.moveFlatRowItem(c, a, 'before', true));
  assert.deepEqual(grid.source, [c, a, b]);
  assert.ok(grid.insertFlatRowItem(x, a, 'after', true));
  assert.deepEqual(grid.source, [c, a, x, b]);
  assert.equal(grid.removeRowItem(a, true), true);
  assert.deepEqual(grid.source, [c, x, b]);
});

test('row drag document handlers are bound only while a pointer drag is active', function() {
  var grid = createGrid([], 'Rows');
  var originalDocument = globalThis.document;
  var added = [];
  var removed = [];

  globalThis.document = {
    addEventListener: function(name, handler) { added.push([name, handler]); },
    removeEventListener: function(name, handler) { removed.push([name, handler]); }
  };
  try {
    grid._boundRowPointerMove = function() {};
    grid._boundRowPointerUp = function() {};
    grid._boundRowPointerCancel = function() {};

    grid.bindActiveRowDragEvents();
    grid.bindActiveRowDragEvents();
    assert.equal(added.length, 3);
    assert.equal(grid.activeRowDragEventsBound, true);

    grid.unbindActiveRowDragEvents();
    grid.unbindActiveRowDragEvents();
    assert.equal(removed.length, 3);
    assert.equal(grid.activeRowDragEventsBound, false);
  } finally {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  }
});
