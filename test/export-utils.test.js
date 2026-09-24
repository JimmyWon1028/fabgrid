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
  installFabGridExport,
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

test('XLSX export writes numeric footer aggregates as numbers', function() {
  var columns = [{
    binding: 'amount',
    header: '金額',
    dataType: 'number',
    aggregate: 'sum',
    precision: 1,
    width: 120
  }];
  var grid = {
    getFooterCellValue: function() { return 99359.8; },
    getFooterCellText: function() { return '99,359.8'; }
  };
  var files = createXlsxFiles(columns, [], {
    includeFooter: true,
    grid: grid
  });
  var sheetXml = files.find(function(file) { return file.name === 'xl/worksheets/sheet1.xml'; }).content;
  var stylesXml = files.find(function(file) { return file.name === 'xl/styles.xml'; }).content;

  assert.match(sheetXml, /<c r="A2" s="\d+"><v>99359\.8<\/v><\/c>/);
  assert.doesNotMatch(sheetXml, /<c r="A2"[^>]*t="inlineStr"/);
  assert.match(stylesXml, /formatCode="#,##0\.0"/);
  assert.match(stylesXml, /<color rgb="FF000000"\/>/);
  assert.match(stylesXml, /<fgColor rgb="FFEFEFEF"\/>/);
  assert.match(stylesXml, /fontId="2" fillId="3"/);
});

test('XLSX export preserves explicit footerFormatter text', function() {
  var columns = [{
    binding: 'amount',
    header: '金額',
    dataType: 'number',
    aggregate: 'sum',
    footerFormatter: function(value) { return '$' + value; },
    width: 120
  }];
  var grid = {
    getFooterCellValue: function() { return 99359.8; },
    getFooterCellText: function() { return '$99,359.8'; }
  };
  var files = createXlsxFiles(columns, [], {
    includeFooter: true,
    grid: grid
  });
  var sheetXml = files.find(function(file) { return file.name === 'xl/worksheets/sheet1.xml'; }).content;

  assert.match(sheetXml, /<c r="A2"[^>]*t="inlineStr"[^>]*>.*\$99,359\.8/);
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
  assert.equal(createExcelCell(2, 1, '1,234.5', 'number', 0), '<c r="A2"><v>1234.5</v></c>');
  assert.match(createExcelCell(2, 1, 'invalid', 'number', 0), /t="inlineStr"/);
  assert.equal(createExcelCell(3, 2, 'Y', 'boolean', 0), '<c r="B3" t="b"><v>1</v></c>');
  assert.match(createExcelCell(4, 3, '<text>', 'string', 0), /&lt;text&gt;/);
});

test('XLSX numeric columns retain the Grid thousands separator format', function() {
  function TestGrid() {}
  installFabGridExport(TestGrid, {
    getByBinding: function(item, binding) { return item[binding]; }
  });
  var files = createXlsxFiles(
    [{
      binding: 'amount',
      header: 'Amount',
      dataType: 'number',
      thousandsSeparator: true,
      precision: 2,
      width: 120
    }],
    [{ amount: '1234567.8' }],
    {}
  );
  var stylesXml = files.find(function(file) { return file.name === 'xl/styles.xml'; }).content;
  var sheetXml = files.find(function(file) { return file.name === 'xl/worksheets/sheet1.xml'; }).content;

  assert.match(stylesXml, /formatCode="#,##0\.00"/);
  assert.match(stylesXml, /applyNumberFormat="1"/);
  assert.match(sheetXml, /<c r="A2" s="\d+"><v>1234567\.8<\/v><\/c>/);
});

test('XLSX optional decimal format keeps blanks precise without adding a dot to integers', function() {
  function TestGrid() {}
  installFabGridExport(TestGrid, {
    getByBinding: function(item, binding) { return item[binding]; }
  });
  var files = createXlsxFiles(
    [{
      binding: 'amount',
      header: 'Amount',
      dataType: 'number',
      thousandsSeparator: true,
      width: 120
    }],
    [{ amount: null }, { amount: 13280020 }, { amount: 1234.5 }],
    {}
  );
  var stylesXml = files.find(function(file) { return file.name === 'xl/styles.xml'; }).content;
  var sheetXml = files.find(function(file) { return file.name === 'xl/worksheets/sheet1.xml'; }).content;
  var blankStyle = sheetXml.match(/<c r="A2" s="(\d+)" t="inlineStr">/);
  var integerStyle = sheetXml.match(/<c r="A3" s="(\d+)"><v>13280020<\/v><\/c>/);
  var decimalStyle = sheetXml.match(/<c r="A4" s="(\d+)"><v>1234\.5<\/v><\/c>/);

  assert.match(stylesXml, /formatCode="#,##0"/);
  assert.match(stylesXml, /formatCode="#,##0\.############"/);
  assert.ok(blankStyle);
  assert.ok(integerStyle);
  assert.ok(decimalStyle);
  assert.notEqual(blankStyle[1], integerStyle[1]);
  assert.equal(blankStyle[1], decimalStyle[1]);
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

test('XLSX export preserves data cell colors applied by formatItem', function() {
  function TestGrid() {}
  var originalDocument = globalThis.document;
  var originalWindow = globalThis.window;
  var columns = [{
    binding: 'amount',
    header: 'Amount',
    dataType: 'number',
    _index: 0,
    width: 120
  }];
  var root = {
    appendChild: function(node) {
      node.parentNode = this;
    },
    removeChild: function(node) {
      node.parentNode = null;
    }
  };
  var grid = {
    root: root,
    columns: columns,
    visibleColumns: columns,
    cells: {},
    events: {},
    formatItem: {
      _hasHandlers: function() { return true; }
    },
    isRowGroup: function() { return false; },
    isRowGroupFooter: function() { return false; },
    raiseFormatItem: function(args) {
      if (args.item.highlighted) {
        args.cell.style.color = 'rgb(192, 0, 0)';
        args.cell.style.backgroundColor = 'rgba(119, 179, 0, 0.1)';
      }
    }
  };

  installFabGridExport(TestGrid, {
    getByBinding: function(item, binding) { return item[binding]; }
  });
  globalThis.document = {
    createElement: function() {
      return {
        className: '',
        parentNode: null,
        style: {},
        textContent: '',
        removeAttribute: function(name) {
          if (name === 'style') this.style = {};
        },
        setAttribute: function() {}
      };
    }
  };
  globalThis.window = {
    getComputedStyle: function(cell) {
      return {
        color: cell.style.color || 'rgb(31, 41, 55)',
        backgroundColor: cell.style.backgroundColor || 'rgba(0, 0, 0, 0)',
        fontWeight: cell.style.fontWeight || '400',
        textAlign: cell.style.textAlign || '',
        justifyContent: cell.style.justifyContent || ''
      };
    }
  };

  try {
    var files = createXlsxFiles(columns, [
      { amount: 10, highlighted: true },
      { amount: 20, highlighted: false }
    ], { grid: grid });
    var sheetXml = files.find(function(file) {
      return file.name === 'xl/worksheets/sheet1.xml';
    }).content;
    var stylesXml = files.find(function(file) {
      return file.name === 'xl/styles.xml';
    }).content;
    var styledCell = sheetXml.match(/<c r="A2" s="(\d+)"><v>10<\/v><\/c>/);
    var plainCell = sheetXml.match(/<c r="A3" s="(\d+)"><v>20<\/v><\/c>/);

    assert.ok(styledCell);
    assert.ok(plainCell);
    assert.notEqual(styledCell[1], plainCell[1]);
    assert.match(stylesXml, /<color rgb="FFC00000"\/>/);
    assert.match(stylesXml, /<fgColor rgb="FFF1F7E6"\/>/);
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  }
});

test('XLSX export preserves text colors applied inside a cellTemplate', function() {
  function TestGrid() {}
  function createElement() {
    var textContent = '';
    var element = {
      nodeType: 1,
      childNodes: [],
      className: '',
      parentNode: null,
      style: {},
      appendChild: function(child) {
        child.parentNode = this;
        this.childNodes.push(child);
      },
      removeAttribute: function(name) {
        if (name === 'style') this.style = {};
      },
      setAttribute: function() {}
    };
    Object.defineProperty(element, 'textContent', {
      get: function() { return textContent; },
      set: function(value) {
        textContent = String(value == null ? '' : value);
        element.childNodes = [];
      }
    });
    return element;
  }
  var originalDocument = globalThis.document;
  var originalWindow = globalThis.window;
  var columns = [{
    binding: 'amount',
    header: 'Amount',
    dataType: 'number',
    cellTemplate: function() {},
    _index: 0,
    width: 120
  }];
  var root = {
    appendChild: function(node) { node.parentNode = this; },
    removeChild: function(node) { node.parentNode = null; }
  };
  var grid = {
    root: root,
    columns: columns,
    visibleColumns: columns,
    cells: {},
    events: {},
    isRowGroup: function() { return false; },
    isRowGroupFooter: function() { return false; },
    applyCellTemplate: function(cell, item, column, value) {
      var text = {
        nodeType: 3,
        nodeValue: String(value),
        parentElement: null,
        parentNode: null
      };
      var content = createElement();
      content.style.color = 'rgb(0, 0, 255)';
      text.parentElement = content;
      text.parentNode = content;
      content.childNodes.push(text);
      cell.appendChild(content);
      return true;
    },
    raiseFormatItem: function() {}
  };

  installFabGridExport(TestGrid, {
    getByBinding: function(item, binding) { return item[binding]; }
  });
  globalThis.document = { createElement: createElement };
  globalThis.window = {
    getComputedStyle: function(element) {
      return {
        color: element.style.color || 'rgb(31, 41, 55)',
        backgroundColor: element.style.backgroundColor || 'rgba(0, 0, 0, 0)',
        fontWeight: element.style.fontWeight || '400',
        textAlign: element.style.textAlign || '',
        justifyContent: element.style.justifyContent || ''
      };
    }
  };

  try {
    var files = createXlsxFiles(columns, [{ amount: 10 }], { grid: grid });
    var stylesXml = files.find(function(file) {
      return file.name === 'xl/styles.xml';
    }).content;

    assert.match(stylesXml, /<color rgb="FF0000FF"\/>/);
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  }
});

test('XLSX export resolves named column colors through computed styles', function() {
  function TestGrid() {}
  var originalDocument = globalThis.document;
  var originalWindow = globalThis.window;
  var columns = [{
    binding: 'amount',
    header: 'Amount',
    color: 'blue',
    _index: 0,
    width: 120
  }];
  var sampleCell = {
    childNodes: [],
    className: '',
    parentNode: null,
    style: {},
    textContent: '',
    removeAttribute: function(name) {
      if (name === 'style') this.style = {};
    },
    setAttribute: function() {}
  };
  Object.defineProperty(sampleCell, 'outerHTML', {
    get: function() {
      return sampleCell.className + '|' + JSON.stringify(sampleCell.style) + '|' + sampleCell.textContent;
    }
  });
  var root = {
    appendChild: function(node) { node.parentNode = this; },
    removeChild: function(node) { node.parentNode = null; }
  };
  var grid = {
    root: root,
    columns: columns,
    visibleColumns: columns,
    cells: {},
    events: {},
    isRowGroup: function() { return false; },
    isRowGroupFooter: function() { return false; },
    raiseFormatItem: function() {}
  };

  installFabGridExport(TestGrid, {
    getByBinding: function(item, binding) { return item[binding]; }
  });
  globalThis.document = { createElement: function() { return sampleCell; } };
  globalThis.window = {
    getComputedStyle: function(element) {
      return {
        color: element.style.color === 'blue' ? 'rgb(0, 0, 255)' : 'rgb(31, 41, 55)',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        fontWeight: '400',
        textAlign: '',
        justifyContent: ''
      };
    }
  };

  try {
    var files = createXlsxFiles(columns, [{ amount: 10 }], {
      grid: grid,
      formatCell: function() {}
    });
    var stylesXml = files.find(function(file) {
      return file.name === 'xl/styles.xml';
    }).content;

    assert.match(stylesXml, /<color rgb="FF0000FF"\/>/);
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  }
});

test('XLSX export skips computed styles when dynamic formatters leave a cell unchanged', function() {
  function TestGrid() {}
  function createElement() {
    var textContent = '';
    var element = {
      nodeType: 1,
      childNodes: [],
      className: '',
      parentNode: null,
      style: {},
      removeAttribute: function(name) {
        if (name === 'style') this.style = {};
      },
      setAttribute: function() {}
    };
    Object.defineProperty(element, 'textContent', {
      get: function() { return textContent; },
      set: function(value) {
        textContent = String(value == null ? '' : value);
        element.childNodes = [];
      }
    });
    Object.defineProperty(element, 'outerHTML', {
      get: function() {
        return element.className + '|' + JSON.stringify(element.style) + '|' + textContent;
      }
    });
    return element;
  }
  var originalDocument = globalThis.document;
  var originalWindow = globalThis.window;
  var computedStyleCalls = 0;
  var columns = [
    { binding: 'name', header: 'Name', _index: 0, width: 120 },
    { binding: 'status', header: 'Status', _index: 1, width: 120 }
  ];
  var root = {
    appendChild: function(node) { node.parentNode = this; },
    removeChild: function(node) { node.parentNode = null; }
  };
  var grid = {
    root: root,
    columns: columns,
    visibleColumns: columns,
    cells: {},
    events: {},
    formatItem: { _hasHandlers: function() { return false; } },
    isRowGroup: function() { return false; },
    isRowGroupFooter: function() { return false; },
    raiseFormatItem: function() {
      throw new Error('formatItem should not run without handlers');
    }
  };

  installFabGridExport(TestGrid, {
    getByBinding: function(item, binding) { return item[binding]; }
  });
  globalThis.document = { createElement: createElement };
  globalThis.window = {
    getComputedStyle: function(element) {
      computedStyleCalls += 1;
      return {
        color: element.style.color || 'rgb(31, 41, 55)',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        fontWeight: '400',
        textAlign: '',
        justifyContent: ''
      };
    }
  };

  try {
    createXlsxFiles(columns, [
      { name: 'A', status: 'normal' },
      { name: 'B', status: 'alert' }
    ], {
      grid: grid,
      formatCell: function(args) {
        if (args.column.binding === 'status' && args.value === 'alert') {
          args.cell.style.color = 'rgb(192, 0, 0)';
        }
      }
    });

    assert.equal(computedStyleCalls, 1);
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  }
});

test('XLSX export reads each binding once per data cell', function() {
  function TestGrid() {}
  var bindingReads = 0;
  var columns = [
    { binding: 'name', header: 'Name', width: 120 },
    { binding: 'amount', header: 'Amount', dataType: 'number', width: 120 }
  ];

  installFabGridExport(TestGrid, {
    getByBinding: function(item, binding) {
      bindingReads += 1;
      return item[binding];
    }
  });
  createXlsxFiles(columns, [
    { name: 'A', amount: 10 },
    { name: 'B', amount: 20 }
  ], {});

  assert.equal(bindingReads, 4);
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
  assert.equal(cssColorToExcelColor('rgba(119, 179, 0, 0.1)'), 'FFF1F7E6');
  assert.equal(cssColorToExcelColor('transparent'), '');
});
