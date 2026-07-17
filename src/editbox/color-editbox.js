export function createColorEditBoxFactory(TextBox, editorDefinitions) {
  'use strict';

  if (typeof TextBox !== 'function') {
    throw new Error('fabui.ColorEditBox requires fabui.TextBox.');
  }

  editorDefinitions = editorDefinitions || {};
  var editorDefinition = editorDefinitions.color || null;

  var localePacks = {
    en: { openColorText: 'Open color palette' },
    'zh-TW': { openColorText: '開啟色盤' },
    'zh-CN': { openColorText: '打开色板' }
  };

  var defaultColors = [
    '#000000', '#404040', '#737373', '#a6a6a6', '#d9d9d9', '#ffffff',
    '#ff0000', '#ff4500', '#ffa500', '#ffff00', '#9acd32', '#008000',
    '#008080', '#00ced1', '#00bfff', '#0000ff', '#4b0082', '#800080',
    '#ff1493', '#a52a2a', '#ffc7ce', '#fce4d6', '#fff2cc', '#e2f0d9',
    '#d0e0e3', '#ddebf7', '#d9e1f2', '#e4dfec', '#f4cccc', '#c9daf8'
  ];

  var defaults = {
    iconWidth: 28,
    panelWidth: 202,
    locale: 'en',
    openColorText: null,
    colors: defaultColors,
    onChange: null,
    onSelect: null,
    onShowPanel: null,
    onHidePanel: null
  };

  function assign(target) {
    var index;
    var source;
    var key;
    for (index = 1; index < arguments.length; index += 1) {
      source = arguments[index] || {};
      for (key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
      }
    }
    return target;
  }

  function resolveElement(element) {
    return typeof element === 'string' ? document.querySelector(element) : element;
  }

  function normalizeLocale(name) {
    if (localePacks[name]) return name;
    if (/^zh(?:-|_)?tw/i.test(name || '')) return 'zh-TW';
    if (/^zh/i.test(name || '')) return 'zh-CN';
    return 'en';
  }

  function cssSize(value, fallback) {
    if (value == null || value === '') return fallback + 'px';
    return typeof value === 'number' ? value + 'px' : String(value);
  }

  function ColorEditBox(element, options) {
    var source = resolveElement(element);
    var userOptions = options || {};
    var textOptions;
    var icons;
    var self = this;
    if (!(this instanceof ColorEditBox)) return new ColorEditBox(element, options);
    if (!source || !/^(INPUT|TEXTAREA)$/.test(source.tagName)) {
      throw new Error('fabui.ColorEditBox requires an input or textarea element.');
    }
    if (source.__fabuiColorEditBox) return source.__fabuiColorEditBox;

    this._source = source;
    this._listeners = {};
    this._panelVisible = false;
    this._destroyed = false;
    this._options = assign({}, defaults, userOptions);
    this._options.locale = normalizeLocale(this._options.locale);
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'openColorText')) {
      this._options.openColorText = localePacks[this._options.locale].openColorText;
    }
    this._options.colors = Array.isArray(this._options.colors) ?
      this._options.colors.slice() : defaultColors.slice();

    icons = Array.isArray(this._options.icons) ? this._options.icons.slice() : [];
    icons.push({
      iconCls: 'fui-colorbox-trigger',
      align: 'right',
      width: this._options.iconWidth,
      title: this._options.openColorText,
      onClick: function() { self.togglePanel(); }
    });
    textOptions = assign({}, userOptions, {
      cls: ((this._options.cls || '') + ' fui-colorbox').trim(),
      icons: icons,
      onChange: function(newValue, oldValue) {
        self._syncColor();
        self._invoke('onChange', newValue, oldValue);
        self._emit('change', { value: newValue, oldValue: oldValue });
      }
    });
    this._textbox = new TextBox(source, textOptions);
    this._editor = this._textbox.textbox();
    if (editorDefinition && editorDefinition.className) {
      editorDefinition.className.split(/\s+/).forEach(function(className) {
        if (className) self._editor.classList.add(className);
      });
    }
    this._field = this._editor.closest('.fui-textbox-field');
    this._shell = this._editor.closest('.fui-textbox');
    this._trigger = this._textbox.getIcon(icons.length - 1);
    this._buildPanel();
    this._bind();
    this._syncColor();
    source.__fabuiColorEditBox = this;
  }

  ColorEditBox.prototype._buildPanel = function() {
    var self = this;
    var panel = document.createElement('div');
    panel.className = 'fui-colorbox-panel';
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', this._options.openColorText);
    panel.style.width = cssSize(this._options.panelWidth, 202);
    this._options.colors.forEach(function(color) {
      var normalized = self._normalizeColor(color);
      var swatch;
      if (!normalized) return;
      swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'fui-colorbox-swatch';
      swatch.setAttribute('role', 'option');
      swatch.setAttribute('aria-label', String(color));
      swatch.title = String(color);
      swatch.dataset.value = String(color);
      swatch.dataset.normalizedValue = normalized;
      swatch.style.backgroundColor = normalized;
      panel.appendChild(swatch);
    });
    panel.setAttribute('aria-hidden', 'true');
    document.body.appendChild(panel);
    this._panel = panel;
  };

  ColorEditBox.prototype._bind = function() {
    var self = this;
    this._onPanelClick = function(event) {
      var swatch = event.target.closest('.fui-colorbox-swatch');
      if (!swatch) return;
      self.setValue(swatch.dataset.value);
      self.hidePanel();
      self.focus();
      self._invoke('onSelect', self.getValue());
      self._emit('select', { value: self.getValue() });
    };
    this._onDocumentMouseDown = function(event) {
      if (!self._panelVisible) return;
      if (self._panel.contains(event.target) || self._field.contains(event.target)) return;
      self.hidePanel();
    };
    this._onDocumentKeyDown = function(event) {
      if (event.key === 'Escape' && self._panelVisible) {
        event.preventDefault();
        self.hidePanel();
        self.focus();
      }
    };
    this._onWindowResize = function() {
      if (self._panelVisible) self._positionPanel();
    };
    this._onWindowScroll = this._onWindowResize;
    this._panel.addEventListener('click', this._onPanelClick);
    document.addEventListener('mousedown', this._onDocumentMouseDown);
    document.addEventListener('keydown', this._onDocumentKeyDown);
    window.addEventListener('resize', this._onWindowResize);
    window.addEventListener('scroll', this._onWindowScroll, true);
  };

  ColorEditBox.prototype._normalizeColor = function(value) {
    if (!editorDefinition || typeof editorDefinition.normalize !== 'function') {
      return value == null ? '' : String(value);
    }
    return editorDefinition.normalize(value);
  };

  ColorEditBox.prototype._parseColor = function(value) {
    if (!editorDefinition || typeof editorDefinition.parse !== 'function') {
      return value == null ? '' : String(value);
    }
    return editorDefinition.parse(value);
  };

  ColorEditBox.prototype._syncColor = function() {
    var normalized = this._normalizeColor(this.getValue());
    if (this._trigger) {
      this._trigger.style.setProperty('--fui-colorbox-value', normalized || 'transparent');
    }
    Array.prototype.forEach.call(this._panel.children, function(swatch) {
      var selected = Boolean(normalized) && swatch.dataset.normalizedValue === normalized;
      swatch.classList.toggle('fui-colorbox-swatch-selected', selected);
      swatch.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  };

  ColorEditBox.prototype._positionPanel = function() {
    var rect;
    var width;
    var height;
    var left;
    var top;
    if (!this._panelVisible) return;
    rect = this._shell.getBoundingClientRect();
    width = this._panel.offsetWidth;
    height = this._panel.offsetHeight;
    left = rect.left;
    top = rect.bottom + 2;
    if (left + width > window.innerWidth - 6) left = Math.max(6, window.innerWidth - width - 6);
    if (top + height > window.innerHeight - 6 && rect.top > height + 8) {
      top = rect.top - height - 2;
    }
    this._panel.style.left = Math.round(left) + 'px';
    this._panel.style.top = Math.round(top) + 'px';
  };

  ColorEditBox.prototype._invoke = function(name) {
    var callback = this._options[name];
    if (typeof callback === 'function') {
      return callback.apply(this, Array.prototype.slice.call(arguments, 1));
    }
    return undefined;
  };

  ColorEditBox.prototype._emit = function(name, detail) {
    (this._listeners[name] || []).slice().forEach(function(listener) {
      listener(detail);
    });
  };

  ColorEditBox.prototype.options = function() { return this._options; };
  ColorEditBox.prototype.textbox = function() { return this._textbox.textbox(); };
  ColorEditBox.prototype.button = function() { return this._textbox.button(); };
  ColorEditBox.prototype.panel = function() { return this._panel; };
  ColorEditBox.prototype.getIcon = function(index) { return this._textbox.getIcon(index); };
  ColorEditBox.prototype.getText = function() { return this._textbox.getText(); };
  ColorEditBox.prototype.getValue = function() { return this._textbox.getValue(); };

  ColorEditBox.prototype.setText = function(value) {
    return this.setValue(value);
  };

  ColorEditBox.prototype.setValue = function(value, silent) {
    this._textbox.setValue(this._parseColor(value), silent);
    this._syncColor();
    return this;
  };

  ColorEditBox.prototype.initValue = function(value) {
    this._textbox.initValue(this._parseColor(value));
    this._syncColor();
    return this;
  };

  ColorEditBox.prototype.clear = function() {
    return this.setValue('');
  };

  ColorEditBox.prototype.reset = function() {
    this._textbox.reset();
    this._syncColor();
    return this;
  };

  ColorEditBox.prototype.focus = function() {
    this._textbox.focus();
    return this;
  };

  ColorEditBox.prototype.showPanel = function() {
    if (this._panelVisible || this._options.disabled || this._options.readonly) return this;
    this._panelVisible = true;
    this._panel.style.display = 'grid';
    this._panel.setAttribute('aria-hidden', 'false');
    this._positionPanel();
    this._invoke('onShowPanel');
    this._emit('showPanel', { panel: this._panel });
    return this;
  };

  ColorEditBox.prototype.hidePanel = function() {
    if (!this._panelVisible) return this;
    this._panelVisible = false;
    this._panel.style.display = 'none';
    this._panel.setAttribute('aria-hidden', 'true');
    this._invoke('onHidePanel');
    this._emit('hidePanel', { panel: this._panel });
    return this;
  };

  ColorEditBox.prototype.togglePanel = function() {
    return this._panelVisible ? this.hidePanel() : this.showPanel();
  };

  ColorEditBox.prototype.resize = function(width, height) {
    if (width != null) this._options.width = width;
    if (height != null) this._options.height = height;
    this._textbox.resize(width, height);
    this._positionPanel();
    return this;
  };

  ColorEditBox.prototype.disable = function() {
    this.hidePanel();
    this._options.disabled = true;
    this._textbox.disable();
    return this;
  };

  ColorEditBox.prototype.enable = function() {
    this._options.disabled = false;
    this._textbox.enable();
    return this;
  };

  ColorEditBox.prototype.readonly = function(mode) {
    this._options.readonly = mode !== false;
    if (this._options.readonly) this.hidePanel();
    this._textbox.readonly(mode);
    return this;
  };

  ColorEditBox.prototype.setEditable = function(mode) {
    this._options.editable = mode !== false;
    this._textbox.setEditable(mode);
    return this;
  };

  ColorEditBox.prototype.on = function(name, listener) {
    if (typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  ColorEditBox.prototype.off = function(name, listener) {
    var listeners = this._listeners[name];
    if (!listeners) return this;
    this._listeners[name] = listener ? listeners.filter(function(item) {
      return item !== listener;
    }) : [];
    return this;
  };

  ColorEditBox.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.hidePanel();
    this._panel.removeEventListener('click', this._onPanelClick);
    document.removeEventListener('mousedown', this._onDocumentMouseDown);
    document.removeEventListener('keydown', this._onDocumentKeyDown);
    window.removeEventListener('resize', this._onWindowResize);
    window.removeEventListener('scroll', this._onWindowScroll, true);
    if (this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    delete this._source.__fabuiColorEditBox;
    this._textbox.destroy();
    this._listeners = {};
  };

  ColorEditBox.defaults = defaults;
  ColorEditBox.editorDefinition = editorDefinition;
  return ColorEditBox;
}
