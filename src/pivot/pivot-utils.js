export function normalizePivotComparable(value, dataType) {
  var date;
  var type = String(dataType || '').toLowerCase();
  if (type === 'date' || value instanceof Date) {
    date = value instanceof Date ? value : new Date(value);
    if (!isNaN(date.getTime())) {
      return ['date', date.getTime()];
    }
  }
  if (value === null) return ['null', null];
  if (value === undefined) return ['undefined', null];
  if (typeof value === 'number' && isNaN(value)) return ['nan', null];
  return [typeof value, value];
}

export function pivotValuesEqual(left, right, dataType) {
  var leftValue = normalizePivotComparable(left, dataType);
  var rightValue = normalizePivotComparable(right, dataType);
  return leftValue[0] === rightValue[0] && leftValue[1] === rightValue[1];
}

export function createPivotPathKey(path) {
  return JSON.stringify((path || []).map(function(value) {
    return normalizePivotComparable(value);
  }));
}

export function isPivotPathPrefix(parentPath, path) {
  var i;
  parentPath = parentPath || [];
  path = path || [];
  if (parentPath.length > path.length) {
    return false;
  }
  for (i = 0; i < parentPath.length; i += 1) {
    if (!pivotValuesEqual(parentPath[i], path[i])) {
      return false;
    }
  }
  return true;
}
