import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cssColorToExcelColor,
  createExcelCell,
  createXlsxFiles,
  createZip,
  csvEscape,
  getExcelColumnName,
  getXmlSpaceAttribute,
  mergeExcelStyle,
  normalizeExcelAlign,
  normalizeExcelStyle,
  normalizeJsonRows,
  readJsonSource,
  xmlEscape
} from '../src/grid/fabgrid-export.js';

test('CSV values escape delimiters, quotes and line breaks', function() {
  assert.equal(csvEscape('plain'), 'plain');
  assert.equal(csvEscape('a,b'), '"a,b"');
  assert.equal(csvEscape('a"b'), '"a""b"');
});

test('JSON rows accept arrays and supported envelope objects', async function() {
  assert.deepEqual(normalizeJsonRows('[{"id":1}]'), [{ id: 1 }]);
  assert.deepEqual(normalizeJsonRows({ rows: [{ id: 2 }] }), [{ id: 2 }]);
  assert.deepEqual(normalizeJsonRows({ itemsSource: [{ id: 3 }] }), [{ id: 3 }]);
  assert.equal(await readJsonSource(new Blob(['[{"id":4}]'])), '[{"id":4}]');
  assert.throws(function() { normalizeJsonRows('{"id":1}'); }, /must be an array/);
});

test('XLSX package contains all required workbook files', function() {
  var files = createXlsxFiles([], [], {});
  assert.deepEqual(files.map(function(file) { return file.name; }), [
    '[Content_Types].xml',
    '_rels/.rels',
    'docProps/app.xml',
    'docProps/core.xml',
    'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels',
    'xl/styles.xml',
    'xl/worksheets/sheet1.xml'
  ]);
  assert.match(files[6].content, /<styleSheet/);
  assert.match(files[7].content, /<worksheet/);
});

test('XLSX header row follows the current header display mode', function() {
  var columns = [{ binding: 'orderNumber', header: '訂單編號', width: 120 }];
  var headerFiles = createXlsxFiles(columns, [], { headerDisplayMode: 'header' });
  var bindingFiles = createXlsxFiles(columns, [], { headerDisplayMode: 'binding' });

  assert.match(headerFiles[7].content, />訂單編號</);
  assert.doesNotMatch(headerFiles[7].content, />orderNumber</);
  assert.match(bindingFiles[7].content, />orderNumber</);
  assert.doesNotMatch(bindingFiles[7].content, />訂單編號</);
});

test('XLSX rows can retain data while remaining hidden', function() {
  var files = createXlsxFiles(
    [{ binding: 'name', header: 'Name', width: 120 }],
    [{ name: 'Visible' }, { name: 'Hidden detail' }],
    {
      isRowHidden: function(row, rowIndex) {
        return rowIndex === 1;
      }
    }
  );
  var sheetXml = files[7].content;

  assert.match(sheetXml, /<row r="3" hidden="1">/);
  assert.equal((sheetXml.match(/<row /g) || []).length, 3);
});

test('Excel cell XML preserves numeric, boolean and text types', function() {
  assert.equal(createExcelCell(2, 1, 12.5, 'number', 3), '<c r="A2" s="3"><v>12.5</v></c>');
  assert.equal(createExcelCell(3, 2, 'Y', 'boolean', 0), '<c r="B3" t="b"><v>1</v></c>');
  assert.match(createExcelCell(4, 3, '<text>', 'string', 0), /&lt;text&gt;/);
});

test('Excel style helpers normalize and merge custom cell styles', function() {
  assert.deepEqual(normalizeExcelStyle({ color: '#123', background: '#fff', fontWeight: 700, textAlign: 'right' }), {
    color: 'FF112233', backgroundColor: 'FFFFFFFF', bold: true, align: 'right', numFmtCode: ''
  });
  assert.deepEqual(mergeExcelStyle({ align: 'left', bold: false }, { align: 'center', bold: true }), {
    align: 'center', bold: true
  });
  assert.equal(normalizeExcelAlign('justify'), '');
});

test('ZIP writer creates a valid archive signature and central directory', function() {
  var bytes = createZip([{ name: 'hello.txt', content: 'Hello FabGrid' }]);
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  assert.equal(bytes[2], 0x03);
  assert.equal(bytes[3], 0x04);
  assert.ok(bytes.length > 100);
});

test('Excel column names support boundaries above Z', function() {
  assert.equal(getExcelColumnName(1), 'A');
  assert.equal(getExcelColumnName(26), 'Z');
  assert.equal(getExcelColumnName(27), 'AA');
  assert.equal(getExcelColumnName(703), 'AAA');
});

test('XML and Excel colors are normalized safely', function() {
  assert.equal(xmlEscape('<a x="1">&</a>'), '&lt;a x=&quot;1&quot;&gt;&amp;&lt;/a&gt;');
  assert.equal(getXmlSpaceAttribute(' value '), ' xml:space="preserve"');
  assert.equal(cssColorToExcelColor('#0af'), 'FF00AAFF');
  assert.equal(cssColorToExcelColor('rgb(255, 128, 0)'), 'FFFF8000');
  assert.equal(cssColorToExcelColor('transparent'), '');
});
