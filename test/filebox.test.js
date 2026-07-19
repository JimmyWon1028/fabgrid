import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  createFileBoxFactory,
  normalizeFileBoxButtonAlign,
  normalizeFileBoxLabelPosition,
  normalizeFileBoxTheme
} from '../src/filebox/filebox.js';

test('FabUI core publishes FileBox as a Control', function() {
  assert.equal(typeof fabui.FileBox, 'function');
  assert.equal(Object.getPrototypeOf(fabui.FileBox.prototype), fabui.Control.prototype);
});

test('FileBox exposes the official EasyUI-compatible defaults', function() {
  assert.equal(fabui.FileBox.defaults.width, 200);
  assert.equal(fabui.FileBox.defaults.height, 30);
  assert.equal(fabui.FileBox.defaults.buttonText, 'Choose File');
  assert.equal(fabui.FileBox.defaults.buttonIcon, null);
  assert.equal(fabui.FileBox.defaults.buttonAlign, 'right');
  assert.equal(fabui.FileBox.defaults.accept, '');
  assert.equal(fabui.FileBox.defaults.multiple, false);
  assert.equal(fabui.FileBox.defaults.separator, ',');
});

test('FileBox publishes all required locale packs', function() {
  assert.deepEqual(Object.keys(fabui.FileBox.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.equal(fabui.FileBox.locales.en.chooseFile, 'Choose File');
  assert.equal(fabui.FileBox.locales['zh-TW'].chooseFile, '選擇檔案');
  assert.equal(fabui.FileBox.locales['zh-CN'].chooseFile, '选择文件');
});

test('FileBox normalizes themes, button alignment and label position', function() {
  assert.equal(normalizeFileBoxTheme('material-teal'), 'material-teal');
  assert.equal(normalizeFileBoxTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeFileBoxTheme(' BLACK '), 'black');
  assert.equal(normalizeFileBoxTheme('unknown'), 'default');
  assert.equal(normalizeFileBoxButtonAlign('LEFT'), 'left');
  assert.equal(normalizeFileBoxButtonAlign('center'), 'right');
  assert.equal(normalizeFileBoxLabelPosition('after'), 'after');
  assert.equal(normalizeFileBoxLabelPosition('top'), 'top');
  assert.equal(normalizeFileBoxLabelPosition('bottom'), 'before');
});

test('FileBox factory exposes inherited textbox methods and file APIs', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  function EditBox() {}
  var FileBox = createFileBoxFactory(
    Control,
    function() {},
    function() {},
    EditBox
  );
  assert.equal(typeof FileBox, 'function');
  assert.equal(typeof FileBox.prototype.options, 'function');
  assert.equal(typeof FileBox.prototype.textbox, 'function');
  assert.equal(typeof FileBox.prototype.button, 'function');
  assert.equal(typeof FileBox.prototype.files, 'function');
  assert.equal(typeof FileBox.prototype.getValue, 'function');
  assert.equal(typeof FileBox.prototype.setValue, 'function');
  assert.equal(typeof FileBox.prototype.clear, 'function');
  assert.equal(typeof FileBox.prototype.reset, 'function');
  assert.equal(typeof FileBox.prototype.resize, 'function');
  assert.equal(typeof FileBox.prototype.disable, 'function');
  assert.equal(typeof FileBox.prototype.enable, 'function');
  assert.equal(typeof FileBox.prototype.readonly, 'function');
  assert.equal(FileBox.prototype.dispose, FileBox.prototype.destroy);
});

test('FileBox source preserves the native file input and browser security boundary', function() {
  var source = readFileSync(new URL('../src/filebox/filebox.js', import.meta.url), 'utf8');
  var css = readFileSync(new URL('../src/filebox/filebox.css', import.meta.url), 'utf8');
  assert.match(source, /input\[type="file"\]/);
  assert.match(source, /this\.fieldElement\.appendChild\(this\.hostElement\)/);
  assert.match(source, /return this\.hostElement\.files/);
  assert.match(source, /cannot set a non-empty file value for browser security/);
  assert.match(source, /new EditBox\(this\.proxyElement/);
  assert.match(source, /registerControl\(host, this\)/);
  assert.match(source, /unregisterControl\(this\.hostElement, this\)/);
  assert.match(css, /\.fui-filebox-native/);
  assert.match(css, /clip-path: inset\(50%\)/);
  assert.match(css, /--fui-filebox-button-bg: var\(--fui-control-button-bg/);
});
