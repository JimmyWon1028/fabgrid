(function() {
  'use strict';

  var DEMO_ROW_COUNT = 1000;
  var DEMO_COLUMN_COUNT = 30;
  var DEMO_SETTINGS_KEY = 'fastgrid.demo.settings.v1';
  var DEFAULT_DEMO_SETTINGS = {
    locale: 'zh-TW',
    theme: 'default',
    searchText: '',
    frozenColumns: 2,
    frozenRightColumns: 1,
    showRowHeaders: false,
    multiSelectRows: false,
    editMode: true
  };
  var DEMO_LOCALES = {
    en: {
      search: 'Search',
      searchPlaceholder: 'Keyword',
      language: 'Language',
      theme: 'Theme',
      frozen: 'Frozen',
      frozenRight: 'Right frozen',
      rowHeaders: 'Row no.',
      multiSelect: 'Multi select',
      editMode: 'Edit',
      exportCsv: 'Export CSV',
      exportExcel: 'Export Excel',
      rows: 'Rows',
      rowsVisible: 'Rows visible',
      columnsVisible: 'Columns visible',
      renderedCells: 'Rendered cells',
      columnHeaders: {
        id: 'ID',
        name: 'Customer Name',
        region: 'Region',
        status: 'Status',
        category: 'Category',
        amount: 'Amount (sync)',
        score: 'Score (async)',
        textDate: 'Text date',
        date: 'Date',
        defaultColumn: 'Column {index}'
      }
    },
    'zh-TW': {
      search: '搜尋',
      searchPlaceholder: '輸入關鍵字',
      language: '語言',
      theme: '主題',
      frozen: '凍結欄',
      frozenRight: '右凍結欄',
      rowHeaders: '列號',
      multiSelect: '多選',
      editMode: '編輯',
      exportCsv: '匯出 CSV',
      exportExcel: '匯出 Excel',
      rows: '列數',
      rowsVisible: '可視列',
      columnsVisible: '可視欄',
      renderedCells: '已渲染儲存格',
      columnHeaders: {
        id: 'ID',
        name: '客戶名稱',
        region: '區域',
        status: '狀態',
        category: '分類',
        amount: '金額(同步)',
        score: '分數(非同步)',
        textDate: '文字日期',
        date: '日期',
        defaultColumn: '欄位 {index}'
      }
    }
  };
  var DEMO_THEMES = [
    { value: 'default', label: 'Default' },
    { value: 'bootstrap', label: 'Bootstrap' },
    { value: 'cupertino', label: 'Cupertino' },
    { value: 'material', label: 'Material' },
    { value: 'material-blue', label: 'Material Blue' },
    { value: 'material-teal', label: 'Material Teal' },
    { value: 'metro', label: 'Metro' },
    { value: 'metro-blue', label: 'Metro Blue' },
    { value: 'metro-gray', label: 'Metro Gray' },
    { value: 'metro-green', label: 'Metro Green' },
    { value: 'metro-orange', label: 'Metro Orange' },
    { value: 'metro-red', label: 'Metro Red' },
    { value: 'sunny', label: 'Sunny' },
    { value: 'pepper-grinder', label: 'Pepper Grinder' },
    { value: 'dark-hive', label: 'Dark Hive' },
    { value: 'black', label: 'Black' }
  ];
  var rows = createRows(DEMO_ROW_COUNT, DEMO_COLUMN_COUNT);
  var columns = createColumns(DEMO_COLUMN_COUNT);
  var stats = {
    datasetSummary: document.getElementById('datasetSummary'),
    rowCount: document.getElementById('rowCount'),
    rowRange: document.getElementById('rowRange'),
    columnRange: document.getElementById('columnRange'),
    cellCount: document.getElementById('cellCount')
  };
  var controls = {
    search: document.getElementById('searchInput'),
    language: document.getElementById('languageInput'),
    theme: document.getElementById('themeInput'),
    frozen: document.getElementById('frozenInput'),
    frozenRight: document.getElementById('frozenRightInput'),
    rowHeaders: document.getElementById('rowHeadersInput'),
    multiSelect: document.getElementById('multiSelectInput'),
    editMode: document.getElementById('editModeInput')
  };
  var labels = {
    search: document.getElementById('searchLabel'),
    language: document.getElementById('languageLabel'),
    theme: document.getElementById('themeLabel'),
    frozen: document.getElementById('frozenLabel'),
    frozenRight: document.getElementById('frozenRightLabel'),
    rowHeaders: document.getElementById('rowHeadersLabel'),
    multiSelect: document.getElementById('multiSelectLabel'),
    editMode: document.getElementById('editModeLabel'),
    exportCsv: document.getElementById('exportButton'),
    exportExcel: document.getElementById('exportExcelButton')
  };
  var toolbarControls = document.querySelectorAll('.toolbar input, .toolbar select, .toolbar button');

  loadDemoThemeStyles();
  populateThemeOptions();

  var demoSettings = loadDemoSettings();

  applyDemoSettingsToControls(demoSettings);
  applyDemoLocale(demoSettings.locale);
  applyColumnHeaderLocale(columns, demoSettings.locale);

  var grid = new FastGrid('#grid', {
    rowHeight: 32,
    headerHeight: 36,
    overscanRows: 14,
    overscanColumns: 3,
    frozenColumns: demoSettings.frozenColumns,
    frozenRightColumns: demoSettings.frozenRightColumns,
    locale: demoSettings.locale,
    showRowHeaders: demoSettings.showRowHeaders,
    showFooter: true,
    footerHeight: 28,
    multiSelectRows: demoSettings.multiSelectRows,
    itemsSource: rows,
    columns: columns,
    allowSorting: true,
    allowEditing: demoSettings.editMode,
    editOnSelect: demoSettings.editMode,
    allowResizing: true,
    alternatingRows: true,
    alternatingRowBackground: '#fafafa',
    headerToggleKey: 'F4', //'Ctrl+F4'
    formatCell: function(args) {
      if (args.column.binding === 'status') {
        args.cell.className += args.value === 'Active' ? ' status-active' : ' status-paused';
      }
    }
  });
  applyDemoTheme(demoSettings.theme);
  if (demoSettings.searchText) {
    grid.setSearch(demoSettings.searchText);
  }

  updateDatasetSummary();
  updateViewportStats({
    totalRows: grid.view.length,
    rowStart: grid.rowRange.start,
    rowEnd: grid.rowRange.end,
    columnStart: grid.columnRange.start,
    columnEnd: grid.columnRange.end,
    renderedCells: grid.root.querySelectorAll('.fg-cell').length
  });

  grid.on('viewportChanged', updateViewportStats);

  grid.on('excelExporting', function() {
    setToolbarBusy(true);
  });

  grid.on('excelExported', function() {
    setToolbarBusy(false);
  });

  grid.on('excelExportFailed', function() {
    setToolbarBusy(false);
  });

  controls.search.addEventListener('input', function(event) {
    grid.setSearch(event.target.value);
    saveCurrentDemoSettings();
  });

  controls.language.addEventListener('change', function(event) {
    var locale = normalizeLocaleSetting(event.target.value, DEFAULT_DEMO_SETTINGS.locale);
    grid.setLocale(locale);
    applyDemoLocale(locale);
    applyGridColumnHeaderLocale(grid, locale);
    saveCurrentDemoSettings();
    updateViewportStats({
      totalRows: grid.view.length,
      rowStart: grid.rowRange.start,
      rowEnd: grid.rowRange.end,
      columnStart: grid.columnRange.start,
      columnEnd: grid.columnRange.end,
      renderedCells: grid.root.querySelectorAll('.fg-cell').length
    });
  });

  controls.theme.addEventListener('change', function(event) {
    applyDemoTheme(event.target.value);
    saveCurrentDemoSettings();
  });

  controls.frozen.addEventListener('input', function(event) {
    grid.setFrozenColumns(Number(event.target.value || 0));
    saveCurrentDemoSettings();
  });

  controls.frozenRight.addEventListener('input', function(event) {
    grid.setFrozenRightColumns(Number(event.target.value || 0));
    saveCurrentDemoSettings();
  });

  controls.rowHeaders.addEventListener('change', function(event) {
    grid.setShowRowHeaders(event.target.checked);
    saveCurrentDemoSettings();
  });

  controls.multiSelect.addEventListener('change', function(event) {
    grid.setMultiSelectRows(event.target.checked);
    saveCurrentDemoSettings();
  });

  controls.editMode.addEventListener('change', function(event) {
    grid.setEditMode(event.target.checked);
    saveCurrentDemoSettings();
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
    columns: columns,
    themes: DEMO_THEMES
  };

  function createColumns(count) {
    var columns = [
      { binding: 'id', header: 'ID', width: 72, minWidth: 56, align: 'center', dataType: 'number', readOnly: true },
      { binding: 'name', header: '客戶名稱', width: 160, minWidth: 100, dataType: 'string', editor: 'textbox' },
      { binding: 'region', header: '區域', width: 110, minWidth: 80, dataType: 'string', readOnly: true },
      {
        binding: 'status',
        header: '狀態',
        width: 120,
        minWidth: 90,
        dataType: 'string',
        editor: {
          type: 'combobox',
          valueField: 'id',
          textField: 'descr',
          showValueInList: false,
          data: [
            { id: 'Active', descr: '啟用' },
            { id: 'Paused', descr: '暫停' },
            { id: 'Pending', descr: '待確認' }
          ]
        }
      },
      {
        binding: 'category',
        header: '分類',
        width: 110,
        minWidth: 90,
        dataType: 'string',
        editor: {
          type: 'combobox',
          valueField: 'id',
          textField: 'descr',
          limitToList: true,
          showValueInList: true,
          limitToListMessage: '分類必須是買賣或加工',
          data: [
            { id: '1', descr: '買賣' },
            { id: '2', descr: '加工' }
          ]
        }
      },
      {
        binding: 'amount',
        header: '金額(同步)',
        width: 120,
        minWidth: 90,
        align: 'right',
        dataType: 'number',
        aggregate: 'sum',
        thousandsSeparator: true,
        precision: 2,
        editor: {
          type: 'numberbox'
        },
        validate: function(args) {
          var value = args.value;
          if (value != null && (!isFinite(value) || value < 0 || value > 1000000)) {
            return {
              type: 'range',
              message: '金額必須介於 0 到 1,000,000',
              value: args.value
            };
          }
          return null;
        }
      },
      {
        binding: 'score',
        header: '分數(非同步)',
        width: 120,
        minWidth: 100,
        align: 'right',
        dataType: 'number',
        aggregate: 'avg',
        editor: 'numberbox',
        validate: function(args) {
          return new Promise(function(resolve) {
            var value = args.value;
            setTimeout(function() {
              if (value != null && (!isFinite(value) || value < 0 || value > 100)) {
                resolve({
                  type: 'range',
                  message: '分數必須介於 0 到 100',
                  value: args.value
                });
                return;
              }
              resolve(null);
            }, 120);
          });
        },
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
      {
        binding: 'date',
        header: '日期',
        width: 120,
        minWidth: 100,
        dataType: 'date',
        editor: 'datebox',
        mask: '9999-99-99'
      }
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
    var categories = ['1', '2'];
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
        category: categories[i % categories.length],
        amount: Math.round((i * 137.89) % 950000),
        score: (i * 17) % 100,
        textDate: '202607' + pad((i % 28) + 1),
        date: '2026-07-' + pad((i % 28) + 1)
      };
      for (c = 10; c <= columnCount; c += 1) {
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

  function loadDemoSettings() {
    var settings = null;
    var raw;
    try {
      raw = window.localStorage ? window.localStorage.getItem(DEMO_SETTINGS_KEY) : '';
      settings = raw ? JSON.parse(raw) : null;
    } catch (error) {
      settings = null;
    }
    return normalizeDemoSettings(settings);
  }

  function saveCurrentDemoSettings() {
    saveDemoSettings({
      locale: controls.language.value,
      theme: controls.theme.value,
      searchText: controls.search.value,
      frozenColumns: controls.frozen.value,
      frozenRightColumns: controls.frozenRight.value,
      showRowHeaders: controls.rowHeaders.checked,
      multiSelectRows: controls.multiSelect.checked,
      editMode: controls.editMode.checked
    });
  }

  function saveDemoSettings(settings) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(DEMO_SETTINGS_KEY, JSON.stringify(normalizeDemoSettings(settings)));
      }
    } catch (error) {
      return;
    }
  }

  function applyDemoSettingsToControls(settings) {
    controls.language.value = settings.locale;
    controls.theme.value = settings.theme;
    controls.search.value = settings.searchText;
    controls.frozen.value = settings.frozenColumns;
    controls.frozenRight.value = settings.frozenRightColumns;
    controls.rowHeaders.checked = settings.showRowHeaders;
    controls.multiSelect.checked = settings.multiSelectRows;
    controls.editMode.checked = settings.editMode;
  }

  function normalizeDemoSettings(settings) {
    settings = settings || {};
    return {
      locale: normalizeLocaleSetting(settings.locale, DEFAULT_DEMO_SETTINGS.locale),
      theme: normalizeThemeSetting(settings.theme, DEFAULT_DEMO_SETTINGS.theme),
      searchText: settings.searchText == null ? DEFAULT_DEMO_SETTINGS.searchText : String(settings.searchText),
      frozenColumns: normalizeNumberSetting(settings.frozenColumns, DEFAULT_DEMO_SETTINGS.frozenColumns, 0, 6),
      frozenRightColumns: normalizeNumberSetting(settings.frozenRightColumns, DEFAULT_DEMO_SETTINGS.frozenRightColumns, 0, 6),
      showRowHeaders: normalizeBooleanSetting(settings.showRowHeaders, DEFAULT_DEMO_SETTINGS.showRowHeaders),
      multiSelectRows: normalizeBooleanSetting(settings.multiSelectRows, DEFAULT_DEMO_SETTINGS.multiSelectRows),
      editMode: normalizeBooleanSetting(settings.editMode, DEFAULT_DEMO_SETTINGS.editMode)
    };
  }

  function normalizeNumberSetting(value, defaultValue, min, max) {
    value = Number(value);
    if (!isFinite(value)) {
      value = defaultValue;
    }
    value = Math.round(value);
    return Math.max(min, Math.min(max, value));
  }

  function normalizeBooleanSetting(value, defaultValue) {
    if (value === true || value === false) {
      return value;
    }
    return defaultValue;
  }

  function normalizeLocaleSetting(value, defaultValue) {
    var text = value == null ? '' : String(value);
    return DEMO_LOCALES[text] ? text : defaultValue;
  }

  function normalizeThemeSetting(value, defaultValue) {
    var text = value == null ? '' : String(value);
    var i;
    for (i = 0; i < DEMO_THEMES.length; i += 1) {
      if (DEMO_THEMES[i].value === text) {
        return text;
      }
    }
    return defaultValue;
  }

  function populateThemeOptions() {
    var fragment = document.createDocumentFragment();
    var option;
    var i;
    controls.theme.textContent = '';
    for (i = 0; i < DEMO_THEMES.length; i += 1) {
      option = document.createElement('option');
      option.value = DEMO_THEMES[i].value;
      option.textContent = DEMO_THEMES[i].label;
      fragment.appendChild(option);
    }
    controls.theme.appendChild(fragment);
  }

  function loadDemoThemeStyles() {
    var version = '20260708-demo-themes';
    var theme;
    var link;
    var i;
    for (i = 0; i < DEMO_THEMES.length; i += 1) {
      theme = DEMO_THEMES[i].value;
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '../dist/themes/fastgrid.' + theme + '.css?v=' + version;
      document.head.appendChild(link);
    }
  }

  function applyDemoTheme(theme) {
    var i;
    theme = normalizeThemeSetting(theme, DEFAULT_DEMO_SETTINGS.theme);
    controls.theme.value = theme;
    if (!grid || !grid.root) {
      return;
    }
    for (i = 0; i < DEMO_THEMES.length; i += 1) {
      grid.root.classList.remove('fg-theme-' + DEMO_THEMES[i].value);
    }
    grid.root.classList.add('fg-theme-' + theme);
  }

  function getDemoText(key) {
    var pack = getDemoLocalePack(controls.language.value);
    return pack[key] || key;
  }

  function getDemoLocalePack(locale) {
    locale = normalizeLocaleSetting(locale, DEFAULT_DEMO_SETTINGS.locale);
    return DEMO_LOCALES[locale] || DEMO_LOCALES[DEFAULT_DEMO_SETTINGS.locale];
  }

  function formatDemoText(text, data) {
    return String(text == null ? '' : text).replace(/\{([^}]+)\}/g, function(match, key) {
      return data && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : match;
    });
  }

  function applyDemoLocale(locale) {
    locale = normalizeLocaleSetting(locale, DEFAULT_DEMO_SETTINGS.locale);
    controls.language.value = locale;
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-Hant';
    labels.search.textContent = getDemoText('search');
    labels.language.textContent = getDemoText('language');
    labels.theme.textContent = getDemoText('theme');
    labels.frozen.textContent = getDemoText('frozen');
    labels.frozenRight.textContent = getDemoText('frozenRight');
    labels.rowHeaders.textContent = getDemoText('rowHeaders');
    labels.multiSelect.textContent = getDemoText('multiSelect');
    labels.editMode.textContent = getDemoText('editMode');
    labels.exportCsv.textContent = getDemoText('exportCsv');
    labels.exportExcel.textContent = getDemoText('exportExcel');
    controls.search.setAttribute('placeholder', getDemoText('searchPlaceholder'));
  }

  function applyGridColumnHeaderLocale(targetGrid, locale) {
    applyColumnHeaderLocale(columns, locale);
    applyColumnHeaderLocale(targetGrid.columns, locale);
    if (targetGrid.root) {
      targetGrid.renderHeaders(targetGrid.columnRange);
    }
  }

  function applyColumnHeaderLocale(targetColumns, locale) {
    var i;
    var column;
    if (!targetColumns) {
      return;
    }
    for (i = 0; i < targetColumns.length; i += 1) {
      column = targetColumns[i];
      column.header = getColumnHeaderText(column, locale);
    }
  }

  function getColumnHeaderText(column, locale) {
    var headers = getDemoLocalePack(locale).columnHeaders || {};
    var binding = column && column.binding ? String(column.binding) : '';
    var index;
    if (Object.prototype.hasOwnProperty.call(headers, binding)) {
      return headers[binding];
    }
    index = getColumnNumberFromBinding(binding);
    if (index != null) {
      return formatDemoText(headers.defaultColumn || 'Column {index}', { index: index });
    }
    return column && column.header ? column.header : binding;
  }

  function getColumnNumberFromBinding(binding) {
    var match = String(binding || '').match(/^col0*(\d+)$/);
    return match ? Number(match[1]) : null;
  }

  function updateDatasetSummary() {
    if (stats.datasetSummary) {
      stats.datasetSummary.textContent = rows.length + ' x ' + columns.length;
    }
  }

  function updateViewportStats(e) {
    stats.rowCount.textContent = getDemoText('rows') + ': ' + e.totalRows + ' / ' + rows.length;
    stats.rowRange.textContent = getDemoText('rowsVisible') + ': ' + e.rowStart + '-' + Math.max(e.rowStart, e.rowEnd - 1);
    stats.columnRange.textContent = getDemoText('columnsVisible') + ': ' + e.columnStart + '-' + Math.max(e.columnStart, e.columnEnd - 1) + ' / ' + columns.length;
    stats.cellCount.textContent = getDemoText('renderedCells') + ': ' + e.renderedCells;
  }
}());
