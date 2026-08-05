import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cssColorToExcelColor,
  createExcelCell,
  createExcelNamespace,
  createXlsxFiles,
  createXlsxWorkbookFiles,
  createZip,
  csvEscape,
  getExcelColumnName,
  getXmlSpaceAttribute,
  mergeExcelStyle,
  normalizeExcelAlign,
  normalizeExcelSheetName,
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

test('Excel sheet names are sanitized and limited to 31 characters', function() {
  assert.equal(normalizeExcelSheetName("'會計/科目:*?[]\\'"), '會計_科目______');
  assert.equal(normalizeExcelSheetName(''), 'Sheet1');
  assert.equal(normalizeExcelSheetName('123456789012345678901234567890123'), '1234567890123456789012345678901');
  assert.equal(normalizeExcelSheetName("123456789012345678901234567890'xx"), '123456789012345678901234567890');
});

test('XLSX workbook supports custom and duplicate sheet names', function() {
  var columns = [{ binding: 'name', header: '名稱', width: 120 }];
  var files = createXlsxWorkbookFiles([
    { name: '資料&明細', columns: columns, rows: [{ name: '第一筆' }], options: {} },
    { name: '資料&明細', columns: columns, rows: [{ name: '第二筆' }], options: {} }
  ]);
  var workbook = files.find(function(file) { return file.name === 'xl/workbook.xml'; }).content;
  var relationships = files.find(function(file) { return file.name === 'xl/_rels/workbook.xml.rels'; }).content;

  assert.ok(files.some(function(file) { return file.name === 'xl/worksheets/sheet2.xml'; }));
  assert.match(workbook, /name="資料&amp;明細"/);
  assert.match(workbook, /name="資料&amp;明細 \(2\)"/);
  assert.match(relationships, /Id="rId2"[^>]+Target="worksheets\/sheet2\.xml"/);
  assert.match(relationships, /Id="rId3"[^>]+Target="styles\.xml"/);
});

test('fabui Excel namespace creates a multi-sheet workbook Blob from Grids', function() {
  function createGrid(value) {
    var columns = [{ binding: 'name', header: '名稱', width: 120 }];
    return {
      columns: columns,
      visibleColumns: columns,
      frozenColumns: 0,
      options: {},
      _getExcelExportRows: function() { return [{ name: value }]; },
      _isExcelExportRowHidden: function() { return false; },
      isRowGroup: function() { return false; },
      isRowGroupFooter: function() { return false; },
      getExcelFrozenColumnCount: function() { return 0; },
      getHeaderDisplayMode: function() { return 'header'; },
      getFooterHeight: function() { return 0; }
    };
  }
  var Excel = createExcelNamespace();
  var blob = Excel.getBlob({
    sheets: [
      { name: '第一頁', grid: createGrid('A') },
      { name: '第二頁', grid: createGrid('B'), visibleOnly: true }
    ]
  });

  assert.equal(blob.type, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assert.ok(blob.size > 0);
  assert.throws(function() { Excel.getBlob({ sheets: [] }); }, /at least one sheet/);
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

test('XLSX export includes every configured footer row', function() {
  var columns = [{ binding: 'amount', header: '金額', width: 120 }];
  var grid = {
    getFooterCellText: function(row) {
      return row === 0 ? '12' : '3000';
    }
  };
  var files = createXlsxFiles(columns, [], {
    includeFooter: true,
    footerRowCount: 2,
    grid: grid
  });
  var sheetXml = files[7].content;

  assert.match(sheetXml, /<dimension ref="A1:A3"\/>/);
  assert.match(sheetXml, /<row r="2"><c r="A2"[^>]*>.*>12</);
  assert.match(sheetXml, /<row r="3"><c r="A3"[^>]*>.*>3000</);
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
