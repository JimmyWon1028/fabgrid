(function() {
  'use strict';

  var DEMO_ROW_COUNT = 2000;
  var DEMO_COLUMN_COUNT = 20;
  var rows = createRows(DEMO_ROW_COUNT, DEMO_COLUMN_COUNT);
  var columns = createColumns(DEMO_COLUMN_COUNT);
  var stats = {
    rowCount: document.getElementById('rowCount'),
    rowRange: document.getElementById('rowRange'),
    columnRange: document.getElementById('columnRange'),
    cellCount: document.getElementById('cellCount')
  };
  var toolbarControls = document.querySelectorAll('.toolbar input, .toolbar button');

  var grid = new FastGrid('#grid', {
    rowHeight: 32,
    headerHeight: 36,
    overscanRows: 14,
    overscanColumns: 3,
    frozenColumns: 2,
    frozenRightColumns: 1,
    showRowHeaders: false,
    showFooter: true,
    footerHeight: 28,
    multiSelectRows: false,
    itemsSource: rows,
    columns: columns,
    allowSorting: true,
    allowEditing: true,
    editOnSelect: true,
    allowResizing: true,
    alternatingRows: true,
    alternatingRowBackground: '#fafafa',
    formatCell: function(args) {
      if (args.column.binding === 'status') {
        args.cell.className += args.value === 'Active' ? ' status-active' : ' status-paused';
      }
    }
  });

  grid.on('viewportChanged', function(e) {
    stats.rowCount.textContent = 'Rows: ' + e.totalRows + ' / ' + DEMO_ROW_COUNT;
    stats.rowRange.textContent = 'Rows visible: ' + e.rowStart + '-' + Math.max(e.rowStart, e.rowEnd - 1);
    stats.columnRange.textContent = 'Columns visible: ' + e.columnStart + '-' + Math.max(e.columnStart, e.columnEnd - 1);
    stats.cellCount.textContent = 'Rendered cells: ' + e.renderedCells;
  });

  grid.on('excelExporting', function() {
    setToolbarBusy(true);
  });

  grid.on('excelExported', function() {
    setToolbarBusy(false);
  });

  grid.on('excelExportFailed', function() {
    setToolbarBusy(false);
  });

  document.getElementById('searchInput').addEventListener('input', function(event) {
    grid.setSearch(event.target.value);
  });

  document.getElementById('frozenInput').addEventListener('input', function(event) {
    grid.setFrozenColumns(Number(event.target.value || 0));
  });

  document.getElementById('frozenRightInput').addEventListener('input', function(event) {
    grid.setFrozenRightColumns(Number(event.target.value || 0));
  });

  document.getElementById('rowHeadersInput').addEventListener('change', function(event) {
    grid.setShowRowHeaders(event.target.checked);
  });

  document.getElementById('multiSelectInput').addEventListener('change', function(event) {
    grid.setMultiSelectRows(event.target.checked);
  });

  document.getElementById('editModeInput').addEventListener('change', function(event) {
    grid.setEditMode(event.target.checked);
  });

  document.getElementById('exportButton').addEventListener('click', function() {
    grid.exportCsv('fastgrid-demo.csv');
  });

  document.getElementById('exportExcelButton').addEventListener('click', function() {
    grid.exportExcel('fastgrid-demo.xlsx').catch(function(error) {
      window.setTimeout(function() {
        throw error;
      }, 0);
    });
  });

  window.fastGridDemo = {
    grid: grid,
    rows: rows,
    columns: columns
  };

  function createColumns(count) {
    var columns = [
      { binding: 'id', header: 'ID', width: 72, minWidth: 56, align: 'center', dataType: 'number', readOnly: true },
      { binding: 'name', header: '客戶名稱', width: 160, minWidth: 100, dataType: 'string', editor: 'textbox' },
      { binding: 'region', header: '區域', width: 110, minWidth: 80, dataType: 'string', readOnly: true },
      { binding: 'status', header: '狀態', width: 100, minWidth: 80, dataType: 'string', readOnly: true },
      {
        binding: 'amount',
        header: '金額',
        width: 120,
        minWidth: 90,
        align: 'right',
        dataType: 'number',
        aggregate: 'sum',
        editor: {
          type: 'numberbox',
          options: {
            precision: 2
          }
        },
        formatter: function(value) {
          if (value == null || value === '') {
            return '';
          }
          return Number(value).toLocaleString('zh-TW');
        }
      },
      {
        binding: 'score',
        header: '分數',
        width: 90,
        minWidth: 70,
        align: 'right',
        dataType: 'number',
        aggregate: 'avg',
        editor: 'numberbox',
        footerFormatter: function(value) {
          if (value == null || value === '') {
            return '';
          }
          return Number(value).toLocaleString('zh-TW', { maximumFractionDigits: 1 });
        }
      },
      {
        binding: 'textDate',
        header: '文字日期',
        width: 120,
        minWidth: 100,
        dataType: 'string',
        editor: 'datebox',
        readOnly: false,
        mask: '9999/99/99',
        autoUnmask: true
      },
      { binding: 'date', header: '日期', width: 120, minWidth: 100, dataType: 'date', editor: 'datebox' }
    ];
    var i;
    for (i = columns.length + 1; i <= count; i += 1) {
      columns.push({
        binding: 'col' + pad(i),
        header: '欄位 ' + i,
        width: i % 3 === 0 ? 150 : 120,
        minWidth: 80,
        dataType: i % 4 === 0 ? 'number' : 'string',
        align: i % 4 === 0 ? 'right' : '',
        aggregate: i % 4 === 0 ? 'sum' : null
      });
    }
    return columns;
  }

  function createRows(count, columnCount) {
    var regions = ['台北', '新竹', '台中', '台南', '高雄'];
    var statuses = ['Active', 'Paused'];
    var rows = [];
    var row;
    var i;
    var c;
    for (i = 1; i <= count; i += 1) {
      row = {
        id: i,
        name: 'Customer ' + i,
        region: regions[i % regions.length],
        status: statuses[i % statuses.length],
        amount: Math.round((i * 137.89) % 950000),
        score: (i * 17) % 100,
        textDate: '202607' + pad((i % 28) + 1),
        date: '2026-07-' + pad((i % 28) + 1)
      };
      for (c = 8; c <= columnCount; c += 1) {
        row['col' + pad(c)] = c % 4 === 0 ? (i * c) % 10000 : 'R' + i + '-C' + c;
      }
      rows.push(row);
    }
    return rows;
  }

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function setToolbarBusy(value) {
    var i;
    for (i = 0; i < toolbarControls.length; i += 1) {
      toolbarControls[i].disabled = value === true;
    }
  }
}());
