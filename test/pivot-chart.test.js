import test from 'node:test';
import assert from 'node:assert/strict';
import fabui from '../src/fabui.js';
import {
  createPivotChartModel,
  createPivotChartOptions,
  createPivotGridChartView,
  resolvePivotChartPoint,
  resolvePivotGridCell
} from '../src/pivot/pivot-chart.js?v=20260717-pivot-chart-collapse-v1';

function createEngine() {
  return new fabui.pivot.PivotEngine({
    itemsSource: [
      { quarter: 'Q1', platform: 'Web', sales: 10, downloads: 4 },
      { quarter: 'Q1', platform: 'Mobile', sales: 20, downloads: 7 },
      { quarter: 'Q2', platform: 'Web', sales: 30, downloads: 9 },
      { quarter: 'Q2', platform: 'Mobile', sales: 40, downloads: 12 }
    ],
    fields: [
      { binding: 'quarter', header: 'Quarter' },
      { binding: 'platform', header: 'Platform' },
      { binding: 'sales', header: 'Sales', dataType: 'number' },
      { binding: 'downloads', header: 'Downloads', dataType: 'number' }
    ],
    rowFields: ['quarter'],
    columnFields: ['platform'],
    valueFields: ['sales', 'downloads'],
    showRowTotals: 'Subtotals',
    showColumnTotals: 'Subtotals'
  });
}

function createNestedEngine() {
  return new fabui.pivot.PivotEngine({
    itemsSource: [
      { quarter: 'Q1', region: 'North', platform: 'Web', product: 'Basic', sales: 10 },
      { quarter: 'Q1', region: 'South', platform: 'Web', product: 'Pro', sales: 20 },
      { quarter: 'Q2', region: 'North', platform: 'Mobile', product: 'Basic', sales: 30 },
      { quarter: 'Q2', region: 'South', platform: 'Mobile', product: 'Pro', sales: 40 }
    ],
    fields: [
      { binding: 'quarter', header: 'Quarter' },
      { binding: 'region', header: 'Region' },
      { binding: 'platform', header: 'Platform' },
      { binding: 'product', header: 'Product' },
      { binding: 'sales', header: 'Sales', dataType: 'number' }
    ],
    rowFields: ['quarter', 'region'],
    columnFields: ['platform', 'product'],
    valueFields: ['sales'],
    showRowTotals: 'Subtotals',
    showColumnTotals: 'Subtotals'
  });
}

test('FabUI publishes PivotChart only through the pivot namespace', function() {
  assert.equal(typeof fabui.pivot.PivotChart, 'function');
  assert.equal(Object.getPrototypeOf(fabui.pivot.PivotChart.prototype), fabui.Control.prototype);
  assert.equal(fabui.PivotChart, undefined);
  assert.equal(fabui.pivot.PivotChart.ChartType.Pie, 'Pie');
});

test('PivotChart enables Pie selection and percentage labels by default', function() {
  var options = createPivotChartOptions();
  var disabled = createPivotChartOptions({
    selectionMode: 'None',
    dataLabel: null
  });

  assert.equal(options.selectionMode, 'Point');
  assert.equal(options.selectionSource, null);
  assert.deepEqual(options.dataLabel, {
    content: '{percent}%',
    position: 'Inside'
  });
  assert.equal(options.selectedItemPosition, 'Top');
  assert.equal(options.selectedItemOffset, .1);
  assert.equal(options.isAnimated, true);
  assert.equal(disabled.selectionMode, 'None');
  assert.equal(disabled.dataLabel, null);
});

test('PivotChart model maps leaf rows and columns without duplicate totals', function() {
  var engine = createEngine();
  var model = createPivotChartModel(engine.pivotView, {
    locale: 'en',
    totalText: 'Grand Total',
    maxPoints: 100,
    maxSeries: 12
  });

  assert.deepEqual(model.categories, ['Q1', 'Q2']);
  assert.deepEqual(model.rowKeys, engine.pivotView.rowEntries.filter(function(entry) {
    return entry.isLeaf;
  }).map(function(entry) {
    return entry.key;
  }));
  assert.deepEqual(model.series.map(function(series) { return series.name; }), [
    'Web · Sales',
    'Web · Downloads',
    'Mobile · Sales',
    'Mobile · Downloads'
  ]);
  assert.deepEqual(model.series[0].data, [10, 30]);
  assert.deepEqual(model.series[3].data, [7, 12]);
  assert.equal(model.pointCount, 2);
  assert.equal(model.seriesCount, 4);
  assert.equal(model.pointsTruncated, false);
  assert.equal(model.seriesTruncated, false);
});

test('PivotChart model can include totals and reports point and series limits', function() {
  var engine = createEngine();
  var model = createPivotChartModel(engine.pivotView, {
    showTotals: true,
    totalText: 'Grand Total',
    maxPoints: 2,
    maxSeries: 3
  });

  assert.deepEqual(model.categories, ['Q1', 'Q2']);
  assert.equal(model.pointCount, 3);
  assert.equal(model.seriesCount, 6);
  assert.equal(model.series.length, 3);
  assert.equal(model.pointsTruncated, true);
  assert.equal(model.seriesTruncated, true);
});

test('PivotChart model uses collapsed PivotGrid subtotals and expanded leaf entries', function() {
  var engine = createNestedEngine();
  var view = engine.pivotView;
  var collapsedRow = view.rowEntries.find(function(entry) {
    return entry.isSubtotal && entry.path[0] === 'Q1';
  });
  var collapsedColumn = view.columnEntries.find(function(entry) {
    return entry.isSubtotal && entry.path[0] === 'Web';
  });
  var rows = view.rows.filter(function(row) {
    var entry = row.__pivotMeta;
    return entry.key === collapsedRow.key ||
      entry.path[0] !== 'Q1';
  });
  var dataColumns = view.dataColumns.filter(function(dataColumn) {
    var entry = dataColumn.entry;
    return entry.key === collapsedColumn.key ||
      entry.path[0] !== 'Web';
  });
  var gridView = createPivotGridChartView({
    view: rows,
    visibleColumns: [
      { binding: '__pivot_row_0' },
      { binding: '__pivot_row_1' }
    ].concat(dataColumns.map(function(dataColumn) {
      return {
        binding: dataColumn.binding,
        _pivotDataColumn: dataColumn
      };
    }))
  }, view);
  var model = createPivotChartModel(gridView, {
    totalText: 'Grand Total',
    useVisibleEntries: true
  });

  assert.deepEqual(model.categories, ['Q1', 'Q2 / North', 'Q2 / South']);
  assert.deepEqual(model.series.map(function(series) {
    return series.name;
  }), ['Web', 'Mobile / Basic', 'Mobile / Pro']);
  assert.deepEqual(model.series[0].data, [30, undefined, undefined]);
  assert.deepEqual(model.series[1].data, [undefined, 30, undefined]);
  assert.equal(model.rowKeys[0], collapsedRow.key);
  assert.equal(model.series[0].columnEntry.key, collapsedColumn.key);
});

test('PivotChart accepts a shared engine directly or through PivotPanel', function() {
  var engine = createEngine();
  var chart = Object.create(fabui.pivot.PivotChart.prototype);

  assert.equal(chart.resolveEngine(engine), engine);
  assert.equal(chart.resolveEngine({ engine: engine }), engine);
  assert.equal(chart.resolveEngine({}), null);
});

test('PivotChart changes engine listeners without duplicating aggregation', function() {
  var first = createEngine();
  var second = createEngine();
  var chart = Object.create(fabui.pivot.PivotChart.prototype);
  var refreshCount = 0;

  chart._engine = null;
  chart._updatedHandler = function() {};
  chart.refresh = function() { refreshCount += 1; return chart; };

  chart.setItemsSource(first);
  assert.equal(first.updatedView.handlers.length, 1);
  chart.setItemsSource(first);
  assert.equal(first.updatedView.handlers.length, 1);
  chart.setItemsSource(second);
  assert.equal(first.updatedView.handlers.length, 0);
  assert.equal(second.updatedView.handlers.length, 1);
  assert.equal(refreshCount, 3);
});

test('PivotChart converts the selected series into Pie data', function() {
  var chart = Object.create(fabui.pivot.PivotChart.prototype);
  var model = {
    categories: ['Q1', 'Q2'],
    series: [
      { name: 'Sales', data: [10, 20] },
      { name: 'Downloads', data: [3, 6] }
    ]
  };

  chart.options = { chartType: 'Pie', selectedSeries: 1 };
  assert.deepEqual(chart.getChartSeries(model), [{
    name: 'Downloads',
    data: [
      { name: 'Q1', value: 3 },
      { name: 'Q2', value: 6 }
    ]
  }]);
});

test('PivotChart maps Cartesian and Pie selections to PivotGrid cells', function() {
  var engine = createEngine();
  var model = createPivotChartModel(engine.pivotView, {
    locale: 'en',
    totalText: 'Grand Total'
  });
  var grid = {
    view: engine.pivotView.rows.filter(function(row) {
      return row.__pivotMeta.isLeaf;
    }),
    visibleColumns: [
      { binding: '__pivot_row_0' }
    ].concat(engine.pivotView.dataColumns.filter(function(column) {
      return column.entry.isLeaf;
    }).map(function(column) {
      return { binding: column.binding, _pivotDataColumn: column };
    }))
  };

  assert.deepEqual(resolvePivotGridCell(grid, model, {
    pointIndex: 1,
    seriesIndex: 2
  }, {
    chartType: 'Column',
    selectedSeries: 0
  }), {
    row: 1,
    col: 3
  });
  assert.deepEqual(resolvePivotGridCell(grid, model, {
    pointIndex: 0,
    seriesIndex: 0
  }, {
    chartType: 'Pie',
    selectedSeries: 3
  }), {
    row: 0,
    col: 4
  });
});

test('PivotChart maps PivotGrid data cells back to chart points', function() {
  var engine = createEngine();
  var model = createPivotChartModel(engine.pivotView, {
    locale: 'en',
    totalText: 'Grand Total'
  });
  var grid = {
    selection: { row: 1, col: 4 },
    view: engine.pivotView.rows.filter(function(row) {
      return row.__pivotMeta.isLeaf;
    }),
    visibleColumns: [
      { binding: '__pivot_row_0' }
    ].concat(engine.pivotView.dataColumns.filter(function(column) {
      return column.entry.isLeaf;
    }).map(function(column) {
      return { binding: column.binding, _pivotDataColumn: column };
    }))
  };

  assert.deepEqual(resolvePivotChartPoint(grid, model), {
    pointIndex: 1,
    seriesIndex: 3
  });
  grid.selection.col = 0;
  assert.equal(resolvePivotChartPoint(grid, model), null);
});

test('PivotChart replaces and removes PivotGrid selection and refresh listeners', function() {
  function createSelectionEvent() {
    return {
      handlers: [],
      addHandler: function(handler, self) {
        this.handlers.push({ handler: handler, self: self });
      },
      removeHandler: function(handler, self) {
        this.handlers = this.handlers.filter(function(item) {
          return item.handler !== handler || item.self !== self;
        });
      }
    };
  }

  var chart = Object.create(fabui.pivot.PivotChart.prototype);
  var first = {
    selectionChanged: createSelectionEvent(),
    refreshed: createSelectionEvent()
  };
  var second = {
    selectionChanged: createSelectionEvent(),
    refreshed: createSelectionEvent()
  };

  chart.options = {};
  chart._selectionSource = null;
  chart._gridSelectionHandler = function() {};
  chart._gridRefreshedHandler = function() {};
  chart.bindSelectionSource(first);
  assert.equal(first.selectionChanged.handlers.length, 1);
  assert.equal(first.refreshed.handlers.length, 1);
  chart.bindSelectionSource(second);
  assert.equal(first.selectionChanged.handlers.length, 0);
  assert.equal(first.refreshed.handlers.length, 0);
  assert.equal(second.selectionChanged.handlers.length, 1);
  assert.equal(second.refreshed.handlers.length, 1);
  chart.bindSelectionSource(null);
  assert.equal(second.selectionChanged.handlers.length, 0);
  assert.equal(second.refreshed.handlers.length, 0);
});

test('PivotChart synchronizes visible Grid cells without changing group state', function() {
  var engine = createEngine();
  var chart = Object.create(fabui.pivot.PivotChart.prototype);
  var leafRows = engine.pivotView.rows.filter(function(row) {
    return row.__pivotMeta.isLeaf;
  });
  var leafColumns = engine.pivotView.dataColumns.filter(function(column) {
    return column.entry.isLeaf;
  }).map(function(column) {
    return { binding: column.binding, _pivotDataColumn: column };
  });
  var selected = null;
  var scrolled = null;
  var chartSelection = null;
  var expandCount = 0;
  var grid = {
    selection: { row: 0, col: 1 },
    view: leafRows,
    visibleColumns: [{ binding: '__pivot_row_0' }].concat(leafColumns),
    expandAll: function() {
      expandCount += 1;
    },
    select: function(row, col) {
      this.selection = { row: row, col: col };
      selected = { row: row, col: col };
    },
    scrollIntoView: function(row, col) {
      scrolled = { row: row, col: col };
    }
  };

  chart._selectionSource = grid;
  chart.options = { chartType: 'Column', selectedSeries: 0 };
  chart.model = createPivotChartModel(engine.pivotView, {
    locale: 'en',
    totalText: 'Grand Total'
  });
  chart.chart = {
    selectPoint: function(pointIndex, seriesIndex) {
      chartSelection = { pointIndex: pointIndex, seriesIndex: seriesIndex };
    }
  };
  chart._handleChartSelectionChanged({
    selection: { pointIndex: 1, seriesIndex: 0 }
  });

  assert.deepEqual(selected, { row: 1, col: 1 });
  assert.deepEqual(scrolled, selected);
  assert.equal(expandCount, 0);
  chart._handleGridSelectionChanged();
  assert.deepEqual(chartSelection, { pointIndex: 1, seriesIndex: 0 });
});

test('PivotChart switches Pie series when PivotGrid selects another value column', function() {
  var engine = createEngine();
  var chart = Object.create(fabui.pivot.PivotChart.prototype);
  var model = createPivotChartModel(engine.pivotView, {
    locale: 'en',
    totalText: 'Grand Total'
  });
  var leafRows = engine.pivotView.rows.filter(function(row) {
    return row.__pivotMeta.isLeaf;
  });
  var leafColumns = engine.pivotView.dataColumns.filter(function(column) {
    return column.entry.isLeaf;
  }).map(function(column) {
    return { binding: column.binding, _pivotDataColumn: column };
  });
  var selectedPoint = null;
  var refreshCount = 0;

  chart.options = { chartType: 'Pie', selectedSeries: 0 };
  chart.model = model;
  chart._selectionSource = {
    selection: { row: 1, col: 4 },
    view: leafRows,
    visibleColumns: [{ binding: '__pivot_row_0' }].concat(leafColumns)
  };
  chart.refresh = function() {
    refreshCount += 1;
    return chart;
  };
  chart.chart = {
    selectPoint: function(pointIndex, seriesIndex) {
      selectedPoint = { pointIndex: pointIndex, seriesIndex: seriesIndex };
    }
  };

  chart._handleGridSelectionChanged();
  assert.equal(chart.options.selectedSeries, 3);
  assert.equal(refreshCount, 1);
  assert.deepEqual(selectedPoint, { pointIndex: 1, seriesIndex: null });
});
