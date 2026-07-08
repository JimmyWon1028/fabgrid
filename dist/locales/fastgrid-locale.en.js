/*! FastGrid fastgrid-locale.en.js | performance-first data grid */
(function(root, factory) {
  var locale = factory();
  root.FastGridLocales = root.FastGridLocales || {};
  root.FastGridLocales.en = locale;
  if (root.FastGrid && root.FastGrid.addLocale) {
    root.FastGrid.addLocale('en', locale);
  }
}(typeof window !== 'undefined' ? window : this, function() {
  return {
    emptyText: 'No data',
    exportBusyText: 'Exporting Excel...',
    workingText: 'Working...',
    validation: {
      invalidValue: 'Invalid value',
      invalidDate: 'Invalid date',
      comboboxLimitToList: 'Please select a valid item'
    },
    aria: {
      cellEditor: 'Cell editor',
      openDatePicker: 'Open date picker',
      datePicker: 'Date picker',
      openComboBox: 'Open combo box',
      comboBoxOptions: 'Combo box options',
      selectAllRows: 'Select all rows',
      selectRow: 'Select row {rowNumber}',
      year: 'Year'
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
