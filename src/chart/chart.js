import { isCollectionView } from '../collections/collection-view.js?v=20260727-collection-view-sort-v1';

var CHART_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono'
];

export function normalizeChartType(type) {
  type = String(type || 'column').toLowerCase();
  if (type === 'linesymbols') return 'line';
  return type === 'bar' || type === 'line' || type === 'pie' ? type : 'column';
}

export function normalizeChartLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

export function normalizeChartTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return CHART_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

function findChartTheme(element) {
  var current = element && element.nodeType === 1 ? element : null;
  var index;
  while (current && current.classList) {
    for (index = 0; index < CHART_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + CHART_THEMES[index])) {
        return CHART_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

export function createChartFactory() {
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var bindingPathCache = Object.create(null);
  var bindingPathCacheSize = 0;
  var BINDING_PATH_CACHE_LIMIT = 256;
  var DEFAULT_COLORS = [
    'rgba(136, 189, 230, .72)',
    'rgba(251, 178, 88, .72)',
    'rgba(144, 205, 151, .72)',
    'rgba(246, 170, 201, .72)',
    'rgba(191, 165, 84, .72)',
    'rgba(188, 153, 199, .72)',
    'rgba(100, 181, 205, .72)',
    'rgba(250, 220, 140, .72)'
  ];
  var DEFAULT_MESSAGES = {
    en: { emptyText: 'No data', value: 'Value', percent: 'Percent' }
  };

  function Chart(element, options) {
    this.host = typeof element === 'string' ? document.querySelector(element) : element;
    if (!this.host) throw new Error('fabui.chart.Chart host element was not found.');
    this._themeSource = this.host.parentElement || this.host;
    this.options = mergeOptions({
      chartType: null, type: 'column', header: '', footer: '', title: '', itemsSource: null,
      bindingX: '', bindingName: '', binding: '', categories: [], series: [], palette: null, colors: DEFAULT_COLORS,
      legend: true, tooltip: true, padding: 16, locale: 'en', theme: 'inherit', animation: true,
      observeData: true, dataRefreshInterval: 120,
      axisX: {}, axisY: {}, selectionMode: 'None', selection: null, selectedIndex: -1,
      selectedItemOffset: .1, selectedItemPosition: 'Top', isAnimated: true,
      dataLabel: null, formatValue: null, formatTooltip: null, emptyText: null
    }, options || {});
    this.events = {};
    defineOptionProperties(this, ['chartType', 'itemsSource', 'bindingX', 'bindingName', 'binding', 'header', 'footer', 'series', 'axisX', 'axisY', 'legend', 'tooltip', 'palette', 'selectionMode', 'selection', 'selectedIndex', 'selectedItemOffset', 'selectedItemPosition', 'isAnimated', 'dataLabel', 'animation', 'observeData', 'dataRefreshInterval']);
    this.disposed = false;
    this._collectionView = null;
    this._collectionViewChangedHandler = null;
    this._collectionViewCurrentHandler = null;
    this.raf = 0;
    this._boundPointerMove = this.handlePointerMove.bind(this);
    this._boundPointerLeave = this.hideTooltip.bind(this);
    this._boundClick = this.handleClick.bind(this);
    this.createDom();
    this.options.locale = resolveChartLocale(this.options.locale);
    this.setTheme(this.options.theme);
    this.bindEvents();
    this.bindItemsSource(this.options.itemsSource, false);
    this.refresh();
    this.startDataObserver();
  }

  Chart.prototype.createDom = function() {
    this.host.innerHTML = '';
    this.root = document.createElement('div');
    this.root.className = 'fui-chart';
    this.title = document.createElement('div');
    this.title.className = 'fui-chart-title';
    this.body = document.createElement('div');
    this.body.className = 'fui-chart-body';
    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('class', 'fui-chart-svg');
    this.svg.setAttribute('role', 'img');
    this.legendElement = document.createElement('div');
    this.legendElement.className = 'fui-chart-legend';
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'fui-chart-tooltip';
    this.tooltipElement.setAttribute('role', 'tooltip');
    this.body.appendChild(this.svg);
    this.root.appendChild(this.title);
    this.root.appendChild(this.body);
    this.root.appendChild(this.legendElement);
    this.root.appendChild(this.tooltipElement);
    this.host.appendChild(this.root);
  };

  Chart.prototype.bindEvents = function() {
    this.svg.addEventListener('pointermove', this._boundPointerMove);
    this.svg.addEventListener('pointerleave', this._boundPointerLeave);
    this.svg.addEventListener('click', this._boundClick);
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.invalidate.bind(this));
      this.resizeObserver.observe(this.host);
    }
  };

  Chart.prototype.setType = function(type) { this.options.chartType = type; this.options.type = type; this.refresh(); return this; };
  Chart.prototype.setItemsSource = function(itemsSource) {
    this.bindItemsSource(itemsSource, false);
    this.startDataObserver();
    this.refresh();
    return this;
  };
  Chart.prototype.bindItemsSource = function(itemsSource, shouldRefresh) {
    var self = this;
    this.unbindItemsSource();
    this.options.itemsSource = isCollectionView(itemsSource) ? itemsSource :
      (Array.isArray(itemsSource) ? itemsSource : null);
    if (isCollectionView(this.options.itemsSource)) {
      this._collectionView = this.options.itemsSource;
      this._collectionViewChangedHandler = function() {
        self.refresh();
      };
      this._collectionViewCurrentHandler = function(sender, args) {
        self.selectPoint(args && args.position != null ? args.position : sender.currentPosition);
      };
      this._collectionView.collectionChanged.addHandler(this._collectionViewChangedHandler, this);
      this._collectionView.currentChanged.addHandler(this._collectionViewCurrentHandler, this);
      this.selectPoint(this._collectionView.currentPosition);
    }
    if (shouldRefresh !== false) {
      this.refresh();
    }
    return this;
  };
  Chart.prototype.unbindItemsSource = function() {
    if (this._collectionView && this._collectionViewChangedHandler) {
      this._collectionView.collectionChanged.removeHandler(this._collectionViewChangedHandler, this);
    }
    if (this._collectionView && this._collectionViewCurrentHandler) {
      this._collectionView.currentChanged.removeHandler(this._collectionViewCurrentHandler, this);
    }
    this._collectionView = null;
    this._collectionViewChangedHandler = null;
    this._collectionViewCurrentHandler = null;
    return this;
  };
  Chart.prototype.setOptions = function(options) {
    var observerChanged = options && (
      Object.prototype.hasOwnProperty.call(options, 'observeData') ||
      Object.prototype.hasOwnProperty.call(options, 'dataRefreshInterval')
    );
    var itemsSourceChanged = Object.prototype.hasOwnProperty.call(options || {}, 'itemsSource');
    this.options = mergeOptions(this.options, options || {});
    this.options.locale = resolveChartLocale(this.options.locale);
    if (itemsSourceChanged) {
      this.bindItemsSource(options.itemsSource, false);
    }
    if (Object.prototype.hasOwnProperty.call(options || {}, 'theme')) {
      this.setTheme(this.options.theme);
    }
    if (observerChanged) this.startDataObserver();
    this.refresh();
    return this;
  };
  Chart.prototype.setLocale = function(locale, messages) {
    var name = String(locale || 'en').trim().replace(/_/g, '-');
    if (messages) {
      DEFAULT_MESSAGES[name] = mergeOptions(DEFAULT_MESSAGES.en, messages);
    }
    this.options.locale = resolveChartLocale(name);
    this.refresh();
    return this;
  };
  Chart.prototype.setTheme = function(theme) {
    var index;
    this.options.theme = theme == null ? 'inherit' : String(theme);
    this.theme = this.options.theme === 'inherit' ?
      findChartTheme(this._themeSource) :
      normalizeChartTheme(this.options.theme);
    if (!this.root) return this;
    for (index = 0; index < CHART_THEMES.length; index += 1) {
      this.root.classList.remove('fg-theme-' + CHART_THEMES[index]);
    }
    if (this.options.theme !== 'inherit') {
      this.root.classList.add('fg-theme-' + this.theme);
    }
    return this;
  };
  Chart.prototype.setSeries = function(series) { this.options.series = Array.isArray(series) ? series : []; this.refresh(); return this; };
  Chart.prototype.setData = function(data) {
    data = data || {};
    if (Array.isArray(data.categories)) this.options.categories = data.categories;
    if (Array.isArray(data.series)) this.options.series = data.series;
    this.refresh(); return this;
  };
  Chart.prototype.resize = function() { this.refresh(); return this; };
  Chart.prototype.selectPoint = function(index, seriesIndex) {
    var nextSeriesIndex = seriesIndex == null ? null : Number(seriesIndex);
    var currentSelection = this.options.selection;
    index = Number(index);
    if (currentSelection && Number(currentSelection.pointIndex) === index && (normalizeChartType(this.options.chartType || this.options.type) === 'pie' || (currentSelection.seriesIndex == null ? nextSeriesIndex == null : Number(currentSelection.seriesIndex) === nextSeriesIndex))) return this;
    this.options.selectedIndex = isFinite(index) ? index : -1;
    this.options.selection = this.options.selectedIndex < 0 ? null : { pointIndex: this.options.selectedIndex, seriesIndex: nextSeriesIndex };
    if (normalizeChartType(this.options.chartType || this.options.type) === 'pie') this.refresh();
    else this.applySelection();
    return this;
  };
  Chart.prototype.on = function(name, handler) { if (typeof handler === 'function') (this.events[name] || (this.events[name] = [])).push(handler); return this; };
  Chart.prototype.off = function(name, handler) { this.events[name] = (this.events[name] || []).filter(function(item) { return item !== handler; }); return this; };
  Chart.prototype.emit = function(name, args) { (this.events[name] || []).slice().forEach(function(handler) { handler(args); }); };
  Chart.prototype.invalidate = function() {
    var self = this;
    if (this.disposed || this.raf) return;
    this.raf = requestAnimationFrame(function() { self.raf = 0; self.render(); });
  };
  Chart.prototype.refresh = function() { if (!this.disposed) this.render(); return this; };

  Chart.prototype.startDataObserver = function() {
    var self = this;
    this.stopDataObserver();
    this.dataSignature = getDataSignature(this.options);
    if (this.disposed || this.options.observeData === false) return;
    this.dataObserver = setInterval(function() {
      var signature;
      if (self.disposed) return;
      signature = getDataSignature(self.options);
      if (signature !== self.dataSignature) {
        self.dataSignature = signature;
        self.refresh();
      }
    }, Math.max(50, Number(this.options.dataRefreshInterval) || 120));
  };

  Chart.prototype.stopDataObserver = function() {
    if (!this.dataObserver) return;
    clearInterval(this.dataObserver);
    this.dataObserver = 0;
  };

  Chart.prototype.render = function() {
    var type = normalizeChartType(this.options.chartType || this.options.type);
    var model = createDataModel(this.options, type);
    var width = Math.max(240, this.body.clientWidth || this.host.clientWidth || 640);
    var height = Math.max(180, this.body.clientHeight || this.host.clientHeight || 360);
    this.svg.innerHTML = '';
    this.svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    this.emit('rendering', { chart: this });
    this.title.textContent = this.options.header || this.options.title || '';
    this.title.style.display = this.title.textContent ? '' : 'none';
    this.root.setAttribute('data-chart-type', type);
    this.dataSignature = getDataSignature(this.options);
    if (!hasData(model.series)) {
      this.renderEmpty(width, height);
      this.renderLegend([]);
      this.renderFooter(); this.emit('rendered', { chart: this }); return;
    }
    if (type === 'pie') this.renderPie(width, height, model);
    else this.renderCartesian(type, width, height, model);
    this.renderLegend(type === 'pie' ? model.pieLegend : model.series);
    this.renderFooter();
    this.applySelection();
    this.playAnimation();
    this.emit('rendered', { chart: this });
  };

  Chart.prototype.playAnimation = function() {
    var chartAnimation = this._chartAnimation;
    if (this.options.animation === false) return;
    if (chartAnimation && typeof chartAnimation._prepare === 'function') {
      chartAnimation._prepare();
    }
    this.root.classList.remove('fui-chart-animate');
    void this.root.offsetWidth;
    this.root.classList.add('fui-chart-animate');
    if (chartAnimation && typeof chartAnimation._handleAnimationStart === 'function') {
      chartAnimation._handleAnimationStart();
    }
  };

  Chart.prototype.renderFooter = function() {
    if (!this.footerElement) {
      this.footerElement = document.createElement('div');
      this.footerElement.className = 'fui-chart-footer';
      this.root.insertBefore(this.footerElement, this.legendElement);
    }
    this.footerElement.textContent = this.options.footer || '';
    this.footerElement.style.display = this.options.footer ? '' : 'none';
  };

  Chart.prototype.renderEmpty = function(width, height) {
    var text = svgElement('text', { x: width / 2, y: height / 2, class: 'fui-chart-empty', 'text-anchor': 'middle' });
    text.textContent = this.options.emptyText || this.getMessage('emptyText');
    this.svg.appendChild(text);
  };

  Chart.prototype.renderCartesian = function(type, width, height, model) {
    var margin = { top: 16, right: 20, bottom: 44, left: 72 };
    var plot = { x: margin.left, y: margin.top, width: width - margin.left - margin.right, height: height - margin.top - margin.bottom };
    var categories = model.categories;
    var series = model.series;
    var range = getValueRange(series, this.options.axisY);
    var zero = valueToY(0, range, plot);
    var i;
    this.renderGrid(plot, range, type);
    if (type === 'line') this.renderLines(plot, range, categories, series);
    else this.renderBars(type, plot, range, categories, series, zero);
    for (i = 0; i < categories.length; i += 1) this.renderCategoryLabel(type, plot, categories, i);
  };

  Chart.prototype.renderGrid = function(plot, range, type) {
    var i;
    var ratio;
    var value;
    var line;
    var text;
    for (i = 0; i <= 5; i += 1) {
      ratio = i / 5;
      value = range.max - (range.max - range.min) * ratio;
      if (type === 'bar') {
        line = svgElement('line', { x1: plot.x + plot.width * ratio, y1: plot.y, x2: plot.x + plot.width * ratio, y2: plot.y + plot.height, class: 'fui-chart-grid-line' });
        text = svgElement('text', { x: plot.x + plot.width * ratio, y: plot.y + plot.height + 18, class: 'fui-chart-axis-label', 'text-anchor': 'middle' });
      } else {
        line = svgElement('line', { x1: plot.x, y1: plot.y + plot.height * ratio, x2: plot.x + plot.width, y2: plot.y + plot.height * ratio, class: 'fui-chart-grid-line' });
        text = svgElement('text', { x: plot.x - 8, y: plot.y + plot.height * ratio + 4, class: 'fui-chart-axis-label', 'text-anchor': 'end' });
      }
      text.textContent = this.formatValue(value);
      this.svg.appendChild(line); this.svg.appendChild(text);
    }
  };

  Chart.prototype.renderBars = function(type, plot, range, categories, series) {
    var count = Math.max(categories.length, getMaxDataLength(series));
    var groupSize = (type === 'bar' ? plot.height : plot.width) / Math.max(count, 1);
    var barSize = Math.max(2, groupSize * 0.72 / Math.max(series.length, 1));
    var s; var i; var value; var rect; var attrs;
    for (s = 0; s < series.length; s += 1) {
      for (i = 0; i < count; i += 1) {
        value = Number(series[s].data && series[s].data[i]);
        if (!isFinite(value)) continue;
        if (type === 'bar') attrs = getHorizontalBar(plot, range, groupSize, barSize, s, i, value);
        else attrs = getVerticalBar(plot, range, groupSize, barSize, s, i, value);
        attrs.fill = this.getColor(s); attrs.class = 'fui-chart-mark fui-chart-bar';
        rect = svgElement('rect', attrs);
        setDatum(rect, series[s].name || '', categories[i] || String(i + 1), value, null, i, s);
        this.svg.appendChild(rect);
      }
    }
  };

  Chart.prototype.renderLines = function(plot, range, categories, series) {
    var s; var i; var value; var points; var x; var y; var path; var circle;
    var count = Math.max(categories.length, getMaxDataLength(series));
    for (s = 0; s < series.length; s += 1) {
      points = [];
      for (i = 0; i < count; i += 1) {
        value = Number(series[s].data && series[s].data[i]);
        if (!isFinite(value)) { points.push(null); continue; }
        x = plot.x + (count <= 1 ? plot.width / 2 : plot.width * i / (count - 1));
        y = valueToY(value, range, plot);
        points.push([x, y]);
        circle = svgElement('circle', { cx: x, cy: y, r: 4, fill: this.getColor(s), class: 'fui-chart-mark fui-chart-point' });
        setDatum(circle, series[s].name || '', categories[i] || String(i + 1), value, null, i, s);
        this.svg.appendChild(circle);
      }
      path = svgElement('path', { d: linePath(points), fill: 'none', stroke: this.getColor(s), class: 'fui-chart-line' });
      path.dataset.seriesIndex = s;
      this.svg.insertBefore(path, this.svg.firstChild);
    }
  };

  Chart.prototype.renderPie = function(width, height, model) {
    var data = model.series[0] && model.series[0].data || [];
    var values = data.map(pieValue);
    var total = values.reduce(function(sum, value) { return sum + Math.max(0, value); }, 0);
    var cx = width / 2; var cy = height / 2; var radius = Math.max(20, Math.min(width, height) * 0.36);
    var previousAngle = this.pieStartAngle;
    var angle = getPieStartAngle(values, total, this.options.selection, this.options.selectedItemPosition); var startAngle = angle; var next; var i; var path; var percent; var sliceCx; var sliceCy; var midAngle;
    var group = svgElement('g', { class: 'fui-chart-pie-group' });
    if (!total) { this.renderEmpty(width, height); return; }
    this.svg.appendChild(group);
    for (i = 0; i < data.length; i += 1) {
      if (values[i] <= 0) continue;
      next = angle + Math.PI * 2 * values[i] / total;
      midAngle = angle + (next - angle) / 2;
      sliceCx = cx;
      sliceCy = cy;
      if (this.options.selection && Number(this.options.selection.pointIndex) === i) {
        sliceCx += Math.cos(midAngle) * radius * clampOffset(this.options.selectedItemOffset);
        sliceCy += Math.sin(midAngle) * radius * clampOffset(this.options.selectedItemOffset);
      }
      path = svgElement('path', { d: piePath(sliceCx, sliceCy, radius, angle, next), fill: this.getColor(i), class: 'fui-chart-mark fui-chart-slice' });
      percent = values[i] / total * 100;
      setDatum(path, model.series[0].name || '', pieName(data[i], i), values[i], percent, i, 0);
      group.appendChild(path);
      this.renderPieDataLabel(group, sliceCx, sliceCy, radius, midAngle, data[i], values[i], percent, i);
      angle = next;
    }
    this.animatePieSelection(group, previousAngle, startAngle);
    this.pieStartAngle = startAngle;
  };

  Chart.prototype.renderPieDataLabel = function(group, cx, cy, radius, angle, item, value, percent, index) {
    var config = this.options.dataLabel;
    var position;
    var label;
    var content;
    var data;
    if (!config) return;
    data = { name: pieName(item, index), value: value, percent: percent, index: index, item: item };
    content = typeof config.content === 'function' ? config.content(data) : formatDataLabel(config.content == null ? '{percent}%' : config.content, data);
    if (content == null || content === '') return;
    position = String(config.position || 'Inside').toLowerCase() === 'outside' ? 1.08 : .62;
    label = svgElement('text', {
      x: cx + Math.cos(angle) * radius * position,
      y: cy + Math.sin(angle) * radius * position + 4,
      class: 'fui-chart-data-label',
      'text-anchor': 'middle'
    });
    label.textContent = String(content);
    group.appendChild(label);
  };

  Chart.prototype.animatePieSelection = function(group, previousAngle, nextAngle) {
    var chartAnimation = this._chartAnimation;
    var delta;
    var duration = chartAnimation ? chartAnimation._getDuration() : 750;
    var easing = chartAnimation ? chartAnimation._getCssEasing() : 'cubic-bezier(.22, .8, .3, 1)';
    var self = this;
    if (!group || previousAngle == null || this.options.isAnimated === false) return;
    delta = normalizeAngle(previousAngle - nextAngle) * 180 / Math.PI;
    if (Math.abs(delta) < .01) return;
    group.style.transition = 'none';
    group.style.transform = 'rotate(' + delta + 'deg)';
    void group.getBoundingClientRect().width;
    if (this.pieAnimationRaf) cancelAnimationFrame(this.pieAnimationRaf);
    this.pieAnimationRaf = requestAnimationFrame(function() {
      self.pieAnimationRaf = 0;
      group.style.transition = 'transform ' + duration + 'ms ' + easing;
      group.style.transform = 'rotate(0deg)';
    });
  };

  Chart.prototype.renderCategoryLabel = function(type, plot, categories, index) {
    var count = Math.max(categories.length, 1);
    var maxLabels = type === 'bar' ? count : Math.max(2, Math.floor(plot.width / 100));
    var step = Math.max(1, Math.ceil(count / maxLabels));
    var text;
    if (type !== 'bar' && index % step !== 0 && index !== count - 1) return;
    if (type === 'bar') text = svgElement('text', { x: plot.x - 8, y: plot.y + plot.height * (index + 0.5) / count + 4, class: 'fui-chart-category-label', 'text-anchor': 'end' });
    else text = svgElement('text', { x: plot.x + plot.width * (index + 0.5) / count, y: plot.y + plot.height + 28, class: 'fui-chart-category-label', 'text-anchor': 'middle' });
    text.textContent = categories[index]; this.svg.appendChild(text);
  };

  Chart.prototype.renderLegend = function(series) {
    var self = this;
    this.legendElement.innerHTML = '';
    var position = getLegendPosition(this.options.legend);
    this.root.setAttribute('data-legend-position', position.toLowerCase());
    this.legendElement.style.display = position === 'None' ? 'none' : '';
    if (position === 'None') return;
    series.forEach(function(item, index) {
      var entry = document.createElement('span'); var swatch = document.createElement('i');
      entry.className = 'fui-chart-legend-item'; swatch.style.backgroundColor = self.getColor(index);
      entry.appendChild(swatch); entry.appendChild(document.createTextNode(item.name || ('Series ' + (index + 1)))); self.legendElement.appendChild(entry);
    });
  };

  Chart.prototype.handleClick = function(event) {
    var target = event.target.closest ? event.target.closest('.fui-chart-mark') : null;
    if (!target || String(this.options.selectionMode || 'None').toLowerCase() === 'none') return;
    this.options.selectedIndex = Number(target.dataset.pointIndex);
    this.options.selection = { seriesIndex: Number(target.dataset.seriesIndex), pointIndex: this.options.selectedIndex };
    if (normalizeChartType(this.options.chartType || this.options.type) === 'pie') this.refresh();
    else this.applySelection();
    this.emit('selectionChanged', { chart: this, selection: this.options.selection });
    if (this._collectionView) {
      this._collectionView.moveCurrentToPosition(this.options.selectedIndex);
    }
  };

  Chart.prototype.applySelection = function() {
    var selection = this.options.selection;
    Array.prototype.forEach.call(this.svg.querySelectorAll('.fui-chart-mark'), function(mark) {
      var selected = selection && Number(mark.dataset.pointIndex) === Number(selection.pointIndex) && (selection.seriesIndex == null || Number(mark.dataset.seriesIndex) === Number(selection.seriesIndex));
      mark.classList.toggle('fui-chart-selected', !!selected);
    });
  };

  Chart.prototype.handlePointerMove = function(event) {
    var target = event.target.closest ? event.target.closest('.fui-chart-mark') : null;
    var content;
    if (!target || this.options.tooltip === false) { this.hideTooltip(); return; }
    content = { series: target.dataset.series, category: target.dataset.category, value: Number(target.dataset.value), percent: target.dataset.percent ? Number(target.dataset.percent) : null };
    this.tooltipElement.textContent = typeof this.options.formatTooltip === 'function' ? this.options.formatTooltip(content) :
      this.options.tooltip && typeof this.options.tooltip.content === 'function' ? this.options.tooltip.content(content) :
      this.options.tooltip && typeof this.options.tooltip.content === 'string' ? formatTemplate(this.options.tooltip.content, content) :
      (content.series ? content.series + ' · ' : '') + content.category + ': ' + this.formatValue(content.value) + (content.percent == null ? '' : ' (' + content.percent.toFixed(1) + '%)');
    this.tooltipElement.style.left = event.offsetX + 12 + 'px'; this.tooltipElement.style.top = event.offsetY + 12 + 'px'; this.tooltipElement.classList.add('fui-chart-tooltip-visible');
  };
  Chart.prototype.hideTooltip = function() {
    if (this.tooltipElement && this.tooltipElement.classList) {
      this.tooltipElement.classList.remove('fui-chart-tooltip-visible');
    }
  };
  Chart.prototype.formatValue = function(value) { return typeof this.options.formatValue === 'function' ? String(this.options.formatValue(value)) : String(Math.round(value * 100) / 100); };
  Chart.prototype.getColor = function(index) { var colors = this.options.palette || this.options.colors; colors = colors && colors.length ? colors : DEFAULT_COLORS; return colors[index % colors.length]; };
  Chart.prototype.getMessage = function(key) { var locale = DEFAULT_MESSAGES[this.options.locale] || DEFAULT_MESSAGES.en; return locale[key] || DEFAULT_MESSAGES.en[key] || key; };
  Chart.prototype.dispose = function() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.pieAnimationRaf) cancelAnimationFrame(this.pieAnimationRaf);
    this.stopDataObserver();
    if (this._chartAnimation && typeof this._chartAnimation._detach === 'function') {
      this._chartAnimation._detach();
    }
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.unbindItemsSource();
    this.svg.removeEventListener('pointermove', this._boundPointerMove);
    this.svg.removeEventListener('pointerleave', this._boundPointerLeave);
    this.svg.removeEventListener('click', this._boundClick);
    this.host.innerHTML = '';
    this.tooltipElement = null;
  };

  function svgElement(name, attrs) { var element = document.createElementNS(SVG_NS, name); Object.keys(attrs || {}).forEach(function(key) { element.setAttribute(key, attrs[key]); }); return element; }
  function defineOptionProperties(chart, names) {
    names.forEach(function(name) {
      Object.defineProperty(chart, name, {
        configurable: true,
        enumerable: true,
        get: function() {
          return chart.options[name];
        },
        set: function(value) {
          if (name === 'itemsSource') {
            chart.setItemsSource(value);
            return;
          }
          chart.options[name] = value;
          if (name === 'observeData' || name === 'dataRefreshInterval') {
            chart.startDataObserver();
          }
          chart.invalidate();
        }
      });
    });
  }
  function mergeOptions(base, override) { var result = {}; Object.keys(base || {}).forEach(function(key) { result[key] = base[key]; }); Object.keys(override || {}).forEach(function(key) { result[key] = override[key]; }); return result; }
  function hasData(series) { return Array.isArray(series) && series.some(function(item) { return Array.isArray(item.data) && item.data.length; }); }
  function getMaxDataLength(series) { return series.reduce(function(max, item) { return Math.max(max, item.data && item.data.length || 0); }, 0); }
  function getValueRange(series, axis) { var values = []; series.forEach(function(item) { (item.data || []).forEach(function(value) { value = Number(value); if (isFinite(value)) values.push(value); }); }); var min = axis && isFinite(Number(axis.min)) ? Number(axis.min) : Math.min.apply(Math, values.concat([0])); var max = axis && isFinite(Number(axis.max)) ? Number(axis.max) : Math.max.apply(Math, values.concat([0])); if (min === max) max = min + 1; return { min: min, max: max }; }
  function valueToY(value, range, plot) { return plot.y + (range.max - value) / (range.max - range.min) * plot.height; }
  function valueToX(value, range, plot) { return plot.x + (value - range.min) / (range.max - range.min) * plot.width; }
  function getVerticalBar(plot, range, groupSize, barSize, seriesIndex, index, value) { var x = plot.x + index * groupSize + groupSize * 0.14 + seriesIndex * barSize; var y = valueToY(Math.max(value, 0), range, plot); var zero = valueToY(0, range, plot); return { x: x, y: Math.min(y, zero), width: Math.max(1, barSize - 1), height: Math.max(1, Math.abs(zero - valueToY(value, range, plot))) }; }
  function getHorizontalBar(plot, range, groupSize, barSize, seriesIndex, index, value) { var zero = valueToX(0, range, plot); var end = valueToX(value, range, plot); return { x: Math.min(zero, end), y: plot.y + index * groupSize + groupSize * 0.14 + seriesIndex * barSize, width: Math.max(1, Math.abs(end - zero)), height: Math.max(1, barSize - 1) }; }
  function linePath(points) { var output = ''; var open = false; points.forEach(function(point) { if (!point) { open = false; return; } output += (open ? ' L ' : 'M ') + point[0] + ' ' + point[1]; open = true; }); return output; }
  function pieValue(item) { return Math.max(0, Number(item && typeof item === 'object' ? item.value : item) || 0); }
  function pieName(item, index) { return item && typeof item === 'object' && item.name != null ? String(item.name) : String(index + 1); }
  function getPieStartAngle(values, total, selection, position) {
    var selectedIndex;
    var before = 0;
    var selectedValue;
    var i;
    if (!selection || selection.pointIndex == null || String(position || 'None').toLowerCase() === 'none') return -Math.PI / 2;
    selectedIndex = Number(selection.pointIndex);
    if (!isFinite(selectedIndex) || selectedIndex < 0 || selectedIndex >= values.length || !total) return -Math.PI / 2;
    for (i = 0; i < selectedIndex; i += 1) before += Math.max(0, values[i]);
    selectedValue = Math.max(0, values[selectedIndex]);
    return getPositionAngle(position) - Math.PI * 2 * (before + selectedValue / 2) / total;
  }
  function getPositionAngle(position) { var value = String(position || 'Top').toLowerCase(); if (value === 'right') return 0; if (value === 'bottom') return Math.PI / 2; if (value === 'left') return Math.PI; return -Math.PI / 2; }
  function clampOffset(value) { value = Number(value); return isFinite(value) ? Math.max(0, Math.min(value, 1)) : 0; }
  function normalizeAngle(value) { while (value > Math.PI) value -= Math.PI * 2; while (value < -Math.PI) value += Math.PI * 2; return value; }
  function polar(cx, cy, r, angle) { return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]; }
  function piePath(cx, cy, r, start, end) { var a = polar(cx, cy, r, start); var b = polar(cx, cy, r, end); return 'M ' + cx + ' ' + cy + ' L ' + a[0] + ' ' + a[1] + ' A ' + r + ' ' + r + ' 0 ' + (end - start > Math.PI ? 1 : 0) + ' 1 ' + b[0] + ' ' + b[1] + ' Z'; }
  function setDatum(element, series, category, value, percent, pointIndex, seriesIndex) { element.dataset.series = series; element.dataset.category = category; element.dataset.value = value; element.dataset.pointIndex = pointIndex == null ? 0 : pointIndex; element.dataset.seriesIndex = seriesIndex == null ? 0 : seriesIndex; if (percent != null) element.dataset.percent = percent; }

  function createDataModel(options, type) {
    var items = getItemsSourceItems(options.itemsSource);
    var series = options.series || [];
    var categories;
    if (!items) return { categories: options.categories || [], series: series, pieLegend: series };
    if (type === 'pie') {
      var data = items.map(function(item, index) { return { name: getBoundValue(item, options.bindingName) == null ? String(index + 1) : getBoundValue(item, options.bindingName), value: getBoundValue(item, options.binding) }; });
      return { categories: [], series: [{ name: options.header || '', data: data }], pieLegend: data.map(function(item) { return { name: item.name }; }) };
    }
    categories = items.map(function(item, index) { var value = getBoundValue(item, options.bindingX); return value == null ? String(index + 1) : value; });
    series = series.map(function(item) { return mergeOptions(item, { data: items.map(function(source) { return getBoundValue(source, item.binding); }) }); });
    return { categories: categories, series: series, pieLegend: [] };
  }
  function resolveChartLocale(value) {
    var normalized;
    value = String(value || 'en').trim().replace(/_/g, '-');
    normalized = DEFAULT_MESSAGES[value] ? value : normalizeChartLocale(value);
    return DEFAULT_MESSAGES[normalized] ? normalized : 'en';
  }
  function getBoundValue(item, binding) {
    var key;
    var parts;
    var value = item;
    var i;
    if (!binding) return item;
    key = String(binding);
    parts = bindingPathCache[key];
    if (!parts) {
      parts = key.split('.');
      if (bindingPathCacheSize >= BINDING_PATH_CACHE_LIMIT) {
        bindingPathCache = Object.create(null);
        bindingPathCacheSize = 0;
      }
      bindingPathCache[key] = parts;
      bindingPathCacheSize += 1;
    }
    for (i = 0; i < parts.length; i += 1) {
      if (value == null) return value;
      value = value[parts[i]];
    }
    return value;
  }
  function getLegendPosition(legend) { if (legend === false || legend && String(legend.position).toLowerCase() === 'none') return 'None'; return legend && legend.position ? String(legend.position) : 'Bottom'; }
  function formatTemplate(template, data) { return template.replace(/\{(seriesName|series|x|category|y|value|name|percent)\}/g, function(_, key) { var map = { seriesName: 'series', x: 'category', y: 'value', name: 'category' }; var value = data[map[key] || key]; return value == null ? '' : value; }); }
  function formatDataLabel(template, data) { return String(template).replace(/\{(name|value|percent)\}/g, function(_, key) { return key === 'percent' ? String(Math.round(data.percent * 10) / 10) : String(data[key] == null ? '' : data[key]); }); }
  function getDataSignature(options) {
    var items = getItemsSourceItems(options.itemsSource) || [];
    var bindings = [options.bindingX, options.bindingName, options.binding].concat((options.series || []).map(function(item) { return item.binding; })).filter(Boolean);
    if (!bindings.length) return JSON.stringify([options.categories, options.series]);
    return JSON.stringify(items.map(function(item) { return bindings.map(function(binding) { return getBoundValue(item, binding); }); }));
  }
  function getItemsSourceItems(itemsSource) {
    if (isCollectionView(itemsSource)) return itemsSource.items;
    return Array.isArray(itemsSource) ? itemsSource : null;
  }

  Chart.locales = DEFAULT_MESSAGES;
  Chart.themes = CHART_THEMES.slice();
  Chart.addLocale = function(name, messages) {
    if (name && messages) {
      DEFAULT_MESSAGES[String(name)] = mergeOptions(DEFAULT_MESSAGES.en, messages);
    }
    return Chart;
  };
  Chart.normalizeLocale = normalizeChartLocale;
  Chart.normalizeTheme = normalizeChartTheme;
  Chart.ChartType = { Column: 'Column', Bar: 'Bar', Line: 'Line', Pie: 'Pie' };
  Chart.Position = { None: 'None', Left: 'Left', Top: 'Top', Right: 'Right', Bottom: 'Bottom' };
  Chart.SelectionMode = { None: 'None', Point: 'Point', Series: 'Series' };
  return Chart;
}

export function createChartNamespace() {
  var Chart = createChartFactory();
  var ChartType = Chart.ChartType;
  var Position = {
    None: 'None',
    Left: 'Left',
    Top: 'Top',
    Right: 'Right',
    Bottom: 'Bottom',
    Auto: 'Auto',
    TopLeft: 'TopLeft',
    TopRight: 'TopRight',
    BottomLeft: 'BottomLeft',
    BottomRight: 'BottomRight',
    LeftTop: 'LeftTop',
    LeftBottom: 'LeftBottom',
    RightTop: 'RightTop',
    RightBottom: 'RightBottom'
  };
  var SelectionMode = Chart.SelectionMode;
  var AnimationMode = {
    All: 'All',
    Point: 'Point',
    Series: 'Series'
  };
  var Easing = {
    Linear: 'Linear',
    Swing: 'Swing',
    EaseInQuad: 'EaseInQuad',
    EaseOutQuad: 'EaseOutQuad',
    EaseInOutQuad: 'EaseInOutQuad',
    EaseInCubic: 'EaseInCubic',
    EaseOutCubic: 'EaseOutCubic',
    EaseInOutCubic: 'EaseInOutCubic',
    EaseInQuart: 'EaseInQuart',
    EaseOutQuart: 'EaseOutQuart',
    EaseInOutQuart: 'EaseInOutQuart',
    EaseInQuint: 'EaseInQuint',
    EaseOutQuint: 'EaseOutQuint',
    EaseInOutQuint: 'EaseInOutQuint',
    EaseInSine: 'EaseInSine',
    EaseOutSine: 'EaseOutSine',
    EaseInOutSine: 'EaseInOutSine',
    EaseInExpo: 'EaseInExpo',
    EaseOutExpo: 'EaseOutExpo',
    EaseInOutExpo: 'EaseInOutExpo',
    EaseInCirc: 'EaseInCirc',
    EaseOutCirc: 'EaseOutCirc',
    EaseInOutCirc: 'EaseInOutCirc',
    EaseInBack: 'EaseInBack',
    EaseOutBack: 'EaseOutBack',
    EaseInOutBack: 'EaseInOutBack',
    EaseInBounce: 'EaseInBounce',
    EaseOutBounce: 'EaseOutBounce',
    EaseInOutBounce: 'EaseInOutBounce',
    EaseInElastic: 'EaseInElastic',
    EaseOutElastic: 'EaseOutElastic',
    EaseInOutElastic: 'EaseInOutElastic'
  };
  var CSS_EASING = {
    Linear: 'linear',
    Swing: 'ease-in-out',
    EaseInQuad: 'cubic-bezier(.55, .085, .68, .53)',
    EaseOutQuad: 'cubic-bezier(.25, .46, .45, .94)',
    EaseInOutQuad: 'cubic-bezier(.455, .03, .515, .955)',
    EaseInCubic: 'cubic-bezier(.55, .055, .675, .19)',
    EaseOutCubic: 'cubic-bezier(.215, .61, .355, 1)',
    EaseInOutCubic: 'cubic-bezier(.645, .045, .355, 1)',
    EaseInQuart: 'cubic-bezier(.895, .03, .685, .22)',
    EaseOutQuart: 'cubic-bezier(.165, .84, .44, 1)',
    EaseInOutQuart: 'cubic-bezier(.77, 0, .175, 1)',
    EaseInQuint: 'cubic-bezier(.755, .05, .855, .06)',
    EaseOutQuint: 'cubic-bezier(.23, 1, .32, 1)',
    EaseInOutQuint: 'cubic-bezier(.86, 0, .07, 1)',
    EaseInSine: 'cubic-bezier(.47, 0, .745, .715)',
    EaseOutSine: 'cubic-bezier(.39, .575, .565, 1)',
    EaseInOutSine: 'cubic-bezier(.445, .05, .55, .95)',
    EaseInExpo: 'cubic-bezier(.95, .05, .795, .035)',
    EaseOutExpo: 'cubic-bezier(.19, 1, .22, 1)',
    EaseInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
    EaseInCirc: 'cubic-bezier(.6, .04, .98, .335)',
    EaseOutCirc: 'cubic-bezier(.075, .82, .165, 1)',
    EaseInOutCirc: 'cubic-bezier(.785, .135, .15, .86)',
    EaseInBack: 'cubic-bezier(.6, -.28, .735, .045)',
    EaseOutBack: 'cubic-bezier(.175, .885, .32, 1.275)',
    EaseInOutBack: 'cubic-bezier(.68, -.55, .265, 1.55)',
    EaseInBounce: 'cubic-bezier(.6, 0, .8, .2)',
    EaseOutBounce: 'cubic-bezier(.2, .8, .4, 1)',
    EaseInOutBounce: 'cubic-bezier(.5, 0, .5, 1)',
    EaseInElastic: 'cubic-bezier(.7, -.4, .8, .2)',
    EaseOutElastic: 'cubic-bezier(.2, .8, .3, 1.4)',
    EaseInOutElastic: 'cubic-bezier(.7, -.4, .3, 1.4)'
  };

  function ChartAnimationEvent(sender) {
    this.sender = sender;
    this.handlers = [];
  }

  ChartAnimationEvent.prototype.addHandler = function(handler, self) {
    if (typeof handler === 'function') {
      this.handlers.push({ handler: handler, self: self });
    }
    return this;
  };

  ChartAnimationEvent.prototype.removeHandler = function(handler, self) {
    var hasSelf = arguments.length > 1;
    this.handlers = this.handlers.filter(function(record) {
      return record.handler !== handler || hasSelf && record.self !== self;
    });
    return this;
  };

  ChartAnimationEvent.prototype.raise = function(args) {
    var sender = this.sender;
    this.handlers.slice().forEach(function(record) {
      record.handler.call(record.self || sender, sender, args || {});
    });
  };

  function ChartAnimation(chart, options) {
    options = options || {};
    if (!(chart instanceof Chart)) {
      throw new TypeError('ChartAnimation requires a fabui.chart.Chart or fabui.chart.Pie instance.');
    }
    this._chart = chart;
    this.animationMode = normalizeAnimationMode(options.animationMode);
    this.axisAnimation = options.axisAnimation === true;
    this.duration = normalizeAnimationDuration(options.duration);
    this.easing = normalizeAnimationEasing(options.easing);
    this.ended = new ChartAnimationEvent(this);
    this._endedTimer = 0;
    if (chart._chartAnimation && chart._chartAnimation !== this) {
      chart._chartAnimation._detach();
    }
    chart._chartAnimation = this;
    this.animate();
  }

  Object.defineProperty(ChartAnimation.prototype, 'chart', {
    enumerable: true,
    get: function() {
      return this._chart;
    }
  });

  ChartAnimation.prototype.animate = function() {
    if (!this._chart || this._chart.disposed) return;
    this._chart.options.animation = true;
    this._chart.playAnimation();
  };

  ChartAnimation.prototype._prepare = function() {
    var chart = this._chart;
    var root = chart && chart.root;
    var elements;
    var mode;
    var duration;
    var maxStep = 0;
    if (!root) return;
    mode = normalizeAnimationMode(this.animationMode);
    duration = normalizeAnimationDuration(this.duration);
    root.style.setProperty('--fui-chart-animation-duration', duration + 'ms');
    root.style.setProperty('--fui-chart-animation-easing', this._getCssEasing());
    root.setAttribute('data-animation-mode', mode.toLowerCase());
    root.classList.toggle('fui-chart-axis-animate', this.axisAnimation === true);
    elements = Array.prototype.slice.call(
      root.querySelectorAll('.fui-chart-mark, .fui-chart-line')
    );
    elements.forEach(function(element, index) {
      var step = 0;
      if (mode === AnimationMode.Point) {
        step = normalizeAnimationStep(element.dataset.pointIndex, index);
      } else if (mode === AnimationMode.Series) {
        step = normalizeAnimationStep(element.dataset.seriesIndex, 0);
      }
      maxStep = Math.max(maxStep, step);
      element._fuiAnimationStep = step;
    });
    elements.forEach(function(element) {
      var delay = maxStep > 0 ? duration * .55 * element._fuiAnimationStep / maxStep : 0;
      element.style.setProperty('--fui-chart-animation-delay', delay + 'ms');
      element.style.setProperty(
        '--fui-chart-item-animation-duration',
        Math.max(1, duration - delay) + 'ms'
      );
      delete element._fuiAnimationStep;
    });
  };

  ChartAnimation.prototype._getDuration = function() {
    return normalizeAnimationDuration(this.duration);
  };

  ChartAnimation.prototype._getCssEasing = function() {
    return CSS_EASING[normalizeAnimationEasing(this.easing)] || CSS_EASING.Swing;
  };

  ChartAnimation.prototype._handleAnimationStart = function() {
    var self = this;
    if (this._endedTimer) clearTimeout(this._endedTimer);
    this._endedTimer = setTimeout(function() {
      self._endedTimer = 0;
      if (self._chart && !self._chart.disposed) {
        self.ended.raise({});
      }
    }, this._getDuration());
  };

  ChartAnimation.prototype._detach = function() {
    var chart = this._chart;
    var root = chart && chart.root;
    if (this._endedTimer) clearTimeout(this._endedTimer);
    this._endedTimer = 0;
    if (root) {
      root.style.removeProperty('--fui-chart-animation-duration');
      root.style.removeProperty('--fui-chart-animation-easing');
      root.removeAttribute('data-animation-mode');
      root.classList.remove('fui-chart-axis-animate');
      Array.prototype.forEach.call(
        root.querySelectorAll('.fui-chart-mark, .fui-chart-line'),
        function(element) {
          element.style.removeProperty('--fui-chart-animation-delay');
          element.style.removeProperty('--fui-chart-item-animation-duration');
        }
      );
    }
    if (chart && chart._chartAnimation === this) {
      chart._chartAnimation = null;
    }
    this._chart = null;
  };

  function normalizeAnimationMode(value) {
    value = String(value || AnimationMode.All).toLowerCase();
    if (value === 'point') return AnimationMode.Point;
    if (value === 'series') return AnimationMode.Series;
    return AnimationMode.All;
  }

  function normalizeAnimationDuration(value) {
    value = Number(value);
    return isFinite(value) && value >= 0 ? value : 400;
  }

  function normalizeAnimationEasing(value) {
    var name = String(value || Easing.Swing);
    return Object.prototype.hasOwnProperty.call(Easing, name) ? Easing[name] : Easing.Swing;
  }

  function normalizeAnimationStep(value, fallback) {
    value = Number(value);
    return isFinite(value) && value >= 0 ? value : fallback;
  }

  function Pie(element, options) {
    var pieOptions = {};
    Object.keys(options || {}).forEach(function(key) {
      pieOptions[key] = options[key];
    });
    pieOptions.chartType = ChartType.Pie;
    pieOptions.type = 'pie';
    Chart.call(this, element, pieOptions);
    delete this.chartType;
  }

  Pie.prototype = Object.create(Chart.prototype);
  Pie.prototype.constructor = Pie;
  Pie.prototype.setType = function() {
    return this;
  };
  Pie.prototype.setOptions = function(options) {
    var pieOptions = {};
    Object.keys(options || {}).forEach(function(key) {
      pieOptions[key] = options[key];
    });
    pieOptions.chartType = ChartType.Pie;
    pieOptions.type = 'pie';
    Chart.prototype.setOptions.call(this, pieOptions);
    return this;
  };
  Pie.locales = Chart.locales;
  Pie.themes = Chart.themes;
  Pie.addLocale = function(name, messages) {
    Chart.addLocale(name, messages);
    return Pie;
  };
  Pie.normalizeLocale = Chart.normalizeLocale;
  Pie.normalizeTheme = Chart.normalizeTheme;
  Pie.Position = Position;
  Pie.SelectionMode = SelectionMode;

  Chart.Position = Position;

  return {
    Chart: Chart,
    Pie: Pie,
    ChartType: ChartType,
    Position: Position,
    SelectionMode: SelectionMode,
    animation: {
      ChartAnimation: ChartAnimation,
      AnimationMode: AnimationMode,
      Easing: Easing
    }
  };
}
