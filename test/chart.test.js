import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  normalizeChartLocale,
  normalizeChartTheme,
  normalizeChartType
} from '../src/chart/chart.js';

test('Chart supports only the four documented chart types', function() {
  assert.equal(normalizeChartType('column'), 'column');
  assert.equal(normalizeChartType('bar'), 'bar');
  assert.equal(normalizeChartType('line'), 'line');
  assert.equal(normalizeChartType('pie'), 'pie');
  assert.equal(normalizeChartType('Column'), 'column');
  assert.equal(normalizeChartType('LineSymbols'), 'line');
  assert.equal(normalizeChartType('unknown'), 'column');
});

test('Chart normalizes built-in locales and themes', function() {
  assert.equal(normalizeChartLocale('zh-Hant'), 'zh-TW');
  assert.equal(normalizeChartLocale('zh_CN'), 'zh-CN');
  assert.equal(normalizeChartLocale('fr'), 'en');
  assert.equal(normalizeChartTheme('dark-hive'), 'dark-hive');
  assert.equal(normalizeChartTheme('pepper'), 'pepper-grinder');
});

test('Chart keeps the public tooltip option separate from its tooltip element', function() {
  var source = fs.readFileSync('src/chart/chart.js', 'utf8');
  assert.match(source, /this\.tooltipElement = document\.createElement\('div'\)/);
  assert.match(source, /this\.tooltipElement\.classList\.remove/);
  assert.doesNotMatch(source, /this\.tooltip = document\.createElement/);
});
