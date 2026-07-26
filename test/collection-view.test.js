import test from 'node:test';
import assert from 'node:assert/strict';
import { CollectionView, isCollectionView } from '../src/collections/collection-view.js';

test('CollectionView exposes source data and filtered items', function() {
  var rows = [
    { id: 1, active: true },
    { id: 2, active: false },
    { id: 3, active: true }
  ];
  var view = new CollectionView(rows);
  var changed = 0;

  view.collectionChanged.addHandler(function(sender, args) {
    assert.equal(sender, view);
    assert.equal(args.action, 'reset');
    changed += 1;
  });
  view.filter = function(item) {
    return item.active;
  };

  assert.equal(isCollectionView(view), true);
  assert.equal(view.sourceCollection, rows);
  assert.deepEqual(view.items, [rows[0], rows[2]]);
  assert.equal(view.itemCount, 2);
  assert.equal(view.isEmpty, false);
  assert.equal(changed, 1);
});

test('CollectionView synchronizes current item and position', function() {
  var rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
  var view = new CollectionView(rows);
  var changes = [];

  view.currentChanged.addHandler(function(sender, args) {
    changes.push({
      item: args.item,
      position: args.position
    });
  });

  assert.equal(view.currentItem, rows[0]);
  assert.equal(view.currentPosition, 0);
  assert.equal(view.moveCurrentTo(rows[2]), true);
  assert.equal(view.currentItem, rows[2]);
  assert.equal(view.currentPosition, 2);
  assert.equal(changes.length, 1);
  assert.equal(view.moveCurrentTo({ id: 4 }), false);
});

test('CollectionView combines control filters without replacing its public filter', function() {
  var owner = {};
  var rows = [
    { id: 1, active: true },
    { id: 2, active: true },
    { id: 3, active: false }
  ];
  var view = new CollectionView(rows, {
    filter: function(item) {
      return item.active;
    }
  });

  view._setConsumerFilter(owner, function(item) {
    return item.id > 1;
  });
  assert.deepEqual(view.items, [rows[1]]);

  view._setConsumerFilter(owner, null);
  assert.deepEqual(view.items, [rows[0], rows[1]]);
});

test('CollectionView applies and removes a control sorter', function() {
  var owner = {};
  var rows = [
    { id: 1, amount: 20 },
    { id: 2, amount: 10 },
    { id: 3, amount: 30 }
  ];
  var view = new CollectionView(rows);

  view.moveCurrentTo(rows[1]);
  view._setConsumerSort(owner, function(items) {
    return items.sort(function(a, b) {
      return b.amount - a.amount;
    });
  });

  assert.deepEqual(view.items, [rows[2], rows[0], rows[1]]);
  assert.equal(view.currentItem, rows[1]);
  assert.equal(view.currentPosition, 2);

  view._setConsumerSort(owner, null);
  assert.deepEqual(view.items, rows);
  assert.equal(view.currentPosition, 1);
});

test('CollectionView defers refresh notifications', function() {
  var rows = [{ id: 1 }, { id: 2 }];
  var view = new CollectionView(rows);
  var changed = 0;

  view.collectionChanged.addHandler(function() {
    changed += 1;
  });
  view.deferUpdate(function() {
    view.filter = function(item) {
      return item.id === 2;
    };
    view.refresh();
  });

  assert.equal(changed, 1);
  assert.deepEqual(view.items, [rows[1]]);
});
