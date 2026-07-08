(function(root, factory) {
  var locale = factory();
  root.FastGridLocales = root.FastGridLocales || {};
  root.FastGridLocales['zh-CN'] = locale;
  if (root.FastGrid && root.FastGrid.addLocale) {
    root.FastGrid.addLocale('zh-CN', locale);
  }
}(typeof window !== 'undefined' ? window : this, function() {
  return {
    emptyText: '没有数据',
    exportBusyText: '正在导出 Excel...',
    workingText: '处理中...',
    validation: {
      invalidValue: '输入值无效',
      invalidDate: '日期格式错误',
      comboboxLimitToList: '请从列表选择有效项目'
    },
    aria: {
      cellEditor: '单元格编辑器',
      openDatePicker: '打开日期选择器',
      datePicker: '日期选择器',
      openComboBox: '打开下拉菜单',
      comboBoxOptions: '下拉选项',
      selectAllRows: '选择所有行',
      selectRow: '选择第 {rowNumber} 行',
      year: '年份'
    },
    datebox: {
      today: '今天',
      close: '关闭',
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      months: [
        '一月',
        '二月',
        '三月',
        '四月',
        '五月',
        '六月',
        '七月',
        '八月',
        '九月',
        '十月',
        '十一月',
        '十二月'
      ],
      monthTitle: '{month} {year}'
    }
  };
}));
