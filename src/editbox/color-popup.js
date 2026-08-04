var activeColorPopup = null;
var COLOR_POPUP_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black', 'mono'
];

function assignColorPopupOptions(target) {
  var index;
  var source;
  var key;
  for (index = 1; index < arguments.length; index += 1) {
    source = arguments[index] || {};
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

function resolveColorPopupElement(element) {
  return typeof element === 'string' ? document.querySelector(element) : element;
}

function normalizeColorPopupTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return COLOR_POPUP_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

function findColorPopupTheme(element) {
  var current = resolveColorPopupElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < COLOR_POPUP_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + COLOR_POPUP_THEMES[index])) {
        return COLOR_POPUP_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

var DEFAULT_COLOR_PALETTE = [
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#006400', '#ff00ff', '#ffa500', '',
  '#000000', '#444444', '#666666', '#999999', '#cccccc', '#eeeeee', '#f3f3f3', '#fffffe',
  '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79',
  '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47',
  '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#073763', '#20124d', '#4c1130'
];

export function ColorPopup(options) {
  if (!(this instanceof ColorPopup)) return new ColorPopup(options);
  this.options = assignColorPopupOptions({}, ColorPopup.defaults, options || {});
  this.destroyed = false;
  this.visible = false;
  this._openEventsBound = false;
  this.value = '';
  this._normalizeOptions();
  this._build();
  this.setTheme(this.options.theme);
  this._bind();
  this.render();
}

ColorPopup.defaults = {
  anchor: null,
  theme: 'inherit',
  themeSource: null,
  className: '',
  panelWidth: 162,
  ariaLabel: 'Color picker',
  clearText: 'Clear color',
  palette: DEFAULT_COLOR_PALETTE,
  normalize: function(value) {
    return value == null ? '' : String(value);
  },
  containsTarget: null,
  openClassHost: null,
  closeOnSelect: false,
  onSelect: null,
  onShow: null,
  onHide: null
};

ColorPopup.prototype._normalizeOptions = function() {
  this.options.palette = Array.isArray(this.options.palette) ?
    this.options.palette.slice() :
    DEFAULT_COLOR_PALETTE.slice();
  if (typeof this.options.normalize !== 'function') {
    this.options.normalize = ColorPopup.defaults.normalize;
  }
};

ColorPopup.prototype._build = function() {
  var panel = document.createElement('div');
  panel.className = ('fui-colorbox-panel ' + (this.options.className || '')).trim();
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-label', this.options.ariaLabel);
  document.body.appendChild(panel);
  this.panel = panel;
};

ColorPopup.prototype._bind = function() {
  var self = this;
  this._onPanelPointerDown = function(event) {
    self._handlePointerDown(event);
  };
  this._onPanelClick = function(event) {
    self._handleClick(event);
  };
  this._onDocumentPointerDown = function(event) {
    if (self.visible &&
      !self.panel.contains(event.target) &&
      !self._containsTarget(event.target)) {
      self.hide();
    }
  };
  this._onDocumentKeyDown = function(event) {
    if (event.key === 'Escape' && self.visible) {
      event.preventDefault();
      self.hide();
    }
  };
  this._onWindowChange = function() {
    if (self.visible) self.position();
  };
  this.panel.addEventListener('pointerdown', this._onPanelPointerDown);
  this.panel.addEventListener('click', this._onPanelClick);
};

ColorPopup.prototype._bindOpenEvents = function() {
  if (this._openEventsBound) return;
  this._openEventsBound = true;
  document.addEventListener('pointerdown', this._onDocumentPointerDown, true);
  document.addEventListener('keydown', this._onDocumentKeyDown);
  window.addEventListener('resize', this._onWindowChange);
  window.addEventListener('scroll', this._onWindowChange, true);
};

ColorPopup.prototype._unbindOpenEvents = function() {
  if (!this._openEventsBound) return;
  this._openEventsBound = false;
  document.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
  document.removeEventListener('keydown', this._onDocumentKeyDown);
  window.removeEventListener('resize', this._onWindowChange);
  window.removeEventListener('scroll', this._onWindowChange, true);
};

ColorPopup.prototype._containsTarget = function(target) {
  var anchor = resolveColorPopupElement(this.options.anchor);
  if (anchor && (anchor === target || anchor.contains(target))) return true;
  return typeof this.options.containsTarget === 'function' &&
    this.options.containsTarget(target) === true;
};

ColorPopup.prototype.setOptions = function(options) {
  assignColorPopupOptions(this.options, options || {});
  this._normalizeOptions();
  this.panel.className = ('fui-colorbox-panel ' + (this.options.className || '')).trim();
  this.setTheme(this.options.theme);
  this.panel.setAttribute('aria-label', this.options.ariaLabel);
  this.render();
  return this;
};

ColorPopup.prototype.setTheme = function(theme) {
  var index;
  var source;
  this.options.theme = theme == null ? 'inherit' : String(theme);
  source = this.options.themeSource || this.options.anchor;
  this.theme = this.options.theme === 'inherit' ?
    findColorPopupTheme(source) :
    normalizeColorPopupTheme(this.options.theme);
  for (index = 0; index < COLOR_POPUP_THEMES.length; index += 1) {
    this.panel.classList.remove('fg-theme-' + COLOR_POPUP_THEMES[index]);
  }
  this.panel.classList.add('fg-theme-' + this.theme);
  return this;
};

ColorPopup.prototype.setValue = function(value) {
  var normalized = this.options.normalize(value);
  this.value = value == null ? '' : String(value);
  this._updateSelection(normalized);
  return this;
};

ColorPopup.prototype.render = function() {
  var palette = document.createElement('div');
  var index;
  var raw;
  var normalized;
  var isClear;
  var swatch;
  palette.className = 'fui-colorbox-palette';
  palette.setAttribute('role', 'listbox');
  for (index = 0; index < this.options.palette.length; index += 1) {
    raw = this.options.palette[index];
    isClear = raw == null || String(raw).trim() === '';
    normalized = this.options.normalize(raw);
    if (!normalized && !isClear) continue;
    swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'fui-colorbox-swatch' +
      (isClear ? ' fui-colorbox-clear icon-clear' : '');
    swatch.setAttribute('role', 'option');
    swatch.setAttribute('aria-label', isClear ? this.options.clearText : String(raw));
    swatch.title = isClear ? this.options.clearText : String(raw);
    swatch.dataset.value = isClear ? '' : String(raw);
    swatch.dataset.normalizedValue = normalized;
    swatch.dataset.clear = isClear ? 'true' : 'false';
    swatch.style.backgroundColor = isClear ? '#ffffff' : normalized;
    palette.appendChild(swatch);
  }
  this.panel.textContent = '';
  this.panel.appendChild(palette);
  this.paletteElement = palette;
  this.panel.style.width = typeof this.options.panelWidth === 'number' ?
    this.options.panelWidth + 'px' :
    String(this.options.panelWidth || ColorPopup.defaults.panelWidth + 'px');
  this._updateSelection(this.options.normalize(this.value));
  return this;
};

ColorPopup.prototype._updateSelection = function(normalized) {
  var emptyValue = String(this.value == null ? '' : this.value).trim() === '';
  if (!this.paletteElement) return;
  Array.prototype.forEach.call(this.paletteElement.children, function(swatch) {
    var selected = swatch.dataset.clear === 'true' ?
      emptyValue :
      Boolean(normalized) && swatch.dataset.normalizedValue === normalized;
    swatch.classList.toggle('fui-colorbox-swatch-selected', selected);
    swatch.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
};

ColorPopup.prototype._handlePointerDown = function(event) {
  var swatch = event.target.closest('.fui-colorbox-swatch');
  var value;
  if (!this.visible) return;
  if (!swatch) return;
  event.preventDefault();
  event.stopPropagation();
  value = swatch.dataset.value;
  this.setValue(value);
  if (typeof this.options.onSelect === 'function') {
    this.options.onSelect(value, this);
  }
};

ColorPopup.prototype._handleClick = function(event) {
  var swatch;
  if (!this.visible || !this.options.closeOnSelect) return;
  swatch = event.target.closest('.fui-colorbox-swatch');
  if (!swatch) return;
  event.preventDefault();
  event.stopPropagation();
  this.hide();
};

ColorPopup.prototype.show = function() {
  var openClassHost;
  if (this.destroyed || this.visible) return this;
  if (activeColorPopup && activeColorPopup !== this) activeColorPopup.hide();
  this.setTheme(this.options.theme);
  this.visible = true;
  this.panel.hidden = false;
  this._bindOpenEvents();
  activeColorPopup = this;
  openClassHost = resolveColorPopupElement(this.options.openClassHost);
  if (openClassHost) openClassHost.classList.add('fui-colorbox-open');
  this.position();
  if (typeof this.options.onShow === 'function') this.options.onShow(this);
  return this;
};

ColorPopup.themes = COLOR_POPUP_THEMES.slice();

ColorPopup.prototype.hide = function() {
  var openClassHost;
  if (!this.visible) return this;
  this.visible = false;
  this.panel.hidden = true;
  this._unbindOpenEvents();
  if (activeColorPopup === this) activeColorPopup = null;
  openClassHost = resolveColorPopupElement(this.options.openClassHost);
  if (openClassHost) openClassHost.classList.remove('fui-colorbox-open');
  if (typeof this.options.onHide === 'function') this.options.onHide(this);
  return this;
};

ColorPopup.prototype.toggle = function() {
  return this.visible ? this.hide() : this.show();
};

ColorPopup.prototype.isOpen = function() {
  return this.visible;
};

ColorPopup.prototype.handleKeyDown = function(event) {
  if ((event.key === 'ArrowDown' && (event.altKey || event.metaKey)) ||
    event.key === 'F4') {
    event.preventDefault();
    this.show();
    return true;
  }
  if (event.key === 'Escape' && this.visible) {
    event.preventDefault();
    this.hide();
    return true;
  }
  return false;
};

ColorPopup.prototype.position = function() {
  var anchor = resolveColorPopupElement(this.options.anchor);
  var rect;
  var width;
  var height;
  var left;
  var top;
  if (!this.visible || !anchor) return this;
  rect = anchor.getBoundingClientRect();
  width = this.panel.offsetWidth;
  height = this.panel.offsetHeight;
  left = rect.left;
  top = rect.bottom + 2;
  if (left + width > window.innerWidth - 6) {
    left = Math.max(6, window.innerWidth - width - 6);
  }
  if (top + height > window.innerHeight - 6 && rect.top > height + 8) {
    top = rect.top - height - 2;
  }
  this.panel.style.left = Math.round(left) + 'px';
  this.panel.style.top = Math.round(top) + 'px';
  return this;
};

ColorPopup.prototype.destroy = function() {
  if (this.destroyed) return;
  this.hide();
  this.destroyed = true;
  this.panel.removeEventListener('pointerdown', this._onPanelPointerDown);
  this.panel.removeEventListener('click', this._onPanelClick);
  this._unbindOpenEvents();
  if (this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);
};

ColorPopup.defaultPalette = DEFAULT_COLOR_PALETTE.slice();
