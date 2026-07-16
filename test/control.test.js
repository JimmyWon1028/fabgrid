import test from 'node:test';
import assert from 'node:assert/strict';
import { Control, registerControl, unregisterControl } from '../src/core/control.js';

test('Control.getControl resolves a registered host element', function() {
  var host = { nodeType: 1 };
  var grid = {};

  registerControl(host, grid);

  assert.equal(Control.getControl(host), grid);
});

test('Control.getControl returns null for missing or invalid hosts', function() {
  var originalDocument = globalThis.document;
  var host = { nodeType: 1 };

  globalThis.document = {
    querySelector: function(selector) {
      return selector === '#grid' ? host : null;
    }
  };
  registerControl(host, { name: 'grid' });

  assert.equal(Control.getControl(null), null);
  assert.equal(Control.getControl({}), null);
  assert.equal(Control.getControl('#grid').name, 'grid');
  assert.equal(Control.getControl('#missing'), null);

  unregisterControl(host, Control.getControl(host));
  if (originalDocument === undefined) {
    delete globalThis.document;
  } else {
    globalThis.document = originalDocument;
  }
});

test('unregisterControl only removes the matching control', function() {
  var host = { nodeType: 1 };
  var firstGrid = {};
  var secondGrid = {};

  registerControl(host, firstGrid);
  registerControl(host, secondGrid);
  unregisterControl(host, firstGrid);
  assert.equal(Control.getControl(host), secondGrid);

  unregisterControl(host, secondGrid);
  assert.equal(Control.getControl(host), null);
});

test('Control manages DOM event listeners with Wijmo-compatible removal filters', function() {
  var control = new Control();
  var target = new EventTarget();
  var calls = 0;
  var handler = function() {
    calls += 1;
  };

  control.addEventListener(target, 'change', handler);
  control.addEventListener(target, 'change', handler);
  target.dispatchEvent(new Event('change'));

  assert.equal(calls, 1);
  assert.equal(control.removeEventListener(target, 'change', handler), 1);
  assert.equal(control.removeEventListener(target, 'change', handler), 0);
  target.dispatchEvent(new Event('change'));
  assert.equal(calls, 1);
});

test('Control removes all managed DOM event listeners when called without filters', function() {
  var control = new Control();
  var firstTarget = new EventTarget();
  var secondTarget = new EventTarget();
  var calls = 0;
  var handler = function() {
    calls += 1;
  };

  control.addEventListener(firstTarget, 'change', handler);
  control.addEventListener(secondTarget, 'input', handler);

  assert.equal(control.removeEventListener(), 2);
  firstTarget.dispatchEvent(new Event('change'));
  secondTarget.dispatchEvent(new Event('input'));
  assert.equal(calls, 0);
});
