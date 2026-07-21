var controlRegistry = new WeakMap();

function resolveControlElement(element) {
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

export function Control() {
  this._managedEventListeners = [];
}

Control.prototype.addEventListener = function(target, type, fn, capture, passive) {
  var listeners;
  var useCapture = capture === true;
  var options = passive == null ? useCapture : {
    capture: useCapture,
    passive: passive === true
  };
  var i;
  if (!target || typeof target.addEventListener !== 'function') {
    throw new TypeError('Event target must support addEventListener.');
  }
  if (typeof fn !== 'function' && (!fn || typeof fn.handleEvent !== 'function')) {
    throw new TypeError('Event listener must be a function or EventListener object.');
  }
  listeners = this._managedEventListeners || (this._managedEventListeners = []);
  for (i = 0; i < listeners.length; i += 1) {
    if (listeners[i].target === target &&
      listeners[i].type === type &&
      listeners[i].fn === fn &&
      listeners[i].capture === useCapture) {
      return;
    }
  }
  target.addEventListener(type, fn, options);
  listeners.push({
    target: target,
    type: type,
    fn: fn,
    capture: useCapture
  });
};

Control.prototype.removeEventListener = function(target, type, fn, capture) {
  var listeners = this._managedEventListeners || [];
  var matchCapture = arguments.length > 3;
  var removed = 0;
  var item;
  var i;
  for (i = listeners.length - 1; i >= 0; i -= 1) {
    item = listeners[i];
    if ((target == null || item.target === target) &&
      (type == null || item.type === type) &&
      (fn == null || item.fn === fn) &&
      (!matchCapture || item.capture === (capture === true))) {
      item.target.removeEventListener(item.type, item.fn, item.capture);
      listeners.splice(i, 1);
      removed += 1;
    }
  }
  return removed;
};

Control.getControl = function(element) {
  var host = resolveControlElement(element);
  return host ? controlRegistry.get(host) || null : null;
};

export function registerControl(element, control) {
  if (element && element.nodeType === 1 && control) {
    controlRegistry.set(element, control);
  }
}

export function unregisterControl(element, control) {
  if (element && controlRegistry.get(element) === control) {
    controlRegistry.delete(element);
  }
}

Control._registerControl = registerControl;
Control._unregisterControl = unregisterControl;
