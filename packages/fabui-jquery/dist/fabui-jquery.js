(function(global) {
var DATA_PREFIX = 'fabui.jquery.';
var EDITBOX_KEY = DATA_PREFIX + 'editbox';
var WINDOW_KEY = DATA_PREFIX + 'window';
var VALIDATEBOX_KEY = DATA_PREFIX + 'validatebox';

var COMPONENTS = {
  layout: {
    constructorName: 'Layout',
    classes: ['easyui-layout'],
    jqueryMethods: ['panel']
  },
  panel: {
    constructorName: 'Panel',
    classes: ['easyui-panel'],
    jqueryMethods: ['panel', 'header', 'body', 'footer']
  },
  tabs: {
    constructorName: 'Tabs',
    classes: ['easyui-tabs'],
    jqueryMethods: ['getSelected', 'getTab', 'getTabs', 'tabs', 'add', 'update', 'select']
  },
  window: {
    constructorName: 'Window',
    classes: ['easyui-window'],
    dataKey: WINDOW_KEY,
    jqueryMethods: ['window', 'panel', 'header', 'body', 'footer']
  },
  dialog: {
    constructorName: 'Window',
    classes: ['easyui-dialog'],
    dataKey: WINDOW_KEY,
    defaults: { modal: true },
    jqueryMethods: ['window', 'panel', 'header', 'body', 'footer']
  },
  form: {
    constructorName: 'Form',
    classes: ['easyui-form']
  },
  linkbutton: {
    constructorName: 'Button',
    classes: ['easyui-linkbutton']
  },
  menu: {
    constructorName: 'Menu',
    classes: ['easyui-menu']
  },
  menubutton: {
    constructorName: 'MenuButton',
    classes: ['easyui-menubutton']
  },
  splitbutton: {
    constructorName: 'SplitButton',
    classes: ['easyui-splitbutton']
  },
  tooltip: {
    constructorName: 'Tooltip',
    classes: ['easyui-tooltip'],
    jqueryMethods: ['tip']
  },
  tree: {
    constructorName: 'Tree',
    classes: ['easyui-tree'],
    jqueryMethods: ['getNode', 'getSelected', 'getRoot', 'getRoots', 'getParent', 'getChildren']
  },
  filebox: {
    constructorName: 'FileBox',
    classes: ['easyui-filebox'],
    jqueryMethods: ['textbox', 'button']
  },
  switchbutton: {
    constructorName: 'SwitchButton',
    classes: ['easyui-switchbutton']
  }
};

var EDITBOX_PLUGINS = {
  textbox: { editor: 'text', classes: ['easyui-textbox'] },
  numberbox: { editor: 'number', classes: ['easyui-numberbox'] },
  datebox: { editor: 'date', classes: ['easyui-datebox'] },
  combobox: { editor: 'combo', classes: ['easyui-combobox'] },
  colorbox: { editor: 'color', classes: ['easyui-colorbox'] }
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

function splitTopLevel(value, delimiter) {
  var parts = [];
  var start = 0;
  var depth = 0;
  var quote = '';
  var escaped = false;
  var index;
  var character;
  for (index = 0; index < value.length; index += 1) {
    character = value.charAt(index);
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '[' || character === '{' || character === '(') depth += 1;
    else if (character === ']' || character === '}' || character === ')') depth = Math.max(0, depth - 1);
    else if (character === delimiter && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function findTopLevelColon(value) {
  var parts = splitTopLevel(value, ':');
  return parts.length > 1 ? parts[0].length : -1;
}

function unquote(value) {
  var quote = value.charAt(0);
  return value.slice(1, -1).replace(/\\(.)/g, function(match, character) {
    if (character === 'n') return '\n';
    if (character === 'r') return '\r';
    if (character === 't') return '\t';
    return character === quote ? quote : character;
  });
}

function parseValue(value) {
  var text = String(value == null ? '' : value).trim();
  var number;
  if (!text) return '';
  if ((text.charAt(0) === '"' && text.charAt(text.length - 1) === '"') ||
      (text.charAt(0) === "'" && text.charAt(text.length - 1) === "'")) {
    return unquote(text);
  }
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null') return null;
  if (/^-?(?:\d+|\d*\.\d+)$/.test(text)) {
    number = Number(text);
    return isNaN(number) ? text : number;
  }
  if (text.charAt(0) === '[' && text.charAt(text.length - 1) === ']') {
    text = text.slice(1, -1).trim();
    return text ? splitTopLevel(text, ',').map(parseValue) : [];
  }
  if (text.charAt(0) === '{' && text.charAt(text.length - 1) === '}') {
    return parseFabUiDataOptions(text);
  }
  return text;
}

function parseFabUiDataOptions(value) {
  var text = String(value == null ? '' : value).trim();
  var options = {};
  if (text.charAt(0) === '{' && text.charAt(text.length - 1) === '}') {
    text = text.slice(1, -1);
  }
  splitTopLevel(text, ',').forEach(function(entry) {
    var colon = findTopLevelColon(entry);
    var key;
    if (colon < 0) return;
    key = entry.slice(0, colon).trim();
    if ((key.charAt(0) === '"' && key.charAt(key.length - 1) === '"') ||
        (key.charAt(0) === "'" && key.charAt(key.length - 1) === "'")) {
      key = unquote(key);
    }
    if (!key || key === '__proto__' || key === 'prototype' || key === 'constructor') return;
    options[key] = parseValue(entry.slice(colon + 1));
  });
  return options;
}

function elementOptions(element) {
  var options = parseFabUiDataOptions(
    element && element.getAttribute ? element.getAttribute('data-options') : ''
  );
  var style = element && element.style || {};
  if (options.width == null && style.width) options.width = style.width;
  if (options.height == null && style.height) options.height = style.height;
  return options;
}

function isElement(value) {
  return Boolean(value && value.nodeType === 1);
}

function containsElement(value) {
  return isElement(value) || Array.isArray(value) && value.some(isElement);
}

function isFabUiPublicMethod(instance, name) {
  return Boolean(instance && typeof name === 'string' && name.charAt(0) !== '_' &&
    typeof instance[name] === 'function');
}

function createFabUiJQuery($, fabui) {
  var plugins = {};
  var parserOrder = [
    'layout', 'panel', 'tabs', 'dialog', 'window', 'form', 'linkbutton',
    'menu', 'menubutton', 'splitbutton', 'tooltip', 'tree', 'filebox', 'switchbutton',
    'textbox', 'numberbox', 'datebox', 'combobox', 'colorbox'
  ];

  if (!$ || !$.fn) throw new Error('fabui-jquery requires jQuery.');
  if (!fabui) throw new Error('fabui-jquery requires FabUI.');

  function getData(element, key) {
    return $.data(element, key);
  }

  function setData(element, key, value) {
    $.data(element, key, value);
    return value;
  }

  function removeData(element, key) {
    $.removeData(element, key);
  }

  function instanceOptions(instance) {
    if (!instance) return {};
    if (instance._options) return instance._options;
    if (typeof instance.options === 'function') return instance.options() || {};
    return instance.options || instance._options || {};
  }

  function normalizeMethodResult(result, definition, pluginName, command) {
    if (result == null) return result;
    if (pluginName === 'tabs' && (command === 'tabs' || command === 'getTabs')) {
      return Array.prototype.map.call(result, function(panel) { return $(panel); });
    }
    if (definition.jqueryMethods && containsElement(result)) return $(result);
    return result;
  }

  function normalizeLayoutOptions(element, options) {
    var regions = assign({}, options && options.regions || {});
    if (!element || !element.children) return options;
    Array.prototype.forEach.call(element.children, function(child) {
      var regionOptions = elementOptions(child);
      var region = String(regionOptions.region || '').toLowerCase();
      if (['north', 'south', 'east', 'west', 'center'].indexOf(region) < 0) return;
      delete regionOptions.region;
      regions[region] = assign({}, regions[region] || {}, regionOptions, { element: child });
    });
    options.regions = regions;
    return options;
  }

  function updateInstance(instance, options) {
    if (!options || !Object.keys(options).length) return instance;
    if (typeof instance.setOptions === 'function') {
      instance.setOptions(options);
      return instance;
    }
    assign(instanceOptions(instance), options);
    if (typeof instance._applyOptions === 'function') instance._applyOptions();
    if (typeof instance.refresh === 'function') instance.refresh();
    else if (typeof instance.invalidate === 'function') instance.invalidate();
    return instance;
  }

  function syntheticTabPanel(element, command, args) {
    var root = element && element.closest ? element.closest('.fui-tabs') : null;
    var tabs = root && fabui.Tabs && typeof fabui.Tabs.getControl === 'function' ?
      fabui.Tabs.getControl(root) : null;
    var options = tabs && typeof tabs.getTabOptions === 'function' ? tabs.getTabOptions(element) : null;
    var tab;
    if (!tabs || !options) return { handled: false };
    if (command === 'options') {
      tab = element.id && root.querySelector ?
        root.querySelector('[role="tab"][aria-controls="' + element.id + '"]') : null;
      if (tab) options.tab = $(tab);
      return { handled: true, value: options };
    }
    if (command === 'panel' || command === 'body') return { handled: true, value: $(element) };
    if (command === 'close') {
      element.hidden = true;
      return { handled: true, value: undefined };
    }
    if (command === 'open') {
      element.hidden = false;
      return { handled: true, value: undefined };
    }
    if (command === 'resize') return { handled: true, value: undefined };
    return { handled: false };
  }

  function registerComponent(pluginName, definition) {
    var dataKey = definition.dataKey || DATA_PREFIX + pluginName;
    var Constructor = fabui[definition.constructorName];

    if (typeof Constructor !== 'function') return null;

    function getInstance(element) {
      var instance = getData(element, dataKey);
      if (!instance && typeof Constructor.getControl === 'function') {
        instance = Constructor.getControl(element);
        if (instance) setData(element, dataKey, instance);
      }
      return instance;
    }

    function create(element, options) {
      var resolved = assign({}, definition.defaults || {}, elementOptions(element), options || {});
      if (pluginName === 'layout') normalizeLayoutOptions(element, resolved);
      var instance = new Constructor(element, resolved);
      setData(element, dataKey, instance);
      $(element).triggerHandler('initialized.' + pluginName, [instance]);
      return instance;
    }

    function destroy(element, instance) {
      if (!instance) return;
      if (typeof instance.dispose === 'function') instance.dispose();
      else if (typeof instance.destroy === 'function') instance.destroy();
      removeData(element, dataKey);
      $(element).triggerHandler('destroyed.' + pluginName, [instance]);
    }

    function plugin(command) {
      var args = Array.prototype.slice.call(arguments, 1);
      var first = this[0];
      var result;

      if (typeof command !== 'string') {
        return this.each(function() {
          var current = getInstance(this);
          if (current) updateInstance(current, command || {});
          else create(this, command || {});
        });
      }
      if (command === 'instance') return first ? getInstance(first) : undefined;
      if (command === 'options') {
        if (!first) return undefined;
        var optionsInstance = getInstance(first);
        var optionsSynthetic;
        if (!optionsInstance && pluginName === 'panel') {
          optionsSynthetic = syntheticTabPanel(first, command, args);
          if (optionsSynthetic.handled) return optionsSynthetic.value;
        }
        if (!optionsInstance) optionsInstance = create(first, {});
        return instanceOptions(optionsInstance);
      }
      if (command === 'option' && args.length === 1 && typeof args[0] === 'string') {
        if (!first) return undefined;
        var optionInstance = getInstance(first) || create(first, {});
        return instanceOptions(optionInstance)[args[0]];
      }

      this.each(function() {
        var current = getInstance(this);
        var methodResult;
        var synthetic;
        if (!current && pluginName === 'panel') {
          synthetic = syntheticTabPanel(this, command, args);
          if (synthetic.handled) {
            if (synthetic.value !== undefined) result = synthetic.value;
            return;
          }
        }
        if (!current) current = create(this, {});
        if (command === 'destroy') {
          destroy(this, current);
          return;
        }
        if (command === 'option') {
          var patch = typeof args[0] === 'string' ? {} : args[0] || {};
          if (typeof args[0] === 'string') patch[args[0]] = args[1];
          updateInstance(current, patch);
          return;
        }
        if (!isFabUiPublicMethod(current, command)) {
          throw new Error('Unknown or private ' + pluginName + ' method: ' + command);
        }
        var compatibilityValid = true;
        if (pluginName === 'form' && command === 'validate' && this.querySelectorAll) {
          Array.prototype.forEach.call(this.querySelectorAll('.validatebox-text'), function(input) {
            if ($(input).validatebox('validate') === false) compatibilityValid = false;
          });
        }
        methodResult = current[command].apply(current, args.map(function(value) {
          return value && value.jquery && value[0] ? value[0] : value;
        }));
        if (pluginName === 'form' && command === 'validate') {
          methodResult = compatibilityValid && methodResult !== false;
        }
        if (methodResult !== undefined && methodResult !== current) {
          result = normalizeMethodResult(methodResult, definition, pluginName, command);
        }
      });
      return result === undefined ? this : result;
    }

    $.fn[pluginName] = plugin;
    plugins[pluginName] = {
      dataKey: dataKey,
      getInstance: getInstance,
      create: create,
      destroy: function(element) { destroy(element, getInstance(element)); }
    };
    return plugins[pluginName];
  }

  function registerEditBox(pluginName, definition) {
    var Constructor = fabui.EditBox;
    var jqueryMethods = ['textbox', 'button', 'panel', 'calendar', 'getIcon'];

    if (typeof Constructor !== 'function') return null;

    function getInstance(element) {
      var instance = getData(element, EDITBOX_KEY);
      if (!instance && typeof Constructor.getControl === 'function') {
        instance = Constructor.getControl(element);
        if (instance) setData(element, EDITBOX_KEY, instance);
      }
      return instance;
    }

    function create(element, options) {
      var resolved = assign({}, elementOptions(element), options || {});
      if (resolved.editor == null && definition.editor != null) {
        resolved.editor = definition.editor;
      }
      if (Object.prototype.hasOwnProperty.call(resolved, 'iconCls') && !resolved.icons) {
        resolved.icons = resolved.iconCls ? [{
          iconCls: resolved.iconCls,
          align: resolved.iconAlign === 'left' ? 'left' : 'right',
          width: resolved.iconWidth
        }] : [];
      }
      var instance = new Constructor(element, resolved);
      var editor = typeof instance.textbox === 'function' ? instance.textbox() : null;
      var fieldName = element.getAttribute && element.getAttribute('name');
      element.classList.add('textbox-f');
      element.classList.add((definition.markerClass || pluginName) + '-f');
      if (fieldName) {
        element.setAttribute('textboxname', fieldName);
        if (pluginName === 'numberbox') element.setAttribute('numberboxname', fieldName);
      }
      if (editor && editor.classList) {
        editor.classList.add('textbox-text', 'validatebox-text');
      }
      setData(element, EDITBOX_KEY, instance);
      $(element).triggerHandler('initialized.' + pluginName, [instance]);
      return instance;
    }

    function recreate(element, instance, options) {
      var merged = assign({}, instanceOptions(instance), options || {});
      var value = typeof instance.getValue === 'function' ? instance.getValue() : undefined;
      if (merged.editor == null && typeof instance.getEditorType === 'function') {
        merged.editor = instance.getEditorType();
      }
      if (typeof instance.dispose === 'function') instance.dispose();
      removeData(element, EDITBOX_KEY);
      if (!Object.prototype.hasOwnProperty.call(merged, 'value') && value !== undefined) merged.value = value;
      return create(element, merged);
    }

    function plugin(command) {
      var args = Array.prototype.slice.call(arguments, 1);
      var first = this[0];
      var result;
      if (typeof command !== 'string') {
        return this.each(function() {
          var current = getInstance(this);
          if (current && Object.keys(command || {}).length) recreate(this, current, command || {});
          else if (!current) create(this, command || {});
        });
      }
      if (command === 'instance') return first ? getInstance(first) : undefined;
      if (command === 'options') {
        if (!first) return undefined;
        var optionsInstance = getInstance(first) || create(first, {});
        return instanceOptions(optionsInstance);
      }
      if (command === 'option' && args.length === 1 && typeof args[0] === 'string') {
        if (!first) return undefined;
        var optionInstance = getInstance(first) || create(first, {});
        return instanceOptions(optionInstance)[args[0]];
      }
      this.each(function() {
        var current = getInstance(this);
        var methodResult;
        if (!current) current = create(this, {});
        if (command === 'destroy') {
          if (typeof current.dispose === 'function') current.dispose();
          removeData(this, EDITBOX_KEY);
          $(this).triggerHandler('destroyed.' + pluginName, [current]);
          return;
        }
        if (command === 'option') {
          var patch = typeof args[0] === 'string' ? {} : args[0] || {};
          if (typeof args[0] === 'string') patch[args[0]] = args[1];
          recreate(this, current, patch);
          return;
        }
        if (command === 'validate' || command === 'enableValidation' ||
            command === 'disableValidation' || command === 'resetValidation') {
          var editor = typeof current.textbox === 'function' ? current.textbox() : this;
          methodResult = $(editor).validatebox(command);
          if (command === 'validate') result = methodResult;
          return;
        }
        if (!isFabUiPublicMethod(current, command)) {
          throw new Error('Unknown or private ' + pluginName + ' method: ' + command);
        }
        methodResult = current[command].apply(current, args);
        if (methodResult !== undefined && methodResult !== current) {
          result = jqueryMethods.indexOf(command) >= 0 && containsElement(methodResult) ? $(methodResult) : methodResult;
        }
      });
      return result === undefined ? this : result;
    }

    $.fn[pluginName] = plugin;
    plugins[pluginName] = { dataKey: EDITBOX_KEY, getInstance: getInstance, create: create };
    return plugins[pluginName];
  }

  function registerValidateBox() {
    var defaults = {
      required: false,
      validType: null,
      novalidate: false,
      validateOnCreate: true,
      validateOnBlur: false,
      missingMessage: 'This field is required.',
      invalidMessage: 'Please enter a valid value.',
      rules: {}
    };

    function getState(element) {
      var state = getData(element, VALIDATEBOX_KEY);
      if (!state) {
        state = { options: assign({}, defaults, elementOptions(element)) };
        setData(element, VALIDATEBOX_KEY, state);
      }
      return state;
    }

    function ruleEntries(validType) {
      if (!validType) return [];
      if (typeof validType === 'string') return [{ name: validType, params: [] }];
      if (Array.isArray(validType)) return validType.map(function(name) {
        return { name: name, params: [] };
      });
      return Object.keys(validType).map(function(name) {
        var params = validType[name];
        return { name: name, params: Array.isArray(params) ? params : [params] };
      });
    }

    function validate(element, state) {
      var options = state.options;
      var value = element.value == null ? '' : String(element.value);
      var message = '';
      if (options.novalidate) return true;
      if (options.required && !value.trim()) message = options.missingMessage;
      if (!message) {
        ruleEntries(options.validType).some(function(entry) {
          var rule = defaults.rules[entry.name];
          if (!rule || typeof rule.validator !== 'function') return false;
          if (rule.validator.call(element, value, entry.params) !== false) return false;
          message = rule.message || options.invalidMessage;
          entry.params.forEach(function(param, index) {
            message = String(message).replace('{' + index + '}', param == null ? '' : param);
          });
          return true;
        });
      }
      if (typeof element.setCustomValidity === 'function') element.setCustomValidity(message);
      if (element.classList) element.classList.toggle('validatebox-invalid', Boolean(message));
      return !message;
    }

    function plugin(command) {
      var args = Array.prototype.slice.call(arguments, 1);
      var first = this[0];
      var result;
      if (typeof command !== 'string') {
        return this.each(function() {
          assign(getState(this).options, command || {});
        });
      }
      if (command === 'options') return first ? getState(first).options : undefined;
      this.each(function() {
        var state = getState(this);
        if (command === 'enableValidation') state.options.novalidate = false;
        else if (command === 'disableValidation') {
          state.options.novalidate = true;
          if (typeof this.setCustomValidity === 'function') this.setCustomValidity('');
          if (this.classList) this.classList.remove('validatebox-invalid');
        } else if (command === 'resetValidation') {
          if (typeof this.setCustomValidity === 'function') this.setCustomValidity('');
          if (this.classList) this.classList.remove('validatebox-invalid');
        } else if (command === 'validate' || command === 'isValid') {
          result = validate(this, state);
        } else if (command === 'destroy') {
          removeData(this, VALIDATEBOX_KEY);
        } else {
          throw new Error('Unknown validatebox method: ' + command);
        }
      });
      return result === undefined ? this : result;
    }

    plugin.defaults = defaults;
    $.fn.validatebox = plugin;
    plugins.validatebox = { dataKey: VALIDATEBOX_KEY, defaults: defaults };
    return plugins.validatebox;
  }

  function selectorFor(pluginName) {
    var definition = COMPONENTS[pluginName] || EDITBOX_PLUGINS[pluginName];
    return definition && definition.classes ? definition.classes.map(function(name) {
      return '.' + name;
    }).join(',') : '';
  }

  function parse(context) {
    var root = context || (typeof document !== 'undefined' ? document : null);
    var parsed = [];
    if (root && root.jquery) root = root[0] || null;
    if (typeof root === 'string' && typeof document !== 'undefined') {
      try {
        root = document.querySelector(root);
      } catch (error) {
        root = null;
      }
    }
    parserOrder.forEach(function(pluginName) {
      var selector = selectorFor(pluginName);
      var elements = [];
      var adapter = plugins[pluginName];
      if (!selector || !adapter || !root) return;
      if (root.matches && root.matches(selector)) elements.push(root);
      if (root.querySelectorAll) {
        elements = elements.concat(Array.prototype.slice.call(root.querySelectorAll(selector)));
      }
      elements.forEach(function(element) {
        if (!adapter.getInstance(element)) adapter.create(element, elementOptions(element));
        parsed.push(element);
      });
    });
    if ($.parser && typeof $.parser.onComplete === 'function') $.parser.onComplete.call(root, root);
    return $(parsed);
  }

  Object.keys(COMPONENTS).forEach(function(pluginName) {
    registerComponent(pluginName, COMPONENTS[pluginName]);
  });
  Object.keys(EDITBOX_PLUGINS).forEach(function(pluginName) {
    registerEditBox(pluginName, EDITBOX_PLUGINS[pluginName]);
  });
  registerEditBox('EditBox', { markerClass: 'editbox' });
  registerValidateBox();

  $.parser = $.parser || {};
  $.parser.plugins = parserOrder.slice();
  $.parser.parse = parse;
  $.parser.parseOptions = function(target) { return elementOptions(target); };

  return {
    plugins: plugins,
    parse: parse,
    parseOptions: elementOptions
  };
}



var plugin = createFabUiJQuery(global.jQuery, global.fabui);
global.fabuiJQuery = plugin;
})(typeof globalThis !== "undefined" ? globalThis : window);
