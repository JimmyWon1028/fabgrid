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
