import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import EditBox, {
  EditBox as NamedEditBox,
  editorDefinitions
} from '../src/editbox/editbox.js';
import { createColorEditBoxFactory } from '../src/editbox/color-editbox.js';
import { ColorPopup } from '../src/editbox/color-popup.js';
import { createComboBoxFactory } from '../src/editbox/combo-editbox.js';
import { createDateBoxFactory } from '../src/editbox/date-editbox.js';
import { createNumberBoxFactory } from '../src/editbox/number-editbox.js';
import { createTextBoxFactory } from '../src/editbox/text-editbox.js';
import { createTimeBoxFactory } from '../src/editbox/time-editbox.js';
import coreFabui from '../src/fabui.js';

var comboSource = readFileSync(
  new URL('../src/editbox/combo-editbox.js', import.meta.url),
  'utf8'
);
var colorSource = readFileSync(
  new URL('../src/editbox/color-editbox.js', import.meta.url),
  'utf8'
);
var colorPopupSource = readFileSync(
  new URL('../src/editbox/color-popup.js', import.meta.url),
  'utf8'
);
var colorStyle = readFileSync(
  new URL('../src/editbox/color-editbox.css', import.meta.url),
  'utf8'
);
var dateSource = readFileSync(
  new URL('../src/editbox/date-editbox.js', import.meta.url),
  'utf8'
);
var editBoxSource = readFileSync(
  new URL('../src/editbox/editbox.js', import.meta.url),
  'utf8'
);
var gridSource = readFileSync(
  new URL('../src/grid/fabgrid.js', import.meta.url),
  'utf8'
);
var numberSource = readFileSync(
  new URL('../src/editbox/number-editbox.js', import.meta.url),
  'utf8'
);
var textSource = readFileSync(
  new URL('../src/editbox/text-editbox.js', import.meta.url),
  'utf8'
);
var textStyle = readFileSync(
  new URL('../src/editbox/text-editbox.css', import.meta.url),
  'utf8'
);
var timeSource = readFileSync(
  new URL('../src/editbox/time-editbox.js', import.meta.url),
  'utf8'
);
var numberStyle = readFileSync(
  new URL('../src/editbox/number-editbox.css', import.meta.url),
  'utf8'
);
var timeStyle = readFileSync(
  new URL('../src/editbox/time-editbox.css', import.meta.url),
  'utf8'
);

test('FabUI core publishes EditBox with shared editor definitions', function() {
  assert.equal(typeof coreFabui.EditBox, 'function');
  assert.equal(coreFabui.EditBox.editorDefinitions, coreFabui.editorDefinitions);
  assert.equal(coreFabui.FabGrid.editorDefinitions, coreFabui.editorDefinitions);
  assert.equal(
    coreFabui.FabGrid.editorDefinitions.time,
    coreFabui.EditBox.editorDefinitions.time
  );
});

test('EditBox exposes one class with simplified editor type names', function() {
  assert.equal(EditBox, NamedEditBox);
  assert.deepEqual(EditBox.editorTypes, [
    'text',
    'number',
    'time',
    'date',
    'combo',
    'color'
  ]);
  assert.deepEqual(Object.keys(EditBox.locales), ['en']);
  assert.equal(EditBox.themes.length, 17);
  assert.equal(typeof EditBox.prototype.setLocale, 'function');
});

test('EditBox owns the shared FabGrid editor definitions', function() {
  assert.equal(EditBox.editorDefinitions, editorDefinitions);
  assert.equal(EditBox.getEditorDefinition('text'), editorDefinitions.text);
  assert.equal(EditBox.getEditorDefinition('number'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('time'), editorDefinitions.time);
  assert.equal(EditBox.getEditorDefinition('date'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('combo'), editorDefinitions.combo);
  assert.ok(editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('color'), editorDefinitions.color);
  EditBox.editorTypes.forEach(function(type) {
    assert.equal(editorDefinitions[type].autoUnmask, false);
  });
});

test('EditBox text editor uses the shared charcase definition', function() {
  var TextBox = createTextBoxFactory(editorDefinitions);

  assert.equal(TextBox.defaults.charcase, '');
  assert.equal(
    EditBox.getEditorDefinition('text').normalize('Ab中文-1', { charcase: 'upper' }),
    'AB中文-1'
  );
  [numberSource, timeSource, dateSource].forEach(function(source) {
    assert.match(source, /charcase:\s*''/);
  });
});

test('every EditBox editor type defaults autoUnmask to false', function() {
  var TextBox = createTextBoxFactory(editorDefinitions);
  var factories = [
    TextBox,
    createNumberBoxFactory(TextBox, editorDefinitions),
    createTimeBoxFactory(TextBox, editorDefinitions),
    createDateBoxFactory(TextBox, editorDefinitions),
    createComboBoxFactory(TextBox, editorDefinitions),
    createColorEditBoxFactory(TextBox, editorDefinitions)
  ];

  factories.forEach(function(factory) {
    assert.equal(factory.defaults.autoUnmask, false);
  });
});

test('EditBox exposes a theme variable for focused editor background', function() {
  assert.match(
    textStyle,
    /\.fui-textbox-focused \.fui-textbox-text[\s\S]*?--fui-control-focus-bg/
  );
});

test('EditBox accepts the same editor aliases as FabGrid', function() {
  assert.equal(EditBox.getEditorDefinition('textbox'), editorDefinitions.text);
  assert.equal(EditBox.getEditorDefinition('numberbox'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('numeric'), editorDefinitions.number);
  assert.equal(EditBox.getEditorDefinition('timebox'), editorDefinitions.time);
  assert.equal(EditBox.getEditorDefinition('datebox'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('calendar'), editorDefinitions.date);
  assert.equal(EditBox.getEditorDefinition('combobox'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('select'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('dropdown'), editorDefinitions.combo);
  assert.equal(EditBox.getEditorDefinition('colour'), editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('colorbox'), editorDefinitions.color);
  assert.equal(EditBox.getEditorDefinition('colourbox'), editorDefinitions.color);
});

test('EditBox commits only after focus leaves its control and owned popup', function() {
  var popupTarget = {};
  var outsideTarget = {};
  var fixCount = 0;
  var context = {
    _destroyed: false,
    _focusRoot: {
      contains: function() { return false; }
    },
    _focusPanel: {
      contains: function(target) { return target === popupTarget; }
    },
    _containsFocusTarget: EditBox.prototype._containsFocusTarget,
    fix: function() {
      fixCount += 1;
    }
  };

  EditBox.prototype._handleFocusOut.call(context, {
    relatedTarget: popupTarget
  });
  assert.equal(fixCount, 0);

  EditBox.prototype._handleFocusOut.call(context, {
    relatedTarget: outsideTarget
  });
  assert.equal(fixCount, 1);
});

test('Every EditBox editor type exposes a fix method for focus-leave commit', function() {
  [
    [textSource, 'TextBox'],
    [numberSource, 'NumberBox'],
    [timeSource, 'TimeBox'],
    [dateSource, 'DateBox'],
    [comboSource, 'ComboBox'],
    [colorSource, 'ColorEditBox']
  ].forEach(function(entry) {
    assert.match(
      entry[0],
      new RegExp(entry[1] + '\\.prototype\\.fix\\s*=\\s*function')
    );
  });
  assert.match(editBoxSource, /addEventListener\('focusout', this\._boundFocusOut\)/);
  assert.match(editBoxSource, /removeEventListener\('focusout', this\._boundFocusOut\)/);
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

test('Grid and EditBox color palettes close after selecting a swatch', function() {
  assert.match(
    gridSource,
    /this\.colorPopup = new ColorPopup\(\{[\s\S]*?closeOnSelect:\s*true/
  );
  assert.match(
    colorSource,
    /this\._colorPopup = new ColorPopup\(\{[\s\S]*?closeOnSelect:\s*true/
  );
});

test('Grid and EditBox share the compact 8 by 8 color palette', function() {
  var TextBox = createTextBoxFactory(editorDefinitions);
  var ColorEditBox = createColorEditBoxFactory(TextBox, editorDefinitions);

  assert.equal(ColorPopup.defaultPalette.length, 64);
  assert.deepEqual(ColorPopup.defaultPalette.slice(0, 8), [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#006400',
    '#ff00ff',
    '#ffa500',
    ''
  ]);
  assert.deepEqual(ColorPopup.defaultPalette.slice(8, 16), [
    '#000000',
    '#444444',
    '#666666',
    '#999999',
    '#cccccc',
    '#eeeeee',
    '#f3f3f3',
    '#fffffe'
  ]);
  assert.deepEqual(ColorPopup.defaultPalette.slice(-8), [
    '#660000',
    '#783f04',
    '#7f6000',
    '#274e13',
    '#0c343d',
    '#073763',
    '#20124d',
    '#4c1130'
  ]);
  assert.equal(ColorEditBox.defaults.panelWidth, 162);
  assert.deepEqual(ColorEditBox.defaults.palette, ColorPopup.defaultPalette);
  assert.match(colorStyle, /grid-template-columns:\s*repeat\(8,\s*20px\)/);
  assert.match(colorStyle, /grid-auto-rows:\s*20px/);
  assert.match(colorStyle, /grid-auto-flow:\s*row/);
  assert.match(colorStyle, /gap:\s*0/);
  assert.match(colorStyle, /height:\s*160px/);
  assert.match(colorStyle, /width:\s*162px/);
  assert.match(colorPopupSource, /fui-colorbox-clear icon-clear/);
  assert.doesNotMatch(colorPopupSource, /fui-colorbox-controls/);
});

test('Number EditBox supports left and right spinner controls', function() {
  assert.match(numberSource, /spinner:\s*false/);
  assert.match(numberSource, /value === true[^\n]+right/);
  assert.match(numberSource, /String\(value\)\.toLowerCase\(\) === 'left'/);
  assert.match(numberSource, /self\._spin\(button === self\._increaseButton \? 1 : -1\)/);
  assert.match(numberSource, /key === 'ArrowUp' \? 1 : -1/);
  assert.match(numberSource, /this\._options\.increment/);
  assert.match(numberSource, /iconWidth:\s*28/);
  assert.match(numberStyle, /flex:\s*0 0 28px/);
  assert.match(numberStyle, /--fui-control-trigger-bg/);
  assert.match(numberStyle, /--fui-control-icon/);
  assert.equal(EditBox.locales.en.increaseValueText, 'Increase value');
  assert.equal(EditBox.locales.en.decreaseValueText, 'Decrease value');
  assert.equal(EditBox.locales.en.invalidTimeText, 'Please enter a valid time.');
});

test('Time EditBox aligns input text to the left by default', function() {
  assert.match(timeStyle, /\.fui-timebox \.fui-textbox-text\s*\{[^}]*text-align:\s*left;/s);
});
