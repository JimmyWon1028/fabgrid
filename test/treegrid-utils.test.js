import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVisibleTreeRows,
  createTreeLevelGradient,
  findTreeItemLocation,
  getTreeLevelBandLayout,
  getTreeChildren,
  installFabGridTree,
  isolateTreeCellTextDecoration,
  isTreeItemDescendant,
  moveTreeItemInSource,
  normalizeTreeLevelColorOpacities,
  normalizeTreeLevelColors
} from '../src/grid/fabgrid-tree.js';
import { getByBinding, setByBinding } from '../src/grid/fabgrid-data.js';

function createTree() {
  return [
    {
      id: 'A',
      name: 'Alpha',
      children: [
        { id: 'A2', name: 'Zulu' },
        { id: 'A1', name: 'Echo', children: [{ id: 'A11', name: 'Target' }] }
      ]
    },
    { id: 'B', name: 'Beta', children: [{ id: 'B1', name: 'Lima' }] }
  ];
}

function build(rows, options) {
  options = options || {};
  return buildVisibleTreeRows(rows, {
    filtering: options.filtering === true,
    matches: options.matches || function() { return true; },
    searching: options.searching === true,
    matchesSearch: options.matchesSearch || function() { return true; },
    includeSearchDescendants: options.includeSearchDescendants === true,
    compare: options.compare || null,
    getChildren: function(item) { return item.children || []; },
    isCollapsed: options.isCollapsed || function() { return false; }
  });
}

test('tree children support binding paths and callback paths', function() {
  var item = { nested: { rows: [{ id: 1 }] } };
  assert.deepEqual(getTreeChildren(item, 'nested.rows', getByBinding, null), [{ id: 1 }]);
  assert.deepEqual(getTreeChildren(item, function(value) { return value.nested.rows; }, getByBinding, null), [{ id: 1 }]);
  assert.deepEqual(getTreeChildren(item, 'missing', getByBinding, null), []);
});

test('tree rows flatten depth-first and expose row metadata', function() {
  var result = build(createTree());
  assert.deepEqual(result.rows.map(function(item) { return item.id; }), ['A', 'A2', 'A1', 'A11', 'B', 'B1']);
  assert.deepEqual(result.infos.map(function(info) { return info.level; }), [0, 1, 1, 2, 0, 1]);
  assert.deepEqual(result.infos.map(function(info) { return info.rowNumber; }), [1, 2, 3, 4, 5, 6]);
  assert.equal(result.infos[2].parentItem.id, 'A');
  assert.equal(result.infos[2].hasChildren, true);
  assert.equal(result.totalRoots, 2);
});

test('collapsed tree nodes remove descendants from the visible rows', function() {
  var tree = createTree();
  var result = build(tree, {
    isCollapsed: function(item) { return item.id === 'A'; }
  });
  assert.deepEqual(result.rows.map(function(item) { return item.id; }), ['A', 'B', 'B1']);
  assert.deepEqual(result.infos.map(function(info) { return info.rowNumber; }), [1, 5, 6]);
  assert.equal(result.infos[0].collapsed, true);
});

test('tree filtering preserves ancestors and expands the matching path', function() {
  var tree = createTree();
  var result = build(tree, {
    filtering: true,
    matches: function(item) { return item.name === 'Target'; },
    isCollapsed: function() { return true; }
  });
  assert.deepEqual(result.rows.map(function(item) { return item.id; }), ['A', 'A1', 'A11']);
  assert.deepEqual(result.infos.map(function(info) { return info.collapsed; }), [false, false, false]);
  assert.deepEqual(result.infos.map(function(info) { return info.rowNumber; }), [1, 3, 4]);
});

test('tree search children mode keeps descendants of matching nodes and required ancestors', function() {
  var tree = createTree();
  var result = build(tree, {
    filtering: true,
    searching: true,
    includeSearchDescendants: true,
    matchesSearch: function(item) { return item.name === 'Alpha'; }
  });
  assert.deepEqual(result.rows.map(function(item) { return item.id; }), ['A', 'A2', 'A1', 'A11']);

  result = build(tree, {
    filtering: true,
    searching: true,
    includeSearchDescendants: true,
    matchesSearch: function(item) { return item.name === 'Target'; }
  });
  assert.deepEqual(result.rows.map(function(item) { return item.id; }), ['A', 'A1', 'A11']);
});

test('tree search children mode still applies non-search filters to descendants', function() {
  var result = build(createTree(), {
    filtering: true,
    searching: true,
    includeSearchDescendants: true,
    matches: function(item) { return item.id !== 'A2'; },
    matchesSearch: function(item) { return item.name === 'Alpha'; }
  });
  assert.deepEqual(result.rows.map(function(item) { return item.id; }), ['A', 'A1', 'A11']);
});

test('tree level colors accept dollar-prefixed hexadecimal values and cycle by level', function() {
  assert.deepEqual(normalizeTreeLevelColors([
    '$ff0000',
    '$00FF00',
    '#0000ff',
    'red'
  ]), ['#ff0000', '#00FF00']);
  assert.equal(
    createTreeLevelGradient(['$ff0000', '$00ff00'], 2, 18),
    'linear-gradient(to right, #ff0000 0px, #ff0000 18px, #00ff00 18px, #00ff00 36px, #ff0000 36px, #ff0000 54px)'
  );
  assert.equal(createTreeLevelGradient(['#ff0000'], 1, 18), '');
});

test('tree level color opacities apply per band and preserve opaque defaults', function() {
  assert.deepEqual(
    normalizeTreeLevelColorOpacities([0.4, 0.15, -1, 2, '0.5', null]),
    [0.4, 0.15, 0, 1, 1, 1]
  );
  assert.equal(
    createTreeLevelGradient(['$ffff00', '$00ff00'], 2, 18, [0.4, 0.15]),
    'linear-gradient(to right, rgba(255, 255, 0, 0.4) 0px, rgba(255, 255, 0, 0.4) 18px, rgba(0, 255, 0, 0.15) 18px, rgba(0, 255, 0, 0.15) 36px, rgba(255, 255, 0, 0.4) 36px, rgba(255, 255, 0, 0.4) 54px)'
  );
});

test('tree level band layout centers the expander in its current color band', function() {
  assert.deepEqual(getTreeLevelBandLayout(0, 18), {
    width: 18,
    expanderLeft: 0,
    expanderWidth: 18,
    contentPaddingLeft: 25
  });
  assert.deepEqual(getTreeLevelBandLayout(2, 18), {
    width: 54,
    expanderLeft: 36,
    expanderWidth: 18,
    contentPaddingLeft: 61
  });
});

test('tree cell text decoration stays on content instead of the expander', function() {
  var cell = {
    style: {
      textDecoration: '',
      textDecorationLine: 'underline',
      textDecorationStyle: 'dotted',
      textDecorationColor: '',
      textDecorationThickness: ''
    }
  };
  var content = { style: {} };
  assert.equal(isolateTreeCellTextDecoration(cell, content), true);
  assert.equal(cell.style.textDecoration, 'none');
  assert.equal(content.style.textDecorationLine, 'underline');
  assert.equal(content.style.textDecorationStyle, 'dotted');
});

test('tree sorting only changes sibling order', function() {
  var result = build(createTree(), {
    compare: function(a, b) { return a.name.localeCompare(b.name); }
  });
  assert.deepEqual(result.rows.map(function(item) { return item.id; }), ['A', 'A1', 'A11', 'A2', 'B', 'B1']);
});

test('tree locations and descendant checks cover nested items', function() {
  var tree = createTree();
  var location = findTreeItemLocation(tree, tree[0].children[1].children[0], function(item) {
    return item.children || [];
  });
  assert.equal(location.parentItem.id, 'A1');
  assert.equal(location.index, 0);
  assert.equal(isTreeItemDescendant(tree[0], tree[0].children[1].children[0], function(item) {
    return item.children || [];
  }), true);
  assert.equal(isTreeItemDescendant(tree[1], tree[0], function(item) {
    return item.children || [];
  }), false);
});

test('tree moves support before, inside and cycle protection', function() {
  var tree = createTree();
  var getChildren = function(item) { return item.children || []; };
  var ensureChildren = function(item) {
    item.children = item.children || [];
    return item.children;
  };
  var a = tree[0];
  var a2 = a.children[0];
  var a1 = a.children[1];
  var b = tree[1];
  var b1 = b.children[0];
  assert.ok(moveTreeItemInSource(tree, a2, b, 'inside', getChildren, ensureChildren));
  assert.deepEqual(b.children.map(function(item) { return item.id; }), ['B1', 'A2']);
  assert.ok(moveTreeItemInSource(tree, b1, a, 'before', getChildren, ensureChildren));
  assert.deepEqual(tree.map(function(item) { return item.id; }), ['B1', 'A', 'B']);
  assert.equal(moveTreeItemInSource(tree, a, a1, 'inside', getChildren, ensureChildren), null);
  assert.deepEqual(tree.map(function(item) { return item.id; }), ['B1', 'A', 'B']);
});

test('tree moves accept an external item', function() {
  var tree = createTree();
  var external = { id: 'X', name: 'External' };
  var getChildren = function(item) { return item.children || []; };
  var result = moveTreeItemInSource(tree, external, tree[0], 'inside', getChildren, function(item) {
    item.children = item.children || [];
    return item.children;
  });
  assert.equal(result.external, true);
  assert.equal(result.parentItem, tree[0]);
  assert.equal(tree[0].children[tree[0].children.length - 1], external);
});

test('tree installer collapses nodes by level and exposes descriptors', function() {
  function TestGrid() {}
  installFabGridTree(TestGrid, { getByBinding: getByBinding, setByBinding: setByBinding });
  var grid = new TestGrid();
  grid.options = { childItemsPath: 'children', treeColumn: 0, treeIndent: 20 };
  grid.source = createTree();
  grid.view = [];
  grid.visibleColumns = [{ binding: 'name' }];
  grid.selection = { row: 0, col: 0 };
  grid.rowSelection = 0;
  grid.resetTreeState();
  grid.applyView = function() {
    this.view = this.createTreeView(this.source, {});
  };
  grid.clampSelection = function() {};
  grid.render = function() {};
  grid.refresh = function() {};
  grid.resetVerticalScroll = function() {};
  grid.emit = function() { return true; };
  grid.getColumn = function() { return this.visibleColumns[0]; };

  grid.applyView();
  assert.equal(grid.view.length, 6);
  assert.equal(grid.collapseGroupsToLevel(1), true);
  assert.deepEqual(grid.view.map(function(item) { return item.id; }), ['A', 'A2', 'A1', 'B', 'B1']);
  assert.equal(grid.getTreeRow(2).level, 1);
  assert.equal(grid.getTreeRow(2).rowNumber, 3);
  assert.equal(grid.getTreeRow(2).isCollapsed, true);
  assert.equal(grid._treeCollapsedSet.has(grid.view[2]), true);
  assert.equal(grid.expandAllTreeNodes(), true);
  assert.equal(grid.view.length, 6);
  assert.equal(grid._treeCollapsedSet.has(grid.source[0]), false);
});
