(function(root, factory) {
  var locale = factory();
  root.fabui = root.fabui || {};
  root.fabui.FabGridLocales = root.fabui.FabGridLocales || {};
  root.fabui.FabGridLocales.en = locale;
  if (root.fabui.FabGrid && root.fabui.FabGrid.addLocale) {
    root.fabui.FabGrid.addLocale('en', locale);
  }
}(typeof window !== 'undefined' ? window : this, function() {
  return {
    emptyText: 'No data',
    chart: { emptyText: 'No data', value: 'Value', percent: 'Percent' },
    exportBusyText: 'Exporting Excel...',
    workingText: 'Working...',
    loadMsg: 'Processing, please wait...',
    pivot: {
      grandTotal: 'Grand Total',
      total: 'Total',
      expandGroup: 'Expand group',
      collapseGroup: 'Collapse group',
      showDetail: 'Show detail',
      detailTitle: 'Detail records',
      detailCount: '{count} records',
      closeDetail: 'Close detail',
      sortAscending: 'Sort ascending',
      sortDescending: 'Sort descending',
      aggregate: 'Aggregate',
      removeField: 'Remove field',
      filteredValues: 'Filtered',
      panel: {
        ariaLabel: 'Pivot view settings',
        fields: 'Fields',
        filters: 'Filters',
        rows: 'Rows',
        columns: 'Columns',
        values: 'Values',
        allValues: 'All',
        filterField: 'Filter {field}',
        aggregateMenu: 'Value aggregation settings',
        aggregateField: 'Set aggregation for {field}',
        dropFields: 'Drag fields here',
        noFields: 'No fields available',
        removeField: 'Remove field'
      },
      aggregates: {
        sum: 'Sum',
        count: 'Count',
        average: 'Average',
        min: 'Minimum',
        max: 'Maximum'
      }
    },
    pagination: {
      ariaLabel: 'Pagination',
      pageSize: 'Page size',
      pageNumber: 'Page number',
      beforePageText: 'Page',
      afterPageText: 'of {pages}',
      displayMsg: 'Displaying {from} to {to} of {total} items',
      first: 'First page',
      previous: 'Previous page',
      next: 'Next page',
      last: 'Last page',
      refresh: 'Refresh'
    },
    validation: {
      invalidValue: 'Invalid value',
      invalidDate: 'Invalid date',
      invalidYearMonth: 'Invalid year and month',
      invalidColor: 'Invalid color',
      comboboxLimitToList: 'Please select a valid item'
    },
    topLeftMenu: {
      ariaLabel: 'Grid menu',
      showSearchRow: 'Show search row',
      hideSearchRow: 'Hide search row',
      clearFilter: 'Clear filters',
      rowHeaders: 'Row headers',
      rowHeadersOff: 'Row headers: Off',
      rowHeadersNumbers: 'Row headers: Numbers',
      rowHeadersCellOnly: 'Row headers: Cells only',
      exportExcel: 'Export Excel',
      exportCsv: 'Export CSV',
      fullscreen: 'Grid fullscreen',
      exitFullscreen: 'Exit fullscreen'
    },
    aria: {
      cellEditor: 'Cell editor',
      openDatePicker: 'Open date picker',
      datePicker: 'Date picker',
      openComboBox: 'Open combo box',
      comboBoxOptions: 'Combo box options',
      openColorPicker: 'Open color picker',
      colorPicker: 'Color picker',
      openColumnChooser: 'Open column chooser',
      columnChooser: 'Column chooser',
      selectAllRows: 'Select all rows',
      selectRow: 'Select row {rowNumber}',
      rowDragItem: 'Grid row',
      expandNode: 'Expand node',
      collapseNode: 'Collapse node',
      year: 'Year'
    },
    filter: {
      openMenu: 'Open filter menu for {column}',
      searchValues: 'Search',
      selectAll: 'Select All',
      apply: 'Apply',
      cancel: 'Cancel',
      blankValue: '(Blanks)',
      startsWith: 'Starts with ({symbol})',
      contains: 'Contains ({symbol})',
      endsWith: 'Ends with ({symbol})',
      notStartsWith: 'Does not start with ({symbol})',
      notContains: 'Does not contain ({symbol})',
      notEndsWith: 'Does not end with ({symbol})',
      greaterThanOrEqual: '{symbol}',
      greaterThan: '{symbol}',
      lessThanOrEqual: '{symbol}',
      lessThan: '{symbol}',
      notEqual: '{symbol}',
      equal: '{symbol}',
      clear: 'Clear'
    },
    datebox: {
      today: 'Today',
      close: 'Close',
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ],
      monthTitle: '{month} {year}'
    }
  };
}));
