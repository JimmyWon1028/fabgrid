import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CollectionView } from '../src/collections/collection-view.js';
import {
  createChartNamespace,
  normalizeChartLocale,
  normalizeChartTheme,
  normalizeChartType
} from '../src/chart/chart.js';

test('Chart publishes the Wijmo-style fabui.chart namespace structure', function() {
  var chart = createChartNamespace();

  assert.equal(typeof chart.Chart, 'function');
  assert.equal(typeof chart.Pie, 'function');
  assert.equal(Object.getPrototypeOf(chart.Pie.prototype), chart.Chart.prototype);
  assert.equal(chart.ChartType.Pie, 'Pie');
  assert.equal(chart.Position.Top, 'Top');
  assert.equal(chart.SelectionMode.Point, 'Point');
  assert.equal(typeof chart.animation.ChartAnimation, 'function');
  assert.equal(chart.animation.AnimationMode.Series, 'Series');
  assert.equal(chart.animation.Easing.Swing, 'Swing');
  assert.equal(chart.Chart.prototype.bindSelectionSource, undefined);
});

test('ChartAnimation attaches to Chart with Wijmo-style options and ended event', async function() {
  var namespace = createChartNamespace();
  var fakeChart = Object.create(namespace.Chart.prototype);
  var animation;
  var endedCount = 0;
  var endedHandler = function(sender) {
    assert.equal(sender, animation);
    endedCount += 1;
  };

  fakeChart.options = { animation: false };
  fakeChart.disposed = false;
  fakeChart.playAnimation = function() {
    this._chartAnimation._handleAnimationStart();
  };
  animation = new namespace.animation.ChartAnimation(fakeChart, {
    animationMode: namespace.animation.AnimationMode.Point,
    axisAnimation: true,
    duration: 1,
    easing: namespace.animation.Easing.Linear
  });
  animation.ended.addHandler(endedHandler);
  animation.animate();

  assert.equal(animation.chart, fakeChart);
  assert.equal(animation.animationMode, 'Point');
  assert.equal(animation.axisAnimation, true);
  assert.equal(animation.duration, 1);
  assert.equal(animation.easing, 'Linear');
  assert.equal(fakeChart.options.animation, true);

  await new Promise(function(resolve) {
    setTimeout(resolve, 10);
  });
  assert.equal(endedCount, 1);

  animation.ended.removeHandler(endedHandler);
  animation.animate();
  await new Promise(function(resolve) {
    setTimeout(resolve, 10);
  });
  assert.equal(endedCount, 1);
});

test('ChartAnimation rejects unsupported chart instances', function() {
  var namespace = createChartNamespace();
  assert.throws(function() {
    return new namespace.animation.ChartAnimation({});
  }, /requires a fabui\.chart\.Chart or fabui\.chart\.Pie instance/);
});

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

test('Chart disables polling when data observation is disabled', function() {
  var source = fs.readFileSync('src/chart/chart.js', 'utf8');
  assert.match(
    source,
    /startDataObserver[\s\S]*stopDataObserver\(\)[\s\S]*observeData === false\) return/
  );
  assert.match(
    source,
    /name === 'observeData' \|\| name === 'dataRefreshInterval'[\s\S]*startDataObserver/
  );
  assert.match(source, /Chart\.prototype\.stopDataObserver/);
  assert.match(source, /Chart\.prototype\.dispose[\s\S]*this\.stopDataObserver\(\)/);
});

test('Chart reuses parsed binding paths during render and data observation', function() {
  var source = fs.readFileSync('src/chart/chart.js', 'utf8');
  assert.match(source, /bindingPathCache = Object\.create\(null\)/);
  assert.match(source, /parts = bindingPathCache\[key\]/);
  assert.match(source, /bindingPathCache\[key\] = parts/);
});

test('Chart source demo follows the filtered FabGrid view', function() {
  var source = fs.readFileSync('demo/dev-grid-chart.html', 'utf8');
  assert.match(source, /new fabui\.collections\.CollectionView\(itemsSource\)/);
  assert.equal((source.match(/itemsSource: collections/g) || []).length, 4);
  assert.doesNotMatch(source, /filterChanged\.addHandler/);
  assert.doesNotMatch(source, /selectionSource\s*:/);
});

test('Chart follows CollectionView items and current position', function() {
  var namespace = createChartNamespace();
  var rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
  var view = new CollectionView(rows);
  var fakeChart = Object.create(namespace.Chart.prototype);
  var refreshCount = 0;
  var selectedIndex = -1;

  fakeChart.options = {};
  fakeChart.refresh = function() {
    refreshCount += 1;
  };
  fakeChart.selectPoint = function(index) {
    selectedIndex = index;
    return this;
  };
  fakeChart.bindItemsSource(view, false);

  assert.equal(fakeChart.options.itemsSource, view);
  assert.equal(selectedIndex, 0);
  view.moveCurrentToPosition(2);
  assert.equal(selectedIndex, 2);
  view.filter = function(item) {
    return item.id >= 2;
  };
  assert.equal(refreshCount, 1);
  assert.deepEqual(view.items, [rows[1], rows[2]]);
  assert.equal(selectedIndex, 1);

  fakeChart.unbindItemsSource();
  view.moveCurrentToPosition(0);
  assert.equal(selectedIndex, 1);
});
