import { ColorPopup } from './color-popup.js?v=20260729-color-palette-layout-v2';
import { normalizeEditorIconDescriptors } from './editor-icons.js?v=20260718-editor-icons-v1';

export function createColorEditBoxFactory(TextBox, editorDefinitions) {
  'use strict';

  if (typeof TextBox !== 'function') {
    throw new Error('fabui.ColorEditBox requires fabui.TextBox.');
  }

  editorDefinitions = editorDefinitions || {};
  var editorDefinition = editorDefinitions.color || null;

  var localePacks = {
    en: {
      openColorText: 'Open color palette',
      clearColorText: 'Clear color'
    }
  };

  var defaultPalette = ColorPopup.defaultPalette;

  var defaults = {
    autoUnmask: false,
    iconWidth: 28,
    panelWidth: 162,
    locale: 'en',
    openColorText: null,
    clearColorText: null,
    palette: defaultPalette,
    colors: null,
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
    name = String(name || 'en').trim().replace(/_/g, '-');
    if (localePacks[name]) return name;
    if (/^zh-(?:tw|hant)(?:-|$)/i.test(name)) {
      return localePacks['zh-TW'] ? 'zh-TW' : 'en';
    }
    if (/^zh-(?:cn|hans)(?:-|$)/i.test(name) || /^zh$/i.test(name)) {
      return localePacks['zh-CN'] ? 'zh-CN' : 'en';
    }
    return 'en';
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
    if (!Object.prototype.hasOwnProperty.call(userOptions, 'clearColorText')) {
      this._options.clearColorText = localePacks[this._options.locale].clearColorText;
    }
    this._options.palette = Array.isArray(this._options.palette) ?
      this._options.palette.slice() :
      defaultPalette.slice();
    if (Array.isArray(this._options.colors) && this._options.colors.length) {
      this._options.palette = this._options.colors.slice();
    }
    icons = normalizeEditorIconDescriptors(this._options.icons);
    icons.push({
      iconCls: 'fui-colorbox-trigger fui-combobox-arrow',
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
    this._colorPopup = new ColorPopup({
      anchor: this._shell,
      openClassHost: this._shell,
      panelWidth: this._options.panelWidth,
      ariaLabel: this._options.openColorText,
      clearText: this._options.clearColorText,
      palette: this._options.palette,
      closeOnSelect: true,
      normalize: this._normalizeColor.bind(this),
      onSelect: function(value) {
        self.setValue(value);
        self._invoke('onSelect', self.getValue());
        self._emit('select', { value: self.getValue() });
      },
      onShow: function() {
        self._panelVisible = true;
        self._invoke('onShowPanel');
        self._emit('showPanel', { panel: self._colorPopup.panel });
      },
      onHide: function() {
        self._panelVisible = false;
        self._invoke('onHidePanel');
        self._emit('hidePanel', { panel: self._colorPopup.panel });
      }
    });
    this._panel = this._colorPopup.panel;
    this._syncColor();
    source.__fabuiColorEditBox = this;
  }

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
    this._editor.style.setProperty('--fui-colorbox-value', normalized || 'transparent');
    this._editor.style.setProperty('--fg-editor-color', normalized || 'transparent');
    this._colorPopup.setValue(this.getValue());
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
  ColorEditBox.prototype.panel = function() { return this._colorPopup.panel; };
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

  ColorEditBox.prototype.fix = function() {
    return this.setValue(this._editor.value);
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

  ColorEditBox.prototype.setLocale = function(locale, messages) {
    var name = String(locale || 'en').trim().replace(/_/g, '-');
    var pack;
    if (messages) localePacks[name] = assign({}, localePacks.en, messages);
    this._options.locale = normalizeLocale(name);
    pack = localePacks[this._options.locale] || localePacks.en;
    this._options.openColorText = pack.openColorText;
    this._options.clearColorText = pack.clearColorText;
    if (this._trigger) {
      this._trigger.title = this._options.openColorText;
      this._trigger.setAttribute('aria-label', this._options.openColorText);
    }
    this._colorPopup.setOptions({
      ariaLabel: this._options.openColorText,
      clearText: this._options.clearColorText
    });
    return this;
  };

  ColorEditBox.prototype.setTheme = function(theme) {
    this._colorPopup.setTheme(theme);
    return this;
  };

  ColorEditBox.prototype.showPanel = function() {
    if (this._options.disabled || this._options.readonly) return this;
    this._colorPopup.setOptions({
      anchor: this._shell,
      openClassHost: this._shell,
      panelWidth: this._options.panelWidth,
      ariaLabel: this._options.openColorText,
      clearText: this._options.clearColorText,
      palette: this._options.palette
    });
    this._colorPopup.setValue(this.getValue() || '#ff0000');
    this._colorPopup.show();
    return this;
  };

  ColorEditBox.prototype.hidePanel = function() {
    this._colorPopup.hide();
    return this;
  };

  ColorEditBox.prototype.togglePanel = function() {
    if (this._colorPopup.isOpen()) return this.hidePanel();
    return this.showPanel();
  };

  ColorEditBox.prototype.resize = function(width, height) {
    if (width != null) this._options.width = width;
    if (height != null) this._options.height = height;
    this._textbox.resize(width, height);
    this._colorPopup.position();
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
    this._colorPopup.destroy();
    delete this._source.__fabuiColorEditBox;
    this._textbox.destroy();
    this._listeners = {};
  };

  ColorEditBox.defaults = defaults;
  ColorEditBox.editorDefinition = editorDefinition;
  ColorEditBox.locales = localePacks;
  ColorEditBox.addLocale = function(name, pack) {
    if (name && pack) localePacks[name] = assign({}, localePacks.en, pack);
    return ColorEditBox;
  };
  return ColorEditBox;
}
