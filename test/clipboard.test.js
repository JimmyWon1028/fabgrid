import test from 'node:test';
import assert from 'node:assert/strict';
import { Clipboard } from '../src/core/clipboard.js';

test('Clipboard copies text through the browser Clipboard API', async function() {
  var originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  var copiedText = null;

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      clipboard: {
        writeText: function(text) {
          copiedText = text;
          return Promise.resolve();
        }
      }
    }
  });
  try {
    assert.equal(await Clipboard.copy('FabUI'), true);
    assert.equal(copiedText, 'FabUI');
  } finally {
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', originalNavigator);
    } else {
      delete globalThis.navigator;
    }
  }
});

test('Clipboard falls back to a temporary textarea', async function() {
  var originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  var originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  var appended = null;
  var selected = false;

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {}
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      body: {
        appendChild: function(element) {
          appended = element;
        },
        removeChild: function(element) {
          if (appended === element) appended = null;
        }
      },
      createElement: function() {
        return {
          setAttribute: function() {},
          select: function() {
            selected = true;
          },
          style: {},
          value: ''
        };
      },
      execCommand: function(command) {
        return command === 'copy';
      }
    }
  });
  try {
    assert.equal(await Clipboard.copy('Fallback'), true);
    assert.equal(selected, true);
    assert.equal(appended, null);
  } finally {
    if (originalDocument) {
      Object.defineProperty(globalThis, 'document', originalDocument);
    } else {
      delete globalThis.document;
    }
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', originalNavigator);
    } else {
      delete globalThis.navigator;
    }
  }
});
