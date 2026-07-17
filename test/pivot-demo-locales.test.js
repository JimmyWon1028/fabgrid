import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPivotDemoLocale,
  PIVOT_DEMO_LOCALES
} from '../demo/js/pivot-locales.js?v=20260717-pivot-chart-locale-v1';

test('Pivot Demo localizes every chart type without changing API values', function() {
  assert.deepEqual(Object.keys(PIVOT_DEMO_LOCALES.en.chartTypes), [
    'Column',
    'Bar',
    'Line',
    'Pie'
  ]);
  assert.deepEqual(PIVOT_DEMO_LOCALES['zh-TW'].chartTypes, {
    Column: '直條圖',
    Bar: '橫條圖',
    Line: '折線圖',
    Pie: '圓餅圖'
  });
  assert.deepEqual(PIVOT_DEMO_LOCALES['zh-CN'].chartTypes, {
    Column: '柱状图',
    Bar: '条形图',
    Line: '折线图',
    Pie: '饼图'
  });
});

test('Pivot Demo locale falls back to English', function() {
  assert.equal(getPivotDemoLocale('zh-TW'), PIVOT_DEMO_LOCALES['zh-TW']);
  assert.equal(getPivotDemoLocale('unknown'), PIVOT_DEMO_LOCALES.en);
});
