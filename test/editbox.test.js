import test from 'node:test';
import assert from 'node:assert/strict';
import EditBox, {
  EditBox as NamedEditBox,
  editorDefinitions
} from '../src/editbox/editbox.js';

test('EditBox exposes one class for all legacy Box editor types', function() {
  assert.equal(EditBox, NamedEditBox);
  assert.deepEqual(EditBox.editorTypes, [
    'textbox',
    'numberbox',
    'datebox',
    'combobox',
    'color'
  ]);
});

test('EditBox owns the shared FabGrid editor definitions', function() {
  assert.equal(EditBox.editorDefinitions, editorDefinitions);
  assert.equal(EditBox.getEditorDefinition('textbox'), editorDefinitions.textbox);
  assert.equal(EditBox.getEditorDefinition('numberbox'), editorDefinitions.numberbox);
  assert.equal(EditBox.getEditorDefinition('datebox'), editorDefinitions.datebox);
  assert.equal(EditBox.getEditorDefinition('combobox'), editorDefinitions.combobox);
  assert.ok(editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('color'), editorDefinitions.color);
});

test('EditBox accepts the same editor aliases as FabGrid', function() {
  assert.equal(EditBox.getEditorDefinition('number'), editorDefinitions.numberbox);
  assert.equal(EditBox.getEditorDefinition('numeric'), editorDefinitions.numberbox);
  assert.equal(EditBox.getEditorDefinition('date'), editorDefinitions.datebox);
  assert.equal(EditBox.getEditorDefinition('calendar'), editorDefinitions.datebox);
  assert.equal(EditBox.getEditorDefinition('combo'), editorDefinitions.combobox);
  assert.equal(EditBox.getEditorDefinition('select'), editorDefinitions.combobox);
  assert.equal(EditBox.getEditorDefinition('dropdown'), editorDefinitions.combobox);
  assert.equal(EditBox.getEditorDefinition('colour'), editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('colorbox'), editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('colourbox'), editorDefinitions.color);
});
