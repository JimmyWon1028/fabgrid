import { normalizeNumberValue } from './fabgrid-data.js?v=20260812-collection-view-init-v1';

var exportContext = {};
var excelColumnNameCache = [''];

function exportGetByBinding(item, binding) {
  return exportContext.getByBinding ? exportContext.getByBinding(item, binding) : undefined;
}

function exportToNumber(value, fallback) {
  return exportContext.toNumber ? exportContext.toNumber(value, fallback) : (isFinite(Number(value)) ? Number(value) : fallback);
}

function exportGetNumberPrecision(column) {
  var editor = column && column.editor && typeof column.editor === 'object' ? column.editor : null;
  var options = editor && editor.options && typeof editor.options === 'object' ? editor.options : null;
  var value;
  if (exportContext.getNumberPrecision) {
    return exportContext.getNumberPrecision(column);
  }
  value = column && column.precision != null ? column.precision :
    (editor && editor.precision != null ? editor.precision : (options ? options.precision : null));
  if (value == null || value === false || value === '') {
    return null;
  }
  value = Number(value);
  return isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

function exportShouldUseThousandsSeparator(column) {
  var editor = column && column.editor && typeof column.editor === 'object' ? column.editor : null;
  var options = editor && editor.options && typeof editor.options === 'object' ? editor.options : null;
  var sources;
  var names = ['thousandsSeparator', 'useThousandsSeparator', 'showThousandsSeparator'];
  var i;
  var n;
  if (exportContext.shouldUseThousandsSeparator) {
    return exportContext.shouldUseThousandsSeparator(column);
  }
  sources = [column, editor, options];
  for (i = 0; i < sources.length; i += 1) {
    if (!sources[i]) continue;
    for (n = 0; n < names.length; n += 1) {
      if (sources[i][names[n]] != null) {
        return sources[i][names[n]] === true;
      }
    }
  }
  return false;
}

function exportParseValue(value, type) {
  if (exportContext.parseValue) return exportContext.parseValue(value, type);
  if (type === 'boolean') return value === true || value === 'true' || value === '1' || value === 'yes' || value === 'Y';
  return value;
}

export function csvEscape(value) {
  var text = value == null ? '' : String(value);
  if (text.indexOf('"') >= 0 || text.indexOf(',') >= 0 || text.indexOf('\n') >= 0) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

export function normalizeJsonRows(value) {
  var parsed = value;
  if (typeof parsed === 'string') {
    parsed = JSON.parse(parsed);
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && Array.isArray(parsed.rows)) {
    return parsed.rows;
  }
  if (parsed && Array.isArray(parsed.itemsSource)) {
    return parsed.itemsSource;
  }
  throw new TypeError('FabGrid JSON data must be an array or an object containing a rows or itemsSource array.');
}

export function readJsonSource(source) {
  if (typeof Blob !== 'undefined' && source instanceof Blob) {
    if (typeof source.text === 'function') {
      return source.text();
    }
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function() { resolve(reader.result); };
      reader.onerror = function() { reject(reader.error || new Error('Unable to read the JSON file.')); };
      reader.readAsText(source);
    });
  }
  return Promise.resolve(source);
}

export function getExcelColumnName(index) {
  if (excelColumnNameCache[index]) {
    return excelColumnNameCache[index];
  }
  var name = '';
  var number = index;
  while (number > 0) {
    number -= 1;
    name = String.fromCharCode(65 + (number % 26)) + name;
    number = Math.floor(number / 26);
  }
  excelColumnNameCache[index] = name;
  return name;
}

export function getXmlSpaceAttribute(value) {
  var text = String(value);
  return /^\s|\s$|\s\s/.test(text) ? ' xml:space="preserve"' : '';
}

export function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function normalizeExcelSheetName(value) {
  var name = value == null ? '' : String(value).trim();
  name = name.replace(/[\\\/?*\[\]:]/g, '_').replace(/^'+|'+$/g, '');
  name = name.slice(0, 31).replace(/^'+|'+$/g, '');
  return name || 'Sheet1';
}

function normalizeExcelExportOptions(value) {
  if (typeof value === 'boolean') {
    return { visibleOnly: value };
  }
  return value && typeof value === 'object' ? value : {};
}

export function cssColorToExcelColor(value) {
  var match;
  var alpha;
  var blue;
  var green;
  var hex;
  var red;
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return '';
  if (value.charAt(0) === '#') {
    hex = value.length === 4 ?
      value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2) + value.charAt(3) + value.charAt(3) :
      value.slice(1, 7);
    return 'FF' + hex.toUpperCase();
  }
  match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
  if (!match || match[4] === '0') return '';
  alpha = match[4] == null ? 1 : Math.max(0, Math.min(1, Number(match[4])));
  red = Number(match[1]) * alpha + 255 * (1 - alpha);
  green = Number(match[2]) * alpha + 255 * (1 - alpha);
  blue = Number(match[3]) * alpha + 255 * (1 - alpha);
  return 'FF' + toHexByte(red) + toHexByte(green) + toHexByte(blue);
}

export function normalizeExcelStyle(style) {
  return {
    color: cssColorToExcelColor(style.color || style.textColor || ''),
    backgroundColor: cssColorToExcelColor(style.backgroundColor || style.background || ''),
    bold: style.bold === true || style.fontWeight === 'bold' || Number(style.fontWeight) >= 600,
    align: normalizeExcelAlign(style.align || style.textAlign || ''),
    numFmtCode: style.numFmtCode || style.numberFormat || ''
  };
}

export function mergeExcelStyle(base, override) {
  var result = {};
  var key;
  for (key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) result[key] = base[key];
  }
  for (key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key) && override[key]) result[key] = override[key];
  }
  return result;
}

export function normalizeExcelAlign(value) {
  return value === 'right' || value === 'center' || value === 'left' ? value : '';
}

export function createExcelCell(row, col, value, type, styleId) {
  var ref = getExcelColumnName(col) + row;
  var style = styleId ? ' s="' + styleId + '"' : '';
  var number;
  if (value == null) return '<c r="' + ref + '"' + style + ' t="inlineStr"><is><t></t></is></c>';
  if (type === 'number' && typeof value !== 'boolean') {
    number = normalizeNumberValue(value);
    if (number != null) {
      return '<c r="' + ref + '"' + style + '><v>' + number + '</v></c>';
    }
  }
  if (type === 'boolean') {
    return '<c r="' + ref + '"' + style + ' t="b"><v>' + (exportParseValue(value, 'boolean') ? '1' : '0') + '</v></c>';
  }
  return '<c r="' + ref + '"' + style + ' t="inlineStr"><is><t' + getXmlSpaceAttribute(value) + '>' + xmlEscape(value) + '</t></is></c>';
}

function toHexByte(value) {
  var hex = Math.round(Math.max(0, Math.min(255, Number(value)))).toString(16).toUpperCase();
  return hex.length === 1 ? '0' + hex : hex;
}

function createGridExcelSheet(grid, options) {
  var visibleOnly;
  if (!grid || !Array.isArray(grid.columns) || typeof grid._getExcelExportRows !== 'function') {
    throw new TypeError('FabUI Excel sheet requires a FabGrid instance.');
  }
  options = normalizeExcelExportOptions(options);
  visibleOnly = options.visibleOnly === true;
  return {
    name: options.name || options.sheetName || 'Sheet1',
    columns: visibleOnly ? grid.visibleColumns : grid.columns,
    rows: grid._getExcelExportRows(),
    options: {
      frozenColumns: visibleOnly ? grid.frozenColumns : grid.getExcelFrozenColumnCount(),
      headerDisplayMode: grid.getHeaderDisplayMode(),
      grid: grid,
      formatCell: grid.options.formatCell,
      itemFormatter: grid.options.itemFormatter,
      excelCellStyle: grid.options.excelCellStyle,
      includeFooter: grid.getFooterHeight() > 0,
      footerRowCount: typeof grid.getFooterRowCount === 'function' ? grid.getFooterRowCount() : 1,
      isRowHidden: function(row, rowIndex) {
        return grid._isExcelExportRowHidden(row, rowIndex);
      }
    }
  };
}

function createExcelWorkbookBlob(sheets) {
  return new Blob([createZip(createXlsxWorkbookFiles(sheets))], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

export function createExcelNamespace() {
  return {
    getBlob: function(options) {
      var sheetOptions = options && Array.isArray(options.sheets) ? options.sheets : [];
      if (!sheetOptions.length) {
        throw new TypeError('fabui.Excel requires at least one sheet.');
      }
      return createExcelWorkbookBlob(sheetOptions.map(function(sheet) {
        sheet = sheet || {};
        return createGridExcelSheet(sheet.grid, sheet);
      }));
    },
    export: function(filename, options) {
      var excel = this;
      var outputName = filename || 'fabgrid.xlsx';
      return new Promise(function(resolve, reject) {
        var run = function() {
          try {
            downloadBlob(excel.getBlob(options), outputName);
            resolve(true);
          } catch (error) {
            reject(error);
          }
        };
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(function() { setTimeout(run, 0); });
        } else {
          setTimeout(run, 0);
        }
      });
    }
  };
}

export function installFabGridExport(FabGrid, context) {
  exportContext = context || {};
  var getByBinding = context.getByBinding;

  FabGrid.prototype._getExcelExportRows = function() {
    return this.view || this.dataView;
  };

  FabGrid.prototype._isExcelExportRowHidden = function() {
    return false;
  };

  FabGrid.prototype.getCsv = function(visibleOnly) {
    var columns = visibleOnly === false ? this.columns : this.visibleColumns;
    var lines = [];
    var i;
    var r;
    var row;
    var values;
    lines.push(columns.map(function(col) {
      return csvEscape(col.header || col.binding);
    }).join(','));
    for (r = 0; r < this.view.length; r += 1) {
      row = this.view[r];
      if (this.isRowGroup(row) || this.isRowGroupFooter(row)) continue;
      values = [];
      for (i = 0; i < columns.length; i += 1) {
        values.push(csvEscape(getByBinding(row, columns[i].binding)));
      }
      lines.push(values.join(','));
    }
    return lines.join('\n');
  };

  FabGrid.prototype.exportCsv = function(filename, visibleOnly) {
    var csv = this.getCsv(visibleOnly);
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename || 'fabgrid.csv');
  };

  FabGrid.prototype.getJson = function(options) {
    var rows;
    options = options || {};
    rows = options.viewOnly === true ? this.view.filter(function(row) {
      return !this.isRowGroup(row) && !this.isRowGroupFooter(row);
    }, this) : this.source;
    return JSON.stringify(rows || [], options.replacer == null ? null : options.replacer, options.space == null ? 0 : options.space);
  };

  FabGrid.prototype.exportJson = function(filename, options) {
    var json = this.getJson(options);
    var blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    downloadBlob(blob, filename || 'fabgrid.json');
  };

  FabGrid.prototype.importJson = function(source) {
    var grid = this;
    return readJsonSource(source).then(function(value) {
      var rows = normalizeJsonRows(value);
      grid.setItemsSource(rows);
      return true;
    });
  };

  FabGrid.prototype.getExcelBlob = function(options) {
    return createExcelWorkbookBlob([
      createGridExcelSheet(this, normalizeExcelExportOptions(options))
    ]);
  };


  FabGrid.prototype.getExcelFrozenColumnCount = function() {
    var lastFrozenColumn;
    var sourceIndex;
    if (!this.frozenColumns) return 0;
    lastFrozenColumn = this.visibleColumns[this.frozenColumns - 1];
    sourceIndex = this.columns.indexOf(lastFrozenColumn);
    return sourceIndex < 0 ? 0 : sourceIndex + 1;
  };

  FabGrid.prototype.exportExcel = function(filename, options) {
    var self = this;
    var outputName = filename || 'fabgrid.xlsx';
    var exportOptions = normalizeExcelExportOptions(options);
    var sheetName = normalizeExcelSheetName(exportOptions.sheetName);
    if (this.busy) return Promise.resolve(false);
    if (this.emit('excelExporting', { filename: outputName, sheetName: sheetName }) === false) {
      return Promise.resolve(false);
    }
    this.setBusy(true, this.options.exportBusyText || this.getText('exportBusyText'));
    return new Promise(function(resolve, reject) {
      requestAnimationFrame(function() {
        setTimeout(function() {
          var blob;
          try {
            blob = self.getExcelBlob(exportOptions);
            downloadBlob(blob, outputName);
            self.emit('excelExported', { filename: outputName, sheetName: sheetName, blob: blob });
            resolve(true);
          } catch (error) {
            self.emit('excelExportFailed', { filename: outputName, sheetName: sheetName, error: error });
            reject(error);
          } finally {
            self.setBusy(false);
          }
        }, 0);
      });
    });
  };
}

function downloadBlob(blob, filename) {
  var link = document.createElement('a');
  var url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function normalizeWorkbookSheets(sheets) {
  var usedNames = {};
  if (!Array.isArray(sheets) || !sheets.length) {
    throw new TypeError('Excel workbook requires at least one sheet.');
  }
  return sheets.map(function(sheet, index) {
    var baseName = normalizeExcelSheetName(sheet && (sheet.name || sheet.sheetName));
    var name = baseName;
    var suffix;
    var duplicate = 1;
    while (usedNames[name.toLowerCase()]) {
      duplicate += 1;
      suffix = ' (' + duplicate + ')';
      name = baseName.slice(0, 31 - suffix.length) + suffix;
    }
    usedNames[name.toLowerCase()] = true;
    return {
      name: name || 'Sheet' + (index + 1),
      columns: sheet && Array.isArray(sheet.columns) ? sheet.columns : [],
      rows: sheet && Array.isArray(sheet.rows) ? sheet.rows : [],
      options: sheet && sheet.options ? sheet.options : {}
    };
  });
}

export function createXlsxWorkbookFiles(sheets) {
  var now = new Date().toISOString();
  var registry = createExcelStyleRegistry();
  var normalizedSheets = normalizeWorkbookSheets(sheets);
  var worksheets = normalizedSheets.map(function(sheet) {
    return createWorksheetXml(sheet.columns, sheet.rows, sheet.options, registry);
  });
  var worksheetOverrides = '';
  var workbookSheets = '';
  var worksheetRelationships = '';
  var files;
  var i;
  for (i = 0; i < normalizedSheets.length; i += 1) {
    worksheetOverrides +=
      '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
    workbookSheets +=
      '<sheet name="' + xmlEscape(normalizedSheets[i].name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
    worksheetRelationships +=
      '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
  }
  files = [
    {
      name: '[Content_Types].xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        worksheetOverrides +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>'
    },
    {
      name: '_rels/.rels',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
        '</Relationships>'
    },
    {
      name: 'docProps/app.xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
        '<Application>FabGrid</Application>' +
        '</Properties>'
    },
    {
      name: 'docProps/core.xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        '<dc:creator>FabGrid</dc:creator>' +
        '<cp:lastModifiedBy>FabGrid</cp:lastModifiedBy>' +
        '<dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created>' +
        '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified>' +
        '</cp:coreProperties>'
    },
    {
      name: 'xl/workbook.xml',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets>' + workbookSheets + '</sheets>' +
        '</workbook>'
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        worksheetRelationships +
        '<Relationship Id="rId' + (normalizedSheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>'
    },
    {
      name: 'xl/styles.xml',
      content: createExcelStylesXml(registry)
    }
  ];
  for (i = 0; i < normalizedSheets.length; i += 1) {
    files.push({
      name: 'xl/worksheets/sheet' + (i + 1) + '.xml',
      content: worksheets[i]
    });
  }
  return files;
}

export function createXlsxFiles(columns, rows, options) {
  options = options || {};
  return createXlsxWorkbookFiles([{
    name: options.sheetName,
    columns: columns,
    rows: rows,
    options: options
  }]);
}

export function createExcelStyleRegistry() {
  var registry = {
    fonts: [
      { bold: false, color: null },
      { bold: true, color: 'FF1F2937' }
    ],
    fills: [
      null,
      { gray125: true },
      { color: 'FFF5F7FA' }
    ],
    xfs: [
      { fontId: 0, fillId: 0, borderId: 0, align: '', numFmtId: 0 },
      { fontId: 1, fillId: 2, borderId: 1, align: 'center', numFmtId: 0 },
      { fontId: 0, fillId: 0, borderId: 1, align: '', numFmtId: 0 },
      { fontId: 0, fillId: 0, borderId: 1, align: 'right', numFmtId: 0 },
      { fontId: 0, fillId: 0, borderId: 1, align: 'center', numFmtId: 0 }
    ],
    numFmts: [],
    fontMap: { 'normal|': 0, 'bold|FF1F2937': 1 },
    fillMap: { none: 0, gray125: 1, FFF5F7FA: 2 },
    numFmtMap: {},
    nextNumFmtId: 164,
    xfMap: {
      '0|0|0|0|': 0,
      '1|2|1|center|0': 1,
      '0|0|1||0': 2,
      '0|0|1|right|0': 3,
      '0|0|1|center|0': 4
    }
  };
  return registry;
}

export function createExcelStylesXml(registry) {
  var xml = [];
  var i;
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
  if (registry.numFmts.length) {
    xml.push('<numFmts count="' + registry.numFmts.length + '">');
    for (i = 0; i < registry.numFmts.length; i += 1) {
      xml.push('<numFmt numFmtId="' + registry.numFmts[i].id + '" formatCode="' + xmlEscape(registry.numFmts[i].code) + '"/>');
    }
    xml.push('</numFmts>');
  }
  xml.push('<fonts count="' + registry.fonts.length + '">');
  for (i = 0; i < registry.fonts.length; i += 1) {
    xml.push(createExcelFontXml(registry.fonts[i]));
  }
  xml.push('</fonts>');
  xml.push('<fills count="' + registry.fills.length + '">');
  for (i = 0; i < registry.fills.length; i += 1) {
    xml.push(createExcelFillXml(registry.fills[i]));
  }
  xml.push('</fills>');
  xml.push('<borders count="2">');
  xml.push('<border><left/><right/><top/><bottom/><diagonal/></border>');
  xml.push('<border>');
  xml.push('<left style="thin"><color rgb="FFD7DEE8"/></left>');
  xml.push('<right style="thin"><color rgb="FFD7DEE8"/></right>');
  xml.push('<top style="thin"><color rgb="FFD7DEE8"/></top>');
  xml.push('<bottom style="thin"><color rgb="FFD7DEE8"/></bottom>');
  xml.push('<diagonal/>');
  xml.push('</border>');
  xml.push('</borders>');
  xml.push('<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>');
  xml.push('<cellXfs count="' + registry.xfs.length + '">');
  for (i = 0; i < registry.xfs.length; i += 1) {
    xml.push(createExcelXfXml(registry.xfs[i]));
  }
  xml.push('</cellXfs>');
  xml.push('<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>');
  xml.push('</styleSheet>');
  return xml.join('');
}

function createExcelFontXml(font) {
  var xml = ['<font>'];
  if (font.bold) {
    xml.push('<b/>');
  }
  xml.push('<sz val="11"/>');
  if (font.color) {
    xml.push('<color rgb="' + font.color + '"/>');
  }
  xml.push('<name val="Arial"/>');
  xml.push('</font>');
  return xml.join('');
}

function createExcelFillXml(fill) {
  if (!fill) {
    return '<fill><patternFill patternType="none"/></fill>';
  }
  if (fill.gray125) {
    return '<fill><patternFill patternType="gray125"/></fill>';
  }
  return '<fill><patternFill patternType="solid"><fgColor rgb="' + fill.color + '"/><bgColor indexed="64"/></patternFill></fill>';
}

function createExcelXfXml(xf) {
  var numFmtId = xf.numFmtId || 0;
  var xml = '<xf numFmtId="' + numFmtId + '" fontId="' + xf.fontId + '" fillId="' + xf.fillId + '" borderId="' + xf.borderId + '" xfId="0"';
  if (numFmtId) {
    xml += ' applyNumberFormat="1"';
  }
  if (xf.fontId) {
    xml += ' applyFont="1"';
  }
  if (xf.fillId) {
    xml += ' applyFill="1"';
  }
  if (xf.borderId) {
    xml += ' applyBorder="1"';
  }
  if (xf.align) {
    xml += ' applyAlignment="1"><alignment horizontal="' + xf.align + '" vertical="center"/></xf>';
    return xml;
  }
  if (xf.borderId) {
    xml += ' applyAlignment="1"><alignment vertical="center"/></xf>';
    return xml;
  }
  return xml + '/>';
}

function registerExcelCellStyle(registry, style) {
  var fontId = registerExcelFont(registry, style);
  var fillId = registerExcelFill(registry, style);
  var numFmtId = registerExcelNumberFormat(registry, style.numFmtCode || style.numberFormat || '');
  var borderId = 1;
  var align = style.align || '';
  var key = fontId + '|' + fillId + '|' + borderId + '|' + align + '|' + numFmtId;
  if (registry.xfMap[key] != null) {
    return registry.xfMap[key];
  }
  registry.xfs.push({
    fontId: fontId,
    fillId: fillId,
    borderId: borderId,
    align: align,
    numFmtId: numFmtId
  });
  registry.xfMap[key] = registry.xfs.length - 1;
  return registry.xfs.length - 1;
}

function registerExcelFont(registry, style) {
  var color = style.color || null;
  var bold = style.bold === true;
  var key = (bold ? 'bold' : 'normal') + '|' + (color || '');
  if (registry.fontMap[key] != null) {
    return registry.fontMap[key];
  }
  registry.fonts.push({ bold: bold, color: color });
  registry.fontMap[key] = registry.fonts.length - 1;
  return registry.fonts.length - 1;
}

function registerExcelFill(registry, style) {
  var color = style.backgroundColor || null;
  if (!color) {
    return 0;
  }
  if (registry.fillMap[color] != null) {
    return registry.fillMap[color];
  }
  registry.fills.push({ color: color });
  registry.fillMap[color] = registry.fills.length - 1;
  return registry.fills.length - 1;
}

function registerExcelNumberFormat(registry, code) {
  code = code || '';
  if (!code) {
    return 0;
  }
  if (registry.numFmtMap[code] != null) {
    return registry.numFmtMap[code];
  }
  registry.numFmts.push({
    id: registry.nextNumFmtId,
    code: code
  });
  registry.numFmtMap[code] = registry.nextNumFmtId;
  registry.nextNumFmtId += 1;
  return registry.numFmtMap[code];
}

export function createWorksheetXml(columns, rows, options, registry) {
  var includeFooter = options.includeFooter === true && options.grid;
  var footerRowCount = includeFooter ? Math.max(1, exportToNumber(options.footerRowCount, 1)) : 0;
  var dataMaxRow = rows.length + 1;
  var maxRow = dataMaxRow + footerRowCount;
  var maxCol = Math.max(columns.length, 1);
  var xml = [];
  var r;
  var c;
  var footerRow;
  var row;
  var rowXml;
  var value;
  var baseStyleStates = columns.map(function(column) {
    return createExcelBaseCellStyleState(column, registry);
  });
  var styleResolver = createExcelStyleResolver(options, columns);
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
  xml.push('<dimension ref="A1:' + getExcelColumnName(maxCol) + maxRow + '"/>');
  xml.push(createSheetViewsXml(Math.min(exportToNumber(options.frozenColumns, 0), columns.length)));
  xml.push(createColumnWidthXml(columns));
  xml.push('<sheetData>');
  xml.push('<row r="1" ht="22" customHeight="1">');
  for (c = 0; c < columns.length; c += 1) {
    xml.push(createExcelCell(
      1,
      c + 1,
      options.headerDisplayMode === 'binding' ? columns[c].binding : (columns[c].header || columns[c].binding),
      'string',
      1
    ));
  }
  xml.push('</row>');
  for (r = 0; r < rows.length; r += 1) {
    row = rows[r];
    if (options.grid && options.grid.isRowGroup(row)) {
      xml.push(createExcelGroupRowXml(r + 2, row, columns, options.grid, registry));
      continue;
    }
    if (options.grid && options.grid.isRowGroupFooter(row)) {
      continue;
    }
    rowXml = ['<row r="' + (r + 2) + '"' +
      (typeof options.isRowHidden === 'function' && options.isRowHidden(row, r) ? ' hidden="1"' : '') + '>'];
    for (c = 0; c < columns.length; c += 1) {
      value = exportGetByBinding(row, columns[c].binding);
      rowXml.push(createExcelCell(
        r + 2,
        c + 1,
        value,
        columns[c].dataType,
        getExcelCellStyle(
          columns[c],
          row,
          value,
          r,
          c,
          registry,
          styleResolver,
          baseStyleStates[c]
        )
      ));
    }
    rowXml.push('</row>');
    xml.push(rowXml.join(''));
  }
  if (includeFooter) {
    for (footerRow = 0; footerRow < footerRowCount; footerRow += 1) {
      xml.push(createExcelFooterRowXml(rows.length + 2 + footerRow, columns, options.grid, footerRow, registry));
    }
  }
  if (styleResolver.dispose) {
    styleResolver.dispose();
  }
  xml.push('</sheetData>');
  xml.push('<autoFilter ref="A1:' + getExcelColumnName(maxCol) + dataMaxRow + '"/>');
  xml.push('</worksheet>');
  return xml.join('');
}

function createExcelGroupRowXml(rowIndex, group, columns, grid, registry) {
  var xml = [];
  var labelColumnIndex = 0;
  var level = Math.max(0, Math.min(7, exportToNumber(group.level, 0)));
  var value;
  var isLabel;
  var c;
  for (c = 0; c < columns.length; c += 1) {
    if (columns[c].visible !== false) {
      labelColumnIndex = c;
      break;
    }
  }
  xml.push('<row r="' + rowIndex + '" outlineLevel="' + level + '">');
  for (c = 0; c < columns.length; c += 1) {
    isLabel = c === labelColumnIndex;
    value = isLabel ? repeatString('  ', level) + group.label :
      (columns[c].aggregate ?
        grid.formatAggregateValue(grid.getRowGroupAggregateValue(group, columns[c]), columns[c], group.items) :
        '');
    xml.push(createExcelCell(
      rowIndex,
      c + 1,
      value,
      isLabel || columns[c].aggregate ? 'string' : columns[c].dataType,
      getExcelGroupCellStyle(columns[c], isLabel, registry)
    ));
  }
  xml.push('</row>');
  return xml.join('');
}

function createExcelFooterRowXml(rowIndex, columns, grid, footerRowIndex, registry) {
  var xml = [];
  var c;
  var rawValue;
  var type;
  var value;
  xml.push('<row r="' + rowIndex + '">');
  for (c = 0; c < columns.length; c += 1) {
    value = grid.getFooterCellText(footerRowIndex, columns[c]);
    rawValue = typeof grid.getFooterCellValue === 'function' ?
      grid.getFooterCellValue(footerRowIndex, columns[c]) : value;
    type = 'string';
    if (typeof columns[c].footerFormatter !== 'function' &&
        (typeof rawValue === 'number' || columns[c].dataType === 'number' || columns[c].aggregate) &&
        normalizeNumberValue(rawValue) != null) {
      value = normalizeNumberValue(rawValue);
      type = 'number';
    }
    xml.push(createExcelCell(
      rowIndex,
      c + 1,
      value,
      type,
      getExcelFooterCellStyle(columns[c], value, type, registry)
    ));
  }
  xml.push('</row>');
  return xml.join('');
}

function createSheetViewsXml(frozenColumns) {
  var topLeftCell = getExcelColumnName(frozenColumns + 1) + '2';
  var activePane = frozenColumns > 0 ? 'bottomRight' : 'bottomLeft';
  var pane = '<pane ySplit="1"';
  if (frozenColumns > 0) {
    pane += ' xSplit="' + frozenColumns + '"';
  }
  pane += ' topLeftCell="' + topLeftCell + '" activePane="' + activePane + '" state="frozen"/>';
  return '<sheetViews><sheetView workbookViewId="0">' + pane + '</sheetView></sheetViews>';
}

function createColumnWidthXml(columns) {
  var xml = [];
  var width;
  var i;
  if (!columns.length) {
    return '';
  }
  xml.push('<cols>');
  for (i = 0; i < columns.length; i += 1) {
    width = Math.max(8, Math.min(80, Math.round(exportToNumber(columns[i]._width || columns[i].width, 120) / 7)));
    xml.push('<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + width + '" customWidth="1"' +
      (columns[i].visible === false ? ' hidden="1"' : '') + '/>');
  }
  xml.push('</cols>');
  return xml.join('');
}

function getExcelCellStyle(column, item, value, rowIndex, colIndex, registry, styleResolver, baseStyleState) {
  var baseStyle = getExcelBaseCellStyleFromState(baseStyleState, value);
  var extraStyle = styleResolver(item, column, value, rowIndex, colIndex);
  var combinedStyle;
  if (extraStyle) {
    combinedStyle = mergeExcelStyle({
      align: baseStyle.align || '',
      numFmtCode: baseStyle.numFmtCode || ''
    }, extraStyle);
    return registerExcelCellStyle(registry, combinedStyle);
  }
  if (baseStyle.id) {
    return baseStyle.id;
  }
  return 2;
}

function createExcelBaseCellStyleState(column, registry) {
  var integerStyle = getExcelBaseCellStyle(column);
  var decimalStyle;
  if (integerStyle.numFmtCode) {
    integerStyle.id = registerExcelCellStyle(registry, integerStyle);
  }
  if (column && column.dataType === 'number' &&
      exportGetNumberPrecision(column) == null &&
      exportShouldUseThousandsSeparator(column)) {
    decimalStyle = {
      align: 'right',
      numFmtCode: '#,##0.############'
    };
    decimalStyle.id = registerExcelCellStyle(registry, decimalStyle);
  }
  return {
    integer: integerStyle,
    decimal: decimalStyle
  };
}

function getExcelBaseCellStyleFromState(state, value) {
  var number;
  if (state.decimal) {
    number = normalizeNumberValue(value);
    if (number == null || number % 1 !== 0) {
      return state.decimal;
    }
  }
  return state.integer;
}

function getExcelGroupCellStyle(column, isLabel, registry) {
  var baseStyle = getExcelBaseCellStyle(column);
  var style = {
    bold: isLabel,
    backgroundColor: 'FFE1E1E1',
    align: isLabel ? '' : baseStyle.align,
    numFmtCode: baseStyle.numFmtCode || ''
  };
  if (column.color) {
    style.color = cssColorToExcelColor(column.color);
  }
  return registerExcelCellStyle(registry, style);
}

function getExcelBaseCellStyle(column, value) {
  var numberFormat;
  if (column.align === 'right' || column.dataType === 'number') {
    numberFormat = getExcelNumberFormatCode(column, value);
    if (numberFormat) {
      return { align: 'right', numFmtCode: numberFormat };
    }
    return { id: 3, align: 'right' };
  }
  if (column.align === 'center' || column.dataType === 'boolean') {
    return { id: 4, align: 'center' };
  }
  return { id: 2, align: '' };
}

function getExcelFooterCellStyle(column, value, type, registry) {
  var numberColumn;
  var numberFormat;
  var style = {
    backgroundColor: 'FFEFEFEF',
    color: 'FF000000',
    align: ''
  };
  if (type === 'number') {
    numberColumn = Object.create(column || null);
    numberColumn.dataType = 'number';
    numberColumn.thousandsSeparator = true;
    numberFormat = getExcelNumberFormatCode(numberColumn, value);
    style.align = 'right';
    style.numFmtCode = numberFormat;
    return registerExcelCellStyle(registry, style);
  }
  if (column.align === 'right' || column.dataType === 'number') {
    style.align = 'right';
  } else if (column.align === 'center' || column.dataType === 'boolean') {
    style.align = 'center';
  }
  return registerExcelCellStyle(registry, style);
}

function getExcelNumberFormatCode(column, value) {
  var number;
  var precision;
  var decimalPart = '';
  var integerPart;
  var useThousandsSeparator;
  if (!column || column.dataType !== 'number') {
    return '';
  }
  precision = exportGetNumberPrecision(column);
  useThousandsSeparator = exportShouldUseThousandsSeparator(column);
  integerPart = useThousandsSeparator ? '#,##0' : '0';
  if (precision != null) {
    decimalPart = precision > 0 ? '.' + repeatString('0', precision) : '';
  } else if (useThousandsSeparator) {
    number = normalizeNumberValue(value);
    decimalPart = number != null && number % 1 !== 0 ? '.############' : '';
  } else {
    return '';
  }
  return integerPart + decimalPart;
}

function repeatString(text, count) {
  var output = '';
  while (count > 0) {
    output += text;
    count -= 1;
  }
  return output;
}

function createExcelStyleResolver(options, columns) {
  var sampleCell = null;
  var formatCell = options.formatCell;
  var itemFormatter = options.itemFormatter;
  var customStyle = options.excelCellStyle;
  var grid = options.grid;
  var hasFormatItem = hasExcelFormatItemHandlers(grid);
  var dynamicComputedStyle = typeof formatCell === 'function' ||
    typeof itemFormatter === 'function' || hasFormatItem;
  var computedStyleColumns = columns.map(function(column) {
    return dynamicComputedStyle || !!(column && (
      column.cssClass ||
      column.cellTemplate != null ||
      (column.color && !cssColorToExcelColor(column.color))
    ));
  });
  var sourceColumnIndexes = columns.map(function(column, index) {
    return column && column._index != null ? column._index :
      (grid && Array.isArray(grid.columns) ? grid.columns.indexOf(column) : index);
  });
  var viewColumnIndexes = columns.map(function(column, index) {
    return grid && Array.isArray(grid.visibleColumns) ? grid.visibleColumns.indexOf(column) : index;
  });
  var resolver;
  if (grid && grid.root && typeof document !== 'undefined' &&
      computedStyleColumns.some(function(value) { return value; })) {
    sampleCell = document.createElement('div');
    sampleCell.style.position = 'absolute';
    sampleCell.style.visibility = 'hidden';
    sampleCell.style.pointerEvents = 'none';
    sampleCell.style.top = '-10000px';
    sampleCell.style.left = '-10000px';
    grid.root.appendChild(sampleCell);
  }
  resolver = function(item, column, value, rowIndex, colIndex) {
    var displayText;
    var style = null;
    var fromCell;
    var initialMarkup = null;
    var override;
    var requiresComputedStyle;
    var templateApplied = false;
    var sourceColIndex = sourceColumnIndexes[colIndex];
    var viewColIndex = viewColumnIndexes[colIndex];
    var args;
    if (sampleCell && computedStyleColumns[colIndex]) {
      sampleCell.removeAttribute('style');
      sampleCell.style.position = 'absolute';
      sampleCell.style.visibility = 'hidden';
      sampleCell.style.pointerEvents = 'none';
      sampleCell.style.top = '-10000px';
      sampleCell.style.left = '-10000px';
      sampleCell.className = 'fg-cell' + (column.align ? ' fg-align-' + column.align : '');
      if (column.cssClass) {
        sampleCell.className += ' ' + String(column.cssClass).trim();
      }
      if (grid && typeof grid.isAlternatingRow === 'function' && grid.isAlternatingRow(rowIndex)) {
        sampleCell.className += ' fg-row-even fg-row-alt';
      }
      if (column.color) {
        sampleCell.style.color = column.color;
      }
      sampleCell.removeAttribute('data-row');
      sampleCell.removeAttribute('data-col');
      sampleCell.setAttribute('data-row', rowIndex);
      sampleCell.setAttribute('data-col', viewColIndex);
      displayText = grid && typeof grid.getCellDisplayText === 'function' ?
        grid.getCellDisplayText(item, column, value) : (value == null ? '' : String(value));
      sampleCell.textContent = '';
      if (grid && typeof grid.applyCellTemplate === 'function' && column.cellTemplate != null) {
        templateApplied = grid.applyCellTemplate(
          sampleCell,
          item,
          column,
          value,
          displayText,
          rowIndex
        );
      }
      if (!templateApplied) {
        sampleCell.textContent = displayText;
      }
      requiresComputedStyle = !!(
        column.cssClass ||
        templateApplied ||
        (column.color && !cssColorToExcelColor(column.color))
      );
      if (dynamicComputedStyle && !requiresComputedStyle && typeof sampleCell.outerHTML === 'string') {
        initialMarkup = sampleCell.outerHTML;
      }
      args = createExcelFormatItemArgs(
        grid,
        sampleCell,
        item,
        column,
        value,
        rowIndex,
        sourceColIndex,
        viewColIndex
      );
      if (typeof formatCell === 'function') {
        formatCell(args);
      }
      if (typeof itemFormatter === 'function' && viewColIndex >= 0) {
        itemFormatter(grid.cells, rowIndex, viewColIndex, sampleCell);
      }
      if (hasFormatItem && viewColIndex >= 0 && grid && typeof grid.raiseFormatItem === 'function') {
        grid.raiseFormatItem(args);
      }
      if (requiresComputedStyle || initialMarkup == null || sampleCell.outerHTML !== initialMarkup) {
        fromCell = getExcelStyleFromComputedCell(sampleCell);
        if (fromCell) {
          style = fromCell;
        }
      } else if (column.color) {
        style = { color: cssColorToExcelColor(column.color) };
      }
    } else if (column && column.color) {
      style = { color: cssColorToExcelColor(column.color) };
    }
    if (typeof customStyle === 'function') {
      override = customStyle({
        grid: grid,
        item: item,
        column: column,
        value: value,
        rowIndex: rowIndex,
        colIndex: sourceColIndex,
        viewCol: viewColIndex,
        style: style || {}
      });
      if (override) {
        style = mergeExcelStyle(style || {}, normalizeExcelStyle(override));
      }
    }
    return style;
  };
  if (sampleCell) {
    resolver.dispose = function() {
      if (sampleCell && sampleCell.parentNode) {
        sampleCell.parentNode.removeChild(sampleCell);
      }
    };
  }
  return resolver;
}

function hasExcelFormatItemHandlers(grid) {
  var formatItemEvent = grid && grid.formatItem;
  var eventHandlers = grid && grid.events && grid.events.formatItem;
  if (Array.isArray(eventHandlers) && eventHandlers.length) {
    return true;
  }
  if (formatItemEvent && typeof formatItemEvent._hasHandlers === 'function' &&
      formatItemEvent._hasHandlers()) {
    return true;
  }
  return false;
}

function createExcelFormatItemArgs(grid, cell, item, column, value, rowIndex, colIndex, viewCol) {
  if (grid && typeof grid.createFormatItemEventArgs === 'function') {
    return grid.createFormatItemEventArgs(grid.cells, cell, rowIndex, colIndex, {
      item: item,
      column: column,
      value: value,
      viewCol: viewCol
    });
  }
  return {
    grid: grid,
    panel: grid ? grid.cells : null,
    cell: cell,
    item: item,
    data: item,
    column: column,
    value: value,
    row: rowIndex,
    rowIndex: rowIndex,
    col: colIndex,
    colIndex: colIndex,
    viewCol: viewCol
  };
}

function getExcelStyleFromComputedCell(cell) {
  var computed = window.getComputedStyle(cell);
  var textTarget = findExcelTextStyleTarget(cell);
  var textComputed = textTarget === cell ? computed : window.getComputedStyle(textTarget);
  var style = {};
  var color = cssColorToExcelColor(textComputed.color);
  var backgroundColor = cssColorToExcelColor(computed.backgroundColor);
  var textBackgroundColor = textTarget === cell ? '' :
    cssColorToExcelColor(textComputed.backgroundColor);
  if ((!backgroundColor || backgroundColor === 'FFFFFFFF') && textBackgroundColor) {
    backgroundColor = textBackgroundColor;
  }
  if (color && color !== 'FF1F2937' && color !== 'FF111827') {
    style.color = color;
  }
  if (backgroundColor && backgroundColor !== 'FFFFFFFF') {
    style.backgroundColor = backgroundColor;
  }
  if (Number(textComputed.fontWeight) >= 600 || textComputed.fontWeight === 'bold') {
    style.bold = true;
  }
  if (computed.textAlign === 'right' || computed.justifyContent === 'flex-end') {
    style.align = 'right';
  } else if (computed.textAlign === 'center' || computed.justifyContent === 'center') {
    style.align = 'center';
  }
  return Object.keys(style).length ? style : null;
}

function findExcelTextStyleTarget(cell) {
  var target = findFirstTextParent(cell);
  return target || cell;
}

function findFirstTextParent(node) {
  var child;
  var found;
  var i;
  if (!node || !node.childNodes) {
    return null;
  }
  for (i = 0; i < node.childNodes.length; i += 1) {
    child = node.childNodes[i];
    if (child.nodeType === 3 && String(child.nodeValue || '').trim()) {
      return child.parentElement || child.parentNode || node;
    }
    if (child.nodeType === 1) {
      found = findFirstTextParent(child);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function createZip(files) {
  var localParts = [];
  var centralParts = [];
  var offset = 0;
  var i;
  var file;
  var data;
  var nameBytes;
  var crc;
  var dateParts = getZipDateParts(new Date());
  for (i = 0; i < files.length; i += 1) {
    file = files[i];
    data = stringToUtf8Bytes(file.content);
    nameBytes = stringToUtf8Bytes(file.name);
    crc = crc32(data);
    localParts.push(createZipLocalHeader(nameBytes, data, crc, dateParts));
    localParts.push(data);
    centralParts.push(createZipCentralHeader(nameBytes, data, crc, offset, dateParts));
    offset += localParts[localParts.length - 2].length + data.length;
  }
  return concatUint8Arrays(localParts.concat(centralParts, [
    createZipEndRecord(centralParts, offset)
  ]));
}

function createZipLocalHeader(nameBytes, data, crc, dateParts) {
  var header = new Uint8Array(30 + nameBytes.length);
  writeUint32(header, 0, 0x04034b50);
  writeUint16(header, 4, 20);
  writeUint16(header, 6, 2048);
  writeUint16(header, 8, 0);
  writeUint16(header, 10, dateParts.time);
  writeUint16(header, 12, dateParts.date);
  writeUint32(header, 14, crc);
  writeUint32(header, 18, data.length);
  writeUint32(header, 22, data.length);
  writeUint16(header, 26, nameBytes.length);
  writeUint16(header, 28, 0);
  header.set(nameBytes, 30);
  return header;
}

function createZipCentralHeader(nameBytes, data, crc, offset, dateParts) {
  var header = new Uint8Array(46 + nameBytes.length);
  writeUint32(header, 0, 0x02014b50);
  writeUint16(header, 4, 20);
  writeUint16(header, 6, 20);
  writeUint16(header, 8, 2048);
  writeUint16(header, 10, 0);
  writeUint16(header, 12, dateParts.time);
  writeUint16(header, 14, dateParts.date);
  writeUint32(header, 16, crc);
  writeUint32(header, 20, data.length);
  writeUint32(header, 24, data.length);
  writeUint16(header, 28, nameBytes.length);
  writeUint16(header, 30, 0);
  writeUint16(header, 32, 0);
  writeUint16(header, 34, 0);
  writeUint16(header, 36, 0);
  writeUint32(header, 38, 0);
  writeUint32(header, 42, offset);
  header.set(nameBytes, 46);
  return header;
}

function createZipEndRecord(centralParts, centralOffset) {
  var size = 0;
  var i;
  var header = new Uint8Array(22);
  for (i = 0; i < centralParts.length; i += 1) {
    size += centralParts[i].length;
  }
  writeUint32(header, 0, 0x06054b50);
  writeUint16(header, 8, centralParts.length);
  writeUint16(header, 10, centralParts.length);
  writeUint32(header, 12, size);
  writeUint32(header, 16, centralOffset);
  writeUint16(header, 20, 0);
  return header;
}

function getZipDateParts(date) {
  var year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

function writeUint16(bytes, offset, value) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >>> 8) & 255;
}

function writeUint32(bytes, offset, value) {
  bytes[offset] = value & 255;
  bytes[offset + 1] = (value >>> 8) & 255;
  bytes[offset + 2] = (value >>> 16) & 255;
  bytes[offset + 3] = (value >>> 24) & 255;
}

function stringToUtf8Bytes(text) {
  var encoded;
  var bytes;
  var i;
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }
  encoded = unescape(encodeURIComponent(text));
  bytes = new Uint8Array(encoded.length);
  for (i = 0; i < encoded.length; i += 1) {
    bytes[i] = encoded.charCodeAt(i);
  }
  return bytes;
}

function concatUint8Arrays(parts) {
  var total = 0;
  var output;
  var offset = 0;
  var i;
  for (i = 0; i < parts.length; i += 1) {
    total += parts[i].length;
  }
  output = new Uint8Array(total);
  for (i = 0; i < parts.length; i += 1) {
    output.set(parts[i], offset);
    offset += parts[i].length;
  }
  return output;
}

function crc32(bytes) {
  var table = getCrcTable();
  var crc = -1;
  var i;
  for (i = 0; i < bytes.length; i += 1) {
    crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 255];
  }
  return (crc ^ -1) >>> 0;
}

function getCrcTable() {
  var table = [];
  var c;
  var n;
  var k;
  if (getCrcTable.cache) {
    return getCrcTable.cache;
  }
  for (n = 0; n < 256; n += 1) {
    c = n;
    for (k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  getCrcTable.cache = table;
  return table;
}
