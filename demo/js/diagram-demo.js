(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black'
  ];
  var initialData = {
    nodes: [{
      id: 'start',
      type: 'terminator',
      text: '收到訂單',
      x: 80,
      y: 100,
      width: 150,
      height: 70,
      fill: '#dbeafe',
      stroke: '#2563eb'
    }, {
      id: 'review',
      type: 'process',
      text: '檢查庫存與付款',
      x: 330,
      y: 100,
      width: 180,
      height: 70,
      fill: '#dcfce7',
      stroke: '#16a34a'
    }, {
      id: 'decision',
      type: 'decision',
      text: '可以出貨？',
      x: 620,
      y: 80,
      width: 170,
      height: 110,
      fill: '#fef3c7',
      stroke: '#d97706'
    }, {
      id: 'ship',
      type: 'document',
      text: '建立出貨單',
      x: 900,
      y: 40,
      width: 170,
      height: 80,
      fill: '#f3e8ff',
      stroke: '#9333ea'
    }, {
      id: 'hold',
      type: 'roundedRectangle',
      text: '通知客戶等待',
      x: 900,
      y: 190,
      width: 170,
      height: 70,
      fill: '#fee2e2',
      stroke: '#dc2626'
    }, {
      id: 'archive',
      type: 'database',
      text: '訂單資料庫',
      x: 620,
      y: 290,
      width: 170,
      height: 100,
      fill: '#e0f2fe',
      stroke: '#0284c7'
    }, {
      id: 'notice',
      type: 'cloud',
      text: '外部通知',
      x: 900,
      y: 320,
      width: 170,
      height: 90,
      fill: '#fef9c3',
      stroke: '#ca8a04'
    }],
    connectors: [{
      id: 'c1',
      from: 'start',
      to: 'review'
    }, {
      id: 'c2',
      from: 'review',
      to: 'decision'
    }, {
      id: 'c3',
      from: 'decision',
      to: 'ship',
      text: '是'
    }, {
      id: 'c4',
      from: 'decision',
      to: 'hold',
      text: '否',
      lineStyle: 'dashed'
    }]
  };

  function mountDiagramDemo(fabui) {
    var themeSelect = document.getElementById('diagram-theme');
    var localeSelect = document.getElementById('diagram-locale');
    var readOnly = document.getElementById('diagram-readonly');
    var status = document.getElementById('diagram-status');
    var diagram;

    function setStatus(message) {
      status.textContent = message;
    }

    if (!fabui || typeof fabui.Diagram !== 'function') {
      throw new Error('fabui.Diagram class is unavailable.');
    }

    diagram = new fabui.Diagram('#diagram', {
      height: 660,
      locale: localeSelect.value,
      nodes: initialData.nodes,
      connectors: initialData.connectors,
      onSelectionChanged: function(instance, event) {
        setStatus(event.selections && event.selections.length > 1 ?
          '已選取 ' + event.selections.length + ' 個圖形' :
          event.item ?
          '選取：' + (event.item.text || event.item.id) :
          '未選取項目');
      },
      onChanged: function(instance, event) {
        setStatus('異動：' + event.action + '，節點 ' +
          event.data.nodes.length + '，連線 ' + event.data.connectors.length);
      }
    });

    themeSelect.addEventListener('change', function() {
      THEMES.forEach(function(theme) {
        document.body.classList.remove('fg-theme-' + theme);
      });
      document.body.classList.add('fg-theme-' + themeSelect.value);
      diagram.setTheme('inherit');
    });

    localeSelect.addEventListener('change', function() {
      diagram.setLocale(localeSelect.value);
    });

    readOnly.addEventListener('change', function() {
      diagram.setReadOnly(readOnly.checked);
    });

    document.getElementById('diagram-reset').addEventListener('click', function() {
      diagram.setData(initialData);
      setStatus('已還原範例流程');
    });

    document.getElementById('diagram-export-json').addEventListener('click', function() {
      diagram.export('fabui-diagram.json');
    });

    document.getElementById('diagram-export-svg').addEventListener('click', function() {
      diagram.exportSvg('fabui-diagram.svg');
    });

    document.getElementById('diagram-fit').addEventListener('click', function() {
      diagram.fitToContent();
    });

    global.fabuiDiagramDemo = diagram;
  }

  global.mountFabUIDiagramDemo = mountDiagramDemo;
}(typeof window !== 'undefined' ? window : this));
