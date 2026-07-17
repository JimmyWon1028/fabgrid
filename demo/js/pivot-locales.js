export const PIVOT_DEMO_LOCALES = {
  'zh-TW': {
    chartTypeLabel: '圖表類型',
    chartTypes: {
      Column: '直條圖',
      Bar: '橫條圖',
      Line: '折線圖',
      Pie: '圓餅圖'
    }
  },
  'zh-CN': {
    chartTypeLabel: '图表类型',
    chartTypes: {
      Column: '柱状图',
      Bar: '条形图',
      Line: '折线图',
      Pie: '饼图'
    }
  },
  en: {
    chartTypeLabel: 'Chart type',
    chartTypes: {
      Column: 'Column',
      Bar: 'Bar',
      Line: 'Line',
      Pie: 'Pie'
    }
  }
};

export function getPivotDemoLocale(locale) {
  return PIVOT_DEMO_LOCALES[locale] || PIVOT_DEMO_LOCALES.en;
}
