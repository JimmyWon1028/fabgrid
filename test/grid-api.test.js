import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFabGridFactory } from '../src/grid/fabgrid.js';
import { createEditorDefinitions } from '../src/editbox/editbox-definitions.js?v=20260721-grid-number-spinner-v1';
import {
  applyHeaderCellStyle,
  getSizeLayerWidth
} from '../src/grid/fabgrid-view.js?v=20260803-scroll-clamp-v1';
import { canSwitchFilterMode } from '../src/grid/fabgrid-filter-ui.js?v=20260722-filter-mode-switch-v1';
import { Control } from '../src/core/control.js?v=20260716-control-events-v3';
import { CellType, GroupRow, Row, createGridPanel } from '../src/grid/fabgrid-types.js?v=20260716-row-types-v1';
import { CollectionView } from '../src/collections/collection-view.js?v=20260727-collection-view-sort-v1';

function createFakeElement(classNames, attributes, rect) {
  var values = attributes || {};
  return {
    nodeType: 1,
    parentElement: null,
    classList: {
      contains: function(name) {
        return classNames.indexOf(name) >= 0;
      }
    },
    hasAttribute: function(name) {
      return Object.prototype.hasOwnProperty.call(values, name);
    },
    getAttribute: function(name) {
      return this.hasAttribute(name) ? String(values[name]) : null;
    },
    getBoundingClientRect: function() {
      return rect || { left: 0, top: 0, right: 100, bottom: 32, width: 100, height: 32 };
    }
  };
}

test('size layer width follows columns instead of a stale pre-scrollbar viewport', function() {
  assert.equal(getSizeLayerWidth(40, 0, 300, 0), 340);
  assert.equal(getSizeLayerWidth(40, 100, 240, 60), 440);
});

test('empty pagination render keeps using its internal DOM after pager alias is overwritten', function() {
  var FabGrid = createFabGridFactory({});
  var pagerElement = { style: {} };
  var paginationElement = {
    style: {},
    innerHTML: '',
    setAttribute: function(name, value) {
      this[name] = value;
    }
  };
  var grid = {
    options: {
      pageSize: 10,
      pageNumber: 1,
      pageList: [10],
      showPageList: false,
      showPageInfo: true,
      showRefresh: false
    },
    paginationTotal: 0,
    pager: { pageNumber: 1, pageSize: 10 },
    pagination: { pageNumber: 1 },
    _pagerElement: pagerElement,
    _paginationElement: paginationElement,
    getPaginationHeight: function() {
      return 35;
    },
    getText: function(path, data) {
      if (path === 'pagination.displayMsg') {
        return data.from + '-' + data.to + '-' + data.total;
      }
      return path;
    },
    createPaginationButton: FabGrid.prototype.createPaginationButton
  };

  assert.doesNotThrow(function() {
    FabGrid.prototype.renderPagination.call(grid);
  });
  assert.equal(pagerElement.style.height, '35px');
  assert.equal(paginationElement.style.display, 'flex');
  assert.match(paginationElement.innerHTML, />0-0-0</);
});

test('Grid focus events fire only when focus enters or leaves the Grid', function() {
  var FabGrid = createFabGridFactory({});
  var eventGrid = { wijmoEvents: {} };
  var inside = {};
  var outside = {};
  var ownerDocument = { activeElement: outside };
  var raised = [];
  var grid = {
    root: {
      ownerDocument: ownerDocument,
      contains: function(target) {
        return target === inside;
      }
    },
    containsFocusTarget: FabGrid.prototype.containsFocusTarget,
    emit: function(name, args) {
      raised.push({ name: name, args: args });
    }
  };

  FabGrid.prototype.createWijmoEvents.call(eventGrid);
  assert.equal(typeof eventGrid.gotFocus.addHandler, 'function');
  assert.equal(typeof eventGrid.lostFocus.addHandler, 'function');
  assert.equal(Object.getOwnPropertyDescriptor(FabGrid.prototype, 'hasFocus').get.call(grid), false);

  ownerDocument.activeElement = inside;
  assert.equal(Object.getOwnPropertyDescriptor(FabGrid.prototype, 'hasFocus').get.call(grid), true);

  FabGrid.prototype.handleFocusIn.call(grid, { relatedTarget: outside });
  FabGrid.prototype.handleFocusIn.call(grid, { relatedTarget: inside });
  FabGrid.prototype.handleFocusOut.call(grid, { relatedTarget: inside });
  FabGrid.prototype.handleFocusOut.call(grid, { relatedTarget: outside });

  assert.deepEqual(raised.map(function(item) {
    return item.name;
  }), ['gotFocus', 'lostFocus']);
  assert.equal(raised[0].args.relatedTarget, outside);
  assert.equal(raised[1].args.relatedTarget, outside);

  ownerDocument.activeElement = outside;
  assert.equal(Object.getOwnPropertyDescriptor(FabGrid.prototype, 'hasFocus').get.call(grid), false);
});

test('Grid focus leaving commits the editor but owned popup focus stays inside', function() {
  var FabGrid = createFabGridFactory({});
  var inside = {};
  var popupTarget = {};
  var outside = {};
  var finishCalls = [];
  var raised = [];
  var grid = {
    editing: { row: 0, col: 0 },
    root: {
      contains: function(target) {
        return target === inside;
      }
    },
    dateboxPanel: {
      contains: function(target) {
        return target === popupTarget;
      }
    },
    containsFocusTarget: FabGrid.prototype.containsFocusTarget,
    finishEditing: function(commit, options) {
      finishCalls.push({ commit: commit, options: options });
      this.editing = null;
      return true;
    },
    emit: function(name, args) {
      raised.push({ name: name, args: args });
    }
  };

  FabGrid.prototype.handleFocusOut.call(grid, { relatedTarget: popupTarget });
  assert.equal(finishCalls.length, 0);
  assert.equal(raised.length, 0);

  FabGrid.prototype.handleFocusOut.call(grid, { relatedTarget: outside });
  assert.deepEqual(finishCalls, [{
    commit: true,
    options: { restoreFocus: false }
  }]);
  assert.deepEqual(raised.map(function(item) {
    return item.name;
  }), ['lostFocus']);
});

test('all Grid editor types commit their value without restoring focus on blur', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var cases = [
    {
      type: 'text',
      column: { binding: 'value', dataType: 'string', editor: 'text' },
      editorValue: 'Beta',
      expected: 'Beta'
    },
    {
      type: 'text-multiline',
      column: {
        binding: 'value',
        dataType: 'string',
        editor: 'text',
        multiLine: true
      },
      editorValue: 'Line one\nLine two',
      expected: 'Line one\nLine two'
    },
    {
      type: 'number',
      column: { binding: 'value', dataType: 'number', precision: 2, editor: 'number' },
      editorValue: '1,234.56',
      expected: 1234.56
    },
    {
      type: 'time',
      column: {
        binding: 'value',
        dataType: 'string',
        mask: '99:99',
        editor: 'time'
      },
      editorValue: '09:30',
      expected: '09:30'
    },
    {
      type: 'date',
      column: { binding: 'value', dataType: 'date', editor: 'date' },
      editorValue: '2026-08-09',
      editValue: '2026-08-09',
      expected: '2026-08-09'
    },
    {
      type: 'date-string',
      column: { binding: 'value', dataType: 'string', editor: 'date' },
      editorValue: '2026-08-09',
      expected: '2026-08-09'
    },
    {
      type: 'combo',
      column: {
        binding: 'value',
        dataType: 'string',
        editor: {
          type: 'combo',
          valueField: 'id',
          textField: 'text',
          data: [
            { id: 'a', text: 'Alpha' },
            { id: 'b', text: 'Beta' }
          ]
        }
      },
      editorValue: 'Beta',
      editValue: 'b',
      expected: 'b'
    },
    {
      type: 'color',
      column: { binding: 'value', dataType: 'string', editor: 'color' },
      initial: '',
      editorValue: '#fff',
      expected: '#ffffff'
    }
  ];

  cases.forEach(function(entry) {
    var item = {
      value: Object.prototype.hasOwnProperty.call(entry, 'initial') ?
        entry.initial :
        'before'
    };
    var focusCount = 0;
    var grid = Object.create(FabGrid.prototype);

    grid.editing = {
      row: 0,
      col: 0,
      item: item,
      original: item.value
    };
    if (entry.type === 'date') {
      grid.editing.dateboxValue = entry.editValue;
    }
    if (entry.type === 'combo') {
      grid.editing.comboboxValue = entry.editValue;
    }
    grid.visibleColumns = [entry.column];
    grid.view = [item];
    grid.editor = { value: entry.editorValue };
    grid._suppressObservedItemChange = 0;
    grid.root = {
      focus: function() {
        focusCount += 1;
      }
    };
    grid.validateCellValue = function() {
      return null;
    };
    grid.clearCellValidationError = function() {};
    grid.clearEditingState = function() {
      this.editing = null;
    };
    grid.refreshCollectionView = function() {
      return true;
    };
    grid.emit = function() {
      return true;
    };

    assert.equal(
      FabGrid.prototype.finishEditing.call(grid, true, { restoreFocus: false }),
      true,
      entry.type
    );
    assert.equal(item.value, entry.expected, entry.type);
    assert.equal(focusCount, 0, entry.type);
  });
});

test('Grid batch update waits for the outer endUpdate and refreshes once', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var refreshCount = 0;

  grid._updateCount = 0;
  grid._updatePendingRefresh = false;
  grid._updatePendingRender = false;
  grid._updatePendingInvalidate = false;
  grid._updatePendingSkipLayout = true;

  grid.beginUpdate();
  grid.beginUpdate();
  FabGrid.prototype.refresh.call(grid);
  FabGrid.prototype.render.call(grid, true);
  FabGrid.prototype.invalidate.call(grid);
  FabGrid.prototype.scheduleRender.call(grid);

  assert.equal(grid.isUpdating, true);
  assert.equal(grid._updatePendingRefresh, true);
  assert.equal(grid._updatePendingRender, true);
  assert.equal(grid._updatePendingInvalidate, true);

  grid.refresh = function() {
    refreshCount += 1;
  };
  grid.endUpdate();
  assert.equal(grid.isUpdating, true);
  assert.equal(refreshCount, 0);

  grid.endUpdate();
  assert.equal(grid.isUpdating, false);
  assert.equal(refreshCount, 1);
});

test('invalidate marks every footer aggregate dirty before scheduling render', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var scheduled = 0;

  grid._updateCount = 0;
  grid._footerAggregateCache = [{ value: 10 }];
  grid._footerAggregateCacheDirty = false;
  grid.scheduleRender = function() { scheduled += 1; };

  grid.invalidate();

  assert.deepEqual(grid._footerAggregateCache, []);
  assert.equal(grid._footerAggregateCacheDirty, true);
  assert.equal(scheduled, 1);
});

test('Grid batch update preserves render layout needs and supports endUpdate false', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var renderArgs = [];

  grid._updateCount = 0;
  grid.beginUpdate();
  FabGrid.prototype.render.call(grid, true);
  FabGrid.prototype.render.call(grid, false);
  grid.render = function(skipLayout) {
    renderArgs.push(skipLayout);
  };
  grid.endUpdate();

  assert.deepEqual(renderArgs, [false]);

  grid.beginUpdate();
  FabGrid.prototype.render.call(grid, false);
  grid.endUpdate(false);
  assert.deepEqual(renderArgs, [false]);
  assert.equal(grid.isUpdating, false);
});

test('Grid deferUpdate always resumes updates when the callback throws', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var invalidations = 0;

  grid._updateCount = 0;
  grid.invalidate = function() {
    invalidations += 1;
  };

  assert.throws(function() {
    grid.deferUpdate(function() {
      throw new Error('stop');
    });
  }, /stop/);
  assert.equal(grid.isUpdating, false);
  assert.equal(invalidations, 1);
  assert.throws(function() {
    grid.deferUpdate(null);
  }, /requires a callback/);
});

test('editing navigation scrolls after selection without top-aligning through select()', function() {
  var FabGrid = createFabGridFactory({});
  var calls = [];
  var grid = {
    editing: {
      row: 5,
      col: 1
    },
    options: {
      multiSelectRows: false
    },
    findEditableCellInRow: function() {
      return {
        row: 6,
        col: 1
      };
    },
    finishEditing: function() {
      return true;
    },
    select: function() {
      throw new Error('editing navigation must not use select() top alignment');
    },
    applyCellSelection: function(anchorRow, anchorCol, row, col) {
      calls.push(['selection', anchorRow, anchorCol, row, col]);
    },
    _scrollVisibleIntoView: function(row, col, options) {
      calls.push(['scroll', row, col, options && options.directionY]);
    },
    _startEditingVisible: function(row, col) {
      calls.push(['editing', row, col]);
    }
  };

  assert.equal(FabGrid.prototype.commitEditingAndMoveVertical.call(grid, 1), true);
  assert.deepEqual(calls, [
    ['selection', 6, 1, 6, 1],
    ['scroll', 6, 1, 1],
    ['editing', 6, 1]
  ]);

  calls = [];
  grid.findNextEditableCell = function() {
    return {
      row: 7,
      col: 1
    };
  };
  assert.equal(FabGrid.prototype.commitEditingAndMoveRight.call(grid), true);
  assert.deepEqual(calls, [
    ['selection', 7, 1, 7, 1],
    ['scroll', 7, 1, undefined],
    ['editing', 7, 1]
  ]);
});

test('editOnSelect true lets Enter and Tab wrap rows', function() {
  var FabGrid = createFabGridFactory({});
  var ownerDocument = {};
  var root = {
    nodeType: 1,
    tagName: 'DIV',
    className: 'fg-root',
    parentNode: null,
    ownerDocument: ownerDocument
  };
  var editor = {
    nodeType: 1,
    tagName: 'INPUT',
    className: 'fg-editor',
    parentNode: root,
    ownerDocument: ownerDocument
  };
  var calls = [];
  var grid = {
    root: root,
    editor: editor,
    selection: { row: 0, col: 0 },
    options: { editOnSelect: true },
    busy: false,
    editing: { row: 0, col: 0 },
    isFilterMenuOpen: function() { return false; },
    isTopLeftMenuOpen: function() { return false; },
    isColumnChooserOpen: function() { return false; },
    isHeaderToggleKey: function() { return false; },
    handleNumberSpinnerKeyDown: function() { return false; },
    handleMaskedEditorDelete: function() { return false; },
    handleDateboxKeyDown: function() { return false; },
    handleComboboxKeyDown: function() { return false; },
    handleColorKeyDown: function() { return false; },
    shouldBlockEditorKey: function() { return false; },
    commitEditingAndMoveLeft: function(sameRow) {
      calls.push(['left', sameRow === true]);
    },
    commitEditingAndMoveRight: function(sameRow) {
      calls.push(['right', sameRow === true]);
    }
  };

  ownerDocument.activeElement = editor;
  [
    { key: 'Enter', shiftKey: false },
    { key: 'Enter', shiftKey: true },
    { key: 'Tab', shiftKey: false },
    { key: 'Tab', shiftKey: true }
  ].forEach(function(keyCase) {
    FabGrid.prototype.handleKeyDown.call(grid, {
      key: keyCase.key,
      shiftKey: keyCase.shiftKey,
      target: editor,
      preventDefault: function() {},
      stopPropagation: function() {}
    });
  });

  assert.deepEqual(calls, [
    ['right', false],
    ['left', false],
    ['right', false],
    ['left', false]
  ]);
});

test('horizontal editable cell search can stay in the current row', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    view: [{ id: 1 }, { id: 2 }],
    visibleColumns: [{ binding: 'a' }, { binding: 'b' }],
    isCellEditable: function(row, col) {
      return (row === 0 && col === 1) || (row === 1 && col === 0);
    }
  };

  assert.equal(FabGrid.prototype.findNextEditableCell.call(grid, 0, 2, true), null);
  assert.deepEqual(
    FabGrid.prototype.findNextEditableCell.call(grid, 0, 2),
    { row: 1, col: 0 }
  );
  assert.equal(FabGrid.prototype.findPreviousEditableCell.call(grid, 1, -1, true), null);
  assert.deepEqual(
    FabGrid.prototype.findPreviousEditableCell.call(grid, 1, -1),
    { row: 0, col: 1 }
  );
});

test('editOnSelect false lets multiline Enter wrap rows while Tab only finishes editing', function() {
  var FabGrid = createFabGridFactory({});
  var ownerDocument = {};
  var root = {
    nodeType: 1,
    tagName: 'DIV',
    className: 'fg-root',
    parentNode: null,
    ownerDocument: ownerDocument
  };
  var editor = {
    nodeType: 1,
    tagName: 'TEXTAREA',
    className: 'fg-editor',
    parentNode: root,
    ownerDocument: ownerDocument
  };
  var finishCalls = [];
  var moveCalls = [];
  var grid = {
    root: root,
    editor: editor,
    selection: { row: 0, col: 0 },
    options: { editOnSelect: false },
    busy: false,
    editing: { row: 0, col: 0 },
    isFilterMenuOpen: function() { return false; },
    isTopLeftMenuOpen: function() { return false; },
    isColumnChooserOpen: function() { return false; },
    isHeaderToggleKey: function() { return false; },
    handleNumberSpinnerKeyDown: function() { return false; },
    handleMaskedEditorDelete: function() { return false; },
    handleDateboxKeyDown: function() { return false; },
    handleComboboxKeyDown: function() { return false; },
    handleColorKeyDown: function() { return false; },
    shouldBlockEditorKey: function() { return false; },
    commitEditingAndMoveLeft: function(sameRow) {
      moveCalls.push(['left', sameRow === true]);
      this.editing = null;
    },
    commitEditingAndMoveRight: function(sameRow) {
      moveCalls.push(['right', sameRow === true]);
      this.editing = null;
    },
    finishEditing: function(commit) {
      finishCalls.push(commit);
      this.editing = null;
      return true;
    }
  };

  ownerDocument.activeElement = editor;

  [
    { key: 'Enter', shiftKey: false },
    { key: 'Enter', shiftKey: true }
  ].forEach(function(keyCase) {
    var prevented = 0;
    var stopped = 0;
    grid.editing = { row: 0, col: 0 };
    FabGrid.prototype.handleKeyDown.call(grid, {
      key: keyCase.key,
      shiftKey: keyCase.shiftKey,
      target: editor,
      preventDefault: function() { prevented += 1; },
      stopPropagation: function() { stopped += 1; }
    });
    assert.equal(prevented, 1);
    assert.equal(stopped, 1);
    assert.equal(grid.editing, null);
  });
  assert.deepEqual(moveCalls, [
    ['right', false],
    ['left', false]
  ]);
  assert.deepEqual(finishCalls, []);

  [
    { key: 'Tab', shiftKey: false },
    { key: 'Tab', shiftKey: true }
  ].forEach(function(keyCase) {
    grid.editing = { row: 0, col: 0 };
    FabGrid.prototype.handleKeyDown.call(grid, {
      key: keyCase.key,
      shiftKey: keyCase.shiftKey,
      target: editor,
      preventDefault: function() {},
      stopPropagation: function() {}
    });
    assert.equal(grid.editing, null);
  });
  assert.deepEqual(finishCalls, [true, true]);

  ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].forEach(function(key) {
    var prevented = 0;
    var stopped = 0;
    grid.editing = { row: 0, col: 0 };
    FabGrid.prototype.handleKeyDown.call(grid, {
      key: key,
      shiftKey: false,
      target: editor,
      preventDefault: function() { prevented += 1; },
      stopPropagation: function() { stopped += 1; }
    });
    assert.equal(prevented, 0);
    assert.equal(stopped, 1);
    assert.deepEqual(grid.editing, { row: 0, col: 0 });
  });
  assert.deepEqual(finishCalls, [true, true]);
});

test('editOnSelect false starts editing the active cell from a typed character', function() {
  var FabGrid = createFabGridFactory({});
  var ownerDocument = {};
  var root = {
    nodeType: 1,
    tagName: 'DIV',
    className: 'fg-root',
    parentNode: null,
    ownerDocument: ownerDocument
  };
  var editor = {
    nodeType: 1,
    tagName: 'INPUT',
    className: 'fg-editor',
    parentNode: root,
    ownerDocument: ownerDocument,
    value: '',
    setSelectionRange: function(start, end) {
      this.selectionRange = [start, end];
    }
  };
  var startCalls = [];
  var inputCalls = 0;
  var prevented = 0;
  var stopped = 0;
  var grid = {
    root: root,
    editor: editor,
    selection: { row: 2, col: 3 },
    options: {
      allowEditing: true,
      autoClipboard: false,
      editOnSelect: false,
      multiSelectRows: false
    },
    view: [{}, {}, {}],
    busy: false,
    editing: null,
    isFilterMenuOpen: function() { return false; },
    isTopLeftMenuOpen: function() { return false; },
    isColumnChooserOpen: function() { return false; },
    isHeaderToggleKey: function() { return false; },
    handleFirstRowSearchFocus: function() { return false; },
    handleCellRangeKeyDown: function() { return false; },
    getVerticalBoundaryHotKeyDirection: function() { return 0; },
    getHorizontalBoundaryHotKeyDirection: function() { return 0; },
    handleTreeKeyDown: function() { return false; },
    _startEditingVisible: function(row, col) {
      startCalls.push([row, col]);
      this.editing = { row: row, col: col };
      this.editor.value = 'Original';
      return true;
    },
    shouldBlockEditorKey: function() { return false; },
    handleEditorInput: function() { inputCalls += 1; }
  };

  ownerDocument.activeElement = root;

  FabGrid.prototype.handleKeyDown.call(grid, {
    key: 'A',
    target: root,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: true,
    isComposing: false,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });

  assert.deepEqual(startCalls, [[2, 3]]);
  assert.deepEqual(grid.editing, { row: 2, col: 3 });
  assert.equal(editor.value, 'A');
  assert.deepEqual(editor.selectionRange, [1, 1]);
  assert.equal(inputCalls, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);

  grid.editing = null;
  FabGrid.prototype.handleKeyDown.call(grid, {
    key: 'c',
    target: root,
    altKey: false,
    ctrlKey: true,
    metaKey: false,
    shiftKey: false,
    isComposing: false,
    preventDefault: function() {},
    stopPropagation: function() {}
  });
  assert.deepEqual(startCalls, [[2, 3]]);
});

test('host resize observer invalidates an empty grid after its layout becomes visible', function() {
  var FabGrid = createFabGridFactory({});
  var OriginalResizeObserver = globalThis.ResizeObserver;
  var observedHost = null;
  var disconnected = false;
  var callback;
  var invalidations = 0;
  var grid = {
    host: {},
    _resizeObserver: null,
    invalidate: function() {
      invalidations += 1;
    }
  };

  globalThis.ResizeObserver = function(nextCallback) {
    callback = nextCallback;
    this.observe = function(host) {
      observedHost = host;
    };
    this.disconnect = function() {
      disconnected = true;
    };
  };

  try {
    FabGrid.prototype.bindResizeObserver.call(grid);
    assert.equal(observedHost, grid.host);

    callback();
    assert.equal(invalidations, 1);

    FabGrid.prototype.unbindResizeObserver.call(grid);
    assert.equal(disconnected, true);
    assert.equal(grid._resizeObserver, null);
  } finally {
    if (OriginalResizeObserver === undefined) {
      delete globalThis.ResizeObserver;
    } else {
      globalThis.ResizeObserver = OriginalResizeObserver;
    }
  }
});

test('Grid avoids a redundant window resize listener when ResizeObserver exists', function() {
  var source = readFileSync(
    new URL('../src/grid/fabgrid.js', import.meta.url),
    'utf8'
  );
  assert.match(
    source,
    /if \(typeof ResizeObserver !== 'function'\) \{\s*window\.addEventListener\('resize'/
  );
});

test('stopNavigation defaults to false and can be changed at runtime', function() {
  var FabGrid = createFabGridFactory({});
  var source = readFileSync(
    new URL('../src/grid/fabgrid.js', import.meta.url),
    'utf8'
  );
  var descriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'stopNavigation');
  var classes = new Set();
  var grid = {
    options: { stopNavigation: false },
    _stopNavigation: false,
    root: {
      classList: {
        toggle: function(name, enabled) {
          if (enabled) {
            classes.add(name);
          } else {
            classes.delete(name);
          }
        },
        remove: function(name) {
          classes.delete(name);
        }
      }
    },
    fixedPaneTouchTap: null,
    cellRangeDragState: null,
    cellRangeAutoScrollRaf: 0,
    verticalScrollbarDrag: null,
    horizontalScrollbarDrag: null,
    unbindVerticalScrollbarDragEvents: function() {},
    unbindHorizontalScrollbarDragEvents: function() {},
    applyStopNavigation: FabGrid.prototype.applyStopNavigation
  };

  assert.match(source, /stopNavigation:\s*false/);
  assert.equal(descriptor.get.call(grid), false);

  descriptor.set.call(grid, true);
  assert.equal(descriptor.get.call(grid), true);
  assert.equal(grid.options.stopNavigation, true);
  assert.equal(classes.has('fg-navigation-stopped'), true);

  grid.options.stopNavigation = false;
  assert.equal(descriptor.get.call(grid), true);
  grid.applyStopNavigation();
  assert.equal(grid.options.stopNavigation, true);

  descriptor.set.call(grid, false);
  assert.equal(descriptor.get.call(grid), false);
  assert.equal(grid.options.stopNavigation, false);
  assert.equal(classes.has('fg-navigation-stopped'), false);
});

test('stopNavigation blocks user keyboard, cell click and wheel navigation', function() {
  var FabGrid = createFabGridFactory({});
  var ownerDocument = {};
  var root = createFakeElement(['fg-root']);
  var cell = createFakeElement(['fg-cell'], { 'data-row': 0, 'data-col': 0 });
  var prevented = 0;
  var stopped = 0;
  var grid = {
    options: { stopNavigation: true },
    _stopNavigation: true,
    root: root,
    selection: { row: 0, col: 0 }
  };
  root.className = 'fg-root';
  cell.className = 'fg-cell';
  root.ownerDocument = ownerDocument;
  cell.ownerDocument = ownerDocument;
  cell.parentNode = root;
  ownerDocument.activeElement = cell;

  FabGrid.prototype.handleKeyDown.call(grid, {
    key: 'ArrowDown',
    target: cell,
    preventDefault: function() {
      prevented += 1;
    },
    stopPropagation: function() {
      stopped += 1;
    }
  });
  FabGrid.prototype.handleClick.call(grid, {
    target: cell,
    preventDefault: function() {
      prevented += 1;
    },
    stopPropagation: function() {
      stopped += 1;
    }
  });
  FabGrid.prototype.handleFixedPaneWheel.call(grid, {
    preventDefault: function() {
      prevented += 1;
    },
    stopPropagation: function() {
      stopped += 1;
    }
  });

  assert.equal(prevented, 3);
  assert.equal(stopped, 3);
  assert.deepEqual(grid.selection, { row: 0, col: 0 });
});

test('search row debounce defaults to four hundred milliseconds', function() {
  var FabGrid = createFabGridFactory({});
  var originalWindow = globalThis.window;
  var scheduledDelay = null;
  var grid = {
    options: {},
    headerSearchTimer: 0,
    cancelHeaderSearchTimer: FabGrid.prototype.cancelHeaderSearchTimer,
    applyHeaderSearch: function() {}
  };

  globalThis.window = {
    clearTimeout: function() {},
    setTimeout: function(callback, delay) {
      scheduledDelay = delay;
      return 1;
    }
  };
  try {
    FabGrid.prototype.scheduleHeaderSearch.call(grid, 0, 0, 0);
    assert.equal(scheduledDelay, 400);
  } finally {
    globalThis.window = originalWindow;
  }
});

test('search row Enter and Tab navigation preserve debounce without applying immediately', function() {
  var FabGrid = createFabGridFactory({});
  [
    { key: 'Enter', shiftKey: false, direction: 1 },
    { key: 'Enter', shiftKey: true, direction: -1 },
    { key: 'Tab', shiftKey: false, direction: 1 },
    { key: 'Tab', shiftKey: true, direction: -1 }
  ].forEach(function(testCase) {
    var applied = 0;
    var cancelled = 0;
    var moved = [];
    var prevented = 0;
    var stopped = 0;
    var grid = Object.create(FabGrid.prototype);
    var input = {
      getAttribute: function(name) {
        return name === 'data-col' ? '1' : null;
      }
    };

    grid.visibleColumns = [
      { binding: 'code' },
      { binding: 'amount' },
      { binding: 'status' }
    ];
    grid.headerSearchTimer = 7;
    grid.handleMaskedHeaderSearchDelete = function() { return false; };
    grid.handleDateboxKeyDown = function() { return false; };
    grid.handleHeaderSearchComboboxKeyDown = function() { return false; };
    grid.handleHeaderSearchColorKeyDown = function() { return false; };
    grid.handleHeaderSearchRowNavigation = function() { return false; };
    grid.cancelHeaderSearchTimer = function() { cancelled += 1; };
    grid.applyFilterChange = function() { applied += 1; };
    grid.normalizeHeaderSearchComboboxText = function() {};
    grid.focusHeaderSearchInput = function() {};
    grid.moveHeaderSearchFocus = function(colIndex, direction) {
      moved.push([colIndex, direction]);
    };

    assert.equal(grid.handleHeaderSearchKeyDown({
      key: testCase.key,
      shiftKey: testCase.shiftKey,
      preventDefault: function() { prevented += 1; },
      stopPropagation: function() { stopped += 1; }
    }, input), true);
    assert.equal(prevented, 1);
    assert.equal(stopped, 1);
    assert.equal(cancelled, 0);
    assert.equal(applied, 0);
    assert.equal(grid.headerSearchTimer, 7);
    assert.deepEqual(moved, [[1, testCase.direction]]);
  });
});

test('moving search row focus selects all text only when the target has a value', function() {
  var FabGrid = createFabGridFactory({});
  var targetInput = { value: '200000' };
  var requests = [];
  var grid = Object.create(FabGrid.prototype);

  grid.visibleColumns = [{ binding: 'code' }, { binding: 'amount' }];
  grid.header = {
    querySelector: function() {
      return targetInput;
    }
  };
  grid.scrollHeaderSearchColumnIntoView = function() {};
  grid.render = function() {};
  grid.requestHeaderSearchFocus = function(colIndex, selectionStart, selectionEnd) {
    requests.push([colIndex, selectionStart, selectionEnd]);
  };

  grid.moveHeaderSearchFocus(0, 1);
  assert.deepEqual(requests, [[1, 0, 6]]);

  targetInput.value = '';
  requests.length = 0;
  grid.moveHeaderSearchFocus(0, 1);
  assert.deepEqual(requests, [[1, undefined, undefined]]);
});

test('initial search row focuses the first visible column input', function() {
  var FabGrid = createFabGridFactory({});
  var focusedColumn = null;
  var grid = {
    disposed: false,
    options: {
      allowFiltering: true,
      filterMode: ['searchRow', 'excel']
    },
    visibleColumns: [
      { _viewIndex: 0, binding: 'name' },
      { _viewIndex: 1, binding: 'country' }
    ],
    focusHeaderSearchInput: function(colIndex) {
      focusedColumn = colIndex;
      return true;
    }
  };

  assert.equal(FabGrid.prototype.focusInitialHeaderSearchInput.call(grid), true);
  assert.equal(focusedColumn, 0);

  grid.options.filterMode = ['excel', 'searchRow'];
  focusedColumn = null;
  assert.equal(FabGrid.prototype.focusInitialHeaderSearchInput.call(grid), false);
  assert.equal(focusedColumn, null);
});

test('header render preserves the active search input and caret', function() {
  var FabGrid = createFabGridFactory({});
  var input = {
    selectionStart: 2,
    selectionEnd: 4,
    getAttribute: function(name) {
      return name === 'data-col' ? '1' : null;
    }
  };
  var grid = {
    headerSearchFocusRequest: null,
    getActiveHeaderSearchInput: function() {
      return input;
    }
  };

  assert.equal(FabGrid.prototype.captureActiveHeaderSearchFocus.call(grid), true);
  assert.deepEqual(grid.headerSearchFocusRequest, {
    col: 1,
    selectionStart: 2,
    selectionEnd: 4,
    attempts: 1
  });
});

test('search row down arrow focuses the same-row active cell before grid navigation', function() {
  var FabGrid = createFabGridFactory({});
  var selectedRows = [];
  var scrolledRows = [];
  var prevented = 0;
  var stopped = 0;
  var rootFocuses = 0;
  var grid = {
    options: {
      allowFiltering: true,
      filterMode: ['searchRow', 'excel'],
      multiSelectRows: false,
      editOnSelect: true
    },
    view: [{ id: 1 }, { id: 2 }, { id: 3 }],
    selection: { row: 0, col: 1 },
    root: {
      focus: function() {
        rootFocuses += 1;
      }
    },
    _selectVisibleRow: function(row, col) {
      selectedRows.push([row, col]);
      this.selection = { row: row, col: col };
    },
    select: function() {
      throw new Error('single-row navigation must use selectRow');
    },
    _scrollVisibleIntoView: function(row, col, options) {
      scrolledRows.push([row, col, options.directionY]);
    }
  };
  var downEvent = {
    key: 'ArrowDown',
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  };
  assert.equal(FabGrid.prototype.handleHeaderSearchRowNavigation.call(grid, downEvent, 0), true);
  assert.deepEqual(selectedRows, [[0, 0]]);
  assert.deepEqual(scrolledRows, [[0, 0, 0]]);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
  assert.equal(rootFocuses, 1);

  grid.selection = { row: 2, col: 0 };
  assert.equal(FabGrid.prototype.handleHeaderSearchRowNavigation.call(grid, downEvent, 0), true);
  assert.deepEqual(selectedRows, [[0, 0]]);
  assert.deepEqual(scrolledRows, [[0, 0, 0], [2, 0, 0]]);
  assert.equal(prevented, 2);
  assert.equal(stopped, 2);
  assert.equal(rootFocuses, 2);

  grid.options.filterMode = ['excel', 'searchRow'];
  assert.equal(FabGrid.prototype.handleHeaderSearchRowNavigation.call(grid, downEvent, 0), false);
  assert.deepEqual(selectedRows, [[0, 0]]);
  assert.deepEqual(scrolledRows, [[0, 0, 0], [2, 0, 0]]);
  assert.equal(prevented, 2);
  assert.equal(stopped, 2);
  assert.equal(rootFocuses, 2);
});

test('first-row up arrow focuses the same-column search input only while search row is visible', function() {
  var FabGrid = createFabGridFactory({});
  var focusedColumns = [];
  var prevented = 0;
  var stopped = 0;
  var grid = {
    options: {
      allowFiltering: true,
      filterMode: ['searchRow', 'excel']
    },
    focusHeaderSearchInput: function(col) {
      focusedColumns.push(col);
      return true;
    }
  };
  var upEvent = {
    key: 'ArrowUp',
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  };

  assert.equal(FabGrid.prototype.handleFirstRowSearchFocus.call(grid, upEvent, 0, 1), true);
  assert.deepEqual(focusedColumns, [1]);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);

  grid.options.filterMode = ['excel', 'searchRow'];
  assert.equal(FabGrid.prototype.handleFirstRowSearchFocus.call(grid, upEvent, 0, 1), false);
  assert.deepEqual(focusedColumns, [1]);

  grid.options.filterMode = ['searchRow', 'excel'];
  assert.equal(FabGrid.prototype.handleFirstRowSearchFocus.call(grid, upEvent, 1, 1), false);
  assert.deepEqual(focusedColumns, [1]);
});

test('a nested FabGrid keyboard event is handled only by its owning Grid', function() {
  var FabGrid = createFabGridFactory({});
  var ownerDocument = {};
  var parentRoot = {
    nodeType: 1,
    className: 'fg-root',
    parentNode: null,
    ownerDocument: ownerDocument
  };
  var childRoot = {
    nodeType: 1,
    className: 'fg-root',
    parentNode: parentRoot,
    ownerDocument: ownerDocument
  };
  var childCell = {
    nodeType: 1,
    tagName: 'DIV',
    className: 'fg-cell',
    parentNode: childRoot,
    ownerDocument: ownerDocument
  };
  ownerDocument.activeElement = childCell;
  var moved = 0;
  var prevented = 0;
  var parentGrid = {
    root: parentRoot,
    selection: { row: 0, col: 0 },
    moveVertical: function() {
      moved += 1;
    }
  };

  FabGrid.prototype.handleKeyDown.call(parentGrid, {
    key: 'ArrowDown',
    target: childCell,
    preventDefault: function() {
      prevented += 1;
    }
  });

  assert.equal(moved, 0);
  assert.equal(prevented, 0);
});

test('FabGrid keyboard ownership follows the actually focused Grid', function() {
  var FabGrid = createFabGridFactory({});
  var ownerDocument = {};
  var firstRoot = {
    nodeType: 1,
    className: 'fg-root',
    parentNode: null,
    ownerDocument: ownerDocument
  };
  var secondRoot = {
    nodeType: 1,
    className: 'fg-root',
    parentNode: null,
    ownerDocument: ownerDocument
  };
  var firstCell = {
    nodeType: 1,
    className: 'fg-cell',
    parentNode: firstRoot,
    ownerDocument: ownerDocument
  };
  var forwardedTarget = {
    nodeType: 1,
    className: 'page',
    parentNode: null,
    ownerDocument: ownerDocument
  };
  var firstGrid = { root: firstRoot };
  var secondGrid = { root: secondRoot };
  var event = { target: forwardedTarget };

  ownerDocument.activeElement = firstCell;

  assert.equal(FabGrid.prototype.isKeyboardEventOwner.call(firstGrid, event), true);
  assert.equal(FabGrid.prototype.isKeyboardEventOwner.call(secondGrid, event), false);
});

test('FabGrid keyboard ownership remembers the last active Grid when focus temporarily returns to the page', function() {
  var FabGrid = createFabGridFactory({});
  var ownerDocument = {};
  var page = {
    nodeType: 1,
    className: 'page',
    parentNode: null,
    ownerDocument: ownerDocument
  };
  var firstRoot = {
    nodeType: 1,
    className: 'fg-root',
    parentNode: page,
    ownerDocument: ownerDocument
  };
  var secondRoot = {
    nodeType: 1,
    className: 'fg-root',
    parentNode: page,
    ownerDocument: ownerDocument
  };
  var secondCell = {
    nodeType: 1,
    className: 'fg-cell',
    parentNode: secondRoot,
    ownerDocument: ownerDocument
  };
  var firstGrid = { root: firstRoot };
  var secondGrid = { root: secondRoot };
  var forwardedEvent = { target: page };

  ownerDocument.body = page;
  ownerDocument.activeElement = page;
  assert.equal(FabGrid.prototype.activateKeyboardEventOwner.call(secondGrid, {
    target: secondCell
  }), true);
  assert.equal(FabGrid.prototype.isKeyboardEventOwner.call(firstGrid, forwardedEvent), false);
  assert.equal(FabGrid.prototype.isKeyboardEventOwner.call(secondGrid, forwardedEvent), true);

  FabGrid.prototype.deactivateKeyboardEventOwner.call(secondGrid);
  assert.equal(FabGrid.prototype.isKeyboardEventOwner.call(secondGrid, forwardedEvent), false);
});

test('the same keyboard event can be claimed by only one FabGrid', function() {
  var FabGrid = createFabGridFactory({});
  var event = {};
  var firstGrid = {};
  var secondGrid = {};

  assert.equal(FabGrid.prototype.claimKeyboardEvent.call(firstGrid, event), true);
  assert.equal(FabGrid.prototype.claimKeyboardEvent.call(firstGrid, event), false);
  assert.equal(FabGrid.prototype.claimKeyboardEvent.call(secondGrid, event), false);
});

test('handled FabGrid direction keys do not bubble to page keyboard handlers', function() {
  var FabGrid = createFabGridFactory({});
  var root = {
    nodeType: 1,
    tagName: 'DIV',
    className: 'fg-root',
    parentNode: null
  };
  var moved = 0;
  var prevented = 0;
  var stopped = 0;
  var grid = {
    root: root,
    selection: { row: 0, col: 0 },
    view: [{ id: 1 }, { id: 2 }],
    options: {
      allowEditing: false,
      autoClipboard: false,
      multiSelectRows: false
    },
    busy: false,
    editing: null,
    isFilterMenuOpen: function() { return false; },
    isTopLeftMenuOpen: function() { return false; },
    isColumnChooserOpen: function() { return false; },
    isHeaderToggleKey: function() { return false; },
    handleFirstRowSearchFocus: function() { return false; },
    handleCellRangeKeyDown: function() { return false; },
    getVerticalBoundaryHotKeyDirection: function() { return 0; },
    getHorizontalBoundaryHotKeyDirection: function() { return 0; },
    handleTreeKeyDown: function() { return false; },
    moveVertical: function(row) {
      moved = row;
    }
  };

  FabGrid.prototype.handleKeyDown.call(grid, {
    key: 'ArrowDown',
    target: root,
    preventDefault: function() {
      prevented += 1;
    },
    stopPropagation: function() {
      stopped += 1;
    }
  });

  assert.equal(moved, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test('frozen column counts are normalized before layout', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    columns: [
      { visible: true, _width: 100 },
      { visible: true, _width: 120 },
      { visible: true, _width: 140 }
    ],
    options: {
      rowHeight: 32,
      overscanRows: 8,
      fastScrollOverscanRows: 64,
      overscanColumns: 3,
      frozenColumns: 1.8,
      frozenRightColumns: 0.9,
      stopNavigation: false
    },
    _stopNavigation: true,
    emit: function() {}
  };

  FabGrid.prototype.updateLayout.call(grid);

  assert.equal(grid.options.frozenColumns, 1);
  assert.equal(grid.options.frozenRightColumns, 0);
  assert.equal(grid.options.stopNavigation, true);
  assert.equal(grid._frozenColumns, 1);
  assert.equal(grid._frozenRightColumns, 0);
  assert.equal(grid.frozenWidth, 100);
});

test('hidden columns still count toward left and right frozen column ranges', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    columns: [
      { visible: true, _width: 40 },
      { visible: false, _width: 50 },
      { visible: true, _width: 60 },
      { visible: true, _width: 70 },
      { visible: false, _width: 80 },
      { visible: true, _width: 90 }
    ],
    options: {
      rowHeight: 32,
      overscanRows: 8,
      fastScrollOverscanRows: 64,
      overscanColumns: 3,
      frozenColumns: 2,
      frozenRightColumns: 2,
      stopNavigation: false
    },
    _stopNavigation: false,
    emit: function() {}
  };

  FabGrid.prototype.updateLayout.call(grid);

  assert.deepEqual(grid.visibleColumns, [
    grid.columns[0],
    grid.columns[2],
    grid.columns[3],
    grid.columns[5]
  ]);
  assert.equal(grid._frozenColumns, 1);
  assert.equal(grid._frozenRightColumns, 1);
  assert.equal(grid.frozenWidth, 40);
  assert.equal(grid.frozenRightWidth, 90);
  assert.equal(grid.scrollableColumnEnd, 3);
});

test('hostElement exposes the FabGrid host', function() {
  var FabGrid = createFabGridFactory({});
  var host = {};
  var grid = Object.create(FabGrid.prototype);

  grid.host = host;

  assert.equal(grid.hostElement, host);
});

test('FabGrid inherits managed DOM event listener methods from Control', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);

  assert.equal(grid instanceof Control, true);
  assert.equal(typeof grid.addEventListener, 'function');
  assert.equal(typeof grid.removeEventListener, 'function');
});

test('hitTest identifies data cells and nested cell template content', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var host = createFakeElement([]);
  var root = createFakeElement(['fg-root']);
  var cell = createFakeElement(['fg-cell'], { 'data-row': 2, 'data-col': 1 }, {
    left: 100,
    top: 64,
    right: 220,
    bottom: 96,
    width: 120,
    height: 32
  });
  var content = createFakeElement(['template-content']);
  var hit;

  root.parentElement = host;
  cell.parentElement = root;
  content.parentElement = cell;
  grid.host = host;
  grid.root = root;
  grid.cells = createGridPanel(grid, CellType.Cell);
  grid.columnHeaders = createGridPanel(grid, CellType.ColumnHeader);
  grid.rowHeaders = createGridPanel(grid, CellType.RowHeader);
  grid.topLeftCells = createGridPanel(grid, CellType.TopLeft);
  grid.columnFooters = createGridPanel(grid, CellType.ColumnFooter);
  grid.bottomLeftCells = createGridPanel(grid, CellType.BottomLeft);
  grid.visibleColumns = [
    { binding: 'id', _index: 0 },
    { binding: 'name', _index: 4 }
  ];

  hit = grid.hitTest({ target: content, pageX: 150, pageY: 80 });

  assert.equal(hit.cellType, CellType.Cell);
  assert.equal(hit.panel, grid.cells);
  assert.equal(hit.row, 2);
  assert.equal(hit.col, 4);
  assert.equal(hit.viewCol, 1);
  assert.equal(hit.column, grid.visibleColumns[1]);
  assert.equal(hit.target, content);
  assert.equal(hit.isSearchRow, false);
  assert.deepEqual(hit.range, { row: 2, col: 4, row2: 2, col2: 4 });
});

test('hitTest reports the Search Row as a ColumnHeader panel cell', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var host = createFakeElement([]);
  var root = createFakeElement(['fg-root']);
  var headerCell = createFakeElement(['fg-header-cell'], { 'data-col': 3 }, {
    left: 100,
    top: 0,
    right: 220,
    bottom: 64,
    width: 120,
    height: 64
  });
  var search = createFakeElement(['fg-header-search']);
  var input = createFakeElement(['fg-header-search-input']);
  var hit;

  root.parentElement = host;
  headerCell.parentElement = root;
  search.parentElement = headerCell;
  input.parentElement = search;
  grid.host = host;
  grid.root = root;
  grid.options = { rowHeight: 32, headerHeight: 32, filterMode: ['searchRow', 'excel'], allowFiltering: true };
  grid.cells = createGridPanel(grid, CellType.Cell);
  grid.columnHeaders = createGridPanel(grid, CellType.ColumnHeader);
  grid.rowHeaders = createGridPanel(grid, CellType.RowHeader);
  grid.topLeftCells = createGridPanel(grid, CellType.TopLeft);
  grid.columnFooters = createGridPanel(grid, CellType.ColumnFooter);
  grid.bottomLeftCells = createGridPanel(grid, CellType.BottomLeft);
  grid.visibleColumns = [
    { binding: 'id', _index: 0 },
    { binding: 'name', _index: 1 },
    { binding: 'amount', _index: 2 },
    { binding: 'status', _index: 5 }
  ];

  hit = grid.hitTest({ target: input, pageX: 150, pageY: 48 });

  assert.equal(hit.cellType, CellType.ColumnHeader);
  assert.equal(hit.panel, grid.columnHeaders);
  assert.equal(hit.row, 1);
  assert.equal(hit.col, 5);
  assert.equal(hit.viewCol, 3);
  assert.equal(hit.column, grid.visibleColumns[3]);
  assert.equal(hit.isSearchRow, true);
});

test('hitTest reports merged Header group and vertically merged leaf ranges', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var host = createFakeElement([]);
  var root = createFakeElement(['fg-root']);
  var groupCell = createFakeElement(
    ['fg-header-cell', 'fg-header-group-cell'],
    {
      'data-header-row': 0,
      'data-view-col-start': 0,
      'data-view-col-end': 2,
      'data-col-start': 0,
      'data-col-end': 2
    },
    { left: 0, top: 0, right: 135, bottom: 32, width: 135, height: 32 }
  );
  var leafCell = createFakeElement(
    ['fg-header-cell'],
    {
      'data-col': 3,
      'data-header-row': 0,
      'data-header-title-height': 64
    },
    { left: 135, top: 0, right: 215, bottom: 64, width: 80, height: 64 }
  );
  var groupHit;
  var leafHit;

  root.parentElement = host;
  groupCell.parentElement = root;
  leafCell.parentElement = root;
  grid.host = host;
  grid.root = root;
  grid.options = { rowHeight: 32, headerHeight: 32, filterMode: false, allowFiltering: true };
  grid._visibleColumnHeaderDepth = 2;
  grid.cells = createGridPanel(grid, CellType.Cell);
  grid.columnHeaders = createGridPanel(grid, CellType.ColumnHeader);
  grid.rowHeaders = createGridPanel(grid, CellType.RowHeader);
  grid.topLeftCells = createGridPanel(grid, CellType.TopLeft);
  grid.columnFooters = createGridPanel(grid, CellType.ColumnFooter);
  grid.bottomLeftCells = createGridPanel(grid, CellType.BottomLeft);
  grid.visibleColumns = [
    { binding: 'w', _index: 0 },
    { binding: 'h', _index: 1 },
    { binding: 'l', _index: 2 },
    { binding: 'amount', _index: 3, _headerDepth: 0 }
  ];

  groupHit = grid.hitTest({ target: groupCell, pageX: 50, pageY: 16 });
  leafHit = grid.hitTest({ target: leafCell, pageX: 170, pageY: 16 });

  assert.equal(groupHit.cellType, CellType.ColumnHeader);
  assert.equal(groupHit.row, 0);
  assert.equal(groupHit.col, 0);
  assert.deepEqual(groupHit.mergedRange, { row: 0, col: 0, row2: 0, col2: 2 });
  assert.equal(leafHit.row, 0);
  assert.equal(leafHit.col, 3);
  assert.deepEqual(leafHit.mergedRange, { row: 0, col: 3, row2: 1, col2: 3 });
});

test('row collection exposes compatible Row and GroupRow instances', function() {
  var FabGrid = createFabGridFactory({});
  var dataItem = { id: 1 };
  var groupItem = { __fgRowType: 'group', level: 1, items: [dataItem], collapsed: true };
  var footerItem = { __fgRowType: 'groupFooter', level: 1, items: [dataItem] };
  var grid = Object.create(FabGrid.prototype);
  var rows;

  grid.view = [groupItem, dataItem, footerItem];
  grid._rowCollection = null;
  rows = grid.rows;

  assert.equal(FabGrid.Row, Row);
  assert.equal(FabGrid.GroupRow, GroupRow);
  assert.equal(rows[0] instanceof Row, true);
  assert.equal(rows[0] instanceof GroupRow, true);
  assert.equal(rows[0].level, 1);
  assert.equal(rows[0].hasChildren, true);
  assert.equal(rows[0].isCollapsed, true);
  assert.equal(rows[1] instanceof Row, true);
  assert.equal(rows[1] instanceof GroupRow, false);
  assert.equal(rows[1].dataItem, dataItem);
  assert.equal(rows[1].dataIndex, 1);
  assert.equal(rows[2] instanceof Row, true);
  assert.equal(rows[2] instanceof GroupRow, true);
  assert.equal(rows[2].isGroupFooter, true);

  grid.options = { multiSelectRows: false };
  grid.selection = { row: 1, col: 0 };
  grid.rowSelection = null;
  grid.selectedRowMap = {};
  assert.equal(grid.selectedRow, rows[1]);
  assert.equal(grid.selectedRow.index, 1);
  assert.equal(grid.selectedRow.dataItem, dataItem);
  assert.deepEqual(grid.selectedRows, []);
  grid.rowSelection = 1;
  assert.equal(grid.selectedRows[0], rows[1]);

  grid.options.multiSelectRows = true;
  grid.selectedRowMap = { 0: true, 1: true };
  assert.deepEqual(grid.selectedRows, [rows[0], rows[1]]);

  grid.selection.row = -1;
  assert.equal(grid.selectedRow, null);
});

test('row range uses a positive normalized row height', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    options: { rowHeight: 0, overscanRows: 0 },
    scrollState: null,
    view: new Array(20)
  };
  var range = FabGrid.prototype.getRowRange.call(grid, {
    scrollTop: 0,
    contentHeight: 320
  });

  assert.deepEqual(range, { start: 0, end: 11 });
});

test('event dispatch uses a stable handler snapshot', function() {
  var FabGrid = createFabGridFactory({});
  var calls = [];
  var grid = Object.create(FabGrid.prototype);
  var first;

  grid.events = {};
  grid.wijmoEvents = {};
  first = function() {
    calls.push('first');
    grid.off('changed', first);
  };
  grid.on('changed', first);
  grid.on('changed', function() {
    calls.push('second');
  });

  grid.emit('changed', {});
  assert.deepEqual(calls, ['first', 'second']);
});

test('Grid events use the same sender and args contract for every registration style', function() {
  var FabGrid = createFabGridFactory({});
  var received = [];
  var grid = Object.create(FabGrid.prototype);

  grid.events = {};
  grid.wijmoEvents = {};
  grid.options = {
    viewportChanged: function(sender, args) {
      received.push({ style: 'option', sender: sender, args: args });
    }
  };
  FabGrid.prototype.createWijmoEvents.call(grid);
  FabGrid.prototype.bindOptionEvents.call(grid);
  grid.on('viewportChanged', function(sender, args) {
    received.push({ style: 'on', sender: sender, args: args });
  });
  grid.viewportChanged.addHandler(function(sender, args) {
    received.push({ style: 'event', sender: sender, args: args });
  });

  grid.emit('viewportChanged', { totalRows: 3 });

  assert.deepEqual(received.map(function(item) {
    return item.style;
  }), ['on', 'option', 'event']);
  received.forEach(function(item) {
    assert.equal(item.sender, grid);
    assert.equal(item.args.grid, grid);
    assert.equal(item.args.type, 'viewportChanged');
    assert.equal(item.args.cancel, false);
    assert.equal(item.args.totalRows, 3);
  });
  assert.equal(received[0].args, received[1].args);
  assert.equal(received[1].args, received[2].args);
});

test('legacy Grid event names share their canonical event object', function() {
  var FabGrid = createFabGridFactory({});
  var editCalls = 0;
  var copyCalls = 0;
  var grid = Object.create(FabGrid.prototype);

  grid.events = {};
  grid.wijmoEvents = {};
  grid.options = {};
  FabGrid.prototype.createWijmoEvents.call(grid);

  assert.equal(grid.cellEditStarting, grid.beginningEdit);
  assert.equal(grid.cellCopied, grid.copiedCell);
  grid.on('cellEditStarting', function(g, e) {
    editCalls += 1;
    assert.equal(e.type, 'beginningEdit');
  });
  grid.on('cellCopied', function(g, e) {
    copyCalls += 1;
    assert.equal(e.type, 'copiedCell');
  });

  grid.emit('beginningEdit', {});
  grid.emit('copiedCell', {});
  assert.equal(editCalls, 1);
  assert.equal(copyCalls, 1);
});

test('only cancelable Grid events honor false returns', function() {
  var FabGrid = createFabGridFactory({});
  var changingArgs = {};
  var changedArgs = {};
  var grid = Object.create(FabGrid.prototype);

  grid.events = {};
  grid.wijmoEvents = {};
  grid.options = {};
  FabGrid.prototype.createWijmoEvents.call(grid);
  grid.on('selectionChanging', function() {
    return false;
  });
  grid.on('selectionChanged', function() {
    return false;
  });

  assert.equal(grid.emit('selectionChanging', changingArgs), false);
  assert.equal(changingArgs.cancel, true);
  assert.equal(grid.emit('selectionChanged', changedArgs), true);
  assert.equal(changedArgs.cancel, false);
});

test('unimplemented compatibility events are not exposed as Grid Event objects', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var removedEvents = [
    'autoGeneratedColumns',
    'autoSizingRow',
    'autoSizedRow',
    'bigCheckboxesChanged',
    'columnGroupCollapsedChanging',
    'columnGroupCollapsedChanged',
    'deletingRow',
    'deletedRow',
    'pasting',
    'pasted',
    'pastingCell',
    'pastedCell',
    'prepareCellForEdit',
    'resizingRow',
    'resizedRow',
    'rowAdded',
    'rowEditStarting',
    'rowEditStarted',
    'rowEditEnding',
    'rowEditEnded'
  ];

  grid.events = {};
  grid.wijmoEvents = {};
  grid.options = {};
  FabGrid.prototype.createWijmoEvents.call(grid);

  removedEvents.forEach(function(name) {
    assert.equal(grid[name], undefined);
  });
  assert.ok(grid.selectionChanging);
  assert.ok(grid.selectionChanged);
});

test('layout and Excel export starting events cancel their actions', async function() {
  var FabGrid = createFabGridFactory({});
  var visibleColumns = [{ binding: 'before' }];
  var renderEvents = [];
  var syncHeaderCalls = 0;
  var layoutGrid = {
    options: {},
    columns: [{ binding: 'after', visible: true, _width: 120 }],
    visibleColumns: visibleColumns,
    emit: function(name) {
      assert.equal(name, 'updatingLayout');
      return false;
    }
  };
  var renderGrid = {
    disposed: false,
    isUpdating: false,
    _layoutReadyForRender: false,
    options: {},
    columns: [{ binding: 'value', visible: true, _width: 120 }],
    visibleColumns: visibleColumns,
    captureActiveHeaderSearchFocus: function() {},
    resetFixedPaneScrollOffset: function() {},
    syncHeaderLayout: function() {
      syncHeaderCalls += 1;
    },
    emit: function(name) {
      renderEvents.push(name);
      return name !== 'updatingLayout';
    },
    updateLayout: FabGrid.prototype.updateLayout
  };
  var visibilityColumn = { binding: 'value', visible: true };
  var visibilityGrid = Object.create(FabGrid.prototype);
  var autoSizeColumn = { binding: 'amount', width: 10, _width: 30 };
  var autoSizeGrid = Object.create(FabGrid.prototype);
  var resizeColumn = { binding: 'quantity', width: 10, _width: 30 };
  var resizeGrid = Object.create(FabGrid.prototype);
  var busyCalls = 0;
  var exportGrid = {
    busy: false,
    emit: function(name, args) {
      assert.equal(name, 'excelExporting');
      assert.equal(args.filename, 'cancel.xlsx');
      assert.equal(args.sheetName, 'Sheet1');
      return false;
    },
    setBusy: function() {
      busyCalls += 1;
    }
  };

  assert.equal(FabGrid.prototype.updateLayout.call(layoutGrid), false);
  assert.equal(layoutGrid.visibleColumns, visibleColumns);
  assert.equal(FabGrid.prototype.render.call(renderGrid), false);
  assert.deepEqual(renderEvents, ['updatingView', 'updatingLayout']);
  assert.equal(syncHeaderCalls, 0);

  visibilityGrid.columns = [visibilityColumn];
  visibilityGrid.visibleColumns = [visibilityColumn];
  visibilityGrid.editing = null;
  visibilityGrid.updateLayout = function() { return false; };
  visibilityGrid.refresh = function() {
    assert.fail('A canceled layout must not refresh the view.');
  };
  assert.equal(visibilityGrid.setColumnVisible('0', false), false);
  assert.equal(visibilityColumn.visible, true);

  autoSizeGrid.options = { columnMinWidth: 20, showFooter: false };
  autoSizeGrid.columns = [autoSizeColumn];
  autoSizeGrid.getAutoSizeColumnWidth = function() { return 90; };
  autoSizeGrid.emit = function() { return true; };
  autoSizeGrid.updateLayout = function() { return false; };
  autoSizeGrid.render = function() {
    assert.fail('A canceled AutoFit must not render the view.');
  };
  assert.equal(autoSizeGrid.autoSizeColumn(autoSizeColumn), false);
  assert.equal(autoSizeColumn.width, 10);
  assert.equal(autoSizeColumn._width, 30);

  resizeGrid.options = { columnMinWidth: 20 };
  resizeGrid.resizeState = {
    column: resizeColumn,
    startX: 0,
    startWidth: 30,
    hasResized: false
  };
  resizeGrid.updateCellRangeDrag = function() { return false; };
  resizeGrid.emit = function() { return true; };
  resizeGrid.updateLayout = function() { return false; };
  resizeGrid.render = function() {
    assert.fail('A canceled resize must not render the view.');
  };
  resizeGrid.handlePointerMove({
    clientX: 20,
    preventDefault: function() {}
  });
  assert.equal(resizeColumn.width, 10);
  assert.equal(resizeColumn._width, 30);

  assert.equal(await FabGrid.prototype.exportExcel.call(exportGrid, 'cancel.xlsx'), false);
  assert.equal(busyCalls, 0);
});

test('event pipelines keep event argument objects isolated by event type', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var received = {};

  grid.events = {};
  grid.wijmoEvents = {};
  grid.options = {};
  grid.columns = [{ binding: 'value' }];
  grid.visibleColumns = grid.columns;
  grid.selection = { row: 0, col: 0 };
  grid.getSelectedText = function() { return 'A'; };
  grid.copyText = function() {};
  FabGrid.prototype.createWijmoEvents.call(grid);

  ['copying', 'copyingCell', 'copied', 'copiedCell'].forEach(function(name) {
    grid.on(name, function(g, e) {
      received[name] = e;
    });
  });

  assert.equal(grid.copySelection(), true);
  assert.equal(received.copying.type, 'copying');
  assert.equal(received.copyingCell.type, 'copyingCell');
  assert.equal(received.copied.type, 'copied');
  assert.equal(received.copiedCell.type, 'copiedCell');
  assert.notEqual(received.copying, received.copyingCell);
  assert.notEqual(received.copyingCell, received.copied);
  assert.notEqual(received.copied, received.copiedCell);
});

test('refresh stops when updatingView cancels rendering', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var events = [];

  grid.disposed = false;
  grid._updateCount = 0;
  grid.emit = function(name) {
    events.push(name);
    return name !== 'updatingView';
  };

  assert.equal(grid.refresh(), false);
  assert.deepEqual(events, ['refreshing', 'updatingView']);
});

test('selection before and after events retain their own argument objects', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var changingArgs;
  var changedArgs;

  grid.events = {};
  grid.wijmoEvents = {};
  grid.options = { selectionMode: 'Cell', multiSelectRows: false };
  grid.columns = [{ binding: 'first' }, { binding: 'second' }];
  grid.visibleColumns = grid.columns;
  grid.view = [{ first: 'A', second: 'B' }];
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = 0;
  grid.cancelEditingForSelection = function() {};
  grid.render = function() {};
  FabGrid.prototype.createWijmoEvents.call(grid);
  grid.on('selectionChanging', function(g, e) {
    changingArgs = e;
  });
  grid.on('selectionChanged', function(g, e) {
    changedArgs = e;
  });

  assert.equal(grid.applyCellSelection(0, 0, 0, 1), true);
  assert.equal(changingArgs.type, 'selectionChanging');
  assert.equal(changedArgs.type, 'selectionChanged');
  assert.notEqual(changingArgs, changedArgs);
});

test('Wijmo-compatible events use a stable handler snapshot', function() {
  var FabGrid = createFabGridFactory({});
  var calls = [];
  var grid = { wijmoEvents: {} };
  var first;

  FabGrid.prototype.createWijmoEvents.call(grid);
  first = function() {
    calls.push('first');
    grid.updatedView.removeHandler(first);
  };
  grid.updatedView.addHandler(first);
  grid.updatedView.addHandler(function() {
    calls.push('second');
  });

  grid.updatedView.raise(grid, {});
  assert.deepEqual(calls, ['first', 'second']);
});

test('selected row changed is public and ignores active column changes in the same row', function() {
  var FabGrid = createFabGridFactory({});
  var first = { id: 1 };
  var second = { id: 2 };
  var received = [];
  var grid = Object.create(FabGrid.prototype);

  grid.options = {
    multiSelectRows: false,
    selectionMode: 'Cell',
    selectedRowChanged: function(sender, args) {
      received.push({ sender: sender, args: args });
    }
  };
  grid.view = [first, second];
  grid.visibleColumns = [{ binding: 'id' }, { binding: 'name' }];
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = 0;
  grid._rowCollection = null;
  grid.events = {};
  grid.wijmoEvents = {};
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.render = function() {};

  FabGrid.prototype.createWijmoEvents.call(grid);
  FabGrid.prototype.bindOptionEvents.call(grid);
  grid._selectedRowSnapshot = grid.captureSelectedRowChangeState();

  assert.equal(grid.applyCellSelection(1, 0, 1, 0), true);
  assert.equal(received.length, 1);
  assert.equal(received[0].sender, grid);
  assert.equal(received[0].args.reason, 'selection');
  assert.equal(received[0].args.row.index, 1);
  assert.equal(received[0].args.rowIndex, 1);
  assert.equal(received[0].args.dataItem, second);
  assert.equal(received[0].args.previousRowIndex, 0);
  assert.equal(received[0].args.previousDataItem, first);

  assert.equal(grid.applyCellSelection(1, 1, 1, 1), true);
  assert.equal(received.length, 1);

  assert.equal(grid.unselectRow(), true);
  assert.equal(received.length, 2);
  assert.equal(received[1].args.reason, 'selection');
  assert.equal(received[1].args.row, null);
  assert.equal(received[1].args.rowIndex, -1);
  assert.equal(received[1].args.dataItem, null);
  assert.equal(received[1].args.previousRowIndex, 1);
  assert.equal(received[1].args.previousDataItem, second);
});

test('itemsSource replacement raises selected row changed after itemsSourceChanged at the same row index', function() {
  var FabGrid = createFabGridFactory({});
  var first = { id: 1 };
  var replacement = { id: 2 };
  var order = [];
  var received;
  var grid = Object.create(FabGrid.prototype);

  grid.options = { observeItemsSource: false, multiSelectRows: false };
  grid.source = [first];
  grid.view = [first];
  grid.rowSelection = 0;
  grid._rowCollection = null;
  grid.events = {};
  grid.wijmoEvents = {};
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.applyView = function() {
    this.view = this.source.slice();
    this._rowCollection = null;
    this._selectedRowSnapshot = this.captureSelectedRowChangeState();
  };
  grid.refresh = function() {};

  FabGrid.prototype.createWijmoEvents.call(grid);
  grid._selectedRowSnapshot = grid.captureSelectedRowChangeState();
  grid.itemsSourceChanged.addHandler(function() {
    order.push('itemsSourceChanged');
  });
  grid.selectedRowChanged.addHandler(function(sender, args) {
    order.push('selectedRowChanged');
    received = args;
  });

  grid.setItemsSource([replacement]);

  assert.deepEqual(order, ['itemsSourceChanged', 'selectedRowChanged']);
  assert.equal(received.reason, 'itemsSource');
  assert.equal(received.row.index, 0);
  assert.equal(received.rowIndex, 0);
  assert.equal(received.dataItem, replacement);
  assert.equal(received.previousRowIndex, 0);
  assert.equal(received.previousDataItem, first);
});

test('remote data replacement raises items source changed before selected row changed', function() {
  var FabGrid = createFabGridFactory({});
  var first = { id: 1 };
  var replacement = { id: 2 };
  var order = [];
  var itemsSourceArgs;
  var received;
  var grid = Object.create(FabGrid.prototype);

  grid.options = { observeItemsSource: false, multiSelectRows: false };
  grid.source = [first];
  grid.view = [first];
  grid.rowSelection = 0;
  grid._rowCollection = null;
  grid.events = {};
  grid.wijmoEvents = {};
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.applyView = function() {
    this.view = this.source.slice();
    this._rowCollection = null;
    this._selectedRowSnapshot = this.captureSelectedRowChangeState();
  };
  grid.resetVerticalScroll = function() {};
  grid.refresh = function() {};

  FabGrid.prototype.createWijmoEvents.call(grid);
  grid._selectedRowSnapshot = grid.captureSelectedRowChangeState();
  grid.itemsSourceChanged.addHandler(function(sender, args) {
    order.push('itemsSourceChanged');
    itemsSourceArgs = args;
  });
  grid.selectedRowChanged.addHandler(function(sender, args) {
    order.push('selectedRowChanged');
    received = args;
  });

  grid.loadRemoteData({ rows: [replacement], total: 1 });

  assert.deepEqual(order, ['itemsSourceChanged', 'selectedRowChanged']);
  assert.equal(itemsSourceArgs.remote, true);
  assert.equal(itemsSourceArgs.rows, grid.source);
  assert.equal(itemsSourceArgs.rows[0], replacement);
  assert.equal(grid.itemsSource, grid.source);
  assert.equal(received.reason, 'itemsSource');
  assert.equal(received.rowIndex, 0);
  assert.equal(received.dataItem, replacement);
  assert.equal(received.previousRowIndex, 0);
  assert.equal(received.previousDataItem, first);
});

test('remote data replaces a shared CollectionView without applying local filters', function() {
  var FabGrid = createFabGridFactory({});
  var initial = { id: 1 };
  var replacement = { id: 2 };
  var collectionView = new CollectionView([initial]);
  var collectionChanges = 0;
  var grid = Object.create(FabGrid.prototype);

  grid.options = {
    remote: true,
    observeItemsSource: false,
    multiSelectRows: false,
    filterMode: ['searchRow']
  };
  grid._itemsSource = collectionView;
  grid._collectionView = collectionView;
  grid._suppressCollectionViewChange = false;
  grid._suppressCollectionViewCurrentChange = false;
  grid.source = collectionView.sourceCollection;
  grid.view = collectionView.items.slice();
  grid.filterPredicate = function() { return false; };
  grid.searchText = '';
  grid.columnSearchValues = {};
  grid.columnSearchOperators = {};
  grid.excelFilters = {};
  grid.hasColumnSearch = false;
  grid.rowSelection = -1;
  grid._rowCollection = null;
  grid.events = {};
  grid.wijmoEvents = {};
  grid.getSortStates = function() { return []; };
  grid.isTreeGrid = function() { return false; };
  grid.captureSelectedRowChangeState = function() {
    return { rowIndex: -1, dataItem: null };
  };
  grid.applyView = function() {
    this.view = this._collectionView.items.slice();
  };
  grid.raiseSelectedRowChanged = function() {};
  grid.resetVerticalScroll = function() {};
  grid.refresh = function() {};

  FabGrid.prototype.createWijmoEvents.call(grid);
  grid.syncCollectionViewFilter();
  assert.deepEqual(collectionView.items, [initial]);

  collectionView.collectionChanged.addHandler(function() {
    collectionChanges += 1;
  });
  grid.loadRemoteData({ rows: [replacement], total: 1 });

  assert.equal(grid.itemsSource, collectionView);
  assert.equal(grid.collectionView, collectionView);
  assert.equal(collectionView.sourceCollection[0], replacement);
  assert.equal(collectionView.items[0], replacement);
  assert.equal(grid.source[0], replacement);
  assert.equal(grid.view[0], replacement);
  assert.equal(collectionChanges, 1);
});

test('new built-in remote loads abort the previous fetch signal', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var signals = [];

  grid.options = {
    remote: true,
    loader: null,
    url: '/api/items',
    pageNumber: 1,
    pageSize: 50
  };
  grid.disposed = false;
  grid._remoteLoadSeq = 0;
  grid._remoteLoadController = null;
  grid.emit = function() { return true; };
  grid.getRemoteSortParams = function() { return {}; };
  grid.getRemoteFilterParams = function() { return {}; };
  grid.setRemoteLoading = function() {};
  grid.requestRemoteData = function(params, signal) {
    signals.push(signal);
    return new Promise(function() {});
  };

  grid.load();
  grid.load();

  assert.equal(signals.length, 2);
  assert.equal(signals[0].aborted, true);
  assert.equal(signals[1].aborted, false);
  assert.equal(grid.cancelRemoteLoad(), true);
  assert.equal(signals[1].aborted, true);
});

test('remote Search Row loads in background without blocking the grid', function() {
  var FabGrid = createFabGridFactory({});
  var css = readFileSync(new URL('../src/grid/fabgrid.css', import.meta.url), 'utf8');
  var classState = {};
  var grid = {
    options: { loadMsg: null },
    busy: false,
    _remoteLoadingBlocking: false,
    root: {
      setAttribute: function(name, value) {
        assert.equal(name, 'aria-busy');
        this.ariaBusy = value;
      }
    },
    remoteLoadText: { textContent: '' },
    remoteLoadMask: {
      classList: {
        toggle: function(name, active) {
          classState[name] = active;
        }
      },
      style: { display: 'none' }
    },
    getText: function() { return 'Loading...'; }
  };

  FabGrid.prototype.setRemoteLoading.call(grid, true, true);

  assert.equal(grid.remoteLoading, true);
  assert.equal(grid.remoteLoadingBackground, true);
  assert.equal(grid.busy, false);
  assert.equal(grid.root.ariaBusy, 'true');
  assert.equal(grid.remoteLoadMask.style.display, 'flex');
  assert.equal(classState['fg-remote-load-background'], true);

  grid.busy = true;
  FabGrid.prototype.setRemoteLoading.call(grid, false);

  assert.equal(grid.remoteLoading, false);
  assert.equal(grid.remoteLoadingBackground, false);
  assert.equal(grid.busy, true);
  assert.equal(grid.root.ariaBusy, 'true');
  assert.equal(grid.remoteLoadMask.style.display, 'none');
  assert.equal(classState['fg-remote-load-background'], false);

  grid.busy = false;
  FabGrid.prototype.setRemoteLoading.call(grid, true, false);
  assert.equal(grid.busy, true);
  assert.equal(grid._remoteLoadingBlocking, true);
  FabGrid.prototype.setRemoteLoading.call(grid, false);
  assert.equal(grid.busy, false);
  assert.equal(grid.root.ariaBusy, 'false');
  assert.match(css, /\.fg-remote-load-mask\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*center;/s);
  assert.match(css, /\.fg-remote-load-mask\.fg-remote-load-background\s*\{[^}]*pointer-events:\s*none;/s);
});

test('Search Row filter changes request background remote loading', function() {
  var FabGrid = createFabGridFactory({});
  var loadOptions;
  var grid = Object.create(FabGrid.prototype);

  grid.options = {
    remote: true,
    pageNumber: 2,
    pager: { pageNumber: 2 },
    filterMode: ['searchRow']
  };
  grid.columnSearchValues = { code: 'A' };
  grid.columnSearchOperators = {};
  grid.excelFilters = {};
  grid.filterPredicate = null;
  grid.searchText = '';
  grid.view = [];
  grid.syncCollectionViewFilter = function() {};
  grid.applyView = function() {};
  grid.syncSelectionFromCollectionView = function() {};
  grid.resetVerticalScroll = function() {};
  grid.refresh = function() {};
  grid.emit = function() { return true; };
  grid.load = function(params, options) {
    loadOptions = options;
  };

  FabGrid.prototype.applyFilterChange.call(grid, false, 'headerSearch');

  assert.equal(grid.options.pageNumber, 1);
  assert.equal(grid.options.pager.pageNumber, 1);
  assert.deepEqual(loadOptions, { background: true });
});

test('a newer background Search Row load abandons an unresolved custom loader result', async function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var pending = [];
  var loaded = [];
  var loadingStates = [];

  grid.options = {
    remote: true,
    loader: function() {
      return new Promise(function(resolve) {
        pending.push(resolve);
      });
    },
    url: null,
    pageNumber: 1,
    pageSize: 50
  };
  grid.disposed = false;
  grid._remoteLoadSeq = 0;
  grid._remoteLoadController = null;
  grid.emit = function() { return true; };
  grid.getRemoteSortParams = function() { return {}; };
  grid.getRemoteFilterParams = function() { return {}; };
  grid.setRemoteLoading = function(value, background) {
    loadingStates.push({ value: value, background: background === true });
  };
  grid.loadRemoteData = function(data) {
    loaded.push(data);
  };

  var firstLoad = grid.load(undefined, { background: true });
  var secondLoad = grid.load(undefined, { background: true });

  assert.equal(pending.length, 2);
  pending[0]({ rows: [{ id: 'old' }] });
  assert.equal(await firstLoad, false);
  assert.deepEqual(loaded, []);

  pending[1]({ rows: [{ id: 'new' }] });
  assert.equal(await secondLoad, true);
  assert.deepEqual(loaded, [{ rows: [{ id: 'new' }] }]);
  assert.deepEqual(loadingStates, [
    { value: true, background: true },
    { value: true, background: true },
    { value: false, background: false }
  ]);
});

test('format item exposes FabUI cell types, panels and row data items', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var receivedSender;
  var receivedArgs;
  var cell = {};

  grid.options = { headerDisplayMode: 'header', rowHeaderHeader: '', footerLabel: '' };
  grid.columns = [{ binding: 'amount', header: 'Amount', footer: 30, _index: 0 }];
  grid.view = [{ amount: 12 }];
  grid._rowCollection = null;
  grid.events = {};
  grid.wijmoEvents = {};
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.cells = createGridPanel(grid, CellType.Cell);
  grid.columnHeaders = createGridPanel(grid, CellType.ColumnHeader);
  grid.columnFooters = createGridPanel(grid, CellType.ColumnFooter);

  FabGrid.prototype.createWijmoEvents.call(grid);
  grid.formatItem.addHandler(function(sender, args) {
    receivedSender = sender;
    receivedArgs = args;
  });

  grid.raiseFormatItem(grid.createFormatItemEventArgs(grid.cells, cell, 0, 0, {
    item: grid.view[0],
    column: grid.columns[0],
    value: 12
  }));

  assert.equal(CellType.Cell, 1);
  assert.equal(CellType.ColumnHeader, 2);
  assert.equal(CellType.ColumnFooter, 5);
  assert.equal(FabGrid.CellType, undefined);
  assert.equal(grid.cells.getCellData(0, 0, false), 12);
  assert.equal(grid.columnHeaders.getCellData(0, 0, false), 'Amount');
  assert.equal(grid.columnFooters.getCellData(0, 0, false), 30);
  assert.equal(grid.rows[0].dataItem, grid.view[0]);
  assert.equal(receivedSender, grid);
  assert.equal(receivedArgs.panel, grid.cells);
  assert.equal(receivedArgs.panel.cellType, CellType.Cell);
  assert.equal(receivedArgs.cell, cell);
  assert.equal(receivedArgs.data, grid.view[0]);
  assert.equal(receivedArgs.getColumn(), grid.columns[0]);
  assert.equal(receivedArgs.getRow().dataItem, grid.view[0]);
  assert.deepEqual(receivedArgs.range, { row: 0, col: 0, row2: 0, col2: 0 });
});

test('truncated Excel filter values preserve unseen selections', function() {
  var FabGrid = createFabGridFactory({});
  var column = { binding: 'country' };
  var applied = null;
  var grid = {
    options: { excelFilterMaxValues: 2 },
    source: [
      { country: 'A' },
      { country: 'B' },
      { country: 'C' }
    ],
    isTreeGrid: function() { return false; },
    getCellDisplayText: function(item, targetColumn, value) { return String(value); },
    getText: function() { return '(blank)'; },
    getExcelFilterRows: FabGrid.prototype.getExcelFilterRows,
    getExcelFilterValueItems: FabGrid.prototype.getExcelFilterValueItems,
    clearExcelFilter: function() { applied = null; },
    setExcelFilter: function(targetColumn, filter) { applied = filter; }
  };
  var visibleItems = grid.getExcelFilterValueItems(column);

  assert.equal(visibleItems.length, 2);
  assert.equal(visibleItems.truncated, true);
  grid.excelFilterDraft = {
    column: column,
    valueItems: visibleItems,
    selectedKeys: {
      'string:A': false,
      'string:B': true
    },
    defaultSelected: true,
    truncated: true
  };

  FabGrid.prototype.handleExcelFilterMenuAction.call(grid, {
    getAttribute: function() { return 'apply'; }
  });

  assert.deepEqual(applied, { type: 'values', values: ['B', 'C'] });
});

test('remote Excel filter keeps all cached candidates when reopened after apply', function() {
  var FabGrid = createFabGridFactory({});
  var column = { binding: 'customer' };
  var grid = {
    options: { remote: true, excelFilterMaxValues: 1000 },
    source: [
      { customer: 'WQ001' },
      { customer: 'AV001' },
      { customer: 'XZ001' },
      { customer: 'ZU001' }
    ],
    excelFilters: {},
    excelFilterValueCache: {},
    remoteLoading: false,
    isTreeGrid: function() { return false; },
    getCellDisplayText: function(item, targetColumn, value) { return String(value); },
    getText: function() { return '(blank)'; },
    getExcelFilter: FabGrid.prototype.getExcelFilter,
    getExcelFilterRows: FabGrid.prototype.getExcelFilterRows
  };
  var initial = FabGrid.prototype.getExcelFilterValueItems.call(grid, column);

  assert.deepEqual(initial.map(function(item) { return item.value; }), ['WQ001', 'AV001', 'XZ001', 'ZU001']);

  grid.excelFilters['binding:customer'] = {
    type: 'values',
    values: ['WQ001', 'AV001']
  };
  grid.source = [
    { customer: 'WQ001' },
    { customer: 'AV001' }
  ];

  var reopened = FabGrid.prototype.getExcelFilterValueItems.call(grid, column);

  assert.deepEqual(reopened.map(function(item) { return item.value; }), ['WQ001', 'AV001', 'XZ001', 'ZU001']);
});

test('observed array mutations are batched into one refresh', async function() {
  var FabGrid = createFabGridFactory({});
  var applyCount = 0;
  var refreshCount = 0;
  var received = [];
  var grid = Object.create(FabGrid.prototype);
  var rows;

  grid.options = { observeItemsSource: true, multiSelectRows: false };
  grid.disposed = false;
  grid._suppressObservedItemChange = 0;
  grid._handlingObservedItemChange = false;
  grid._observedItemsChangeQueued = false;
  grid.rowSelection = 0;
  grid._rowCollection = null;
  grid.events = {};
  grid.wijmoEvents = {};
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.applyView = function() {
    applyCount += 1;
    this.view = this.source.slice();
    this._rowCollection = null;
    this._selectedRowSnapshot = this.captureSelectedRowChangeState();
  };
  grid.refresh = function() { refreshCount += 1; };

  FabGrid.prototype.createWijmoEvents.call(grid);
  rows = grid.createObservedItemsSource(
    Array.from({ length: 1000 }, function(value, index) { return { id: index }; }));
  grid.source = rows;
  grid.view = rows.slice();
  grid._selectedRowSnapshot = grid.captureSelectedRowChangeState();
  grid.selectedRowChanged.addHandler(function(sender, args) {
    received.push(args);
  });

  rows.splice(0, 500);
  await Promise.resolve();

  assert.equal(applyCount, 1);
  assert.equal(refreshCount, 1);
  assert.equal(received.length, 1);
  assert.equal(received[0].reason, 'itemsSource');
  assert.equal(received[0].rowIndex, 0);
  assert.equal(received[0].dataItem.id, 500);
  assert.equal(received[0].previousRowIndex, 0);
  assert.equal(received[0].previousDataItem.id, 0);
});

test('scrolling inside the rendered overscan range avoids a full render', function() {
  var FabGrid = createFabGridFactory({});
  var scheduled = 0;
  var rendered = 0;
  var grid = {
    options: { syncScrollRender: true },
    editing: null,
    bodyScroll: { scrollTop: 64, scrollLeft: 0 },
    hideInvalidTip: function() {},
    isFilterMenuOpen: function() { return false; },
    isColumnChooserOpen: function() { return false; },
    isDateboxPanelOpen: function() { return false; },
    isComboboxPanelOpen: function() { return false; },
    isColorPanelOpen: function() { return false; },
    updateScrollState: function() {},
    syncFixedPaneScrollOffset: function() {},
    syncHeaderFooterScrollPosition: function() {},
    updateHorizontalScrollbar: function() {},
    updateVerticalScrollbar: function() {},
    shouldRenderScrollImmediately: function() { return false; },
    scheduleRender: function() { scheduled += 1; },
    render: function() { rendered += 1; },
    emit: function() {}
  };

  FabGrid.prototype.handleScroll.call(grid);

  assert.equal(scheduled, 0);
  assert.equal(rendered, 0);
});

test('content shrink clamps scrollTop and clears fixed pane offsets', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    bodyScroll: { scrollTop: 2546 },
    renderedScrollTop: 2546,
    frozenLayer: { style: { transform: 'translate3d(0,32px,0)' } },
    frozenRightLayer: { style: { transform: 'translate3d(0,32px,0)' } },
    rowHeaderLayer: { style: { transform: 'translate3d(0,32px,0)' } },
    selectionLayer: { style: { transform: 'translate3d(0,32px,0)' } },
    resetFixedPaneScrollOffset: FabGrid.prototype.resetFixedPaneScrollOffset
  };
  var metrics = { scrollTop: 2546, contentHeight: 110 };

  assert.equal(
    FabGrid.prototype.reconcileVerticalScrollAfterContentResize.call(grid, metrics, 2624),
    true
  );
  assert.equal(grid.bodyScroll.scrollTop, 2514);
  assert.equal(metrics.scrollTop, 2514);
  assert.equal(grid.renderedScrollTop, 2514);
  assert.equal(grid.frozenLayer.style.transform, '');
  assert.equal(grid.frozenRightLayer.style.transform, '');
  assert.equal(grid.rowHeaderLayer.style.transform, '');
  assert.equal(grid.selectionLayer.style.transform, '');
});

test('scheduled scroll renders reuse the current layout', function() {
  var FabGrid = createFabGridFactory({});
  var originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  var callback;
  var renderArguments = [];
  var grid = {
    raf: 0,
    disposed: false,
    render: function(skipLayout) {
      renderArguments.push(skipLayout);
    }
  };

  globalThis.requestAnimationFrame = function(handler) {
    callback = handler;
    return 1;
  };
  try {
    FabGrid.prototype.scheduleRender.call(grid);
    assert.equal(typeof callback, 'function');
    callback();
  } finally {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
  }

  assert.deepEqual(renderArguments, [true]);
  assert.equal(grid.raf, 0);
});

test('vertical-only scroll reuses static columns unless the footer aggregate is dirty', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    columnRange: { start: 3, end: 12 },
    _footerAggregateCacheDirty: false
  };

  assert.equal(
    FabGrid.prototype.shouldRenderStaticColumns.call(grid, true, { start: 3, end: 12 }),
    false
  );
  assert.equal(
    FabGrid.prototype.shouldRenderStaticColumns.call(grid, true, { start: 4, end: 13 }),
    true
  );
  assert.equal(
    FabGrid.prototype.shouldRenderStaticColumns.call(grid, false, { start: 3, end: 12 }),
    true
  );
  assert.equal(FabGrid.prototype.shouldRenderFooterColumns.call(grid, false), false);
  grid._footerAggregateCacheDirty = true;
  assert.equal(FabGrid.prototype.shouldRenderFooterColumns.call(grid, false), true);
  assert.equal(FabGrid.prototype.shouldRenderFooterColumns.call(grid, true), true);
});

test('scroll-linked header distance uses refreshed scroll metrics after columns shrink', function() {
  var FabGrid = createFabGridFactory({});
  var propertyName = '';
  var propertyValue = '';
  var grid = Object.create(FabGrid.prototype);

  grid.useScrollLinkedHorizontal = true;
  grid.bodyScroll = {
    clientWidth: 1236,
    scrollWidth: 1264
  };
  grid.root = {
    style: {
      setProperty: function(name, value) {
        propertyName = name;
        propertyValue = value;
      }
    }
  };

  grid.updateScrollLinkedHorizontalDistance();

  assert.equal(propertyName, '--fg-scroll-linked-horizontal-distance');
  assert.equal(propertyValue, '-28px');
});

test('scroll-linked header distance schedules one post-layout correction', function() {
  var FabGrid = createFabGridFactory({});
  var originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  var callback = null;
  var updates = 0;
  var grid = Object.create(FabGrid.prototype);

  grid.useScrollLinkedHorizontal = true;
  grid.bodyScroll = {};
  grid.scrollLinkedHorizontalRaf = 0;
  grid.disposed = false;
  grid.updateScrollLinkedHorizontalDistance = function() { updates += 1; };
  globalThis.requestAnimationFrame = function(handler) {
    callback = handler;
    return 7;
  };

  try {
    grid.scheduleScrollLinkedHorizontalDistanceUpdate();
    grid.scheduleScrollLinkedHorizontalDistanceUpdate();
    assert.equal(grid.scrollLinkedHorizontalRaf, 7);
    assert.equal(typeof callback, 'function');
    callback();
    assert.equal(grid.scrollLinkedHorizontalRaf, 0);
    assert.equal(updates, 1);
  } finally {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
  }
});

test('refresh delegates layout work to render once', function() {
  var FabGrid = createFabGridFactory({});
  var layouts = 0;
  var renders = 0;
  var grid = {
    emit: function() { return true; },
    updateLayout: function() { layouts += 1; },
    render: function() { renders += 1; }
  };

  FabGrid.prototype.refresh.call(grid);

  assert.equal(layouts, 0);
  assert.equal(renders, 1);
});

test('setRowHeaderWidth normalizes the width and refreshes the grid', function() {
  var FabGrid = createFabGridFactory({});
  var refreshCount = 0;
  var grid = {
    options: { rowHeaderWidth: 60 },
    refresh: function() {
      refreshCount += 1;
    }
  };

  FabGrid.prototype.setRowHeaderWidth.call(grid, 80);
  assert.equal(grid.options.rowHeaderWidth, 80);
  assert.equal(refreshCount, 1);

  FabGrid.prototype.setRowHeaderWidth.call(grid, -20);
  assert.equal(grid.options.rowHeaderWidth, 0);
  assert.equal(refreshCount, 2);

  FabGrid.prototype.setRowHeaderWidth.call(grid, 'invalid');
  assert.equal(grid.options.rowHeaderWidth, 60);
  assert.equal(refreshCount, 3);
});

test('active cell border defaults to one pixel', function() {
  var FabGrid = createFabGridFactory({});
  var descriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'activeCellBorder');
  var applyCount = 0;
  var grid = {
    options: {},
    applyThemeOptions: function() {
      applyCount += 1;
    }
  };

  assert.equal(descriptor.get.call(grid), 1);
  descriptor.set.call(grid, 'invalid');
  assert.equal(grid.options.activeCellBorder, 1);
  assert.equal(applyCount, 1);

  descriptor.set.call(grid, 0);
  assert.equal(grid.options.activeCellBorder, 0);
  assert.equal(applyCount, 2);
});

test('columns default width to columnMinWidth and ignore legacy minWidth', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    options: { columnMinWidth: 24 },
    columns: [],
    updateLayout: function() {},
    refresh: function() {}
  };

  FabGrid.prototype.setColumns.call(grid, [
    { binding: 'default' },
    { binding: 'compact', width: 10 },
    { binding: 'legacy', width: 10, minWidth: 30 }
  ], true);

  assert.equal(grid.columns[0].width, 24);
  assert.equal(grid.columns[0]._width, 24);
  assert.equal(grid.columns[1]._width, 10);
  assert.equal(Object.prototype.hasOwnProperty.call(grid.columns[1], 'minWidth'), false);
  assert.equal(grid.columns[2]._width, 10);
  assert.equal(Object.prototype.hasOwnProperty.call(grid.columns[2], 'minWidth'), false);
});

test('Time uses string data while Date editor supports string and Date data types', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = {
    options: { columnMinWidth: 20 },
    columns: [],
    updateLayout: function() {},
    refresh: function() {}
  };

  FabGrid.prototype.setColumns.call(grid, [
    {
      binding: 'startedAt',
      dataType: 'string',
      mask: '99:99:99',
      autoUnmask: false,
      editor: 'time'
    },
    {
      binding: 'orderDate',
      dataType: 'date'
    },
    {
      binding: 'textDate',
      dataType: 'string',
      mask: '9999/99/99',
      autoUnmask: false,
      editor: 'date'
    }
  ], true);

  assert.equal(grid.columns[0].editor.type, 'time');
  assert.equal(grid.columns[0].mask, '99:99:99');
  assert.equal(grid.columns[0].autoUnmask, false);
  assert.equal(grid.columns[1].editor.type, 'date');
  assert.equal(grid.columns[1].autoUnmask, false);
  assert.equal(grid.columns[2].editor.type, 'date');
  assert.equal(grid.columns[2].mask, '9999/99/99');
  assert.equal(grid.columns[2].autoUnmask, false);
});

test('every Grid editor type defaults autoUnmask to false', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = {
    options: { columnMinWidth: 20 },
    columns: [],
    updateLayout: function() {},
    refresh: function() {}
  };

  FabGrid.prototype.setColumns.call(grid, [
    { binding: 'text', editor: 'text' },
    { binding: 'number', dataType: 'number', editor: 'number' },
    { binding: 'time', editor: 'time' },
    { binding: 'date', dataType: 'date', editor: 'date' },
    { binding: 'combo', editor: 'combo' },
    { binding: 'color', editor: 'color' }
  ], true);

  grid.columns.forEach(function(column) {
    assert.equal(column.autoUnmask, false);
  });
});

test('column exposes only isReadOnly and prevents editing', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    options: {
      allowEditing: true,
      columnMinWidth: 20
    },
    columns: [],
    view: [{ code: 'A001', name: 'Alpha', amount: 100 }],
    updateLayout: function() {},
    refresh: function() {},
    isRowGroup: function() { return false; },
    isRowGroupFooter: function() { return false; }
  };

  FabGrid.prototype.setColumns.call(grid, [
    { binding: 'code', isReadOnly: true, isVisible: false },
    { binding: 'name' },
    { binding: 'amount' }
  ], true);
  grid.visibleColumns = grid.columns;

  assert.equal(grid.columns[0].isReadOnly, true);
  assert.equal(Object.prototype.hasOwnProperty.call(grid.columns[0], 'readOnly'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(grid.columns[0], 'isVisible'), false);
  assert.equal(grid.columns[0].visible, true);
  assert.equal(grid.columns[1].isReadOnly, false);
  assert.equal(Object.prototype.hasOwnProperty.call(grid.columns[1], 'readOnly'), false);
  assert.equal(FabGrid.prototype.isCellEditable.call(grid, 0, 0), false);
  assert.equal(FabGrid.prototype.isCellEditable.call(grid, 0, 1), true);
  assert.equal(FabGrid.prototype.isCellEditable.call(grid, 0, 2), true);

  grid.columns[0].isReadOnly = false;
  assert.equal(FabGrid.prototype.isCellEditable.call(grid, 0, 0), true);
});

test('starting an editor only exposes it after render and positioning succeed', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var renderError = new Error('formatItem failed');
  var positionCount = 0;
  var focusCount = 0;
  var selectCount = 0;

  grid.options = { allowEditing: true, multiSelectRows: false };
  grid.visibleColumns = [{ binding: 'name', align: '' }];
  grid.columns = grid.visibleColumns;
  grid.view = [{ name: 'Alpha' }];
  grid.selection = { row: 0, col: 0 };
  grid.editor = {
    style: { display: 'none' },
    focus: function() { focusCount += 1; },
    select: function() { selectCount += 1; }
  };
  grid.editorIconHost = { style: { display: 'none' } };
  grid.isCellEditable = function() { return true; };
  grid.cancelEditingForSelection = function() {};
  grid.emit = function() { return true; };
  grid.configureEditor = function() {
    this.editorIconHost.style.display = 'flex';
  };
  grid.getEditorText = function(value) { return value; };
  grid.updateEditorSpinnerState = function() {};
  grid.syncColorEditorAppearance = function() {};
  grid.positionEditor = function() {
    positionCount += 1;
  };
  grid.clearEditingState = function() {
    this.editing = null;
    this.editor.style.display = 'none';
    this.editorIconHost.style.display = 'none';
  };
  grid.render = function() {
    assert.equal(this.editor.style.display, 'none');
    assert.equal(this.editorIconHost.style.display, 'none');
    throw renderError;
  };

  assert.throws(function() {
    grid.startEditing(0, 0);
  }, renderError);
  assert.equal(grid.editing, null);
  assert.equal(grid.editor.style.display, 'none');
  assert.equal(grid.editorIconHost.style.display, 'none');
  assert.equal(positionCount, 0);

  grid.render = function() {
    assert.equal(this.editor.style.display, 'none');
    assert.equal(this.editorIconHost.style.display, 'none');
  };

  assert.equal(grid.startEditing(0, 0), true);
  assert.deepEqual(grid.editRange, { row: 0, col: 0, row2: 0, col2: 0 });
  assert.equal(grid.editor.style.display, 'block');
  assert.equal(grid.editorIconHost.style.display, 'flex');
  assert.equal(positionCount, 1);
  assert.equal(focusCount, 1);
  assert.equal(selectCount, 1);
});

test('startEditing supports the Wijmo-compatible boolean overload', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var hidden = { binding: 'internal', visible: false };
  var serial = { binding: 'serial', name: 'itemNumber', align: '', visible: true };
  var focusCount = 0;
  var selectCount = 0;
  var startingArgs = null;
  var triggerEvent = { type: 'keydown' };

  grid.options = { allowEditing: true, multiSelectRows: false };
  grid.columns = [hidden, serial];
  grid.visibleColumns = [serial];
  grid.view = [{ serial: '0001' }];
  grid.selection = { row: 0, col: 0 };
  grid.editor = {
    style: { display: 'none' },
    focus: function() { focusCount += 1; },
    select: function() { selectCount += 1; }
  };
  grid.editorIconHost = { style: { display: 'none' } };
  grid.isCellEditable = FabGrid.prototype.isCellEditable;
  grid.cancelEditingForSelection = function() {};
  grid.emit = function(name, args) {
    if (name === 'beginningEdit') startingArgs = args;
    return true;
  };
  grid.configureEditor = function() {};
  grid.getEditorText = function(value) { return value; };
  grid.updateEditorSpinnerState = function() {};
  grid.syncColorEditorAppearance = function() {};
  grid.positionEditor = function() {};
  grid.render = function() {};
  grid.clearEditingState = function() {
    this.editing = null;
    this.editor.style.display = 'none';
  };

  assert.equal(grid.startEditing(false), true);
  assert.equal(grid.editing.row, 0);
  assert.equal(grid.editing.col, 0);
  assert.equal(grid.editing.fullEdit, false);
  assert.equal(focusCount, 1);
  assert.equal(selectCount, 1);

  grid.clearEditingState();
  assert.equal(grid.startEditing(), true);
  assert.equal(grid.editing.fullEdit, true);
  assert.equal(focusCount, 2);
  assert.equal(selectCount, 2);

  grid.clearEditingState();
  assert.equal(grid.startEditing(true, 0, 1, false, triggerEvent), true);
  assert.equal(grid.editing.col, 0);
  assert.equal(grid.editing.fullEdit, true);
  assert.equal(grid.editing.event, triggerEvent);
  assert.equal(startingArgs.col, 1);
  assert.equal(startingArgs.viewCol, 0);
  assert.equal(startingArgs.event, triggerEvent);
  assert.equal(focusCount, 2);
  assert.equal(selectCount, 2);

  grid.clearEditingState();
  assert.equal(grid.startEditing(true, 0, 'itemNumber', false), true);
  assert.equal(grid.editing.col, 0);
  grid.clearEditingState();
  assert.equal(grid.startEditing(true, 0, 0), false);

  assert.equal(grid.startEditing(0, '1', { selectRow: false }), true);
  assert.equal(grid.editing.col, 0);
  grid.clearEditingState();
  assert.equal(grid.startEditing(0, 0, { selectRow: false }), false);
});

test('cell edit events expose full and visible column indexes', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var hidden = { binding: 'hidden', visible: false, _index: 0 };
  var visible = { binding: 'value', visible: true, _index: 1, dataType: 'string' };
  var item = { hidden: 'A', value: 'before' };
  var endingArgs = null;
  var endedArgs = null;

  grid.options = {};
  grid.columns = [hidden, visible];
  grid.visibleColumns = [visible];
  grid.view = [item];
  grid.editing = {
    row: 0,
    col: 0,
    item: item,
    original: item.value
  };
  grid.editor = { value: 'after', style: {} };
  grid._suppressObservedItemChange = 0;
  grid._footerAggregateCache = [{ value: 1 }];
  grid._footerAggregateCacheDirty = false;
  grid.validateCellValue = function() { return null; };
  grid.clearCellValidationError = function() {};
  grid.emit = function(name, args) {
    if (name === 'cellEditEnding') endingArgs = Object.assign({}, args);
    if (name === 'cellEditEnded') endedArgs = Object.assign({}, args);
    return true;
  };
  grid.clearEditingState = function() {
    this.editing = null;
  };
  grid.refreshCollectionView = function() { return true; };

  assert.equal(grid.finishEditing(true, { restoreFocus: false }), true);
  assert.equal(item.value, 'after');
  assert.equal(endingArgs.col, 1);
  assert.equal(endingArgs.viewCol, 0);
  assert.equal(endedArgs.col, 1);
  assert.equal(endedArgs.viewCol, 0);
  assert.deepEqual(grid._footerAggregateCache, []);
  assert.equal(grid._footerAggregateCacheDirty, true);
});

test('cell-related public event args include hidden columns in col indexes', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var hiddenBefore = { binding: 'hiddenBefore', visible: false, _index: 0 };
  var firstVisible = { binding: 'first', visible: true, _index: 1, _viewIndex: 0 };
  var hiddenMiddle = { binding: 'hiddenMiddle', visible: false, _index: 2 };
  var secondVisible = { binding: 'second', visible: true, _index: 3, _viewIndex: 1 };
  var selectionArgs;
  var emitted = [];
  var iconArgs;

  grid.columns = [hiddenBefore, firstVisible, hiddenMiddle, secondVisible];
  grid.visibleColumns = [firstVisible, secondVisible];
  grid.view = [{ first: 'A', second: 'B' }];
  grid.selection = { row: 0, col: 1 };
  grid.getSelectedText = function() { return 'B'; };
  grid.copyText = function() {};
  grid.emit = function(name, args) {
    emitted.push({ name: name, args: Object.assign({}, args) });
    return true;
  };

  selectionArgs = grid.getSelectionEventArgs(2, 1, 1, 0);
  assert.equal(selectionArgs.col, 3);
  assert.equal(selectionArgs.col2, 3);
  assert.equal(selectionArgs.anchorCol, 1);
  assert.equal(selectionArgs.activeCol, 3);
  assert.deepEqual(selectionArgs.range, { row: 1, col: 1, row2: 2, col2: 3 });
  assert.equal(selectionArgs.viewCol, 1);
  assert.equal(selectionArgs.viewCol2, 1);
  assert.equal(selectionArgs.viewAnchorCol, 0);
  assert.equal(selectionArgs.viewActiveCol, 1);
  assert.deepEqual(selectionArgs.viewRange, { row: 1, col: 0, row2: 2, col2: 1 });

  assert.equal(grid.copySelection(), true);
  emitted.filter(function(entry) {
    return entry.name === 'copying' || entry.name === 'copyingCell' ||
      entry.name === 'copied' || entry.name === 'copiedCell' || entry.name === 'cellCopied';
  }).forEach(function(entry) {
    assert.equal(entry.args.col, 3, entry.name);
    assert.equal(entry.args.viewCol, 1, entry.name);
  });

  grid.editing = { row: 0, col: 1, original: 'before' };
  grid.editor = { value: 'after' };
  grid.editorIconConfigs = [];
  grid.getEditorValue = function() { return 'after'; };
  iconArgs = grid.createEditorButtonArgs({}, null, null, 0);
  assert.equal(iconArgs.col, 3);
  assert.equal(iconArgs.viewCol, 1);

  iconArgs = grid.createHeaderSearchIconArgs({}, null, { value: 'B' }, secondVisible, null, 0);
  assert.equal(iconArgs.col, 3);
  assert.equal(iconArgs.viewCol, 1);
});

test('pointer leaving the edit cell keeps editing unchanged', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var currentCell = createFakeElement(['fg-cell'], { 'data-row': 1, 'data-col': 2 });
  var otherCell = createFakeElement(['fg-cell'], { 'data-row': 2, 'data-col': 0 });
  var editor = createFakeElement(['fg-editor']);
  var editorIconHost = createFakeElement(['fg-editor-icons']);
  var popupTarget = createFakeElement(['popup-item']);
  var outside = createFakeElement(['outside']);
  var finishCalls = [];

  currentCell.className = 'fg-cell';
  otherCell.className = 'fg-cell';
  editor.className = 'fg-editor';
  editorIconHost.className = 'fg-editor-icons';
  popupTarget.className = 'popup-item';
  outside.className = 'outside';
  grid.editing = { row: 1, col: 2 };
  grid.editor = editor;
  grid.editorIconHost = editorIconHost;
  grid.dateboxPanel = {
    contains: function(target) {
      return target === popupTarget;
    }
  };
  grid.comboboxPanel = null;
  grid.colorPanel = null;
  grid.hoverRow = null;
  grid.updateInvalidTip = function() {};
  grid.hideInvalidTip = function() {};
  grid.renderVisibleRows = function() {};
  grid.finishEditing = function(commit, options) {
    finishCalls.push({ commit: commit, options: options });
    this.editing = null;
    return true;
  };

  FabGrid.prototype.handleMouseMove.call(grid, { target: currentCell });
  FabGrid.prototype.handleMouseMove.call(grid, { target: editor });
  FabGrid.prototype.handleMouseLeave.call(grid, { relatedTarget: popupTarget });
  FabGrid.prototype.handleMouseMove.call(grid, { target: otherCell });
  FabGrid.prototype.handleMouseLeave.call(grid, { relatedTarget: outside });
  assert.equal(finishCalls.length, 0);
  assert.deepEqual(grid.editing, { row: 1, col: 2 });
});

test('clicking another cell commits the current editor before changing selection', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var root = createFakeElement(['fg-root']);
  var cell = createFakeElement(['fg-cell'], { 'data-row': 1, 'data-col': 1 });
  var finishCalls = [];
  var selected = null;

  root.className = 'fg-root';
  root.ownerDocument = {};
  root.focus = function() {};
  cell.className = 'fg-cell';
  cell.parentNode = root;
  grid.root = root;
  grid.options = {};
  grid.view = [{}, {}];
  grid.selection = { row: 0, col: 0 };
  grid.editing = { row: 0, col: 0 };
  grid.busy = false;
  grid.suppressClick = false;
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.isCellRangeSelectionMode = function() { return false; };
  grid.shouldEditOnSelect = function() { return false; };
  grid.finishEditing = function(commit, options) {
    finishCalls.push({ commit: commit, options: options });
    this.editing = null;
    return true;
  };
  grid.toggleRowSelection = function(row, col) {
    selected = { row: row, col: col };
  };
  grid._scrollVisibleIntoView = function() {};

  FabGrid.prototype.handleClick.call(grid, {
    target: cell,
    detail: 1,
    preventDefault: function() {},
    stopPropagation: function() {}
  });

  assert.deepEqual(finishCalls, [{
    commit: true,
    options: { restoreFocus: false }
  }]);
  assert.deepEqual(selected, { row: 1, col: 1 });
});

test('changing the active cell cancels an editor on a different cell', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var finishCalls = [];

  grid.options = { multiSelectRows: true };
  grid.view = [{}, {}];
  grid.visibleColumns = [{}, {}];
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = null;
  grid.editing = { row: 0, col: 0 };
  grid.emit = function() {
    return true;
  };
  grid.getSelectionEventArgs = function(row, col, anchorRow, anchorCol) {
    return {
      row: row,
      col: col,
      anchorRow: anchorRow,
      anchorCol: anchorCol
    };
  };
  grid.finishEditing = function(commit, options) {
    finishCalls.push({ commit: commit, options: options });
    this.editing = null;
    return true;
  };
  grid.render = function() {};

  assert.equal(FabGrid.prototype.applyCellSelection.call(grid, 1, 1, 1, 1), true);
  assert.deepEqual(grid.selection, { row: 1, col: 1 });
  assert.deepEqual(finishCalls, [{
    commit: false,
    options: { restoreFocus: false }
  }]);
});

test('column isRequired defaults to false and adds empty edits to invalidItems', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var item = { name: 'Initial', note: '' };
  var requiredColumn;
  var optionalColumn;
  var requiredError;

  grid.options = {
    allowEditing: true,
    columnMinWidth: 20
  };
  grid.columns = [];
  grid.updateLayout = function() {};
  grid.refresh = function() {};
  grid.setColumns([
    { binding: 'name', isRequired: true },
    { binding: 'note' }
  ], true);
  requiredColumn = grid.columns[0];
  optionalColumn = grid.columns[1];

  assert.equal(requiredColumn.isRequired, true);
  assert.equal(optionalColumn.isRequired, false);
  grid.getText = function(path) {
    return path === 'validation.required' ? 'This field is required' : path;
  };
  requiredError = grid.validateCellValue(item, requiredColumn, '   ', 0, 0);
  assert.deepEqual(requiredError, {
    type: 'required',
    message: 'This field is required',
    value: '   '
  });
  assert.equal(grid.validateCellValue(item, requiredColumn, 0, 0, 0), null);
  assert.equal(grid.validateCellValue(item, requiredColumn, false, 0, 0), null);
  assert.equal(grid.validateCellValue(item, optionalColumn, '', 0, 1), null);

  grid.visibleColumns = grid.columns;
  grid.view = [item];
  grid.editing = {
    row: 0,
    col: 0,
    item: item,
    original: item.name
  };
  grid.editor = { value: '   ', style: {} };
  grid._suppressObservedItemChange = 0;
  grid._validationErrorSeq = 0;
  grid._validationItems = [];
  grid._validationItemIds = [];
  grid._invalidItemMap = {};
  grid._asyncValidationMap = {};
  grid.invalidItems = [];
  grid.emit = function() { return true; };
  grid.clearEditingState = function() {
    this.editing = null;
    this.editor.style.display = 'none';
  };
  grid.refreshCollectionView = function() { return true; };

  assert.equal(grid.finishEditing(true, { restoreFocus: false }), true);
  assert.equal(grid.invalidItems.length, 1);
  assert.equal(grid.invalidItems[0].type, 'required');
  assert.equal(grid.invalidItems[0].binding, 'name');
  assert.equal(grid.invalidItems[0].rowIndex, 0);
  assert.equal(grid.invalidItems[0].colIndex, 0);

  grid.editing = {
    row: 0,
    col: 0,
    item: item,
    original: item.name
  };
  grid.editor.value = 'Alpha';
  assert.equal(grid.finishEditing(true, { restoreFocus: false }), true);
  assert.equal(item.name, 'Alpha');
  assert.equal(grid.invalidItems.length, 0);
});

test('validation args isDuplicate checks non-empty local column values and excludes the current row', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var first = { code: 'A001' };
  var second = { code: 'B002' };
  var blank = { code: '   ' };
  var column = {
    binding: 'code',
    validate: function(args) {
      return args.isDuplicate() ? 'Code must be unique' : null;
    }
  };

  grid.source = [first, second, blank];
  grid.isTreeGrid = function() { return false; };
  grid.getText = function() { return 'Invalid'; };

  assert.equal(grid.validateCellValue(first, column, 'A001', 0, 0), null);
  assert.deepEqual(grid.validateCellValue(first, column, ' B002 ', 0, 0), {
    type: 'custom',
    message: 'Code must be unique',
    value: ' B002 '
  });
  assert.equal(grid.validateCellValue(first, column, '', 0, 0), null);
  assert.equal(grid.validateCellValue(first, column, '   ', 0, 0), null);
  assert.equal(grid.validateCellValue(first, column, 'b002', 0, 0), null);

  column.validate = function(args) {
    return args.isDuplicate({ ignoreCase: true }) ? 'Code must be unique' : null;
  };
  assert.deepEqual(grid.validateCellValue(first, column, 'b002', 0, 0), {
    type: 'custom',
    message: 'Code must be unique',
    value: 'b002'
  });
});

test('validation args isDuplicate supports nested bindings and TreeGrid children', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var child = { customer: { code: 'C002' }, children: [] };
  var root = { customer: { code: 'C001' }, children: [child] };
  var column = {
    binding: 'customer.code',
    validate: function(args) {
      return args.isDuplicate() ? 'Customer code must be unique' : null;
    }
  };

  grid.source = [root];
  grid.isTreeGrid = function() { return true; };
  grid.getTreeChildren = function(item) { return item.children || []; };
  grid.getText = function() { return 'Invalid'; };

  assert.deepEqual(grid.validateCellValue(child, column, 'C001', 1, 0), {
    type: 'custom',
    message: 'Customer code must be unique',
    value: 'C001'
  });
  assert.equal(grid.validateCellValue(child, column, '', 1, 0), null);
});

test('invalidItems removes deleted rows and updates every remaining row and column index', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var removed = { first: '', second: '' };
  var visible = { first: '', second: '' };
  var filtered = { first: '', second: '' };
  var firstColumn = { binding: 'first', _index: 0 };
  var secondColumn = { binding: 'second', _index: 1 };

  grid.source = [removed, visible, filtered];
  grid.view = [removed, visible, filtered];
  grid.columns = [firstColumn, secondColumn];
  grid.visibleColumns = [firstColumn, secondColumn];
  grid._validationErrorSeq = 0;
  grid._validationItems = [];
  grid._validationItemIds = [];
  grid._invalidItemMap = {};
  grid._asyncValidationMap = {};
  grid._asyncValidationItems = {};
  grid.invalidItems = [];
  grid.isTreeGrid = function() { return false; };
  grid.getText = function() { return 'Invalid'; };

  grid.setCellValidationError(removed, firstColumn, { message: 'Removed first' }, 0, 0);
  grid.setCellValidationError(removed, secondColumn, { message: 'Removed second' }, 0, 1);
  grid.setCellValidationError(visible, firstColumn, { message: 'Visible first' }, 1, 0);
  grid.setCellValidationError(filtered, secondColumn, { message: 'Filtered second' }, 2, 1);

  grid.source.splice(0, 1);
  grid.view = [visible];
  grid.visibleColumns = [secondColumn, firstColumn];
  grid.refreshInvalidItemRows();

  assert.equal(grid.invalidItems.length, 2);
  assert.equal(grid.invalidItems[0].item, visible);
  assert.equal(grid.invalidItems[0].rowIndex, 0);
  assert.equal(grid.invalidItems[0].rowNumber, 1);
  assert.equal(grid.invalidItems[0].colIndex, 1);
  assert.equal(grid.invalidItems[0].colNumber, 2);
  assert.equal(grid.invalidItems[1].item, filtered);
  assert.equal(grid.invalidItems[1].rowIndex, -1);
  assert.equal(grid.invalidItems[1].rowNumber, null);
  assert.equal(grid.invalidItems[1].colIndex, 0);
  assert.equal(grid.invalidItems[1].colNumber, 1);
  assert.equal(Object.keys(grid._invalidItemMap).length, 2);

  grid.setCellValidationError(removed, firstColumn, { message: 'Late removed error' }, 0, 0);
  assert.equal(grid.invalidItems.length, 2);

  grid.columns = [firstColumn];
  grid.visibleColumns = [firstColumn];
  grid.refreshInvalidItemRows();

  assert.equal(grid.invalidItems.length, 1);
  assert.equal(grid.invalidItems[0].item, visible);
  assert.equal(grid.invalidItems[0].colIndex, 0);
  assert.equal(Object.keys(grid._invalidItemMap).length, 1);
});

test('deleted rows cancel pending validation and ignore late async results', async function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var item = { name: '' };
  var column = { binding: 'name', _index: 0 };
  var resolveValidation;
  var validation = new Promise(function(resolve) {
    resolveValidation = resolve;
  });
  var applyCount = 0;
  var renderCount = 0;

  grid.source = [item];
  grid.view = [item];
  grid.columns = [column];
  grid.visibleColumns = [column];
  grid._validationErrorSeq = 0;
  grid._validationItems = [];
  grid._validationItemIds = [];
  grid._invalidItemMap = {};
  grid._asyncValidationSeq = 0;
  grid._asyncValidationMap = {};
  grid._asyncValidationItems = {};
  grid.invalidItems = [];
  grid.disposed = false;
  grid.isTreeGrid = function() { return false; };
  grid.getText = function() { return 'Invalid'; };
  grid.applyView = function() { applyCount += 1; };
  grid.render = function() { renderCount += 1; };

  grid.setPendingCellValidation(item, column, validation, item.name, 0, 0);
  grid.source.splice(0, 1);
  grid.view = [];
  grid.refreshInvalidItemRows();
  resolveValidation({ message: 'Late error' });
  await validation;
  await Promise.resolve();

  assert.equal(grid.invalidItems.length, 0);
  assert.equal(Object.keys(grid._asyncValidationMap).length, 0);
  assert.equal(Object.keys(grid._asyncValidationItems).length, 0);
  assert.equal(applyCount, 0);
  assert.equal(renderCount, 0);
});

test('invalidItems removes a deleted nested TreeGrid row', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var child = { name: '' };
  var root = { name: 'Root', children: [child] };
  var column = { binding: 'name', _index: 0 };

  grid.options = { childItemsPath: 'children' };
  grid.source = [root];
  grid.view = [root, child];
  grid.columns = [column];
  grid.visibleColumns = [column];
  grid._validationErrorSeq = 0;
  grid._validationItems = [];
  grid._validationItemIds = [];
  grid._invalidItemMap = {};
  grid._asyncValidationMap = {};
  grid._asyncValidationItems = {};
  grid.invalidItems = [];
  grid.isTreeGrid = function() { return true; };
  grid.getText = function() { return 'Invalid'; };

  grid.setCellValidationError(child, column, { message: 'Child error' }, 1, 0);
  root.children.splice(0, 1);
  grid.view = [root];
  grid.refreshInvalidItemRows();

  assert.equal(grid.invalidItems.length, 0);
  assert.equal(Object.keys(grid._invalidItemMap).length, 0);
});

test('column cssClass is applied to body cells from the initial definition', function() {
  var FabGrid = createFabGridFactory({});
  var originalDocument = globalThis.document;
  var cell;
  var column = {
    binding: 'amount',
    cssClass: 'amount-cell amount-emphasis',
    align: '',
    _left: 0,
    _width: 80
  };
  var grid = {
    view: [{ amount: 4200 }],
    visibleColumns: [column],
    options: { rowHeight: 32 },
    bodyScroll: { scrollTop: 0 },
    selection: { row: -1, col: -1 },
    getFixedLeftWidth: function() { return 0; },
    getVisibleRowHeight: function() { return 32; },
    isRowGroupFooter: function() { return false; },
    decorateFrozenDividerCell: function() {},
    isAlternatingRow: function() { return false; },
    shouldHighlightRow: function() { return false; },
    isCellInSelectionRange: function() { return false; },
    getCellValidationError: function() { return null; },
    applyRowDraggable: function() {},
    renderCellContent: function() {},
    decorateTreeCell: function() {}
  };

  globalThis.document = {
    createElement: function() {
      return {
        className: '',
        style: {},
        setAttribute: function() {}
      };
    }
  };

  try {
    cell = FabGrid.prototype.createBodyCell.call(grid, 0, 0, 'scroll', null);
  } finally {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  }

  assert.equal(cell.className, 'fg-cell amount-cell amount-emphasis');
});

test('Column multiLine defaults to false and only explicit true is enabled', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);

  grid.options = {
    columnMinWidth: 20
  };
  grid.updateLayout = function() {};
  grid.setColumns([
    { binding: 'defaultValue' },
    { binding: 'multiValue', multiLine: true },
    { binding: 'truthyValue', multiLine: 1 }
  ], true);

  assert.equal(grid.columns[0].multiLine, false);
  assert.equal(grid.columns[1].multiLine, true);
  assert.equal(grid.columns[2].multiLine, false);
});

test('Column multiLine uses a textarea only for the text editor', function() {
  var FabGrid = createFabGridFactory({});
  var listeners = [];
  var removedListeners = [];
  var parent = {
    replaceChild: function(next, previous) {
      next.parentNode = this;
      previous.parentNode = null;
    }
  };
  var ownerDocument = {
    createElement: function(tagName) {
      return createEditor(tagName);
    }
  };
  var grid = Object.create(FabGrid.prototype);

  function createEditor(tagName) {
    var attributes = {};
    return {
      tagName: String(tagName).toUpperCase(),
      className: '',
      style: {},
      parentNode: parent,
      addEventListener: function(name) {
        listeners.push(name);
      },
      removeEventListener: function(name) {
        removedListeners.push(name);
      },
      setAttribute: function(name, value) {
        attributes[name] = String(value);
      },
      removeAttribute: function(name) {
        delete attributes[name];
      },
      getAttribute: function(name) {
        return attributes[name] || null;
      }
    };
  }

  grid.root = { ownerDocument: ownerDocument };
  grid.editor = createEditor('input');
  grid.editorIconHost = { style: {}, className: '' };
  grid.getText = function() { return 'Cell editor'; };
  grid.renderEditorIcons = function() {};
  grid.hideDateboxPanel = function() {};
  grid.hideComboboxPanel = function() {};
  grid.hideColorPanel = function() {};

  grid.configureEditor({
    binding: 'notes',
    dataType: 'string',
    editor: null,
    multiLine: true
  });
  assert.equal(grid.editor.tagName, 'TEXTAREA');
  assert.equal(grid.editor.rows, 1);
  assert.equal(grid.editor.getAttribute('aria-multiline'), 'true');
  assert.match(grid.editor.className, /fg-editor-multiline/);
  assert.deepEqual(listeners, ['beforeinput', 'input', 'copy']);
  assert.deepEqual(removedListeners, ['beforeinput', 'input', 'copy']);

  grid.configureEditor({
    binding: 'amount',
    dataType: 'number',
    editor: null,
    multiLine: true
  });
  assert.equal(grid.editor.tagName, 'INPUT');
  assert.doesNotMatch(grid.editor.className, /fg-editor-multiline/);
});

test('text editor charcase defaults to text and preserves non-English characters', function() {
  var definitions = createEditorDefinitions();
  var FabGrid = createFabGridFactory(definitions);
  var grid = Object.create(FabGrid.prototype);
  var selection = null;
  var editorConfigs = [null, 'text', { type: 'text' }];

  grid.editing = { row: 0, col: 0 };
  grid.visibleColumns = [{
    binding: 'code',
    dataType: 'string',
    charcase: 'upper'
  }];
  grid.editor = {
    value: 'Abc 中文-123',
    selectionStart: 3,
    setSelectionRange: function(start, end) {
      selection = [start, end];
    }
  };

  editorConfigs.forEach(function(editor) {
    grid.visibleColumns[0].editor = editor;
    grid.editor.value = 'Abc 中文-123';
    grid.handleEditorInput();

    assert.equal(grid.editor.value, 'ABC 中文-123');
    assert.deepEqual(selection, [3, 3]);
    assert.equal(grid.getEditorValue(), 'ABC 中文-123');
  });
});

test('Column charcase accepts only upper and lower values', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);

  grid.options = { columnMinWidth: 20 };
  grid.updateLayout = function() {};
  grid.setColumns([
    { binding: 'defaultValue' },
    { binding: 'upperValue', charcase: 'UPPER' },
    { binding: 'lowerValue', charcase: 'lower' },
    { binding: 'invalidValue', charcase: 'title' }
  ], true);

  assert.equal(grid.columns[0].charcase, '');
  assert.equal(grid.columns[1].charcase, 'upper');
  assert.equal(grid.columns[2].charcase, 'lower');
  assert.equal(grid.columns[3].charcase, '');
});

test('Column charcase applies to combo input and preserves value mapping', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var column = {
    binding: 'status',
    dataType: 'string',
    charcase: 'upper',
    editor: {
      type: 'combo',
      valueField: 'id',
      textField: 'descr',
      data: [{ id: 'active', descr: 'Active 中文-1' }]
    }
  };

  grid.editing = { row: 0, col: 0, comboboxValue: null };
  grid.visibleColumns = [column];
  grid.editor = {
    value: 'Active 中文-1',
    selectionStart: 15,
    setSelectionRange: function() {}
  };
  grid.isComboboxPanelOpen = function() { return false; };

  grid.handleEditorInput();

  assert.equal(grid.editor.value, 'ACTIVE 中文-1');
  assert.equal(grid.getEditorText('active', column), 'ACTIVE 中文-1');
  assert.equal(grid.getEditorValue(column), 'active');
});

test('Column charcase applies to color but excludes date time and number editors', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var source = readFileSync(new URL('../src/grid/fabgrid.js', import.meta.url), 'utf8');
  var grid = Object.create(FabGrid.prototype);
  var column = {
    binding: 'color',
    dataType: 'string',
    charcase: 'upper',
    editor: 'color'
  };

  grid.editing = { row: 0, col: 0 };
  grid.visibleColumns = [column];
  grid.editor = {
    value: 'red',
    selectionStart: 3,
    style: { setProperty: function() {} },
    setSelectionRange: function() {}
  };
  grid.isColorPanelOpen = function() { return false; };
  grid.syncColorEditorAppearance = function() {};

  grid.handleEditorInput();

  assert.equal(grid.editor.value, 'RED');
  assert.equal(grid.getEditorText('#aabbcc', column), '#AABBCC');
  assert.equal(grid.getEditorValue(column), 'RED');
  assert.match(source, /type === 'date' \|\| type === 'time' \|\| type === 'number'/);
});

test('nested column definitions create merged Header groups while keeping leaf columns flat', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var group;

  grid.options = {
    columnMinWidth: 20,
    frozenColumns: 0,
    frozenRightColumns: 0,
    headerHeight: 32,
    rowHeight: 32,
    filterMode: false,
    allowFiltering: true
  };
  grid._stopNavigation = false;
  grid.emit = function() {};
  grid.refresh = function() {};

  grid.setColumns([
    {
      header: '規格',
      align: 'center',
      columns: [
        { binding: 'w', width: 45, header: '寬' },
        { binding: 'h', width: 45, header: '高' },
        { binding: 'l', width: 45, header: '深' }
      ]
    },
    { binding: 'amount', width: 80, header: '金額' }
  ], true);

  group = grid._columnHeaderGroups[0];
  assert.deepEqual(grid.columns.map(function(column) {
    return column.binding;
  }), ['w', 'h', 'l', 'amount']);
  assert.equal(group.header, '規格');
  assert.equal(group.align, 'center');
  assert.equal(group.columns[0], grid.columns[0]);
  assert.equal(group.columns[2], grid.columns[2]);
  assert.equal(group._visibleViewStart, 0);
  assert.equal(group._visibleViewEnd, 2);
  assert.equal(grid._visibleColumnHeaderDepth, 2);
  assert.doesNotThrow(function() {
    JSON.stringify(grid.columns);
  });
  assert.equal(grid.getHeaderTitleHeight(), 64);
  assert.equal(grid.getColumnHeaderTitleHeight(grid.columns[0]), 32);
  assert.equal(grid.getColumnHeaderTitleHeight(grid.columns[3]), 64);

  grid.columns[0].visible = false;
  grid.updateLayout();
  assert.equal(group._visibleViewStart, 0);
  assert.equal(group._visibleViewEnd, 1);

  grid.columns[1].visible = false;
  grid.columns[2].visible = false;
  grid.updateLayout();
  assert.equal(group._visibleViewStart, -1);
  assert.equal(group._visibleViewEnd, -1);
  assert.equal(grid._visibleColumnHeaderDepth, 1);
});

test('columns allow sorting by default and can disable it individually', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    options: { columnMinWidth: 20 },
    columns: [],
    updateLayout: function() {},
    refresh: function() {}
  };

  FabGrid.prototype.setColumns.call(grid, [
    { binding: 'name' },
    { binding: 'amount', allowSorting: false }
  ], true);

  assert.equal(grid.columns[0].allowSorting, true);
  assert.equal(grid.columns[1].allowSorting, false);
});

test('allowMultiSorting false keeps Shift and API sorting to one column', function() {
  var FabGrid = createFabGridFactory({});
  var hiddenColumn = { binding: 'internal', allowSorting: true, visible: false };
  var firstColumn = { binding: 'name', allowSorting: true };
  var secondColumn = { binding: 'amount', allowSorting: true };
  var events = [];
  var grid = {
    options: {
      allowMultiSorting: false,
      remote: false
    },
    visibleColumns: [firstColumn, secondColumn],
    columns: [hiddenColumn, firstColumn, secondColumn],
    sortStates: [{ column: firstColumn, direction: 1 }],
    sortState: null,
    getSortStates: function() {
      return this.sortStates;
    },
    getSortIndex: function(column) {
      return this.sortStates.findIndex(function(state) {
        return state.column === column;
      });
    },
    emit: function(name, e) {
      events.push({ name: name, args: e });
      return true;
    },
    applyView: function() {},
    resetVerticalScroll: function() {},
    render: function() {}
  };

  FabGrid.prototype.toggleSort.call(grid, '2', true);

  assert.equal(grid.sortStates.length, 1);
  assert.equal(grid.sortStates[0].column, secondColumn);
  assert.equal(events[0].name, 'sortingColumn');
  assert.equal(events[0].args.multiSort, false);
  assert.equal(events[1].name, 'sortedColumn');
  assert.equal(events[1].args.multiSort, false);
});

test('allowMultiSorting defaults to preserving Shift multi-column sorting', function() {
  var FabGrid = createFabGridFactory({});
  var firstColumn = { binding: 'name', allowSorting: true };
  var secondColumn = { binding: 'amount', allowSorting: true };
  var grid = {
    options: {
      remote: false
    },
    visibleColumns: [firstColumn, secondColumn],
    columns: [firstColumn, secondColumn],
    sortStates: [{ column: firstColumn, direction: 1 }],
    sortState: null,
    getSortStates: function() {
      return this.sortStates;
    },
    getSortIndex: function(column) {
      return this.sortStates.findIndex(function(state) {
        return state.column === column;
      });
    },
    emit: function() {
      return true;
    },
    applyView: function() {},
    resetVerticalScroll: function() {},
    render: function() {}
  };

  FabGrid.prototype.toggleSort.call(grid, 1, true);

  assert.equal(grid.sortStates.length, 2);
  assert.equal(grid.sortStates[0].column, firstColumn);
  assert.equal(grid.sortStates[1].column, secondColumn);
});

test('local sorting synchronizes a shared CollectionView before rendering', function() {
  var FabGrid = createFabGridFactory({});
  var column = { binding: 'amount', allowSorting: true };
  var calls = [];
  var grid = {
    options: {
      remote: false
    },
    visibleColumns: [column],
    columns: [column],
    sortStates: [],
    sortState: null,
    getSortStates: function() {
      return this.sortStates;
    },
    getSortIndex: function(target) {
      return this.sortStates.findIndex(function(state) {
        return state.column === target;
      });
    },
    emit: function() {
      return true;
    },
    syncCollectionViewSort: function() {
      calls.push('collectionView');
    },
    applyView: function() {
      calls.push('grid');
    },
    resetVerticalScroll: function() {},
    render: function() {}
  };

  FabGrid.prototype.toggleSort.call(grid, 0, false);

  assert.deepEqual(calls, ['collectionView', 'grid']);
});

test('sorting resets vertical scroll without changing horizontal scroll', function() {
  var FabGrid = createFabGridFactory({});
  var column = { binding: 'amount', allowSorting: true };
  var grid = {
    options: {
      remote: false
    },
    visibleColumns: [column],
    columns: [column],
    sortStates: [],
    sortState: null,
    bodyScroll: {
      scrollLeft: 420,
      scrollTop: 320
    },
    getSortStates: function() {
      return this.sortStates;
    },
    getSortIndex: function(target) {
      return this.sortStates.findIndex(function(state) {
        return state.column === target;
      });
    },
    emit: function() {
      return true;
    },
    applyView: function() {},
    resetVerticalScroll: FabGrid.prototype.resetVerticalScroll,
    render: function() {}
  };

  FabGrid.prototype.toggleSort.call(grid, 0, false);

  assert.equal(grid.bodyScroll.scrollTop, 0);
  assert.equal(grid.bodyScroll.scrollLeft, 420);
});

test('clearSort clears every local sort and synchronizes CollectionView once', function() {
  var FabGrid = createFabGridFactory({});
  var firstColumn = { binding: 'name', allowSorting: true };
  var secondColumn = { binding: 'amount', allowSorting: true };
  var calls = [];
  var grid = {
    options: {
      remote: false
    },
    sortStates: [
      { column: firstColumn, direction: 1 },
      { column: secondColumn, direction: -1 }
    ],
    sortState: { column: firstColumn, direction: 1 },
    getSortStates: FabGrid.prototype.getSortStates,
    syncCollectionViewSort: function() {
      calls.push('collectionView');
    },
    applyView: function() {
      calls.push('view');
    },
    resetVerticalScroll: function() {
      calls.push('scroll');
    },
    render: function() {
      calls.push('render');
    }
  };

  assert.equal(FabGrid.prototype.clearSort.call(grid), true);
  assert.deepEqual(grid.sortStates, []);
  assert.equal(grid.sortState, null);
  assert.deepEqual(calls, ['collectionView', 'view', 'scroll', 'render']);

  assert.equal(FabGrid.prototype.clearSort.call(grid), false);
  assert.deepEqual(calls, ['collectionView', 'view', 'scroll', 'render']);
});

test('clearSort resets remote pagination and reloads once', function() {
  var FabGrid = createFabGridFactory({});
  var column = { binding: 'amount', allowSorting: true };
  var loaded = 0;
  var grid = {
    options: {
      remote: true,
      pageNumber: 4,
      pager: {
        pageNumber: 4
      }
    },
    sortStates: [{ column: column, direction: -1 }],
    sortState: { column: column, direction: -1 },
    getSortStates: FabGrid.prototype.getSortStates,
    applyView: function() {},
    resetVerticalScroll: function() {},
    render: function() {},
    load: function() {
      loaded += 1;
    }
  };

  assert.equal(FabGrid.prototype.clearSort.call(grid), true);
  assert.equal(grid.options.pageNumber, 1);
  assert.equal(grid.options.pager.pageNumber, 1);
  assert.equal(loaded, 1);
});

test('getSortState returns an independent public sort snapshot', function() {
  var FabGrid = createFabGridFactory({});
  var firstColumn = { binding: 'name' };
  var secondColumn = { binding: 'amount' };
  var grid = {
    columns: [firstColumn, secondColumn],
    visibleColumns: [secondColumn, firstColumn],
    sortStates: [
      { column: firstColumn, direction: 1 },
      { column: secondColumn, direction: -1 }
    ],
    sortState: null,
    getSortStates: FabGrid.prototype.getSortStates
  };
  var state = FabGrid.prototype.getSortState.call(grid);

  assert.deepEqual(state, {
    active: true,
    sortStates: [
      {
        columnIndex: 0,
        visibleColumnIndex: 1,
        binding: 'name',
        direction: 1,
        order: 'asc',
        sortIndex: 0
      },
      {
        columnIndex: 1,
        visibleColumnIndex: 0,
        binding: 'amount',
        direction: -1,
        order: 'desc',
        sortIndex: 1
      }
    ]
  });

  state.sortStates[0].direction = -1;
  assert.equal(grid.sortStates[0].direction, 1);
  grid.sortStates = [];
  assert.deepEqual(FabGrid.prototype.getSortState.call(grid), {
    active: false,
    sortStates: []
  });
});

test('column allowSorting false blocks local and remote sorting before events and loading', function() {
  var FabGrid = createFabGridFactory({});
  [false, true].forEach(function(remote) {
    var emitted = 0;
    var loaded = 0;
    var grid = {
      options: { remote: remote },
      visibleColumns: [{ binding: 'amount', allowSorting: false }],
      emit: function() {
        emitted += 1;
        return true;
      },
      load: function() {
        loaded += 1;
      }
    };
    grid.columns = grid.visibleColumns;

    assert.equal(FabGrid.prototype.toggleSort.call(grid, 0, false), false);
    assert.equal(emitted, 0);
    assert.equal(loaded, 0);
  });
});

test('sortingColumn option can cancel local and remote sorting before loading', function() {
  var FabGrid = createFabGridFactory({});
  [false, true].forEach(function(remote) {
    var callbackCount = 0;
    var loaded = 0;
    var applied = 0;
    var grid = {
      options: {
        remote: remote,
        sortingColumn: function(sender, e) {
          callbackCount += 1;
          assert.equal(sender, grid);
          assert.equal(e.column.binding, 'amount');
          return false;
        }
      },
      events: {},
      wijmoEvents: {},
      visibleColumns: [{ binding: 'amount', allowSorting: true }],
      getSortStates: function() {
        return [];
      },
      getSortIndex: function() {
        return -1;
      },
      emit: FabGrid.prototype.emit,
      load: function() {
        loaded += 1;
      },
      applyView: function() {
        applied += 1;
      }
    };
    grid.columns = grid.visibleColumns;

    FabGrid.prototype.createWijmoEvents.call(grid);
    FabGrid.prototype.bindOptionEvent.call(grid, 'sortingColumn');

    assert.equal(FabGrid.prototype.toggleSort.call(grid, 0, false), false);
    assert.equal(callbackCount, 1);
    assert.equal(applied, 0);
    assert.equal(loaded, 0);
  });
});

test('sortingColumn option cancellation still raises registered event handlers once', function() {
  var FabGrid = createFabGridFactory({});
  var optionCalls = 0;
  var eventCalls = 0;
  var grid = {
    options: {
      remote: false,
      sortingColumn: function() {
        optionCalls += 1;
        return false;
      }
    },
    events: {},
    wijmoEvents: {},
    visibleColumns: [{ binding: 'amount', allowSorting: true }],
    getSortStates: function() {
      return [];
    },
    getSortIndex: function() {
      return -1;
    },
    emit: FabGrid.prototype.emit
  };
  grid.columns = grid.visibleColumns;

  FabGrid.prototype.createWijmoEvents.call(grid);
  FabGrid.prototype.bindOptionEvent.call(grid, 'sortingColumn');
  grid.sortingColumn.addHandler(function(g, e) {
    eventCalls += 1;
    assert.equal(e.cancel, true);
  });

  assert.equal(FabGrid.prototype.toggleSort.call(grid, 0, false), false);
  assert.equal(optionCalls, 1);
  assert.equal(eventCalls, 1);
});

test('selection API remains available while stopNavigation is enabled', function() {
  var FabGrid = createFabGridFactory({});
  var applied = [];
  var scrolled = [];
  var columns = [{}, {}, {}];
  var grid = {
    options: { rowHeight: 32, stopNavigation: true },
    view: new Array(10),
    columns: columns,
    visibleColumns: columns,
    selection: { row: 0, col: 0 },
    bodyScroll: { scrollTop: 0 },
    applyCellSelection: function(anchorRow, anchorCol, row, col) {
      applied.push([anchorRow, anchorCol, row, col]);
      this.selection = { row: row, col: col };
      return true;
    },
    getScrollableContentHeight: function() {
      return 96;
    },
    _scrollVisibleIntoView: function(row, col, options) {
      scrolled.push([row, col, options]);
    }
  };

  assert.equal(FabGrid.prototype.select.call(grid, 8), true);
  assert.deepEqual(applied[0], [8, 0, 8, 0]);
  assert.deepEqual(scrolled, [[8, 0, { alignY: 'start' }]]);

  scrolled.length = 0;
  assert.equal(FabGrid.prototype.select.call(grid, 1, 2), true);
  assert.deepEqual(applied[1], [1, 2, 1, 2]);
  assert.deepEqual(scrolled, []);
});

test('select ignores row and column indexes outside the available range', function() {
  var FabGrid = createFabGridFactory({});
  var applyCalls = 0;
  var columns = [{ binding: 'id' }, { binding: 'name' }];
  var grid = {
    view: [{ id: 1 }, { id: 2 }],
    columns: columns,
    visibleColumns: columns,
    applyCellSelection: function() {
      applyCalls += 1;
      return true;
    }
  };

  assert.equal(FabGrid.prototype.select.call(grid, -1), false);
  assert.equal(FabGrid.prototype.select.call(grid, 2), false);
  assert.equal(FabGrid.prototype.select.call(grid, 0, -1), false);
  assert.equal(FabGrid.prototype.select.call(grid, 0, 2), false);
  assert.equal(FabGrid.prototype.select.call(grid, 0.5, 0), false);
  assert.equal(applyCalls, 0);
});

test('select maps a full column index to the matching visible column', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = { binding: 'internal', visible: false };
  var serial = { binding: 'serial', visible: true };
  var source = { binding: 'source', visible: true };
  var applied = [];
  var grid = {
    view: [{ serial: '0001' }],
    columns: [hidden, serial, source],
    visibleColumns: [serial, source],
    bodyScroll: null,
    applyCellSelection: function(anchorRow, anchorCol, row, col) {
      applied.push([anchorRow, anchorCol, row, col]);
      return true;
    }
  };

  assert.equal(FabGrid.prototype.select.call(grid, 0, 1), true);
  assert.deepEqual(applied[0], [0, 0, 0, 0]);
  assert.equal(FabGrid.prototype.select.call(grid, 0, 2), true);
  assert.deepEqual(applied[1], [0, 1, 0, 1]);
  assert.equal(FabGrid.prototype.select.call(grid, 0, 0), false);
  assert.equal(applied.length, 2);
});

test('public data and range APIs use full column indexes with hidden columns', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = { binding: 'internal', visible: false };
  var serial = { binding: 'serial', visible: true };
  var amount = { binding: 'amount', visible: true, dataType: 'number' };
  var item = { internal: 'secret', serial: 'A001', amount: 10 };
  var applied = [];
  var grid = Object.create(FabGrid.prototype);

  grid.options = { selectionMode: 'CellRange', multiSelectRows: false };
  grid.columns = [hidden, serial, amount];
  grid.visibleColumns = [serial, amount];
  grid.view = [item];
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid._suppressObservedItemChange = 0;
  grid.editing = null;
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.refreshCollectionView = function() { return true; };
  grid.updateLayout = function() {};
  grid.clampSelection = function() {};
  grid.refresh = function() {};
  grid.emit = function() { return true; };
  grid.cancelEditingForSelection = function() {};
  grid.raiseRowSelectionChanged = function() {};
  grid.render = function() {};
  grid.applyCellSelection = function(anchorRow, anchorCol, row, col) {
    applied.push([anchorRow, anchorCol, row, col]);
    return true;
  };

  assert.equal(grid.getColumn(0), hidden);
  assert.equal(grid.getColumn(1), serial);
  assert.equal(grid.getColumn('0'), hidden);
  assert.equal(grid.getColumn('1'), serial);
  assert.equal(grid.getCellData(0, 0), 'secret');
  assert.equal(grid.getCellData(0, 1), 'A001');
  assert.equal(grid.getCellData(0, '1'), 'A001');
  assert.equal(grid.setCellData(0, '2', '25'), true);
  assert.equal(item.amount, 25);
  assert.equal(grid.selectRange(0, '1', 0, '2'), true);
  assert.deepEqual(applied, [[0, 0, 0, 1]]);
  assert.equal(grid.selectRange(0, 0, 0, 2), false);
  assert.equal(grid.selectRow(0, '2'), true);
  assert.equal(grid.selection.col, 1);
  assert.equal(grid.selectRow(0, 0), false);
  assert.equal(grid.setColumnVisible('0', true), true);
  assert.equal(hidden.visible, true);
  assert.equal(grid.setColumnVisible('serial', false), false);
});

test('treeColumn treats numbers and decimal integer strings as full column indexes', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var hidden = { binding: 'internal', visible: false };
  var first = { binding: 'first', visible: true };
  var second = { binding: 'second', visible: true };

  grid.columns = [hidden, first, second];
  grid.visibleColumns = [first, second];
  grid.options = { treeColumn: 1 };

  assert.equal(grid.getTreeColumnIndex(), 0);
  grid.options.treeColumn = '1';
  assert.equal(grid.getTreeColumnIndex(), 0);
  grid.options.treeColumn = 2;
  assert.equal(grid.getTreeColumnIndex(), 1);
  grid.options.treeColumn = '2';
  assert.equal(grid.getTreeColumnIndex(), 1);
  grid.options.treeColumn = 0;
  assert.equal(grid.getTreeColumnIndex(), -1);
  grid.options.treeColumn = '0';
  assert.equal(grid.getTreeColumnIndex(), -1);
});

test('scrollIntoView API remains available while stopNavigation is enabled', function() {
  var FabGrid = createFabGridFactory({});
  var renderCount = 0;
  var grid = {
    options: { rowHeight: 32, stopNavigation: true },
    bodyScroll: {
      clientHeight: 96,
      clientWidth: 200,
      scrollHeight: 320,
      scrollLeft: 0,
      scrollTop: 0
    },
    visibleColumns: [{ _left: 0, _width: 80 }],
    frozenColumns: 0,
    frozenWidth: 0,
    frozenRightWidth: 0,
    scrollableColumnEnd: 1,
    getScrollableContentHeight: function() {
      return 96;
    },
    getFixedLeftWidth: function() {
      return 0;
    },
    render: function() {
      renderCount += 1;
    }
  };
  grid.columns = grid.visibleColumns;

  FabGrid.prototype.scrollIntoView.call(grid, 4, 0, { alignY: 'start' });
  assert.equal(grid.bodyScroll.scrollTop, 128);

  FabGrid.prototype.scrollIntoView.call(grid, 9, 0, { alignY: 'start' });
  assert.equal(grid.bodyScroll.scrollTop, 224);
  assert.equal(renderCount, 2);
});

test('scrollIntoView keeps an oversized scrollable column aligned beside frozen columns', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = { visible: false };
  var grid = {
    options: { rowHeight: 32 },
    bodyScroll: {
      clientHeight: 96,
      clientWidth: 260,
      scrollHeight: 320,
      scrollLeft: 0,
      scrollTop: 0
    },
    visibleColumns: [
      { _left: 0, _width: 120 },
      { _left: 120, _width: 180 }
    ],
    frozenColumns: 1,
    frozenWidth: 120,
    frozenRightWidth: 0,
    scrollableColumnEnd: 2,
    getScrollableContentHeight: function() {
      return 96;
    },
    getFixedLeftWidth: function() {
      return 0;
    },
    render: function() {}
  };
  grid.columns = [hidden].concat(grid.visibleColumns);

  assert.equal(FabGrid.prototype.scrollIntoView.call(grid, 0, 0), false);
  FabGrid.prototype.scrollIntoView.call(grid, 0, 2);

  assert.equal(grid.bodyScroll.scrollLeft, 0);
});

test('unselectRow clears a checked row without toggling an unchecked row on', function() {
  var FabGrid = createFabGridFactory({});
  var first = { id: 1 };
  var second = { id: 2 };
  var renderCount = 0;
  var events = [];
  var grid = Object.create(FabGrid.prototype);

  grid.options = { multiSelectRows: true };
  grid.view = [first, second];
  grid.columns = [{ binding: 'id' }];
  grid.visibleColumns = grid.columns;
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.selectedRowMap = { 0: true };
  grid.selectedItemRefs = [first];
  grid._selectedItemSet = new WeakSet([first]);
  grid.isRowGroup = function() {
    return false;
  };
  grid.isRowGroupFooter = function() {
    return false;
  };
  grid.emit = function(name, args) {
    events.push([name, args]);
  };
  grid.render = function() {
    renderCount += 1;
  };

  assert.equal(grid.unselectRow(0), true);
  assert.equal(grid.isRowSelected(0), false);
  assert.equal(grid.isItemSelected(first), false);
  assert.equal(renderCount, 1);
  assert.deepEqual(events.map(function(entry) { return entry[0]; }), [
    'selectionChanging',
    'rowSelectionChanging',
    'selectionChanged',
    'rowSelectionChanged'
  ]);
  assert.equal(events[0][1].changedRow, 0);
  assert.equal(events[0][1].selected, false);
  assert.deepEqual(events[1][1], { row: 0, selected: false });
  assert.equal(events[2][1].row, 0);
  assert.equal(events[2][1].col, 0);
  assert.equal(events[2][1].changedRow, 0);
  assert.equal(events[2][1].selected, false);
  assert.deepEqual(events[3][1], { row: 0, selected: false });

  assert.equal(grid.unselectRow(1), false);
  assert.equal(grid.isRowSelected(1), false);
  assert.equal(renderCount, 1);
});

test('unselectRow clears a single selected row and keeps it cleared across selection clamping', function() {
  var FabGrid = createFabGridFactory({});
  var first = { id: 1 };
  var second = { id: 2 };
  var rows = [{ dataItem: first }, { dataItem: second }];
  var events = [];
  var renderCount = 0;
  var selectionState;
  var grid = Object.create(FabGrid.prototype);

  grid.options = {
    multiSelectRows: false,
    highlightActiveRow: true,
    selectionMode: 'Cell'
  };
  grid.view = [first, second];
  grid.visibleColumns = [{ binding: 'id' }];
  grid.columns = grid.visibleColumns;
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = 0;
  grid._rowSelectionCleared = false;
  grid.selectedRowMap = {};
  Object.defineProperty(grid, 'rows', {
    configurable: true,
    value: rows
  });
  grid.emit = function(name, args) {
    events.push([name, args]);
    return true;
  };
  grid.render = function() {
    renderCount += 1;
  };

  assert.equal(grid.unselectRow(1), false);
  assert.equal(grid.unselectRow(), true);
  assert.equal(grid.rowSelection, null);
  assert.equal(grid._rowSelectionCleared, true);
  assert.equal(grid.isRowSelected(0), false);
  assert.equal(grid.shouldHighlightRow(0), false);
  assert.deepEqual(grid.selectedItems, []);
  assert.deepEqual(grid.selectedRows, []);
  assert.deepEqual(grid.selection, { row: 0, col: 0 });
  assert.equal(renderCount, 1);
  assert.deepEqual(events.map(function(entry) { return entry[0]; }), [
    'selectionChanging',
    'rowSelectionChanging',
    'selectionChanged',
    'rowSelectionChanged'
  ]);
  assert.equal(events[0][1].changedRow, 0);
  assert.equal(events[0][1].selected, false);
  assert.deepEqual(events[1][1], { row: null, previousRow: 0, selected: false });
  assert.equal(events[2][1].row, 0);
  assert.equal(events[2][1].col, 0);
  assert.equal(events[2][1].changedRow, 0);
  assert.equal(events[2][1].selected, false);
  assert.deepEqual(events[3][1], { row: null, previousRow: 0, selected: false });

  grid.clampSelection();
  assert.equal(grid.rowSelection, null);
  assert.equal(grid.unselectRow(), false);

  selectionState = grid.captureSelectionState();
  grid.view = [second, first];
  grid.restoreSelectionState(selectionState);
  grid.clampSelection();
  assert.equal(grid.rowSelection, null);
  assert.deepEqual(grid.selectedItems, []);
  assert.deepEqual(grid.selectedRows, []);

  grid.view = [first, second];
  grid.selectRow(1, 0);
  assert.equal(grid.rowSelection, 1);
  assert.equal(grid._rowSelectionCleared, false);
  assert.deepEqual(grid.selectedItems, [second]);
  assert.deepEqual(grid.selectedRows, [rows[1]]);
});

test('row selection changes honor both cancellable event stages', function() {
  var FabGrid = createFabGridFactory({});
  var first = { id: 1 };
  var second = { id: 2 };
  var blockedEvent = 'selectionChanging';
  var events = [];
  var grid = Object.create(FabGrid.prototype);

  grid.options = { multiSelectRows: false };
  grid.view = [first, second];
  grid.dataView = grid.view;
  grid.columns = [{ binding: 'id', _index: 0 }];
  grid.visibleColumns = grid.columns;
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = 0;
  grid.selectedRowMap = {};
  grid.selectedItemRefs = [];
  grid._selectedItemSet = new WeakSet();
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.cancelEditingForSelection = function() {};
  grid.render = function() {};
  grid.emit = function(name) {
    events.push(name);
    return name !== blockedEvent;
  };

  assert.equal(grid.selectRow(1, 0), false);
  assert.deepEqual(grid.selection, { row: 0, col: 0 });
  assert.deepEqual(events, ['selectionChanging']);

  events = [];
  blockedEvent = 'rowSelectionChanging';
  assert.equal(grid.selectRow(1, 0), false);
  assert.deepEqual(grid.selection, { row: 0, col: 0 });
  assert.deepEqual(events, ['selectionChanging', 'rowSelectionChanging']);

  grid.options.multiSelectRows = true;
  grid.rowSelection = null;
  events = [];
  assert.equal(grid.toggleRowSelection(0, 0), false);
  assert.equal(grid.isItemSelected(first), false);
  assert.deepEqual(events, ['selectionChanging', 'rowSelectionChanging']);

  grid.setItemSelectionState(first, true);
  grid.rebuildSelectedRowMap();
  events = [];
  assert.equal(grid.unselectRow(0), false);
  assert.equal(grid.isItemSelected(first), true);
  assert.deepEqual(events, ['selectionChanging', 'rowSelectionChanging']);

  events = [];
  assert.equal(grid.setAllRowsSelected(true), false);
  assert.deepEqual(grid.selectedItems, [first]);
  assert.deepEqual(events, ['selectionChanging', 'rowSelectionChanging']);
});

test('select all rows raises complete selection event pairs', function() {
  var FabGrid = createFabGridFactory({});
  var first = { id: 1 };
  var second = { id: 2 };
  var events = [];
  var grid = Object.create(FabGrid.prototype);

  grid.options = { multiSelectRows: true };
  grid.view = [first, second];
  grid.dataView = grid.view;
  grid.columns = [{ binding: 'id', _index: 0 }];
  grid.visibleColumns = grid.columns;
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = null;
  grid.selectedRowMap = {};
  grid.selectedItemRefs = [];
  grid._selectedItemSet = new WeakSet();
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.emit = function(name, args) {
    events.push([name, args]);
    return true;
  };
  grid.render = function() {};

  assert.equal(grid.setAllRowsSelected(true), true);
  assert.deepEqual(events.map(function(entry) { return entry[0]; }), [
    'selectionChanging',
    'rowSelectionChanging',
    'selectionChanged',
    'rowSelectionChanged'
  ]);
  assert.equal(events[0][1].allRows, true);
  assert.equal(events[0][1].selected, true);
  assert.deepEqual(events[1][1], { row: null, selected: true, allRows: true });
  assert.equal(events[2][1].allRows, true);
  assert.equal(events[2][1].selected, true);
  assert.notEqual(events[0][1], events[2][1]);
  assert.notEqual(events[1][1], events[3][1]);
});

test('number cell editor spinner uses the shared definition and keeps editing active', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var attributes = {};
  var prevented = false;

  grid.editing = { row: 0, col: 0 };
  grid.visibleColumns = [{
    binding: 'amount',
    dataType: 'number',
    precision: 2,
    editor: { type: 'number', spinner: 'left', increment: 0.25, min: 0, max: 2 }
  }];
  grid.editorConfig = { type: 'number', options: { spinner: 'left', increment: 0.25, min: 0, max: 2 } };
  grid.editorSpinner = {};
  grid.editorSpinnerIncrease = { disabled: false };
  grid.editorSpinnerDecrease = { disabled: false };
  grid.editor = {
    value: '1.25',
    focus: function() {},
    select: function() {},
    setAttribute: function(name, value) { attributes[name] = value; },
    removeAttribute: function(name) { delete attributes[name]; }
  };

  assert.equal(grid.spinEditorValue(1), true);
  assert.equal(grid.editor.value, '1.50');
  assert.equal(attributes['aria-valuenow'], '1.5');
  assert.equal(grid.handleNumberSpinnerKeyDown({
    key: 'ArrowDown',
    preventDefault: function() { prevented = true; }
  }), true);
  assert.equal(prevented, true);
  assert.equal(grid.editor.value, '1.25');
  assert.ok(grid.editing);
});

test('time cell editor uses the shared definition for aliases, values, validation and spinner', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var grid = Object.create(FabGrid.prototype);
  var selectedRange = null;
  var column = {
    binding: 'startedAt',
    dataType: 'string',
    mask: '99:99:99',
    editor: 'time',
    spinner: true
  };

  grid.editing = { row: 0, col: 0 };
  grid.visibleColumns = [column];
  grid.editorConfig = { type: 'time', options: { mask: '99:99:99', spinner: true } };
  grid.editorSpinner = {};
  grid.editorSpinnerIncrease = { disabled: false };
  grid.editorSpinnerDecrease = { disabled: false };
  grid.editor = {
    value: '12:34:56',
    selectionStart: 4,
    focus: function() {},
    setSelectionRange: function(start, end) { selectedRange = [start, end]; },
    setAttribute: function() {},
    removeAttribute: function() {}
  };
  grid.getText = function(path) { return path; };
  grid.isRowGroupFooter = function() { return false; };

  assert.equal(grid.getEditorText('123456', column), '12:34:56');
  assert.equal(grid.getEditorValue(column), '12:34:56');
  assert.equal(grid.getCellDisplayText({}, column, '123456'), '12:34:56');
  assert.equal(grid.validateCellValue({}, column, '24:00:00', 0, 0), null);
  assert.deepEqual(grid.validateCellValue({}, column, '24:00:01', 0, 0), {
    type: 'time',
    message: 'validation.invalidTime',
    value: '24:00:01'
  });
  assert.equal(grid.spinEditorValue(1), true);
  assert.equal(grid.editor.value, '12:35:56');
  assert.deepEqual(selectedRange, [3, 5]);

  column.editor = 'time';
  column.dataType = 'string';
  column.mask = '99:99';
  grid.editor.value = '09:30';
  assert.equal(grid.getEditorText('0930', column), '09:30');
  assert.equal(grid.getEditorValue(column), '09:30');

  column.editor = 'time';
  column.autoUnmask = false;
  assert.equal(grid.getEditorValue(column), '09:30');

  column.editor = null;
  column.dataType = 'string';
  column.mask = '99:99';
  column.autoUnmask = true;
  assert.equal(grid.getEditorText('1745', column), '17:45');
  grid.editor.value = '17:45';
  assert.equal(grid.getEditorValue(column), '1745');
});

test('editor icon host stays inside the active editor border', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var cell = {
    getBoundingClientRect: function() {
      return { left: 110, top: 210, width: 120, height: 32 };
    }
  };

  grid.editing = { row: 0, col: 0 };
  grid.visibleColumns = [{}];
  grid.root = {
    querySelector: function() {
      return cell;
    }
  };
  grid.body = {
    getBoundingClientRect: function() {
      return { left: 10, top: 10 };
    }
  };
  grid.bodyScroll = { clientWidth: 600, scrollLeft: 0, scrollTop: 0 };
  grid.editor = { style: {} };
  grid.editorIconHost = { style: { width: '22px' } };
  grid.editorConfig = { type: 'combo' };
  grid.editorIconConfigs = [];
  grid.options = { activeCellBorder: 2, rowHeight: 32 };
  Object.defineProperty(grid, 'frozenColumns', {
    configurable: true,
    value: 0
  });
  grid.scrollableColumnEnd = 1;
  grid.getEditorIconHostWidth = function() {
    return 22;
  };
  grid.positionComboboxPanel = function() {};

  FabGrid.prototype.positionEditor.call(grid);

  assert.equal(grid.editor.style.top, '200px');
  assert.equal(grid.editor.style.height, '32px');
  assert.equal(grid.editorIconHost.style.left, '196px');
  assert.equal(grid.editorIconHost.style.top, '203px');
  assert.equal(grid.editorIconHost.style.height, '26px');
  assert.equal(grid.editorIconHost.style.width, '22px');
});

test('cell templates support Wijmo-compatible function and string contracts', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var item = { name: 'Alpha', amount: 4200 };
  var column = {
    binding: 'amount',
    format: 'n0',
    cellTemplate: '<span class="${value > 4000 ? \'big-val\' : \'small-val\'}">${text}:${item.name}:${row.index}:${col.binding}</span>'
  };
  var cell = { innerHTML: '', textContent: '' };
  var directCell = { innerHTML: 'default', textContent: '' };
  var functionContext;

  grid.view = [item];
  grid._rowCollection = null;
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };

  assert.equal(grid.applyCellTemplate(cell, item, column, item.amount, '4,200', 0), true);
  assert.equal(cell.innerHTML, '<span class="big-val">4,200:Alpha:0:amount</span>');

  column.cellTemplate = function(ctx, target) {
    functionContext = ctx;
    target.textContent = ctx.item.name;
    return null;
  };
  assert.equal(grid.applyCellTemplate(directCell, item, column, item.amount, '4,200', 0), true);
  assert.equal(directCell.innerHTML, 'default');
  assert.equal(directCell.textContent, 'Alpha');
  assert.equal(functionContext.col, column);
  assert.equal(functionContext.row, grid.rows[0]);
  assert.equal(functionContext.value, 4200);
  assert.equal(functionContext.text, '4,200');
});

test('CellMaker.makeLink creates a Wijmo-compatible link template', function() {
  var FabGrid = createFabGridFactory({});
  var anchor;
  var appended;
  var prevented = false;
  var clickedContext;
  var ctx = {
    item: { id: 7, name: 'Alpha' },
    text: 'Alpha'
  };
  var cell = {
    ownerDocument: {
      createElement: function(tagName) {
        assert.equal(tagName, 'a');
        anchor = {};
        return anchor;
      }
    },
    textContent: 'old',
    appendChild: function(child) {
      appended = child;
    }
  };
  var template = FabGrid.CellMaker.makeLink({
    text: '<b>${item.name}</b>',
    href: '/orders/${item.id}',
    title: '${text}',
    cssClass: 'order-link',
    click: function(event, linkContext) {
      clickedContext = linkContext;
    }
  });

  assert.equal(template(ctx, cell), null);
  assert.equal(cell.textContent, '');
  assert.equal(appended, anchor);
  assert.equal(anchor.className, 'fg-cell-maker order-link');
  assert.equal(anchor.href, '/orders/7');
  assert.equal(anchor.title, 'Alpha');
  assert.equal(anchor.innerHTML, '<b>Alpha</b>');

  anchor.onclick({
    preventDefault: function() {
      prevented = true;
    }
  });
  assert.equal(prevented, true);
  assert.equal(clickedContext, ctx);
});

test('runtime cellTemplate assignment invalidates the grid', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var invalidateCount = 0;

  grid.disposed = false;
  grid.columns = [];
  grid.options = {};
  grid.updateLayout = function() {};
  grid.refresh = function() {};
  grid.invalidate = function() { invalidateCount += 1; };
  FabGrid.prototype.setColumns.call(grid, [{ binding: 'name' }], true);

  assert.equal(grid.columns[0].cellTemplate, null);
  grid.columns[0].cellTemplate = function(ctx) { return ctx.text; };
  assert.equal(typeof grid.columns[0].cellTemplate, 'function');
  assert.equal(invalidateCount, 1);
  grid.columns[0].cellTemplate = null;
  assert.equal(invalidateCount, 2);
});

test('setHeaderCellStyle stores styles by exact binding and redraws headers', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var inputStyle = {
    backgroundColor: '#fff4cc',
    color: '#663c00',
    'font-weight': 700
  };
  var renderCount = 0;

  grid.columns = [
    { binding: 'orderNo', header: 'Order No.' },
    { binding: 'customer', header: 'Customer' }
  ];
  grid.headerCellStyles = Object.create(null);
  grid.columnRange = { start: 0, end: 2 };
  grid.root = {};
  grid.disposed = false;
  grid.renderHeaders = function(range) {
    assert.deepEqual(range, grid.columnRange);
    renderCount += 1;
  };

  assert.equal(grid.setHeaderCellStyle('orderNo', inputStyle), true);
  assert.deepEqual(grid.headerCellStyles.orderNo, inputStyle);
  assert.notEqual(grid.headerCellStyles.orderNo, inputStyle);
  inputStyle.color = '#000000';
  assert.equal(grid.headerCellStyles.orderNo.color, '#663c00');
  assert.equal(renderCount, 1);

  assert.equal(grid.setHeaderCellStyle('Order No.', { color: 'red' }), false);
  assert.equal(grid.setHeaderCellStyle('missing', { color: 'red' }), false);
  assert.equal(grid.setHeaderCellStyle('orderNo', 'color: red'), false);
  assert.equal(renderCount, 1);

  assert.equal(grid.setHeaderCellStyle('orderNo', null), true);
  assert.equal(Object.prototype.hasOwnProperty.call(grid.headerCellStyles, 'orderNo'), false);
  assert.equal(renderCount, 2);
});

test('header cell custom styles merge after grid styles and override duplicates', function() {
  var style = {
    left: '20px',
    width: '120px',
    height: '32px',
    color: 'rgb(0, 0, 0)',
    setProperty: function(name, value) {
      this[name] = value;
    }
  };

  applyHeaderCellStyle(style, {
    width: '180px',
    color: '#c00000',
    backgroundColor: '#fff4cc',
    'font-weight': 700,
    '--custom-header-accent': '#c00000'
  });

  assert.equal(style.left, '20px');
  assert.equal(style.height, '32px');
  assert.equal(style.width, '180px');
  assert.equal(style.color, '#c00000');
  assert.equal(style.backgroundColor, '#fff4cc');
  assert.equal(style['font-weight'], '700');
  assert.equal(style['--custom-header-accent'], '#c00000');
});

test('selection mode exposes Cell and CellRange with active row highlighting enabled by default', function() {
  var FabGrid = createFabGridFactory({});
  var modeDescriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'selectionMode');
  var highlightDescriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'highlightActiveRow');
  var renderCount = 0;
  var grid = {
    options: { selectionMode: 'Cell', highlightActiveRow: true },
    selection: { row: 2, col: 1 },
    selectionAnchor: { row: 0, col: 0 },
    render: function() { renderCount += 1; }
  };

  assert.deepEqual(FabGrid.SelectionMode, { Cell: 'Cell', CellRange: 'CellRange' });
  assert.equal(highlightDescriptor.get.call(grid), true);

  modeDescriptor.set.call(grid, 'cell-range');
  assert.equal(grid.options.selectionMode, 'CellRange');
  modeDescriptor.set.call(grid, 'unsupported');
  assert.equal(grid.options.selectionMode, 'Cell');
  assert.deepEqual(grid.selectionAnchor, { row: 2, col: 1 });

  highlightDescriptor.set.call(grid, false);
  assert.equal(grid.options.highlightActiveRow, false);
  assert.equal(renderCount, 3);
});

test('editRange exposes the current edited cell as a read-only range snapshot', function() {
  var FabGrid = createFabGridFactory({});
  var descriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'editRange');
  var grid = Object.create(FabGrid.prototype);
  var range;

  grid.visibleColumns = [
    { binding: 'first', _index: 0 },
    { binding: 'third', _index: 2 }
  ];
  grid.editing = null;
  assert.equal(descriptor.set, undefined);
  assert.equal(grid.editRange, null);

  grid.editing = { row: 2, col: 1 };
  range = grid.editRange;
  assert.deepEqual(range, { row: 2, col: 2, row2: 2, col2: 2 });

  range.row = 9;
  assert.deepEqual(grid.editRange, { row: 2, col: 2, row2: 2, col2: 2 });

  grid.editing = null;
  assert.equal(grid.editRange, null);
});

test('cell range selection preserves an anchor and exposes a normalized selected range', function() {
  var FabGrid = createFabGridFactory({});
  var events = [];
  var grid = Object.create(FabGrid.prototype);

  grid.options = { selectionMode: 'CellRange', multiSelectRows: false, highlightActiveRow: true };
  grid.view = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  grid.visibleColumns = [{ binding: 'a' }, { binding: 'b' }, { binding: 'c' }];
  grid.columns = grid.visibleColumns;
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = 0;
  grid.emit = function(name, args) {
    events.push({ name: name, args: args });
    return true;
  };
  grid.render = function() {};

  assert.equal(grid.selectRange(3, 2, 1, 0), true);
  assert.deepEqual(grid.selectionAnchor, { row: 3, col: 2 });
  assert.deepEqual(grid.selection, { row: 1, col: 0 });
  assert.deepEqual(grid.getSelectionRange(), { row: 1, col: 0, row2: 3, col2: 2 });
  assert.deepEqual(grid.selectedRanges, [{ row: 1, col: 0, row2: 3, col2: 2 }]);
  assert.deepEqual(events.find(function(entry) { return entry.name === 'selectionChanged'; }).args.range,
    { row: 1, col: 0, row2: 3, col2: 2 });
});

test('cell range row selection spans every visible column and keeps the active cell at the first column', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);

  grid.options = { selectionMode: 'CellRange', multiSelectRows: false };
  grid.view = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  grid.visibleColumns = [{ binding: 'a' }, { binding: 'b' }, { binding: 'c' }];
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = 0;
  grid.emit = function() { return true; };
  grid.render = function() {};

  assert.equal(grid.selectCellRangeRows(1, 3), true);
  assert.deepEqual(grid._getRowHeaderSelectionRange(), { row: 1, col: 0, row2: 3, col2: 2 });
  assert.deepEqual(grid.selectionAnchor, { row: 1, col: 2 });
  assert.deepEqual(grid.selection, { row: 3, col: 0 });
  assert.deepEqual(grid.getSelectionRange(), { row: 1, col: 0, row2: 3, col2: 2 });

  assert.equal(grid.extendCellRangeRowSelection(0), true);
  assert.deepEqual(grid._getRowHeaderSelectionRange(), { row: 0, col: 0, row2: 1, col2: 2 });
  assert.deepEqual(grid.selectionAnchor, { row: 1, col: 2 });
  assert.deepEqual(grid.selection, { row: 0, col: 0 });
  assert.deepEqual(grid.getSelectionRange(), { row: 0, col: 0, row2: 1, col2: 2 });
});

test('row header selection copies the whole visible row in Cell mode and clears on cell selection', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var hidden = { binding: 'hidden', visible: false };
  var first = { binding: 'first', visible: true };
  var second = { binding: 'second', visible: true };

  grid.options = { selectionMode: 'Cell', multiSelectRows: false };
  grid.view = [
    { hidden: 'H1', first: 'A1', second: 'B1' },
    { hidden: 'H2', first: 'A2', second: 'B2' }
  ];
  grid.columns = [hidden, first, second];
  grid.visibleColumns = [first, second];
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = 0;
  grid.emit = function() { return true; };
  grid.render = function() {};
  grid.cancelEditingForSelection = function() {};
  grid.raiseRowSelectionChanged = function() {};
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.getCellData = function(row, col) {
    return grid.view[row][grid.columns[col].binding];
  };

  grid._selectVisibleRow(1, 0, true);

  assert.deepEqual(grid._getRowHeaderSelectionRange(), { row: 1, col: 0, row2: 1, col2: 1 });
  assert.equal(grid._isRowHeaderCellSelected(1), true);
  assert.equal(grid.getSelectedText(), 'A2\tB2');

  assert.equal(grid._selectVisibleCell(0, 1), true);
  assert.equal(grid._getRowHeaderSelectionRange(), null);
  assert.equal(grid._isRowHeaderCellSelected(1), false);
  assert.equal(grid.getSelectedText(), 'B1');
});

test('clicking a RowHeader starts whole-row selection in Cell mode', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var root = createFakeElement(['fg-root']);
  var rowHeader = createFakeElement(['fg-row-header-cell'], { 'data-row': 1 });
  var selected = null;
  var focused = 0;

  root.className = 'fg-root';
  root.ownerDocument = {};
  root.focus = function() { focused += 1; };
  rowHeader.className = 'fg-row-header-cell';
  rowHeader.parentNode = root;
  grid.root = root;
  grid.options = {};
  grid.view = [{}, {}];
  grid.selection = { row: 0, col: 1 };
  grid.busy = false;
  grid.suppressClick = false;
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.isCellRangeSelectionMode = function() { return false; };
  grid._selectVisibleRow = function(row, col, wholeRow) {
    selected = { row: row, col: col, wholeRow: wholeRow };
  };

  FabGrid.prototype.handleClick.call(grid, {
    target: rowHeader,
    preventDefault: function() {},
    stopPropagation: function() {}
  });

  assert.deepEqual(selected, { row: 1, col: 1, wholeRow: true });
  assert.equal(focused, 1);
});

test('cell range row header drag starts a whole-row range interaction', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var selected = [];
  var bound = 0;
  var prevented = 0;
  var focused = 0;
  var rowHeader = {
    getAttribute: function(name) {
      return name === 'data-row' ? '1' : null;
    }
  };

  grid.options = { selectionMode: 'CellRange' };
  grid.view = [{ id: 1 }, { id: 2 }, { id: 3 }];
  grid.visibleColumns = [{ binding: 'a' }, { binding: 'b' }];
  grid.suppressCellRangeClick = false;
  grid.suppressCellRangeClickEvent = false;
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.selectCellRangeRows = function(anchorRow, activeRow) {
    selected.push([anchorRow, activeRow]);
  };
  grid.bindPointerInteractionEvents = function() { bound += 1; };
  grid.root = { focus: function() { focused += 1; } };

  assert.equal(grid.startCellRangeRowDrag({
    pointerId: 9,
    clientX: 12,
    clientY: 48,
    shiftKey: false,
    preventDefault: function() { prevented += 1; }
  }, rowHeader), true);

  assert.deepEqual(selected, [[1, 1]]);
  assert.equal(grid.cellRangeDragState.wholeRow, true);
  assert.equal(grid.cellRangeDragState.startRow, 1);
  assert.equal(grid.cellRangeDragState.startCol, 0);
  assert.equal(bound, 1);
  assert.equal(prevented, 1);
  assert.equal(focused, 1);
});

test('cell range appearance uses row selection fill and activeCellBorder', function() {
  var css = readFileSync(new URL('../src/grid/fabgrid.css', import.meta.url), 'utf8');
  var viewSource = readFileSync(new URL('../src/grid/fabgrid-view.js', import.meta.url), 'utf8');

  assert.match(css, /\.fg-cell\.fg-range-top\s*\{[^}]*border-top:\s*var\(--fg-active-cell-border\) solid var\(--fg-range-border\)/s);
  assert.match(css, /\.fg-cell\.fg-range-bottom\s*\{[^}]*border-bottom:\s*var\(--fg-active-cell-border\) solid var\(--fg-range-border\)/s);
  assert.match(css, /\.fg-cell\.fg-range-left\s*\{[^}]*border-left:\s*var\(--fg-active-cell-border\) solid var\(--fg-range-border\)/s);
  assert.match(css, /\.fg-cell\.fg-range-right\s*\{[^}]*border-right:\s*var\(--fg-active-cell-border\) solid var\(--fg-range-border\)/s);
  assert.match(css, /\.fg-root \.fg-cell\.fg-range-selected\.fg-selected\s*\{[^}]*background:\s*var\(--fg-range-active-bg\)[^}]*box-shadow:\s*none/s);
  assert.match(css, /\.fg-root \.fg-cell\.fg-range-selected\.fg-selected::before\s*\{[^}]*border:\s*var\(--fg-active-cell-border\) solid var\(--fg-range-border\)/s);
  ['top', 'bottom', 'left', 'right'].forEach(function(side) {
    assert.match(css, new RegExp(
      '\\.fg-root \\.fg-cell\\.fg-range-selected\\.fg-selected\\.fg-range-' + side +
      '::before\\s*\\{[^}]*border-' + side + ':\\s*0', 's'));
  });
  assert.doesNotMatch(css, /\.fg-row-header-cell\.fg-row-header-selected/);
  assert.doesNotMatch(viewSource, /fg-row-header-selected/);
  assert.match(viewSource, /createRowHeaderCell[\s\S]*?_isRowHeaderCellSelected[\s\S]*?aria-selected/);
});

test('Grid root follows a host shorter than the former default height', function() {
  var css = readFileSync(new URL('../src/grid/fabgrid.css', import.meta.url), 'utf8');

  assert.match(css, /:root \.fg-root\s*\{[^}]*min-height:\s*0;/s);
  assert.doesNotMatch(css, /:root \.fg-root\s*\{[^}]*min-height:\s*260px;/s);
});

test('column footer uses the same horizontal padding as body cells', function() {
  var css = readFileSync(new URL('../src/grid/fabgrid.css', import.meta.url), 'utf8');
  var bodyCellRule = css.match(/:root \.fg-cell\s*\{([^}]+)\}/);
  var footerCellRule = css.match(/:root \.fg-footer-cell\s*\{([^}]+)\}/);

  assert.ok(bodyCellRule);
  assert.ok(footerCellRule);
  assert.match(bodyCellRule[1], /padding:\s*0 7px;/);
  assert.match(footerCellRule[1], /padding:\s*0 7px;/);
});

test('multiple footer rows support keys, labels and panel cell updates', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var column = { _index: 0, binding: 'amount', footer: 5 };

  grid.options = {
    showFooter: true,
    footerHeight: 28,
    footerLabel: '',
    footerRows: [
      { key: 'hours', label: '時' },
      { key: 'value', label: '值' }
    ]
  };
  grid.columns = [column];
  grid.view = [];
  grid.dataView = [];
  grid._footerCellValues = [];
  grid._footerRowLabels = [];
  grid.columnFooters = createGridPanel(grid, CellType.ColumnFooter);
  grid.bottomLeftCells = createGridPanel(grid, CellType.BottomLeft);

  assert.equal(grid.getFooterHeight(), 56);
  assert.deepEqual(grid.getFooterRows().map(function(row) { return row.label; }), ['時', '值']);
  assert.equal(grid.getFooterCellValue('hours', column), 5);
  assert.equal(grid.columnFooters.setCellData('hours', 0, 12, false), true);
  assert.equal(grid.columnFooters.setCellData('value', 0, 3000, false), true);
  assert.equal(grid.columnFooters.getCellData(0, 0, false), 12);
  assert.equal(grid.columnFooters.getCellData(1, 0, false), 3000);
  assert.equal(grid.columnFooters.getCellData(1, 0, true), '3,000');
  assert.equal(grid.bottomLeftCells.getCellData(0, 0, false), '時');
  assert.equal(grid.bottomLeftCells.getCellData(1, 0, false), '值');
  assert.equal(grid.bottomLeftCells.setCellData('value', 0, '金額', false), true);
  assert.equal(grid.getFooterRowLabel(1), '金額');
  assert.equal(grid.columnFooters.rows.length, 2);
});

test('numeric footer cells align right while footerFormatter remains authoritative', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var originalDocument = globalThis.document;
  var column = { _index: 0, _viewIndex: 0, _width: 100, binding: 'amount', align: 'center' };
  var cell;

  globalThis.document = {
    createElement: function() {
      return {
        className: '',
        style: {},
        attributes: {},
        setAttribute: function(name, value) { this.attributes[name] = value; },
        appendChild: function(child) { this.child = child; }
      };
    }
  };
  try {
    grid.options = {
      showFooter: true,
      footerHeight: 32,
      footerRows: [{ key: 'total', label: '合計' }]
    };
    grid.columns = [column];
    grid.view = [];
    grid.dataView = [];
    grid._footerCellValues = [{ 0: 1234567 }];
    grid.columnFooters = createGridPanel(grid, CellType.ColumnFooter);
    grid.decorateFrozenDividerCell = function() {};
    grid.raiseFormatItem = function() {};
    grid.createFormatItemEventArgs = function() { return {}; };

    cell = grid.createFooterCell(column, 0, 'scroll', 0);
    assert.equal(cell.style.textAlign, 'right');
    assert.equal(cell.style.justifyContent, 'flex-end');
    assert.equal(cell.child.textContent, '1,234,567');

    column.footerFormatter = function(value) { return '$' + value; };
    assert.equal(grid.getFooterCellText(0, column), '$1234567');
  } finally {
    globalThis.document = originalDocument;
  }
});

test('legacy footer options keep a single footer row', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var column = { _index: 0, binding: 'amount', footer: 5 };

  grid.options = { showFooter: true, footerHeight: 32, footerLabel: '合計' };
  grid.columns = [column];
  grid.view = [];
  grid.dataView = [];

  assert.equal(grid.getFooterRowCount(), 1);
  assert.equal(grid.getFooterHeight(), 32);
  assert.equal(grid.getFooterRowLabel(0), '合計');
  assert.equal(grid.getFooterCellValue(column), 5);
});

test('footer aggregates reuse cached values until applyView rebuilds the data view', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var calls = 0;
  var column = {
    _index: 0,
    binding: 'amount',
    aggregate: function(args) {
      calls += 1;
      return args.rows.reduce(function(total, item) {
        return total + args.getValue(item);
      }, 0);
    }
  };

  grid._footerAggregateCache = [];
  grid.columns = [column];
  grid.source = [{ amount: 2 }, { amount: 3 }];
  grid.view = grid.source.slice();
  grid.dataView = grid.view;
  grid._collectionView = null;
  grid.options = { remote: false, pagination: false, filterMode: false };
  grid.filterPredicate = null;
  grid.searchText = '';
  grid.hasColumnSearch = false;
  grid.columnSearchValues = {};
  grid.columnSearchOperators = {};
  grid.excelFilters = {};
  grid.getSortStates = function() { return []; };
  grid.captureSelectionState = function() { return {}; };
  grid.isTreeGrid = function() { return false; };
  grid.createGroupedView = function(rows) { return rows; };
  grid.refreshInvalidItemRows = function() {};
  grid.restoreSelectionState = function() {};
  grid.clampSelection = function() {};
  grid.syncEditingWithView = function() {};

  assert.equal(grid.getFooterCellValue(column), 5);
  assert.equal(grid.getFooterCellValue(column), 5);
  assert.equal(calls, 1);

  grid.source[1].amount = 8;
  grid.applyView();

  assert.equal(grid.getFooterCellValue(column), 10);
  assert.equal(calls, 2);
});

test('setCellData marks footer aggregates dirty even when CollectionView defers its refresh', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var item = { amount: 5 };
  var column = { _index: 0, binding: 'amount', dataType: 'number' };

  grid.view = [item];
  grid.columns = [column];
  grid._suppressObservedItemChange = 0;
  grid._footerAggregateCache = [{ value: 5 }];
  grid._footerAggregateCacheDirty = false;
  grid.isRowGroup = function() { return false; };
  grid.isRowGroupFooter = function() { return false; };
  grid.refreshCollectionView = function() { return true; };

  assert.equal(grid.setCellData(0, 0, 8), true);
  assert.equal(item.amount, 8);
  assert.deepEqual(grid._footerAggregateCache, []);
  assert.equal(grid._footerAggregateCacheDirty, true);
});

test('refreshFooter invalidates aggregate cache and redraws only the footer', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var renderedRange = null;
  var fullRenderCalls = 0;

  grid._footerAggregateCache = [{ value: 10 }];
  grid.disposed = false;
  grid._updateCount = 0;
  grid.footerFrozen = {};
  grid.footerFrozenRight = {};
  grid.footerCanvas = {};
  grid.columnRange = { start: 1, end: 3 };
  grid.renderFooter = function(range) { renderedRange = range; };
  grid.render = function() { fullRenderCalls += 1; };

  assert.equal(grid.refreshFooter(), true);
  assert.deepEqual(grid._footerAggregateCache, []);
  assert.equal(renderedRange, grid.columnRange);
  assert.equal(fullRenderCalls, 0);
});

test('column footer callbacks remain uncached', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var calls = 0;
  var column = {
    _index: 0,
    aggregate: 'sum',
    footer: function() {
      calls += 1;
      return calls;
    }
  };

  grid.view = [];

  assert.equal(grid.getFooterCellValue(column), 1);
  assert.equal(grid.getFooterCellValue(column), 2);
  assert.equal(calls, 2);
});

test('color cell keeps its value text at the normal cell text color', function() {
  var css = readFileSync(new URL('../src/grid/fabgrid.css', import.meta.url), 'utf8');
  var colorTextRule = css.match(/:root \.fg-color-text\s*\{([^}]+)\}/);

  assert.ok(colorTextRule);
  assert.match(colorTextRule[1], /color:\s*var\(--fg-cell-text\)/);
});

test('top-left Search Row fixed cells have no built-in double-click action', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var cleared = 0;
  var prevented = 0;
  var stopped = 0;

  grid.options = {
    allowEditing: true,
    allowResizing: true,
    filterMode: ['searchRow']
  };
  grid._stopNavigation = false;
  grid.busy = false;
  grid.pendingCellDblClick = null;
  grid.clearSearchConditions = function() { cleared += 1; };

  ['fg-row-header-top', 'fg-selection-top'].forEach(function(className) {
    FabGrid.prototype.handleDblClick.call(grid, {
      target: { nodeType: 1, className: className, parentNode: null },
      preventDefault: function() { prevented += 1; },
      stopPropagation: function() { stopped += 1; }
    });
  });

  assert.equal(cleared, 0);
  assert.equal(prevented, 0);
  assert.equal(stopped, 0);
});

test('cell range pointer tracking recognizes a double click on the same cell', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);

  grid.cellRangeClickCandidate = null;

  assert.equal(grid.isCellRangePointerDoubleClick({
    detail: 0,
    timeStamp: 100,
    clientX: 40,
    clientY: 50
  }, 2, 1), false);
  assert.equal(grid.isCellRangePointerDoubleClick({
    detail: 0,
    timeStamp: 300,
    clientX: 42,
    clientY: 52
  }, 2, 1), true);
  assert.equal(grid.cellRangeClickCandidate, null);
  assert.equal(grid.isCellRangePointerDoubleClick({
    detail: 2,
    timeStamp: 800,
    clientX: 80,
    clientY: 90
  }, 3, 2), false);
  assert.equal(grid.isCellRangePointerDoubleClick({
    detail: 2,
    timeStamp: 900,
    clientX: 82,
    clientY: 92
  }, 3, 2), true);

  grid.cellRangeClickCandidate = {
    row: 1,
    col: 1,
    time: 1000,
    clientX: 20,
    clientY: 20
  };
  assert.equal(grid.isCellRangePointerDoubleClick({
    detail: 2,
    timeStamp: 1100,
    clientX: 20,
    clientY: 20
  }, 1, 2), false);
});

test('pointer cancel ends a cell range drag without scheduling a double click', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var scheduled = 0;

  grid.cellRangeDragState = {
    pointerId: 7,
    startRow: 2,
    startCol: 1,
    isDoubleClick: true,
    didMove: false
  };
  grid.cellRangeAutoScrollRaf = 0;
  grid.cellRangeClickCandidate = { row: 2, col: 1 };
  grid.suppressCellRangeClick = false;
  grid.suppressCellRangeClickEvent = false;
  grid.scheduleCellDblClick = function() { scheduled += 1; };

  assert.equal(grid.finishCellRangeDrag({ type: 'pointercancel', pointerId: 7 }), true);
  assert.equal(scheduled, 0);
  assert.equal(grid.cellRangeClickCandidate, null);
  assert.equal(grid.suppressCellRangeClick, false);
  assert.equal(grid.suppressCellRangeClickEvent, false);
});

test('selecting the unchanged cell range does not render again', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);
  var renderCount = 0;

  grid.options = { selectionMode: 'CellRange', multiSelectRows: false };
  grid.view = [{ a: 1 }];
  grid.columns = [{ binding: 'a' }];
  grid.visibleColumns = grid.columns;
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.rowSelection = 0;
  grid.render = function() { renderCount += 1; };

  assert.equal(grid.select(0, 0), true);
  assert.equal(renderCount, 0);
});

test('document pointer handlers are bound only for an active interaction', function() {
  var FabGrid = createFabGridFactory({});
  var originalDocument = globalThis.document;
  var added = [];
  var removed = [];
  var grid = Object.create(FabGrid.prototype);

  globalThis.document = {
    addEventListener: function(name, handler) { added.push([name, handler]); },
    removeEventListener: function(name, handler) { removed.push([name, handler]); }
  };
  try {
    grid._boundPointerMove = function() {};
    grid._boundPointerUp = function() {};
    grid._boundVerticalScrollbarPointerMove = function() {};
    grid._boundVerticalScrollbarPointerUp = function() {};
    grid._boundHorizontalScrollbarPointerMove = function() {};
    grid._boundHorizontalScrollbarPointerUp = function() {};
    grid.pointerInteractionEventsBound = false;
    grid.verticalScrollbarDragEventsBound = false;
    grid.horizontalScrollbarDragEventsBound = false;

    grid.bindPointerInteractionEvents();
    grid.bindPointerInteractionEvents();
    grid.bindVerticalScrollbarDragEvents();
    grid.bindVerticalScrollbarDragEvents();
    grid.bindHorizontalScrollbarDragEvents();
    grid.bindHorizontalScrollbarDragEvents();
    assert.equal(added.length, 9);

    grid.unbindPointerInteractionEvents();
    grid.unbindVerticalScrollbarDragEvents();
    grid.unbindHorizontalScrollbarDragEvents();
    assert.equal(removed.length, 9);
  } finally {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  }
});

test('active row highlighting is visual and keeps multi-selected rows visible', function() {
  var FabGrid = createFabGridFactory({});
  var grid = Object.create(FabGrid.prototype);

  grid.options = { multiSelectRows: false, highlightActiveRow: true };
  grid.selection = { row: 2, col: 0 };
  grid.rowSelection = 2;
  grid.selectedRowMap = {};

  assert.equal(grid.shouldHighlightRow(2), true);
  grid.options.highlightActiveRow = false;
  assert.equal(grid.shouldHighlightRow(2), false);

  grid.options.selectionMode = 'CellRange';
  grid.options.highlightActiveRow = true;
  assert.equal(grid.shouldHighlightRow(2), false);

  grid.options.multiSelectRows = true;
  grid.selectedRowMap = { 1: true };
  assert.equal(grid.shouldHighlightRow(1), true);
  assert.equal(grid.shouldHighlightRow(2), false);
});

test('cell range copy returns a rectangular TSV and skips synthetic group rows', function() {
  var FabGrid = createFabGridFactory({});
  var group = { __fgRowType: 'group' };
  var grid = Object.create(FabGrid.prototype);

  grid.options = { selectionMode: 'CellRange' };
  grid.view = [{ a: 'A1', b: 'B1' }, group, { a: 'A2', b: 'B2' }];
  grid.visibleColumns = [{ binding: 'a' }, { binding: 'b' }];
  grid.selectionAnchor = { row: 0, col: 0 };
  grid.selection = { row: 2, col: 1 };
  grid.isRowGroup = function(item) { return item === group; };
  grid.isRowGroupFooter = function() { return false; };
  grid.getCellData = function(row, col) {
    return grid.view[row][grid.visibleColumns[col].binding];
  };

  assert.equal(grid.getSelectedText(), 'A1\tB1\nA2\tB2');
});

test('alternating row step controls grouped row banding', function() {
  var FabGrid = createFabGridFactory({});
  var descriptor = Object.getOwnPropertyDescriptor(FabGrid.prototype, 'alternatingRowStep');
  var renderCount = 0;
  var grid = {
    options: {},
    render: function() {
      renderCount += 1;
    }
  };

  assert.equal(descriptor.get.call(grid), 1);

  descriptor.set.call(grid, 2.9);
  assert.equal(grid.options.alternatingRowStep, 2);
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 7].map(function(rowIndex) {
      return FabGrid.prototype.isAlternatingRow.call(grid, rowIndex);
    }),
    [false, false, true, true, false, false, true, true]
  );

  descriptor.set.call(grid, false);
  assert.equal(grid.options.alternatingRowStep, false);
  assert.equal(FabGrid.prototype.isAlternatingRow.call(grid, 1), false);

  descriptor.set.call(grid, 0);
  assert.equal(grid.options.alternatingRowStep, false);
  assert.equal(renderCount, 3);
});

test('JSON API exports source or view rows and imports through setItemsSource', async function() {
  var FabGrid = createFabGridFactory({});
  var imported = null;
  var sourceRows = [{ id: 1 }, { id: 2 }];
  var groupRow = { __fgRowType: 'group' };
  var footerRow = { __fgRowType: 'groupFooter' };
  var grid = {
    source: sourceRows,
    view: [groupRow, sourceRows[1], footerRow],
    isRowGroup: function(row) { return row === groupRow; },
    isRowGroupFooter: function(row) { return row === footerRow; },
    setItemsSource: function(rows) { imported = rows; }
  };

  assert.equal(FabGrid.prototype.getJson.call(grid), '[{"id":1},{"id":2}]');
  assert.equal(FabGrid.prototype.getJson.call(grid, { viewOnly: true, space: 2 }), '[\n  {\n    "id": 2\n  }\n]');
  assert.equal(await FabGrid.prototype.importJson.call(grid, '{"rows":[{"id":9}]}'), true);
  assert.deepEqual(imported, [{ id: 9 }]);
  await assert.rejects(FabGrid.prototype.importJson.call(grid, '{"id":9}'), /must be an array/);
});

test('frozen divider decorates only actual boundary cells', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    frozenColumns: 2,
    scrollableColumnEnd: 6,
    frozenRightWidth: 120
  };
  var leftCell = { className: 'fg-cell' };
  var scrollCell = { className: 'fg-cell' };
  var rightCell = { className: 'fg-cell' };
  var normalCell = { className: 'fg-cell' };

  FabGrid.prototype.decorateFrozenDividerCell.call(grid, leftCell, 1, 'left');
  FabGrid.prototype.decorateFrozenDividerCell.call(grid, scrollCell, 5, 'scroll');
  FabGrid.prototype.decorateFrozenDividerCell.call(grid, rightCell, 6, 'right');
  FabGrid.prototype.decorateFrozenDividerCell.call(grid, normalCell, 4, 'scroll');

  assert.match(leftCell.className, /fg-frozen-divider-left/);
  assert.match(scrollCell.className, /fg-frozen-divider-right-neighbor/);
  assert.match(rightCell.className, /fg-frozen-divider-right/);
  assert.equal(normalCell.className, 'fg-cell');
});

test('grid popup opens from the column header row only', function() {
  var FabGrid = createFabGridFactory({});
  var shown = [];
  var hidden = 0;
  var prevented = 0;
  var stopped = 0;
  var grid = {
    hideTopLeftMenu: function() { hidden += 1; },
    showTopLeftMenu: function(x, y) { shown.push([x, y]); }
  };
  var headerTitle = { nodeType: 1, className: 'fg-header-title', parentNode: null };
  var headerLabel = { nodeType: 1, className: 'fg-header-label', parentNode: headerTitle };
  var rowHeader = { nodeType: 1, className: 'fg-row-header-top', parentNode: null };

  FabGrid.prototype.handleContextMenu.call(grid, {
    target: headerLabel,
    clientX: 120,
    clientY: 36,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });
  FabGrid.prototype.handleContextMenu.call(grid, {
    target: rowHeader,
    clientX: 12,
    clientY: 36
  });

  assert.deepEqual(shown, [[120, 36]]);
  assert.equal(hidden, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test('TreeGrid popup opens from every tree column data cell', function() {
  var FabGrid = createFabGridFactory({});
  var treeColumn = { binding: 'name' };
  var shown = [];
  var prevented = 0;
  var stopped = 0;
  var cell = {
    nodeType: 1,
    className: 'fg-cell fg-tree-cell',
    parentNode: null,
    getAttribute: function(name) {
      if (name === 'data-row' || name === 'data-col') {
        return '0';
      }
      return null;
    }
  };
  var content = {
    nodeType: 1,
    className: 'fg-tree-cell-content',
    parentNode: cell
  };
  var grid = {
    options: { childItemsPath: 'children', treeColumn: 0 },
    columns: [treeColumn],
    visibleColumns: [treeColumn],
    _treeRowInfos: [{ item: { name: 'Leaf' }, hasChildren: false, collapsed: false }],
    getTreeColumnIndex: FabGrid.prototype.getTreeColumnIndex,
    getTreeRowInfo: FabGrid.prototype.getTreeRowInfo,
    handleTreeContextMenu: FabGrid.prototype.handleTreeContextMenu,
    hideTopLeftMenu: function() {},
    showTopLeftMenu: function(x, y, mode) {
      shown.push([x, y, mode]);
    }
  };

  FabGrid.prototype.handleContextMenu.call(grid, {
    target: content,
    clientX: 80,
    clientY: 120,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });

  assert.deepEqual(shown, [[80, 120, 'tree']]);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test('TreeGrid context menu exposes one bulk toggle action', function() {
  var FabGrid = createFabGridFactory({});
  var info = { item: { name: 'Parent' }, hasChildren: true, collapsed: false };
  var collapsed = 0;
  var expanded = 0;
  var emitted = [];
  var grid = {
    view: [info.item],
    _treeRowInfos: [info],
    getTreeRowInfo: FabGrid.prototype.getTreeRowInfo,
    hasExpandedTreeNode: FabGrid.prototype.hasExpandedTreeNode,
    getText: function(path) {
      return path === 'tree.collapseAll' ? '全部疊合' : '全部展開';
    },
    collapseGroupsToLevel: function(level) {
      collapsed += level === 0 ? 1 : 100;
    },
    expandAllTreeNodes: function() {
      expanded += 1;
    },
    emit: function(name, args) {
      emitted.push([name, args.collapsed]);
    }
  };

  assert.deepEqual(FabGrid.prototype.getTreeContextMenuItem.call(grid), {
    action: 'tree-collapse-all',
    icon: '▸',
    label: '全部疊合'
  });
  assert.equal(FabGrid.prototype.handleTreeContextMenuAction.call(grid, 'tree-collapse-all'), true);

  info.collapsed = true;
  assert.deepEqual(FabGrid.prototype.getTreeContextMenuItem.call(grid), {
    action: 'tree-expand-all',
    icon: '▾',
    label: '全部展開'
  });
  assert.equal(FabGrid.prototype.handleTreeContextMenuAction.call(grid, 'tree-expand-all'), true);
  assert.equal(FabGrid.prototype.handleTreeContextMenuAction.call(grid, 'unknown'), false);
  assert.equal(collapsed, 1);
  assert.equal(expanded, 1);
  assert.deepEqual(emitted, [
    ['treeContextMenuAction', true],
    ['treeContextMenuAction', false]
  ]);
});

test('filter icon click opens its menu without sorting the column', function() {
  var FabGrid = createFabGridFactory({});
  var menuCalls = 0;
  var sortCalls = 0;
  var prevented = 0;
  var stopped = 0;
  var header = {
    nodeType: 1,
    className: 'fg-header-cell',
    parentNode: null,
    getAttribute: function(name) {
      return name === 'data-col' ? '2' : null;
    }
  };
  var filterIcon = {
    nodeType: 1,
    className: 'fg-filter-icon',
    parentNode: header,
    getAttribute: function(name) {
      return name === 'data-col' ? '2' : null;
    }
  };
  var grid = {
    busy: false,
    fixedPaneTouchClickUntil: 0,
    suppressClick: false,
    options: { allowSorting: true },
    showFilterMenu: function(colIndex, anchor) {
      menuCalls += colIndex === 2 && anchor === filterIcon ? 1 : 100;
    },
    toggleSort: function() {
      sortCalls += 1;
    }
  };

  FabGrid.prototype.handleClick.call(grid, {
    target: filterIcon,
    shiftKey: false,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });

  assert.equal(menuCalls, 1);
  assert.equal(sortCalls, 0);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test('merged Header group click does not sort a leaf column', function() {
  var FabGrid = createFabGridFactory({});
  var sortCalls = 0;
  var focusCalls = 0;
  var header = {
    nodeType: 1,
    className: 'fg-header-cell fg-header-group-cell',
    classList: {
      contains: function(name) {
        return name === 'fg-header-cell' || name === 'fg-header-group-cell';
      }
    },
    parentNode: null,
    getAttribute: function() {
      return null;
    }
  };
  var grid = {
    busy: false,
    fixedPaneTouchClickUntil: 0,
    suppressClick: false,
    options: { allowSorting: true },
    root: {
      focus: function() {
        focusCalls += 1;
      }
    },
    toggleSort: function() {
      sortCalls += 1;
    }
  };

  FabGrid.prototype.handleClick.call(grid, {
    target: header,
    shiftKey: false,
    preventDefault: function() {},
    stopPropagation: function() {}
  });

  assert.equal(sortCalls, 0);
  assert.equal(focusCalls, 1);
});

test('column drag cannot cross an immediate Header group boundary', function() {
  var FabGrid = createFabGridFactory({});
  var firstGroup = {};
  var secondGroup = {};
  var appliedTarget = 'unchanged';
  var grid = {
    columnDragState: {
      active: true,
      pointerId: 1,
      column: { _headerParent: firstGroup },
      sourceIndex: 0,
      target: null
    },
    updateColumnDragPreview: function() {},
    getColumnDragTarget: function() {
      return {
        column: { _headerParent: secondGroup },
        beforeColumn: null,
        position: 'after'
      };
    },
    isColumnDragMoveNeeded: function() {
      return true;
    },
    setColumnDragTarget: function(target) {
      appliedTarget = target;
    }
  };

  FabGrid.prototype.updateColumnDrag.call(grid, {
    pointerId: 1,
    clientX: 20,
    clientY: 20,
    preventDefault: function() {}
  });

  assert.equal(grid.columnDragState.target, null);
  assert.equal(appliedTarget, null);
});

test('column drag synchronizes full indexes and keeps Footer values with their columns', function() {
  var FabGrid = createFabGridFactory({});
  var first = { binding: 'first', _index: 0 };
  var second = { binding: 'second', _index: 1 };
  var third = { binding: 'third', _index: 2 };
  var grid = Object.create(FabGrid.prototype);

  grid.columns = [first, second, third];
  grid.visibleColumns = grid.columns.slice();
  grid.selection = { row: 0, col: 0 };
  grid.selectionAnchor = { row: 0, col: 0 };
  grid._footerCellValues = [{ 0: 'First footer', 2: 'Third footer' }];
  grid.updateLayout = function() {
    this.visibleColumns = this.columns.slice();
    return true;
  };
  grid.render = function() {};

  assert.equal(grid.moveColumnBefore(first, null), true);
  assert.deepEqual(grid.columns, [second, third, first]);
  assert.deepEqual(grid.columns.map(function(column) { return column._index; }), [0, 1, 2]);
  assert.deepEqual(grid._footerCellValues, [{ 1: 'Third footer', 2: 'First footer' }]);
});

test('header sort reveals a partially covered scrollable column beside frozen columns', function() {
  var FabGrid = createFabGridFactory({});
  var sortCalls = [];
  var renderCount = 0;
  var header = {
    nodeType: 1,
    className: 'fg-header-cell',
    parentNode: null,
    getAttribute: function(name) {
      return name === 'data-col' ? '1' : null;
    }
  };
  var grid = {
    busy: false,
    fixedPaneTouchClickUntil: 0,
    suppressClick: false,
    options: { allowSorting: true },
    visibleColumns: [
      { _left: 0, _width: 120, allowSorting: true },
      { _left: 120, _width: 100, allowSorting: true }
    ],
    bodyScroll: {
      clientWidth: 300,
      scrollLeft: 45
    },
    frozenColumns: 1,
    frozenWidth: 120,
    frozenRightWidth: 0,
    scrollableColumnEnd: 2,
    getFixedLeftWidth: function() {
      return 0;
    },
    _toggleVisibleSort: function(colIndex, multiSort) {
      sortCalls.push([colIndex, multiSort]);
    },
    render: function() {
      renderCount += 1;
    }
  };

  FabGrid.prototype.handleClick.call(grid, {
    target: header,
    shiftKey: false,
    preventDefault: function() {},
    stopPropagation: function() {}
  });

  assert.deepEqual(sortCalls, [[1, false]]);
  assert.equal(grid.bodyScroll.scrollLeft, 0);
  assert.equal(renderCount, 1);
});

test('header sort preserves horizontal scroll when the column is already fully visible', function() {
  var FabGrid = createFabGridFactory({});
  var header = {
    nodeType: 1,
    className: 'fg-header-cell',
    parentNode: null,
    getAttribute: function(name) {
      return name === 'data-col' ? '2' : null;
    }
  };
  var grid = {
    busy: false,
    fixedPaneTouchClickUntil: 0,
    suppressClick: false,
    options: { allowSorting: true },
    visibleColumns: [
      { _left: 0, _width: 120, allowSorting: true },
      { _left: 120, _width: 80, allowSorting: true },
      { _left: 200, _width: 100, allowSorting: true }
    ],
    bodyScroll: {
      clientWidth: 300,
      scrollLeft: 60
    },
    frozenColumns: 1,
    frozenWidth: 120,
    frozenRightWidth: 0,
    scrollableColumnEnd: 3,
    getFixedLeftWidth: function() {
      return 0;
    },
    _toggleVisibleSort: function() {},
    render: function() {
      assert.fail('a fully visible Header must not trigger an extra render');
    }
  };

  FabGrid.prototype.handleClick.call(grid, {
    target: header,
    shiftKey: false,
    preventDefault: function() {},
    stopPropagation: function() {}
  });

  assert.equal(grid.bodyScroll.scrollLeft, 60);
});

test('Grid context menu follows filter and row header menu options', function() {
  var FabGrid = createFabGridFactory({});
  var originalDocument = globalThis.document;

  function createNode(tagName) {
    return {
      tagName: tagName,
      children: [],
      attributes: {},
      appendChild: function(child) {
        this.children.push(child);
        return child;
      },
      setAttribute: function(name, value) {
        this.attributes[name] = String(value);
      }
    };
  }

  function renderActions(filterMode, showRowHeaderMenu, showFullscreenMenu) {
    var menu = createNode('div');
    var grid = {
      options: {
        filterMode: filterMode,
        showRowHeaders: true,
        showRowHeaderMenu: showRowHeaderMenu,
        showFullscreenMenu: showFullscreenMenu
      },
      topLeftMenu: menu,
      getText: function(key) {
        return key;
      },
      isFullscreen: function() {
        return false;
      },
      isFullscreenAvailable: function() {
        return true;
      }
    };
    var actions = [];

    FabGrid.prototype.renderTopLeftMenu.call(grid);
    function collect(node) {
      if (node.attributes && node.attributes['data-action']) {
        actions.push(node.attributes['data-action']);
      }
      (node.children || []).forEach(collect);
    }
    collect(menu);
    return actions;
  }

  globalThis.document = {
    createDocumentFragment: function() {
      return createNode('fragment');
    },
    createElement: function(tagName) {
      return createNode(tagName);
    }
  };

  try {
    assert.equal(renderActions(false, true, false).includes('clear-filter'), false);
    assert.equal(renderActions(['excel'], true, false).includes('clear-filter'), true);
    assert.equal(renderActions(false, false, false).includes('row-headers-menu'), false);
    assert.equal(renderActions(false, false, false).includes('export-excel'), true);
    assert.equal(renderActions(false, false, false).includes('export-csv'), true);
    assert.equal(renderActions(false, false, false).includes('fullscreen'), false);
    assert.equal(renderActions(false, false, true).includes('fullscreen'), true);
  } finally {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }
  }
});

test('escape closes the Excel-like filter popup without applying its draft', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = 0;
  var prevented = 0;
  var stopped = 0;
  var draft = { selectedKeys: { TW: false } };
  var grid = {
    selection: { row: 0, col: 0 },
    busy: false,
    editing: null,
    excelFilterDraft: draft,
    filterMenu: { style: { display: 'block' } },
    hideFilterMenu: function() {
      hidden += 1;
    },
    isFilterMenuOpen: FabGrid.prototype.isFilterMenuOpen
  };
  var popupSearch = {
    nodeType: 1,
    tagName: 'INPUT',
    className: 'fg-excel-filter-search',
    parentNode: null
  };

  FabGrid.prototype.handleKeyDown.call(grid, {
    key: 'Escape',
    target: popupSearch,
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });

  assert.equal(hidden, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
  assert.equal(grid.excelFilterDraft, draft);
});

test('escape closes the shared Grid context menu', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = 0;
  var prevented = 0;
  var stopped = 0;
  var grid = {
    selection: { row: 0, col: 0 },
    busy: false,
    editing: null,
    isFilterMenuOpen: function() { return false; },
    isTopLeftMenuOpen: function() { return true; },
    hideTopLeftMenu: function() { hidden += 1; }
  };

  FabGrid.prototype.handleKeyDown.call(grid, {
    key: 'Escape',
    target: { nodeType: 1, tagName: 'DIV', className: 'fg-cell', parentNode: null },
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });

  assert.equal(hidden, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test('escape closes the column chooser popup', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = 0;
  var prevented = 0;
  var stopped = 0;
  var grid = {
    selection: { row: 0, col: 0 },
    busy: false,
    editing: null,
    isFilterMenuOpen: function() { return false; },
    isTopLeftMenuOpen: function() { return false; },
    isColumnChooserOpen: function() { return true; },
    hideColumnChooser: function() { hidden += 1; }
  };

  FabGrid.prototype.handleKeyDown.call(grid, {
    key: 'Escape',
    target: { nodeType: 1, tagName: 'BUTTON', className: 'fg-column-chooser-trigger', parentNode: null },
    preventDefault: function() { prevented += 1; },
    stopPropagation: function() { stopped += 1; }
  });

  assert.equal(hidden, 1);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test('pointer outside closes the column chooser but pointer inside keeps it open', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = 0;
  var open = true;
  var grid = {
    isColumnChooserOpen: function() { return open; },
    hideColumnChooser: function() {
      hidden += 1;
      open = false;
    },
    getFilterMenuItemAtEvent: function() { return null; }
  };
  var chooser = { nodeType: 1, className: 'fg-column-chooser', parentNode: null };
  var inside = { nodeType: 1, className: 'fg-column-chooser-check', parentNode: chooser };
  var outside = { nodeType: 1, className: 'outside', parentNode: null };

  grid.isTopLeftMenuOpen = function() { return false; };
  grid.isFilterMenuOpen = function() { return false; };
  FabGrid.prototype.handleFilterMenuClick.call(grid, { target: inside });
  assert.equal(hidden, 0);

  FabGrid.prototype.handleFilterMenuClick.call(grid, { target: outside });
  assert.equal(hidden, 1);
});

test('pointer outside closes every open Grid menu', function() {
  var FabGrid = createFabGridFactory({});
  var hidden = {
    topLeft: 0,
    filter: 0,
    chooser: 0
  };
  var grid = {
    isTopLeftMenuOpen: function() { return true; },
    hideTopLeftMenu: function() { hidden.topLeft += 1; },
    isFilterMenuOpen: function() { return true; },
    hideFilterMenu: function() { hidden.filter += 1; },
    isColumnChooserOpen: function() { return true; },
    hideColumnChooser: function() { hidden.chooser += 1; },
    getFilterMenuItemAtEvent: function() { return null; }
  };
  var outside = { nodeType: 1, className: 'outside', parentNode: null };

  FabGrid.prototype.handleFilterMenuClick.call(grid, { target: outside });

  assert.deepEqual(hidden, {
    topLeft: 1,
    filter: 1,
    chooser: 1
  });
});

test('Grid document pointer listener exists only while a Grid popup is open', function() {
  var FabGrid = createFabGridFactory({});
  var originalDocument = globalThis.document;
  var added = [];
  var removed = [];
  var handler = function() {};
  var open = false;
  var grid = {
    disposed: false,
    popupDocumentEventsBound: false,
    _boundFilterMenuClick: handler,
    isTopLeftMenuOpen: function() { return open; },
    isFilterMenuOpen: function() { return false; },
    isColumnChooserOpen: function() { return false; }
  };
  grid.bindPopupDocumentEvents = function() {
    FabGrid.prototype.bindPopupDocumentEvents.call(grid);
  };
  grid.unbindPopupDocumentEvents = function() {
    FabGrid.prototype.unbindPopupDocumentEvents.call(grid);
  };

  globalThis.document = {
    addEventListener: function(name, callback, capture) {
      added.push([name, callback, capture]);
    },
    removeEventListener: function(name, callback, capture) {
      removed.push([name, callback, capture]);
    }
  };
  try {
    FabGrid.prototype.syncPopupDocumentEvents.call(grid);
    assert.equal(added.length, 0);

    open = true;
    FabGrid.prototype.syncPopupDocumentEvents.call(grid);
    FabGrid.prototype.syncPopupDocumentEvents.call(grid);
    assert.deepEqual(added, [['pointerdown', handler, true]]);

    open = false;
    FabGrid.prototype.syncPopupDocumentEvents.call(grid);
    assert.deepEqual(removed, [['pointerdown', handler, true]]);
    assert.equal(grid.popupDocumentEventsBound, false);
  } finally {
    globalThis.document = originalDocument;
  }
});

test('Excel-like filter popup moves to the page layer and restores to the Grid on close', function() {
  var FabGrid = createFabGridFactory({});
  var originalDocument = globalThis.document;
  var originalWindow = globalThis.window;
  var added = [];
  var removed = [];
  var root;
  var body;
  var menu;
  var grid;

  function createParent() {
    return {
      appendChild: function(node) {
        node.parentNode = this;
      }
    };
  }

  root = createParent();
  root.contains = function(node) {
    return node === root || node === menu;
  };
  body = createParent();
  menu = {
    parentNode: root,
    className: 'fg-filter-menu fg-excel-filter-menu'
  };
  grid = {
    disposed: false,
    root: root,
    filterMenu: menu,
    filterMenuViewportEventsBound: false,
    _boundFilterMenuViewportChange: function() {}
  };
  grid.bindFilterMenuViewportEvents = function() {
    FabGrid.prototype.bindFilterMenuViewportEvents.call(grid);
  };
  grid.unbindFilterMenuViewportEvents = function() {
    FabGrid.prototype.unbindFilterMenuViewportEvents.call(grid);
  };
  grid.getFilterMenuPortalTarget = function() {
    return FabGrid.prototype.getFilterMenuPortalTarget.call(grid);
  };

  globalThis.document = {
    body: body,
    fullscreenElement: null,
    webkitFullscreenElement: null
  };
  globalThis.window = {
    addEventListener: function(name, handler, capture) {
      added.push([name, handler, capture]);
    },
    removeEventListener: function(name, handler, capture) {
      removed.push([name, handler, capture]);
    }
  };

  try {
    FabGrid.prototype.portalExcelFilterMenu.call(grid);
    assert.equal(menu.parentNode, body);
    assert.deepEqual(added.map(function(item) {
      return [item[0], item[2]];
    }), [
      ['resize', undefined],
      ['scroll', true]
    ]);

    FabGrid.prototype.restoreFilterMenu.call(grid);
    assert.equal(menu.parentNode, root);
    assert.deepEqual(removed.map(function(item) {
      return [item[0], item[2]];
    }), [
      ['resize', undefined],
      ['scroll', true]
    ]);
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  }
});

test('Excel-like filter popup height is constrained by the viewport instead of the Grid', function() {
  var FabGrid = createFabGridFactory({});
  var originalDocument = globalThis.document;
  var originalWindow = globalThis.window;
  var header = createFakeElement('fg-header-cell', {}, {
    left: 80,
    top: 120,
    right: 220,
    bottom: 160,
    width: 140,
    height: 40
  });
  var anchor = createFakeElement('fg-filter-icon', {}, {
    left: 190,
    top: 130,
    right: 218,
    bottom: 158,
    width: 28,
    height: 28
  });
  var menu = {
    style: { display: 'block' },
    className: 'fg-filter-menu fg-excel-filter-menu',
    offsetWidth: 322,
    offsetHeight: 240,
    querySelector: function(selector) {
      if (selector === '.fg-excel-filter-value-list') {
        return {
          offsetHeight: 151,
          scrollHeight: 500
        };
      }
      return null;
    }
  };
  var grid = {
    root: {
      getBoundingClientRect: function() {
        return {
          left: 0,
          top: 100,
          right: 700,
          bottom: 300,
          width: 700,
          height: 200
        };
      }
    },
    filterMenu: menu
  };
  header.className = 'fg-header-cell';
  anchor.className = 'fg-filter-icon';
  anchor.parentNode = header;

  globalThis.document = {
    documentElement: {
      clientWidth: 1000,
      clientHeight: 800
    }
  };
  globalThis.window = {
    innerWidth: 1000,
    innerHeight: 800
  };

  try {
    FabGrid.prototype.positionFilterMenu.call(grid, anchor);
    assert.equal(menu.style.left, '80px');
    assert.equal(menu.style.top, '160px');
    assert.equal(menu.style.height, '589px');
    assert.ok(parseInt(menu.style.top, 10) + parseInt(menu.style.height, 10) > 300);
  } finally {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  }
});

test('Excel-like filter popup CSS uses fixed viewport positioning', function() {
  var css = readFileSync(new URL('../src/grid/fabgrid.css', import.meta.url), 'utf8');
  var rule = css.match(/:root \.fg-excel-filter-menu\s*\{([^}]+)\}/);
  assert.ok(rule);
  assert.match(rule[1], /position:\s*fixed/);
  assert.match(rule[1], /max-width:\s*calc\(100vw - 16px\)/);
});

test('document pointer leaves shared combo and color popup lifecycle to popup classes', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    isTopLeftMenuOpen: function() { return false; },
    getFilterMenuItemAtEvent: function() { return null; },
    filterMenu: { style: { display: 'none' } },
    isColumnChooserOpen: function() { return false; },
    editor: { nodeType: 1, className: 'fg-editor', parentNode: null },
    editing: null
  };
  var outside = { nodeType: 1, className: 'outside', parentNode: null };
  assert.doesNotThrow(function() {
    FabGrid.prototype.handleDocumentMouseDown.call(grid, { target: outside });
  });
});

test('filter changed is exposed as a Wijmo-compatible event', function() {
  var FabGrid = createFabGridFactory({});
  var grid = { wijmoEvents: {} };

  FabGrid.prototype.createWijmoEvents.call(grid);

  assert.equal(typeof grid.filterChanged.addHandler, 'function');
  assert.equal(grid.wijmoEvents.filterChanged, grid.filterChanged);
});

test('constructor filter rules initialize Search Row values and operators', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'status', header: 'Status', dataType: 'string' },
    { binding: 'amount', header: 'Amount', dataType: 'number' }
  ];
  var grid = {
    options: {
      remote: false,
      filterMode: ['excel', 'searchRow'],
      filterRules: JSON.stringify([
        { field: 'status', op: 'eq', value: '草稿' },
        { field: 'amount', op: 'gte', value: 1000 },
        { field: 'serverOnly', op: 'eq', value: '保留' },
        { field: 'status', op: 'invalid', value: 'ignored' }
      ])
    },
    columns: columns,
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    getColumn: function(value) {
      return columns.find(function(column) {
        return column.binding === value;
      }) || null;
    }
  };

  var applied = FabGrid.prototype.applyInitialFilterRules.call(grid, grid.options.filterRules);

  assert.deepEqual(applied, [
    { field: 'status', op: 'eq', value: '草稿' },
    { field: 'amount', op: 'gte', value: '1000' }
  ]);
  assert.deepEqual(grid.options.filterMode, ['searchRow', 'excel']);
  assert.equal(grid.hasColumnSearch, true);
  assert.deepEqual(grid.columnSearchValues, {
    'binding:status': '草稿',
    'binding:amount': '1000'
  });
  assert.deepEqual(grid.columnSearchOperators, {
    'binding:status': 'eq',
    'binding:amount': 'gte'
  });
  assert.deepEqual(grid.options.filterRules, [
    { field: 'status', op: 'eq', value: '草稿' },
    { field: 'amount', op: 'gte', value: '1000' },
    { field: 'serverOnly', op: 'eq', value: '保留' }
  ]);
  assert.equal(FabGrid.prototype.getColumnSearchValue.call(grid, columns[0]), '草稿');
  assert.equal(FabGrid.prototype.getColumnSearchOperator.call(grid, columns[1]), 'gte');
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: JSON.stringify([
      { field: 'status', op: 'eq', value: '草稿' },
      { field: 'amount', op: 'gte', value: '1000' },
      { field: 'serverOnly', op: 'eq', value: '保留' }
    ])
  });
});

test('remote constructor filter rules preserve custom operators', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'contains', dataType: 'string' },
    { binding: 'starts', dataType: 'string' },
    { binding: 'ends', dataType: 'string' },
    { binding: 'notContains', dataType: 'string' },
    { binding: 'notStarts', dataType: 'string' },
    { binding: 'notEnds', dataType: 'string' }
  ];
  var grid = {
    options: {
      remote: true,
      filterMode: ['excel', 'searchRow'],
      filterRules: [
        { field: 'ignored', op: '%..%', value: '' },
        { field: 'contains', op: '%..%', value: 'A' },
        { field: 'starts', op: '..%', value: 'B' },
        { field: 'ends', op: '%..', value: 'C' },
        { field: 'notContains', op: '!%..%', value: 'D' },
        { field: 'notStarts', op: '!..%', value: 'E' },
        { field: 'notEnds', op: '!%..', value: 'F' },
        { field: 'serverOnly', op: '<>', value: 'S' }
      ]
    },
    columns: columns,
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    searchText: '',
    getColumn: function(value) {
      return columns.find(function(column) {
        return column.binding === value;
      }) || null;
    }
  };

  var applied = FabGrid.prototype.applyInitialFilterRules.call(grid, grid.options.filterRules);

  assert.deepEqual(applied, [
    { field: 'contains', op: '%..%', value: 'A' },
    { field: 'starts', op: '..%', value: 'B' },
    { field: 'ends', op: '%..', value: 'C' },
    { field: 'notContains', op: '!%..%', value: 'D' },
    { field: 'notStarts', op: '!..%', value: 'E' },
    { field: 'notEnds', op: '!%..', value: 'F' }
  ]);
  assert.deepEqual(grid.options.filterMode, ['searchRow', 'excel']);
  assert.deepEqual(grid.columnSearchValues, {
    'binding:contains': 'A',
    'binding:starts': 'B',
    'binding:ends': 'C',
    'binding:notContains': 'D',
    'binding:notStarts': 'E',
    'binding:notEnds': 'F'
  });
  assert.deepEqual(grid.columnSearchOperators, {
    'binding:contains': 'contains',
    'binding:starts': 'starts',
    'binding:ends': 'ends',
    'binding:notContains': 'not-contains',
    'binding:notStarts': 'not-starts',
    'binding:notEnds': 'not-ends'
  });
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: JSON.stringify([
      { field: 'contains', op: '%..%', value: 'A' },
      { field: 'starts', op: '..%', value: 'B' },
      { field: 'ends', op: '%..', value: 'C' },
      { field: 'notContains', op: '!%..%', value: 'D' },
      { field: 'notStarts', op: '!..%', value: 'E' },
      { field: 'notEnds', op: '!%..', value: 'F' },
      { field: 'serverOnly', op: '<>', value: 'S' }
    ])
  });
});

test('remote comparison symbols map to Search Row operators without changing request operators', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'gte', dataType: 'number' },
    { binding: 'gt', dataType: 'number' },
    { binding: 'lte', dataType: 'number' },
    { binding: 'lt', dataType: 'number' },
    { binding: 'ne', dataType: 'number' },
    { binding: 'eq', dataType: 'number' }
  ];
  var filterRules = [
    { field: 'gte', op: '>=', value: 60 },
    { field: 'gt', op: '>', value: 50 },
    { field: 'lte', op: '<=', value: 40 },
    { field: 'lt', op: '<', value: 30 },
    { field: 'ne', op: '<>', value: 20 },
    { field: 'eq', op: '=', value: 10 }
  ];
  var grid = {
    options: {
      remote: true,
      filterMode: ['excel', 'searchRow'],
      filterRules: filterRules
    },
    columns: columns,
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    searchText: '',
    getColumn: function(value) {
      return columns.find(function(column) {
        return column.binding === value;
      }) || null;
    }
  };

  FabGrid.prototype.applyInitialFilterRules.call(grid, grid.options.filterRules);

  assert.deepEqual(grid.columnSearchOperators, {
    'binding:gte': 'gte',
    'binding:gt': 'gt',
    'binding:lte': 'lte',
    'binding:lt': 'lt',
    'binding:ne': 'ne',
    'binding:eq': 'eq'
  });
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: JSON.stringify(filterRules.map(function(rule) {
      return {
        field: rule.field,
        op: rule.op,
        value: String(rule.value)
      };
    }))
  });
});

test('remote requests serialize standard operator names as compatibility symbols', function() {
  var FabGrid = createFabGridFactory({});
  var definitions = [
    ['starts', '..%'],
    ['contains', '%..%'],
    ['ends', '%..'],
    ['not-starts', '!..%'],
    ['not-contains', '!%..%'],
    ['not-ends', '!%..'],
    ['gte', '>='],
    ['gt', '>'],
    ['lte', '<='],
    ['lt', '<'],
    ['ne', '<>'],
    ['eq', '=']
  ];
  var columns = definitions.map(function(definition, index) {
    return {
      binding: 'field' + index,
      dataType: index >= 6 ? 'number' : 'string'
    };
  });
  var configuredRules = definitions.map(function(definition, index) {
    return {
      field: 'field' + index,
      op: definition[0],
      value: String(index + 1)
    };
  });
  var expectedRules = definitions.map(function(definition, index) {
    return {
      field: 'field' + index,
      op: definition[1],
      value: String(index + 1)
    };
  });
  var grid = {
    options: {
      remote: true,
      filterMode: ['searchRow', 'excel'],
      filterRules: configuredRules
    },
    columns: columns,
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    searchText: '',
    getColumn: function(value) {
      return columns.find(function(column) {
        return column.binding === value;
      }) || null;
    }
  };
  grid.getRemoteFilterParams = FabGrid.prototype.getRemoteFilterParams;

  FabGrid.prototype.applyInitialFilterRules.call(grid, grid.options.filterRules);
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: JSON.stringify(expectedRules)
  });
  assert.deepEqual(FabGrid.prototype.getFilterRules.call(grid), expectedRules);

  grid.options.filterRules = [];
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: JSON.stringify(expectedRules)
  });
});

test('remote empty numeric filter rules keep operators visible without filtering', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'orgamt', dataType: 'number' },
    { binding: 'orgtax', dataType: 'number' }
  ];
  var grid = {
    options: {
      remote: true,
      filterMode: ['excel', 'searchRow'],
      filterRules: [
        { field: 'orgamt', op: '>=', value: '' },
        { field: 'orgtax', op: '>', value: '' }
      ]
    },
    columns: columns,
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    searchText: '',
    getColumn: function(value) {
      return columns.find(function(column) {
        return column.binding === value;
      }) || null;
    }
  };

  var applied = FabGrid.prototype.applyInitialFilterRules.call(grid, grid.options.filterRules);

  assert.deepEqual(applied, []);
  assert.deepEqual(grid.options.filterMode, ['searchRow', 'excel']);
  assert.equal(grid.hasColumnSearch, false);
  assert.deepEqual(grid.columnSearchValues, {});
  assert.deepEqual(grid.columnSearchOperators, {
    'binding:orgamt': 'gte',
    'binding:orgtax': 'gt'
  });
  assert.deepEqual(grid.options.filterRules, [
    { field: 'orgamt', op: '>=', value: '' },
    { field: 'orgtax', op: '>', value: '' }
  ]);
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: undefined
  });

  grid.columnSearchValues['binding:orgamt'] = '   ';
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: undefined
  });

  grid.columnSearchValues['binding:orgamt'] = '100';
  grid.hasColumnSearch = true;
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: '[{"field":"orgamt","op":">=","value":"100"}]'
  });

  delete grid.columnSearchValues['binding:orgamt'];
  grid.columnSearchValues['binding:orgtax'] = '20';
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: '[{"field":"orgtax","op":">","value":"20"}]'
  });
});

test('remote in filter rules serialize array values as comma-separated text', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'facno', dataType: 'string' }
  ];
  var grid = {
    options: {
      remote: true,
      filterMode: ['excel', 'searchRow'],
      filterRules: [
        { field: 'facno', op: 'iN', value: ['ZU001', 'AV001'] }
      ]
    },
    columns: columns,
    columnSearchValues: {},
    columnSearchOperators: {},
    excelFilters: {},
    hasColumnSearch: false,
    searchText: '',
    getColumn: function(value) {
      return columns.find(function(column) {
        return column.binding === value;
      }) || null;
    }
  };

  FabGrid.prototype.applyInitialFilterRules.call(grid, grid.options.filterRules);
  assert.deepEqual(grid.options.filterRules, [
    { field: 'facno', op: 'iN', value: 'ZU001,AV001' }
  ]);
  assert.deepEqual(grid.columnSearchValues, {
    'binding:facno': 'ZU001,AV001'
  });
  assert.deepEqual(grid.columnSearchOperators, {
    'binding:facno': 'in'
  });
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: '[{"field":"facno","op":"iN","value":"ZU001,AV001"}]'
  });

  grid.options.filterMode = ['excel', 'searchRow'];
  grid.options.filterRules = [];
  grid.columnSearchValues = {};
  grid.excelFilters = {
    'binding:facno': { type: 'values', values: ['ZU001', 'AV001'] }
  };
  assert.deepEqual(FabGrid.prototype.getRemoteFilterParams.call(grid), {
    q: undefined,
    filterRules: '[{"field":"facno","op":"in","value":"ZU001,AV001"}]'
  });
});

test('getFilterState returns a complete independent filter snapshot', function() {
  var FabGrid = createFabGridFactory({});
  var filterPredicate = function(item) {
    return item.enabled === true;
  };
  var grid = {
    options: {
      remote: false,
      filterMode: ['searchRow', 'excel'],
      filterRules: []
    },
    columns: [{ binding: 'status' }],
    filterPredicate: filterPredicate,
    searchText: 'quick',
    columnSearchValues: {
      'binding:status': 'Approved'
    },
    columnSearchOperators: {
      'binding:status': 'eq'
    },
    excelFilters: {
      'binding:country': {
        type: 'values',
        values: ['TW']
      }
    },
    getRemoteFilterParams: FabGrid.prototype.getRemoteFilterParams,
    getFilterRules: FabGrid.prototype.getFilterRules
  };
  var state = FabGrid.prototype.getFilterState.call(grid);

  assert.equal(state.active, true);
  assert.equal(state.filterMode, 'searchRow');
  assert.equal(state.filterPredicateActive, true);
  assert.equal(state.searchText, 'quick');
  assert.deepEqual(state.filterRules, [
    { field: 'status', op: 'eq', value: 'Approved' }
  ]);
  assert.deepEqual(state.columnSearchValues, {
    'binding:status': 'Approved'
  });
  assert.deepEqual(state.columnSearchOperators, {
    'binding:status': 'eq'
  });
  assert.deepEqual(state.excelFilters, {
    'binding:country': {
      type: 'values',
      values: ['TW']
    }
  });

  state.filterRules[0].value = 'Changed';
  state.columnSearchValues['binding:status'] = 'Changed';
  state.columnSearchOperators['binding:status'] = 'contains';
  state.excelFilters['binding:country'].values.push('JP');
  assert.equal(grid.columnSearchValues['binding:status'], 'Approved');
  assert.equal(grid.columnSearchOperators['binding:status'], 'eq');
  assert.deepEqual(grid.excelFilters['binding:country'].values, ['TW']);
});

test('setFilterRules replaces runtime rules and updates Search Row state once', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'stus2', header: 'Status 2', dataType: 'string' }
  ];
  var changes = [];
  var grid = {
    options: {
      remote: true,
      filterMode: ['searchRow', 'excel'],
      filterRules: [{ field: 'old', op: 'eq', value: 'old' }]
    },
    columns: columns,
    columnSearchValues: { 'binding:stus2': 'old' },
    columnSearchOperators: { 'binding:stus2': 'eq' },
    hasColumnSearch: true,
    getColumn: function(value) {
      return columns.find(function(column) {
        return column.binding === value;
      }) || null;
    },
    cancelHeaderSearchTimer: function() {},
    hideFilterMenu: function() {},
    updateColumnSearchState: function() {
      this.hasColumnSearch = Object.keys(this.columnSearchValues).length > 0;
    },
    applyFilterChange: function(resetHorizontalScroll, source) {
      changes.push([resetHorizontalScroll, source]);
    }
  };
  grid.applyInitialFilterRules = FabGrid.prototype.applyInitialFilterRules;
  grid.getRemoteFilterParams = FabGrid.prototype.getRemoteFilterParams;

  FabGrid.prototype.setFilterRules.call(grid, [
    { field: 'stus2', op: '!%..%', value: 'I' },
    { field: 'stus3', op: '<>', value: 'S' }
  ]);

  assert.deepEqual(grid.options.filterRules, [
    { field: 'stus2', op: '!%..%', value: 'I' },
    { field: 'stus3', op: '<>', value: 'S' }
  ]);
  assert.deepEqual(grid.columnSearchValues, {
    'binding:stus2': 'I'
  });
  assert.deepEqual(grid.columnSearchOperators, {
    'binding:stus2': 'not-contains'
  });
  assert.equal(grid.hasColumnSearch, true);
  assert.deepEqual(changes, [[true, 'setFilterRules']]);

  grid.columnSearchValues['binding:stus2'] = 'Updated';
  var currentRules = FabGrid.prototype.getFilterRules.call(grid);
  assert.deepEqual(currentRules, [
    { field: 'stus2', op: '!%..%', value: 'Updated' },
    { field: 'stus3', op: '<>', value: 'S' }
  ]);
  currentRules[0].value = 'Changed outside';
  assert.equal(FabGrid.prototype.getFilterRules.call(grid)[0].value, 'Updated');

  FabGrid.prototype.setFilterRules.call(grid, []);
  assert.deepEqual(grid.options.filterRules, []);
  assert.deepEqual(grid.columnSearchValues, {});
  assert.deepEqual(grid.columnSearchOperators, {});
  assert.equal(grid.hasColumnSearch, false);
  assert.deepEqual(FabGrid.prototype.getFilterRules.call(grid), []);
  assert.deepEqual(changes, [
    [true, 'setFilterRules'],
    [true, 'setFilterRules']
  ]);
});

test('updated view can be bound from constructor options', function() {
  var FabGrid = createFabGridFactory({});
  var sender;
  var received;
  var grid = {
    wijmoEvents: {},
    options: {
      updatedView: function(value, args) {
        sender = value;
        received = args;
      }
    }
  };

  FabGrid.prototype.createWijmoEvents.call(grid);
  FabGrid.prototype.bindOptionEvent.call(grid, 'updatedView');
  grid.updatedView.raise(grid, { totalRows: 3 });

  assert.equal(sender, grid);
  assert.equal(received.grid, grid);
  assert.equal(received.type, 'updatedView');
  assert.equal(received.cancel, false);
  assert.equal(received.totalRows, 3);
});

test('selection changed can be bound from constructor options', function() {
  var FabGrid = createFabGridFactory({});
  var sender;
  var received;
  var grid = {
    events: {},
    wijmoEvents: {},
    options: {
      selectionChanged: function(value, args) {
        sender = value;
        received = args;
      }
    },
    bindOptionEvent: FabGrid.prototype.bindOptionEvent
  };

  FabGrid.prototype.createWijmoEvents.call(grid);
  FabGrid.prototype.bindOptionEvents.call(grid);
  FabGrid.prototype.emit.call(grid, 'selectionChanged', { row: 2, col: 1 });

  assert.equal(sender, grid);
  assert.equal(received.grid, grid);
  assert.equal(received.type, 'selectionChanged');
  assert.equal(received.cancel, false);
  assert.equal(received.row, 2);
  assert.equal(received.col, 1);
});

test('filter mode changes clear the previous column filter mode', function() {
  var FabGrid = createFabGridFactory({});
  var events = [];
  var applies = [];
  var grid = {
    options: { filterMode: ['excel', 'searchRow'], allowFiltering: true },
    searchText: 'quick',
    excelFilters: { country: { type: 'values', values: ['TW'] } },
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    cancelHeaderSearchTimer: function() {},
    hideFilterMenu: function() {},
    applyFilterChange: function(reset, source) {
      applies.push({ reset: reset, source: source });
    },
    emit: function(name, args) {
      events.push({ name: name, args: args });
    }
  };

  FabGrid.prototype.setFilterMode.call(grid, ['searchRow', 'excel']);
  assert.deepEqual(grid.excelFilters, {});
  assert.equal(grid.searchText, 'quick');
  assert.equal(events[0].args.clearedFilter, true);

  grid.columnSearchValues = { country: 'T' };
  grid.columnSearchOperators = { country: 'starts' };
  grid.hasColumnSearch = true;
  FabGrid.prototype.setFilterMode.call(grid, ['excel', 'searchRow']);

  assert.deepEqual(grid.columnSearchValues, {});
  assert.deepEqual(grid.columnSearchOperators, {});
  assert.equal(grid.hasColumnSearch, false);
  assert.equal(grid.searchText, 'quick');
  assert.deepEqual(applies, [
    { reset: true, source: 'filterMode' },
    { reset: true, source: 'filterMode' }
  ]);
});

test('filter mode normalizes values and exposes only the new API', function() {
  var FabGrid = createFabGridFactory({});
  var applies = [];
  var grid = {
    options: { allowFiltering: false, filterMode: false },
    excelFilters: {},
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    cancelHeaderSearchTimer: function() {},
    hideFilterMenu: function() {},
    applyFilterChange: function(reset, source) {
      applies.push({ reset: reset, source: source });
    }
  };

  assert.equal(FabGrid.prototype.setShowSearchRow, undefined);
  assert.equal(FabGrid.prototype.setFilterMode.call(grid, [
    'search-row',
    'searchRow',
    'EXCEL',
    'unknown'
  ]), true);
  assert.deepEqual(grid.options.filterMode, ['searchRow', 'excel']);
  assert.equal(grid.options.allowFiltering, true);

  var current = FabGrid.prototype.getFilterMode.call(grid);
  current.reverse();
  assert.deepEqual(grid.options.filterMode, ['searchRow', 'excel']);

  assert.equal(FabGrid.prototype.setFilterMode.call(grid, []), true);
  assert.equal(grid.options.filterMode, false);
  assert.equal(grid.options.allowFiltering, false);
  assert.deepEqual(applies, [
    { reset: true, source: 'filterMode' },
    { reset: true, source: 'filterMode' }
  ]);
});

test('filter mode uses the first entry by default and only allows switching with multiple modes', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    options: { filterMode: ['searchRow', 'excel'] }
  };

  assert.deepEqual(FabGrid.prototype.getFilterMode.call(grid), ['searchRow', 'excel']);
  assert.equal(canSwitchFilterMode(grid.options), true);
  assert.equal(canSwitchFilterMode({ filterMode: ['searchRow'] }), false);
  assert.equal(canSwitchFilterMode({ filterMode: ['excel'] }), false);
  assert.equal(canSwitchFilterMode({ filterMode: false }), false);
});

test('runtime layout normalization preserves the active filter mode', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    options: {
      filterMode: ['searchRow', 'excel'],
      frozenColumns: 0,
      frozenRightColumns: 0
    },
    columns: [],
    emit: function() {}
  };

  FabGrid.prototype.updateLayout.call(grid);

  assert.deepEqual(grid.options.filterMode, ['searchRow', 'excel']);
  assert.equal(grid.options.allowFiltering, true);

  grid.options.filterMode = false;
  FabGrid.prototype.updateLayout.call(grid);

  assert.equal(grid.options.filterMode, false);
  assert.equal(grid.options.allowFiltering, false);
});

test('filter rules are ignored when search row is not an available mode', function() {
  var FabGrid = createFabGridFactory({});
  var grid = {
    options: {
      remote: true,
      filterMode: ['excel'],
      filterRules: [{ field: 'amount', op: '>=', value: '10' }]
    },
    columns: [{ binding: 'amount', dataType: 'number' }],
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false
  };

  assert.deepEqual(
    FabGrid.prototype.applyInitialFilterRules.call(grid, grid.options.filterRules),
    []
  );
  assert.deepEqual(grid.options.filterRules, []);
  assert.deepEqual(grid.options.filterMode, ['excel']);
  assert.deepEqual(grid.columnSearchValues, {});
  assert.deepEqual(grid.columnSearchOperators, {});
});

test('allow filtering false clears both column filter modes and keeps quick search', function() {
  var FabGrid = createFabGridFactory({});
  var applies = [];
  var quickFilter = function(item) { return item.country === 'TW'; };
  var grid = {
    options: { allowFiltering: true, filterMode: ['searchRow', 'excel'] },
    searchText: 'quick',
    filterPredicate: quickFilter,
    columnSearchValues: { country: 'T' },
    columnSearchOperators: { country: 'starts' },
    hasColumnSearch: true,
    excelFilters: { country: { type: 'values', values: ['TW'] } },
    cancelHeaderSearchTimer: function() {},
    hideFilterMenu: function() {},
    applyFilterChange: function(reset, source) {
      applies.push({ reset: reset, source: source });
    }
  };

  FabGrid.prototype.setAllowFiltering.call(grid, false);

  assert.equal(grid.options.allowFiltering, false);
  assert.equal(grid.options.filterMode, false);
  assert.equal(grid.searchText, 'quick');
  assert.equal(grid.filterPredicate, quickFilter);
  assert.deepEqual(grid.columnSearchValues, {});
  assert.deepEqual(grid.columnSearchOperators, {});
  assert.equal(grid.hasColumnSearch, false);
  assert.deepEqual(grid.excelFilters, {});
  assert.deepEqual(applies, [{ reset: true, source: 'filterMode' }]);
});

test('excel value filters are applied only while search row is hidden', function() {
  var FabGrid = createFabGridFactory({});
  var columns = [
    { binding: 'country', dataType: 'string', visible: true },
    { binding: 'amount', dataType: 'number', visible: true }
  ];
  var grid = {
    options: {
      filterMode: ['excel', 'searchRow'],
      remote: false,
      pagination: false,
      rowGroups: []
    },
    source: [
      { country: 'Taiwan', amount: 10 },
      { country: 'Japan', amount: 20 },
      { country: 'Germany', amount: 30 }
    ],
    columns: columns,
    excelFilters: { 'binding:country': { type: 'values', values: ['Taiwan', 'Japan'] } },
    filterPredicate: null,
    searchText: '',
    columnSearchValues: {},
    columnSearchOperators: {},
    hasColumnSearch: false,
    getSortStates: function() { return []; },
    captureSelectionState: function() { return null; },
    isTreeGrid: function() { return false; },
    createGroupedView: function(rows) { return rows; },
    refreshInvalidItemRows: function() {},
    restoreSelectionState: function() {},
    clampSelection: function() {},
    syncEditingWithView: function() {}
  };

  FabGrid.prototype.applyView.call(grid);
  assert.deepEqual(grid.view.map(function(item) { return item.country; }), ['Taiwan', 'Japan']);

  grid.options.filterMode = ['searchRow', 'excel'];
  FabGrid.prototype.applyView.call(grid);
  assert.equal(grid.view.length, 3);
});

test('time search row compares formatted time values', function() {
  var FabGrid = createFabGridFactory(createEditorDefinitions());
  var column = { binding: 'startedAt', dataType: 'string', visible: true, editor: 'time' };
  var grid = {
    options: {
      filterMode: ['searchRow', 'excel'],
      remote: false,
      pagination: false,
      rowGroups: []
    },
    source: [
      { startedAt: '0930' },
      { startedAt: '1030' }
    ],
    columns: [column],
    excelFilters: {},
    filterPredicate: null,
    searchText: '',
    columnSearchValues: { 'binding:startedAt': '09:3' },
    columnSearchOperators: { 'binding:startedAt': 'starts' },
    hasColumnSearch: true,
    getSortStates: function() { return []; },
    captureSelectionState: function() { return null; },
    isTreeGrid: function() { return false; },
    createGroupedView: function(rows) { return rows; },
    refreshInvalidItemRows: function() {},
    restoreSelectionState: function() {},
    clampSelection: function() {},
    syncEditingWithView: function() {}
  };

  FabGrid.prototype.applyView.call(grid);
  assert.deepEqual(grid.view, [{ startedAt: '0930' }]);
});
