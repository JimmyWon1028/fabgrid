import test from 'node:test';
import assert from 'node:assert/strict';
import fabui from '../src/fabui.js';

test('FabUI publishes Row and GroupRow through FabGrid only', function() {
  assert.equal(typeof fabui.FabGrid.Row, 'function');
  assert.equal(typeof fabui.FabGrid.GroupRow, 'function');
  assert.equal(Object.getPrototypeOf(fabui.FabGrid.GroupRow.prototype), fabui.FabGrid.Row.prototype);
  assert.equal(fabui.grid, undefined);
});
