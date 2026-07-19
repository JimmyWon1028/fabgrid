import {
  isPivotPathPrefix
} from './pivot-utils.js?v=20260717-pivot-typed-values-v1';

function resolvePivotChartHostElement(element) {
  if (typeof element === 'string') {
    if (typeof document === 'undefined') {
      return null;
    }
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function getPivotChartMessageValue(source, path) {
  var value = source;
  var parts = String(path || '').split('.');
  var i;
  for (i = 0; i < parts.length; i += 1) {
    if (!value || typeof value !== 'object') {
      return null;
    }
    value = value[parts[i]];
  }
  return typeof value === 'string' ? value : null;
}

function formatPivotChartMessage(text, data) {
  return String(text || '').replace(/\{(\w+)\}/g, function(match, key) {
    return data && data[key] != null ? String(data[key]) : match;
  });
}

function mergeOptions(base, override) {
  var result = {};
  var key;
  for (key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      result[key] = base[key];
    }
  }
  for (key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key)) {
      result[key] = override[key];
    }
  }
  return result;
}

function normalizeLimit(value, fallback) {
  value = Math.floor(Number(value));
  return isFinite(value) && value > 0 ? value : fallback;
}

function formatPathValue(value, locale) {
  if (value instanceof Date) {
    try {
      return value.toLocaleDateString(locale || 'en');
    } catch (error) {
      return value.toISOString().slice(0, 10);
    }
  }
  return value == null ? '' : String(value);
}

function formatPath(path, locale, emptyText) {
  var values = (path || []).map(function(value) {
    return formatPathValue(value, locale);
  }).filter(function(value) {
    return value !== '';
  });
  return values.length ? values.join(' / ') : emptyText;
}

export function resolvePivotGridCell(grid, model, selection, options) {
  var pointIndex = Math.floor(Number(selection && selection.pointIndex));
  var isPie = String(options && options.chartType || '').toLowerCase() === 'pie';
  var seriesIndex = isPie ?
    Math.floor(Number(options && options.selectedSeries) || 0) :
    Math.floor(Number(selection && selection.seriesIndex));
  var rowKey = model && model.rowKeys && model.rowKeys[pointIndex];
  var series = model && model.series && model.series[seriesIndex];
  var rows = grid && grid.view || [];
  var columns = grid && grid.visibleColumns || [];
  var entry;
  var dataColumn;
  var row = -1;
  var col = -1;
  var i;
  if (!isFinite(pointIndex) || pointIndex < 0 || !isFinite(seriesIndex) || seriesIndex < 0 ||
      rowKey == null || !series) {
    return null;
  }
  for (i = 0; i < rows.length; i += 1) {
    entry = rows[i] && rows[i].__pivotMeta;
    if (entry && entry.key === rowKey) {
      row = i;
      break;
    }
  }
  for (i = 0; i < columns.length; i += 1) {
    dataColumn = columns[i] && columns[i]._pivotDataColumn;
    if (dataColumn && dataColumn.binding === series.binding) {
      col = i;
      break;
    }
  }
  return row >= 0 && col >= 0 ? { row: row, col: col } : null;
}

export function resolvePivotChartPoint(grid, model) {
  var selection = grid && grid.selection;
  var row = selection && grid.view && grid.view[selection.row];
  var column = selection && grid.visibleColumns && grid.visibleColumns[selection.col];
  var rowKey = row && row.__pivotMeta && row.__pivotMeta.key;
  var binding = column && column._pivotDataColumn && column._pivotDataColumn.binding;
  var pointIndex = model && model.rowKeys ? model.rowKeys.indexOf(rowKey) : -1;
  var seriesIndex = -1;
  var i;
  if (pointIndex < 0 || !binding || !model || !model.series) {
    return null;
  }
  for (i = 0; i < model.series.length; i += 1) {
    if (model.series[i].binding === binding) {
      seriesIndex = i;
      break;
    }
  }
  return seriesIndex >= 0 ? { pointIndex: pointIndex, seriesIndex: seriesIndex } : null;
}

function formatChartNumber(value, locale) {
  value = Number(value);
  if (!isFinite(value)) {
    return '';
  }
  try {
    return new Intl.NumberFormat(locale || undefined, {
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    return String(Math.round(value * 100) / 100);
  }
}

export function createPivotChartOptions(options) {
  return mergeOptions({
    chartType: 'Column',
    showTitle: true,
    showLegend: 'Auto',
    legendPosition: 'Bottom',
    showTotals: false,
    maxPoints: 100,
    maxSeries: 12,
    selectedSeries: 0,
    header: '',
    footer: '',
    locale: 'en',
    messages: null,
    tooltip: true,
    palette: null,
    animation: true,
    dataLabel: { content: '{percent}%', position: 'Inside' },
    axisX: {},
    axisY: {},
    formatValue: null,
    formatTooltip: null,
    emptyText: null,
    selectionMode: 'Point',
    selectionSource: null,
    selectedItemOffset: .1,
    selectedItemPosition: 'Top',
    isAnimated: true
  }, options || {});
}

function isStrictEntryDescendant(entry, parent) {
  var entryPath = entry && entry.path || [];
  var parentPath = parent && parent.path || [];
  return entryPath.length > parentPath.length && isPivotPathPrefix(parentPath, entryPath);
}

function hasVisibleDescendant(entry, visibleEntries) {
  var i;
  for (i = 0; i < visibleEntries.length; i += 1) {
    if (visibleEntries[i] && isStrictEntryDescendant(visibleEntries[i], entry)) {
      return true;
    }
  }
  return false;
}

function includePivotEntry(entry, showTotals, visibleEntries, useVisibleEntries) {
  if (showTotals === true || !entry || entry.isLeaf === true) {
    return true;
  }
  return useVisibleEntries === true && entry.isSubtotal === true &&
    !hasVisibleDescendant(entry, visibleEntries);
}

export function createPivotGridChartView(grid, pivotView) {
  var rows = grid && Array.isArray(grid.view) ? grid.view : [];
  var visibleColumns = grid && Array.isArray(grid.visibleColumns) ? grid.visibleColumns : [];
  var dataColumns = [];
  var i;
  for (i = 0; i < visibleColumns.length; i += 1) {
    if (visibleColumns[i] && visibleColumns[i]._pivotDataColumn) {
      dataColumns.push(visibleColumns[i]._pivotDataColumn);
    }
  }
  return {
    engine: pivotView && pivotView.engine || null,
    rows: rows,
    rowEntries: rows.map(function(row) {
      return row && row.__pivotMeta || null;
    }),
    columnEntries: dataColumns.map(function(dataColumn) {
      return dataColumn.entry || null;
    }),
    dataColumns: dataColumns,
    rowFields: pivotView && pivotView.rowFields || [],
    columnFields: pivotView && pivotView.columnFields || [],
    valueFields: pivotView && pivotView.valueFields || [],
    filterFields: pivotView && pivotView.filterFields || [],
    sourceCount: pivotView && pivotView.sourceCount || 0,
    filteredCount: pivotView && pivotView.filteredCount || 0
  };
}

function getSeriesName(dataColumn, pivotView, locale, totalText) {
  var entry = dataColumn.entry || {};
  var valueField = dataColumn.valueField || {};
  var columnName = entry.path && entry.path.length ? formatPath(entry.path, locale, totalText) : '';
  var valueName = valueField.header || valueField.key || valueField.binding || '';
  var hasMultipleValues = (pivotView.valueFields || []).length > 1;
  if (columnName && hasMultipleValues && valueName) {
    return columnName + ' · ' + valueName;
  }
  return columnName || valueName || totalText;
}

export function createPivotChartModel(pivotView, options) {
  var rows = pivotView && pivotView.rows || [];
  var rowEntries = pivotView && pivotView.rowEntries || [];
  var dataColumns = pivotView && pivotView.dataColumns || [];
  var locale = options && options.locale || 'en';
  var totalText = options && options.totalText || 'Total';
  var showTotals = options && options.showTotals === true;
  var maxPoints = normalizeLimit(options && options.maxPoints, 100);
  var maxSeries = normalizeLimit(options && options.maxSeries, 12);
  var useVisibleEntries = options && options.useVisibleEntries === true;
  var visibleRowEntries = [];
  var visibleColumnEntries = [];
  var includedRows = [];
  var includedColumns = [];
  var categories;
  var series;
  var entry;
  var i;

  for (i = 0; i < rows.length; i += 1) {
    visibleRowEntries.push(rowEntries[i] || rows[i] && rows[i].__pivotMeta || null);
  }
  for (i = 0; i < dataColumns.length; i += 1) {
    visibleColumnEntries.push(dataColumns[i].entry || null);
  }
  for (i = 0; i < rows.length; i += 1) {
    entry = visibleRowEntries[i];
    if (includePivotEntry(entry, showTotals, visibleRowEntries, useVisibleEntries)) {
      includedRows.push({ row: rows[i], entry: entry });
    }
  }
  for (i = 0; i < dataColumns.length; i += 1) {
    if (includePivotEntry(dataColumns[i].entry, showTotals, visibleColumnEntries, useVisibleEntries) &&
        (!dataColumns[i].valueField || dataColumns[i].valueField.visible !== false)) {
      includedColumns.push(dataColumns[i]);
    }
  }

  categories = includedRows.slice(0, maxPoints).map(function(item) {
    return formatPath(item.entry && item.entry.path, locale, totalText);
  });
  series = includedColumns.slice(0, maxSeries).map(function(dataColumn) {
    return {
      name: getSeriesName(dataColumn, pivotView || {}, locale, totalText),
      binding: dataColumn.binding,
      valueField: dataColumn.valueField || null,
      columnEntry: dataColumn.entry || null,
      data: includedRows.slice(0, maxPoints).map(function(item) {
        var value = item.row ? item.row[dataColumn.binding] : null;
        return value == null ? undefined : value;
      })
    };
  });

  return {
    categories: categories,
    rowKeys: includedRows.slice(0, maxPoints).map(function(item) {
      return item.entry ? item.entry.key : null;
    }),
    series: series,
    pointCount: includedRows.length,
    seriesCount: includedColumns.length,
    pointsTruncated: includedRows.length > maxPoints,
    seriesTruncated: includedColumns.length > maxSeries
  };
}

export function createPivotChartFactory(Control, registerControl, unregisterControl, PivotEngine, Chart, FabGrid) {
  function PivotChart(element, options) {
    var host = resolvePivotChartHostElement(element);
    var source;
    options = options || {};
    if (!host) {
      throw new TypeError('PivotChart host element was not found.');
    }
    Control.call(this);
    this.hostElement = host;
    this.root = host;
    this.options = createPivotChartOptions(options);
    this.locale = this.options.locale || 'en';
    this.messages = this.options.messages || null;
    this._engine = null;
    this._selectionSource = null;
    this._raf = 0;
    this._disposed = false;
    this._updatedHandler = this.invalidate.bind(this);
    this._chartSelectionHandler = this._handleChartSelectionChanged.bind(this);
    this._gridSelectionHandler = this._handleGridSelectionChanged.bind(this);
    this._gridRefreshedHandler = this.invalidate.bind(this);
    this._createDom();
    this.chart = new Chart(this.chartHost, {
      observeData: false,
      animation: this.options.animation,
      locale: this.locale
    });
    this.chart.on('selectionChanged', this._chartSelectionHandler);
    this.bindSelectionSource(this.options.selectionSource);
    registerControl(host, this);
    source = options.itemsSource || options.engine || null;
    if (source) {
      this.setItemsSource(source);
    } else {
      this.refresh();
    }
  }

  PivotChart.prototype = Object.create(Control.prototype);
  PivotChart.prototype.constructor = PivotChart;

  PivotChart.prototype._createDom = function() {
    this.hostElement.innerHTML = '';
    this.hostElement.classList.add('fg-root', 'fg-pivot-chart');
    this.hostElement.setAttribute('role', 'region');
    this.chartHost = document.createElement('div');
    this.chartHost.className = 'fg-pivot-chart-host';
    this.hostElement.appendChild(this.chartHost);
    this.applyLocaleToDom();
  };

  PivotChart.prototype.getText = function(path, data) {
    var locales = FabGrid.locales || {};
    var localeName = this.locale || 'en';
    var baseName = localeName.split('-')[0];
    var text = getPivotChartMessageValue(this.messages, path) ||
      getPivotChartMessageValue(locales[localeName], path) ||
      getPivotChartMessageValue(locales[baseName], path) ||
      getPivotChartMessageValue(locales.en, path) || path;
    return formatPivotChartMessage(text, data);
  };

  PivotChart.prototype.applyLocaleToDom = function() {
    this.hostElement.setAttribute('aria-label', this.getText('pivot.chart.ariaLabel'));
  };

  PivotChart.prototype.resolveEngine = function(source) {
    if (source instanceof PivotEngine) {
      return source;
    }
    if (source && source.engine instanceof PivotEngine) {
      return source.engine;
    }
    return null;
  };

  PivotChart.prototype.setItemsSource = function(source) {
    var engine = this.resolveEngine(source);
    if (!engine) {
      throw new TypeError('PivotChart itemsSource must be a fabui.pivot.PivotEngine or PivotPanel instance.');
    }
    if (this._engine === engine) {
      this.refresh();
      return this;
    }
    if (this._engine && this._engine.updatedView) {
      this._engine.updatedView.removeHandler(this._updatedHandler, this);
    }
    this._engine = engine;
    engine.updatedView.addHandler(this._updatedHandler, this);
    this.refresh();
    return this;
  };

  PivotChart.prototype.setOptions = function(options) {
    var source;
    var hasSelectionSource;
    options = options || {};
    source = options.itemsSource || options.engine || null;
    hasSelectionSource = Object.prototype.hasOwnProperty.call(options, 'selectionSource');
    this.options = mergeOptions(this.options, options);
    this.locale = this.options.locale || this.locale || 'en';
    this.messages = this.options.messages || null;
    if (hasSelectionSource) {
      this.bindSelectionSource(options.selectionSource);
    }
    this.applyLocaleToDom();
    if (source) {
      return this.setItemsSource(source);
    }
    this.refresh();
    return this;
  };

  PivotChart.prototype.bindSelectionSource = function(source) {
    if (this._selectionSource && this._selectionSource.selectionChanged &&
        typeof this._selectionSource.selectionChanged.removeHandler === 'function') {
      this._selectionSource.selectionChanged.removeHandler(this._gridSelectionHandler, this);
    }
    if (this._selectionSource && this._selectionSource.refreshed &&
        typeof this._selectionSource.refreshed.removeHandler === 'function') {
      this._selectionSource.refreshed.removeHandler(this._gridRefreshedHandler, this);
    }
    this._selectionSource = source || null;
    this.options.selectionSource = this._selectionSource;
    if (this._selectionSource && this._selectionSource.selectionChanged &&
        typeof this._selectionSource.selectionChanged.addHandler === 'function') {
      this._selectionSource.selectionChanged.addHandler(this._gridSelectionHandler, this);
    }
    if (this._selectionSource && this._selectionSource.refreshed &&
        typeof this._selectionSource.refreshed.addHandler === 'function') {
      this._selectionSource.refreshed.addHandler(this._gridRefreshedHandler, this);
    }
    return this;
  };

  PivotChart.prototype._handleChartSelectionChanged = function(eventArgs) {
    var grid = this._selectionSource;
    var selection = eventArgs && eventArgs.selection;
    var cell;
    if (!grid || typeof grid.select !== 'function' || !selection) {
      return;
    }
    cell = resolvePivotGridCell(grid, this.model, selection, this.options);
    if (!cell) {
      return;
    }
    grid.select(cell.row, cell.col);
    if (typeof grid.scrollIntoView === 'function') {
      grid.scrollIntoView(cell.row, cell.col);
    }
  };

  PivotChart.prototype._handleGridSelectionChanged = function() {
    var point = resolvePivotChartPoint(this._selectionSource, this.model);
    var isPie = String(this.options.chartType || 'Column').toLowerCase() === 'pie';
    if (!point || !this.chart) {
      return;
    }
    if (isPie && this.options.selectedSeries !== point.seriesIndex) {
      this.options.selectedSeries = point.seriesIndex;
      this.refresh();
    }
    this.chart.selectPoint(point.pointIndex, isPie ? null : point.seriesIndex);
  };

  PivotChart.prototype.setType = function(type) {
    this.options.chartType = type || 'Column';
    this.refresh();
    return this;
  };

  PivotChart.prototype.setLocale = function(locale, messages) {
    this.locale = locale || 'en';
    this.options.locale = this.locale;
    if (messages !== undefined) {
      this.messages = messages;
      this.options.messages = messages;
    }
    this.applyLocaleToDom();
    this.refresh();
    return this;
  };

  PivotChart.prototype.getLegendOption = function(seriesCount) {
    var mode = String(this.options.showLegend == null ? 'Auto' : this.options.showLegend).toLowerCase();
    if (this.options.showLegend === false || mode === 'never' || mode === 'none') {
      return false;
    }
    if (mode === 'auto' && seriesCount <= 1) {
      return false;
    }
    return { position: this.options.legendPosition || 'Bottom' };
  };

  PivotChart.prototype.getFooter = function(model) {
    var notices = [];
    if (this.options.footer) {
      notices.push(this.options.footer);
    }
    if (model.pointsTruncated) {
      notices.push(this.getText('pivot.chart.pointsTruncated', {
        count: normalizeLimit(this.options.maxPoints, 100),
        total: model.pointCount
      }));
    }
    if (model.seriesTruncated) {
      notices.push(this.getText('pivot.chart.seriesTruncated', {
        count: normalizeLimit(this.options.maxSeries, 12),
        total: model.seriesCount
      }));
    }
    return notices.join(' · ');
  };

  PivotChart.prototype.getChartSeries = function(model) {
    var type = String(this.options.chartType || 'Column').toLowerCase();
    var selected;
    if (type !== 'pie') {
      return model.series;
    }
    selected = Math.max(0, Math.min(
      Math.floor(Number(this.options.selectedSeries) || 0),
      Math.max(0, model.series.length - 1)
    ));
    if (!model.series[selected]) {
      return [];
    }
    return [{
      name: model.series[selected].name,
      data: model.categories.map(function(category, index) {
        return { name: category, value: model.series[selected].data[index] };
      })
    }];
  };

  PivotChart.prototype.refresh = function() {
    var engineView = this._engine ? this._engine.pivotView : null;
    var useGridView = Boolean(this._selectionSource && this._selectionSource.engine === this._engine);
    var view = useGridView ? createPivotGridChartView(this._selectionSource, engineView) : engineView;
    var model = createPivotChartModel(view, {
      locale: this.locale,
      totalText: this.getText('pivot.grandTotal'),
      showTotals: this.options.showTotals,
      maxPoints: this.options.maxPoints,
      maxSeries: this.options.maxSeries,
      useVisibleEntries: useGridView
    });
    var gridPoint = useGridView ? resolvePivotChartPoint(this._selectionSource, model) : null;
    if (gridPoint && String(this.options.chartType || 'Column').toLowerCase() === 'pie') {
      this.options.selectedSeries = gridPoint.seriesIndex;
    }
    var series = this.getChartSeries(model);
    var isPie = String(this.options.chartType || 'Column').toLowerCase() === 'pie';
    var pieItems = isPie && series[0] ? series[0].data : [];
    if (this._disposed || !this.chart) {
      return this;
    }
    this.model = model;
    this.chart.setOptions({
      chartType: this.options.chartType,
      type: this.options.chartType,
      itemsSource: isPie ? pieItems : null,
      bindingName: isPie ? 'name' : '',
      binding: isPie ? 'value' : '',
      categories: isPie ? [] : model.categories,
      series: isPie ? [] : series,
      header: this.options.showTitle === false ? '' :
        (this.options.header || this.getText('pivot.chart.title')),
      footer: this.getFooter(model),
      legend: this.getLegendOption(isPie ? pieItems.length : series.length),
      tooltip: this.options.tooltip,
      palette: this.options.palette,
      animation: this.options.animation,
      dataLabel: this.options.dataLabel,
      axisX: this.options.axisX,
      axisY: this.options.axisY,
      formatValue: this.options.formatValue || function(value) {
        return formatChartNumber(value, this.locale);
      }.bind(this),
      formatTooltip: this.options.formatTooltip,
      emptyText: this.options.emptyText || this.getText('emptyText'),
      selectionMode: this.options.selectionMode,
      selectedItemOffset: this.options.selectedItemOffset,
      selectedItemPosition: this.options.selectedItemPosition,
      isAnimated: this.options.isAnimated,
      locale: this.locale,
      observeData: false
    });
    if (useGridView) {
      if (gridPoint) {
        this.chart.selectPoint(gridPoint.pointIndex, isPie ? null : gridPoint.seriesIndex);
      } else {
        this.chart.selectPoint(-1);
      }
    }
    return this;
  };

  PivotChart.prototype.invalidate = function() {
    var self = this;
    var schedule;
    if (this._disposed || this._raf) {
      return;
    }
    schedule = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : function(callback) {
      return setTimeout(callback, 0);
    };
    this._raf = schedule(function() {
      self._raf = 0;
      self.refresh();
    });
  };

  PivotChart.prototype.resize = function() {
    if (this.chart) {
      this.chart.resize();
    }
    return this;
  };

  PivotChart.prototype.dispose = function() {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    if (this._engine && this._engine.updatedView) {
      this._engine.updatedView.removeHandler(this._updatedHandler, this);
    }
    if (this._raf) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this._raf);
      } else {
        clearTimeout(this._raf);
      }
      this._raf = 0;
    }
    if (this.chart) {
      this.chart.off('selectionChanged', this._chartSelectionHandler);
      this.chart.dispose();
    }
    this.bindSelectionSource(null);
    this.removeEventListener();
    unregisterControl(this.hostElement, this);
    this.hostElement.innerHTML = '';
    this.hostElement.classList.remove('fg-root', 'fg-pivot-chart');
    this._engine = null;
    this.chart = null;
  };

  Object.defineProperties(PivotChart.prototype, {
    itemsSource: {
      get: function() { return this._engine; },
      set: function(value) { this.setItemsSource(value); }
    },
    engine: {
      get: function() { return this._engine; }
    },
    chartType: {
      get: function() { return this.options.chartType; },
      set: function(value) { this.setType(value); }
    },
    showTitle: {
      get: function() { return this.options.showTitle !== false; },
      set: function(value) { this.options.showTitle = value !== false; this.refresh(); }
    },
    showLegend: {
      get: function() { return this.options.showLegend; },
      set: function(value) { this.options.showLegend = value; this.refresh(); }
    },
    showTotals: {
      get: function() { return this.options.showTotals === true; },
      set: function(value) { this.options.showTotals = value === true; this.refresh(); }
    },
    maxPoints: {
      get: function() { return this.options.maxPoints; },
      set: function(value) { this.options.maxPoints = normalizeLimit(value, 100); this.refresh(); }
    },
    maxSeries: {
      get: function() { return this.options.maxSeries; },
      set: function(value) { this.options.maxSeries = normalizeLimit(value, 12); this.refresh(); }
    },
    selectedSeries: {
      get: function() { return this.options.selectedSeries; },
      set: function(value) { this.options.selectedSeries = Math.max(0, Math.floor(Number(value) || 0)); this.refresh(); }
    },
    selectionSource: {
      get: function() { return this._selectionSource; },
      set: function(value) { this.bindSelectionSource(value); this.refresh(); }
    }
  });

  PivotChart.ChartType = Chart.ChartType;
  PivotChart.themes = (Chart.themes || FabGrid.themes || []).slice();
  return PivotChart;
}
