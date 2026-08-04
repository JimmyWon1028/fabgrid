import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFabUiJQuery,
  isFabUiPublicMethod,
  parseFabUiDataOptions
} from '../packages/fabui-jquery/src/fabui-jquery.js';

function createJQueryStub() {
  var dataStore = new WeakMap();
  var eventStore = new WeakMap();

  function Collection(elements) {
    var self = this;
    this.length = elements.length;
    this.jquery = 'stub';
    elements.forEach(function(element, index) { self[index] = element; });
  }

  Collection.prototype.each = function(callback) {
    var index;
    for (index = 0; index < this.length; index += 1) callback.call(this[index], index, this[index]);
    return this;
  };

  Collection.prototype.triggerHandler = function(name, args) {
    var element = this[0];
    var handlers = element ? eventStore.get(element) || {} : {};
    (handlers[name] || []).forEach(function(handler) {
      handler.apply(element, [name].concat(args || []));
    });
    return this;
  };

  Collection.prototype.on = function(name, handler) {
    return this.each(function() {
      var handlers = eventStore.get(this) || {};
      handlers[name] = handlers[name] || [];
      handlers[name].push(handler);
      eventStore.set(this, handlers);
    });
  };

  function $(value) {
    if (value == null) return new Collection([]);
    return new Collection(Array.isArray(value) ? value : [value]);
  }

  $.fn = Collection.prototype;
  $.data = function(element, key, value) {
    var values = dataStore.get(element) || {};
    if (arguments.length === 3) {
      values[key] = value;
      dataStore.set(element, values);
    }
    return values[key];
  };
  $.removeData = function(element, key) {
    var values = dataStore.get(element) || {};
    delete values[key];
    dataStore.set(element, values);
  };
  return $;
}

function createElement(className, dataOptions) {
  var classes = String(className || '').split(/\s+/).filter(Boolean);
  var attributes = {};
  return {
    nodeType: 1,
    className: classes.join(' '),
    classList: {
      add: function() {
        Array.prototype.forEach.call(arguments, function(name) {
          if (classes.indexOf(name) < 0) classes.push(name);
        });
      },
      remove: function(name) {
        classes = classes.filter(function(item) { return item !== name; });
      },
      toggle: function(name, force) {
        if (force) this.add(name);
        else this.remove(name);
      },
      contains: function(name) { return classes.indexOf(name) >= 0; }
    },
    style: {},
    children: [],
    hidden: false,
    getAttribute: function(name) {
      if (name === 'data-options') return dataOptions || '';
      return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null;
    },
    setAttribute: function(name, value) { attributes[name] = String(value); },
    matches: function(selector) {
      var classes = selector.split(',').map(function(item) { return item.trim().slice(1); });
      return classes.some(function(name) {
        return this.classList.contains(name);
      }, this);
    },
    querySelectorAll: function() { return []; },
    closest: function() { return null; }
  };
}

function FakeControl(element, options) {
  this.element = element;
  this.options = Object.assign({}, options);
  this.disposed = false;
  element.__fakeControl = this;
}

FakeControl.getControl = function(element) { return element && element.__fakeControl; };
FakeControl.prototype.resize = function() { return this; };
FakeControl.prototype.body = function() { return this.element.bodyElement; };
FakeControl.prototype.dispose = function() { this.disposed = true; };
FakeControl.prototype._privateMethod = function() {};

function FakeOptionsControl(element, options) {
  FakeControl.call(this, element, options);
  this._options = this.options;
  delete this.options;
}

FakeOptionsControl.prototype = Object.create(FakeControl.prototype);
FakeOptionsControl.prototype.constructor = FakeOptionsControl;
FakeOptionsControl.getControl = FakeControl.getControl;
FakeOptionsControl.prototype.options = function() { return this._options; };
FakeOptionsControl.prototype.setOptions = function(options) {
  Object.assign(this._options, options || {});
  return this;
};

function FakeForm(element, options) {
  FakeOptionsControl.call(this, element, options);
}

FakeForm.prototype = Object.create(FakeOptionsControl.prototype);
FakeForm.prototype.constructor = FakeForm;
FakeForm.getControl = FakeControl.getControl;
FakeForm.prototype.validate = function() { return true; };

function FakeTabs(element, options) {
  FakeOptionsControl.call(this, element, options);
  this.panels = [];
}

FakeTabs.prototype = Object.create(FakeOptionsControl.prototype);
FakeTabs.prototype.constructor = FakeTabs;
FakeTabs.getControl = FakeControl.getControl;
FakeTabs.prototype.getTabs = function() { return this.panels; };
FakeTabs.prototype.tabs = FakeTabs.prototype.getTabs;

function FakeEditBox(element, options) {
  FakeOptionsControl.call(this, element, options);
  this.value = options && options.value || '';
  this.editor = options && (options.editor || options.type);
  this.editorElement = createElement();
  element.__fabuiEditBox = this;
}

FakeEditBox.prototype = Object.create(FakeOptionsControl.prototype);
FakeEditBox.prototype.constructor = FakeEditBox;
FakeEditBox.getControl = function(element) { return element && element.__fabuiEditBox; };
FakeEditBox.prototype.getEditorType = function() { return this.editor; };
FakeEditBox.prototype.getValue = function() { return this.value; };
FakeEditBox.prototype.setValue = function(value) { this.value = value; return this; };
FakeEditBox.prototype.textbox = function() { return this.editorElement; };
FakeEditBox.prototype.dispose = function() { this.disposed = true; };

function createFabUiStub() {
  return {
    Layout: FakeControl,
    Panel: FakeControl,
    Tabs: FakeTabs,
    Window: FakeControl,
    Form: FakeForm,
    Button: FakeControl,
    Menu: FakeOptionsControl,
    MenuButton: FakeOptionsControl,
    SplitButton: FakeOptionsControl,
    Tooltip: FakeOptionsControl,
    Tree: FakeOptionsControl,
    FileBox: FakeOptionsControl,
    SwitchButton: FakeOptionsControl,
    EditBox: FakeEditBox
  };
}

test('FabUI jQuery parser safely reads EasyUI-style data-options', function() {
  assert.deepEqual(
    parseFabUiDataOptions("fit:true,width:300,title:'功能表',items:[1,'A'],nested:{closed:false}"),
    {
      fit: true,
      width: 300,
      title: '功能表',
      items: [1, 'A'],
      nested: { closed: false }
    }
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(parseFabUiDataOptions('__proto__:{polluted:true}'), '__proto__'),
    false
  );
});

test('FabUI jQuery wrapper protects private methods', function() {
  var instance = new FakeControl(createElement(), {});
  assert.equal(isFabUiPublicMethod(instance, 'resize'), true);
  assert.equal(isFabUiPublicMethod(instance, '_privateMethod'), false);
});

test('FabUI component plugins initialize, expose options and remain chainable', function() {
  var $ = createJQueryStub();
  var element = createElement('easyui-panel', "fit:true,title:'Main'");
  element.bodyElement = createElement();
  createFabUiJQuery($, createFabUiStub());
  assert.equal($(element).panel({ border: false })[0], element);
  assert.equal($(element).panel('options').fit, true);
  assert.equal($(element).panel('options').border, false);
  assert.equal($(element).panel('body').jquery, 'stub');
  assert.equal($(element).panel('resize')[0], element);
});

test('FabUI Layout wrapper maps EasyUI child region options', function() {
  var $ = createJQueryStub();
  var center = createElement('', "region:'center',border:false");
  var west = createElement('', "region:'west',split:true");
  var element = createElement('easyui-layout', 'fit:true');
  element.children = [west, center];
  createFabUiJQuery($, createFabUiStub());
  $(element).layout({});
  assert.equal($(element).layout('options').regions.center.element, center);
  assert.equal($(element).layout('options').regions.center.border, false);
  assert.equal($(element).layout('options').regions.west.element, west);
  assert.equal($(element).layout('options').regions.west.split, true);
});

test('FabUI SplitButton wrapper uses the public SplitButton control', function() {
  var $ = createJQueryStub();
  var element = createElement('easyui-splitbutton', "menu:'#queryMenu'");
  createFabUiJQuery($, createFabUiStub());
  $(element).splitbutton({ plain: true });
  assert.equal($(element).splitbutton('instance') instanceof FakeOptionsControl, true);
  assert.equal($(element).splitbutton('options').menu, '#queryMenu');
  assert.equal($(element).splitbutton('options').plain, true);
});

test('FabUI Tabs wrapper returns an array of jQuery panels', function() {
  var $ = createJQueryStub();
  var element = createElement('easyui-tabs');
  var panels = [createElement(), createElement()];
  createFabUiJQuery($, createFabUiStub());
  $(element).tabs({});
  $(element).tabs('instance').panels = panels;
  var tabs = $(element).tabs('tabs');
  var getTabs = $(element).tabs('getTabs');
  assert.equal(Array.isArray(tabs), true);
  assert.equal(tabs.length, 2);
  assert.equal(tabs[0].jquery, 'stub');
  assert.equal(tabs[0][0], panels[0]);
  assert.equal(getTabs[1][0], panels[1]);
});

test('FabUI EditBox aliases share one instance and return jQuery textbox', function() {
  var $ = createJQueryStub();
  var element = createElement('easyui-numberbox', 'precision:2');
  element.setAttribute('name', 'amount');
  createFabUiJQuery($, createFabUiStub());
  $(element).numberbox({ value: 12.5 });
  var instance = $(element).numberbox('instance');
  assert.equal(instance.editor, 'number');
  assert.equal($(element).textbox('instance'), instance);
  assert.equal($(element).textbox('textbox').jquery, 'stub');
  assert.equal($(element).numberbox('setValue', 20)[0], element);
  assert.equal($(element).textbox('getValue'), 20);
  assert.equal(element.classList.contains('textbox-f'), true);
  assert.equal(element.classList.contains('numberbox-f'), true);
  assert.equal(element.getAttribute('numberboxname'), 'amount');
});

test('FabUI generic EditBox wrapper accepts the public type option', function() {
  var $ = createJQueryStub();
  var element = createElement();
  createFabUiJQuery($, createFabUiStub());
  $(element).EditBox({ type: 'color', value: '#008000' });
  var instance = $(element).EditBox('instance');
  assert.equal(instance.editor, 'color');
  assert.equal($(element).textbox('instance'), instance);
  assert.equal($(element).EditBox('getValue'), '#008000');
  assert.equal(element.classList.contains('editbox-f'), true);
});

test('FabUI validatebox keeps mutable rules and bridges EditBox validation', function() {
  var $ = createJQueryStub();
  var element = createElement();
  createFabUiJQuery($, createFabUiStub());
  $.fn.validatebox.defaults.rules.startsWithA = {
    validator: function(value) { return value.indexOf('A') === 0; },
    message: 'Must start with A'
  };
  $(element).validatebox({ required: true, validType: { startsWithA: [] } });
  element.value = 'B';
  element.setCustomValidity = function(message) { this.validationMessage = message; };
  assert.equal($(element).validatebox('validate'), false);
  assert.equal(element.validationMessage, 'Must start with A');
  element.value = 'ABC';
  assert.equal($(element).validatebox('validate'), true);
  assert.equal(element.validationMessage, '');
});

test('FabUI Form validation includes validatebox compatibility rules', function() {
  var $ = createJQueryStub();
  var input = createElement('validatebox-text');
  var form = createElement();
  input.value = '';
  input.setCustomValidity = function(message) { this.validationMessage = message; };
  form.querySelectorAll = function(selector) {
    return selector === '.validatebox-text' ? [input] : [];
  };
  createFabUiJQuery($, createFabUiStub());
  $(input).validatebox({ required: true });
  assert.equal($(form).form('validate'), false);
  assert.equal(input.validationMessage, 'This field is required.');
});

test('FabUI plugins initialize on the first legacy method call', function() {
  var $ = createJQueryStub();
  var element = createElement();
  createFabUiJQuery($, createFabUiStub());
  assert.equal($(element).form('options').theme, undefined);
  assert.equal($(element).form('instance') instanceof FakeOptionsControl, true);
});

test('FabUI parser initializes matching EasyUI classes only once', function() {
  var $ = createJQueryStub();
  var panel = createElement('easyui-panel', 'fit:true');
  var textbox = createElement('easyui-textbox', "prompt:'Search'");
  var root = createElement();
  root.querySelectorAll = function(selector) {
    return [panel, textbox].filter(function(element) { return element.matches(selector); });
  };
  var adapter = createFabUiJQuery($, createFabUiStub());
  adapter.parse(root);
  var panelInstance = $(panel).panel('instance');
  var textboxInstance = $(textbox).textbox('instance');
  adapter.parse(root);
  assert.equal($(panel).panel('instance'), panelInstance);
  assert.equal($(textbox).textbox('instance'), textboxInstance);
  assert.equal($(textbox).textbox('options').prompt, 'Search');
});

test('FabUI parser accepts a legacy jQuery context', function() {
  var $ = createJQueryStub();
  var panel = createElement('easyui-panel', 'fit:true');
  var root = createElement();
  root.querySelectorAll = function(selector) {
    return panel.matches(selector) ? [panel] : [];
  };
  var adapter = createFabUiJQuery($, createFabUiStub());
  adapter.parse($(root));
  assert.equal($(panel).panel('options').fit, true);
});
