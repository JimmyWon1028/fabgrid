(function(global) {
  'use strict';

  var WORKFLOW_VALUES = ['draft', 'pending', 'approved', 'closed'];
  var ROW_COUNT = 20000;
  var COLUMN_COUNT = 22;
  var VENDORS = [
    { code: '408042', name: '全得' },
    { code: '724001', name: '凱士' },
    { code: '114021', name: '凱銳' },
    { code: '307018', name: '翔曜' },
    { code: '520033', name: '瑞禾' }
  ];
  var DESCRIPTIONS = [
    '第一期工程款20%(未稅金額)',
    '第二期工程款60%(未稅金額)',
    '第三期工程款20%(未稅金額)',
    '工程款30%訂金',
    '工程款30%中款'
  ];
  var LOOKUP_CODES = ['2W001', 'WU001', 'CU004', 'BV001', 'RM001', 'RW001', 'JL001', 'JP001'];

  function createRows(count, columnCount, options) {
    var exactRowCount = options && options.exactRowCount === true;
    var rows = [];
    var row;
    var vendor;
    var groupIndex;
    var lineInGroup;
    var groupSize;
    var orderNo;
    var i;
    var c;
    for (i = 1; exactRowCount ? rows.length < count : i <= count; i += 1) {
      groupIndex = Math.floor((i - 1) / 3);
      lineInGroup = (i - 1) % 3;
      groupSize = groupIndex % 5 === 0 ? 1 : 3;
      vendor = VENDORS[groupIndex % VENDORS.length];
      orderNo = 'BO' + (2025000000 + groupIndex * 1005 + 27);
      row = {
        id: vendor.code,
        name: vendor.name,
        region: '',
        crncy: 'NTD',
        category: pad((lineInGroup + 1) * 10),
        refCode: orderNo,
        dlvno: orderNo,
        item: pad((lineInGroup + 1) * 10),
        cusno: LOOKUP_CODES[(groupIndex + lineInGroup) % LOOKUP_CODES.length],
        stus: WORKFLOW_VALUES[(groupIndex + lineInGroup) % WORKFLOW_VALUES.length],
        rem: DESCRIPTIONS[(groupIndex + lineInGroup) % DESCRIPTIONS.length],
        amount: groupSize === 1 ? 6700 : Math.round(((groupIndex + 3) * 374398.33) / groupSize),
        score: (i * 17) % 100,
        textDate: createTextDateValue(i),
        yearMonth: createYearMonthValue(i),
        yymm: createYearMonthValue(i),
        date: createOrderDateValue(groupIndex)
      };
      for (c = 10; c <= columnCount; c += 1) {
        row['col' + pad(c)] = c % 4 === 0 ? (i * c) % 10000 : 'R' + i + '-C' + c;
      }
      rows.push(row);
      if (groupSize === 1) {
        i += 2;
      }
    }
    return rows;
  }

  function createOrderDateValue(index) {
    var day = (index % 26) + 1;
    var month = index % 3 === 0 ? 4 : 5;
    return '2026-' + pad(month) + '-' + pad(day);
  }

  function createTextDateValue(index) {
    if (index % 9 === 0) {
      return '2025' + pad((index % 12) + 1) + pad((index % 28) + 1);
    }
    if (index % 5 === 0) {
      return '202606' + pad((index % 28) + 1);
    }
    return '202607' + pad((index % 28) + 1);
  }

  function createYearMonthValue(index) {
    if (index % 9 === 0) {
      return '2025' + pad((index % 12) + 1);
    }
    if (index % 5 === 0) {
      return '202606';
    }
    return '202607';
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  global.FabGridDemoData = {
    rowCount: ROW_COUNT,
    columnCount: COLUMN_COUNT,
    rows: createRows(ROW_COUNT, COLUMN_COUNT, { exactRowCount: true }),
    workflowValues: WORKFLOW_VALUES.slice()
  };
}(window));
