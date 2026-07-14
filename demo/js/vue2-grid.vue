<template>
  <main class="page">
    <section class="toolbar" aria-label="FabGrid controls">
      <div class="brand">
        <h1>FabGrid</h1>
        <p>Pure JS performance-first grid · {{ rows.length }} × {{ columns.length }}</p>
      </div>
      <label class="field compact">
        <span>{{ text.language }}</span>
        <select v-model="locale">
          <option value="zh-TW">繁體中文</option>
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
      </label>
      <label class="field compact theme-field">
        <span>{{ text.theme }}</span>
        <select v-model="theme">
          <option v-for="item in themes" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label class="field compact narrow-number-field">
        <span>{{ text.frozen }}</span>
        <input v-model.number="frozenColumns" type="number" min="0" max="6">
      </label>
      <label class="field compact narrow-number-field">
        <span>{{ text.frozenRight }}</span>
        <input v-model.number="frozenRightColumns" type="number" min="0" max="6">
      </label>
      <label class="field compact">
        <span>{{ text.rowHeaders }}</span>
        <select v-model="showRowHeaders">
          <option :value="false">{{ text.off }}</option>
          <option :value="true">{{ text.rowNumber }}</option>
          <option value="cell">{{ text.cellOnly }}</option>
        </select>
      </label>
      <label class="field compact">
        <span>{{ text.groupRows }}</span>
        <select v-model="rowGroupMode">
          <option value="none">{{ text.groupNone }}</option>
          <option value="order">{{ text.groupOrder }}</option>
          <option value="vendor">{{ text.groupVendor }}</option>
          <option value="vendor-order">{{ text.groupVendorOrder }}</option>
        </select>
      </label>
      <label class="toggle"><input v-model="showSearchRow" type="checkbox"><span>{{ text.searchRow }}</span></label>
      <label class="toggle"><input v-model="pagination" type="checkbox"><span>{{ text.pagination }}</span></label>
      <label class="toggle"><input v-model="remote" type="checkbox"><span>{{ text.remote }}</span></label>
      <label class="toggle"><input v-model="multiSelectRows" type="checkbox"><span>{{ text.multiSelect }}</span></label>
      <label class="toggle"><input v-model="editMode" type="checkbox"><span>{{ text.editMode }}</span></label>
      <button class="toolbar-icon-button icon-export" type="button" :disabled="exportBusy" :aria-label="text.exportCsv" :title="text.exportCsv" @click="exportCsv"></button>
      <button class="toolbar-icon-button icon-excel" type="button" :disabled="exportBusy" :aria-label="text.exportExcel" :title="text.exportExcel" @click="exportExcel"></button>
    </section>

    <section class="stats" aria-label="FabGrid stats">
      <span>{{ text.rows }}: {{ formatNumber(stats.totalRows) }} / {{ formatNumber(rows.length) }}</span>
      <span>{{ text.rowsVisible }}: {{ stats.rowStart }}-{{ Math.max(stats.rowStart, stats.rowEnd - 1) }}</span>
      <span>{{ text.columnsVisible }}: {{ stats.columnStart }}-{{ Math.max(stats.columnStart, stats.columnEnd - 1) }} / {{ columns.length }}</span>
      <span>{{ text.renderedCells }}: {{ formatNumber(stats.renderedCells) }}</span>
    </section>

    <section class="grid-shell">
      <fab-grid
        ref="grid"
        :items-source="rows"
        :columns="columns"
        :grid-options="gridOptions"
        :allow-editing="editMode"
        :frozen-columns="frozenColumns"
        :frozen-right-columns="frozenRightColumns"
        :locale="locale"
        :pagination="pagination"
        :remote="remote"
        :loader="remoteLoader"
        @initialized="handleInitialized"
        @load-success="updateStats"
      ></fab-grid>
      <div class="demo-filter-bar" aria-label="Demo filter">
        <span class="demo-result-count">{{ text.resultCount }}: {{ formatNumber(stats.totalRows) }}</span>
        <label class="demo-filter-control">
          <span>{{ text.filter }}:</span>
          <span class="demo-filter-input-wrap">
            <input v-model="filterText" type="search" :disabled="remote" :placeholder="text.filterPlaceholder" autocomplete="off">
            <button class="demo-filter-mode" :class="{ 'demo-filter-mode-and': filterMode === 'and' }" type="button" :disabled="remote" :aria-label="filterModeLabel" :title="filterModeLabel" @click="toggleFilterMode">{{ filterModeLabel }}</button>
            <button type="button" :disabled="remote" :aria-label="text.clearFilter" :title="text.clearFilter" @click="clearFilter">🧹</button>
          </span>
        </label>
      </div>
    </section>

    <div class="lookup-popup-overlay" :style="{ display: lookupVisible ? 'flex' : 'none' }" @mousedown.self="closeLookupPopup">
      <div class="lookup-popup-window" role="dialog" aria-modal="true" :aria-label="text.lookupTitle">
        <div class="lookup-popup-header">
          <strong class="lookup-popup-title">{{ text.lookupTitle }}</strong>
          <div class="lookup-popup-controls">
            <button class="lookup-popup-icon-button icon-close" type="button" :aria-label="text.close" :title="text.close" @click="closeLookupPopup"></button>
          </div>
        </div>
        <div class="lookup-popup-grid" @click.capture="handleLookupClick">
          <fab-grid
            ref="lookupGrid"
            :items-source="lookupRows"
            :columns="lookupColumns"
            :grid-options="lookupGridOptions"
            :locale="locale"
            @initialized="handleLookupInitialized"
          ></fab-grid>
        </div>
        <div class="lookup-popup-pager">
          <span>|‹</span><span>‹</span><strong>{{ text.lookupPage }}</strong><span>›</span><span>›|</span><span>↻</span>
          <span class="lookup-popup-count">{{ text.resultCount }}: {{ lookupRows.length }}</span>
        </div>
        <div class="lookup-popup-footer">
          <button class="lookup-popup-button icon-clear" type="button" @click="clearLookupSelection">{{ text.clearFilter }}</button>
          <button class="lookup-popup-button icon-remove" type="button" @click="closeLookupPopup">{{ text.cancel }}</button>
          <button class="lookup-popup-button icon-check" type="button" @click="applyLookupValue">{{ text.confirm }}</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import './demo-data.js';

const wrapper = window.fabuiVue;

// Keep this object as the first match for the legacy SFC loader.
var sfcRuntime = {
  name: 'FabGridVue2RuntimeTemplate'
};

var SETTINGS_KEY = window.FABGRID_DEMO_SETTINGS_KEY || 'fabgrid.demo.settings.v4.default-toolbar-state';
var STATUS_STYLES = {
  draft: { className: 'status-draft', color: '#6b7280' },
  pending: { className: 'status-pending', color: '#b45309' },
  approved: { className: 'status-approved', color: '#047857' },
  closed: { className: 'status-closed', color: '#1d4ed8' }
};
var TEXTS = {
  'zh-TW': {
    language: '語言', theme: '主題', frozen: '凍結欄', frozenRight: '右凍結欄', rowHeaders: '列號',
    off: '關閉', rowNumber: '顯示列號', cellOnly: '只顯示 cell', groupRows: '群組', groupNone: '沒有群組',
    groupOrder: '訂單編號', groupVendor: '主要廠商 + 訂單編號', groupVendorOrder: '主要廠商 > 訂單編號',
    searchRow: '搜尋列', pagination: '分頁', remote: '遠端', multiSelect: '多選', editMode: '編輯',
    exportCsv: '匯出 CSV', exportExcel: '匯出 Excel', rows: '列數', rowsVisible: '可視列',
    columnsVisible: '可視欄', renderedCells: '已渲染儲存格', resultCount: '筆數', filter: '篩選',
    filterPlaceholder: '逗號分隔條件，例如 aaa,bbb,ccc', clearFilter: '清除篩選', lookupTitle: 'Popup Grid 範例：客戶合約訂單',
    lookupPage: '第 1 共 1 頁', close: '關閉', cancel: '取消', confirm: '確定', openLookup: '開啟 Popup Grid',
    groupHeader: '{header}: {key} ({count} 項目)', groupVendorOrderHeader: '{header}: {vendor} + {order} ({count} 項目)'
  },
  'zh-CN': {
    language: '语言', theme: '主题', frozen: '冻结栏', frozenRight: '右冻结栏', rowHeaders: '行号',
    off: '关闭', rowNumber: '显示行号', cellOnly: '只显示 cell', groupRows: '分组', groupNone: '没有分组',
    groupOrder: '订单编号', groupVendor: '主要厂商 + 订单编号', groupVendorOrder: '主要厂商 > 订单编号',
    searchRow: '搜索行', pagination: '分页', remote: '远程', multiSelect: '多选', editMode: '编辑',
    exportCsv: '导出 CSV', exportExcel: '导出 Excel', rows: '行数', rowsVisible: '可视行',
    columnsVisible: '可视栏', renderedCells: '已渲染单元格', resultCount: '笔数', filter: '筛选',
    filterPlaceholder: '逗号分隔条件，例如 aaa,bbb,ccc', clearFilter: '清除筛选', lookupTitle: 'Popup Grid 示例：客户合同订单',
    lookupPage: '第 1 共 1 页', close: '关闭', cancel: '取消', confirm: '确定', openLookup: '打开 Popup Grid',
    groupHeader: '{header}: {key} ({count} 项)', groupVendorOrderHeader: '{header}: {vendor} + {order} ({count} 项)'
  },
  en: {
    language: 'Language', theme: 'Theme', frozen: 'Frozen', frozenRight: 'Right frozen', rowHeaders: 'Row no.',
    off: 'Off', rowNumber: 'Show row number', cellOnly: 'Cell only', groupRows: 'Group', groupNone: 'No group',
    groupOrder: 'Order No.', groupVendor: 'Vendor + Order No.', groupVendorOrder: 'Vendor > Order No.',
    searchRow: 'Search row', pagination: 'Pagination', remote: 'Remote', multiSelect: 'Multi select', editMode: 'Edit',
    exportCsv: 'Export CSV', exportExcel: 'Export Excel', rows: 'Rows', rowsVisible: 'Rows visible',
    columnsVisible: 'Columns visible', renderedCells: 'Rendered cells', resultCount: 'Records', filter: 'Filter',
    filterPlaceholder: 'Comma-separated terms, e.g. aaa,bbb,ccc', clearFilter: 'Clear filter', lookupTitle: 'Popup Grid example: customer contract orders',
    lookupPage: 'Page 1 of 1', close: 'Close', cancel: 'Cancel', confirm: 'OK', openLookup: 'Open Popup Grid',
    groupHeader: '{header}: {key} ({count} items)', groupVendorOrderHeader: '{header}: {vendor} + {order} ({count} items)'
  }
};
var GRID_HEADERS = {
  'zh-TW': {
    id: '主要廠商', name: '簡稱', dlvno: '訂單編號', item: '項目', date: '單據日期', crncy: '幣別',
    cusno: '客戶', stus: '狀態', color: '顏色', textDate: '文字日期', yearMonth: '年月', amount: '應付金額',
    score: '分數(非同步)', rem: '摘要', column: '欄位 {index}', contract: '合約單號', customerType: '客戶別',
    code: '代號', orderNo: '單號', customer: '客戶', lookupName: '名稱', qty: '合約數量', available: '可用餘量', price: '單價'
  },
  'zh-CN': {
    id: '主要厂商', name: '简称', dlvno: '订单编号', item: '项目', date: '单据日期', crncy: '币别',
    cusno: '客户', stus: '状态', color: '颜色', textDate: '文本日期', yearMonth: '年月', amount: '应付金额',
    score: '分数(异步)', rem: '摘要', column: '列 {index}', contract: '合同单号', customerType: '客户别',
    code: '代号', orderNo: '单号', customer: '客户', lookupName: '名称', qty: '合同数量', available: '可用余量', price: '单价'
  },
  en: {
    id: 'Vendor', name: 'Short Name', dlvno: 'Order No.', item: 'Item', date: 'Date', crncy: 'Currency',
    cusno: 'Customer', stus: 'Status', color: 'Color', textDate: 'Text date', yearMonth: 'Year/Month', amount: 'Payable',
    score: 'Score (async)', rem: 'Summary', column: 'Column {index}', contract: 'Contract No.', customerType: 'Type',
    code: 'Code', orderNo: 'Order No.', customer: 'Customer', lookupName: 'Name', qty: 'Contract qty', available: 'Available', price: 'Price'
  }
};

export default {
  name: 'FabGridVue2Demo',
  components: {
    FabGrid: wrapper.FabGrid
  },
  template: sfcRuntime.template,
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
      exportBusy: false,
      grid: null,
      viewportHandler: null,
      excelExportingHandler: null,
      excelExportedHandler: null,
      excelExportFailedHandler: null,
      lookupVisible: false,
      lookupEditorArgs: null,
      lookupGrid: null,
      lookupLastClick: null,
      lookupRows: createLookupRows(),
      lookupColumns: [],
      lookupGridOptions: {
        rowHeight: 32, headerHeight: 32, overscanRows: 4, overscanColumns: 1,
        showRowHeaders: true, rowHeaderWidth: 42, allowSorting: true, allowResizing: true,
        allowEditing: false, editOnSelect: false, alternatingRows: true,
        alternatingRowBackground: '#fafafa', formatCell: formatLookupCell
      },
      stats: { totalRows: window.FabGridDemoData.rowCount, rowStart: 0, rowEnd: 0, columnStart: 0, columnEnd: 0, renderedCells: 0 },
      themes: [
        { value: 'default', label: 'Default' }, { value: 'bootstrap', label: 'Bootstrap' },
        { value: 'cupertino', label: 'Cupertino' }, { value: 'material', label: 'Material' },
        { value: 'material-blue', label: 'Material Blue' }, { value: 'material-teal', label: 'Material Teal' },
        { value: 'metro', label: 'Metro' }, { value: 'metro-blue', label: 'Metro Blue' },
        { value: 'metro-gray', label: 'Metro Gray' }, { value: 'metro-green', label: 'Metro Green' },
        { value: 'metro-orange', label: 'Metro Orange' }, { value: 'metro-red', label: 'Metro Red' },
        { value: 'sunny', label: 'Sunny' }, { value: 'pepper-grinder', label: 'Pepper Grinder' },
        { value: 'dark-hive', label: 'Dark Hive' }, { value: 'black', label: 'Black' }
      ],
      gridOptions: {
        rowHeight: 32, headerHeight: 32, activeCellBorder: 2, searchDelay: 200,
        overscanRows: 14, overscanColumns: 3,
        showFooter: true, footerHeight: 32, showRowHeaders: true, rowHeaderWidth: 50,
        showSearchRow: false, multiSelectRows: false, allowSorting: true, allowDragging: 'Columns',
        allowEditing: false, editOnSelect: false, allowResizing: true, alternatingRows: true,
        alternatingRowBackground: '#fafafa', observeItemsSource: true, headerToggleKey: 'F4',
        formatCell: formatDemoCell,
        pager: {
          pageNumber: 1, pageSize: 100, pageList: [10, 20, 30, 40, 50, 100, 500],
          showPageList: false, showPageInfo: true, showRefresh: true
        }
      }
    };
  },
  created: function() {
    this.restoreSettings();
    this.gridOptions.showRowHeaders = this.showRowHeaders;
    this.gridOptions.showSearchRow = this.showSearchRow;
    this.gridOptions.multiSelectRows = this.multiSelectRows;
    this.gridOptions.allowEditing = this.editMode;
    this.gridOptions.editOnSelect = this.editMode;
    this.gridOptions.rowGroups = createRowGroups(this.rowGroupMode, this.locale);
    this.columns = createColumns(window.FabGridDemoData.columnCount, this.openLookupPopup, this.locale);
    this.lookupColumns = createLookupColumns(this.locale);
  },
  mounted: function() {
    document.addEventListener('keydown', this.handleDocumentKeydown);
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
      if (window.fabGridDemo) window.fabGridDemo.columns = this.columns;
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
    if (this.grid && this.excelExportingHandler) this.grid.off('excelExporting', this.excelExportingHandler);
    if (this.grid && this.excelExportedHandler) this.grid.off('excelExported', this.excelExportedHandler);
    if (this.grid && this.excelExportFailedHandler) this.grid.off('excelExportFailed', this.excelExportFailedHandler);
    document.removeEventListener('keydown', this.handleDocumentKeydown);
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
      this.excelExportingHandler = function() { self.exportBusy = true; };
      this.excelExportedHandler = function() { self.exportBusy = false; };
      this.excelExportFailedHandler = function() { self.exportBusy = false; };
      grid.on('viewportChanged', this.viewportHandler);
      grid.on('excelExporting', this.excelExportingHandler);
      grid.on('excelExported', this.excelExportedHandler);
      grid.on('excelExportFailed', this.excelExportFailedHandler);
      window.fabGridDemo = { grid: grid, rows: this.rows, columns: this.columns, themes: this.themes };
      this.applyTheme();
      this.applyRowGroups();
      this.updateStats();
    },
    updateStats: function(args) {
      var totalRows;
      if (!this.grid) return;
      args = args || {};
      totalRows = this.grid.options.pagination || this.grid.options.remote === true ?
        this.grid.paginationTotal : (this.grid.dataView ? this.grid.dataView.length : this.rows.length);
      this.stats = {
        totalRows: totalRows,
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
      this.$nextTick(this.syncDemoFilterHeaderTextStyle);
    },
    syncDemoFilterHeaderTextStyle: function() {
      var filterBar = this.$el ? this.$el.querySelector('.demo-filter-bar') : null;
      var headerCell = this.grid && this.grid.root ? this.grid.root.querySelector('.fg-header-cell') : null;
      var style;
      if (!filterBar || !headerCell) return;
      style = window.getComputedStyle(headerCell);
      filterBar.style.color = style.color;
      filterBar.style.fontFamily = style.fontFamily;
      filterBar.style.fontSize = style.fontSize;
      filterBar.style.fontWeight = style.fontWeight;
    },
    applyRowGroups: function() {
      if (!this.grid) return;
      this.grid.setRowGroups(createRowGroups(this.rowGroupMode, this.locale, this.columns));
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
      if (this.grid) this.grid.exportCsv('fabgrid-demo.csv');
    },
    exportExcel: function() {
      if (!this.grid) return;
      this.grid.exportExcel('fabgrid-demo.xlsx').catch(function(error) {
        window.setTimeout(function() { throw error; }, 0);
      });
    },
    formatNumber: function(value) {
      var number = Number(value);
      if (!isFinite(number)) return String(value);
      return number.toLocaleString(this.locale === 'en' ? 'en-US' : this.locale);
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
          return filterRules.every(function(rule) { return matchesRemoteFilterRule(row, rule); });
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
    handleDocumentKeydown: function(event) {
      if (event.key === 'Escape' && this.lookupVisible) this.closeLookupPopup();
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

function createColumns(count, openLookupPopup, locale) {
  var headers = GRID_HEADERS[locale] || GRID_HEADERS['zh-TW'];
  var texts = TEXTS[locale] || TEXTS['zh-TW'];
  var columns = [
    { binding: 'facno', header: headers.id, width: 88, minWidth: 72, align: 'center', dataType: 'string', readOnly: true },
    { binding: 'name', header: headers.name, width: 108, minWidth: 88, dataType: 'string', readOnly: true },
    {
      binding: 'dlvno', header: headers.dlvno, width: 130, minWidth: 100, dataType: 'string',
      editor: {
        type: 'textbox',
        icons: [{ iconCls: 'icon-refwin', title: texts.openLookup, ariaLabel: texts.openLookup, onClick: setOrderReference }]
      }
    },
    { binding: 'item', header: headers.item, width: 64, minWidth: 56, align: 'center', dataType: 'string', readOnly: true },
    {
      binding: 'date', header: headers.date, width: 104, minWidth: 92,
      dataType: 'date', editor: 'datebox', mask: '9999-99-99'
    },
    { binding: 'crncy', header: headers.crncy, width: 65, minWidth: 56, align: 'center', dataType: 'string', readOnly: true },
    {
      binding: 'cusno',
      header: headers.cusno,
      width: 132,
      minWidth: 110,
      dataType: 'string',
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
    {
      binding: 'stus', header: headers.stus, width: 120, minWidth: 100,
      dataType: 'string', editor: createWorkflowEditor(locale)
    },
    {
      binding: 'color', header: headers.color, width: 112, minWidth: 92,
      dataType: 'string', editor: { type: 'color', showAlpha: true }
    },
    {
      binding: 'dlvdt', header: headers.textDate, width: 120, minWidth: 100,
      dataType: 'string', editor: 'datebox', mask: '9999/99/99', autoUnmask: true
    },
    {
      binding: 'yymm', header: headers.yearMonth, width: 110, minWidth: 90,
      dataType: 'string', editor: 'datebox', mask: '9999/99', autoUnmask: true
    },
    {
      binding: 'amount',
      header: headers.amount,
      width: 140,
      minWidth: 90,
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
      width: 120,
      minWidth: 100,
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
      },
      footerFormatter: function(value) {
        if (value == null || value === '') return '';
        return Number(value).toLocaleString(locale === 'en' ? 'en-US' : locale, { maximumFractionDigits: 1 });
      }
    },
    { binding: 'rem', header: headers.rem, width: 240, minWidth: 120, dataType: 'string' }
  ];
  var index;
  for (index = columns.length + 1; index <= count; index += 1) {
    columns.push({
      binding: 'col' + pad(index), header: headers.column.replace('{index}', index), width: index % 3 === 0 ? 150 : 120,
      minWidth: 80, dataType: index % 4 === 0 ? 'number' : 'string',
      align: index % 4 === 0 ? 'right' : '', aggregate: index % 4 === 0 ? 'sum' : null
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

function setOrderReference(args) {
  if (!args || !args.editor) return;
  args.editor.value = 'BO' + pad(args.row + 1) + '001';
  args.editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function formatDemoCell(args) {
  var style;
  if (!args || !args.column || args.column.binding !== 'stus') return;
  style = STATUS_STYLES[String(args.value || '').toLowerCase()];
  if (!style) return;
  args.cell.className += ' ' + style.className;
  args.cell.style.color = style.color;
}

function formatLookupCell(args) {
  if (!args || !args.column || args.column.binding !== 'status' || args.value === '買單') return;
  args.cell.style.color = '#1d4ed8';
  args.cell.style.fontWeight = '600';
}

function createRowGroups(mode, locale, columns) {
  var formatHeader = function(args) { return formatRowGroupHeader(args, locale, columns); };
  var formatVendorOrder = function(args) { return formatVendorOrderGroupHeader(args, locale, columns); };
  if (mode === 'order') return [{ binding: 'dlvno', header: formatHeader }];
  if (mode === 'vendor') return [{ binding: ['facno', 'refCode'], header: formatVendorOrder }];
  if (mode === 'vendor-order') {
    return [{ binding: 'facno', header: formatHeader }, { binding: 'refCode', header: formatHeader }];
  }
  return [];
}

function formatRowGroupHeader(args, locale, columns) {
  var text = TEXTS[locale] || TEXTS['zh-TW'];
  return formatText(text.groupHeader, {
    header: getRowGroupHeaderText(args, columns, text),
    key: args.key,
    count: args.count
  });
}

function formatVendorOrderGroupHeader(args, locale, columns) {
  var text = TEXTS[locale] || TEXTS['zh-TW'];
  var item = args.item || {};
  return formatText(text.groupVendorOrderHeader, {
    header: getRowGroupHeaderText(args, columns, text),
    vendor: item.facno,
    order: item.refCode,
    count: args.count
  });
}

function getRowGroupHeaderText(args, columns, text) {
  var bindings = args.config && (args.config.bindings || args.config.binding || args.config.fields || args.config.field);
  if (args.header) return args.header;
  if (bindings == null) {
    bindings = args.key === (args.item && args.item.facno) ? 'facno' :
      args.key === (args.item && args.item.refCode) ? 'refCode' : ['facno', 'refCode'];
  }
  if (!Array.isArray(bindings)) bindings = [bindings];
  return bindings.map(function(binding) { return getGroupColumnHeader(binding, columns); }).join(' + ') || text.groupRows;
}

function getGroupColumnHeader(binding, columns) {
  var normalized = binding === 'refCode' ? 'dlvno' : binding;
  var index;
  for (index = 0; index < columns.length; index += 1) {
    if (columns[index].binding === normalized) return columns[index].header;
  }
  return String(binding);
}

function formatText(text, data) {
  return String(text == null ? '' : text).replace(/\{([^}]+)\}/g, function(match, key) {
    return data && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : match;
  });
}

function matchesRemoteFilterRule(row, rule) {
  var rawActual = row[rule.field];
  var actual = rawActual == null ? '' : String(rawActual).toLowerCase();
  var expected = String(rule.value).toLowerCase();
  var comparableActual = typeof rawActual === 'number' ? rawActual : actual;
  var comparableExpected = typeof rawActual === 'number' ? Number(rule.value) : expected;
  if (rule.op === 'contains') return actual.indexOf(expected) >= 0;
  if (rule.op === 'ends') return actual.lastIndexOf(expected) === actual.length - expected.length;
  if (rule.op === 'not-starts') return actual.indexOf(expected) !== 0;
  if (rule.op === 'not-contains') return actual.indexOf(expected) < 0;
  if (rule.op === 'not-ends') return actual.lastIndexOf(expected) !== actual.length - expected.length;
  if (rule.op === 'gte') return comparableActual >= comparableExpected;
  if (rule.op === 'gt') return comparableActual > comparableExpected;
  if (rule.op === 'lte') return comparableActual <= comparableExpected;
  if (rule.op === 'lt') return comparableActual < comparableExpected;
  if (rule.op === 'ne') return comparableActual !== comparableExpected;
  if (rule.op === 'eq') return comparableActual === comparableExpected;
  return actual.indexOf(expected) === 0;
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
    { binding: 'code', header: headers.code, width: 96, minWidth: 70, dataType: 'string' },
    { binding: 'orderNo', header: headers.orderNo, width: 128, minWidth: 100, dataType: 'string' },
    { binding: 'customer', header: headers.customer, width: 90, minWidth: 80, dataType: 'string' },
    { binding: 'name', header: headers.lookupName, width: 100, minWidth: 80, dataType: 'string' },
    { binding: 'qty', header: headers.qty, width: 96, minWidth: 80, align: 'right', dataType: 'number' },
    { binding: 'available', header: headers.available, width: 96, minWidth: 80, align: 'right', dataType: 'number' },
    { binding: 'price', header: headers.price, width: 84, minWidth: 70, align: 'right', dataType: 'number' },
    { binding: 'status', header: headers.stus, width: 96, minWidth: 80, dataType: 'string' }
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

</script>

<style>
@import '../src/fabui.css';
@import './style/my.icon.css';
@import './style/style.css';
</style>
