import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import fabui from '../src/fabui.js';
import {
  calculateDiagramConnectorPath,
  calculateDiagramNodeResize,
  createDiagramFactory,
  findDiagramNodesInRect,
  getDiagramConnectionPoint,
  getDiagramShapeBoundaryPoint,
  normalizeDiagramData,
  normalizeDiagramLocale,
  normalizeDiagramTheme
} from '../src/diagram/diagram.js';

test('FabUI core publishes Diagram as a Control', function() {
  assert.equal(typeof fabui.Diagram, 'function');
  assert.equal(Object.getPrototypeOf(fabui.Diagram.prototype), fabui.Control.prototype);
});

test('Diagram exposes the documented overview defaults', function() {
  assert.equal(fabui.Diagram.defaults.showGrid, true);
  assert.equal(fabui.Diagram.defaults.snapToGrid, true);
  assert.equal(fabui.Diagram.defaults.gridSize, 20);
  assert.equal(fabui.Diagram.defaults.toolbox, true);
  assert.equal(fabui.Diagram.defaults.propertiesPanel, true);
  assert.equal(fabui.Diagram.defaults.readOnly, false);
  assert.equal(fabui.Diagram.defaults.paperSize, 'A4');
  assert.equal(fabui.Diagram.defaults.paperOrientation, 'landscape');
  assert.equal(fabui.Diagram.defaults.pageWidth, 1123);
  assert.equal(fabui.Diagram.defaults.pageHeight, 794);
  assert.deepEqual(fabui.Diagram.paperSizes.A4, {
    width: 794,
    height: 1123
  });
  assert.equal(fabui.Diagram.shapes.length, 44);
  assert.equal(fabui.Diagram.connectorTools.length, 1);
  assert.equal(fabui.Diagram.connectorTools[0].connectorType, 'curved');
  assert.ok(fabui.Diagram.shapes.some(function(shape) {
    return shape.type === 'database';
  }));
  assert.ok(fabui.Diagram.shapes.some(function(shape) {
    return shape.type === 'cloud';
  }));
  ['diamond', 'heart', 'octagon', 'arrowUp', 'arrowDown',
    'arrowUpDown', 'arrowLeftRight'].forEach(function(type) {
    assert.ok(fabui.Diagram.shapes.some(function(shape) {
      return shape.type === type && shape.category === 'general';
    }));
  });
  ['multipleDocuments', 'directData', 'internalStorage', 'paperTape',
    'manualOperation', 'storedData', 'sequentialData', 'merge',
    'onPageReference', 'summingJunction', 'orJunction'].forEach(function(type) {
    assert.ok(fabui.Diagram.shapes.some(function(shape) {
      return shape.type === type && shape.category === 'flowchart';
    }));
  });
  ['dfdEntity', 'dfdProcess', 'dfdDataStore'].forEach(function(type) {
    assert.ok(fabui.Diagram.shapes.some(function(shape) {
      return shape.type === type && shape.category === 'dfd';
    }));
  });
});

test('Diagram publishes complete locales and all themes', function() {
  assert.deepEqual(Object.keys(fabui.Diagram.locales), ['en', 'zh-TW', 'zh-CN']);
  assert.equal(fabui.Diagram.locales['zh-TW'].toolbox, '工具箱');
  assert.equal(fabui.Diagram.locales['zh-TW'].dfdDataFlow, '資料流');
  assert.equal(fabui.Diagram.locales['zh-CN'].properties, '属性');
  assert.equal(fabui.Diagram.themes.length, 16);
  assert.equal(normalizeDiagramTheme('pepper'), 'pepper-grinder');
  assert.equal(normalizeDiagramTheme(' BLACK '), 'black');
  assert.equal(normalizeDiagramLocale('zh_Hant_TW'), 'zh-TW');
  assert.equal(normalizeDiagramLocale('zh-Hans'), 'zh-CN');
});

test('Diagram normalizes nodes and only keeps valid connectors', function() {
  var source = {
    nodes: [
      { id: 'a', text: 'A', width: 10 },
      { id: 'b', text: 'B', type: 'decision' }
    ],
    edges: [
      { id: 'ab', from: 'a', to: 'b' },
      { id: 'missing', from: 'a', to: 'c' },
      { id: 'self', from: 'a', to: 'a' }
    ]
  };
  var result = normalizeDiagramData(source);
  assert.equal(result.nodes.length, 2);
  assert.equal(result.nodes[0].width, 40);
  assert.equal(result.nodes[1].type, 'decision');
  assert.deepEqual(result.connectors.map(function(item) { return item.id; }), ['ab']);
  assert.equal(source.nodes[0].width, 10);
});

test('Diagram connector paths and resize geometry are deterministic', function() {
  var from = { x: 0, y: 20, width: 100, height: 60 };
  var to = { x: 300, y: 20, width: 100, height: 60 };
  var geometry = calculateDiagramConnectorPath(from, to, 'orthogonal');
  var curved = calculateDiagramConnectorPath(from, to, 'curved');
  var resized = calculateDiagramNodeResize(from, 'nw', 30, 20, 40, 30);
  assert.equal(geometry.path, 'M 100 50 H 200 V 50 H 300');
  assert.match(curved.path, /^M 100 50 Q /);
  assert.notEqual(curved.label.y, 50);
  assert.deepEqual(geometry.start, { x: 100, y: 50 });
  assert.equal(resized.x, 30);
  assert.equal(resized.y, 40);
  assert.equal(resized.width, 70);
  assert.equal(resized.height, 40);
});

test('Diagram exposes six connection points and preserves explicit connector ports', function() {
  var node = { x: 20, y: 30, width: 120, height: 90 };
  var data = normalizeDiagramData({
    nodes: [
      { id: 'a', x: 20, y: 30, width: 120, height: 90 },
      { id: 'b', x: 300, y: 30, width: 120, height: 90 }
    ],
    connectors: [{
      id: 'ab',
      from: 'a',
      to: 'b',
      fromPoint: 'rightTop',
      toPoint: 'leftBottom'
    }]
  });
  var geometry = calculateDiagramConnectorPath(
    data.nodes[0],
    data.nodes[1],
    'straight',
    data.connectors[0].fromPoint,
    data.connectors[0].toPoint
  );
  assert.equal(fabui.Diagram.connectionPoints.length, 6);
  assert.deepEqual(getDiagramConnectionPoint(node, 'top'), { x: 80, y: 30 });
  assert.deepEqual(getDiagramConnectionPoint(node, 'rightBottom'), { x: 140, y: 90 });
  assert.deepEqual(geometry.start, { x: 140, y: 60 });
  assert.deepEqual(geometry.end, { x: 300, y: 90 });
});

test('Diagram DFD shapes remain editable node types', function() {
  var dfdTypes = ['dfdEntity', 'dfdProcess', 'dfdDataStore'];
  var data = normalizeDiagramData({
    nodes: dfdTypes.map(function(type, index) {
      return {
        id: 'dfd-' + index,
        type: type,
        text: 'DFD ' + index
      };
    })
  });
  assert.deepEqual(
    data.nodes.map(function(node) {
      return { type: node.type, text: node.text };
    }),
    [
      { type: 'dfdEntity', text: 'DFD 0' },
      { type: 'dfdProcess', text: 'DFD 1' },
      { type: 'dfdDataStore', text: 'DFD 2' }
    ]
  );
});

test('Diagram connector endpoints stay on each rendered shape boundary', function() {
  var ellipse = {
    type: 'ellipse',
    x: 0,
    y: 0,
    width: 120,
    height: 80
  };
  var decision = {
    type: 'decision',
    x: 200,
    y: 0,
    width: 120,
    height: 80
  };
  var ellipsePoint = getDiagramConnectionPoint(ellipse, 'rightTop');
  var decisionPoint = getDiagramShapeBoundaryPoint(decision, { x: 100, y: 40 });
  var ellipseEquation =
    Math.pow((ellipsePoint.x - 60) / 60, 2) +
    Math.pow((ellipsePoint.y - 40) / 40, 2);
  assert.ok(Math.abs(ellipseEquation - 1) < 0.000001);
  assert.deepEqual(decisionPoint, { x: 200, y: 40 });
  assert.ok(ellipsePoint.x < 120);
});

test('Diagram marquee selection returns every intersecting node', function() {
  var nodes = [
    { id: 'a', x: 20, y: 20, width: 80, height: 50 },
    { id: 'b', x: 140, y: 20, width: 80, height: 50 },
    { id: 'c', x: 280, y: 20, width: 80, height: 50 }
  ];
  assert.deepEqual(
    findDiagramNodesInRect(nodes, { x: 10, y: 10, width: 210, height: 80 })
      .map(function(node) { return node.id; }),
    ['a', 'b']
  );
  assert.deepEqual(
    findDiagramNodesInRect(nodes, { x: 230, y: 90, width: -100, height: -80 })
      .map(function(node) { return node.id; }),
    ['b']
  );
});

test('Diagram factory exposes data, history, editing and export APIs', function() {
  function Control() {
    this._managedEventListeners = [];
  }
  Control.prototype.addEventListener = function() {};
  Control.prototype.removeEventListener = function() {};
  function Button() {}
  function EditBox() {}
  function Window() {}
  var Diagram = createDiagramFactory(
    Control,
    function() {},
    function() {},
    Button,
    EditBox,
    Window
  );
  assert.equal(Diagram.prototype.dispose, Diagram.prototype.destroy);
  assert.equal(typeof Diagram.prototype.addNode, 'function');
  assert.equal(typeof Diagram.prototype.addConnector, 'function');
  assert.equal(typeof Diagram.prototype.getSelections, 'function');
  assert.equal(typeof Diagram.prototype.undo, 'function');
  assert.equal(typeof Diagram.prototype.redo, 'function');
  assert.equal(typeof Diagram.prototype.fitToContent, 'function');
  assert.equal(typeof Diagram.prototype.exportSvg, 'function');
  assert.equal(typeof Diagram.prototype.import, 'function');
  assert.equal(typeof Diagram.prototype.getPaper, 'function');
  assert.equal(typeof Diagram.prototype.setPaper, 'function');
});

test('Diagram source composes FabUI controls and manages pointer listeners by interaction', function() {
  var source = readFileSync(
    new URL('../src/diagram/diagram.js', import.meta.url),
    'utf8'
  );
  var css = readFileSync(
    new URL('../src/diagram/diagram.css', import.meta.url),
    'utf8'
  );
  assert.match(source, /control = new Button\(host/);
  assert.match(source, /new EditBox\(this\.toolboxSearchElement/);
  assert.match(source, /control = new EditBox\(input/);
  assert.match(source, /state\.window = new Window\(host/);
  assert.match(source, /state\.applyButton = new Button\(applyHost/);
  assert.match(source, /this\._lastItemClick\.type === 'canvas'/);
  assert.match(source, /new Button\(toggle/);
  assert.match(source, /data-diagram-toolbox-toggle/);
  assert.match(source, /data-diagram-connector-tool/);
  assert.match(source, /self\._createToolboxPreview\(shape\.type\)/);
  assert.match(source, /var circular = type === 'dfdProcess'/);
  assert.match(source, /connectorType: this\._connectMode \? this\._connectType/);
  assert.match(source, /this\._bindDocumentInteraction\(\)/);
  assert.match(source, /this\._unbindDocumentInteraction\(\)/);
  assert.match(source, /data-diagram-connection-point/);
  assert.match(source, /type: 'marquee'/);
  assert.match(source, /this\._beginConnectorTextEdit\(id\)/);
  assert.match(source, /this\._beginNodeTextEdit\(id\)/);
  assert.match(source, /source\.split\(\/\\r\?\\n\/\)/);
  assert.match(source, /new EditBox\(input/);
  assert.match(source, /registerControl\(this\.hostElement, this\)/);
  assert.match(source, /unregisterControl\(this\.hostElement, this\)/);
  assert.match(css, /var\(--fui-panel-bg/);
  assert.match(css, /var\(--fui-control-selected/);
  assert.match(css, /\.fui-diagram-connection-point/);
  assert.match(css, /\.fui-diagram-marquee/);
  assert.match(css, /\.fui-diagram-inline-text-editor/);
  assert.match(css, /\.fui-diagram-inline-node-editor \.fui-textbox/);
  assert.match(css, /\.fui-diagram-node-editing \.fui-diagram-node-text/);
  assert.match(css, /\.fui-diagram-toolbox-toggle\.fui-button/);
  assert.match(css, /\.fui-diagram-toolbox-items\[hidden\]/);
  assert.match(css, /\.fui-diagram-toolbox-preview-shape/);
  assert.match(css, /fill: none/);
  assert.doesNotMatch(css, /\.fui-diagram-toolbox-preview-shape \* \{[^}]*stroke:/);
  assert.match(css, /\.fui-diagram-shape-item-selected/);
  assert.match(css, /\.fui-diagram-paper-form/);
  assert.match(css, /\.fui-diagram-paper-actions/);
});

test('Diagram is wired into future browser, ESM and CSS builds', function() {
  var build = readFileSync(
    new URL('../build/build.cjs', import.meta.url),
    'utf8'
  );
  var javascriptEntry = readFileSync(
    new URL('../src/fabui.js', import.meta.url),
    'utf8'
  );
  var cssEntry = readFileSync(
    new URL('../src/fabui.css', import.meta.url),
    'utf8'
  );
  assert.match(build, /'diagram\/diagram\.js'/);
  assert.match(
    build,
    /global\.fabui\.Diagram = createDiagramFactory\([^;]+global\.fabui\.Window/
  );
  assert.match(
    build,
    /var Diagram = createDiagramFactory\([^;]+Window/
  );
  assert.match(build, /Diagram: Diagram/);
  assert.match(javascriptEntry, /Diagram: Diagram/);
  assert.match(cssEntry, /diagram\/diagram\.css/);
});
