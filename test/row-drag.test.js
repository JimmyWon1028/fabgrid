import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRowDropIndicatorWidth,
  installFabGridDrag
} from '../src/grid/fabgrid-drag.js';

function createGrid(rows, allowDragging) {
  function TestGrid() {}
  installFabGridDrag(TestGrid, {});
  var grid = new TestGrid();
  grid.options = {
    allowDragging: allowDragging,
    remote: false,
    rowDropHandler: null
  };
  grid.source = rows.slice();
  grid.disposed = false;
  grid._rowDropSeq = 0;
  grid._rowDropPending = false;
  grid._rowDropPendingSeq = 0;
  grid.emitted = [];
  grid.emit = function(name, args) {
    this.emitted.push({ name: name, args: args });
    return true;
  };
  grid.isTreeGrid = function() { return false; };
  grid.refreshCount = 0;
  grid.refreshRowsAfterDrop = function() { this.refreshCount += 1; };
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

test('row drop indicator width stops at the column area and excludes the vertical scrollbar', function() {
  assert.equal(calculateRowDropIndicatorWidth(800, 46, 420, 12), 466);
  assert.equal(calculateRowDropIndicatorWidth(800, 46, 1200, 12), 788);
  assert.equal(calculateRowDropIndicatorWidth(800, 0, 0, 12), 0);
  assert.equal(calculateRowDropIndicatorWidth(-1, 46, 420, 12), 0);
});

test('row drop indicator uses the calculated column area width', function() {
  var grid = createGrid([], 'Rows');
  var originalDocument = globalThis.document;
  var indicator = {
    className: '',
    style: {},
    setAttribute: function() {}
  };
  grid.root = {
    appendChild: function() {},
    classList: { add: function() {} },
    getBoundingClientRect: function() {
      return { left: 100, top: 20 };
    }
  };
  grid.body = {
    getBoundingClientRect: function() {
      return { left: 100, bottom: 520, width: 800 };
    }
  };
  grid.totalWidth = 420;
  grid.getFixedLeftWidth = function() { return 46; };
  grid.getVerticalScrollbarGutterSize = function() { return 12; };

  globalThis.document = {
    createElement: function() {
      return indicator;
    }
  };
  try {
    grid.showRowDropIndicator({
      element: {
        getBoundingClientRect: function() {
          return { top: 120, bottom: 150, height: 30 };
        }
      },
      position: 'before'
    });
    assert.equal(indicator.style.left, '0px');
    assert.equal(indicator.style.width, '466px');
  } finally {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  }
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

test('async rowDropHandler copies the resolved item without removing the source row', async function() {
  var sourceItem = { id: 'A' };
  var targetItem = { id: 'T' };
  var copiedItem = { id: 'A', children: [{ id: 'A1' }] };
  var source = createGrid([sourceItem], 'Rows');
  var target = createGrid([targetItem], 'Rows');
  var result;
  target.options.rowDropHandler = function(args) {
    assert.equal(args.sourceItem, sourceItem);
    assert.equal(args.targetItem, targetItem);
    assert.equal(args.position, 'after');
    return Promise.resolve({ action: 'copy', item: copiedItem });
  };

  result = await target.performRowDrop({ sourceGrid: source, sourceRow: 0, item: sourceItem }, {
    row: 0,
    item: targetItem,
    position: 'after'
  });

  assert.ok(result);
  assert.deepEqual(source.source, [sourceItem]);
  assert.deepEqual(target.source, [targetItem, copiedItem]);
  assert.equal(source.refreshCount, 0);
  assert.equal(target.refreshCount, 1);
  assert.equal(target.emitted[0].name, 'draggedRow');
  assert.equal(target.emitted[0].args.action, 'copy');
  assert.equal(target.emitted[0].args.sourceItem, sourceItem);
  assert.equal(target.emitted[0].args.item, copiedItem);
  assert.equal(source.emitted[0].args.role, 'source');
  assert.equal(source._rowDropPending, false);
  assert.equal(target._rowDropPending, false);
});

test('async rowDropHandler rejection preserves both grids and emits rowDropFailed', async function() {
  var sourceItem = { id: 'A' };
  var targetItem = { id: 'T' };
  var source = createGrid([sourceItem], 'Rows');
  var target = createGrid([targetItem], 'Rows');
  target.options.rowDropHandler = function() {
    return Promise.reject(new Error('load failed'));
  };

  assert.equal(await target.performRowDrop({ sourceGrid: source, sourceRow: 0, item: sourceItem }, {
    row: 0,
    item: targetItem,
    position: 'after'
  }), false);
  assert.deepEqual(source.source, [sourceItem]);
  assert.deepEqual(target.source, [targetItem]);
  assert.equal(target.emitted[0].name, 'rowDropFailed');
  assert.equal(target.emitted[0].args.error.message, 'load failed');
  assert.equal(source.emitted[0].name, 'rowDropFailed');
});

test('disposed async row drop ignores its late result', async function() {
  var sourceItem = { id: 'A' };
  var targetItem = { id: 'T' };
  var source = createGrid([sourceItem], 'Rows');
  var target = createGrid([targetItem], 'Rows');
  var resolveDrop;
  target.options.rowDropHandler = function() {
    return new Promise(function(resolve) {
      resolveDrop = resolve;
    });
  };

  var pending = target.performRowDrop({ sourceGrid: source, sourceRow: 0, item: sourceItem }, {
    row: 0,
    item: targetItem,
    position: 'after'
  });
  target.disposed = true;
  target._rowDropSeq += 1;
  target._rowDropPending = false;
  target._rowDropPendingSeq = 0;
  resolveDrop({ action: 'copy', item: { id: 'late' } });

  assert.equal(await pending, false);
  assert.deepEqual(target.source, [targetItem]);
  assert.equal(target.emitted.length, 0);
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
