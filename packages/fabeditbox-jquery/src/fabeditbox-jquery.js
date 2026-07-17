var DATA_KEY = 'fabui.fabeditbox';
var EVENT_NAMESPACE = '.fabeditbox';
var EDITBOX_EVENTS = [
  'change',
  'resize',
  'iconClick',
  'buttonClick',
  'select',
  'unselect',
  'click',
  'loadSuccess',
  'loadError',
  'showPanel',
  'hidePanel'
];

function assign(target) {
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

export function toFabEditBoxJQueryEventName(value) {
  return String(value || '').toLowerCase();
}

export function isFabEditBoxPublicMethod(instance, name) {
  return Boolean(
    instance &&
    typeof name === 'string' &&
    name.charAt(0) !== '_' &&
    typeof instance[name] === 'function'
  );
}

export function createFabEditBoxJQuery($, fabui) {
  if (!$ || !$.fn) throw new Error('fabeditbox-jquery requires jQuery.');
  if (!fabui || typeof fabui.EditBox !== 'function') {
    throw new Error('fabeditbox-jquery requires fabui.EditBox.');
  }

  function getInstance(element) {
    return $.data(element, DATA_KEY);
  }

  function setInstance(element, instance) {
    $.data(element, DATA_KEY, instance);
  }

  function removeInstance(element) {
    $.removeData(element, DATA_KEY);
  }

  function triggerLifecycle(element, name, instance) {
    $(element).triggerHandler(name + EVENT_NAMESPACE, [instance]);
  }

  function bindEvents(element, instance) {
    var bindings = [];
    if (typeof instance.on !== 'function') return;
    EDITBOX_EVENTS.forEach(function(name) {
      var handler = function(detail) {
        $(element).triggerHandler(
          toFabEditBoxJQueryEventName(name) + EVENT_NAMESPACE,
          [detail || {}, instance]
        );
      };
      instance.on(name, handler);
      bindings.push({ name: name, handler: handler });
    });
    instance.__fabeditboxJQueryBindings = bindings;
  }

  function unbindEvents(instance) {
    var bindings = instance && instance.__fabeditboxJQueryBindings || [];
    if (instance && typeof instance.off === 'function') {
      bindings.forEach(function(binding) {
        instance.off(binding.name, binding.handler);
      });
    }
    if (instance) delete instance.__fabeditboxJQueryBindings;
  }

  function create(element, options, lifecycle) {
    var instance = new fabui.EditBox(element, options || {});
    instance.__fabeditboxJQueryOptions = assign({}, options || {});
    if (
      instance.__fabeditboxJQueryOptions.editor == null &&
      typeof instance.getEditorType === 'function'
    ) {
      instance.__fabeditboxJQueryOptions.editor = instance.getEditorType();
    }
    setInstance(element, instance);
    bindEvents(element, instance);
    if (lifecycle !== false) triggerLifecycle(element, 'initialized', instance);
    return instance;
  }

  function disposeInstance(instance) {
    if (!instance) return;
    unbindEvents(instance);
    if (typeof instance.dispose === 'function') instance.dispose();
    else if (typeof instance.destroy === 'function') instance.destroy();
  }

  function destroy(element, instance) {
    if (!instance) return;
    disposeInstance(instance);
    removeInstance(element);
    triggerLifecycle(element, 'destroyed', instance);
  }

  function getOptions(instance) {
    var liveOptions = instance && typeof instance.options === 'function' ?
      instance.options() || {} :
      {};
    return assign(
      {},
      instance && instance.__fabeditboxJQueryOptions || {},
      liveOptions
    );
  }

  function recreate(element, instance, options) {
    var nextOptions = assign({}, getOptions(instance), options || {});
    disposeInstance(instance);
    return create(element, nextOptions, false);
  }

  function getOption(instance, name) {
    return getOptions(instance)[name];
  }

  function plugin(command) {
    var args = Array.prototype.slice.call(arguments, 1);
    var first = this[0];
    var result;

    if (typeof command !== 'string') {
      return this.each(function() {
        var current = getInstance(this);
        if (current) recreate(this, current, command || {});
        else create(this, command || {});
      });
    }

    if (command === 'instance') return first ? getInstance(first) : undefined;
    if (command === 'option' && args.length === 1 && typeof args[0] === 'string') {
      return first && getInstance(first) ? getOption(getInstance(first), args[0]) : undefined;
    }

    this.each(function() {
      var current = getInstance(this);
      var methodResult;
      var patch;
      if (!current) {
        throw new Error('Cannot call fabeditbox method before initialization: ' + command);
      }
      if (command === 'destroy') {
        destroy(this, current);
        return;
      }
      if (command === 'option') {
        patch = typeof args[0] === 'string' ? {} : args[0] || {};
        if (typeof args[0] === 'string') patch[args[0]] = args[1];
        recreate(this, current, patch);
        return;
      }
      if (!isFabEditBoxPublicMethod(current, command)) {
        throw new Error('Unknown or private fabeditbox method: ' + command);
      }
      methodResult = current[command].apply(current, args);
      if (methodResult !== undefined && methodResult !== current) result = methodResult;
    });

    return result === undefined ? this : result;
  }

  $.fn.fabeditbox = plugin;

  return {
    dataKey: DATA_KEY,
    eventNamespace: EVENT_NAMESPACE,
    events: EDITBOX_EVENTS.slice(),
    getInstance: getInstance,
    destroy: function(element) {
      destroy(element, getInstance(element));
    }
  };
}

export default createFabEditBoxJQuery;
