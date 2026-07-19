var DIAGRAM_THEMES = [
  'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
  'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
  'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
  'black'
];
var DIAGRAM_SVG_NS = 'http://www.w3.org/2000/svg';
var nextDiagramItemId = 1;
var nextDiagramInstanceId = 1;
var DIAGRAM_PAPER_SIZES = {
  A3: { width: 1123, height: 1587 },
  A4: { width: 794, height: 1123 },
  A5: { width: 559, height: 794 },
  Letter: { width: 816, height: 1056 },
  Legal: { width: 816, height: 1344 }
};
var DIAGRAM_SHAPES = [
  { type: 'text', category: 'general', label: 'textShape' },
  { type: 'rectangle', category: 'general', label: 'rectangle' },
  { type: 'ellipse', category: 'general', label: 'ellipse' },
  { type: 'cross', category: 'general', label: 'cross' },
  { type: 'triangle', category: 'general', label: 'triangle' },
  { type: 'diamond', category: 'general', label: 'diamond' },
  { type: 'heart', category: 'general', label: 'heart' },
  { type: 'pentagon', category: 'general', label: 'pentagon' },
  { type: 'hexagon', category: 'general', label: 'hexagon' },
  { type: 'octagon', category: 'general', label: 'octagon' },
  { type: 'star', category: 'general', label: 'star' },
  { type: 'arrowUp', category: 'general', label: 'arrowUp' },
  { type: 'arrowDown', category: 'general', label: 'arrowDown' },
  { type: 'arrowLeft', category: 'general', label: 'arrowLeft' },
  { type: 'arrowRight', category: 'general', label: 'arrowRight' },
  { type: 'arrowUpDown', category: 'general', label: 'arrowUpDown' },
  { type: 'arrowLeftRight', category: 'general', label: 'arrowLeftRight' },
  { type: 'roundedRectangle', category: 'general', label: 'roundedRectangle' },
  { type: 'cloud', category: 'general', label: 'cloud' },
  { type: 'process', category: 'flowchart', label: 'process' },
  { type: 'decision', category: 'flowchart', label: 'decision' },
  { type: 'terminator', category: 'flowchart', label: 'terminator' },
  { type: 'predefinedProcess', category: 'flowchart', label: 'predefinedProcess' },
  { type: 'document', category: 'flowchart', label: 'document' },
  { type: 'multipleDocuments', category: 'flowchart', label: 'multipleDocuments' },
  { type: 'manualInput', category: 'flowchart', label: 'manualInput' },
  { type: 'preparation', category: 'flowchart', label: 'preparation' },
  { type: 'data', category: 'flowchart', label: 'dataShape' },
  { type: 'database', category: 'flowchart', label: 'database' },
  { type: 'directData', category: 'flowchart', label: 'directData' },
  { type: 'internalStorage', category: 'flowchart', label: 'internalStorage' },
  { type: 'paperTape', category: 'flowchart', label: 'paperTape' },
  { type: 'manualOperation', category: 'flowchart', label: 'manualOperation' },
  { type: 'delay', category: 'flowchart', label: 'delay' },
  { type: 'storedData', category: 'flowchart', label: 'storedData' },
  { type: 'sequentialData', category: 'flowchart', label: 'sequentialData' },
  { type: 'merge', category: 'flowchart', label: 'merge' },
  { type: 'onPageReference', category: 'flowchart', label: 'onPageReference' },
  { type: 'summingJunction', category: 'flowchart', label: 'summingJunction' },
  { type: 'orJunction', category: 'flowchart', label: 'orJunction' },
  { type: 'display', category: 'flowchart', label: 'display' },
  {
    type: 'dfdEntity',
    category: 'dfd',
    label: 'dfdEntity',
    width: 140,
    height: 70
  },
  {
    type: 'dfdProcess',
    category: 'dfd',
    label: 'dfdProcess',
    width: 100,
    height: 100
  },
  {
    type: 'dfdDataStore',
    category: 'dfd',
    label: 'dfdDataStore',
    width: 140,
    height: 60
  }
];
var DIAGRAM_CONNECTOR_TOOLS = [
  {
    type: 'dfdDataFlow',
    category: 'dfd',
    label: 'dfdDataFlow',
    connectorType: 'curved'
  }
];
var DIAGRAM_TOOLBOX_ITEMS = DIAGRAM_SHAPES.concat(DIAGRAM_CONNECTOR_TOOLS);
var DIAGRAM_CONNECTION_POINTS = [
  { name: 'top', x: 0.5, y: 0 },
  { name: 'rightTop', x: 1, y: 1 / 3 },
  { name: 'rightBottom', x: 1, y: 2 / 3 },
  { name: 'bottom', x: 0.5, y: 1 },
  { name: 'leftBottom', x: 0, y: 2 / 3 },
  { name: 'leftTop', x: 0, y: 1 / 3 }
];

function diagramAssign(target) {
  var source;
  var key;
  var index;
  for (index = 1; index < arguments.length; index += 1) {
    source = arguments[index] || {};
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
    }
  }
  return target;
}

function diagramNumber(value, fallback) {
  value = Number(value);
  return isFinite(value) ? value : fallback;
}

function diagramBoolean(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    value = value.trim().toLowerCase();
    if (value === 'false' || value === '0' || value === 'no') return false;
    if (value === 'true' || value === '1' || value === 'yes' || value === '') return true;
  }
  return Boolean(value);
}

function diagramClamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function diagramClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function diagramSize(value, fallback) {
  if (value == null || value === '') value = fallback;
  return typeof value === 'number' ? value + 'px' : String(value);
}

function normalizeDiagramPaperSize(value) {
  value = String(value || 'A4');
  return DIAGRAM_PAPER_SIZES[value] ? value : 'A4';
}

function normalizeDiagramPaperOrientation(value) {
  return String(value || '').toLowerCase() === 'portrait' ?
    'portrait' :
    'landscape';
}

function getDiagramPaperDimensions(size, orientation) {
  var definition = DIAGRAM_PAPER_SIZES[normalizeDiagramPaperSize(size)];
  orientation = normalizeDiagramPaperOrientation(orientation);
  return orientation === 'landscape' ? {
    width: definition.height,
    height: definition.width
  } : {
    width: definition.width,
    height: definition.height
  };
}

function resolveDiagramElement(element) {
  if (typeof element === 'string' && typeof document !== 'undefined') {
    try {
      return document.querySelector(element);
    } catch (error) {
      return null;
    }
  }
  return element && element.nodeType === 1 ? element : null;
}

function restoreDiagramAttribute(element, name, value) {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function createDiagramSvgElement(name, attributes) {
  var element = document.createElementNS(DIAGRAM_SVG_NS, name);
  var key;
  attributes = attributes || {};
  for (key in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      element.setAttribute(key, String(attributes[key]));
    }
  }
  return element;
}

function diagramItemId(prefix) {
  var id = prefix + nextDiagramItemId;
  nextDiagramItemId += 1;
  return id;
}

function normalizeDiagramShapeType(value) {
  value = String(value || 'rectangle');
  return DIAGRAM_SHAPES.some(function(shape) {
    return shape.type === value;
  }) ? value : 'rectangle';
}

function normalizeDiagramNode(node, index) {
  var result = diagramAssign({}, node || {});
  result.id = String(result.id == null || result.id === '' ?
    diagramItemId('node-') :
    result.id);
  result.type = normalizeDiagramShapeType(result.type);
  result.text = String(result.text == null ? ('Node ' + (index + 1)) : result.text);
  result.x = diagramNumber(result.x, 80 + (index % 4) * 190);
  result.y = diagramNumber(result.y, 70 + Math.floor(index / 4) * 130);
  result.width = Math.max(40, diagramNumber(result.width, 140));
  result.height = Math.max(30, diagramNumber(result.height, 72));
  result.fill = String(result.fill || '#ffffff');
  result.stroke = String(result.stroke || '#5b6b7c');
  result.strokeWidth = Math.max(1, diagramNumber(result.strokeWidth, 1.5));
  result.textColor = String(result.textColor || '#1f2937');
  return result;
}

function normalizeDiagramConnector(connector, index) {
  var result = diagramAssign({}, connector || {});
  result.id = String(result.id == null || result.id === '' ?
    diagramItemId('connector-') :
    result.id);
  result.from = String(result.from == null ? '' : result.from);
  result.to = String(result.to == null ? '' : result.to);
  result.fromPoint = normalizeDiagramConnectionPoint(result.fromPoint);
  result.toPoint = normalizeDiagramConnectionPoint(result.toPoint);
  result.type = ['straight', 'curved'].indexOf(result.type) >= 0 ?
    result.type :
    'orthogonal';
  result.text = String(result.text == null ? '' : result.text);
  result.stroke = String(result.stroke || '#4b5563');
  result.strokeWidth = Math.max(1, diagramNumber(result.strokeWidth, 1.5));
  result.lineStyle = result.lineStyle === 'dashed' ? 'dashed' : 'solid';
  result._index = index;
  return result;
}

export function normalizeDiagramData(data) {
  var nodes = Array.isArray(data) ? data : data && Array.isArray(data.nodes) ? data.nodes : [];
  var connectors = data && Array.isArray(data.connectors) ?
    data.connectors :
    data && Array.isArray(data.edges) ? data.edges : [];
  var normalizedNodes = nodes.map(normalizeDiagramNode);
  var nodeIds = Object.create(null);
  normalizedNodes.forEach(function(node) {
    nodeIds[node.id] = true;
  });
  return {
    nodes: normalizedNodes,
    connectors: connectors.map(normalizeDiagramConnector).filter(function(connector) {
      return nodeIds[connector.from] && nodeIds[connector.to] && connector.from !== connector.to;
    }).map(function(connector) {
      delete connector._index;
      return connector;
    })
  };
}

export function normalizeDiagramTheme(value) {
  var theme = String(value == null ? '' : value).trim().toLowerCase();
  if (theme === 'pepper') theme = 'pepper-grinder';
  return DIAGRAM_THEMES.indexOf(theme) >= 0 ? theme : 'default';
}

export function normalizeDiagramLocale(value) {
  value = String(value || 'en').trim().replace(/_/g, '-');
  if (/^zh-(?:TW|Hant)(?:-|$)/i.test(value)) return 'zh-TW';
  if (/^zh-(?:CN|Hans)(?:-|$)/i.test(value) || /^zh$/i.test(value)) return 'zh-CN';
  return 'en';
}

function findDiagramTheme(element) {
  var current = resolveDiagramElement(element);
  var index;
  while (current && current.classList) {
    for (index = 0; index < DIAGRAM_THEMES.length; index += 1) {
      if (current.classList.contains('fg-theme-' + DIAGRAM_THEMES[index])) {
        return DIAGRAM_THEMES[index];
      }
    }
    current = current.parentElement;
  }
  return 'default';
}

function diagramNodeCenter(node) {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2
  };
}

function diagramShapePolygon(node) {
  var x = node.x;
  var y = node.y;
  var width = node.width;
  var height = node.height;
  var centerX = x + width / 2;
  var centerY = y + height / 2;
  var points;
  var index;
  var angle;
  var radius;
  if (node.type === 'triangle') {
    return [
      { x: centerX, y: y },
      { x: x + width, y: y + height },
      { x: x, y: y + height }
    ];
  }
  if (node.type === 'decision' || node.type === 'diamond') {
    return [
      { x: centerX, y: y },
      { x: x + width, y: centerY },
      { x: centerX, y: y + height },
      { x: x, y: centerY }
    ];
  }
  if (node.type === 'pentagon') {
    return [
      { x: centerX, y: y },
      { x: x + width, y: y + height * 0.38 },
      { x: x + width * 0.82, y: y + height },
      { x: x + width * 0.18, y: y + height },
      { x: x, y: y + height * 0.38 }
    ];
  }
  if (node.type === 'heart') {
    return [
      { x: centerX, y: y + height * 0.22 },
      { x: x + width * 0.68, y: y },
      { x: x + width * 0.92, y: y + height * 0.05 },
      { x: x + width, y: y + height * 0.25 },
      { x: x + width * 0.95, y: y + height * 0.48 },
      { x: centerX, y: y + height },
      { x: x + width * 0.05, y: y + height * 0.48 },
      { x: x, y: y + height * 0.25 },
      { x: x + width * 0.08, y: y + height * 0.05 },
      { x: x + width * 0.32, y: y }
    ];
  }
  if (node.type === 'hexagon' || node.type === 'preparation') {
    return [
      { x: x + width * 0.2, y: y },
      { x: x + width * 0.8, y: y },
      { x: x + width, y: centerY },
      { x: x + width * 0.8, y: y + height },
      { x: x + width * 0.2, y: y + height },
      { x: x, y: centerY }
    ];
  }
  if (node.type === 'octagon') {
    return [
      { x: x + width * 0.28, y: y },
      { x: x + width * 0.72, y: y },
      { x: x + width, y: y + height * 0.28 },
      { x: x + width, y: y + height * 0.72 },
      { x: x + width * 0.72, y: y + height },
      { x: x + width * 0.28, y: y + height },
      { x: x, y: y + height * 0.72 },
      { x: x, y: y + height * 0.28 }
    ];
  }
  if (node.type === 'star') {
    points = [];
    for (index = 0; index < 10; index += 1) {
      angle = -Math.PI / 2 + index * Math.PI / 5;
      radius = index % 2 === 0 ? 1 : 0.42;
      points.push({
        x: centerX + Math.cos(angle) * width / 2 * radius,
        y: centerY + Math.sin(angle) * height / 2 * radius
      });
    }
    return points;
  }
  if (node.type === 'cross') {
    return [
      { x: x + width * 0.35, y: y },
      { x: x + width * 0.65, y: y },
      { x: x + width * 0.65, y: y + height * 0.35 },
      { x: x + width, y: y + height * 0.35 },
      { x: x + width, y: y + height * 0.65 },
      { x: x + width * 0.65, y: y + height * 0.65 },
      { x: x + width * 0.65, y: y + height },
      { x: x + width * 0.35, y: y + height },
      { x: x + width * 0.35, y: y + height * 0.65 },
      { x: x, y: y + height * 0.65 },
      { x: x, y: y + height * 0.35 },
      { x: x + width * 0.35, y: y + height * 0.35 }
    ];
  }
  if (node.type === 'arrowLeft') {
    return [
      { x: x, y: centerY },
      { x: x + width * 0.42, y: y },
      { x: x + width * 0.42, y: y + height * 0.3 },
      { x: x + width, y: y + height * 0.3 },
      { x: x + width, y: y + height * 0.7 },
      { x: x + width * 0.42, y: y + height * 0.7 },
      { x: x + width * 0.42, y: y + height }
    ];
  }
  if (node.type === 'arrowRight') {
    return [
      { x: x + width, y: centerY },
      { x: x + width * 0.58, y: y },
      { x: x + width * 0.58, y: y + height * 0.3 },
      { x: x, y: y + height * 0.3 },
      { x: x, y: y + height * 0.7 },
      { x: x + width * 0.58, y: y + height * 0.7 },
      { x: x + width * 0.58, y: y + height }
    ];
  }
  if (node.type === 'arrowUp') {
    return [
      { x: centerX, y: y },
      { x: x + width, y: y + height * 0.42 },
      { x: x + width * 0.65, y: y + height * 0.42 },
      { x: x + width * 0.65, y: y + height },
      { x: x + width * 0.35, y: y + height },
      { x: x + width * 0.35, y: y + height * 0.42 },
      { x: x, y: y + height * 0.42 }
    ];
  }
  if (node.type === 'arrowDown') {
    return [
      { x: x + width * 0.35, y: y },
      { x: x + width * 0.65, y: y },
      { x: x + width * 0.65, y: y + height * 0.58 },
      { x: x + width, y: y + height * 0.58 },
      { x: centerX, y: y + height },
      { x: x, y: y + height * 0.58 },
      { x: x + width * 0.35, y: y + height * 0.58 }
    ];
  }
  if (node.type === 'arrowUpDown') {
    return [
      { x: centerX, y: y },
      { x: x + width, y: y + height * 0.28 },
      { x: x + width * 0.65, y: y + height * 0.28 },
      { x: x + width * 0.65, y: y + height * 0.72 },
      { x: x + width, y: y + height * 0.72 },
      { x: centerX, y: y + height },
      { x: x, y: y + height * 0.72 },
      { x: x + width * 0.35, y: y + height * 0.72 },
      { x: x + width * 0.35, y: y + height * 0.28 },
      { x: x, y: y + height * 0.28 }
    ];
  }
  if (node.type === 'arrowLeftRight') {
    return [
      { x: x, y: centerY },
      { x: x + width * 0.28, y: y },
      { x: x + width * 0.28, y: y + height * 0.35 },
      { x: x + width * 0.72, y: y + height * 0.35 },
      { x: x + width * 0.72, y: y },
      { x: x + width, y: centerY },
      { x: x + width * 0.72, y: y + height },
      { x: x + width * 0.72, y: y + height * 0.65 },
      { x: x + width * 0.28, y: y + height * 0.65 },
      { x: x + width * 0.28, y: y + height }
    ];
  }
  if (node.type === 'data' || node.type === 'manualInput') {
    return [
      {
        x: x + width * (node.type === 'manualInput' ? 0.18 : 0.15),
        y: y
      },
      { x: x + width, y: y },
      {
        x: x + width * (node.type === 'manualInput' ? 1 : 0.85),
        y: y + height
      },
      { x: x, y: y + height }
    ];
  }
  if (node.type === 'manualOperation') {
    return [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x + width * 0.82, y: y + height },
      { x: x + width * 0.18, y: y + height }
    ];
  }
  if (node.type === 'merge') {
    return [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: centerX, y: y + height }
    ];
  }
  if (node.type === 'paperTape') {
    return [
      { x: x, y: y + height * 0.18 },
      { x: x + width * 0.25, y: y + height * 0.08 },
      { x: x + width * 0.5, y: y + height * 0.18 },
      { x: x + width * 0.75, y: y + height * 0.28 },
      { x: x + width, y: y + height * 0.18 },
      { x: x + width, y: y + height * 0.82 },
      { x: x + width * 0.75, y: y + height * 0.72 },
      { x: x + width * 0.5, y: y + height * 0.82 },
      { x: x + width * 0.25, y: y + height * 0.92 },
      { x: x, y: y + height * 0.82 }
    ];
  }
  if (node.type === 'storedData') {
    return [
      { x: x + width * 0.12, y: y },
      { x: x + width * 0.88, y: y },
      { x: x + width, y: centerY },
      { x: x + width * 0.88, y: y + height },
      { x: x + width * 0.12, y: y + height },
      { x: x, y: centerY }
    ];
  }
  if (node.type === 'display') {
    return [
      { x: x + width * 0.16, y: y },
      { x: x + width * 0.72, y: y },
      { x: x + width, y: centerY },
      { x: x + width * 0.72, y: y + height },
      { x: x + width * 0.16, y: y + height },
      { x: x, y: centerY }
    ];
  }
  if (node.type === 'delay') {
    return [
      { x: x, y: y },
      { x: x + width * 0.56, y: y },
      { x: x + width * 0.83, y: y + height * 0.08 },
      { x: x + width, y: centerY },
      { x: x + width * 0.83, y: y + height * 0.92 },
      { x: x + width * 0.56, y: y + height },
      { x: x, y: y + height }
    ];
  }
  if (node.type === 'document') {
    return [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x + width, y: y + height * 0.82 },
      { x: x + width * 0.75, y: y + height * 0.73 },
      { x: x + width * 0.5, y: y + height * 0.82 },
      { x: x + width * 0.25, y: y + height * 0.91 },
      { x: x, y: y + height * 0.82 }
    ];
  }
  return null;
}

function diagramRayPolygonIntersection(center, target, points) {
  var rayX = target.x - center.x;
  var rayY = target.y - center.y;
  var result = null;
  var bestDistance = Infinity;
  var index;
  var start;
  var end;
  var edgeX;
  var edgeY;
  var offsetX;
  var offsetY;
  var denominator;
  var distance;
  var edgePosition;
  for (index = 0; index < points.length; index += 1) {
    start = points[index];
    end = points[(index + 1) % points.length];
    edgeX = end.x - start.x;
    edgeY = end.y - start.y;
    offsetX = start.x - center.x;
    offsetY = start.y - center.y;
    denominator = rayX * edgeY - rayY * edgeX;
    if (Math.abs(denominator) < 0.000001) continue;
    distance = (offsetX * edgeY - offsetY * edgeX) / denominator;
    edgePosition = (offsetX * rayY - offsetY * rayX) / denominator;
    if (
      distance >= 0 &&
      edgePosition >= 0 &&
      edgePosition <= 1 &&
      distance < bestDistance
    ) {
      bestDistance = distance;
      result = {
        x: center.x + rayX * distance,
        y: center.y + rayY * distance
      };
    }
  }
  return result;
}

export function getDiagramShapeBoundaryPoint(node, target) {
  var center = diagramNodeCenter(node);
  var dx = target.x - center.x;
  var dy = target.y - center.y;
  var radiusX = node.width / 2;
  var radiusY = node.height / 2;
  var scale;
  var polygon;
  var intersection;
  if (!dx && !dy) return center;
  polygon = diagramShapePolygon(node);
  if (polygon) {
    intersection = diagramRayPolygonIntersection(center, target, polygon);
    if (intersection) return intersection;
  }
  if (
    node.type === 'ellipse' ||
    node.type === 'dfdProcess' ||
    node.type === 'terminator' ||
    node.type === 'cloud' ||
    node.type === 'directData' ||
    node.type === 'sequentialData' ||
    node.type === 'onPageReference' ||
    node.type === 'summingJunction' ||
    node.type === 'orJunction'
  ) {
    scale = 1 / Math.sqrt(
      (dx * dx) / (radiusX * radiusX) +
      (dy * dy) / (radiusY * radiusY)
    );
  } else {
    scale = Math.min(
      dx ? radiusX / Math.abs(dx) : Infinity,
      dy ? radiusY / Math.abs(dy) : Infinity
    );
  }
  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale
  };
}

function diagramConnectorPoint(node, target) {
  var other = diagramNodeCenter(target);
  return getDiagramShapeBoundaryPoint(node, other);
}

export function getDiagramConnectionPoint(node, name) {
  var descriptor = DIAGRAM_CONNECTION_POINTS.find(function(point) {
    return point.name === name;
  });
  if (!descriptor) return null;
  return getDiagramShapeBoundaryPoint(node, {
    x: node.x + node.width * descriptor.x,
    y: node.y + node.height * descriptor.y
  });
}

export function findDiagramNodesInRect(nodes, rect) {
  var left = Math.min(rect.x, rect.x + rect.width);
  var top = Math.min(rect.y, rect.y + rect.height);
  var right = Math.max(rect.x, rect.x + rect.width);
  var bottom = Math.max(rect.y, rect.y + rect.height);
  return (nodes || []).filter(function(node) {
    return node.x <= right &&
      node.x + node.width >= left &&
      node.y <= bottom &&
      node.y + node.height >= top;
  });
}

function normalizeDiagramConnectionPoint(value) {
  value = String(value == null ? '' : value);
  return DIAGRAM_CONNECTION_POINTS.some(function(point) {
    return point.name === value;
  }) ? value : '';
}

function calculateDiagramCurve(start, end) {
  var dx = end.x - start.x;
  var dy = end.y - start.y;
  var length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  var bend = Math.min(90, Math.max(28, length * 0.18));
  var control = {
    x: (start.x + end.x) / 2 - dy / length * bend,
    y: (start.y + end.y) / 2 + dx / length * bend
  };
  return {
    path: 'M ' + start.x + ' ' + start.y +
      ' Q ' + control.x + ' ' + control.y +
      ' ' + end.x + ' ' + end.y,
    label: {
      x: start.x * 0.25 + control.x * 0.5 + end.x * 0.25,
      y: start.y * 0.25 + control.y * 0.5 + end.y * 0.25
    }
  };
}

export function calculateDiagramConnectorPath(
  fromNode,
  toNode,
  type,
  fromPoint,
  toPoint
) {
  var start = getDiagramConnectionPoint(fromNode, fromPoint) ||
    diagramConnectorPoint(fromNode, toNode);
  var end = getDiagramConnectionPoint(toNode, toPoint) ||
    diagramConnectorPoint(toNode, fromNode);
  var middle;
  var curve;
  var path;
  if (type === 'straight') {
    path = 'M ' + start.x + ' ' + start.y + ' L ' + end.x + ' ' + end.y;
    middle = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };
  } else if (type === 'curved') {
    curve = calculateDiagramCurve(start, end);
    path = curve.path;
    middle = curve.label;
  } else if (Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)) {
    middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    path = 'M ' + start.x + ' ' + start.y +
      ' H ' + middle.x +
      ' V ' + end.y +
      ' H ' + end.x;
  } else {
    middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    path = 'M ' + start.x + ' ' + start.y +
      ' V ' + middle.y +
      ' H ' + end.x +
      ' V ' + end.y;
  }
  return {
    path: path,
    start: start,
    end: end,
    label: middle
  };
}

export function calculateDiagramNodeResize(node, direction, dx, dy, minWidth, minHeight) {
  var result = diagramAssign({}, node);
  var right = node.x + node.width;
  var bottom = node.y + node.height;
  minWidth = Math.max(20, diagramNumber(minWidth, 40));
  minHeight = Math.max(20, diagramNumber(minHeight, 30));
  direction = String(direction || '');
  if (direction.indexOf('e') >= 0) result.width = Math.max(minWidth, node.width + dx);
  if (direction.indexOf('s') >= 0) result.height = Math.max(minHeight, node.height + dy);
  if (direction.indexOf('w') >= 0) {
    result.width = Math.max(minWidth, node.width - dx);
    result.x = right - result.width;
  }
  if (direction.indexOf('n') >= 0) {
    result.height = Math.max(minHeight, node.height - dy);
    result.y = bottom - result.height;
  }
  return result;
}

function diagramDownloadBlob(blob, filename) {
  var anchor = document.createElement('a');
  var url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(function() {
    URL.revokeObjectURL(url);
  }, 0);
}

export function createDiagramFactory(
  Control,
  registerControl,
  unregisterControl,
  Button,
  EditBox,
  Window
) {
  var localePacks = {
    en: {
      diagram: 'Diagram',
      toolbox: 'Toolbox',
      searchShapes: 'Search shapes',
      general: 'General',
      flowchart: 'Flowchart',
      dfd: 'DFD',
      dfdEntity: 'Entity',
      dfdProcess: 'Process',
      dfdDataStore: 'Data Store',
      dfdDataFlow: 'Data Flow',
      paperSettings: 'Paper Settings',
      paperSize: 'Paper Size',
      paperOrientation: 'Orientation',
      portrait: 'Portrait',
      landscape: 'Landscape',
      apply: 'Apply',
      cancel: 'Cancel',
      rectangle: 'Rectangle',
      roundedRectangle: 'Rounded rectangle',
      ellipse: 'Ellipse',
      triangle: 'Triangle',
      diamond: 'Diamond',
      heart: 'Heart',
      pentagon: 'Pentagon',
      hexagon: 'Hexagon',
      octagon: 'Octagon',
      star: 'Star',
      cross: 'Cross',
      arrowUp: 'Up arrow',
      arrowDown: 'Down arrow',
      arrowLeft: 'Left arrow',
      arrowRight: 'Right arrow',
      arrowUpDown: 'Up-down arrow',
      arrowLeftRight: 'Left-right arrow',
      cloud: 'Cloud',
      textShape: 'Text',
      process: 'Process',
      decision: 'Decision',
      terminator: 'Terminator',
      document: 'Document',
      multipleDocuments: 'Multiple documents',
      dataShape: 'Data',
      database: 'Database',
      predefinedProcess: 'Predefined process',
      manualInput: 'Manual input',
      preparation: 'Preparation',
      directData: 'Direct data',
      internalStorage: 'Internal storage',
      paperTape: 'Paper tape',
      manualOperation: 'Manual operation',
      delay: 'Delay',
      storedData: 'Stored data',
      sequentialData: 'Sequential data',
      merge: 'Merge',
      onPageReference: 'On-page reference',
      summingJunction: 'Summing junction',
      orJunction: 'OR',
      display: 'Display',
      undo: 'Undo',
      redo: 'Redo',
      deleteItem: 'Delete',
      connect: 'Connect',
      properties: 'Properties',
      noSelection: 'Select a shape or connector.',
      multipleSelection: '{0} shapes selected.',
      text: 'Text',
      x: 'X',
      y: 'Y',
      width: 'Width',
      height: 'Height',
      fill: 'Fill',
      stroke: 'Stroke',
      lineStyle: 'Line style',
      solid: 'Solid',
      dashed: 'Dashed',
      zoomOut: 'Zoom out',
      zoomIn: 'Zoom in',
      fit: 'Fit to content',
      grid: 'Grid',
      fullscreen: 'Full screen',
      exitFullscreen: 'Exit full screen',
      connectSource: 'Select the source shape.',
      connectTarget: 'Select the target shape.',
      itemAdded: 'Item added',
      itemChanged: 'Item changed',
      itemRemoved: 'Item removed'
    },
    'zh-TW': {
      diagram: '圖表設計器',
      toolbox: '工具箱',
      searchShapes: '搜尋圖形',
      general: '一般',
      flowchart: '流程圖',
      dfd: 'DFD',
      dfdEntity: '外部實體',
      dfdProcess: '處理程序',
      dfdDataStore: '資料儲存',
      dfdDataFlow: '資料流',
      paperSettings: '紙張設定',
      paperSize: '紙張尺寸',
      paperOrientation: '紙張方向',
      portrait: '直向',
      landscape: '橫向',
      apply: '套用',
      cancel: '取消',
      rectangle: '矩形',
      roundedRectangle: '圓角矩形',
      ellipse: '橢圓',
      triangle: '三角形',
      diamond: '菱形',
      heart: '愛心',
      pentagon: '五邊形',
      hexagon: '六邊形',
      octagon: '八邊形',
      star: '星形',
      cross: '十字形',
      arrowUp: '向上箭頭',
      arrowDown: '向下箭頭',
      arrowLeft: '向左箭頭',
      arrowRight: '向右箭頭',
      arrowUpDown: '上下箭頭',
      arrowLeftRight: '左右箭頭',
      cloud: '雲朵',
      textShape: '文字',
      process: '處理程序',
      decision: '判斷',
      terminator: '開始／結束',
      document: '文件',
      multipleDocuments: '多重文件',
      dataShape: '資料',
      database: '資料庫',
      predefinedProcess: '預定義處理',
      manualInput: '手動輸入',
      preparation: '準備',
      directData: '直接資料',
      internalStorage: '內部儲存',
      paperTape: '紙帶',
      manualOperation: '手動操作',
      delay: '延遲',
      storedData: '儲存資料',
      sequentialData: '循序資料',
      merge: '合併',
      onPageReference: '頁內連接點',
      summingJunction: '加總接點',
      orJunction: 'OR 接點',
      display: '顯示',
      undo: '復原',
      redo: '重做',
      deleteItem: '刪除',
      connect: '連線',
      properties: '屬性',
      noSelection: '請選取圖形或連線。',
      multipleSelection: '已選取 {0} 個圖形。',
      text: '文字',
      x: 'X',
      y: 'Y',
      width: '寬度',
      height: '高度',
      fill: '填滿',
      stroke: '框線',
      lineStyle: '線條',
      solid: '實線',
      dashed: '虛線',
      zoomOut: '縮小',
      zoomIn: '放大',
      fit: '符合內容',
      grid: '格線',
      fullscreen: '全螢幕',
      exitFullscreen: '離開全螢幕',
      connectSource: '請選擇起點圖形。',
      connectTarget: '請選擇終點圖形。',
      itemAdded: '已新增項目',
      itemChanged: '已修改項目',
      itemRemoved: '已刪除項目'
    },
    'zh-CN': {
      diagram: '图表设计器',
      toolbox: '工具箱',
      searchShapes: '搜索图形',
      general: '常规',
      flowchart: '流程图',
      dfd: 'DFD',
      dfdEntity: '外部实体',
      dfdProcess: '处理过程',
      dfdDataStore: '数据存储',
      dfdDataFlow: '数据流',
      paperSettings: '纸张设置',
      paperSize: '纸张尺寸',
      paperOrientation: '纸张方向',
      portrait: '纵向',
      landscape: '横向',
      apply: '应用',
      cancel: '取消',
      rectangle: '矩形',
      roundedRectangle: '圆角矩形',
      ellipse: '椭圆',
      triangle: '三角形',
      diamond: '菱形',
      heart: '爱心',
      pentagon: '五边形',
      hexagon: '六边形',
      octagon: '八边形',
      star: '星形',
      cross: '十字形',
      arrowUp: '向上箭头',
      arrowDown: '向下箭头',
      arrowLeft: '向左箭头',
      arrowRight: '向右箭头',
      arrowUpDown: '上下箭头',
      arrowLeftRight: '左右箭头',
      cloud: '云朵',
      textShape: '文本',
      process: '处理程序',
      decision: '判断',
      terminator: '开始／结束',
      document: '文档',
      multipleDocuments: '多重文档',
      dataShape: '数据',
      database: '数据库',
      predefinedProcess: '预定义处理',
      manualInput: '手动输入',
      preparation: '准备',
      directData: '直接数据',
      internalStorage: '内部存储',
      paperTape: '纸带',
      manualOperation: '手动操作',
      delay: '延迟',
      storedData: '存储数据',
      sequentialData: '顺序数据',
      merge: '合并',
      onPageReference: '页内连接点',
      summingJunction: '汇总接点',
      orJunction: 'OR 接点',
      display: '显示',
      undo: '撤销',
      redo: '重做',
      deleteItem: '删除',
      connect: '连接',
      properties: '属性',
      noSelection: '请选择图形或连接线。',
      multipleSelection: '已选择 {0} 个图形。',
      text: '文本',
      x: 'X',
      y: 'Y',
      width: '宽度',
      height: '高度',
      fill: '填充',
      stroke: '边框',
      lineStyle: '线条',
      solid: '实线',
      dashed: '虚线',
      zoomOut: '缩小',
      zoomIn: '放大',
      fit: '适合内容',
      grid: '网格',
      fullscreen: '全屏',
      exitFullscreen: '退出全屏',
      connectSource: '请选择起点图形。',
      connectTarget: '请选择终点图形。',
      itemAdded: '已添加项目',
      itemChanged: '已修改项目',
      itemRemoved: '已删除项目'
    }
  };
  var defaults = {
    width: '100%',
    height: 620,
    nodes: [],
    connectors: [],
    paperSize: 'A4',
    paperOrientation: 'landscape',
    pageWidth: 1123,
    pageHeight: 794,
    pageColor: '#ffffff',
    showGrid: true,
    snapToGrid: true,
    gridSize: 20,
    zoomLevel: 1,
    minZoom: 0.25,
    maxZoom: 2,
    toolbox: true,
    toolboxSearch: true,
    propertiesPanel: true,
    mainToolbar: true,
    viewToolbar: true,
    readOnly: false,
    disabled: false,
    locale: 'en',
    theme: 'inherit',
    ariaLabel: '',
    onSelectionChanged: null,
    onItemClick: null,
    onItemDblClick: null,
    onChanged: null
  };

  function Diagram(element, options) {
    var paperDimensions;
    var sourceOptions = options || {};
    if (!(this instanceof Diagram)) return new Diagram(element, options);
    this.hostElement = resolveDiagramElement(element);
    if (!this.hostElement) throw new Error('fabui.Diagram requires a host element.');
    if (this.hostElement.__fabuiDiagram) return this.hostElement.__fabuiDiagram;
    Control.call(this);
    this._listeners = {};
    this._destroyed = false;
    this._interaction = null;
    this._selected = null;
    this._selectedNodeIds = [];
    this._suppressClick = false;
    this._inlineTextEditor = null;
    this._paperDialog = null;
    this._lastItemClick = null;
    this._connectMode = false;
    this._connectType = 'orthogonal';
    this._connectSourceId = '';
    this._buttonControls = [];
    this._toolboxButtonControls = [];
    this._toolbarButtons = {};
    this._editBoxControls = [];
    this._propertyEditors = [];
    this._toolboxCollapsed = {
      general: false,
      flowchart: false,
      dfd: false
    };
    this._toolboxFilter = '';
    this._instanceId = nextDiagramInstanceId;
    nextDiagramInstanceId += 1;
    this._original = {
      html: this.hostElement.innerHTML,
      className: this.hostElement.getAttribute('class'),
      style: this.hostElement.getAttribute('style'),
      role: this.hostElement.getAttribute('role'),
      ariaLabel: this.hostElement.getAttribute('aria-label'),
      tabIndex: this.hostElement.getAttribute('tabindex')
    };
    this._themeSource = this.hostElement.parentElement || document.body;
    this.options = diagramAssign({}, defaults, sourceOptions);
    this.options.locale = normalizeDiagramLocale(this.options.locale);
    this.options.paperSize = normalizeDiagramPaperSize(this.options.paperSize);
    this.options.paperOrientation = normalizeDiagramPaperOrientation(
      this.options.paperOrientation
    );
    if (
      !Object.prototype.hasOwnProperty.call(sourceOptions, 'pageWidth') &&
      !Object.prototype.hasOwnProperty.call(sourceOptions, 'pageHeight')
    ) {
      paperDimensions = getDiagramPaperDimensions(
        this.options.paperSize,
        this.options.paperOrientation
      );
      this.options.pageWidth = paperDimensions.width;
      this.options.pageHeight = paperDimensions.height;
    }
    this.options.gridSize = Math.max(5, diagramNumber(this.options.gridSize, 20));
    this.options.pageWidth = Math.max(300, diagramNumber(this.options.pageWidth, 1200));
    this.options.pageHeight = Math.max(240, diagramNumber(this.options.pageHeight, 800));
    this.options.minZoom = Math.max(0.1, diagramNumber(this.options.minZoom, 0.25));
    this.options.maxZoom = Math.max(
      this.options.minZoom,
      diagramNumber(this.options.maxZoom, 2)
    );
    this.options.zoomLevel = diagramClamp(
      diagramNumber(this.options.zoomLevel, 1),
      this.options.minZoom,
      this.options.maxZoom
    );
    this._data = normalizeDiagramData({
      nodes: this.options.nodes,
      connectors: this.options.connectors
    });
    this._resetHistory();
    this._build();
    this._bind();
    this.setLocale(this.options.locale);
    this.setTheme(this.options.theme);
    this.render();
    this.hostElement.__fabuiDiagram = this;
    registerControl(this.hostElement, this);
    this._fire('ContentReady');
  }

  Diagram.prototype = Object.create(Control.prototype);
  Diagram.prototype.constructor = Diagram;

  Diagram.prototype._build = function() {
    var root = this.hostElement;
    var workspace = document.createElement('div');
    var toolbox = document.createElement('aside');
    var toolboxHeader = document.createElement('div');
    var searchHost = document.createElement('input');
    var toolboxGroups = document.createElement('div');
    var viewport = document.createElement('div');
    var svg = createDiagramSvgElement('svg', {
      class: 'fui-diagram-svg',
      role: 'img'
    });
    var properties = document.createElement('aside');
    var propertiesHeader = document.createElement('div');
    var propertiesBody = document.createElement('div');
    var toolbar = document.createElement('div');
    var viewToolbar = document.createElement('div');
    root.textContent = '';
    root.classList.add('fui-diagram');
    root.style.width = diagramSize(this.options.width, '100%');
    root.style.height = diagramSize(this.options.height, 620);
    root.setAttribute('role', 'application');
    root.setAttribute('aria-label', this.options.ariaLabel || localePacks.en.diagram);
    root.setAttribute('aria-disabled', this.options.disabled ? 'true' : 'false');
    root.tabIndex = this.options.disabled ? -1 : 0;
    toolbar.className = 'fui-diagram-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbox.className = 'fui-diagram-toolbox';
    toolboxHeader.className = 'fui-diagram-pane-header';
    searchHost.className = 'fui-diagram-toolbox-search-source';
    searchHost.type = 'text';
    toolboxGroups.className = 'fui-diagram-toolbox-groups';
    toolbox.appendChild(toolboxHeader);
    if (this.options.toolboxSearch) toolbox.appendChild(searchHost);
    toolbox.appendChild(toolboxGroups);
    viewport.className = 'fui-diagram-viewport';
    viewport.tabIndex = -1;
    svg.setAttribute('viewBox', '0 0 ' + this.options.pageWidth + ' ' + this.options.pageHeight);
    viewport.appendChild(svg);
    properties.className = 'fui-diagram-properties';
    propertiesHeader.className = 'fui-diagram-pane-header';
    propertiesBody.className = 'fui-diagram-properties-body';
    properties.appendChild(propertiesHeader);
    properties.appendChild(propertiesBody);
    workspace.className = 'fui-diagram-workspace';
    workspace.appendChild(toolbox);
    workspace.appendChild(viewport);
    workspace.appendChild(properties);
    viewToolbar.className = 'fui-diagram-view-toolbar';
    viewToolbar.setAttribute('role', 'toolbar');
    root.appendChild(toolbar);
    root.appendChild(workspace);
    root.appendChild(viewToolbar);
    this.toolbarElement = toolbar;
    this.workspaceElement = workspace;
    this.toolboxElement = toolbox;
    this.toolboxHeaderElement = toolboxHeader;
    this.toolboxSearchElement = searchHost;
    this.toolboxGroupsElement = toolboxGroups;
    this.viewportElement = viewport;
    this.svgElement = svg;
    this.propertiesElement = properties;
    this.propertiesHeaderElement = propertiesHeader;
    this.propertiesBodyElement = propertiesBody;
    this.viewToolbarElement = viewToolbar;
    this._renderToolbars();
    this._renderToolbox();
    this._mountToolboxSearch();
    this._syncStructure();
  };

  Diagram.prototype._createToolbarButton = function(container, name, text, handler, toggle) {
    var self = this;
    var host = document.createElement('a');
    var control;
    host.href = 'javascript:void(0)';
    host.className = 'fui-diagram-command fui-diagram-command-' + name;
    host.textContent = text;
    host.setAttribute('data-diagram-command', name);
    container.appendChild(host);
    control = new Button(host, {
      text: text,
      iconCls: '',
      plain: true,
      toggle: toggle === true,
      disabled: this.options.disabled === true,
      theme: 'inherit',
      onClick: function() {
        handler.call(self);
      }
    });
    this._buttonControls.push(control);
    this._toolbarButtons[name] = control;
    return control;
  };

  Diagram.prototype._renderToolbars = function() {
    var self = this;
    this.toolbarElement.textContent = '';
    this.viewToolbarElement.textContent = '';
    this._buttonControls.forEach(function(control) {
      control.dispose();
    });
    this._buttonControls = [];
    this._toolbarButtons = {};
    if (this.options.mainToolbar && !this.options.readOnly) {
      this._createToolbarButton(this.toolbarElement, 'undo', '↶', this.undo);
      this._createToolbarButton(this.toolbarElement, 'redo', '↷', this.redo);
      this._createToolbarButton(this.toolbarElement, 'delete', 'Delete', this.removeSelected);
      this._createToolbarButton(this.toolbarElement, 'connect', 'Connect', function() {
        self.setConnectMode(!self._connectMode, 'orthogonal');
      }, true);
      this._createToolbarButton(this.toolbarElement, 'properties', 'Properties', function() {
        self.options.propertiesPanel = !self.options.propertiesPanel;
        self._syncStructure();
        self._syncToolbarStates();
      }, true);
    }
    if (this.options.viewToolbar) {
      this._createToolbarButton(this.viewToolbarElement, 'zoomOut', '−', function() {
        self.setZoom(self.options.zoomLevel - 0.1);
      });
      this.zoomLabelElement = document.createElement('span');
      this.zoomLabelElement.className = 'fui-diagram-zoom-label';
      this.viewToolbarElement.appendChild(this.zoomLabelElement);
      this._createToolbarButton(this.viewToolbarElement, 'zoomIn', '+', function() {
        self.setZoom(self.options.zoomLevel + 0.1);
      });
      this._createToolbarButton(this.viewToolbarElement, 'fit', 'Fit', this.fitToContent);
      this._createToolbarButton(this.viewToolbarElement, 'grid', 'Grid', function() {
        self.setShowGrid(!self.options.showGrid);
      }, true);
      this._createToolbarButton(this.viewToolbarElement, 'fullscreen', 'Full screen', this.toggleFullscreen);
    }
  };

  Diagram.prototype._mountToolboxSearch = function() {
    var self = this;
    if (!this.options.toolboxSearch || !this.toolboxSearchElement) return;
    this.toolboxSearchControl = new EditBox(this.toolboxSearchElement, {
      editor: 'text',
      width: '100%',
      prompt: localePacks[this.options.locale].searchShapes,
      theme: 'inherit',
      onChange: function(value) {
        self._filterToolbox(value);
      }
    });
    this._editBoxControls.push(this.toolboxSearchControl);
  };

  Diagram.prototype._createToolboxPreview = function(type) {
    var vertical = [
      'arrowUp',
      'arrowDown',
      'arrowUpDown'
    ].indexOf(type) >= 0;
    var circular = type === 'dfdProcess';
    var svg = createDiagramSvgElement('svg', {
      class: 'fui-diagram-shape-preview',
      viewBox: '0 0 60 42',
      'aria-hidden': 'true',
      focusable: 'false',
      'data-diagram-preview-shape': type
    });
    var node = {
      type: type,
      x: vertical ? 17 : circular ? 13 : 6,
      y: vertical ? 2 : circular ? 4 : 6,
      width: vertical ? 26 : circular ? 34 : 48,
      height: vertical ? 38 : circular ? 34 : 30,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.5
    };
    var shape;
    if (type === 'dfdDataFlow') {
      shape = createDiagramSvgElement('path', {
        d: 'M 5 29 Q 28 5 55 24 M 47 18 L 55 24 L 47 28',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 1.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      });
    } else if (type === 'text') {
      shape = createDiagramSvgElement('text', {
        x: 30,
        y: 31,
        fill: 'currentColor',
        'font-family': 'Arial, sans-serif',
        'font-size': 28,
        'font-weight': 700,
        'text-anchor': 'middle'
      });
      shape.textContent = 'T';
    } else {
      shape = this._createShapeElement(node);
      shape.setAttribute('class', 'fui-diagram-toolbox-preview-shape');
    }
    svg.appendChild(shape);
    return svg;
  };

  Diagram.prototype._renderToolbox = function() {
    var self = this;
    var categories = ['general', 'flowchart', 'dfd'];
    this._toolboxButtonControls.forEach(function(control) {
      control.dispose();
    });
    this._toolboxButtonControls = [];
    this.toolboxGroupsElement.textContent = '';
    categories.forEach(function(category) {
      var group = document.createElement('section');
      var title = document.createElement('h3');
      var toggle = document.createElement('a');
      var items = document.createElement('div');
      var label = self.messages ? self.messages[category] : category;
      var control;
      group.className = 'fui-diagram-toolbox-group';
      group.setAttribute('data-diagram-category', category);
      title.className = 'fui-diagram-toolbox-title';
      toggle.href = 'javascript:void(0)';
      toggle.className = 'fui-diagram-toolbox-toggle';
      toggle.setAttribute('data-diagram-toolbox-toggle', category);
      toggle.setAttribute(
        'aria-controls',
        'fui-diagram-toolbox-' + self._instanceId + '-' + category
      );
      items.className = 'fui-diagram-toolbox-items';
      items.id = 'fui-diagram-toolbox-' + self._instanceId + '-' + category;
      DIAGRAM_TOOLBOX_ITEMS.filter(function(shape) {
        return shape.category === category;
      }).forEach(function(shape) {
        var button = document.createElement('button');
        var preview = self._createToolboxPreview(shape.type);
        var label = document.createElement('span');
        button.type = 'button';
        button.className = 'fui-diagram-shape-item';
        button.draggable = !shape.connectorType;
        if (shape.connectorType) {
          button.setAttribute('data-diagram-connector-tool', shape.connectorType);
          button.setAttribute('aria-pressed', 'false');
        } else {
          button.setAttribute('data-diagram-shape', shape.type);
          if (shape.category === 'dfd') {
            button.setAttribute(
              'data-diagram-default-text',
              self.messages ? self.messages[shape.label] : shape.type
            );
          }
          if (shape.width) {
            button.setAttribute('data-diagram-default-width', shape.width);
          }
          if (shape.height) {
            button.setAttribute('data-diagram-default-height', shape.height);
          }
        }
        button.setAttribute('data-search-text', String(
          self.messages ? self.messages[shape.label] : shape.type
        ).toLowerCase());
        label.className = 'fui-diagram-shape-label';
        label.textContent = self.messages ? self.messages[shape.label] : shape.type;
        button.appendChild(preview);
        button.appendChild(label);
        items.appendChild(button);
      });
      title.appendChild(toggle);
      group.appendChild(title);
      group.appendChild(items);
      self.toolboxGroupsElement.appendChild(group);
      control = new Button(toggle, {
        text: label,
        plain: true,
        disabled: self.options.disabled === true,
        theme: 'inherit'
      });
      self._toolboxButtonControls.push(control);
    });
    this._filterToolbox(this._toolboxFilter);
  };

  Diagram.prototype._filterToolbox = function(value) {
    var search = String(value || '').trim().toLowerCase();
    var self = this;
    var connectorTools;
    var index;
    this._toolboxFilter = search;
    Array.prototype.forEach.call(
      this.toolboxGroupsElement.querySelectorAll('.fui-diagram-shape-item'),
      function(item) {
        item.hidden = Boolean(search) &&
          item.getAttribute('data-search-text').indexOf(search) < 0;
      }
    );
    Array.prototype.forEach.call(
      this.toolboxGroupsElement.querySelectorAll('.fui-diagram-toolbox-group'),
      function(group) {
        var category = group.getAttribute('data-diagram-category');
        var collapsed = Boolean(self._toolboxCollapsed[category]);
        var items = group.querySelector('.fui-diagram-toolbox-items');
        var toggle = group.querySelector('[data-diagram-toolbox-toggle]');
        group.hidden = !group.querySelector('.fui-diagram-shape-item:not([hidden])');
        items.hidden = collapsed;
        group.classList.toggle('fui-diagram-toolbox-group-collapsed', collapsed);
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      }
    );
    connectorTools = this.toolboxGroupsElement.querySelectorAll(
      '[data-diagram-connector-tool]'
    );
    for (index = 0; index < connectorTools.length; index += 1) {
      connectorTools[index].classList.toggle(
        'fui-diagram-shape-item-selected',
        this._connectMode &&
        connectorTools[index].getAttribute('data-diagram-connector-tool') ===
          this._connectType
      );
      connectorTools[index].setAttribute(
        'aria-pressed',
        this._connectMode &&
        connectorTools[index].getAttribute('data-diagram-connector-tool') ===
          this._connectType ?
          'true' :
          'false'
      );
    }
  };

  Diagram.prototype._syncStructure = function() {
    this.toolboxElement.hidden = !this.options.toolbox || this.options.readOnly;
    this.propertiesElement.hidden = !this.options.propertiesPanel || this.options.readOnly;
    this.toolbarElement.hidden = !this.options.mainToolbar || this.options.readOnly;
    this.viewToolbarElement.hidden = !this.options.viewToolbar;
    this.workspaceElement.classList.toggle(
      'fui-diagram-no-toolbox',
      this.toolboxElement.hidden
    );
    this.workspaceElement.classList.toggle(
      'fui-diagram-no-properties',
      this.propertiesElement.hidden
    );
  };

  Diagram.prototype._bind = function() {
    var self = this;
    this._onSvgPointerDown = function(event) {
      self._handlePointerDown(event);
    };
    this._onSvgClick = function(event) {
      self._handleSvgClick(event);
    };
    this._onSvgDblClick = function(event) {
      self._handleSvgDblClick(event);
    };
    this._onToolboxClick = function(event) {
      var toggle = event.target.closest('[data-diagram-toolbox-toggle]');
      var connectorTool = event.target.closest('[data-diagram-connector-tool]');
      var category;
      var item = event.target.closest('[data-diagram-shape]');
      var nodeOptions;
      if (toggle && !self.options.disabled && !self.options.readOnly) {
        category = toggle.getAttribute('data-diagram-toolbox-toggle');
        self._toolboxCollapsed[category] = !self._toolboxCollapsed[category];
        self._filterToolbox(self._toolboxFilter);
        return;
      }
      if (connectorTool && !self.options.disabled && !self.options.readOnly) {
        self.setConnectMode(
          !(self._connectMode && self._connectType ===
            connectorTool.getAttribute('data-diagram-connector-tool')),
          connectorTool.getAttribute('data-diagram-connector-tool')
        );
        return;
      }
      if (item && !self.options.disabled && !self.options.readOnly) {
        nodeOptions = {
          type: item.getAttribute('data-diagram-shape')
        };
        if (item.hasAttribute('data-diagram-default-text')) {
          nodeOptions.text = item.getAttribute('data-diagram-default-text');
        }
        if (item.hasAttribute('data-diagram-default-width')) {
          nodeOptions.width = Number(
            item.getAttribute('data-diagram-default-width')
          );
        }
        if (item.hasAttribute('data-diagram-default-height')) {
          nodeOptions.height = Number(
            item.getAttribute('data-diagram-default-height')
          );
        }
        self.addNode(nodeOptions);
      }
    };
    this._onToolboxDragStart = function(event) {
      var item = event.target.closest('[data-diagram-shape]');
      if (
        !item ||
        !event.dataTransfer ||
        self.options.disabled ||
        self.options.readOnly
      ) return;
      event.dataTransfer.setData('text/x-fabui-diagram-shape', item.getAttribute('data-diagram-shape'));
      event.dataTransfer.setData(
        'text/x-fabui-diagram-shape-text',
        item.getAttribute('data-diagram-default-text') || ''
      );
      event.dataTransfer.setData(
        'text/x-fabui-diagram-shape-width',
        item.getAttribute('data-diagram-default-width') || ''
      );
      event.dataTransfer.setData(
        'text/x-fabui-diagram-shape-height',
        item.getAttribute('data-diagram-default-height') || ''
      );
      event.dataTransfer.effectAllowed = 'copy';
    };
    this._onViewportDragOver = function(event) {
      if (event.dataTransfer) event.preventDefault();
    };
    this._onViewportDrop = function(event) {
      var type = event.dataTransfer ?
        event.dataTransfer.getData('text/x-fabui-diagram-shape') :
        '';
      var text = event.dataTransfer ?
        event.dataTransfer.getData('text/x-fabui-diagram-shape-text') :
        '';
      var width = event.dataTransfer ?
        event.dataTransfer.getData('text/x-fabui-diagram-shape-width') :
        '';
      var height = event.dataTransfer ?
        event.dataTransfer.getData('text/x-fabui-diagram-shape-height') :
        '';
      var point;
      var nodeOptions;
      if (!type || self.options.disabled || self.options.readOnly) return;
      event.preventDefault();
      point = self._eventPoint(event);
      nodeOptions = {
        type: type,
        x: point.x - (width ? Number(width) / 2 : 70),
        y: point.y - (height ? Number(height) / 2 : 36)
      };
      if (text) nodeOptions.text = text;
      if (width) nodeOptions.width = Number(width);
      if (height) nodeOptions.height = Number(height);
      self.addNode(nodeOptions);
    };
    this._onKeyDown = function(event) {
      self._handleKeyDown(event);
    };
    this._onFullscreenChange = function() {
      self._syncToolbarStates();
    };
    this.addEventListener(this.svgElement, 'pointerdown', this._onSvgPointerDown);
    this.addEventListener(this.svgElement, 'click', this._onSvgClick);
    this.addEventListener(this.svgElement, 'dblclick', this._onSvgDblClick);
    this.addEventListener(this.toolboxGroupsElement, 'click', this._onToolboxClick);
    this.addEventListener(this.toolboxGroupsElement, 'dragstart', this._onToolboxDragStart);
    this.addEventListener(this.viewportElement, 'dragover', this._onViewportDragOver);
    this.addEventListener(this.viewportElement, 'drop', this._onViewportDrop);
    this.addEventListener(this.hostElement, 'keydown', this._onKeyDown);
    this.addEventListener(document, 'fullscreenchange', this._onFullscreenChange);
  };

  Diagram.prototype._eventPoint = function(event) {
    var rect = this.svgElement.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * this.options.pageWidth / rect.width,
      y: (event.clientY - rect.top) * this.options.pageHeight / rect.height
    };
  };

  Diagram.prototype._snap = function(value) {
    return this.options.snapToGrid ?
      Math.round(value / this.options.gridSize) * this.options.gridSize :
      value;
  };

  Diagram.prototype._isNodeSelected = function(id) {
    return this._selectedNodeIds.indexOf(String(id)) >= 0;
  };

  Diagram.prototype._setNodeSelection = function(ids, primaryId, silent) {
    var self = this;
    var unique = [];
    (ids || []).forEach(function(id) {
      id = String(id);
      if (self.getNode(id) && unique.indexOf(id) < 0) unique.push(id);
    });
    primaryId = String(primaryId == null ? '' : primaryId);
    if (unique.length && unique.indexOf(primaryId) < 0) primaryId = unique[unique.length - 1];
    this._selectedNodeIds = unique;
    this._selected = unique.length ? {
      type: 'node',
      id: primaryId || unique[unique.length - 1]
    } : null;
    this._renderCanvas();
    this._renderProperties();
    if (!silent) this._fireSelectionChanged();
    return this;
  };

  Diagram.prototype._fireSelectionChanged = function() {
    var item = this._selected ?
      (this._selected.type === 'node' ?
        this.getNode(this._selected.id) :
        this.getConnector(this._selected.id)) :
      null;
    this._fire('SelectionChanged', {
      itemType: this._selected ? this._selected.type : null,
      item: item,
      selection: this._selected ? diagramAssign({}, this._selected) : null,
      selections: this.getSelections()
    });
  };

  Diagram.prototype._handlePointerDown = function(event) {
    var connectionPoint = event.target.closest('[data-diagram-connection-point]');
    var resizeHandle = event.target.closest('[data-diagram-resize]');
    var nodeElement = event.target.closest('[data-diagram-node]');
    var connectorElement = event.target.closest('[data-diagram-connector]');
    var node;
    var point;
    var additive;
    var selectedIds;
    var now;
    var isDoubleClick;
    if (
      event.button !== 0 ||
      this.options.disabled ||
      this.options.readOnly
    ) return;
    if (this._inlineTextEditor) this._closeInlineTextEditor(true);
    point = this._eventPoint(event);
    additive = event.shiftKey || event.ctrlKey || event.metaKey;
    if (connectionPoint) {
      node = this.getNode(connectionPoint.getAttribute('data-node-id'));
      if (!node) return;
      event.preventDefault();
      this._interaction = {
        pointerId: event.pointerId,
        type: 'connect',
        connectorType: this._connectMode ? this._connectType : 'orthogonal',
        nodeId: node.id,
        sourcePoint: connectionPoint.getAttribute('data-diagram-connection-point'),
        startPoint: getDiagramConnectionPoint(
          node,
          connectionPoint.getAttribute('data-diagram-connection-point')
        ),
        currentPoint: point,
        targetNodeId: '',
        targetPoint: '',
        changed: false
      };
      this.hostElement.classList.add('fui-diagram-interacting');
      this._bindDocumentInteraction();
      this._renderCanvas();
      return;
    }
    if (connectorElement) return;
    if (!resizeHandle && !nodeElement) {
      now = Date.now();
      isDoubleClick = this._lastItemClick &&
        this._lastItemClick.type === 'canvas' &&
        now - this._lastItemClick.time <= 700;
      this._lastItemClick = isDoubleClick ? null : {
        type: 'canvas',
        time: now
      };
      if (isDoubleClick) {
        event.preventDefault();
        this._openPaperSettings();
        return;
      }
      event.preventDefault();
      this._interaction = {
        pointerId: event.pointerId,
        type: 'marquee',
        startPoint: point,
        currentPoint: point,
        startSelection: this._selectedNodeIds.slice(),
        additive: additive,
        changed: false
      };
      if (!additive) {
        this._selected = null;
        this._selectedNodeIds = [];
        this._renderCanvas();
        this._renderProperties();
      }
      this.hostElement.classList.add('fui-diagram-interacting');
      this._bindDocumentInteraction();
      return;
    }
    node = this.getNode(
      (resizeHandle || nodeElement).getAttribute('data-node-id')
    );
    if (!node) return;
    event.preventDefault();
    now = Date.now();
    isDoubleClick = !resizeHandle &&
      this._lastItemClick &&
      this._lastItemClick.type === 'node' &&
      this._lastItemClick.id === node.id &&
      now - this._lastItemClick.time <= 450;
    this._lastItemClick = isDoubleClick ? null : {
      type: 'node',
      id: node.id,
      time: now
    };
    if (isDoubleClick) {
      this.selectItem('node', node.id);
      this._fire('ItemDblClick', {
        itemType: 'node',
        item: node
      });
      this._beginNodeTextEdit(node.id);
      this._suppressClick = true;
      return;
    }
    selectedIds = this._selectedNodeIds.slice();
    if (additive && !resizeHandle) {
      if (this._isNodeSelected(node.id)) {
        selectedIds = selectedIds.filter(function(id) {
          return id !== node.id;
        });
      } else {
        selectedIds.push(node.id);
      }
      this._setNodeSelection(selectedIds, node.id);
      this._suppressClick = true;
      if (!this._isNodeSelected(node.id)) return;
    } else if (!this._isNodeSelected(node.id) || resizeHandle) {
      this._setNodeSelection([node.id], node.id);
    }
    this._interaction = {
      pointerId: event.pointerId,
      type: resizeHandle ? 'resize' : 'move',
      direction: resizeHandle ?
        resizeHandle.getAttribute('data-diagram-resize') :
        '',
      nodeId: node.id,
      startPoint: point,
      startNode: diagramAssign({}, node),
      startNodes: this._selectedNodeIds.map(function(id) {
        return diagramAssign({}, this.getNode(id));
      }, this),
      changed: false
    };
    this.hostElement.classList.add('fui-diagram-interacting');
    this._bindDocumentInteraction();
  };

  Diagram.prototype._bindDocumentInteraction = function() {
    var self = this;
    this._unbindDocumentInteraction();
    this._onDocumentPointerMove = function(event) {
      self._handlePointerMove(event);
    };
    this._onDocumentPointerEnd = function(event) {
      self._finishPointerInteraction(event);
    };
    document.addEventListener('pointermove', this._onDocumentPointerMove);
    document.addEventListener('pointerup', this._onDocumentPointerEnd);
    document.addEventListener('pointercancel', this._onDocumentPointerEnd);
  };

  Diagram.prototype._unbindDocumentInteraction = function() {
    if (!this._onDocumentPointerMove) return;
    document.removeEventListener('pointermove', this._onDocumentPointerMove);
    document.removeEventListener('pointerup', this._onDocumentPointerEnd);
    document.removeEventListener('pointercancel', this._onDocumentPointerEnd);
    this._onDocumentPointerMove = null;
    this._onDocumentPointerEnd = null;
  };

  Diagram.prototype._handlePointerMove = function(event) {
    var state = this._interaction;
    var node;
    var point;
    var dx;
    var dy;
    var resized;
    var rect;
    var selectedIds;
    var target;
    if (!state || event.pointerId !== state.pointerId) return;
    event.preventDefault();
    point = this._eventPoint(event);
    if (state.type === 'marquee') {
      state.currentPoint = point;
      rect = {
        x: state.startPoint.x,
        y: state.startPoint.y,
        width: point.x - state.startPoint.x,
        height: point.y - state.startPoint.y
      };
      selectedIds = findDiagramNodesInRect(this._data.nodes, rect).map(function(item) {
        return item.id;
      });
      if (state.additive) {
        state.startSelection.forEach(function(id) {
          if (selectedIds.indexOf(id) < 0) selectedIds.push(id);
        });
      }
      this._selectedNodeIds = selectedIds;
      this._selected = selectedIds.length ? {
        type: 'node',
        id: selectedIds[selectedIds.length - 1]
      } : null;
      state.changed = Math.abs(rect.width) > 2 || Math.abs(rect.height) > 2;
      this._renderCanvas();
      this._renderProperties();
      return;
    }
    if (state.type === 'connect') {
      state.currentPoint = point;
      target = document.elementFromPoint(event.clientX, event.clientY);
      target = target && target.closest ?
        target.closest('[data-diagram-connection-point]') :
        null;
      state.targetNodeId = target ? target.getAttribute('data-node-id') : '';
      state.targetPoint = target ?
        target.getAttribute('data-diagram-connection-point') :
        '';
      if (state.targetNodeId === state.nodeId) {
        state.targetNodeId = '';
        state.targetPoint = '';
      }
      state.changed = true;
      this._renderCanvas();
      return;
    }
    node = this.getNode(state.nodeId);
    if (!node) return;
    dx = point.x - state.startPoint.x;
    dy = point.y - state.startPoint.y;
    if (state.type === 'move') {
      state.startNodes.forEach(function(startNode) {
        var current = this.getNode(startNode.id);
        if (!current) return;
        current.x = this._snap(startNode.x + dx);
        current.y = this._snap(startNode.y + dy);
      }, this);
    } else {
      resized = calculateDiagramNodeResize(
        state.startNode,
        state.direction,
        dx,
        dy,
        40,
        30
      );
      node.x = this._snap(resized.x);
      node.y = this._snap(resized.y);
      node.width = Math.max(40, this._snap(resized.width));
      node.height = Math.max(30, this._snap(resized.height));
    }
    state.changed = true;
    this._renderCanvas();
  };

  Diagram.prototype._finishPointerInteraction = function(event) {
    var state = this._interaction;
    var node;
    var target;
    var changedSelection;
    if (!state || event.pointerId !== state.pointerId) return;
    if (state.type === 'connect' && event.type !== 'pointercancel') {
      target = document.elementFromPoint(event.clientX, event.clientY);
      target = target && target.closest ?
        target.closest('[data-diagram-connection-point]') :
        null;
      if (target) {
        state.targetNodeId = target.getAttribute('data-node-id');
        state.targetPoint = target.getAttribute('data-diagram-connection-point');
      }
      if (state.targetNodeId && state.targetNodeId !== state.nodeId) {
        this.addConnector({
          from: state.nodeId,
          to: state.targetNodeId,
          fromPoint: state.sourcePoint,
          toPoint: state.targetPoint,
          type: state.connectorType
        });
      }
    }
    if (state.type === 'marquee') {
      changedSelection = state.startSelection.join('|') !==
        this._selectedNodeIds.join('|');
    }
    node = this.getNode(state.nodeId);
    if (event.type === 'pointercancel') {
      if (state.startNodes) {
        state.startNodes.forEach(function(startNode) {
          var current = this.getNode(startNode.id);
          if (current) diagramAssign(current, startNode);
        }, this);
      }
      if (state.type === 'marquee') {
        this._selectedNodeIds = state.startSelection.slice();
        this._selected = this._selectedNodeIds.length ? {
          type: 'node',
          id: this._selectedNodeIds[this._selectedNodeIds.length - 1]
        } : null;
      }
      this._renderCanvas();
    }
    this._interaction = null;
    this.hostElement.classList.remove('fui-diagram-interacting');
    this._unbindDocumentInteraction();
    if (event.type !== 'pointercancel' && state.type === 'marquee') {
      if (state.changed) this._suppressClick = true;
      if (changedSelection) this._fireSelectionChanged();
      this._renderCanvas();
      this._renderProperties();
    } else if (
      event.type !== 'pointercancel' &&
      (state.type === 'move' || state.type === 'resize') &&
      state.changed
    ) {
      this._lastItemClick = null;
      this._suppressClick = true;
      this._commit('change', {
        itemType: 'node',
        item: node,
        items: this._selectedNodeIds.map(this.getNode.bind(this))
      });
      this._renderProperties();
    } else if (state.type === 'connect') {
      this._suppressClick = true;
      this._renderCanvas();
    }
  };

  Diagram.prototype._handleSvgClick = function(event) {
    var nodeElement = event.target.closest('[data-diagram-node]');
    var connectorElement = event.target.closest('[data-diagram-connector]');
    var id;
    var now;
    var isDoubleClick;
    if (this._suppressClick) {
      this._suppressClick = false;
      return;
    }
    if (event.target.closest('[data-diagram-connection-point]')) return;
    if (nodeElement) {
      this._lastItemClick = null;
      id = nodeElement.getAttribute('data-node-id');
      if (this._connectMode) {
        this._handleConnectNode(id);
        return;
      }
      this.selectItem('node', id);
      this._fire('ItemClick', { itemType: 'node', item: this.getNode(id) });
      return;
    }
    if (connectorElement) {
      id = connectorElement.getAttribute('data-connector-id');
      now = Date.now();
      isDoubleClick = this._lastItemClick &&
        this._lastItemClick.type === 'connector' &&
        this._lastItemClick.id === id &&
        now - this._lastItemClick.time <= 450;
      this._lastItemClick = isDoubleClick ? null : {
        type: 'connector',
        id: id,
        time: now
      };
      this.selectItem('connector', id);
      this._fire('ItemClick', {
        itemType: 'connector',
        item: this.getConnector(id)
      });
      if (isDoubleClick && !this.options.readOnly && !this.options.disabled) {
        this._fire('ItemDblClick', {
          itemType: 'connector',
          item: this.getConnector(id)
        });
        this._beginConnectorTextEdit(id);
      }
      return;
    }
    if (!event.target.closest('[data-diagram-resize]')) this.clearSelection();
  };

  Diagram.prototype._handleSvgDblClick = function(event) {
    var nodeElement = event.target.closest('[data-diagram-node]');
    var connectorElement = event.target.closest('[data-diagram-connector]');
    var type;
    var id;
    if (!nodeElement && !connectorElement) {
      if (
        !this.options.readOnly &&
        !this.options.disabled &&
        (
          event.target === this.svgElement ||
          event.target.classList.contains('fui-diagram-page')
        )
      ) {
        event.preventDefault();
        this._openPaperSettings();
      }
      return;
    }
    type = nodeElement ? 'node' : 'connector';
    id = (nodeElement || connectorElement).getAttribute(
      nodeElement ? 'data-node-id' : 'data-connector-id'
    );
    if (
      this._inlineTextEditor &&
      this._inlineTextEditor.itemType === type &&
      this._inlineTextEditor.itemId === id
    ) {
      event.preventDefault();
      return;
    }
    this._fire('ItemDblClick', {
      itemType: type,
      item: type === 'node' ? this.getNode(id) : this.getConnector(id)
    });
    if (
      !this._inlineTextEditor &&
      !this.options.readOnly &&
      !this.options.disabled
    ) {
      event.preventDefault();
      this.selectItem(type, id);
      if (type === 'node') this._beginNodeTextEdit(id);
      else this._beginConnectorTextEdit(id);
    }
  };

  Diagram.prototype._disposePaperDialog = function() {
    var state = this._paperDialog;
    if (!state) return;
    this._paperDialog = null;
    state.host.removeEventListener('keydown', state.onKeyDown);
    state.sizeControl.dispose();
    state.orientationControl.dispose();
    state.applyButton.dispose();
    state.cancelButton.dispose();
    state.window.destroy(true);
    if (state.host.parentNode) state.host.parentNode.removeChild(state.host);
  };

  Diagram.prototype._openPaperSettings = function() {
    var self = this;
    var state = this._paperDialog;
    var host;
    var form;
    var sizeRow;
    var sizeLabel;
    var sizeInput;
    var orientationRow;
    var orientationLabel;
    var orientationInput;
    var footer;
    var applyHost;
    var cancelHost;
    if (!Window || this.options.readOnly || this.options.disabled) return this;
    if (!state) {
      host = document.createElement('div');
      form = document.createElement('div');
      sizeRow = document.createElement('label');
      sizeLabel = document.createElement('span');
      sizeInput = document.createElement('input');
      orientationRow = document.createElement('label');
      orientationLabel = document.createElement('span');
      orientationInput = document.createElement('input');
      footer = document.createElement('div');
      applyHost = document.createElement('a');
      cancelHost = document.createElement('a');
      host.className = 'fui-diagram-paper-dialog';
      form.className = 'fui-diagram-paper-form';
      sizeRow.className = 'fui-diagram-paper-field';
      sizeLabel.className = 'fui-diagram-paper-label';
      orientationRow.className = 'fui-diagram-paper-field';
      orientationLabel.className = 'fui-diagram-paper-label';
      footer.className = 'fui-diagram-paper-actions';
      applyHost.href = 'javascript:void(0)';
      cancelHost.href = 'javascript:void(0)';
      sizeLabel.textContent = this.messages.paperSize;
      orientationLabel.textContent = this.messages.paperOrientation;
      sizeRow.appendChild(sizeLabel);
      sizeRow.appendChild(sizeInput);
      orientationRow.appendChild(orientationLabel);
      orientationRow.appendChild(orientationInput);
      form.appendChild(sizeRow);
      form.appendChild(orientationRow);
      host.appendChild(form);
      footer.appendChild(applyHost);
      footer.appendChild(cancelHost);
      document.body.appendChild(host);
      state = {
        host: host,
        sizeLabel: sizeLabel,
        orientationLabel: orientationLabel,
        sizeControl: new EditBox(sizeInput, {
          editor: 'combo',
          width: '100%',
          editable: false,
          limitToList: true,
          data: Object.keys(DIAGRAM_PAPER_SIZES).map(function(size) {
            return { value: size, text: size };
          }),
          theme: this.theme
        }),
        orientationControl: new EditBox(orientationInput, {
          editor: 'combo',
          width: '100%',
          editable: false,
          limitToList: true,
          data: [
            { value: 'landscape', text: this.messages.landscape },
            { value: 'portrait', text: this.messages.portrait }
          ],
          theme: this.theme
        }),
        applyButton: null,
        cancelButton: null,
        window: null,
        onKeyDown: null
      };
      state.applyButton = new Button(applyHost, {
        text: this.messages.apply,
        theme: this.theme,
        onClick: function() {
          self.setPaper(
            state.sizeControl.getValue(),
            state.orientationControl.getValue()
          );
          state.window.close(true);
        }
      });
      state.cancelButton = new Button(cancelHost, {
        text: this.messages.cancel,
        theme: this.theme,
        onClick: function() {
          state.window.close(true);
        }
      });
      state.window = new Window(host, {
        title: this.messages.paperSettings,
        width: 360,
        height: 220,
        minWidth: 320,
        minHeight: 200,
        modal: true,
        draggable: true,
        resizable: false,
        maximizable: false,
        minimizable: false,
        collapsible: false,
        closable: true,
        constrain: true,
        fixed: true,
        footer: footer,
        closed: true,
        theme: this.theme,
        locale: this.options.locale
      });
      state.onKeyDown = function(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          state.window.close(true);
        } else if (
          event.key === 'Enter' &&
          !event.target.closest('.fui-editbox')
        ) {
          event.preventDefault();
          state.applyButton.hostElement.click();
        }
      };
      host.addEventListener('keydown', state.onKeyDown);
      this._paperDialog = state;
    }
    state.sizeControl.setValue(this.options.paperSize);
    state.orientationControl.setValue(this.options.paperOrientation);
    state.window.open().center();
    state.sizeControl.textbox().focus();
    return this;
  };

  Diagram.prototype._positionInlineTextEditor = function() {
    var state = this._inlineTextEditor;
    var node;
    var nodeElements;
    var nodeElement;
    var connector;
    var from;
    var to;
    var geometry;
    var zoom;
    var index;
    if (!state) return;
    if (state.itemType === 'node') {
      node = this.getNode(state.itemId);
      if (!node) {
        this._closeInlineTextEditor(false);
        return;
      }
      zoom = this.options.zoomLevel;
      state.host.style.width = Math.max(
        24,
        node.width * zoom - 8
      ) + 'px';
      state.host.style.height = Math.max(
        22,
        node.height * zoom - 8
      ) + 'px';
      state.host.style.left = Math.round(
        (node.x + node.width / 2) * zoom
      ) + 'px';
      state.host.style.top = Math.round(
        (node.y + node.height / 2) * zoom
      ) + 'px';
      state.host.style.setProperty(
        '--fui-diagram-inline-font-size',
        Math.max(10, 14 * zoom) + 'px'
      );
      state.host.style.setProperty(
        '--fui-diagram-inline-text-color',
        node.textColor
      );
      if (state.nodeElement) {
        state.nodeElement.classList.remove('fui-diagram-node-editing');
      }
      state.nodeElement = null;
      nodeElements = this.svgElement.querySelectorAll('[data-diagram-node]');
      for (index = 0; index < nodeElements.length; index += 1) {
        if (nodeElements[index].getAttribute('data-node-id') === state.itemId) {
          nodeElement = nodeElements[index];
          break;
        }
      }
      if (nodeElement) {
        nodeElement.classList.add('fui-diagram-node-editing');
        state.nodeElement = nodeElement;
      }
      if (state.resizeEditor) state.resizeEditor();
      return;
    }
    connector = this.getConnector(state.itemId);
    if (!connector) {
      this._closeInlineTextEditor(false);
      return;
    }
    from = this.getNode(connector.from);
    to = this.getNode(connector.to);
    if (!from || !to) {
      this._closeInlineTextEditor(false);
      return;
    }
    geometry = calculateDiagramConnectorPath(
      from,
      to,
      connector.type,
      connector.fromPoint,
      connector.toPoint
    );
    state.host.style.width = '180px';
    state.host.style.left =
      Math.round(geometry.label.x * this.options.zoomLevel) + 'px';
    state.host.style.top =
      Math.round(geometry.label.y * this.options.zoomLevel) + 'px';
  };

  Diagram.prototype._beginInlineTextEdit = function(type, id) {
    var self = this;
    var item = type === 'node' ? this.getNode(id) : this.getConnector(id);
    var host;
    var input;
    var control;
    var textbox;
    var state;
    if (!item) return;
    this._closeInlineTextEditor(true);
    host = document.createElement('div');
    input = document.createElement(type === 'node' ? 'textarea' : 'input');
    host.className = 'fui-diagram-inline-text-editor fui-diagram-inline-' +
      type + '-editor';
    if (type === 'node') {
      input.rows = 1;
    } else {
      input.type = 'text';
    }
    input.value = item.text;
    host.appendChild(input);
    this.viewportElement.appendChild(host);
    control = new EditBox(input, {
      editor: 'text',
      width: '100%',
      height: type === 'node' ? '100%' : 30,
      multiline: type === 'node',
      value: item.text,
      theme: 'inherit'
    });
    textbox = control.textbox();
    state = {
      itemType: type,
      itemId: item.id,
      host: host,
      control: control,
      textbox: textbox,
      onKeyDown: null,
      onBlur: null,
      onInput: null,
      onPointerDown: null
    };
    state.resizeEditor = function() {
      var maximumHeight;
      if (state.itemType !== 'node') return;
      maximumHeight = Math.max(18, state.host.clientHeight - 4);
      state.textbox.style.height = '1px';
      state.textbox.style.height = Math.min(
        maximumHeight,
        Math.max(18, state.textbox.scrollHeight)
      ) + 'px';
    };
    state.onKeyDown = function(event) {
      if (
        event.key === 'Enter' &&
        (state.itemType !== 'node' || event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        self._closeInlineTextEditor(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        self._closeInlineTextEditor(false);
      }
    };
    state.onInput = function() {
      state.resizeEditor();
    };
    state.onBlur = function() {
      setTimeout(function() {
        if (self._inlineTextEditor === state) {
          self._closeInlineTextEditor(true);
        }
      }, 0);
    };
    state.onPointerDown = function(event) {
      event.stopPropagation();
    };
    textbox.addEventListener('keydown', state.onKeyDown);
    textbox.addEventListener('input', state.onInput);
    textbox.addEventListener('blur', state.onBlur);
    host.addEventListener('pointerdown', state.onPointerDown);
    this._inlineTextEditor = state;
    this._positionInlineTextEditor();
    textbox.focus();
    textbox.select();
  };

  Diagram.prototype._beginNodeTextEdit = function(id) {
    this._beginInlineTextEdit('node', id);
  };

  Diagram.prototype._beginConnectorTextEdit = function(id) {
    this._beginInlineTextEdit('connector', id);
  };

  Diagram.prototype._closeInlineTextEditor = function(commit) {
    var state = this._inlineTextEditor;
    var item;
    var value;
    var changed = false;
    if (!state) return;
    this._inlineTextEditor = null;
    state.textbox.removeEventListener('keydown', state.onKeyDown);
    state.textbox.removeEventListener('input', state.onInput);
    state.textbox.removeEventListener('blur', state.onBlur);
    state.host.removeEventListener('pointerdown', state.onPointerDown);
    if (state.nodeElement) {
      state.nodeElement.classList.remove('fui-diagram-node-editing');
    }
    item = state.itemType === 'node' ?
      this.getNode(state.itemId) :
      this.getConnector(state.itemId);
    value = state.control.getValue();
    state.control.dispose();
    if (state.host.parentNode) state.host.parentNode.removeChild(state.host);
    if (commit && item && item.text !== String(value == null ? '' : value)) {
      item.text = String(value == null ? '' : value);
      changed = true;
    }
    if (changed) {
      this._commit('change', {
        itemType: state.itemType,
        item: item
      });
      this.render();
    }
  };

  Diagram.prototype._closeConnectorTextEditor = function(commit) {
    this._closeInlineTextEditor(commit);
  };

  Diagram.prototype._handleConnectNode = function(id) {
    if (!this._connectSourceId) {
      this._connectSourceId = id;
      this.selectItem('node', id);
      this._renderCanvas();
      return;
    }
    if (this._connectSourceId !== id) {
      this.addConnector({
        from: this._connectSourceId,
        to: id,
        type: this._connectType
      });
    }
    this._connectSourceId = '';
    this.setConnectMode(false);
  };

  Diagram.prototype._handleKeyDown = function(event) {
    var selectedNodes;
    var delta = event.shiftKey ? 10 : 1;
    var modifier = event.ctrlKey || event.metaKey;
    if (this.options.disabled) return;
    if (modifier && String(event.key).toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) this.redo();
      else this.undo();
      return;
    }
    if (modifier && String(event.key).toLowerCase() === 'y') {
      event.preventDefault();
      this.redo();
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && !this.options.readOnly) {
      event.preventDefault();
      this.removeSelected();
      return;
    }
    if (event.key === 'Escape') {
      this.setConnectMode(false);
      this.clearSelection();
      return;
    }
    if (!this._selected || this._selected.type !== 'node' || this.options.readOnly) return;
    selectedNodes = this._selectedNodeIds.map(this.getNode.bind(this)).filter(Boolean);
    if (!selectedNodes.length) return;
    if (event.key === 'ArrowLeft') {
      selectedNodes.forEach(function(node) { node.x -= delta; });
    } else if (event.key === 'ArrowRight') {
      selectedNodes.forEach(function(node) { node.x += delta; });
    } else if (event.key === 'ArrowUp') {
      selectedNodes.forEach(function(node) { node.y -= delta; });
    } else if (event.key === 'ArrowDown') {
      selectedNodes.forEach(function(node) { node.y += delta; });
    } else {
      return;
    }
    event.preventDefault();
    this._renderCanvas();
    this._commit('change', {
      itemType: 'node',
      item: selectedNodes[selectedNodes.length - 1],
      items: selectedNodes
    });
    this._renderProperties();
  };

  Diagram.prototype._createShapeElement = function(node) {
    var shape;
    var points;
    var path;
    var centerX = node.x + node.width / 2;
    var centerY = node.y + node.height / 2;
    var radiusX = node.width / 2;
    var radiusY = node.height / 2;
    var index;
    var angle;
    var radius;
    points = [
      'triangle', 'decision', 'diamond', 'pentagon', 'hexagon',
      'preparation', 'octagon', 'star', 'cross', 'arrowUp',
      'arrowDown', 'arrowLeft', 'arrowRight', 'arrowUpDown',
      'arrowLeftRight', 'data', 'manualInput', 'manualOperation', 'merge'
    ].indexOf(node.type) >= 0 ? diagramShapePolygon(node) : null;
    if (node.type === 'heart') {
      path = 'M ' + centerX + ' ' + (node.y + node.height) +
        ' C ' + (node.x + node.width * 0.42) + ' ' + (node.y + node.height * 0.78) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.52) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.28) +
        ' C ' + node.x + ' ' + (node.y + node.height * 0.02) +
        ' ' + (node.x + node.width * 0.32) + ' ' + node.y +
        ' ' + centerX + ' ' + (node.y + node.height * 0.22) +
        ' C ' + (node.x + node.width * 0.68) + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.02) +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.28) +
        ' C ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.52) +
        ' ' + (node.x + node.width * 0.58) + ' ' + (node.y + node.height * 0.78) +
        ' ' + centerX + ' ' + (node.y + node.height) + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (points) {
      shape = createDiagramSvgElement('polygon', {
        points: points.map(function(point) {
          return point.x + ',' + point.y;
        }).join(' ')
      });
    } else if (
      node.type === 'summingJunction' ||
      node.type === 'orJunction'
    ) {
      shape = createDiagramSvgElement('g');
      shape.appendChild(createDiagramSvgElement('ellipse', {
        cx: centerX,
        cy: centerY,
        rx: radiusX,
        ry: radiusY
      }));
      if (node.type === 'summingJunction') {
        shape.appendChild(createDiagramSvgElement('path', {
          d: 'M ' + centerX + ' ' + node.y +
            ' V ' + (node.y + node.height) +
            ' M ' + node.x + ' ' + centerY +
            ' H ' + (node.x + node.width),
          fill: 'none'
        }));
      } else {
        shape.appendChild(createDiagramSvgElement('path', {
          d: 'M ' + (node.x + node.width * 0.15) + ' ' +
            (node.y + node.height * 0.15) +
            ' L ' + (node.x + node.width * 0.85) + ' ' +
            (node.y + node.height * 0.85) +
            ' M ' + (node.x + node.width * 0.85) + ' ' +
            (node.y + node.height * 0.15) +
            ' L ' + (node.x + node.width * 0.15) + ' ' +
            (node.y + node.height * 0.85),
          fill: 'none'
        }));
      }
    } else if (
      node.type === 'ellipse' ||
      node.type === 'dfdProcess' ||
      node.type === 'terminator' ||
      node.type === 'onPageReference'
    ) {
      shape = createDiagramSvgElement('ellipse', {
        cx: centerX,
        cy: centerY,
        rx: radiusX,
        ry: radiusY
      });
    } else if (node.type === 'dfdDataStore') {
      shape = createDiagramSvgElement('g');
      shape.appendChild(createDiagramSvgElement('rect', {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        fill: node.fill,
        stroke: 'none'
      }));
      shape.appendChild(createDiagramSvgElement('path', {
        d: 'M ' + node.x + ' ' + node.y +
          ' H ' + (node.x + node.width) +
          ' M ' + node.x + ' ' + (node.y + node.height) +
          ' H ' + (node.x + node.width),
        fill: 'none'
      }));
    } else if (node.type === 'multipleDocuments') {
      shape = createDiagramSvgElement('g');
      [
        { x: node.x + node.width * 0.16, y: node.y, width: node.width * 0.84 },
        { x: node.x + node.width * 0.08, y: node.y + node.height * 0.1, width: node.width * 0.84 },
        { x: node.x, y: node.y + node.height * 0.2, width: node.width * 0.84 }
      ].forEach(function(page) {
        shape.appendChild(createDiagramSvgElement('path', {
          d: 'M ' + page.x + ' ' + page.y +
            ' H ' + (page.x + page.width) +
            ' V ' + (node.y + node.height * 0.84) +
            ' Q ' + (page.x + page.width * 0.75) + ' ' +
            (node.y + node.height * 0.68) +
            ' ' + (page.x + page.width * 0.5) + ' ' +
            (node.y + node.height * 0.84) +
            ' Q ' + (page.x + page.width * 0.25) + ' ' +
            (node.y + node.height) +
            ' ' + page.x + ' ' + (node.y + node.height * 0.84) + ' Z'
        }));
      });
    } else if (node.type === 'directData' || node.type === 'sequentialData') {
      path = 'M ' + (node.x + node.width * 0.15) + ' ' + node.y +
        ' H ' + (node.x + node.width * 0.85) +
        ' C ' + (node.x + node.width) + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height) +
        ' ' + (node.x + node.width * 0.85) + ' ' + (node.y + node.height) +
        ' H ' + (node.x + node.width * 0.15) +
        ' C ' + node.x + ' ' + (node.y + node.height) +
        ' ' + node.x + ' ' + node.y +
        ' ' + (node.x + node.width * 0.15) + ' ' + node.y + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'internalStorage') {
      shape = createDiagramSvgElement('g');
      shape.appendChild(createDiagramSvgElement('rect', {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height
      }));
      shape.appendChild(createDiagramSvgElement('path', {
        d: 'M ' + (node.x + node.width * 0.14) + ' ' + node.y +
          ' V ' + (node.y + node.height) +
          ' M ' + node.x + ' ' + (node.y + node.height * 0.18) +
          ' H ' + (node.x + node.width),
        fill: 'none'
      }));
    } else if (node.type === 'paperTape') {
      path = 'M ' + node.x + ' ' + (node.y + node.height * 0.18) +
        ' Q ' + (node.x + node.width * 0.25) + ' ' + node.y +
        ' ' + (node.x + node.width * 0.5) + ' ' + (node.y + node.height * 0.18) +
        ' Q ' + (node.x + node.width * 0.75) + ' ' +
        (node.y + node.height * 0.36) +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.18) +
        ' V ' + (node.y + node.height * 0.82) +
        ' Q ' + (node.x + node.width * 0.75) + ' ' +
        (node.y + node.height) +
        ' ' + (node.x + node.width * 0.5) + ' ' + (node.y + node.height * 0.82) +
        ' Q ' + (node.x + node.width * 0.25) + ' ' +
        (node.y + node.height * 0.64) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.82) + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'storedData') {
      path = 'M ' + (node.x + node.width * 0.15) + ' ' + node.y +
        ' H ' + (node.x + node.width * 0.85) +
        ' C ' + (node.x + node.width) + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height) +
        ' ' + (node.x + node.width * 0.85) + ' ' + (node.y + node.height) +
        ' H ' + (node.x + node.width * 0.15) +
        ' C ' + (node.x + node.width * 0.32) + ' ' +
        (node.y + node.height * 0.75) +
        ' ' + (node.x + node.width * 0.32) + ' ' +
        (node.y + node.height * 0.25) +
        ' ' + (node.x + node.width * 0.15) + ' ' + node.y + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'decision' || node.type === 'triangle') {
      points = node.type === 'triangle' ? [
        centerX + ',' + node.y,
        (node.x + node.width) + ',' + (node.y + node.height),
        node.x + ',' + (node.y + node.height)
      ] : [
        centerX + ',' + node.y,
        (node.x + node.width) + ',' + centerY,
        centerX + ',' + (node.y + node.height),
        node.x + ',' + centerY
      ];
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (
      node.type === 'pentagon' ||
      node.type === 'hexagon' ||
      node.type === 'preparation'
    ) {
      points = node.type === 'pentagon' ? [
        centerX + ',' + node.y,
        (node.x + node.width) + ',' + (node.y + node.height * 0.38),
        (node.x + node.width * 0.82) + ',' + (node.y + node.height),
        (node.x + node.width * 0.18) + ',' + (node.y + node.height),
        node.x + ',' + (node.y + node.height * 0.38)
      ] : [
        (node.x + node.width * 0.2) + ',' + node.y,
        (node.x + node.width * 0.8) + ',' + node.y,
        (node.x + node.width) + ',' + centerY,
        (node.x + node.width * 0.8) + ',' + (node.y + node.height),
        (node.x + node.width * 0.2) + ',' + (node.y + node.height),
        node.x + ',' + centerY
      ];
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (node.type === 'star') {
      points = [];
      for (index = 0; index < 10; index += 1) {
        angle = -Math.PI / 2 + index * Math.PI / 5;
        radius = index % 2 === 0 ? 1 : 0.42;
        points.push(
          (centerX + Math.cos(angle) * radiusX * radius) + ',' +
          (centerY + Math.sin(angle) * radiusY * radius)
        );
      }
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (node.type === 'cross') {
      points = [
        (node.x + node.width * 0.35) + ',' + node.y,
        (node.x + node.width * 0.65) + ',' + node.y,
        (node.x + node.width * 0.65) + ',' + (node.y + node.height * 0.35),
        (node.x + node.width) + ',' + (node.y + node.height * 0.35),
        (node.x + node.width) + ',' + (node.y + node.height * 0.65),
        (node.x + node.width * 0.65) + ',' + (node.y + node.height * 0.65),
        (node.x + node.width * 0.65) + ',' + (node.y + node.height),
        (node.x + node.width * 0.35) + ',' + (node.y + node.height),
        (node.x + node.width * 0.35) + ',' + (node.y + node.height * 0.65),
        node.x + ',' + (node.y + node.height * 0.65),
        node.x + ',' + (node.y + node.height * 0.35),
        (node.x + node.width * 0.35) + ',' + (node.y + node.height * 0.35)
      ];
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (node.type === 'arrowLeft' || node.type === 'arrowRight') {
      points = node.type === 'arrowLeft' ? [
        node.x + ',' + centerY,
        (node.x + node.width * 0.42) + ',' + node.y,
        (node.x + node.width * 0.42) + ',' + (node.y + node.height * 0.3),
        (node.x + node.width) + ',' + (node.y + node.height * 0.3),
        (node.x + node.width) + ',' + (node.y + node.height * 0.7),
        (node.x + node.width * 0.42) + ',' + (node.y + node.height * 0.7),
        (node.x + node.width * 0.42) + ',' + (node.y + node.height)
      ] : [
        (node.x + node.width) + ',' + centerY,
        (node.x + node.width * 0.58) + ',' + node.y,
        (node.x + node.width * 0.58) + ',' + (node.y + node.height * 0.3),
        node.x + ',' + (node.y + node.height * 0.3),
        node.x + ',' + (node.y + node.height * 0.7),
        (node.x + node.width * 0.58) + ',' + (node.y + node.height * 0.7),
        (node.x + node.width * 0.58) + ',' + (node.y + node.height)
      ];
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (
      node.type === 'data' ||
      node.type === 'manualInput'
    ) {
      points = [
        (node.x + node.width * (node.type === 'manualInput' ? 0.18 : 0.15)) +
          ',' + node.y,
        (node.x + node.width) + ',' + node.y,
        (node.x + node.width * (node.type === 'manualInput' ? 1 : 0.85)) +
          ',' + (node.y + node.height),
        node.x + ',' + (node.y + node.height)
      ];
      shape = createDiagramSvgElement('polygon', { points: points.join(' ') });
    } else if (node.type === 'document') {
      path = 'M ' + node.x + ' ' + node.y +
        ' H ' + (node.x + node.width) +
        ' V ' + (node.y + node.height * 0.82) +
        ' Q ' + (node.x + node.width * 0.75) + ' ' + (node.y + node.height * 0.65) +
        ' ' + (node.x + node.width * 0.5) + ' ' + (node.y + node.height * 0.82) +
        ' Q ' + (node.x + node.width * 0.25) + ' ' + (node.y + node.height) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.82) + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'database') {
      path = 'M ' + node.x + ' ' + (node.y + node.height * 0.16) +
        ' C ' + node.x + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.16) +
        ' V ' + (node.y + node.height * 0.84) +
        ' C ' + (node.x + node.width) + ' ' + (node.y + node.height) +
        ' ' + node.x + ' ' + (node.y + node.height) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.84) + ' Z' +
        ' M ' + node.x + ' ' + (node.y + node.height * 0.16) +
        ' C ' + node.x + ' ' + (node.y + node.height * 0.32) +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.32) +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height * 0.16);
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'predefinedProcess') {
      path = 'M ' + node.x + ' ' + node.y +
        ' H ' + (node.x + node.width) +
        ' V ' + (node.y + node.height) +
        ' H ' + node.x + ' Z' +
        ' M ' + (node.x + node.width * 0.14) + ' ' + node.y +
        ' V ' + (node.y + node.height) +
        ' M ' + (node.x + node.width * 0.86) + ' ' + node.y +
        ' V ' + (node.y + node.height);
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'delay') {
      path = 'M ' + node.x + ' ' + node.y +
        ' H ' + (node.x + node.width * 0.56) +
        ' C ' + (node.x + node.width) + ' ' + node.y +
        ' ' + (node.x + node.width) + ' ' + (node.y + node.height) +
        ' ' + (node.x + node.width * 0.56) + ' ' + (node.y + node.height) +
        ' H ' + node.x + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'display') {
      path = 'M ' + (node.x + node.width * 0.16) + ' ' + node.y +
        ' H ' + (node.x + node.width * 0.72) +
        ' Q ' + (node.x + node.width) + ' ' + centerY +
        ' ' + (node.x + node.width * 0.72) + ' ' + (node.y + node.height) +
        ' H ' + (node.x + node.width * 0.16) +
        ' Q ' + node.x + ' ' + centerY +
        ' ' + (node.x + node.width * 0.16) + ' ' + node.y + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else if (node.type === 'cloud') {
      path = 'M ' + (node.x + node.width * 0.2) + ' ' + (node.y + node.height * 0.78) +
        ' C ' + (node.x - node.width * 0.03) + ' ' + (node.y + node.height * 0.72) +
        ' ' + node.x + ' ' + (node.y + node.height * 0.36) +
        ' ' + (node.x + node.width * 0.23) + ' ' + (node.y + node.height * 0.38) +
        ' C ' + (node.x + node.width * 0.24) + ' ' + (node.y + node.height * 0.08) +
        ' ' + (node.x + node.width * 0.58) + ' ' + (node.y + node.height * 0.02) +
        ' ' + (node.x + node.width * 0.68) + ' ' + (node.y + node.height * 0.27) +
        ' C ' + (node.x + node.width * 0.96) + ' ' + (node.y + node.height * 0.18) +
        ' ' + (node.x + node.width * 1.08) + ' ' + (node.y + node.height * 0.57) +
        ' ' + (node.x + node.width * 0.86) + ' ' + (node.y + node.height * 0.72) +
        ' C ' + (node.x + node.width * 0.7) + ' ' + (node.y + node.height) +
        ' ' + (node.x + node.width * 0.35) + ' ' + (node.y + node.height * 0.98) +
        ' ' + (node.x + node.width * 0.2) + ' ' + (node.y + node.height * 0.78) + ' Z';
      shape = createDiagramSvgElement('path', { d: path });
    } else {
      shape = createDiagramSvgElement('rect', {
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        rx: node.type === 'roundedRectangle' ? 12 : 0,
        ry: node.type === 'roundedRectangle' ? 12 : 0
      });
    }
    shape.setAttribute('class', 'fui-diagram-node-shape');
    shape.setAttribute('fill', node.type === 'text' ? 'transparent' : node.fill);
    shape.setAttribute('stroke', node.type === 'text' ? 'transparent' : node.stroke);
    shape.setAttribute('stroke-width', node.strokeWidth);
    return shape;
  };

  Diagram.prototype._renderNodeText = function(group, node) {
    var source = String(node.text || '');
    var text = createDiagramSvgElement('text', {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
      fill: node.textColor,
      'text-anchor': 'middle',
      class: 'fui-diagram-node-text'
    });
    var paragraphs = source.split(/\r?\n/);
    var lines = [];
    var maxChars = Math.max(8, Math.floor(node.width / 8));
    paragraphs.forEach(function(paragraph) {
      var hasWhitespace = /\s/.test(paragraph);
      var words = hasWhitespace ? paragraph.split(/\s+/) : paragraph.split('');
      var line = '';
      if (!paragraph) {
        lines.push('');
        return;
      }
      words.forEach(function(word) {
        var next = line ? line + (hasWhitespace ? ' ' : '') + word : word;
        if (next.length > maxChars && line) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      });
      lines.push(line);
    });
    if (!lines.length) lines.push('');
    lines = lines.slice(0, 4);
    lines.forEach(function(value, index) {
      var tspan = createDiagramSvgElement('tspan', {
        x: node.x + node.width / 2,
        dy: index === 0 ? (-(lines.length - 1) * 8) : 18
      });
      tspan.textContent = value;
      text.appendChild(tspan);
    });
    group.appendChild(text);
  };

  Diagram.prototype._renderConnectionPoints = function(layer, node) {
    var state = this._interaction;
    if (this.options.readOnly) return;
    DIAGRAM_CONNECTION_POINTS.forEach(function(descriptor) {
      var point = getDiagramConnectionPoint(node, descriptor.name);
      var isTarget = state && state.type === 'connect' &&
        state.targetNodeId === node.id &&
        state.targetPoint === descriptor.name;
      var handle = createDiagramSvgElement('circle', {
        cx: point.x,
        cy: point.y,
        r: 5,
        class: 'fui-diagram-connection-point' +
          (isTarget ? ' fui-diagram-connection-point-target' : ''),
        'data-diagram-connection-point': descriptor.name,
        'data-node-id': node.id
      });
      layer.appendChild(handle);
    });
  };

  Diagram.prototype._renderSelection = function(layer, node, primary) {
    var directions = [
      ['nw', node.x, node.y],
      ['n', node.x + node.width / 2, node.y],
      ['ne', node.x + node.width, node.y],
      ['e', node.x + node.width, node.y + node.height / 2],
      ['se', node.x + node.width, node.y + node.height],
      ['s', node.x + node.width / 2, node.y + node.height],
      ['sw', node.x, node.y + node.height],
      ['w', node.x, node.y + node.height / 2]
    ];
    var outline = createDiagramSvgElement('rect', {
      x: node.x - 4,
      y: node.y - 4,
      width: node.width + 8,
      height: node.height + 8,
      class: 'fui-diagram-selection-outline'
    });
    layer.appendChild(outline);
    if (this.options.readOnly) return;
    if (primary) {
      directions.forEach(function(item) {
        var handle = createDiagramSvgElement('rect', {
          x: item[1] - 4,
          y: item[2] - 4,
          width: 8,
          height: 8,
          class: 'fui-diagram-resize-handle fui-diagram-resize-' + item[0],
          'data-diagram-resize': item[0],
          'data-node-id': node.id
        });
        layer.appendChild(handle);
      });
    }
    this._renderConnectionPoints(layer, node);
  };

  Diagram.prototype._renderCanvas = function() {
    var self = this;
    var svg = this.svgElement;
    var previewCurve;
    var previewPath;
    var defs = createDiagramSvgElement('defs');
    var pattern = createDiagramSvgElement('pattern', {
      id: 'fui-diagram-grid-' + this._instanceId,
      width: this.options.gridSize,
      height: this.options.gridSize,
      patternUnits: 'userSpaceOnUse'
    });
    var gridBackground = createDiagramSvgElement('rect', {
      x: 0,
      y: 0,
      width: this.options.gridSize,
      height: this.options.gridSize,
      fill: this.options.pageColor
    });
    var gridPath = createDiagramSvgElement('path', {
      d: 'M ' + this.options.gridSize + ' 0 L 0 0 0 ' + this.options.gridSize,
      class: 'fui-diagram-grid-line',
      fill: 'none',
      stroke: '#d1d5db',
      'stroke-width': 1
    });
    var marker = createDiagramSvgElement('marker', {
      id: 'fui-diagram-arrow-' + this._instanceId,
      viewBox: '0 0 10 10',
      refX: 9,
      refY: 5,
      markerWidth: 7,
      markerHeight: 7,
      orient: 'auto-start-reverse'
    });
    var markerPath = createDiagramSvgElement('path', {
      d: 'M 0 0 L 10 5 L 0 10 z',
      class: 'fui-diagram-arrow',
      fill: 'context-stroke'
    });
    var page = createDiagramSvgElement('rect', {
      x: 0,
      y: 0,
      width: this.options.pageWidth,
      height: this.options.pageHeight,
      fill: this.options.showGrid ?
        'url(#fui-diagram-grid-' + this._instanceId + ')' :
        this.options.pageColor,
      class: 'fui-diagram-page'
    });
    var connectorLayer = createDiagramSvgElement('g', {
      class: 'fui-diagram-connectors'
    });
    var nodeLayer = createDiagramSvgElement('g', {
      class: 'fui-diagram-nodes'
    });
    var selectionLayer = createDiagramSvgElement('g', {
      class: 'fui-diagram-selection'
    });
    svg.textContent = '';
    pattern.appendChild(gridBackground);
    pattern.appendChild(gridPath);
    marker.appendChild(markerPath);
    defs.appendChild(pattern);
    defs.appendChild(marker);
    svg.appendChild(defs);
    svg.appendChild(page);
    this._data.connectors.forEach(function(connector) {
      var from = self.getNode(connector.from);
      var to = self.getNode(connector.to);
      var geometry;
      var group;
      var hitPath;
      var path;
      var label;
      if (!from || !to) return;
      geometry = calculateDiagramConnectorPath(
        from,
        to,
        connector.type,
        connector.fromPoint,
        connector.toPoint
      );
      group = createDiagramSvgElement('g', {
        class: 'fui-diagram-connector' +
          (self._selected && self._selected.type === 'connector' &&
          self._selected.id === connector.id ? ' fui-diagram-connector-selected' : ''),
        'data-diagram-connector': '',
        'data-connector-id': connector.id
      });
      hitPath = createDiagramSvgElement('path', {
        d: geometry.path,
        class: 'fui-diagram-connector-hit',
        fill: 'none',
        stroke: 'transparent',
        'stroke-width': 14
      });
      path = createDiagramSvgElement('path', {
        d: geometry.path,
        class: 'fui-diagram-connector-line',
        fill: 'none',
        stroke: connector.stroke,
        'stroke-width': connector.strokeWidth,
        'stroke-dasharray': connector.lineStyle === 'dashed' ? '7 5' : '',
        'marker-end': 'url(#fui-diagram-arrow-' + self._instanceId + ')'
      });
      group.appendChild(hitPath);
      group.appendChild(path);
      if (connector.text) {
        label = createDiagramSvgElement('text', {
          x: geometry.label.x,
          y: geometry.label.y - 7,
          class: 'fui-diagram-connector-label',
          'text-anchor': 'middle'
        });
        label.textContent = connector.text;
        group.appendChild(label);
      }
      connectorLayer.appendChild(group);
    });
    this._data.nodes.forEach(function(node) {
      var group = createDiagramSvgElement('g', {
        class: 'fui-diagram-node' +
          (self._isNodeSelected(node.id) ? ' fui-diagram-node-selected' : '') +
          (self._connectSourceId === node.id ? ' fui-diagram-connect-source' : ''),
        'data-diagram-node': '',
        'data-node-id': node.id
      });
      group.appendChild(self._createShapeElement(node));
      self._renderNodeText(group, node);
      nodeLayer.appendChild(group);
      if (self._isNodeSelected(node.id)) {
        self._renderSelection(
          selectionLayer,
          node,
          self._selected && self._selected.id === node.id
        );
      }
    });
    if (this._interaction && this._interaction.type === 'connect') {
      this._data.nodes.forEach(function(node) {
        if (!self._isNodeSelected(node.id)) {
          self._renderConnectionPoints(selectionLayer, node);
        }
      });
      if (this._interaction.connectorType === 'curved') {
        previewCurve = calculateDiagramCurve(
          this._interaction.startPoint,
          this._interaction.currentPoint
        );
        previewPath = previewCurve.path;
      } else {
        previewPath = 'M ' + this._interaction.startPoint.x + ' ' +
          this._interaction.startPoint.y + ' L ' +
          this._interaction.currentPoint.x + ' ' +
          this._interaction.currentPoint.y;
      }
      selectionLayer.appendChild(createDiagramSvgElement('path', {
        d: previewPath,
        class: 'fui-diagram-connector-preview'
      }));
    }
    if (this._interaction && this._interaction.type === 'marquee') {
      selectionLayer.appendChild(createDiagramSvgElement('rect', {
        x: Math.min(
          this._interaction.startPoint.x,
          this._interaction.currentPoint.x
        ),
        y: Math.min(
          this._interaction.startPoint.y,
          this._interaction.currentPoint.y
        ),
        width: Math.abs(
          this._interaction.currentPoint.x - this._interaction.startPoint.x
        ),
        height: Math.abs(
          this._interaction.currentPoint.y - this._interaction.startPoint.y
        ),
        class: 'fui-diagram-marquee'
      }));
    }
    svg.appendChild(connectorLayer);
    svg.appendChild(nodeLayer);
    svg.appendChild(selectionLayer);
    svg.style.width = Math.round(this.options.pageWidth * this.options.zoomLevel) + 'px';
    svg.style.height = Math.round(this.options.pageHeight * this.options.zoomLevel) + 'px';
    this._positionInlineTextEditor();
    this._syncToolbarStates();
  };

  Diagram.prototype._disposePropertyEditors = function() {
    this._propertyEditors.forEach(function(control) {
      control.dispose();
    });
    this._propertyEditors = [];
  };

  Diagram.prototype._propertyField = function(label, item, key, editor, options) {
    var self = this;
    var row = document.createElement('label');
    var caption = document.createElement('span');
    var input = document.createElement('input');
    var control;
    caption.textContent = label;
    row.className = 'fui-diagram-property-row';
    caption.className = 'fui-diagram-property-label';
    input.value = item[key] == null ? '' : String(item[key]);
    row.appendChild(caption);
    row.appendChild(input);
    this.propertiesBodyElement.appendChild(row);
    control = new EditBox(input, diagramAssign({
      editor: editor,
      width: '100%',
      theme: 'inherit',
      value: item[key],
      onChange: function(value) {
        if (editor === 'number') {
          value = diagramNumber(value, item[key]);
          if (key === 'width') value = Math.max(40, value);
          if (key === 'height') value = Math.max(30, value);
        }
        item[key] = value;
        self._renderCanvas();
        self._commit('change', {
          itemType: self._selected.type,
          item: item
        });
      }
    }, options || {}));
    this._propertyEditors.push(control);
  };

  Diagram.prototype._renderProperties = function() {
    var item;
    this._disposePropertyEditors();
    this.propertiesBodyElement.textContent = '';
    if (!this._selected) {
      this.propertiesBodyElement.textContent = this.messages.noSelection;
      return;
    }
    if (this._selected.type === 'node' && this._selectedNodeIds.length > 1) {
      this.propertiesBodyElement.textContent = this.messages.multipleSelection.replace(
        '{0}',
        String(this._selectedNodeIds.length)
      );
      return;
    }
    item = this._selected.type === 'node' ?
      this.getNode(this._selected.id) :
      this.getConnector(this._selected.id);
    if (!item) {
      this.propertiesBodyElement.textContent = this.messages.noSelection;
      return;
    }
    this._propertyField(this.messages.text, item, 'text', 'text');
    if (this._selected.type === 'node') {
      this._propertyField(this.messages.x, item, 'x', 'number', { precision: 0 });
      this._propertyField(this.messages.y, item, 'y', 'number', { precision: 0 });
      this._propertyField(this.messages.width, item, 'width', 'number', { precision: 0, min: 40 });
      this._propertyField(this.messages.height, item, 'height', 'number', { precision: 0, min: 30 });
      this._propertyField(this.messages.fill, item, 'fill', 'color');
      this._propertyField(this.messages.stroke, item, 'stroke', 'color');
    } else {
      this._propertyField(this.messages.stroke, item, 'stroke', 'color');
      this._propertyField(this.messages.lineStyle, item, 'lineStyle', 'combo', {
        editable: false,
        limitToList: true,
        data: [
          { value: 'solid', text: this.messages.solid },
          { value: 'dashed', text: this.messages.dashed }
        ]
      });
    }
  };

  Diagram.prototype._syncToolbarStates = function() {
    var undo = this._toolbarButtons.undo;
    var redo = this._toolbarButtons.redo;
    var remove = this._toolbarButtons.delete;
    var connect = this._toolbarButtons.connect;
    var properties = this._toolbarButtons.properties;
    var grid = this._toolbarButtons.grid;
    var fullscreen = this._toolbarButtons.fullscreen;
    if (undo) (this.canUndo() ? undo.enable() : undo.disable());
    if (redo) (this.canRedo() ? redo.enable() : redo.disable());
    if (remove) (this._selected ? remove.enable() : remove.disable());
    if (connect) {
      if (this._connectMode) connect.select(true);
      else connect.unselect(true);
    }
    if (properties) {
      if (this.options.propertiesPanel) properties.select(true);
      else properties.unselect(true);
    }
    if (grid) {
      if (this.options.showGrid) grid.select(true);
      else grid.unselect(true);
    }
    if (this.zoomLabelElement) {
      this.zoomLabelElement.textContent = Math.round(this.options.zoomLevel * 100) + '%';
    }
    if (fullscreen) {
      fullscreen.setText(
        document.fullscreenElement === this.hostElement ?
          this.messages.exitFullscreen :
          this.messages.fullscreen
      );
    }
  };

  Diagram.prototype._resetHistory = function() {
    this._history = [diagramClone(this._data)];
    this._historyIndex = 0;
    this.hasChanges = false;
  };

  Diagram.prototype._commit = function(action, detail) {
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push(diagramClone(this._data));
    this._historyIndex = this._history.length - 1;
    this.hasChanges = true;
    this._syncToolbarStates();
    this._fire('Changed', diagramAssign({
      action: action,
      data: this.getData()
    }, detail || {}));
  };

  Diagram.prototype._fire = function(name, detail) {
    var callback = this.options['on' + name];
    var listeners = (this._listeners[name.toLowerCase()] || []).slice();
    var eventDetail = diagramAssign({ diagram: this }, detail || {});
    if (typeof callback === 'function') {
      callback.call(this.hostElement, this, eventDetail);
    }
    listeners.forEach(function(listener) {
      listener.call(this, eventDetail);
    }, this);
  };

  Diagram.prototype.render = function() {
    this._renderCanvas();
    this._renderProperties();
    this._syncToolbarStates();
    return this;
  };

  Diagram.prototype.getData = function() {
    var data = diagramClone(this._data);
    data.page = this.getPaper();
    return data;
  };

  Diagram.prototype.setData = function(data, preserveHistory) {
    var page = data && data.page;
    var dimensions;
    this._closeInlineTextEditor(false);
    if (page) {
      this.options.paperSize = normalizeDiagramPaperSize(page.size);
      this.options.paperOrientation = normalizeDiagramPaperOrientation(
        page.orientation
      );
      dimensions = getDiagramPaperDimensions(
        this.options.paperSize,
        this.options.paperOrientation
      );
      this.options.pageWidth = Math.max(
        300,
        diagramNumber(page.width, dimensions.width)
      );
      this.options.pageHeight = Math.max(
        240,
        diagramNumber(page.height, dimensions.height)
      );
      if (page.color != null) {
        this.options.pageColor = String(page.color);
      }
    }
    this._data = normalizeDiagramData(data);
    this.options.nodes = this._data.nodes;
    this.options.connectors = this._data.connectors;
    this._selected = null;
    this._selectedNodeIds = [];
    this._connectSourceId = '';
    if (!preserveHistory) this._resetHistory();
    this.render();
    return this;
  };

  Diagram.prototype.getNode = function(id) {
    id = String(id == null ? '' : id);
    return this._data.nodes.find(function(node) {
      return node.id === id;
    }) || null;
  };

  Diagram.prototype.getConnector = function(id) {
    id = String(id == null ? '' : id);
    return this._data.connectors.find(function(connector) {
      return connector.id === id;
    }) || null;
  };

  Diagram.prototype.addNode = function(node) {
    var viewportRect;
    var normalized;
    node = diagramAssign({}, node || {});
    if (node.x == null || node.y == null) {
      viewportRect = {
        x: this.viewportElement.scrollLeft / this.options.zoomLevel +
          this.viewportElement.clientWidth / this.options.zoomLevel / 2,
        y: this.viewportElement.scrollTop / this.options.zoomLevel +
          this.viewportElement.clientHeight / this.options.zoomLevel / 2
      };
      if (node.x == null) node.x = viewportRect.x - 70;
      if (node.y == null) node.y = viewportRect.y - 36;
    }
    node.x = this._snap(node.x);
    node.y = this._snap(node.y);
    normalized = normalizeDiagramNode(node, this._data.nodes.length);
    this._data.nodes.push(normalized);
    this.selectItem('node', normalized.id, true);
    this._commit('add', { itemType: 'node', item: normalized });
    this.render();
    return normalized;
  };

  Diagram.prototype.addConnector = function(connector) {
    var normalized = normalizeDiagramConnector(connector, this._data.connectors.length);
    if (
      !this.getNode(normalized.from) ||
      !this.getNode(normalized.to) ||
      normalized.from === normalized.to
    ) return null;
    delete normalized._index;
    this._data.connectors.push(normalized);
    this.selectItem('connector', normalized.id, true);
    this._commit('add', { itemType: 'connector', item: normalized });
    this.render();
    return normalized;
  };

  Diagram.prototype.removeSelected = function() {
    var selected = this._selected;
    var removed;
    var removedIds;
    var removedItems;
    if (!selected || this.options.readOnly) return this;
    this._closeInlineTextEditor(false);
    if (selected.type === 'node') {
      removed = this.getNode(selected.id);
      removedIds = this._selectedNodeIds.slice();
      removedItems = removedIds.map(this.getNode.bind(this)).filter(Boolean);
      this._data.nodes = this._data.nodes.filter(function(node) {
        return removedIds.indexOf(node.id) < 0;
      });
      this._data.connectors = this._data.connectors.filter(function(connector) {
        return removedIds.indexOf(connector.from) < 0 &&
          removedIds.indexOf(connector.to) < 0;
      });
    } else {
      removed = this.getConnector(selected.id);
      this._data.connectors = this._data.connectors.filter(function(connector) {
        return connector.id !== selected.id;
      });
    }
    this._selected = null;
    this._selectedNodeIds = [];
    this._commit('remove', {
      itemType: selected.type,
      item: removed,
      items: removedItems || (removed ? [removed] : [])
    });
    this.render();
    return this;
  };

  Diagram.prototype.selectItem = function(type, id, silent) {
    var item = type === 'node' ? this.getNode(id) : this.getConnector(id);
    if (!item) return this;
    if (type === 'node') {
      if (
        this._selectedNodeIds.length === 1 &&
        this._selectedNodeIds[0] === String(id)
      ) return this;
      return this._setNodeSelection([id], id, silent);
    }
    if (
      this._selected &&
      this._selected.type === type &&
      this._selected.id === String(id)
    ) return this;
    this._selectedNodeIds = [];
    this._selected = { type: type, id: String(id) };
    this._renderCanvas();
    this._renderProperties();
    if (!silent) this._fireSelectionChanged();
    return this;
  };

  Diagram.prototype.clearSelection = function() {
    if (!this._selected && !this._selectedNodeIds.length) return this;
    this._selected = null;
    this._selectedNodeIds = [];
    this._renderCanvas();
    this._renderProperties();
    this._fireSelectionChanged();
    return this;
  };

  Diagram.prototype.getSelection = function() {
    return this._selected ? diagramAssign({}, this._selected) : null;
  };

  Diagram.prototype.getSelections = function() {
    if (this._selectedNodeIds.length) {
      return this._selectedNodeIds.map(function(id) {
        return { type: 'node', id: id };
      });
    }
    return this._selected ? [diagramAssign({}, this._selected)] : [];
  };

  Diagram.prototype.setConnectMode = function(enabled, type) {
    var connectorTools;
    var index;
    if (type != null) {
      this._connectType = ['straight', 'curved'].indexOf(type) >= 0 ?
        type :
        'orthogonal';
    }
    this._connectMode = Boolean(enabled) && !this.options.readOnly;
    if (!this._connectMode) this._connectSourceId = '';
    this.hostElement.classList.toggle('fui-diagram-connect-mode', this._connectMode);
    connectorTools = this.toolboxGroupsElement.querySelectorAll(
      '[data-diagram-connector-tool]'
    );
    for (index = 0; index < connectorTools.length; index += 1) {
      connectorTools[index].classList.toggle(
        'fui-diagram-shape-item-selected',
        this._connectMode &&
        connectorTools[index].getAttribute('data-diagram-connector-tool') ===
          this._connectType
      );
      connectorTools[index].setAttribute(
        'aria-pressed',
        this._connectMode &&
        connectorTools[index].getAttribute('data-diagram-connector-tool') ===
          this._connectType ?
          'true' :
          'false'
      );
    }
    this._renderCanvas();
    this._syncToolbarStates();
    return this;
  };

  Diagram.prototype.canUndo = function() {
    return this._historyIndex > 0;
  };

  Diagram.prototype.canRedo = function() {
    return this._historyIndex < this._history.length - 1;
  };

  Diagram.prototype.undo = function() {
    if (!this.canUndo()) return this;
    this._closeInlineTextEditor(false);
    this._historyIndex -= 1;
    this._data = diagramClone(this._history[this._historyIndex]);
    this._selected = null;
    this._selectedNodeIds = [];
    this.hasChanges = this._historyIndex !== 0;
    this.render();
    this._fire('Changed', { action: 'undo', data: this.getData() });
    return this;
  };

  Diagram.prototype.redo = function() {
    if (!this.canRedo()) return this;
    this._closeInlineTextEditor(false);
    this._historyIndex += 1;
    this._data = diagramClone(this._history[this._historyIndex]);
    this._selected = null;
    this._selectedNodeIds = [];
    this.hasChanges = true;
    this.render();
    this._fire('Changed', { action: 'redo', data: this.getData() });
    return this;
  };

  Diagram.prototype.setZoom = function(value) {
    var oldZoom = this.options.zoomLevel;
    var centerX = (this.viewportElement.scrollLeft + this.viewportElement.clientWidth / 2) / oldZoom;
    var centerY = (this.viewportElement.scrollTop + this.viewportElement.clientHeight / 2) / oldZoom;
    this.options.zoomLevel = diagramClamp(
      diagramNumber(value, oldZoom),
      this.options.minZoom,
      this.options.maxZoom
    );
    this._renderCanvas();
    this.viewportElement.scrollLeft =
      centerX * this.options.zoomLevel - this.viewportElement.clientWidth / 2;
    this.viewportElement.scrollTop =
      centerY * this.options.zoomLevel - this.viewportElement.clientHeight / 2;
    return this;
  };

  Diagram.prototype.fitToContent = function() {
    var bounds;
    var padding = 80;
    var width;
    var height;
    var zoom;
    if (!this._data.nodes.length) return this.setZoom(1);
    bounds = this._data.nodes.reduce(function(result, node) {
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
    width = bounds.right - bounds.left + padding * 2;
    height = bounds.bottom - bounds.top + padding * 2;
    zoom = Math.min(
      this.viewportElement.clientWidth / width,
      this.viewportElement.clientHeight / height
    );
    this.setZoom(zoom);
    this.viewportElement.scrollLeft = Math.max(
      0,
      (bounds.left - padding) * this.options.zoomLevel
    );
    this.viewportElement.scrollTop = Math.max(
      0,
      (bounds.top - padding) * this.options.zoomLevel
    );
    return this;
  };

  Diagram.prototype.setShowGrid = function(value) {
    this.options.showGrid = diagramBoolean(value, true);
    this._renderCanvas();
    return this;
  };

  Diagram.prototype.getPaper = function() {
    return {
      size: this.options.paperSize,
      orientation: this.options.paperOrientation,
      width: this.options.pageWidth,
      height: this.options.pageHeight,
      color: this.options.pageColor
    };
  };

  Diagram.prototype.setPaper = function(size, orientation) {
    var dimensions;
    var changed;
    size = normalizeDiagramPaperSize(size);
    orientation = normalizeDiagramPaperOrientation(orientation);
    dimensions = getDiagramPaperDimensions(size, orientation);
    changed = this.options.paperSize !== size ||
      this.options.paperOrientation !== orientation ||
      this.options.pageWidth !== dimensions.width ||
      this.options.pageHeight !== dimensions.height;
    this.options.paperSize = size;
    this.options.paperOrientation = orientation;
    this.options.pageWidth = dimensions.width;
    this.options.pageHeight = dimensions.height;
    this.render();
    if (changed) {
      this.hasChanges = true;
      this._fire('Changed', {
        action: 'pageChange',
        itemType: 'page',
        item: this.getPaper(),
        data: this.getData()
      });
    }
    return this;
  };

  Diagram.prototype.toggleFullscreen = function() {
    if (document.fullscreenElement === this.hostElement) {
      if (document.exitFullscreen) document.exitFullscreen();
    } else if (this.hostElement.requestFullscreen) {
      this.hostElement.requestFullscreen();
    }
    return this;
  };

  Diagram.prototype.import = function(source) {
    var data = typeof source === 'string' ? JSON.parse(source) : source;
    return this.setData(data);
  };

  Diagram.prototype.export = function(filename) {
    var json = JSON.stringify(this.getData(), null, 2);
    if (filename) {
      diagramDownloadBlob(
        new Blob([json], { type: 'application/json;charset=utf-8' }),
        filename
      );
    }
    return json;
  };

  Diagram.prototype.getSvg = function() {
    var clone = this.svgElement.cloneNode(true);
    var selection = clone.querySelector('.fui-diagram-selection');
    var serializer = new XMLSerializer();
    clone.setAttribute('xmlns', DIAGRAM_SVG_NS);
    clone.style.width = this.options.pageWidth + 'px';
    clone.style.height = this.options.pageHeight + 'px';
    if (selection) selection.parentNode.removeChild(selection);
    return serializer.serializeToString(clone);
  };

  Diagram.prototype.exportSvg = function(filename) {
    var svg = this.getSvg();
    if (filename) {
      diagramDownloadBlob(
        new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
        filename
      );
    }
    return svg;
  };

  Diagram.prototype.setLocale = function(locale) {
    this._disposePaperDialog();
    this.options.locale = normalizeDiagramLocale(locale);
    this.messages = localePacks[this.options.locale];
    this.hostElement.setAttribute(
      'aria-label',
      this.options.ariaLabel || this.messages.diagram
    );
    this.toolboxHeaderElement.textContent = this.messages.toolbox;
    this.propertiesHeaderElement.textContent = this.messages.properties;
    if (this.toolboxSearchControl) {
      this.toolboxSearchControl.textbox().setAttribute(
        'placeholder',
        this.messages.searchShapes
      );
    }
    this._renderToolbox();
    if (this._toolbarButtons.delete) this._toolbarButtons.delete.setText(this.messages.deleteItem);
    if (this._toolbarButtons.connect) this._toolbarButtons.connect.setText(this.messages.connect);
    if (this._toolbarButtons.properties) this._toolbarButtons.properties.setText(this.messages.properties);
    if (this._toolbarButtons.fit) this._toolbarButtons.fit.setText(this.messages.fit);
    if (this._toolbarButtons.grid) this._toolbarButtons.grid.setText(this.messages.grid);
    if (this._toolbarButtons.undo) {
      this._toolbarButtons.undo.hostElement.title = this.messages.undo;
    }
    if (this._toolbarButtons.redo) {
      this._toolbarButtons.redo.hostElement.title = this.messages.redo;
    }
    this._renderProperties();
    this._syncToolbarStates();
    return this;
  };

  Diagram.prototype.setTheme = function(theme) {
    var index;
    this._disposePaperDialog();
    this.options.theme = theme == null ? 'inherit' : theme;
    this.theme = this.options.theme === 'inherit' ?
      findDiagramTheme(this._themeSource) :
      normalizeDiagramTheme(this.options.theme);
    for (index = 0; index < DIAGRAM_THEMES.length; index += 1) {
      this.hostElement.classList.remove('fg-theme-' + DIAGRAM_THEMES[index]);
    }
    this.hostElement.classList.add('fg-theme-' + this.theme);
    this._buttonControls.forEach(function(control) {
      control.setTheme('inherit');
    });
    this._editBoxControls.concat(this._propertyEditors).forEach(function(control) {
      if (control._control && typeof control._control.setTheme === 'function') {
        control.setTheme('inherit');
      }
    });
    return this;
  };

  Diagram.prototype.setReadOnly = function(value) {
    this.options.readOnly = diagramBoolean(value, false);
    if (this.options.readOnly) this._closeInlineTextEditor(false);
    this.setConnectMode(false);
    this._syncStructure();
    this.render();
    return this;
  };

  Diagram.prototype.on = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!name || typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  Diagram.prototype.off = function(name, listener) {
    name = String(name || '').toLowerCase();
    if (!this._listeners[name]) return this;
    this._listeners[name] = listener ?
      this._listeners[name].filter(function(item) { return item !== listener; }) :
      [];
    return this;
  };

  Diagram.prototype.destroy = function() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._closeInlineTextEditor(false);
    this._disposePaperDialog();
    this._unbindDocumentInteraction();
    this.removeEventListener();
    this._buttonControls.forEach(function(control) {
      control.dispose();
    });
    this._toolboxButtonControls.forEach(function(control) {
      control.dispose();
    });
    this._editBoxControls.forEach(function(control) {
      control.dispose();
    });
    this._disposePropertyEditors();
    unregisterControl(this.hostElement, this);
    delete this.hostElement.__fabuiDiagram;
    restoreDiagramAttribute(this.hostElement, 'class', this._original.className);
    restoreDiagramAttribute(this.hostElement, 'style', this._original.style);
    restoreDiagramAttribute(this.hostElement, 'role', this._original.role);
    restoreDiagramAttribute(this.hostElement, 'aria-label', this._original.ariaLabel);
    restoreDiagramAttribute(this.hostElement, 'tabindex', this._original.tabIndex);
    this.hostElement.innerHTML = this._original.html;
    this._listeners = {};
  };

  Diagram.prototype.dispose = Diagram.prototype.destroy;
  Diagram.defaults = defaults;
  Diagram.locales = localePacks;
  Diagram.themes = DIAGRAM_THEMES.slice();
  Diagram.shapes = DIAGRAM_SHAPES.map(function(shape) {
    return diagramAssign({}, shape);
  });
  Diagram.connectorTools = DIAGRAM_CONNECTOR_TOOLS.map(function(tool) {
    return diagramAssign({}, tool);
  });
  Diagram.paperSizes = diagramClone(DIAGRAM_PAPER_SIZES);
  Diagram.connectionPoints = DIAGRAM_CONNECTION_POINTS.map(function(point) {
    return diagramAssign({}, point);
  });
  Diagram.getControl = function(element) {
    element = resolveDiagramElement(element);
    return element && element.__fabuiDiagram ? element.__fabuiDiagram : null;
  };
  Diagram.normalizeLocale = normalizeDiagramLocale;
  Diagram.normalizeTheme = normalizeDiagramTheme;
  Diagram.normalizeData = normalizeDiagramData;
  return Diagram;
}
