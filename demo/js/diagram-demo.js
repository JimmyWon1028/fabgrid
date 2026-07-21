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
      id: 'title',
      type: 'text',
      text: '生產製造流程',
      x: 210,
      y: 30,
      width: 700,
      height: 55,
      fill: '#ffffff',
      stroke: '#ffffff'
    }, {
      id: 'customer-order',
      type: 'terminator',
      text: '客戶訂單',
      x: 40,
      y: 115,
      width: 160,
      height: 70,
      fill: '#dbeafe',
      stroke: '#2563eb'
    }, {
      id: 'stock-quantity',
      type: 'database',
      text: '庫存生產數量',
      x: 40,
      y: 235,
      width: 160,
      height: 80,
      fill: '#e0f2fe',
      stroke: '#0284c7'
    }, {
      id: 'manufacturing-order',
      type: 'process',
      text: '開立製令',
      x: 250,
      y: 170,
      width: 170,
      height: 80,
      fill: '#dcfce7',
      stroke: '#16a34a'
    }, {
      id: 'manufacturing-details',
      type: 'document',
      text: '投料日(預計開始日)\n需求日(預計完工日)\n完工日\n工序版型，配料，員工 機台，機台使用批次(年度)',
      x: 450,
      y: 105,
      width: 330,
      height: 220,
      fill: '#fef3c7',
      stroke: '#d97706'
    }, {
      id: 'warehouse-issue',
      type: 'process',
      text: '倉庫：領料\n投入生產',
      x: 810,
      y: 165,
      width: 190,
      height: 100,
      fill: '#f3e8ff',
      stroke: '#9333ea'
    }, {
      id: 'deduct-stock',
      type: 'database',
      text: '扣庫存',
      x: 810,
      y: 330,
      width: 190,
      height: 70,
      fill: '#fee2e2',
      stroke: '#dc2626'
    }, {
      id: 'first-operation',
      type: 'roundedRectangle',
      text: '投料量\n紀錄第一工序',
      x: 810,
      y: 465,
      width: 190,
      height: 90,
      fill: '#dcfce7',
      stroke: '#16a34a'
    }, {
      id: 'production-operation',
      type: 'process',
      text: '生產工序N',
      x: 570,
      y: 475,
      width: 170,
      height: 70,
      fill: '#dbeafe',
      stroke: '#2563eb'
    }, {
      id: 'production-progress',
      type: 'process',
      text: '生產進度(進度)\n損耗數量',
      x: 330,
      y: 455,
      width: 180,
      height: 110,
      fill: '#fef9c3',
      stroke: '#ca8a04'
    }, {
      id: 'finished-stock',
      type: 'terminator',
      text: '完工入庫',
      x: 70,
      y: 475,
      width: 180,
      height: 70,
      fill: '#dcfce7',
      stroke: '#16a34a'
    }, {
      id: 'finished-writeback',
      type: 'document',
      text: '完工入庫\n回寫完工數量\n檢查是否結案',
      x: 70,
      y: 620,
      width: 220,
      height: 100,
      fill: '#f3e8ff',
      stroke: '#9333ea'
    }, {
      id: 'close-order',
      type: 'decision',
      text: '制令結案:\n1. 產出數量 = 預計生產量\n2. 經紗用完\n3. 手動結案',
      x: 360,
      y: 595,
      width: 250,
      height: 140,
      fill: '#fef3c7',
      stroke: '#d97706'
    }, {
      id: 'order-note',
      type: 'document',
      text: '製令只能一個料號\n如有插單, 改機台\n皆需開立新的製令',
      x: 700,
      y: 620,
      width: 260,
      height: 100,
      fill: '#fee2e2',
      stroke: '#dc2626'
    }],
    connectors: [{
      id: 'c1',
      from: 'customer-order',
      to: 'manufacturing-order'
    }, {
      id: 'c2',
      from: 'stock-quantity',
      to: 'manufacturing-order'
    }, {
      id: 'c3',
      from: 'manufacturing-order',
      to: 'manufacturing-details'
    }, {
      id: 'c4',
      from: 'manufacturing-details',
      to: 'warehouse-issue'
    }, {
      id: 'c5',
      from: 'warehouse-issue',
      to: 'first-operation'
    }, {
      id: 'c6',
      from: 'warehouse-issue',
      to: 'deduct-stock'
    }, {
      id: 'c7',
      from: 'first-operation',
      to: 'production-operation'
    }, {
      id: 'c8',
      from: 'production-operation',
      to: 'production-progress'
    }, {
      id: 'c9',
      from: 'production-progress',
      to: 'production-operation',
      type: 'curved',
      lineStyle: 'dashed'
    }, {
      id: 'c10',
      from: 'production-progress',
      to: 'finished-stock'
    }, {
      id: 'c11',
      from: 'finished-stock',
      to: 'finished-writeback'
    }]
  };

  function centerDiagramDataOnPaper(data, paper) {
    var nodes = data.nodes.map(function(node) {
      return Object.assign({}, node);
    });
    var connectors = data.connectors.map(function(connector) {
      return Object.assign({}, connector);
    });
    var bounds;
    var offsetX;
    var offsetY;
    if (!nodes.length || !paper) {
      return {
        nodes: nodes,
        connectors: connectors
      };
    }
    bounds = nodes.reduce(function(result, node) {
      result.left = Math.min(result.left, node.x);
      result.top = Math.min(result.top, node.y);
      result.right = Math.max(result.right, node.x + node.width);
      result.bottom = Math.max(result.bottom, node.y + node.height);
      return result;
    }, {
      left: Infinity,
      top: Infinity,
      right: -Infinity,
      bottom: -Infinity
    });
    offsetX = (paper.width - (bounds.right - bounds.left)) / 2 - bounds.left;
    offsetY = (paper.height - (bounds.bottom - bounds.top)) / 2 - bounds.top;
    nodes.forEach(function(node) {
      node.x += offsetX;
      node.y += offsetY;
    });
    connectors.forEach(function(connector) {
      if (typeof connector.controlX === 'number') connector.controlX += offsetX;
      if (typeof connector.controlY === 'number') connector.controlY += offsetY;
    });
    return {
      nodes: nodes,
      connectors: connectors
    };
  }

  function mountDiagramDemo(fabui, demoOptions) {
    var themeSelect = document.getElementById('diagram-theme');
    var localeSelect = document.getElementById('diagram-locale');
    var dockModeSelect = document.getElementById('diagram-dock-mode');
    var readOnly = document.getElementById('diagram-readonly');
    var status = document.getElementById('diagram-status');
    var demoData = initialData;
    var diagram;

    function setStatus(message) {
      status.textContent = message;
    }

    function syncReadOnlyControl(value) {
      var control = readOnly.__fabuiDevControl;
      readOnly.checked = Boolean(value);
      if (!control || control.isChecked() === Boolean(value)) return;
      if (value) control.check();
      else control.uncheck();
    }

    if (!fabui || typeof fabui.Diagram !== 'function') {
      throw new Error('fabui.Diagram class is unavailable.');
    }

    diagram = new fabui.Diagram('#diagram', {
      height: 660,
      locale: localeSelect.value,
      sameSideDockMode: dockModeSelect ? dockModeSelect.value : 'tabs',
      toolboxStateKey: 'fabui.diagram.demo.toolbox',
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
        if (event.action === 'pageChange' &&
          typeof instance.fitToPage === 'function') {
          instance.fitToPage();
        }
      },
      onReadOnlyChanged: function(instance, event) {
        syncReadOnlyControl(event.readOnly);
      }
    });
    if (demoOptions && demoOptions.centerInitialData) {
      demoData = centerDiagramDataOnPaper(initialData, diagram.getPaper());
      diagram.setData(demoData);
    }
    if (typeof diagram.fitToPage === 'function') diagram.fitToPage();
    if (dockModeSelect && typeof diagram.getSameSideDockMode === 'function') {
      dockModeSelect.value = diagram.getSameSideDockMode();
    }

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

    if (dockModeSelect) {
      dockModeSelect.addEventListener('change', function() {
        diagram.setSameSideDockMode(dockModeSelect.value);
      });
    }

    readOnly.addEventListener('change', function() {
      diagram.setReadOnly(readOnly.checked);
    });

    document.getElementById('diagram-reset').addEventListener('click', function() {
      diagram.setData(demoData);
      if (typeof diagram.fitToPage === 'function') diagram.fitToPage();
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
