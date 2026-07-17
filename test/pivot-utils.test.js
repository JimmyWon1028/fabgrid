import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPivotPathKey,
  isPivotPathPrefix,
  pivotValuesEqual
} from '../src/pivot/pivot-utils.js?v=20260717-pivot-typed-values-v1';

test('Pivot typed values compare Dates and serialized Date strings by value', function() {
  var date = new Date(2026, 0, 1);

  assert.equal(pivotValuesEqual(date, new Date(date.getTime())), true);
  assert.equal(pivotValuesEqual(date.toJSON(), date, 'date'), true);
  assert.equal(pivotValuesEqual(NaN, NaN), true);
});

test('Pivot path helpers preserve typed keys and Date-aware ancestry', function() {
  var first = new Date(2026, 0, 1);
  var second = new Date(2026, 1, 1);

  assert.equal(createPivotPathKey([first]), createPivotPathKey([new Date(first.getTime())]));
  assert.notEqual(createPivotPathKey([first]), createPivotPathKey([second]));
  assert.equal(isPivotPathPrefix([first], [new Date(first.getTime()), 'North']), true);
  assert.equal(isPivotPathPrefix([first], [second, 'North']), false);
});
