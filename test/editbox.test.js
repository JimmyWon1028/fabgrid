import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import EditBox, {
  EditBox as NamedEditBox,
  editorDefinitions
} from '../src/editbox/editbox.js';
import coreFabui from '../src/fabui.js';

var comboSource = readFileSync(
  new URL('../src/editbox/combo-editbox.js', import.meta.url),
  'utf8'
);

test('FabUI core publishes EditBox with shared editor definitions', function() {
  assert.equal(typeof coreFabui.EditBox, 'function');
  assert.equal(coreFabui.EditBox.editorDefinitions, coreFabui.editorDefinitions);
});

test('EditBox exposes one class with simplified editor type names', function() {
  assert.equal(EditBox, NamedEditBox);
  assert.deepEqual(EditBox.editorTypes, [
    'text',
    'number',
    'date',
    'combo',
    'color'
  ]);
  assert.deepEqual(Object.keys(EditBox.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.equal(EditBox.themes.length, 16);
  assert.equal(typeof EditBox.prototype.setLocale, 'function');
});

test('EditBox owns the shared FabGrid editor definitions', function() {
  assert.equal(EditBox.editorDefinitions, editorDefinitions);
  assert.equal(EditBox.getEditorDefinition('text'), editorDefinitions.text);
  assert.equal(EditBox.getEditorDefinition('number'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('date'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('combo'), editorDefinitions.combo);
  assert.ok(editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('color'), editorDefinitions.color);
});

test('EditBox accepts the same editor aliases as FabGrid', function() {
  assert.equal(EditBox.getEditorDefinition('textbox'), editorDefinitions.text);
  assert.equal(EditBox.getEditorDefinition('numberbox'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('numeric'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('datebox'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('calendar'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('combobox'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('select'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('dropdown'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('colour'), editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('colorbox'), editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('colourbox'), editorDefinitions.color);
});

test('Combo EditBox expands its popup to fit long option text by default', function() {
  assert.match(comboSource, /fitContent:\s*true/);
  assert.match(
    comboSource,
    /fitContent:\s*this\._options\.fitContent/
  );
  assert.match(
    comboSource,
    /var booleanNames = \[[^\]]*'fitContent'/
  );
});
