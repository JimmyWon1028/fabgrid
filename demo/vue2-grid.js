(function() {
  'use strict';

  var SETTINGS_KEY = 'fabgrid.vue2.demo.settings.v2';
  var TEXTS = {
    'zh-TW': {
      language: '語言', theme: '主題', frozen: '凍結欄', frozenRight: '右凍結欄', rowHeaders: '列號',
      off: '關閉', rowNumber: '顯示列號', cellOnly: '只顯示 cell', groupRows: '群組', groupNone: '沒有群組',
      groupOrder: '訂單編號', groupVendor: '主要廠商 + 訂單編號', groupVendorOrder: '主要廠商 > 訂單編號',
      searchRow: '搜尋列', pagination: '分頁', remote: '遠端', multiSelect: '多選', editMode: '編輯',
      exportCsv: '匯出 CSV', exportExcel: '匯出 Excel', rows: '列數', rowsVisible: '可視列',
      columnsVisible: '可視欄', renderedCells: '已渲染儲存格', resultCount: '筆數', filter: '篩選',
      filterPlaceholder: '以逗號分隔條件', clearFilter: '清除篩選', lookupTitle: '客戶合約訂單參照',
      lookupPage: '第 1 共 1 頁', close: '關閉', cancel: '取消', confirm: '確定', openLookup: '開啟 Popup Grid'
    },
    'zh-CN': {
      language: '语言', theme: '主题', frozen: '冻结栏', frozenRight: '右冻结栏', rowHeaders: '行号',
      off: '关闭', rowNumber: '显示行号', cellOnly: '只显示 cell', groupRows: '分组', groupNone: '没有分组',
      groupOrder: '订单编号', groupVendor: '主要厂商 + 订单编号', groupVendorOrder: '主要厂商 > 订单编号',
      searchRow: '搜索行', pagination: '分页', remote: '远程', multiSelect: '多选', editMode: '编辑',
      exportCsv: '导出 CSV', exportExcel: '导出 Excel', rows: '行数', rowsVisible: '可视行',
      columnsVisible: '可视栏', renderedCells: '已渲染单元格', resultCount: '笔数', filter: '筛选',
      filterPlaceholder: '以逗号分隔条件', clearFilter: '清除筛选', lookupTitle: '客户合同订单参照',
      lookupPage: '第 1 共 1 页', close: '关闭', cancel: '取消', confirm: '确定', openLookup: '打开 Popup Grid'
    },
    en: {
      language: 'Language', theme: 'Theme', frozen: 'Frozen', frozenRight: 'Right frozen', rowHeaders: 'Row no.',
      off: 'Off', rowNumber: 'Show row number', cellOnly: 'Cell only', groupRows: 'Group', groupNone: 'No group',
      groupOrder: 'Order No.', groupVendor: 'Vendor + Order No.', groupVendorOrder: 'Vendor > Order No.',
      searchRow: 'Search row', pagination: 'Pagination', remote: 'Remote', multiSelect: 'Multi select', editMode: 'Edit',
      exportCsv: 'Export CSV', exportExcel: 'Export Excel', rows: 'Rows', rowsVisible: 'Rows visible',
      columnsVisible: 'Columns visible', renderedCells: 'Rendered cells', resultCount: 'Records', filter: 'Filter',
      filterPlaceholder: 'Comma-separated terms', clearFilter: 'Clear filter', lookupTitle: 'Customer contract order lookup',
      lookupPage: 'Page 1 of 1', close: 'Close', cancel: 'Cancel', confirm: 'OK', openLookup: 'Open Popup Grid'
    }
  };
  var GRID_HEADERS = {
    'zh-TW': {
      id: '主要廠商', name: '簡稱', dlvno: '訂單編號', item: '項目', date: '單據日期', crncy: '幣別',
      cusno: '客戶', stus: '狀態', textDate: '文字日期', yearMonth: '年月', amount: '應付金額',
      score: '分數', rem: '摘要', column: '欄位 {index}', contract: '合約單號', customerType: '客戶別',
      lookupName: '名稱', qty: '數量', available: '可用量', price: '單價'
    },
    'zh-CN': {
      id: '主要厂商', name: '简称', dlvno: '订单编号', item: '项目', date: '单据日期', crncy: '币别',
      cusno: '客户', stus: '状态', textDate: '文字日期', yearMonth: '年月', amount: '应付金额',
      score: '分数', rem: '摘要', column: '栏位 {index}', contract: '合同单号', customerType: '客户别',
      lookupName: '名称', qty: '数量', available: '可用量', price: '单价'
    },
    en: {
      id: 'Vendor', name: 'Short Name', dlvno: 'Order No.', item: 'Item', date: 'Date', crncy: 'Currency',
      cusno: 'Customer', stus: 'Status', textDate: 'Text Date', yearMonth: 'Year/Month', amount: 'Payable',
      score: 'Score', rem: 'Summary', column: 'Column {index}', contract: 'Contract No.', customerType: 'Type',
      lookupName: 'Name', qty: 'Quantity', available: 'Available', price: 'Price'
    }
  };

  function createVue2GridDemoOptions() {
    return {
    data: function() {
      return {
        rows: window.FabGridDemoData.rows,
        columns: [],
        locale: 'zh-TW',
        theme: 'default',
        frozenColumns: 2,
        frozenRightColumns: 1,
        showRowHeaders: true,
        showSearchRow: false,
        pagination: false,
        remote: false,
        multiSelectRows: false,
        editMode: false,
        rowGroupMode: 'none',
        filterText: '',
        filterMode: 'or',
        grid: null,
        viewportHandler: null,
        lookupVisible: false,
        lookupEditorArgs: null,
        lookupGrid: null,
        lookupLastClick: null,
        lookupRows: createLookupRows(),
        lookupColumns: [],
        lookupGridOptions: {
          rowHeight: 30, headerHeight: 31, frozenColumns: 1, showRowHeaders: true,
          rowHeaderWidth: 42, allowSorting: true, allowResizing: true, allowEditing: false
        },
        stats: { totalRows: 20000, rowStart: 0, rowEnd: 0, columnStart: 0, columnEnd: 0, renderedCells: 0 },
        themes: [
          { value: 'default', label: 'Default' }, { value: 'gray', label: 'Gray' },
          { value: 'material', label: 'Material' }, { value: 'bootstrap', label: 'Bootstrap' },
          { value: 'metro', label: 'Metro' }, { value: 'metro-blue', label: 'Metro Blue' },
          { value: 'metro-gray', label: 'Metro Gray' }, { value: 'metro-green', label: 'Metro Green' },
          { value: 'metro-orange', label: 'Metro Orange' }, { value: 'metro-red', label: 'Metro Red' },
          { value: 'sunny', label: 'Sunny' }, { value: 'pepper-grinder', label: 'Pepper Grinder' },
          { value: 'dark-hive', label: 'Dark Hive' }, { value: 'black', label: 'Black' }
        ],
        gridOptions: {
          rowHeight: 32, headerHeight: 32, activeCellBorder: 2, overscanRows: 14, overscanColumns: 3,
          showFooter: true, footerHeight: 32, showRowHeaders: true, rowHeaderWidth: 50,
          showSearchRow: false, multiSelectRows: false, allowSorting: true, allowDragging: 'Columns',
          allowResizing: true, alternatingRows: true, alternatingRowBackground: '#fafafa', observeItemsSource: true,
          pager: { pageNumber: 1, pageSize: 100, pageList: [10, 20, 30, 40, 50, 100, 500], showPageList: false }
        }
      };
    },
    created: function() {
      this.restoreSettings();
      this.columns = createColumns(window.FabGridDemoData.columnCount, this.openLookupPopup, this.locale);
      this.lookupColumns = createLookupColumns(this.locale);
    },
    computed: {
      text: function() {
        return TEXTS[this.locale] || TEXTS['zh-TW'];
      },
      filterModeLabel: function() {
        return this.filterMode === 'and' ? '&' : 'OR';
      },
      remoteLoader: function() {
        return this.loadRemoteRows;
      }
    },
    watch: {
      theme: function() {
        this.applyTheme();
        this.saveSettings();
      },
      locale: function(value) {
        document.documentElement.lang = value;
        this.columns = createColumns(window.FabGridDemoData.columnCount, this.openLookupPopup, value);
        this.lookupColumns = createLookupColumns(value);
        this.$nextTick(this.applyRowGroups);
        this.saveSettings();
      },
      frozenColumns: 'saveSettings',
      frozenRightColumns: 'saveSettings',
      showRowHeaders: function(value) {
        if (this.grid) this.grid.setShowRowHeaders(value);
        this.saveSettings();
      },
      showSearchRow: function(value) {
        if (this.grid) this.grid.setShowSearchRow(value);
        this.saveSettings();
      },
      multiSelectRows: function(value) {
        if (this.grid) this.grid.setMultiSelectRows(value);
        this.saveSettings();
      },
      editMode: function(value) {
        if (this.grid) this.grid.setEditMode(value);
        this.saveSettings();
      },
      rowGroupMode: function() {
        this.applyRowGroups();
        this.saveSettings();
      },
      filterText: function() {
        this.applyFilter();
        this.saveSettings();
      },
      filterMode: function() {
        this.applyFilter();
        this.saveSettings();
      },
      pagination: function() {
        this.refreshGridView();
        this.saveSettings();
      },
      remote: function() {
        this.filterText = '';
        this.refreshGridView();
        this.saveSettings();
      }
    },
    beforeDestroy: function() {
      if (this.grid && this.viewportHandler) this.grid.off('viewportChanged', this.viewportHandler);
    },
    methods: {
      restoreSettings: function() {
        var settings;
        var raw;
        try {
          raw = window.localStorage ? window.localStorage.getItem(SETTINGS_KEY) : '';
          settings = raw ? JSON.parse(raw) : null;
        } catch (error) {
          settings = null;
        }
        if (!settings || typeof settings !== 'object') return;
        if (settings.locale === 'zh-TW' || settings.locale === 'zh-CN' || settings.locale === 'en') this.locale = settings.locale;
        if (this.themes.some(function(item) { return item.value === settings.theme; })) this.theme = settings.theme;
        this.frozenColumns = normalizeInteger(settings.frozenColumns, this.frozenColumns, 0, 6);
        this.frozenRightColumns = normalizeInteger(settings.frozenRightColumns, this.frozenRightColumns, 0, 6);
        if (settings.showRowHeaders === true || settings.showRowHeaders === false || settings.showRowHeaders === 'cell') {
          this.showRowHeaders = settings.showRowHeaders;
        }
        this.showSearchRow = normalizeBoolean(settings.showSearchRow, this.showSearchRow);
        this.pagination = normalizeBoolean(settings.pagination, this.pagination);
        this.remote = normalizeBoolean(settings.remote, this.remote);
        this.multiSelectRows = normalizeBoolean(settings.multiSelectRows, this.multiSelectRows);
        this.editMode = normalizeBoolean(settings.editMode, this.editMode);
        if (['none', 'order', 'vendor', 'vendor-order'].indexOf(settings.rowGroupMode) >= 0) this.rowGroupMode = settings.rowGroupMode;
        if (settings.filterMode === 'or' || settings.filterMode === 'and') this.filterMode = settings.filterMode;
        if (settings.filterText != null) this.filterText = String(settings.filterText);
      },
      saveSettings: function() {
        var settings = {
          locale: this.locale,
          theme: this.theme,
          frozenColumns: this.frozenColumns,
          frozenRightColumns: this.frozenRightColumns,
          showRowHeaders: this.showRowHeaders,
          showSearchRow: this.showSearchRow,
          pagination: this.pagination,
          remote: this.remote,
          multiSelectRows: this.multiSelectRows,
          editMode: this.editMode,
          rowGroupMode: this.rowGroupMode,
          filterText: this.filterText,
          filterMode: this.filterMode
        };
        try {
          if (window.localStorage) window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
          return;
        }
      },
      handleInitialized: function(grid) {
        var self = this;
        this.grid = grid;
        this.viewportHandler = function(args) { self.updateStats(args); };
        grid.on('viewportChanged', this.viewportHandler);
        this.applyTheme();
        this.updateStats();
      },
      updateStats: function(args) {
        if (!this.grid) return;
        args = args || {};
        this.stats = {
          totalRows: this.grid.options.remote === true ? this.grid.paginationTotal :
            (this.grid.view ? this.grid.view.length : this.rows.length),
          rowStart: args.rowStart == null ? this.grid.rowRange.start : args.rowStart,
          rowEnd: args.rowEnd == null ? this.grid.rowRange.end : args.rowEnd,
          columnStart: args.columnStart == null ? this.grid.columnRange.start : args.columnStart,
          columnEnd: args.columnEnd == null ? this.grid.columnRange.end : args.columnEnd,
          renderedCells: args.renderedCells == null ? this.grid.root.querySelectorAll('.fg-cell').length : args.renderedCells
        };
      },
      applyTheme: function() {
        var self = this;
        if (!this.grid || !this.grid.root) return;
        this.themes.forEach(function(item) { self.grid.root.classList.remove('fg-theme-' + item.value); });
        this.grid.root.classList.add('fg-theme-' + this.theme);
      },
      applyRowGroups: function() {
        var groups = [];
        if (!this.grid) return;
        if (this.rowGroupMode === 'order') groups = [{ binding: 'dlvno' }];
        if (this.rowGroupMode === 'vendor') groups = [{ binding: ['id', 'refCode'] }];
        if (this.rowGroupMode === 'vendor-order') groups = [{ binding: 'id' }, { binding: 'refCode' }];
        this.grid.setRowGroups(groups);
        this.updateStats();
      },
      applyFilter: function() {
        var terms;
        var mode = this.filterMode;
        if (!this.grid) return;
        if (this.remote) {
          this.grid.setSearch(this.filterText);
          return;
        }
        terms = this.filterText.toLowerCase().split(',').map(function(value) { return value.trim(); }).filter(Boolean);
        if (!terms.length) {
          this.grid.setFilter(null);
        } else {
          this.grid.setFilter(function(row) {
            var text = Object.keys(row).map(function(key) { return row[key]; }).join(' ').toLowerCase();
            return mode === 'and' ? terms.every(function(term) { return text.indexOf(term) >= 0; }) :
              terms.some(function(term) { return text.indexOf(term) >= 0; });
          });
        }
        this.updateStats();
      },
      clearFilter: function() {
        this.filterText = '';
      },
      toggleFilterMode: function() {
        this.filterMode = this.filterMode === 'or' ? 'and' : 'or';
      },
      refreshGridView: function() {
        var self = this;
        if (!this.grid) return;
        this.grid.options.pagination = this.pagination;
        this.grid.options.remote = this.remote;
        this.grid.options.loader = this.loadRemoteRows;
        this.grid.options.pageNumber = 1;
        if (this.grid.options.pager) this.grid.options.pager.pageNumber = 1;
        if (this.remote) {
          this.grid.reload().then(function() { self.updateStats(); });
          return;
        }
        this.grid.setItemsSource(this.rows);
        this.updateStats();
      },
      exportCsv: function() {
        if (this.grid) this.grid.exportCsv('fabgrid-vue2-demo.csv');
      },
      exportExcel: function() {
        if (this.grid) this.grid.exportExcel('fabgrid-vue2-demo.xlsx');
      },
      loadRemoteRows: function(params) {
        var source = this.rows.slice();
        var filterRules = params.filterRules ? JSON.parse(params.filterRules) : [];
        var sortFields = params.sort ? params.sort.split(',') : [];
        var sortOrders = params.order ? params.order.split(',') : [];
        var start = (params.page - 1) * params.rows;
        if (params.q) {
          source = source.filter(function(row) {
            return JSON.stringify(row).toLowerCase().indexOf(String(params.q).toLowerCase()) >= 0;
          });
        }
        if (filterRules.length) {
          source = source.filter(function(row) {
            return filterRules.every(function(rule) {
              var actual = row[rule.field] == null ? '' : String(row[rule.field]).toLowerCase();
              var expected = String(rule.value).toLowerCase();
              if (rule.op === 'contains') return actual.indexOf(expected) >= 0;
              if (rule.op === 'ends') return actual.lastIndexOf(expected) === actual.length - expected.length;
              if (rule.op === 'eq') return actual === expected;
              if (rule.op === 'ne') return actual !== expected;
              return actual.indexOf(expected) === 0;
            });
          });
        }
        if (sortFields.length) {
          source.sort(function(left, right) {
            var index;
            var field;
            var result;
            for (index = 0; index < sortFields.length; index += 1) {
              field = sortFields[index];
              result = left[field] === right[field] ? 0 : (left[field] > right[field] ? 1 : -1);
              if (result) return sortOrders[index] === 'desc' ? -result : result;
            }
            return 0;
          });
        }
        return new Promise(function(resolve) {
          window.setTimeout(function() {
            resolve({ total: source.length, rows: source.slice(start, start + params.rows) });
          }, 500);
        });
      },
      openLookupPopup: function(args) {
        var self = this;
        this.lookupEditorArgs = args;
        this.lookupVisible = true;
        this.$nextTick(function() {
          if (self.lookupGrid) {
            self.lookupGrid.invalidate();
            self.lookupGrid.select(0, 0);
          }
        });
      },
      closeLookupPopup: function() {
        this.lookupVisible = false;
        this.lookupEditorArgs = null;
        this.lookupLastClick = null;
      },
      handleLookupInitialized: function(grid) {
        this.lookupGrid = grid;
      },
      handleLookupClick: function(event) {
        var cell = event.target && event.target.closest ? event.target.closest('.fg-cell') : null;
        var rowHeader = event.target && event.target.closest ? event.target.closest('.fg-row-header-cell') : null;
        var selectionCell = event.target && event.target.closest ? event.target.closest('.fg-selection-cell') : null;
        var rowTarget = cell || rowHeader || selectionCell;
        var rowIndex;
        var now;
        var isDoubleClick;
        if (!rowTarget || !this.lookupGrid || !this.lookupGrid.root.contains(rowTarget)) return;
        rowIndex = Number(rowTarget.getAttribute('data-row'));
        if (!isFinite(rowIndex)) return;
        now = Date.now();
        isDoubleClick = event.detail >= 2 ||
          (this.lookupLastClick && this.lookupLastClick.row === rowIndex && now - this.lookupLastClick.time < 450);
        this.lookupGrid.select(rowIndex, 0);
        if (isDoubleClick) {
          event.preventDefault();
          event.stopPropagation();
          this.applyLookupValue();
          this.lookupLastClick = null;
          return;
        }
        this.lookupLastClick = { row: rowIndex, time: now };
      },
      clearLookupSelection: function() {
        if (!this.lookupGrid) return;
        this.lookupGrid.clearFilter();
        this.lookupGrid.setSearch('');
      },
      applyLookupValue: function() {
        var editor = this.lookupEditorArgs && this.lookupEditorArgs.editor;
        var rowIndex;
        var value;
        if (!editor || !this.lookupGrid) {
          this.closeLookupPopup();
          return;
        }
        rowIndex = Math.max(0, this.lookupGrid.selection ? this.lookupGrid.selection.row : 0);
        value = this.lookupGrid.getCellData(rowIndex, 0);
        editor.value = value == null ? '' : String(value);
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.focus();
        this.closeLookupPopup();
      }
    }
    };
  }

  function createColumns(count, openLookupPopup, locale) {
    var headers = GRID_HEADERS[locale] || GRID_HEADERS['zh-TW'];
    var texts = TEXTS[locale] || TEXTS['zh-TW'];
    var columns = [
      { binding: 'id', header: headers.id, width: 88, align: 'center', readOnly: true },
      { binding: 'name', header: headers.name, width: 108, readOnly: true },
      { binding: 'dlvno', header: headers.dlvno, width: 130 },
      { binding: 'item', header: headers.item, width: 64, align: 'center', readOnly: true },
      { binding: 'date', header: headers.date, width: 104, dataType: 'date', editor: 'datebox', mask: '9999-99-99' },
      { binding: 'crncy', header: headers.crncy, width: 62, align: 'center', readOnly: true },
      {
        binding: 'cusno',
        header: headers.cusno,
        width: 132,
        search: {
          icons: [{
            iconCls: 'icon-refwin',
            title: texts.openLookup,
            ariaLabel: texts.openLookup,
            onClick: openLookupPopup
          }]
        },
        editor: {
          type: 'textbox',
          icons: [{
            iconCls: 'icon-refwin',
            title: texts.openLookup,
            ariaLabel: texts.openLookup,
            onClick: openLookupPopup
          }]
        }
      },
      { binding: 'stus', header: headers.stus, width: 120, editor: createWorkflowEditor(locale) },
      { binding: 'textDate', header: headers.textDate, width: 120, editor: 'datebox', mask: '9999/99/99' },
      { binding: 'yearMonth', header: headers.yearMonth, width: 110, editor: 'datebox', mask: '9999/99' },
      {
        binding: 'amount',
        header: headers.amount,
        width: 140,
        align: 'right',
        color: 'blue',
        dataType: 'number',
        aggregate: 'sum',
        thousandsSeparator: true,
        precision: 2,
        editor: 'numberbox',
        validate: function(args) {
          var value = args.value;
          if (value != null && (!isFinite(value) || value < 0 || value > 1000000)) {
            return { type: 'range', message: '金額必須介於 0 到 1,000,000', value: value };
          }
          return null;
        }
      },
      {
        binding: 'score',
        header: headers.score,
        width: 100,
        align: 'right',
        dataType: 'number',
        aggregate: 'avg',
        editor: 'numberbox',
        validate: function(args) {
          return new Promise(function(resolve) {
            window.setTimeout(function() {
              var value = args.value;
              resolve(value != null && (!isFinite(value) || value < 0 || value > 100) ?
                { type: 'range', message: '分數必須介於 0 到 100', value: value } : null);
            }, 120);
          });
        }
      },
      { binding: 'rem', header: headers.rem, width: 240 }
    ];
    var index;
    for (index = columns.length + 1; index <= count; index += 1) {
      columns.push({
        binding: 'col' + pad(index), header: headers.column.replace('{index}', index), width: index % 3 === 0 ? 150 : 120,
        dataType: index % 4 === 0 ? 'number' : 'string', align: index % 4 === 0 ? 'right' : ''
      });
    }
    return columns;
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function normalizeInteger(value, fallback, min, max) {
    value = Number(value);
    if (!isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  function normalizeBoolean(value, fallback) {
    return value === true || value === false ? value : fallback;
  }

  function createLookupRows() {
    return [
      { code: '2W001', orderNo: 'SE260701003', customer: 'EG00', name: '高陞旺', qty: 4000, available: 4000, price: 454.2, status: '買單' },
      { code: 'WU001', orderNo: 'SE260701002', customer: 'CU00', name: '和碩', qty: 8000, available: 3097.8, price: 454.2, status: '買單' },
      { code: 'CU004', orderNo: 'SE260701001', customer: '2R00', name: '大晉', qty: 3000, available: 2092.6, price: 429.9, status: '買單' },
      { code: 'BV001', orderNo: 'SE260526001', customer: 'CU00', name: '和碩', qty: 3658.9, available: 0, price: 450.4, status: '使用' },
      { code: 'RM001', orderNo: 'SE260501001', customer: '2R00', name: '大晉', qty: 3000, available: -1250, price: 408.8, status: '使用,結案' },
      { code: 'RW001', orderNo: 'SE151117001', customer: 'C500', name: '宏展', qty: 20000, available: 20000, price: 177, status: '買單' },
      { code: 'JL001', orderNo: 'SE150714001', customer: 'C500', name: '宏展', qty: 72446.4, available: 72446.4, price: 183, status: '買單' },
      { code: 'JP001', orderNo: 'SE150216001', customer: 'C500', name: '宏展', qty: 3000, available: 3000, price: 200, status: '使用,結案' }
    ];
  }

  function createLookupColumns(locale) {
    var headers = GRID_HEADERS[locale] || GRID_HEADERS['zh-TW'];
    return [
      { binding: 'code', header: headers.cusno, width: 82 },
      { binding: 'orderNo', header: headers.contract, width: 124 },
      { binding: 'customer', header: headers.customerType, width: 72 },
      { binding: 'name', header: headers.lookupName, width: 82 },
      { binding: 'qty', header: headers.qty, width: 92, align: 'right', dataType: 'number' },
      { binding: 'available', header: headers.available, width: 92, align: 'right', dataType: 'number' },
      { binding: 'price', header: headers.price, width: 82, align: 'right', dataType: 'number' },
      { binding: 'status', header: headers.stus, width: 88 }
    ];
  }

  function createWorkflowEditor(locale) {
    var labels = locale === 'en' ? ['Draft', 'Pending', 'Approved', 'Closed'] :
      locale === 'zh-CN' ? ['草稿', '待审核', '已批准', '已结案'] : ['草稿', '待審核', '已核准', '已結案'];
    return {
      type: 'combobox',
      valueField: 'value',
      textField: 'text',
      limitToList: true,
      showValueInList: true,
      data: window.FabGridDemoData.workflowValues.map(function(value, index) {
        return { value: value, text: labels[index] };
      })
    };
  }

  window.createVue2GridDemoOptions = createVue2GridDemoOptions;
  if (typeof Vue !== 'undefined' && document.getElementById('vueGridDemo')) {
    var options = createVue2GridDemoOptions();
    options.el = '#vueGridDemo';
    new Vue(options);
  }
}());
