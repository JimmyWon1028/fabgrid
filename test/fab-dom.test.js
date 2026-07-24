import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

var source = fs.readFileSync('src/fabdom/fabDom.js', 'utf8');

function createElement(html) {
  var attributes = {};
  var listeners = {};
  var styles = {};
  var element = {
    nodeType: 1,
    innerHTML: html || '',
    textContent: '',
    value: '',
    tagName: 'DIV',
    className: '',
    id: '',
    type: '',
    checked: false,
    parentNode: null,
    parentElement: null,
    children: [],
    removed: false,
    style: {
      setProperty: function(name, value) {
        styles[name] = value;
      },
      getPropertyValue: function(name) {
        return styles[name] || '';
      },
      removeProperty: function(name) {
        delete styles[name];
      }
    },
    computedStyle: {},
    appended: [],
    getAttribute: function(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name) ?
        attributes[name] :
        null;
    },
    setAttribute: function(name, value) {
      attributes[name] = String(value);
      if (name === 'class') this.className = String(value);
      if (name === 'id') this.id = String(value);
    },
    removeAttribute: function(name) {
      delete attributes[name];
      if (name === 'class') this.className = '';
      if (name === 'id') this.id = '';
    },
    insertAdjacentHTML: function(position, value) {
      this.appended.push({ position: position, value: value });
      if (position === 'afterbegin') {
        this.innerHTML = value + this.innerHTML;
      } else if (position === 'beforeend') {
        this.innerHTML += value;
      }
    },
    matches: function(selector) {
      if (selector.charAt(0) === '.') {
        return this.className.split(/\s+/).indexOf(selector.slice(1)) >= 0;
      }
      if (selector.charAt(0) === '#') {
        return this.id === selector.slice(1);
      }
      return this.tagName.toLowerCase() === selector.toLowerCase();
    },
    querySelectorAll: function(selector) {
      var matches = [];
      function visit(parent) {
        parent.children.forEach(function(child) {
          if (child.matches(selector)) matches.push(child);
          visit(child);
        });
      }
      visit(this);
      return matches;
    },
    appendChild: function(child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    insertBefore: function(child, reference) {
      var index;
      if (child.parentNode) child.parentNode.removeChild(child);
      index = reference ? this.children.indexOf(reference) : -1;
      child.parentNode = this;
      child.parentElement = this;
      if (index < 0) {
        this.children.push(child);
      } else {
        this.children.splice(index, 0, child);
      }
      return child;
    },
    removeChild: function(child) {
      var index = this.children.indexOf(child);
      if (index >= 0) this.children.splice(index, 1);
      child.parentNode = null;
      child.parentElement = null;
      child.removed = true;
      return child;
    },
    remove: function() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      } else {
        this.removed = true;
      }
    },
    addEventListener: function(type, handler) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    },
    removeEventListener: function(type, handler) {
      listeners[type] = (listeners[type] || []).filter(function(listener) {
        return listener !== handler;
      });
    },
    dispatchEvent: function(event) {
      event.target = event.target || this;
      (listeners[event.type] || []).slice().forEach(function(handler) {
        handler.call(element, event);
      });
    },
    listenerCount: function(type) {
      return (listeners[type] || []).length;
    },
    cloneNode: function(deep) {
      var clone = createElement(this.innerHTML);
      clone.textContent = this.textContent;
      clone.value = this.value;
      clone.tagName = this.tagName;
      clone.className = this.className;
      clone.id = this.id;
      clone.type = this.type;
      clone.checked = this.checked;
      Object.keys(attributes).forEach(function(name) {
        clone.setAttribute(name, attributes[name]);
      });
      if (deep) {
        this.children.forEach(function(child) {
          clone.appendChild(child.cloneNode(true));
        });
      }
      return clone;
    }
  };
  Object.defineProperties(element, {
    firstChild: {
      get: function() {
        return this.children.length ? this.children[0] : null;
      }
    },
    nextSibling: {
      get: function() {
        var index;
        if (!this.parentNode) return null;
        index = this.parentNode.children.indexOf(this);
        return index >= 0 ? this.parentNode.children[index + 1] || null : null;
      }
    }
  });
  return element;
}

function createContext(elements, globals) {
  var context = Object.assign({}, globals || {});
  context.document = {
    nodeType: 9,
    querySelectorAll: function(selector) {
      return elements[selector] || [];
    }
  };
  context.getComputedStyle = function(element) {
    return {
      getPropertyValue: function(name) {
        return element.computedStyle[name] ||
          element.style.getPropertyValue(name);
      }
    };
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

test('fabDom publishes an independent browser global', function() {
  var context = createContext({});

  assert.equal(typeof context.fabDom, 'function');
  assert.equal(context.fabDom.version, '0.4.0');
  assert.equal(context.$, context.fabDom);
  assert.equal(context.fabui, undefined);
  assert.equal(context.fabLoader, undefined);
});

test('fabDom only claims the dollar alias when it is safe', function() {
  var jquery = function() {};
  var otherDollar = function() {};
  var jqueryContext = createContext({}, {
    jQuery: jquery,
    $: jquery
  });
  var noConflictContext = createContext({}, {
    jQuery: jquery
  });
  var occupiedContext = createContext({}, {
    $: otherDollar
  });

  assert.equal(jqueryContext.$, jquery);
  assert.notEqual(jqueryContext.fabDom, jquery);
  assert.equal(noConflictContext.$, undefined);
  assert.equal(typeof noConflictContext.fabDom, 'function');
  assert.equal(occupiedContext.$, otherDollar);
});

test('fabDom load delegates to fabLoader with jQuery-like callback arguments', async function() {
  var target = createElement();
  var mountCalls = [];
  var context = createContext({
    '#target': [target]
  }, {
    fabLoader: {
      mountHtml: function(element, url, options) {
        mountCalls.push({
          element: element,
          url: url,
          options: options
        });
        return Promise.resolve({
          target: element,
          url: url,
          responseUrl: url,
          html: '<p>loaded</p>'
        });
      }
    }
  });
  var collection = context.fabDom('#target');
  var callbackArgs;

  assert.equal(collection.load('./sample.html', function(
    responseText,
    status,
    result
  ) {
    callbackArgs = [this, responseText, status, result];
  }), collection);
  await collection._loadPromise;

  assert.equal(mountCalls.length, 1);
  assert.equal(mountCalls[0].element, target);
  assert.equal(mountCalls[0].url, './sample.html');
  assert.equal(callbackArgs[0], target);
  assert.equal(callbackArgs[1], '<p>loaded</p>');
  assert.equal(callbackArgs[2], 'success');
  assert.equal(callbackArgs[3].target, target);
});

test('fabDom collection supports iteration and positional selection', function() {
  var first = createElement();
  var second = createElement();
  var third = createElement();
  var context = createContext({
    '.item': [first, second, third]
  });
  var collection = context.fabDom('.item');
  var visited = [];

  assert.equal(collection.each(function(index, element) {
    visited.push([index, this === element]);
    if (index === 1) return false;
  }), collection);
  assert.deepEqual(visited, [[0, true], [1, true]]);
  assert.equal(collection.get(0), first);
  assert.equal(collection.get(-1), third);
  assert.equal(collection.get().length, 3);
  assert.equal(collection.eq(1)[0], second);
  assert.equal(collection.first()[0], first);
  assert.equal(collection.last()[0], third);
  assert.equal(collection.eq(10).length, 0);
});

test('fabDom html gets and replaces matched element contents', function() {
  var first = createElement('<b>old</b>');
  var second = createElement('<i>old</i>');
  var context = createContext({
    '.item': [first, second]
  });
  var collection = context.fabDom('.item');

  assert.equal(collection.length, 2);
  assert.equal(collection.html(), '<b>old</b>');
  assert.equal(collection.html('<strong>new</strong>'), collection);
  assert.equal(first.innerHTML, '<strong>new</strong>');
  assert.equal(second.innerHTML, '<strong>new</strong>');
  assert.equal(collection.html(function(index, value) {
    return value + index;
  }), collection);
  assert.equal(first.innerHTML, '<strong>new</strong>0');
  assert.equal(second.innerHTML, '<strong>new</strong>1');
});

test('fabDom inserts trusted HTML around and inside every match', function() {
  var first = createElement('first');
  var second = createElement('second');
  var context = createContext({
    '.item': [first, second]
  });
  var collection = context.fabDom('.item');

  assert.equal(collection.append('<span>+</span>'), collection);
  assert.deepEqual(first.appended, [
    { position: 'beforeend', value: '<span>+</span>' }
  ]);
  assert.deepEqual(second.appended, [
    { position: 'beforeend', value: '<span>+</span>' }
  ]);
  assert.equal(collection.prepend('<b>-</b>'), collection);
  assert.equal(collection.before('<i>before</i>'), collection);
  assert.equal(collection.after('<i>after</i>'), collection);
  assert.deepEqual(first.appended.slice(1), [
    { position: 'afterbegin', value: '<b>-</b>' },
    { position: 'beforebegin', value: '<i>before</i>' },
    { position: 'afterend', value: '<i>after</i>' }
  ]);
});

test('fabDom inserts DOM nodes without converting them to text', function() {
  var first = createElement();
  var second = createElement();
  var parent = createElement();
  var tail = createElement();
  var image = createElement();
  var prependNode = createElement();
  var beforeNode = createElement();
  var afterNode = createElement();
  var context;

  image.tagName = 'IMG';
  prependNode.tagName = 'STRONG';
  beforeNode.tagName = 'ASIDE';
  afterNode.tagName = 'FOOTER';
  tail.tagName = 'NAV';
  parent.appendChild(first);
  parent.appendChild(tail);
  context = createContext({
    '.target': [first, second]
  });

  context.fabDom('.target').append(image);
  assert.equal(first.children.length, 1);
  assert.equal(first.children[0].tagName, 'IMG');
  assert.notEqual(first.children[0], image);
  assert.equal(second.children[0], image);
  assert.doesNotMatch(first.innerHTML, /\[object Object\]/);

  context.fabDom(first).prepend(prependNode);
  assert.equal(first.children[0], prependNode);
  context.fabDom(first).before(beforeNode).after(afterNode);
  assert.deepEqual(parent.children, [beforeNode, first, afterNode, tail]);
});

test('fabDom accepts an element and keeps empty selections chainable', function() {
  var element = createElement();
  var context = createContext({});
  var selected = context.fabDom(element);
  var empty = context.fabDom('.missing');

  assert.equal(selected.length, 1);
  assert.equal(selected[0], element);
  assert.equal(empty.length, 0);
  assert.equal(empty.html(), undefined);
  assert.equal(empty.html('ignored'), empty);
  assert.equal(empty.append('ignored'), empty);
});

test('fabDom text gets combined text and sets every match', function() {
  var first = createElement();
  var second = createElement();
  var context;
  var collection;
  first.textContent = 'A';
  second.textContent = 'B';
  context = createContext({ '.item': [first, second] });
  collection = context.fabDom('.item');

  assert.equal(collection.text(), 'AB');
  assert.equal(collection.text(function(index, value) {
    return value + index;
  }), collection);
  assert.equal(first.textContent, 'A0');
  assert.equal(second.textContent, 'B1');
  assert.equal(collection.text(null), collection);
  assert.equal(first.textContent, '');
  assert.equal(second.textContent, '');
});

test('fabDom val gets the first value and sets every match', function() {
  var first = createElement();
  var second = createElement();
  var context;
  var collection;
  first.tagName = 'INPUT';
  first.value = '10';
  second.tagName = 'INPUT';
  second.value = '20';
  context = createContext({ '.item': [first, second] });
  collection = context.fabDom('.item');

  assert.equal(collection.val(), '10');
  assert.equal(collection.val(function(index, value) {
    return Number(value) + index + 1;
  }), collection);
  assert.equal(first.value, '11');
  assert.equal(second.value, '22');
  assert.equal(collection.val(null), collection);
  assert.equal(first.value, '');
  assert.equal(second.value, '');
});

test('fabDom attr supports getters, setters, maps and removal', function() {
  var first = createElement();
  var second = createElement();
  var context = createContext({ '.item': [first, second] });
  var collection = context.fabDom('.item');

  assert.equal(collection.attr('title'), undefined);
  assert.equal(collection.attr('title', 'Demo'), collection);
  assert.equal(collection.attr('title'), 'Demo');
  assert.equal(collection.attr({
    role: 'button',
    'data-index': function(index) {
      return index;
    }
  }), collection);
  assert.equal(first.getAttribute('role'), 'button');
  assert.equal(second.getAttribute('data-index'), '1');
  assert.equal(collection.attr('title', null), collection);
  assert.equal(first.getAttribute('title'), null);
  assert.equal(second.getAttribute('title'), null);
  assert.equal(collection.attr({
    title: 'Demo',
    tabindex: 0
  }).removeAttr('title tabindex'), collection);
  assert.equal(first.getAttribute('title'), null);
  assert.equal(first.getAttribute('tabindex'), null);
});

test('fabDom prop gets and sets DOM properties', function() {
  var first = createElement();
  var second = createElement();
  var context = createContext({ '.item': [first, second] });
  var collection = context.fabDom('.item');

  assert.equal(collection.prop('checked'), false);
  assert.equal(collection.prop('checked', true), collection);
  assert.equal(first.checked, true);
  assert.equal(second.checked, true);
  assert.equal(collection.prop({
    disabled: true,
    tabIndex: function(index) {
      return index;
    }
  }), collection);
  assert.equal(first.disabled, true);
  assert.equal(second.tabIndex, 1);
});

test('fabDom css supports computed getters, maps and numeric pixels', function() {
  var first = createElement();
  var second = createElement();
  var context = createContext({ '.item': [first, second] });
  var collection = context.fabDom('.item');
  first.computedStyle.color = 'rgb(1, 2, 3)';

  assert.equal(collection.css('color'), 'rgb(1, 2, 3)');
  assert.equal(collection.css('width', 120), collection);
  assert.equal(first.style.getPropertyValue('width'), '120px');
  assert.equal(second.style.getPropertyValue('width'), '120px');
  assert.equal(collection.css({
    opacity: 0.5,
    'background-color': 'red'
  }), collection);
  assert.equal(first.style.getPropertyValue('opacity'), '0.5');
  assert.equal(first.style.getPropertyValue('background-color'), 'red');
  assert.deepEqual(
    JSON.parse(JSON.stringify(collection.css(['width', 'opacity']))),
    { width: '120px', opacity: '0.5' }
  );
  assert.equal(collection.css('width', null), collection);
  assert.equal(first.style.getPropertyValue('width'), '');
});

test('fabDom manages multiple CSS classes', function() {
  var first = createElement();
  var second = createElement();
  var context = createContext({ '.item': [first, second] });
  var collection = context.fabDom('.item');

  assert.equal(collection.addClass('active ready'), collection);
  assert.equal(collection.hasClass('active'), true);
  assert.equal(collection.toggleClass('active'), collection);
  assert.equal(collection.hasClass('active'), false);
  assert.equal(collection.toggleClass('disabled', true), collection);
  assert.equal(collection.hasClass('disabled'), true);
  assert.equal(collection.removeClass('ready disabled'), collection);
  assert.equal(collection.hasClass('ready'), false);
  assert.equal(collection.addClass('one two').removeClass(), collection);
  assert.equal(first.className, '');
  assert.equal(second.className, '');
});

test('fabDom binds and removes direct and delegated events', function() {
  var root = createElement();
  var item = createElement();
  var context;
  var collection;
  var directCalls = 0;
  var delegatedCalls = 0;
  var prevented = false;
  var stopped = false;
  function directHandler() {
    directCalls += 1;
    assert.equal(this, root);
    return false;
  }
  function delegatedHandler() {
    delegatedCalls += 1;
    assert.equal(this, item);
  }

  item.setAttribute('class', 'item');
  root.appendChild(item);
  context = createContext({ '#root': [root] });
  collection = context.fabDom('#root');

  assert.equal(collection.on('click', directHandler), collection);
  assert.equal(collection.on('click', '.item', delegatedHandler), collection);
  assert.equal(root.listenerCount('click'), 2);
  root.dispatchEvent({
    type: 'click',
    target: item,
    preventDefault: function() {
      prevented = true;
    },
    stopPropagation: function() {
      stopped = true;
    }
  });
  assert.equal(directCalls, 1);
  assert.equal(delegatedCalls, 1);
  assert.equal(prevented, true);
  assert.equal(stopped, true);

  assert.equal(collection.off('click', directHandler), collection);
  assert.equal(root.listenerCount('click'), 1);
  assert.equal(collection.off('click', '.item', delegatedHandler), collection);
  assert.equal(root.listenerCount('click'), 0);
  assert.equal(collection.on('focus blur', directHandler).off(), collection);
  assert.equal(root.listenerCount('focus'), 0);
  assert.equal(root.listenerCount('blur'), 0);
});

test('fabDom empties and removes matched elements', function() {
  var parent = createElement();
  var child = createElement('<strong>content</strong>');
  var context = createContext({ '.item': [child] });
  var collection = context.fabDom('.item');

  parent.appendChild(child);
  assert.equal(collection.empty(), collection);
  assert.equal(child.innerHTML, '');
  assert.equal(collection.remove(), collection);
  assert.equal(child.removed, true);
  assert.equal(parent.children.length, 0);
});

test('fabDom traverses descendants, ancestors and children', function() {
  var root = createElement();
  var group = createElement();
  var item = createElement();
  var other = createElement();
  var context;

  root.setAttribute('class', 'root');
  group.setAttribute('class', 'group');
  item.setAttribute('class', 'item');
  other.setAttribute('class', 'other');
  root.appendChild(group);
  group.appendChild(item);
  group.appendChild(other);
  context = createContext({});

  assert.equal(context.fabDom(root).find('.item')[0], item);
  assert.equal(context.fabDom(item).closest('.group')[0], group);
  assert.equal(context.fabDom(item).parent()[0], group);
  assert.equal(context.fabDom(item).parent('.group')[0], group);
  assert.equal(context.fabDom(group).children().length, 2);
  assert.equal(context.fabDom(group).children('.item')[0], item);
  assert.equal(context.fabDom(item).is('.item'), true);
  assert.equal(context.fabDom(item).is(other), false);
  assert.equal(context.fabDom(item).is(function(index, element) {
    return index === 0 && this === element;
  }), true);
});

test('fabDom stays source-only inside the fabLoader build', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  assert.equal(packageJson.scripts['build:dom'], undefined);
  assert.equal(fs.existsSync('build/build-dom.cjs'), false);
  assert.equal(fs.existsSync('dist/fabDom.js'), false);
  assert.equal(fs.existsSync('dist/fabDom.min.js'), false);
  assert.equal(fs.existsSync('test/fab-dom-smoke.html'), false);
});
