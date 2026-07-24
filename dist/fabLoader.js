/*! fabLoader 0.12.0 | Standalone browser resource loader */
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

(function(global) {
  'use strict';

  if (global.fabLoader) return;

  var document = global.document;
  var records = {
    script: Object.create(null),
    css: Object.create(null),
    image: Object.create(null),
    text: Object.create(null)
  };
  var defaultConfig = {
    script: {
      timeout: 30000,
      type: '',
      async: false,
      attributes: {
        crossorigin: 'anonymous'
      }
    },
    css: {
      timeout: 30000,
      media: 'all',
      attributes: {}
    },
    image: {
      timeout: 30000,
      crossOrigin: 'anonymous',
      referrerPolicy: '',
      fetchPriority: ''
    },
    text: {
      timeout: 30000,
      credentials: 'same-origin'
    }
  };
  var config = cloneConfig(defaultConfig);
  var api;

  function requireDocument() {
    if (!document || !document.createElement) {
      throw new Error('fabLoader requires a browser document.');
    }
  }

  function resolveUrl(url, baseUrl) {
    if (url == null || String(url).trim() === '') {
      throw new TypeError('A resource URL is required.');
    }
    return new URL(String(url), baseUrl || document.baseURI).href;
  }

  function cloneObject(source) {
    var clone = {};
    Object.keys(source || {}).forEach(function(name) {
      clone[name] = source[name];
    });
    return clone;
  }

  function cloneConfig(source) {
    return {
      script: {
        timeout: source.script.timeout,
        type: source.script.type,
        async: source.script.async,
        attributes: cloneObject(source.script.attributes)
      },
      css: {
        timeout: source.css.timeout,
        media: source.css.media,
        attributes: cloneObject(source.css.attributes)
      },
      image: {
        timeout: source.image.timeout,
        crossOrigin: source.image.crossOrigin,
        referrerPolicy: source.image.referrerPolicy,
        fetchPriority: source.image.fetchPriority
      },
      text: {
        timeout: source.text.timeout,
        credentials: source.text.credentials
      }
    };
  }

  function normalizeTimeout(value, bucket) {
    value = Number(value);
    if (!Number.isFinite(value) || value < 0) {
      throw new TypeError(
        'fabLoader ' + bucket + ' timeout must be a non-negative number.'
      );
    }
    return value;
  }

  function normalizeCredentials(value) {
    if (
      value === 'same-origin' ||
      value === 'include' ||
      value === 'omit'
    ) {
      return value;
    }
    throw new TypeError(
      'fabLoader text credentials must be same-origin, include or omit.'
    );
  }

  function mergeAttributes(base, override) {
    var attributes = cloneObject(base);
    Object.keys(override || {}).forEach(function(name) {
      attributes[name] = override[name];
    });
    return attributes;
  }

  function mergeBucketOptions(bucket, options) {
    var merged = cloneObject(config[bucket]);
    options = options || {};
    Object.keys(options).forEach(function(name) {
      if (name !== 'attributes') merged[name] = options[name];
    });
    if (bucket === 'script' || bucket === 'css') {
      merged.attributes = mergeAttributes(
        config[bucket].attributes,
        options.attributes
      );
    }
    merged.timeout = normalizeTimeout(merged.timeout, bucket);
    if (bucket === 'text') {
      merged.credentials = normalizeCredentials(merged.credentials);
    }
    return merged;
  }

  function updateBucketConfig(bucket, values) {
    var next;
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      throw new TypeError(
        'fabLoader ' + bucket + ' config must be an object.'
      );
    }
    next = mergeBucketOptions(bucket, values);
    if (bucket === 'script') {
      next.type = String(next.type || '').trim();
      next.async = next.async === true;
      next.attributes = mergeAttributes({}, next.attributes);
    } else if (bucket === 'css') {
      next.media = String(next.media == null ? '' : next.media);
      next.attributes = mergeAttributes({}, next.attributes);
    } else if (bucket === 'image') {
      next.crossOrigin = next.crossOrigin == null ?
        null :
        String(next.crossOrigin);
      next.referrerPolicy = next.referrerPolicy == null ?
        null :
        String(next.referrerPolicy);
      next.fetchPriority = next.fetchPriority == null ?
        null :
        String(next.fetchPriority);
    }
    config[bucket] = next;
  }

  function setConfig(options) {
    var buckets = ['script', 'css', 'image', 'text'];
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      throw new TypeError('fabLoader config must be an object.');
    }
    Object.keys(options).forEach(function(bucket) {
      if (buckets.indexOf(bucket) < 0) {
        throw new TypeError('Unknown fabLoader config bucket: ' + bucket);
      }
      updateBucketConfig(bucket, options[bucket]);
    });
    return api;
  }

  function getConfig() {
    return cloneConfig(config);
  }

  function stableAttributes(attributes) {
    var normalized = {};
    Object.keys(attributes || {}).sort().forEach(function(name) {
      var value = attributes[name];
      if (value == null || value === false) return;
      normalized[name.toLowerCase()] = value === true ? '' : String(value);
    });
    return normalized;
  }

  function createResourceKey(url, identity) {
    return url + '\n' + JSON.stringify(identity || {});
  }

  function createAbortError(message) {
    var error = new Error(message);
    error.name = 'AbortError';
    return error;
  }

  function createTimeoutError(type, url, timeout) {
    var error = new Error(
      'Timed out loading ' + type + ' after ' + timeout + 'ms: ' + url
    );
    error.name = 'TimeoutError';
    return error;
  }

  function removeElement(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  function applyAttributes(element, attributes, blockedNames) {
    var blocked = blockedNames || {};
    if (!attributes || typeof attributes !== 'object') return;
    Object.keys(attributes).forEach(function(name) {
      var value;
      if (blocked[name.toLowerCase()]) return;
      value = attributes[name];
      if (value == null || value === false) return;
      element.setAttribute(name, value === true ? '' : String(value));
    });
  }

  function createElementLoad(type, key, url, options, createElement) {
    var record = records[type][key];
    if (record) return record.promise;

    record = {
      url: url,
      element: null,
      promise: null,
      status: 'pending',
      cancel: null
    };
    records[type][key] = record;
    record.promise = new Promise(function(resolve, reject) {
      var element;
      var timer = null;
      var settled = false;

      function clearHandlers() {
        if (!element) return;
        element.onload = null;
        element.onerror = null;
      }

      function succeed() {
        if (settled) return;
        settled = true;
        record.status = 'fulfilled';
        if (timer) global.clearTimeout(timer);
        clearHandlers();
        resolve(element);
      }

      function fail(error) {
        if (settled) return;
        settled = true;
        record.status = 'rejected';
        if (timer) global.clearTimeout(timer);
        clearHandlers();
        if (records[type][key] === record) delete records[type][key];
        removeElement(element);
        reject(error);
      }

      record.cancel = function(reason) {
        fail(reason || createAbortError('Cancelled loading ' + type + ': ' + url));
      };

      try {
        element = createElement();
        record.element = element;
        element.onload = succeed;
        element.onerror = function() {
          fail(new Error('Failed to load ' + type + ': ' + url));
        };
        document.head.appendChild(element);
        if (!settled && options.timeout > 0) {
          timer = global.setTimeout(function() {
            fail(createTimeoutError(type, url, options.timeout));
          }, options.timeout);
        }
      } catch (error) {
        fail(error);
      }
    });
    return record.promise;
  }

  function loadScript(url, options) {
    var resolvedUrl;
    var effectiveOptions;
    var key;
    requireDocument();
    resolvedUrl = resolveUrl(url);
    effectiveOptions = mergeBucketOptions('script', options);
    effectiveOptions.type = String(effectiveOptions.type || '').trim();
    effectiveOptions.async = effectiveOptions.async === true;
    key = createResourceKey(resolvedUrl, {
      type: effectiveOptions.type,
      async: effectiveOptions.async,
      attributes: stableAttributes(effectiveOptions.attributes)
    });
    return createElementLoad(
      'script',
      key,
      resolvedUrl,
      effectiveOptions,
      function() {
        var script = document.createElement('script');
        applyAttributes(script, effectiveOptions.attributes, {
          src: true,
          type: true,
          async: true
        });
        script.async = effectiveOptions.async;
        if (effectiveOptions.type) script.type = effectiveOptions.type;
        script.src = resolvedUrl;
        return script;
      }
    );
  }

  function loadCss(url, options) {
    var resolvedUrl;
    var effectiveOptions;
    var key;
    requireDocument();
    resolvedUrl = resolveUrl(url);
    effectiveOptions = mergeBucketOptions('css', options);
    effectiveOptions.media = String(
      effectiveOptions.media == null ? '' : effectiveOptions.media
    );
    key = createResourceKey(resolvedUrl, {
      media: effectiveOptions.media,
      attributes: stableAttributes(effectiveOptions.attributes)
    });
    return createElementLoad(
      'css',
      key,
      resolvedUrl,
      effectiveOptions,
      function() {
        var link = document.createElement('link');
        applyAttributes(link, effectiveOptions.attributes, {
          href: true,
          rel: true
        });
        link.rel = 'stylesheet';
        link.href = resolvedUrl;
        if (effectiveOptions.media) link.media = effectiveOptions.media;
        return link;
      }
    );
  }

  function cloneImage(image) {
    var clone;
    if (typeof image.cloneNode === 'function') {
      clone = image.cloneNode(false);
    } else {
      clone = document.createElement('img');
    }
    if (image.crossOrigin != null) {
      clone.crossOrigin = String(image.crossOrigin);
    }
    if (image.referrerPolicy != null) {
      clone.referrerPolicy = String(image.referrerPolicy);
    }
    if (image.fetchPriority != null) {
      clone.fetchPriority = String(image.fetchPriority);
    }
    if (typeof image.cloneNode !== 'function') clone.src = image.src;
    return clone;
  }

  function defineReusableImage(target, name, image) {
    Object.defineProperty(target, name, {
      configurable: true,
      enumerable: true,
      get: function() {
        return cloneImage(image);
      },
      set: function(value) {
        Object.defineProperty(target, name, {
          configurable: true,
          enumerable: true,
          value: value,
          writable: true
        });
      }
    });
  }

  function createReusableImageList(images) {
    var list = [];
    list.length = images.length;
    images.forEach(function(image, index) {
      defineReusableImage(list, index, image);
    });
    return list;
  }

  function createReusableImageMap(names, images) {
    var map = {};
    names.forEach(function(name, index) {
      defineReusableImage(map, name, images[index]);
    });
    return map;
  }

  function isResourceMap(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  function preloadImage(url, options) {
    var names;
    var resolvedUrl;
    var effectiveOptions;
    var key;
    var record;
    requireDocument();
    if (Array.isArray(url)) {
      return Promise.all(url.map(function(item) {
        return preloadImage(item, options);
      })).then(createReusableImageList);
    }
    if (isResourceMap(url)) {
      names = Object.keys(url);
      return Promise.all(names.map(function(name) {
        return preloadImage(url[name], options);
      })).then(function(images) {
        return createReusableImageMap(names, images);
      });
    }
    resolvedUrl = resolveUrl(url);
    effectiveOptions = mergeBucketOptions('image', options);
    key = createResourceKey(resolvedUrl, {
      crossOrigin: effectiveOptions.crossOrigin,
      referrerPolicy: effectiveOptions.referrerPolicy,
      fetchPriority: effectiveOptions.fetchPriority
    });
    record = records.image[key];
    if (!record) {
      record = {
        url: resolvedUrl,
        element: null,
        promise: null,
        status: 'pending',
        cancel: null
      };
      records.image[key] = record;
      record.promise = new Promise(function(resolve, reject) {
        var image;
        var timer = null;
        var settled = false;

        function clearHandlers() {
          if (!image) return;
          image.onload = null;
          image.onerror = null;
        }

        function succeed() {
          if (settled) return;
          settled = true;
          record.status = 'fulfilled';
          if (timer) global.clearTimeout(timer);
          clearHandlers();
          resolve(image);
        }

        function fail(error) {
          if (settled) return;
          settled = true;
          record.status = 'rejected';
          if (timer) global.clearTimeout(timer);
          clearHandlers();
          if (records.image[key] === record) delete records.image[key];
          removeElement(image);
          reject(error);
        }

        record.cancel = function(reason) {
          fail(reason || createAbortError(
            'Cancelled loading image: ' + resolvedUrl
          ));
        };

        try {
          image = typeof global.Image === 'function' ?
            new global.Image() :
            document.createElement('img');
          record.element = image;
          if (effectiveOptions.crossOrigin != null) {
            image.crossOrigin = String(effectiveOptions.crossOrigin);
          }
          if (effectiveOptions.referrerPolicy != null) {
            image.referrerPolicy = String(effectiveOptions.referrerPolicy);
          }
          if (effectiveOptions.fetchPriority != null) {
            image.fetchPriority = String(effectiveOptions.fetchPriority);
          }
          image.onload = succeed;
          image.onerror = function() {
            fail(new Error('Failed to preload image: ' + resolvedUrl));
          };
          image.src = resolvedUrl;
          if (!settled && effectiveOptions.timeout > 0) {
            timer = global.setTimeout(function() {
              fail(createTimeoutError(
                'image',
                resolvedUrl,
                effectiveOptions.timeout
              ));
            }, effectiveOptions.timeout);
          }
        } catch (error) {
          fail(error);
        }
      });
    }

    return record.promise.then(function(image) {
      return cloneImage(image);
    });
  }

  function getTextKey(url, options) {
    return createResourceKey(url, {
      credentials: options.credentials
    });
  }

  function loadTextRecord(url, options) {
    var resolvedUrl;
    var effectiveOptions;
    var key;
    var record;
    requireDocument();
    if (typeof global.fetch !== 'function') {
      return Promise.reject(new Error('fabLoader text loading requires Fetch.'));
    }
    resolvedUrl = resolveUrl(url);
    effectiveOptions = mergeBucketOptions('text', options);
    key = getTextKey(resolvedUrl, effectiveOptions);
    record = records.text[key];
    if (record) return record.promise;

    record = {
      key: key,
      url: resolvedUrl,
      responseUrl: resolvedUrl,
      text: null,
      promise: null,
      status: 'pending',
      cancel: null
    };
    records.text[key] = record;

    record.promise = new Promise(function(resolve, reject) {
      var controller = typeof global.AbortController === 'function' ?
        new global.AbortController() :
        null;
      var timer = null;
      var settled = false;
      var fetchOptions = {
        credentials: effectiveOptions.credentials
      };

      if (controller) fetchOptions.signal = controller.signal;

      function succeed(text, responseUrl) {
        if (settled) return;
        settled = true;
        record.status = 'fulfilled';
        record.text = text;
        record.responseUrl = responseUrl || resolvedUrl;
        if (timer) global.clearTimeout(timer);
        resolve(record);
      }

      function fail(error) {
        if (settled) return;
        settled = true;
        record.status = 'rejected';
        if (timer) global.clearTimeout(timer);
        if (records.text[key] === record) delete records.text[key];
        reject(error);
      }

      record.cancel = function(reason) {
        if (controller && !controller.signal.aborted) controller.abort();
        fail(reason || createAbortError(
          'Cancelled loading text: ' + resolvedUrl
        ));
      };

      try {
        global.fetch(resolvedUrl, fetchOptions).then(function(response) {
          if (!response.ok) {
            throw new Error(
              'Failed to load text: ' +
              resolvedUrl +
              ' (' +
              response.status +
              ')'
            );
          }
          return response.text().then(function(text) {
            succeed(text, response.url);
          });
        }).catch(fail);
        if (!settled && effectiveOptions.timeout > 0) {
          timer = global.setTimeout(function() {
            record.cancel(createTimeoutError(
              'text',
              resolvedUrl,
              effectiveOptions.timeout
            ));
          }, effectiveOptions.timeout);
        }
      } catch (error) {
        fail(error);
      }
    });
    return record.promise;
  }

  function loadText(url, options) {
    return loadTextRecord(url, options).then(function(record) {
      return record.text;
    });
  }

  function getText(url, options) {
    var resolvedUrl;
    var effectiveOptions;
    var record;
    requireDocument();
    resolvedUrl = resolveUrl(url);
    effectiveOptions = mergeBucketOptions('text', options);
    record = records.text[getTextKey(resolvedUrl, effectiveOptions)];
    return record && record.text != null ? record.text : null;
  }

  function loadXml(url, options) {
    return loadTextRecord(url, options).then(function(record) {
      var parser;
      var xml;
      var parseErrors;

      try {
        if (typeof global.DOMParser !== 'function') {
          throw new Error('fabLoader XML loading requires DOMParser.');
        }
        parser = new global.DOMParser();
        xml = parser.parseFromString(record.text, 'application/xml');
        parseErrors = xml.getElementsByTagName('parsererror');
        if (parseErrors.length) {
          throw new Error('Failed to parse XML: ' + record.responseUrl);
        }
        return xml;
      } catch (error) {
        if (records.text[record.key] === record) {
          delete records.text[record.key];
        }
        throw error;
      }
    });
  }

  function loadHtml(url, options) {
    var names;
    if (Array.isArray(url)) {
      return Promise.all(url.map(function(item) {
        return loadHtml(item, options);
      }));
    }
    if (isResourceMap(url)) {
      names = Object.keys(url);
      return Promise.all(names.map(function(name) {
        return loadHtml(url[name], options);
      })).then(function(html) {
        var map = {};
        names.forEach(function(name, index) {
          Object.defineProperty(map, name, {
            configurable: true,
            enumerable: true,
            value: html[index],
            writable: true
          });
        });
        return map;
      });
    }
    return loadText(url, options);
  }

  function getHtml(url, options) {
    return getText(url, options);
  }

  function clearTextCache(url, options) {
    var resolvedUrl;
    var effectiveOptions;
    var keys;
    if (url == null) {
      Object.keys(records.text).forEach(function(key) {
        var record = records.text[key];
        if (record.status === 'pending' && record.cancel) record.cancel();
      });
      records.text = Object.create(null);
      return;
    }
    requireDocument();
    resolvedUrl = resolveUrl(url);
    if (arguments.length > 1) {
      effectiveOptions = mergeBucketOptions('text', options);
      keys = [getTextKey(resolvedUrl, effectiveOptions)];
    } else {
      keys = Object.keys(records.text).filter(function(key) {
        return records.text[key].url === resolvedUrl;
      });
    }
    keys.forEach(function(key) {
      var record = records.text[key];
      if (!record) return;
      if (record.status === 'pending' && record.cancel) record.cancel();
      delete records.text[key];
    });
  }

  function normalizeBucketName(bucket) {
    if (bucket === 'style') return 'css';
    if (
      bucket === 'script' ||
      bucket === 'css' ||
      bucket === 'image' ||
      bucket === 'text'
    ) {
      return bucket;
    }
    throw new TypeError('Unknown fabLoader resource bucket: ' + bucket);
  }

  function cancelBucket(bucket, resolvedUrl) {
    var count = 0;
    Object.keys(records[bucket]).forEach(function(key) {
      var record = records[bucket][key];
      if (
        record.status !== 'pending' ||
        (resolvedUrl && record.url !== resolvedUrl) ||
        typeof record.cancel !== 'function'
      ) {
        return;
      }
      count += 1;
      record.cancel(createAbortError(
        'Cancelled loading ' + bucket + ': ' + record.url
      ));
    });
    return count;
  }

  function cancel(bucket, url) {
    var buckets;
    var resolvedUrl = null;
    if (bucket == null) {
      buckets = ['script', 'css', 'image', 'text'];
    } else {
      buckets = [normalizeBucketName(bucket)];
    }
    if (url != null) {
      requireDocument();
      resolvedUrl = resolveUrl(url);
    }
    return buckets.reduce(function(count, name) {
      return count + cancelBucket(name, resolvedUrl);
    }, 0);
  }

  function resolveTarget(target) {
    var element = target;
    if (typeof target === 'string') element = document.querySelector(target);
    if (!element || element.nodeType !== 1) {
      throw new TypeError('A valid mount target is required.');
    }
    return element;
  }

  function shouldRewriteUrl(value) {
    return value &&
      value.charAt(0) !== '#' &&
      !/^(?:data|blob|javascript|mailto|tel):/i.test(value);
  }

  function rewriteRelativeUrls(root, baseUrl) {
    var attributes = ['src', 'href', 'action', 'poster'];
    Array.prototype.forEach.call(root.querySelectorAll('*'), function(element) {
      attributes.forEach(function(name) {
        var value = element.getAttribute(name);
        if (!shouldRewriteUrl(value)) return;
        try {
          element.setAttribute(name, resolveUrl(value, baseUrl));
        } catch (error) {
          // Keep malformed URLs unchanged so the browser can report them.
        }
      });
    });
  }

  function isExecutableScript(script) {
    var type = String(script.getAttribute('type') || '')
      .trim()
      .toLowerCase();
    return !type ||
      type === 'module' ||
      type === 'text/javascript' ||
      type === 'application/javascript' ||
      type === 'text/ecmascript' ||
      type === 'application/ecmascript';
  }

  function activateScript(script) {
    if (!isExecutableScript(script)) return Promise.resolve(script);
    return new Promise(function(resolve, reject) {
      var activeScript = document.createElement('script');
      var source;
      Array.prototype.forEach.call(script.attributes, function(attribute) {
        activeScript.setAttribute(attribute.name, attribute.value);
      });
      source = activeScript.getAttribute('src');
      activeScript.async = script.hasAttribute('async');
      if (source || activeScript.type === 'module') {
        activeScript.onload = function() {
          activeScript.onload = null;
          activeScript.onerror = null;
          resolve(activeScript);
        };
        activeScript.onerror = function() {
          var error = new Error(
            'Failed to execute html script: ' + (source || '[inline module]')
          );
          activeScript.onload = null;
          activeScript.onerror = null;
          reject(error);
        };
      }
      if (!source) activeScript.text = script.textContent || '';
      script.parentNode.replaceChild(activeScript, script);
      if (!source && activeScript.type !== 'module') resolve(activeScript);
    });
  }

  function activateScripts(scripts) {
    var promise = Promise.resolve();
    scripts.forEach(function(script) {
      promise = promise.then(function() {
        return activateScript(script);
      });
    });
    return promise;
  }

  function replaceTargetContents(target, fragment, append) {
    if (!append) {
      while (target.firstChild) target.removeChild(target.firstChild);
    }
    target.appendChild(fragment);
  }

  function mountHtml(target, url, options) {
    var mountTarget;
    options = options || {};
    requireDocument();
    try {
      mountTarget = resolveTarget(target);
    } catch (error) {
      return Promise.reject(error);
    }
    return loadTextRecord(url, options).then(function(record) {
      var template = document.createElement('template');
      var fragment;
      var scripts;
      template.innerHTML = record.text;
      fragment = template.content;
      rewriteRelativeUrls(fragment, record.responseUrl);
      scripts = Array.prototype.slice.call(fragment.querySelectorAll('script'));
      replaceTargetContents(mountTarget, fragment, options.append === true);
      if (options.executeScripts === false) scripts = [];
      return activateScripts(scripts).then(function() {
        return {
          target: mountTarget,
          url: record.url,
          responseUrl: record.responseUrl,
          html: record.text
        };
      });
    });
  }

  function loadVue(url) {
    var system = global.System || global.SystemJS;
    var resolvedUrl;
    requireDocument();

    if (!system || typeof system['import'] !== 'function') {
      return Promise.reject(new Error(
        'fabLoader.vue() requires SystemJS with System.import().'
      ));
    }
    if (
      !global.Vue ||
      typeof global.Vue !== 'function' ||
      !/^2\./.test(String(global.Vue.version || ''))
    ) {
      return Promise.reject(new Error(
        'fabLoader.vue() requires Vue 2.'
      ));
    }
    if (typeof global.Vue.compile !== 'function') {
      return Promise.reject(new Error(
        'fabLoader.vue() requires the full Vue 2 build with the template compiler.'
      ));
    }

    try {
      resolvedUrl = resolveUrl(url);
    } catch (error) {
      return Promise.reject(error);
    }
    return system['import'](resolvedUrl);
  }

  function loadReact(url) {
    var system = global.System || global.SystemJS;
    var resolvedUrl;
    requireDocument();

    if (!system || typeof system['import'] !== 'function') {
      return Promise.reject(new Error(
        'fabLoader.react() requires SystemJS with System.import().'
      ));
    }
    if (
      !global.React ||
      typeof global.React.createElement !== 'function'
    ) {
      return Promise.reject(new Error(
        'fabLoader.react() requires React.'
      ));
    }
    if (
      !global.ReactDOMClient ||
      typeof global.ReactDOMClient.createRoot !== 'function'
    ) {
      return Promise.reject(new Error(
        'fabLoader.react() requires ReactDOMClient with createRoot().'
      ));
    }

    try {
      resolvedUrl = resolveUrl(url);
    } catch (error) {
      return Promise.reject(error);
    }
    return system['import'](resolvedUrl);
  }

  function createQueue() {
    var promise = Promise.resolve();
    var queue;

    function append(step) {
      promise = promise.then(step);
      return queue;
    }

    function requireCallback(callback, name) {
      if (typeof callback !== 'function') {
        throw new TypeError(name + ' callback must be a function.');
      }
    }

    queue = {
      style: function(urls, options) {
        var list = Array.isArray(urls) ? urls.slice() : [urls];
        return append(function() {
          return Promise.all(list.map(function(url) {
            return loadCss(url, options);
          }));
        });
      },
      script: function(url, options) {
        var urls = Array.isArray(url) ? url.slice() : null;
        return append(function() {
          if (urls) {
            return Promise.all(urls.map(function(item) {
              return loadScript(item, options);
            }));
          }
          return loadScript(url, options);
        });
      },
      module: function(url, options) {
        var moduleOptions = {};
        Object.keys(options || {}).forEach(function(name) {
          moduleOptions[name] = options[name];
        });
        moduleOptions.type = 'module';
        return append(function() {
          return loadScript(url, moduleOptions);
        });
      },
      vue: function(url) {
        return append(function() {
          return loadVue(url);
        });
      },
      react: function(url) {
        return append(function() {
          return loadReact(url);
        });
      },
      run: function(callback) {
        requireCallback(callback, 'run');
        return append(function() {
          return callback();
        });
      },
      done: function(callback) {
        requireCallback(callback, 'done');
        return append(function() {
          return callback();
        });
      },
      catch: function(callback) {
        requireCallback(callback, 'catch');
        promise = promise.catch(callback);
        return queue;
      }
    };
    queue.wait = queue.run;

    return queue;
  }

  function startStyle(urls, options) {
    return createQueue().style(urls, options);
  }

  function startScript(url, options) {
    return createQueue().script(url, options);
  }

  function startModule(url, options) {
    return createQueue().module(url, options);
  }

  function startVue(url) {
    return createQueue().vue(url);
  }

  function startReact(url) {
    return createQueue().react(url);
  }

  function startRun(callback) {
    return createQueue().run(callback);
  }

  function useDom() {
    var jquery = global.jQuery;
    if (
      typeof jquery === 'function' &&
      jquery.fn &&
      typeof jquery.fn.jquery === 'string'
    ) {
      return jquery;
    }
    if (typeof global.fabDom === 'function') {
      return global.fabDom;
    }
    throw new Error('fabLoader DOM helper is unavailable.');
  }

  api = {
    version: '0.12.0',
    dom: global.fabDom,
    useDom: useDom,
    setConfig: setConfig,
    getConfig: getConfig,
    cancel: cancel,
    queue: createQueue,
    style: startStyle,
    script: startScript,
    module: startModule,
    vue: startVue,
    react: startReact,
    run: startRun,
    wait: startRun,
    loadScript: loadScript,
    loadCss: loadCss,
    preloadImage: preloadImage,
    loadText: loadText,
    getText: getText,
    loadXml: loadXml,
    loadHtml: loadHtml,
    getHtml: getHtml,
    clearTextCache: clearTextCache,
    mountHtml: mountHtml
  };
  global.fabLoader = api;
}(typeof window !== 'undefined' ? window : this));
