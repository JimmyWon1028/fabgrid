(function(global) {
  'use strict';

  if (global.fabDom) return;

  var document = global.document;
  var slice = Array.prototype.slice;
  var eventStore = new WeakMap();
  var cssNumber = {
    animationIterationCount: true,
    aspectRatio: true,
    borderImageSlice: true,
    columnCount: true,
    flexGrow: true,
    flexShrink: true,
    fontWeight: true,
    gridArea: true,
    gridColumn: true,
    gridColumnEnd: true,
    gridColumnStart: true,
    gridRow: true,
    gridRowEnd: true,
    gridRowStart: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    scale: true,
    widows: true,
    zIndex: true,
    zoom: true
  };

  function requireDocument() {
    if (!document || typeof document.querySelectorAll !== 'function') {
      throw new Error('fabDom requires a browser document.');
    }
  }

  function isElement(value) {
    return value && value.nodeType === 1;
  }

  function isTarget(value) {
    return value && (
      value === global ||
      value === document ||
      value.nodeType === 1 ||
      value.nodeType === 9 ||
      value.nodeType === 11
    );
  }

  function resolveElements(target) {
    var elements;
    requireDocument();

    if (typeof target === 'string') {
      return slice.call(document.querySelectorAll(target));
    }
    if (isTarget(target)) return [target];
    if (!target || typeof target.length !== 'number') return [];

    elements = slice.call(target);
    return elements.filter(isTarget);
  }

  function uniqueElements(elements) {
    return elements.filter(function(element, index) {
      return elements.indexOf(element) === index;
    });
  }

  function normalizeHtml(value) {
    return value == null ? '' : String(value);
  }

  function isFunction(value) {
    return typeof value === 'function';
  }

  function matchesSelector(element, selector) {
    var matcher;
    if (!isElement(element) || typeof selector !== 'string' || !selector) {
      return false;
    }

    matcher = element.matches ||
      element.webkitMatchesSelector ||
      element.msMatchesSelector;
    if (matcher) return matcher.call(element, selector);
    if (!element.parentNode ||
        typeof element.parentNode.querySelectorAll !== 'function') {
      return false;
    }
    return slice.call(
      element.parentNode.querySelectorAll(selector)
    ).indexOf(element) >= 0;
  }

  function normalizeClassNames(value) {
    return String(value == null ? '' : value)
      .split(/\s+/)
      .filter(Boolean);
  }

  function getClassNames(element) {
    return normalizeClassNames(
      getElementAttribute(element, 'class') || element.className || ''
    );
  }

  function setClassNames(element, classNames) {
    setElementAttribute(element, 'class', classNames.join(' '));
  }

  function addElementClass(element, className) {
    var classNames = normalizeClassNames(className);
    var current;
    if (!classNames.length || !isElement(element)) return;

    if (element.classList && typeof element.classList.add === 'function') {
      classNames.forEach(function(name) {
        element.classList.add(name);
      });
      return;
    }

    current = getClassNames(element);
    classNames.forEach(function(name) {
      if (current.indexOf(name) < 0) current.push(name);
    });
    setClassNames(element, current);
  }

  function removeElementClass(element, className) {
    var classNames;
    var current;
    if (!isElement(element)) return;

    if (className === undefined) {
      setClassNames(element, []);
      return;
    }

    classNames = normalizeClassNames(className);
    if (!classNames.length) return;
    if (element.classList && typeof element.classList.remove === 'function') {
      classNames.forEach(function(name) {
        element.classList.remove(name);
      });
      return;
    }

    current = getClassNames(element).filter(function(name) {
      return classNames.indexOf(name) < 0;
    });
    setClassNames(element, current);
  }

  function toggleElementClass(element, className, state) {
    var classNames = normalizeClassNames(className);
    if (!isElement(element)) return;

    classNames.forEach(function(name) {
      var hasClass = getClassNames(element).indexOf(name) >= 0;
      var shouldAdd = typeof state === 'boolean' ? state : !hasClass;
      if (shouldAdd) {
        addElementClass(element, name);
      } else {
        removeElementClass(element, name);
      }
    });
  }

  function insertElementHtml(element, position, value) {
    if (!element || typeof element.insertAdjacentHTML !== 'function') return;
    element.insertAdjacentHTML(position, normalizeHtml(value));
  }

  function isNode(value) {
    return value && typeof value.nodeType === 'number';
  }

  function getInsertionNodes(value) {
    var values;
    if (isNode(value)) return [value];
    if (value && Array.isArray(value.elements)) {
      values = value.elements;
    } else if (
      value &&
      typeof value !== 'string' &&
      typeof value.length === 'number'
    ) {
      values = slice.call(value);
    } else {
      return null;
    }
    return values.every(isNode) ? values.slice() : null;
  }

  function insertNode(element, position, node, reference) {
    var parent;
    if (!element || !node) return;

    if (position === 'beforeend') {
      element.appendChild(node);
      return;
    }
    if (position === 'afterbegin') {
      element.insertBefore(node, reference);
      return;
    }

    parent = element.parentNode;
    if (!parent) return;
    parent.insertBefore(node, reference);
  }

  function insertElementContent(
    element,
    position,
    value,
    targetIndex,
    targetCount
  ) {
    var nodes = getInsertionNodes(value);
    var reference;
    if (!nodes) {
      insertElementHtml(element, position, value);
      return;
    }

    if (position === 'afterbegin') {
      reference = element.firstChild;
    } else if (position === 'beforebegin') {
      reference = element;
    } else if (position === 'afterend') {
      reference = element.nextSibling;
    }

    nodes.forEach(function(node) {
      var insertionNode = targetIndex === targetCount - 1 ?
        node :
        node.cloneNode(true);
      insertNode(element, position, insertionNode, reference);
    });
  }

  function normalizeEventNames(events) {
    return String(events == null ? '' : events)
      .split(/\s+/)
      .filter(Boolean);
  }

  function callEventHandler(handler, context, event) {
    var result = handler.call(context, event);
    if (result === false) {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
    }
    return result;
  }

  function createEventListener(element, selector, handler) {
    if (!selector) {
      return function(event) {
        callEventHandler(handler, element, event);
      };
    }

    return function(event) {
      var target = event && event.target;
      if (target && target.nodeType !== 1) target = target.parentElement;
      while (target && target !== element) {
        if (matchesSelector(target, selector)) {
          if (callEventHandler(handler, target, event) === false) break;
        }
        target = target.parentElement;
      }
    };
  }

  function toCamelCase(name) {
    return String(name).replace(/-([a-z])/g, function(match, letter) {
      return letter.toUpperCase();
    });
  }

  function toCssName(name) {
    if (String(name).indexOf('--') === 0) return String(name);
    return String(name)
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase();
  }

  function getElementValue(element) {
    var options;
    var values;
    if (!element) return undefined;

    if (
      String(element.tagName || '').toLowerCase() === 'select' &&
      element.multiple
    ) {
      options = slice.call(element.options || []);
      values = options.filter(function(option) {
        return option.selected && !option.disabled;
      }).map(function(option) {
        return String(option.value);
      });
      return values;
    }

    return element.value == null ? '' : element.value;
  }

  function setElementValue(element, value) {
    var values;
    var tagName;
    var type;
    if (!element) return;

    tagName = String(element.tagName || '').toLowerCase();
    type = String(element.type || '').toLowerCase();
    if (Array.isArray(value)) {
      values = value.map(function(item) {
        return item == null ? '' : String(item);
      });
      if (tagName === 'select') {
        slice.call(element.options || []).forEach(function(option) {
          option.selected = values.indexOf(String(option.value)) >= 0;
        });
        return;
      }
      if (type === 'checkbox' || type === 'radio') {
        element.checked = values.indexOf(String(element.value)) >= 0;
        return;
      }
      value = values;
    }

    element.value = value == null ? '' : String(value);
  }

  function getElementAttribute(element, name) {
    var value;
    if (!element || typeof element.getAttribute !== 'function') return undefined;
    value = element.getAttribute(name);
    return value == null ? undefined : value;
  }

  function setElementAttribute(element, name, value) {
    if (!element || typeof element.setAttribute !== 'function') return;
    if (value == null) {
      element.removeAttribute(name);
      return;
    }
    element.setAttribute(name, String(value));
  }

  function getElementCss(element, name) {
    var computed;
    var cssName = toCssName(name);
    var camelName = toCamelCase(name);
    var value;
    if (!element) return undefined;

    if (typeof global.getComputedStyle === 'function') {
      computed = global.getComputedStyle(element);
      if (computed) {
        value = typeof computed.getPropertyValue === 'function' ?
          computed.getPropertyValue(cssName) :
          computed[camelName];
        if (value !== undefined && value !== '') return value;
      }
    }

    if (!element.style) return undefined;
    if (typeof element.style.getPropertyValue === 'function') {
      value = element.style.getPropertyValue(cssName);
      if (value !== undefined && value !== '') return value;
    }
    return element.style[camelName];
  }

  function setElementCss(element, name, value) {
    var camelName;
    var cssName;
    if (!element || !element.style) return;

    cssName = toCssName(name);
    camelName = toCamelCase(name);
    if (value == null || value === '') {
      if (typeof element.style.removeProperty === 'function') {
        element.style.removeProperty(cssName);
      } else {
        element.style[camelName] = '';
      }
      return;
    }

    if (
      typeof value === 'number' &&
      cssName.indexOf('--') !== 0 &&
      !cssNumber[camelName]
    ) {
      value = value + 'px';
    }
    if (typeof element.style.setProperty === 'function') {
      element.style.setProperty(cssName, String(value));
    } else {
      element.style[camelName] = String(value);
    }
  }

  function FabDomCollection(target) {
    var self = this;
    this.elements = resolveElements(target);
    this.length = this.elements.length;
    this.elements.forEach(function(element, index) {
      self[index] = element;
    });
  }

  FabDomCollection.prototype.each = function(callback) {
    if (!isFunction(callback)) return this;
    this.elements.some(function(element, index) {
      return callback.call(element, index, element) === false;
    });
    return this;
  };

  FabDomCollection.prototype.get = function(index) {
    if (!arguments.length) return this.elements.slice();
    index = Number(index);
    if (index < 0) index = this.length + index;
    return this.elements[index];
  };

  FabDomCollection.prototype.eq = function(index) {
    var element = this.get(index);
    return fabDom(element ? [element] : []);
  };

  FabDomCollection.prototype.first = function() {
    return this.eq(0);
  };

  FabDomCollection.prototype.last = function() {
    return this.eq(-1);
  };

  FabDomCollection.prototype.html = function(value) {
    if (!arguments.length) {
      return this.length ? this.elements[0].innerHTML : undefined;
    }

    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, element.innerHTML) :
        value;
      element.innerHTML = normalizeHtml(nextValue);
    });
    return this;
  };

  FabDomCollection.prototype.append = function(value) {
    var targetCount = this.length;
    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, element.innerHTML) :
        value;
      insertElementContent(
        element,
        'beforeend',
        nextValue,
        index,
        targetCount
      );
    });
    return this;
  };

  FabDomCollection.prototype.prepend = function(value) {
    var targetCount = this.length;
    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, element.innerHTML) :
        value;
      insertElementContent(
        element,
        'afterbegin',
        nextValue,
        index,
        targetCount
      );
    });
    return this;
  };

  FabDomCollection.prototype.before = function(value) {
    var targetCount = this.length;
    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, element.innerHTML) :
        value;
      insertElementContent(
        element,
        'beforebegin',
        nextValue,
        index,
        targetCount
      );
    });
    return this;
  };

  FabDomCollection.prototype.after = function(value) {
    var targetCount = this.length;
    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, element.innerHTML) :
        value;
      insertElementContent(
        element,
        'afterend',
        nextValue,
        index,
        targetCount
      );
    });
    return this;
  };

  FabDomCollection.prototype.text = function(value) {
    if (!arguments.length) {
      return this.elements.map(function(element) {
        return element.textContent || '';
      }).join('');
    }

    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, element.textContent || '') :
        value;
      element.textContent = normalizeHtml(nextValue);
    });
    return this;
  };

  FabDomCollection.prototype.val = function(value) {
    if (!arguments.length) {
      return this.length ? getElementValue(this.elements[0]) : undefined;
    }

    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, getElementValue(element)) :
        value;
      setElementValue(element, nextValue);
    });
    return this;
  };

  FabDomCollection.prototype.attr = function(name, value) {
    var attributes;
    if (name && typeof name === 'object') {
      attributes = name;
      this.elements.forEach(function(element, index) {
        Object.keys(attributes).forEach(function(attributeName) {
          var attributeValue = attributes[attributeName];
          if (isFunction(attributeValue)) {
            attributeValue = attributeValue.call(
              element,
              index,
              getElementAttribute(element, attributeName)
            );
          }
          setElementAttribute(element, attributeName, attributeValue);
        });
      });
      return this;
    }

    if (arguments.length === 1) {
      return this.length ?
        getElementAttribute(this.elements[0], name) :
        undefined;
    }

    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, getElementAttribute(element, name)) :
        value;
      setElementAttribute(element, name, nextValue);
    });
    return this;
  };

  FabDomCollection.prototype.removeAttr = function(name) {
    var names = normalizeClassNames(name);
    this.elements.forEach(function(element) {
      names.forEach(function(attributeName) {
        if (element && typeof element.removeAttribute === 'function') {
          element.removeAttribute(attributeName);
        }
      });
    });
    return this;
  };

  FabDomCollection.prototype.prop = function(name, value) {
    var properties;
    if (name && typeof name === 'object') {
      properties = name;
      this.elements.forEach(function(element, index) {
        Object.keys(properties).forEach(function(propertyName) {
          var propertyValue = properties[propertyName];
          if (isFunction(propertyValue)) {
            propertyValue = propertyValue.call(
              element,
              index,
              element[propertyName]
            );
          }
          element[propertyName] = propertyValue;
        });
      });
      return this;
    }

    if (arguments.length === 1) {
      return this.length ? this.elements[0][name] : undefined;
    }

    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, element[name]) :
        value;
      element[name] = nextValue;
    });
    return this;
  };

  FabDomCollection.prototype.css = function(name, value) {
    var properties;
    if (Array.isArray(name)) {
      properties = {};
      if (!this.length) return properties;
      name.forEach(function(propertyName) {
        properties[propertyName] = getElementCss(
          this.elements[0],
          propertyName
        );
      }, this);
      return properties;
    }

    if (name && typeof name === 'object') {
      properties = name;
      this.elements.forEach(function(element, index) {
        Object.keys(properties).forEach(function(propertyName) {
          var propertyValue = properties[propertyName];
          if (isFunction(propertyValue)) {
            propertyValue = propertyValue.call(
              element,
              index,
              getElementCss(element, propertyName)
            );
          }
          setElementCss(element, propertyName, propertyValue);
        });
      });
      return this;
    }

    if (arguments.length === 1) {
      return this.length ? getElementCss(this.elements[0], name) : undefined;
    }

    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, getElementCss(element, name)) :
        value;
      setElementCss(element, name, nextValue);
    });
    return this;
  };

  FabDomCollection.prototype.addClass = function(value) {
    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, getClassNames(element).join(' ')) :
        value;
      addElementClass(element, nextValue);
    });
    return this;
  };

  FabDomCollection.prototype.removeClass = function(value) {
    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, getClassNames(element).join(' ')) :
        value;
      removeElementClass(element, nextValue);
    });
    return this;
  };

  FabDomCollection.prototype.toggleClass = function(value, state) {
    this.elements.forEach(function(element, index) {
      var nextValue = isFunction(value) ?
        value.call(element, index, getClassNames(element).join(' '), state) :
        value;
      toggleElementClass(element, nextValue, state);
    });
    return this;
  };

  FabDomCollection.prototype.hasClass = function(className) {
    className = String(className || '');
    return this.elements.some(function(element) {
      return getClassNames(element).indexOf(className) >= 0;
    });
  };

  FabDomCollection.prototype.on = function(events, selector, handler) {
    var eventNames = normalizeEventNames(events);
    if (isFunction(selector)) {
      handler = selector;
      selector = null;
    }
    if (!isFunction(handler)) {
      throw new TypeError('fabDom.on() requires an event handler.');
    }
    if (selector != null && typeof selector !== 'string') {
      throw new TypeError('fabDom.on() selector must be a string.');
    }

    this.elements.forEach(function(element) {
      var records;
      if (!element || typeof element.addEventListener !== 'function') return;
      records = eventStore.get(element) || [];
      eventNames.forEach(function(type) {
        var listener = createEventListener(element, selector, handler);
        records.push({
          type: type,
          selector: selector || null,
          handler: handler,
          listener: listener
        });
        element.addEventListener(type, listener);
      });
      if (records.length) eventStore.set(element, records);
    });
    return this;
  };

  FabDomCollection.prototype.off = function(events, selector, handler) {
    var eventNames;
    if (isFunction(selector)) {
      handler = selector;
      selector = null;
    }
    eventNames = arguments.length ? normalizeEventNames(events) : [];

    this.elements.forEach(function(element) {
      var records = eventStore.get(element) || [];
      records = records.filter(function(record) {
        var matchesEvent = !eventNames.length ||
          eventNames.indexOf(record.type) >= 0;
        var matchesSelector = selector == null ||
          selector === record.selector;
        var matchesHandler = !handler || handler === record.handler;
        var shouldRemove = matchesEvent && matchesSelector && matchesHandler;
        if (shouldRemove &&
            typeof element.removeEventListener === 'function') {
          element.removeEventListener(record.type, record.listener);
        }
        return !shouldRemove;
      });
      if (records.length) {
        eventStore.set(element, records);
      } else {
        eventStore.delete(element);
      }
    });
    return this;
  };

  FabDomCollection.prototype.empty = function() {
    this.elements.forEach(function(element) {
      element.innerHTML = '';
    });
    return this;
  };

  FabDomCollection.prototype.remove = function() {
    this.elements.forEach(function(element) {
      if (element && typeof element.remove === 'function') {
        element.remove();
      } else if (
        element &&
        element.parentNode &&
        typeof element.parentNode.removeChild === 'function'
      ) {
        element.parentNode.removeChild(element);
      }
    });
    return this;
  };

  FabDomCollection.prototype.find = function(selector) {
    var matches = [];
    this.elements.forEach(function(element) {
      if (element && typeof element.querySelectorAll === 'function') {
        matches = matches.concat(slice.call(element.querySelectorAll(selector)));
      }
    });
    return fabDom(uniqueElements(matches));
  };

  FabDomCollection.prototype.closest = function(selector) {
    var matches = [];
    this.elements.forEach(function(element) {
      var current = element;
      while (isElement(current)) {
        if (matchesSelector(current, selector)) {
          matches.push(current);
          break;
        }
        current = current.parentElement || current.parentNode;
      }
    });
    return fabDom(uniqueElements(matches));
  };

  FabDomCollection.prototype.parent = function(selector) {
    var parents = [];
    this.elements.forEach(function(element) {
      var parent = element && (element.parentElement || element.parentNode);
      if (
        isElement(parent) &&
        (!selector || matchesSelector(parent, selector))
      ) {
        parents.push(parent);
      }
    });
    return fabDom(uniqueElements(parents));
  };

  FabDomCollection.prototype.children = function(selector) {
    var children = [];
    this.elements.forEach(function(element) {
      slice.call(element && element.children || []).forEach(function(child) {
        if (!selector || matchesSelector(child, selector)) {
          children.push(child);
        }
      });
    });
    return fabDom(uniqueElements(children));
  };

  FabDomCollection.prototype.is = function(target) {
    var targets;
    if (isFunction(target)) {
      return this.elements.some(function(element, index) {
        return !!target.call(element, index, element);
      });
    }
    if (typeof target === 'string') {
      return this.elements.some(function(element) {
        return matchesSelector(element, target);
      });
    }
    targets = resolveElements(target);
    return this.elements.some(function(element) {
      return targets.indexOf(element) >= 0;
    });
  };

  FabDomCollection.prototype.load = function(url, options, complete) {
    var collection = this;
    var loader = global.fabLoader;
    var requests;

    if (isFunction(options)) {
      complete = options;
      options = {};
    }
    options = options || {};

    if (!loader || typeof loader.mountHtml !== 'function') {
      throw new Error('fabDom.load() requires fabLoader.mountHtml().');
    }

    requests = this.elements.map(function(element) {
      return loader.mountHtml(element, url, options).then(
        function(result) {
          if (isFunction(complete)) {
            complete.call(element, result.html, 'success', result);
          }
          return result;
        },
        function(error) {
          if (isFunction(complete)) {
            complete.call(element, null, 'error', error);
            return null;
          }
          if (global.console && typeof global.console.error === 'function') {
            global.console.error('fabDom.load() failed.', error);
          }
          return null;
        }
      );
    });

    collection._loadPromise = Promise.all(requests);
    return collection;
  };

  function fabDom(target) {
    return new FabDomCollection(target);
  }

  fabDom.version = '0.4.0';
  global.fabDom = fabDom;
  if (!global.jQuery && typeof global.$ === 'undefined') {
    global.$ = fabDom;
  }
}(typeof window !== 'undefined' ? window : this));
