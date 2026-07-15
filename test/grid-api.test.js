import test from 'node:test';
import assert from 'node:assert/strict';
import { createFabGridFactory } from '../src/grid/fabgrid.js';

test('setRowHeaderWidth normalizes the width and refreshes the grid', function() {
  var FabGrid = createFabGridFactory({});
  var refreshCount = 0;
  var grid = {
    options: { rowHeaderWidth: 60 },
    refresh: function() {
      refreshCount += 1;
    }
  };

  FabGrid.prototype.setRowHeaderWidth.call(grid, 80);
  assert.equal(grid.options.rowHeaderWidth, 80);
  assert.equal(refreshCount, 1);

  FabGrid.prototype.setRowHeaderWidth.call(grid, -20);
  assert.equal(grid.options.rowHeaderWidth, 0);
  assert.equal(refreshCount, 2);

  FabGrid.prototype.setRowHeaderWidth.call(grid, 'invalid');
  assert.equal(grid.options.rowHeaderWidth, 60);
  assert.equal(refreshCount, 3);
});

test('active cell border defaults to two pixels', function() {
  var FabGrid = createFabGridFactory({});
  var descriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'activeCellBorder');
  var applyCount = 0;
  var grid = {
    options: {},
    applyThemeOptions: function() {
      applyCount += 1;
    }
  };

  assert.equal(descriptor.get.call(grid), 2);
  descriptor.set.call(grid, 'invalid');
  assert.equal(grid.options.activeCellBorder, 2);
  assert.equal(applyCount, 1);
});

test('frozen divider decorates only actual boundary cells', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    frozenColumns: 2,
    scrollableColumnEnd: 6,
    frozenRightWidth: 120
  };
  var leftCell = { className: 'fg-cell' };
  var scrollCell = { className: 'fg-cell' };
  var rightCell = { className: 'fg-cell' };
  var normalCell = { className: 'fg-cell' };

  FabGrid.prototype.decorateFrozenDividerCell.call(grid, leftCell, 1, 'left');
  FabGrid.prototype.decorateFrozenDividerCell.call(grid, scrollCell, 5, 'scroll');
  FabGrid.prototype.decorateFrozenDividerCell.call(grid, rightCell, 6, 'right');
  FabGrid.prototype.decorateFrozenDividerCell.call(grid, normalCell, 4, 'scroll');

  assert.match(leftCell.className, /fg-frozen-divider-left/);
  assert.match(scrollCell.className, /fg-frozen-divider-right-neighbor/);
  assert.match(rightCell.className, /fg-frozen-divider-right/);
  assert.equal(normalCell.className, 'fg-cell');
});

test('filter changed is exposed as a Wijmo-compatible event', function() {
  var FabGrid = createFabGridFactory({});
  var grid = { wijmoEvents: {} };

  FabGrid.prototype.createWijmoEvents.call(grid);

  assert.equal(typeof grid.filterChanged.addHandler, 'function');
  assert.equal(grid.wijmoEvents.filterChanged, grid.filterChanged);
});

test('updated view can be bound from constructor options', function() {
  var FabGrid = createFabGridFactory({});
  var sender;
  var received;
  var grid = {
    wijmoEvents: {},
    options: {
      updatedView: function(value, args) {
        sender = value;
        received = args;
      }
    }
  };

  FabGrid.prototype.createWijmoEvents.call(grid);
  FabGrid.prototype.bindOptionEvent.call(grid, 'updatedView');
  grid.updatedView.raise(grid, { totalRows: 3 });

  assert.equal(sender, grid);
  assert.deepEqual(received, { totalRows: 3 });
});

test('search row mode changes clear the other column filter mode', function() {
  var FabGrid = createFabGridFactory({});
  var events = [];
  var applies = [];
  var grid = {
    options: { showSearchRow: false },
    searchText: 'quick',
    excelFilters: { country: { type: 'values', values: ['TW'] } },
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    cancelHeaderSearchTimer: function() {},
    hideFilterMenu: function() {},
    applyFilterChange: function(reset, source) {
      applies.push({ reset: reset, source: source });
    },
    emit: function(name, args) {
      events.push({ name: name, args: args });
    }
  };

  FabGrid.prototype.setShowSearchRow.call(grid, true);
  assert.deepEqual(grid.excelFilters, {});
  assert.equal(grid.searchText, 'quick');
  assert.equal(events[0].args.clearedFilter, true);

  grid.columnSearchValues = { country: 'T' };
  grid.columnSearchOperators = { country: 'starts' };
  grid.hasColumnSearch = true;
  FabGrid.prototype.setShowSearchRow.call(grid, false);

  assert.deepEqual(grid.columnSearchValues, {});
  assert.deepEqual(grid.columnSearchOperators, {});
  assert.equal(grid.hasColumnSearch, false);
  assert.equal(grid.searchText, 'quick');
  assert.deepEqual(applies, [
    { reset: true, source: 'searchRowVisibility' },
    { reset: true, source: 'searchRowVisibility' }
  ]);
});

test('excel value filters are applied only while search row is hidden', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'country', dataType: 'string', visible: true },
    { binding: 'amount', dataType: 'number', visible: true }
  ];
  var grid = {
    options: {
      showSearchRow: false,
      remote: false,
      pagination: false,
      rowGroups: []
    },
    source: [
      { country: 'Taiwan', amount: 10 },
      { country: 'Japan', amount: 20 },
      { country: 'Germany', amount: 30 }
    ],
    columns: columns,
    excelFilters: { 'binding:country': { type: 'values', values: ['Taiwan', 'Japan'] } },
    filterPredicate: null,
    searchText: '',
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    getSortStates: function() { return []; },
    captureSelectionState: function() { return null; },
    isTreeGrid: function() { return false; },
    createGroupedView: function(rows) { return rows; },
    refreshInvalidItemRows: function() {},
    restoreSelectionState: function() {},
    clampSelection: function() {},
    syncEditingWithView: function() {}
  };

  FabGrid.prototype.applyView.call(grid);
  assert.deepEqual(grid.view.map(function(item) { return item.country; }), ['Taiwan', 'Japan']);

  grid.options.showSearchRow = true;
  FabGrid.prototype.applyView.call(grid);
  assert.equal(grid.view.length, 3);
});
