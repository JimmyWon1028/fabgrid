import test from 'node:test';
import assert from 'node:assert/strict';
import { createFabGridJQuery, isPublicMethod, toJQueryEventName } from '../packages/fabgrid-jquery/src/fabgrid-jquery.js';

function createJQueryStub() {
  var dataStore = new WeakMap();
  var eventStore = new WeakMap();

  function Collection(elements) {
    var self = this;
    this.length = elements.length;
    elements.forEach(function(element, index) { self[index] = element; });
  }

  Collection.prototype.each = function(callback) {
    var i;
    for (i = 0; i < this.length; i += 1) callback.call(this[i], i, this[i]);
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

  Collection.prototype.triggerHandler = function(event, args) {
    var element = this[0];
    var name = typeof event === 'string' ? event : event.type;
    var handlers = element ? eventStore.get(element) || {} : {};
    (handlers[name] || []).forEach(function(handler) {
      if (handler.apply(element, [event].concat(args || [])) === false && event.preventDefault) event.preventDefault();
    });
    return this;
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
  $.Event = function(type) {
    var prevented = false;
    return {
      type: type,
      preventDefault: function() { prevented = true; },
      isDefaultPrevented: function() { return prevented; }
    };
  };
  return $;
}

function createCoreEvent() {
  var bindings = [];
  return {
    addHandler: function(handler, self) { bindings.push({ handler: handler, self: self }); },
    removeHandler: function(handler, self) {
      bindings = bindings.filter(function(binding) { return binding.handler !== handler || binding.self !== self; });
    },
    raise: function(sender, args) {
      bindings.forEach(function(binding) { binding.handler.call(binding.self, sender, args); });
    },
    count: function() { return bindings.length; }
  };
}

function FakeGrid(element, options) {
  this.element = element;
  this.options = Object.assign({}, options);
  this.selectionChanged = createCoreEvent();
  this.disposed = false;
  this.invalidations = 0;
}

FakeGrid.prototype.refresh = function() { this.refreshed = true; };
FakeGrid.prototype.getCellData = function() { return 'cell-value'; };
FakeGrid.prototype.setItemsSource = function(value) { this.options.itemsSource = value; };
FakeGrid.prototype.setColumns = function(value) { this.options.columns = value; };
FakeGrid.prototype.invalidate = function() { this.invalidations += 1; };
FakeGrid.prototype.dispose = function() { this.disposed = true; };
FakeGrid.prototype._privateMethod = function() {};

test('jQuery wrapper normalizes event names and protects private methods', function() {
  assert.equal(toJQueryEventName('selectionChanged'), 'selectionchanged');
  assert.equal(isPublicMethod(new FakeGrid({}, {}), 'refresh'), true);
  assert.equal(isPublicMethod(new FakeGrid({}, {}), '_privateMethod'), false);
});

test('jQuery wrapper initializes one core instance per element and remains chainable', function() {
  var $ = createJQueryStub();
  var elements = [{}, {}];
  createFabGridJQuery($, { FabGrid: FakeGrid });
  var collection = $(elements);
  var result = collection.fabgrid({ itemsSource: [{ id: 1 }] });
  assert.equal(result, collection);
  assert.notEqual($(elements[0]).fabgrid('instance'), $(elements[1]).fabgrid('instance'));
});

test('jQuery wrapper updates options without creating another instance', function() {
  var $ = createJQueryStub();
  var element = {};
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).fabgrid({ itemsSource: [] });
  var instance = $(element).fabgrid('instance');
  $(element).fabgrid({ itemsSource: [{ id: 2 }], rowHeight: 36 });
  assert.equal($(element).fabgrid('instance'), instance);
  assert.deepEqual(instance.options.itemsSource, [{ id: 2 }]);
  assert.equal(instance.options.rowHeight, 36);
});

test('jQuery wrapper supports option getters, setters and method dispatch', function() {
  var $ = createJQueryStub();
  var element = {};
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).fabgrid({ rowHeight: 32 });
  assert.equal($(element).fabgrid('option', 'rowHeight'), 32);
  assert.equal($(element).fabgrid('option', 'rowHeight', 40)[0], element);
  assert.equal($(element).fabgrid('option', 'rowHeight'), 40);
  assert.equal($(element).fabgrid('getCellData', 0, 0), 'cell-value');
  assert.equal($(element).fabgrid('refresh')[0], element);
});

test('jQuery wrapper forwards cancellable events and callback options', function() {
  var $ = createJQueryStub();
  var element = {};
  var callbackCalls = 0;
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).on('selectionchanged.fabgrid', function(event, args) {
    args.fromJQuery = true;
    event.preventDefault();
  });
  $(element).fabgrid({
    selectionChanged: function(event, args) {
      callbackCalls += 1;
      assert.equal(args.fromJQuery, true);
    }
  });
  var args = {};
  $(element).fabgrid('instance').selectionChanged.raise(null, args);
  assert.equal(args.cancel, true);
  assert.equal(callbackCalls, 1);
});

test('jQuery wrapper destroy removes its bindings, disposes and allows reinitialization', function() {
  var $ = createJQueryStub();
  var element = {};
  createFabGridJQuery($, { FabGrid: FakeGrid });
  $(element).fabgrid({});
  var first = $(element).fabgrid('instance');
  assert.equal(first.selectionChanged.count(), 1);
  $(element).fabgrid('destroy');
  assert.equal(first.disposed, true);
  assert.equal(first.selectionChanged.count(), 0);
  assert.equal($(element).fabgrid('instance'), undefined);
  $(element).fabgrid({});
  assert.notEqual($(element).fabgrid('instance'), first);
});

test('jQuery wrapper rejects calls before initialization and private methods', function() {
  var $ = createJQueryStub();
  var element = {};
  createFabGridJQuery($, { FabGrid: FakeGrid });
  assert.throws(function() { $(element).fabgrid('refresh'); }, /before initialization/);
  $(element).fabgrid({});
  assert.throws(function() { $(element).fabgrid('_privateMethod'); }, /Unknown or private/);
});
