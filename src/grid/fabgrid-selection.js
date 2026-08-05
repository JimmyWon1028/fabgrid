export function installFabGridSelection(FabGrid, context) {
  var DEFAULT_OPTIONS = context.DEFAULT_OPTIONS;
  var clamp = context.clamp;
  var closest = context.closest;
  var findRowIndexByItem = context.findRowIndexByItem;
  var getByBinding = context.getByBinding;
  var getColumnEditorConfig = context.getColumnEditorConfig;
  var getExplicitEditorMask = context.getExplicitEditorMask;
  var getActiveFilterMode = context.getActiveFilterMode;
  var getMaskCopyText = context.getMaskCopyText;
  var getMaskDataValue = context.getMaskDataValue;
  var getMaskOptions = context.getMaskOptions;
  var getNumberCopyText = context.getNumberCopyText;
  var isHotKey = context.isHotKey;
  var isSafeBinding = context.isSafeBinding;
  var isWeakSetValue = context.isWeakSetValue;
  var parseValue = context.parseValue;
  var setByBinding = context.setByBinding;
  var toNumber = context.toNumber;
  var handledKeyboardEvents = typeof WeakSet === 'function' ? new WeakSet() : null;
  var activeKeyboardGridKey = typeof Symbol === 'function' && typeof Symbol.for === 'function' ?
    Symbol.for('fabui.FabGrid.activeKeyboardGrid') :
    '__fabuiFabGridActiveKeyboardGrid__';

  function containsNode(container, node) {
    var current = node;
    if (!container || !node) {
      return false;
    }
    if (typeof container.contains === 'function') {
      return container.contains(node);
    }
    while (current) {
      if (current === container) {
        return true;
      }
      current = current.parentNode;
    }
    return false;
  }

  function isNavigationKey(event) {
    var key = event && event.key;
    return key === 'ArrowDown' || key === 'ArrowUp' ||
      key === 'ArrowLeft' || key === 'ArrowRight' ||
      key === 'PageDown' || key === 'PageUp' ||
      key === 'Home' || key === 'End' ||
      key === 'Enter' || key === 'Tab' ||
      key === ' ' || key === 'Spacebar' ||
      (event && event.code === 'Space');
  }

  function getColumnMinWidth(grid) {
    return toNumber(grid.options.columnMinWidth, DEFAULT_OPTIONS.columnMinWidth);
  }

  function syncColumnIndexes(grid) {
    var i;
    for (i = 0; i < grid.columns.length; i += 1) {
      grid.columns[i]._index = i;
    }
  }

  function remapFooterCellValues(grid, previousColumns) {
    var rows = grid._footerCellValues;
    var values;
    var next;
    var previousIndex;
    var column;
    var currentIndex;
    var keys;
    var key;
    var r;
    var i;
    if (!Array.isArray(rows) || !rows.length) {
      return;
    }
    for (r = 0; r < rows.length; r += 1) {
      values = rows[r];
      if (!values || typeof values !== 'object') {
        continue;
      }
      next = {};
      keys = Object.keys(values);
      for (i = 0; i < keys.length; i += 1) {
        key = keys[i];
        previousIndex = /^\d+$/.test(key) ? Number(key) : -1;
        column = previousIndex >= 0 ? previousColumns[previousIndex] : null;
        currentIndex = column ? grid.columns.indexOf(column) : -1;
        if (currentIndex >= 0) {
          next[currentIndex] = values[key];
        } else if (previousIndex < 0) {
          next[key] = values[key];
        }
      }
      rows[r] = next;
    }
  }

  function canChangeRowSelection(grid, selectionArgs, rowArgs) {
    if (grid.emit('selectionChanging', Object.assign({}, selectionArgs)) === false) {
      return false;
    }
    return grid.emit('rowSelectionChanging', Object.assign({}, rowArgs)) !== false;
  }

  function raiseRowSelectionEvents(grid, selectionArgs, rowArgs) {
    grid.emit('selectionChanged', Object.assign({}, selectionArgs));
    grid.raiseRowSelectionChanged(Object.assign({}, rowArgs));
  }

  function adjustColumnScrollIntoView(grid, col) {
    var colObj = grid.visibleColumns[col];
    var scrollableViewportWidth;
    var scrollLeft;
    var nextScrollLeft;
    if (!colObj || !grid.bodyScroll ||
        col < grid.frozenColumns || col >= grid.scrollableColumnEnd) {
      return false;
    }
    scrollableViewportWidth = Math.max(
      0,
      grid.bodyScroll.clientWidth - grid.getFixedLeftWidth() - grid.frozenWidth - grid.frozenRightWidth
    );
    scrollLeft = grid.bodyScroll.scrollLeft;
    nextScrollLeft = scrollLeft;
    if (colObj._width > scrollableViewportWidth) {
      nextScrollLeft = colObj._left - grid.frozenWidth;
    } else if (colObj._left - grid.frozenWidth < scrollLeft) {
      nextScrollLeft = colObj._left - grid.frozenWidth;
    } else if (
      colObj._left + colObj._width - grid.frozenWidth >
      scrollLeft + scrollableViewportWidth
    ) {
      nextScrollLeft = colObj._left + colObj._width - grid.frozenWidth - scrollableViewportWidth;
    }
    nextScrollLeft = Math.max(0, nextScrollLeft);
    if (nextScrollLeft === scrollLeft) {
      return false;
    }
    grid.bodyScroll.scrollLeft = nextScrollLeft;
    return true;
  }

  function createCellRange(anchorRow, anchorCol, activeRow, activeCol) {
    return {
      row: Math.min(anchorRow, activeRow),
      col: Math.min(anchorCol, activeCol),
      row2: Math.max(anchorRow, activeRow),
      col2: Math.max(anchorCol, activeCol)
    };
  }

  function getFullColumnIndex(grid, viewCol) {
    var column = grid.visibleColumns && grid.visibleColumns[viewCol];
    var fullCol = grid.columns && column ? grid.columns.indexOf(column) : -1;
    if (fullCol >= 0) {
      return fullCol;
    }
    if (column && typeof column._index === 'number') {
      return column._index;
    }
    return viewCol;
  }

  function getColumnIndex(grid, value) {
    var normalized = value;
    if (typeof normalized === 'string') {
      normalized = normalized.trim();
      if (!/^\d+$/.test(normalized)) {
        return -1;
      }
    }
    normalized = Number(normalized);
    if (!isFinite(normalized) || Math.floor(normalized) !== normalized ||
        normalized < 0 || normalized >= grid.columns.length) {
      return -1;
    }
    return normalized;
  }

  function getVisibleColumnIndex(grid, fullCol) {
    var column;
    fullCol = getColumnIndex(grid, fullCol);
    if (fullCol < 0) {
      return -1;
    }
    column = grid.columns[fullCol];
    return grid.visibleColumns.indexOf(column);
  }

  FabGrid.prototype.isCellRangeSelectionMode = function() {
    return String(this.options.selectionMode || 'Cell').toLowerCase() === 'cellrange';
  };

  FabGrid.prototype.getSelectionRange = function() {
    var anchor = this.selectionAnchor || this.selection;
    return createCellRange(anchor.row, anchor.col, this.selection.row, this.selection.col);
  };

  FabGrid.prototype._getRowHeaderSelectionRange = function() {
    var selection = this._rowHeaderSelection;
    var lastCol = this.visibleColumns ? this.visibleColumns.length - 1 : -1;
    if (!selection || !this.view || !this.view.length || lastCol < 0) {
      return null;
    }
    return createCellRange(
      clamp(selection.row, 0, this.view.length - 1),
      lastCol,
      clamp(selection.row2, 0, this.view.length - 1),
      0
    );
  };

  FabGrid.prototype._getVisualSelectionRange = function() {
    return this._getRowHeaderSelectionRange() ||
      (this.isCellRangeSelectionMode() ? this.getSelectionRange() : null);
  };

  FabGrid.prototype._isRowHeaderCellSelected = function(row) {
    var range = this._getRowHeaderSelectionRange();
    return !!(range && !this.isRowGroup(this.view[row]) && !this.isRowGroupFooter(this.view[row]) &&
      row >= range.row && row <= range.row2);
  };

  FabGrid.prototype.selectCellRangeRows = function(anchorRow, activeRow) {
    var lastCol = this.visibleColumns.length - 1;
    if (!this.view.length || lastCol < 0) {
      return false;
    }
    anchorRow = clamp(anchorRow, 0, this.view.length - 1);
    activeRow = clamp(activeRow, 0, this.view.length - 1);
    return this.applyCellSelection(anchorRow, lastCol, activeRow, 0, true);
  };

  FabGrid.prototype.extendCellRangeRowSelection = function(row) {
    var anchor = this.selectionAnchor || this.selection;
    return this.selectCellRangeRows(anchor.row, row);
  };

  FabGrid.prototype.getSelectionEventArgs = function(row, col, anchorRow, anchorCol) {
    var fullCol = getFullColumnIndex(this, col);
    var fullAnchorCol = getFullColumnIndex(this, anchorCol);
    var range = createCellRange(anchorRow, fullAnchorCol, row, fullCol);
    var viewRange = createCellRange(anchorRow, anchorCol, row, col);
    return {
      row: row,
      col: fullCol,
      row2: range.row2,
      col2: range.col2,
      anchorRow: anchorRow,
      anchorCol: fullAnchorCol,
      activeRow: row,
      activeCol: fullCol,
      range: range,
      viewCol: col,
      viewCol2: viewRange.col2,
      viewAnchorCol: anchorCol,
      viewActiveCol: col,
      viewRange: viewRange,
      changedRow: null,
      selected: null,
      allRows: false
    };
  };

  FabGrid.prototype._createSelectionChangedEventArgs = function(detail) {
    var selection = this.selection || { row: -1, col: -1 };
    var anchor = this.selectionAnchor || selection;
    return Object.assign(
      this.getSelectionEventArgs(selection.row, selection.col, anchor.row, anchor.col),
      detail || {}
    );
  };

  FabGrid.prototype.captureSelectedRowChangeState = function() {
    var rowIndex = this.rowSelection;
    var hasRow = rowIndex != null && rowIndex >= 0 && rowIndex < this.view.length;
    if (hasRow && this.options.multiSelectRows === true) {
      hasRow = this.isRowSelected(rowIndex);
    }
    return {
      rowIndex: hasRow ? rowIndex : -1,
      dataItem: hasRow ? this.view[rowIndex] : null
    };
  };

  FabGrid.prototype.raiseSelectedRowChanged = function(reason, previousState, force) {
    var currentState = this.captureSelectedRowChangeState();
    var previous = previousState || this._selectedRowSnapshot || currentState;
    var changed = previous.rowIndex !== currentState.rowIndex || previous.dataItem !== currentState.dataItem;
    var row = null;
    this._selectedRowSnapshot = currentState;
    if (previous.rowIndex < 0 && currentState.rowIndex < 0) {
      return false;
    }
    if (!force && !changed) {
      return false;
    }
    if (currentState.rowIndex >= 0) {
      row = this.rows[currentState.rowIndex] || null;
    }
    this.emit('selectedRowChanged', {
      reason: reason,
      row: row,
      rowIndex: currentState.rowIndex,
      dataItem: currentState.dataItem,
      previousRowIndex: previous.rowIndex,
      previousDataItem: previous.dataItem
    });
    return true;
  };

  FabGrid.prototype.raiseRowSelectionChanged = function(args) {
    this.emit('rowSelectionChanged', args);
    this.raiseSelectedRowChanged('selection');
  };

  FabGrid.prototype.isCellInSelectionRange = function(row, col) {
    var range = this._getVisualSelectionRange();
    if (!range || this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
      return false;
    }
    return row >= range.row && row <= range.row2 && col >= range.col && col <= range.col2;
  };

  FabGrid.prototype.shouldHighlightRow = function(row) {
    if (this.options.multiSelectRows === true && this.isRowSelected(row)) {
      return true;
    }
    if (this.isCellRangeSelectionMode()) {
      return false;
    }
    return this.options.highlightActiveRow !== false && this.rowSelection === row;
  };

  FabGrid.prototype.handleClick = function(event) {
    var filterMenuItem = closest(event.target, 'fg-filter-menu-item');
    var columnChooserTrigger = closest(event.target, 'fg-column-chooser-trigger');
    var searchIcon = closest(event.target, 'fg-header-search-icon');
    var searchInput = closest(event.target, 'fg-header-search-input');
    var filterIcon = closest(event.target, 'fg-filter-icon');
    var resize = closest(event.target, 'fg-resize');
    var selectAll = closest(event.target, 'fg-selection-check-all');
    var selectionCheck = closest(event.target, 'fg-selection-check');
    var header = closest(event.target, 'fg-header-cell');
    var rowHeader = closest(event.target, 'fg-row-header-cell');
    var selectionCell = closest(event.target, 'fg-selection-cell');
    var groupExpander = closest(event.target, 'fg-row-group-expander');
    var treeExpander = closest(event.target, 'fg-tree-expander');
    var cell = closest(event.target, 'fg-cell');
    var colIndex;
    var rowIndex;

    FabGrid.prototype.activateKeyboardEventOwner.call(this, event);

    if (this._stopNavigation === true &&
        (cell || rowHeader || selectionCell || selectionCheck || selectAll ||
          groupExpander || treeExpander)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.fixedPaneTouchClickUntil && Date.now() < this.fixedPaneTouchClickUntil) {
      this.fixedPaneTouchClickUntil = 0;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (filterMenuItem) {
      this.handleFilterMenuClick(event);
      return;
    }

    if (columnChooserTrigger) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleColumnChooser(columnChooserTrigger);
      return;
    }

    if (searchIcon) {
      this.handleHeaderSearchIconClick(event, searchIcon);
      return;
    }

    if (searchInput) {
      event.stopPropagation();
      return;
    }

    if (filterIcon) {
      event.preventDefault();
      event.stopPropagation();
      colIndex = toNumber((header || filterIcon).getAttribute('data-col'), -1);
      if (colIndex < 0 && header) {
        colIndex = toNumber(header.getAttribute('data-col'), -1);
      }
      this.showFilterMenu(colIndex, filterIcon);
      return;
    }

    if (this.suppressClick && (resize || header)) {
      this.suppressClick = false;
      event.preventDefault();
      return;
    }
    this.suppressClick = false;

    if (resize) {
      event.preventDefault();
      return;
    }

    if (selectAll) {
      event.preventDefault();
      event.stopPropagation();
      this.setAllRowsSelected(selectAll.checked);
      this.root.focus();
      return;
    }

    if (selectionCheck || selectionCell) {
      event.preventDefault();
      event.stopPropagation();
      rowIndex = toNumber((selectionCheck || selectionCell).getAttribute('data-row'), 0);
      this.toggleRowSelection(rowIndex);
      this.root.focus();
      return;
    }

    if (header && header.classList && header.classList.contains('fg-header-group-cell')) {
      this.root.focus();
      return;
    }

    if (header && this.options.allowSorting) {
      colIndex = toNumber(header.getAttribute('data-col'), -1);
      if (
        this._toggleVisibleSort(colIndex, event.shiftKey === true) !== false &&
        adjustColumnScrollIntoView(this, colIndex)
      ) {
        this.render();
      }
      return;
    }

    if (rowHeader) {
      rowIndex = toNumber(rowHeader.getAttribute('data-row'), 0);
      if (this.isRowGroup(this.view[rowIndex]) || this.isRowGroupFooter(this.view[rowIndex])) {
        this.root.focus();
        return;
      }
      if (this.isCellRangeSelectionMode()) {
        event.preventDefault();
        event.stopPropagation();
        if (this.suppressCellRangeClick) {
          this.suppressCellRangeClick = false;
          this.suppressCellRangeClickEvent = false;
          this.root.focus();
          return;
        }
        if (event.shiftKey === true) {
          this.extendCellRangeRowSelection(rowIndex);
        } else {
          this.selectCellRangeRows(rowIndex, rowIndex);
        }
        this._scrollVisibleIntoView(rowIndex, 0);
        this.root.focus();
        return;
      }
      this._selectVisibleRow(rowIndex, this.selection.col, true);
      this.root.focus();
      return;
    }

    if (cell) {
      rowIndex = toNumber(cell.getAttribute('data-row'), 0);
      colIndex = toNumber(cell.getAttribute('data-col'), 0);
      if (treeExpander && treeExpander.className.indexOf('fg-tree-expander-placeholder') < 0) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleTreeNode(rowIndex);
        this.root.focus();
        return;
      }
      if (this.isRowGroup(this.view[rowIndex])) {
        if (groupExpander) {
          this.toggleRowGroup(rowIndex);
        } else {
          this._selectVisibleCell(rowIndex, this.selection.col);
          this._scrollVisibleIntoView(rowIndex, this.selection.col);
        }
        this.root.focus();
        return;
      }
      if (this.isRowGroupFooter(this.view[rowIndex])) {
        this.root.focus();
        return;
      }
      if (this.editing && (this.editing.row !== rowIndex || this.editing.col !== colIndex)) {
        if (this.finishEditing(true, { restoreFocus: false }) === false) {
          event.preventDefault();
          return;
        }
      }
      if (event.detail === 2 && !this.isCellRangeSelectionMode()) {
        this.scheduleCellDblClick(event, rowIndex, colIndex);
      }
      if (this.isCellRangeSelectionMode()) {
        if (this.suppressCellRangeClick) {
          var suppressCellRangeClickEvent = this.suppressCellRangeClickEvent;
          this.suppressCellRangeClick = false;
          this.suppressCellRangeClickEvent = false;
          if (suppressCellRangeClickEvent) {
            event.preventDefault();
            event.stopPropagation();
          }
          this.root.focus();
          return;
        }
        if (event.shiftKey === true) {
          this.extendCellRangeSelection(rowIndex, colIndex);
        } else {
          this._selectVisibleCell(rowIndex, colIndex);
        }
        this._scrollVisibleIntoView(rowIndex, colIndex);
        this.root.focus();
        return;
      }
      if (this.shouldEditOnSelect(rowIndex, colIndex)) {
        this._selectVisibleRow(rowIndex, colIndex);
      } else {
        this.toggleRowSelection(rowIndex, colIndex);
      }
      this._scrollVisibleIntoView(rowIndex, colIndex);
      if (this.shouldEditOnSelect(rowIndex, colIndex)) {
        if (this._startEditingVisible(rowIndex, colIndex)) {
          return;
        }
      }
      this.root.focus();
    }
  };

  FabGrid.prototype.canDragColumns = function() {
    var mode = this.options.allowDragging;
    if (mode === true) {
      return true;
    }
    mode = mode == null ? '' : String(mode).toLowerCase();
    return mode === 'columns' || mode === 'column' || mode === 'all';
  };

  FabGrid.prototype.startColumnDrag = function(event, header, colIndex) {
    var column = this.visibleColumns[colIndex];
    var headerRect;
    var title;
    var titleRect;
    if (!column || !this.canDragColumns()) {
      return;
    }
    headerRect = header.getBoundingClientRect();
    title = header.querySelector('.fg-header-title');
    titleRect = title ? title.getBoundingClientRect() : headerRect;
    this.columnDragState = {
      column: column,
      sourceIndex: colIndex,
      partition: this.getColumnDragPartition(colIndex),
      startX: event.clientX,
      startY: event.clientY,
      pointerOffsetX: event.clientX - headerRect.left,
      pointerOffsetY: event.clientY - titleRect.top,
      sourceLeft: headerRect.left,
      sourceTop: titleRect.top,
      previewWidth: headerRect.width,
      previewHeight: titleRect.height,
      pointerId: event.pointerId,
      pointerTarget: header,
      active: false,
      target: null
    };
    this.bindPointerInteractionEvents();
  };

  FabGrid.prototype.getColumnDragPartition = function(colIndex) {
    if (colIndex < this.frozenColumns) {
      return 'left';
    }
    if (colIndex >= this.scrollableColumnEnd) {
      return 'right';
    }
    return 'main';
  };

  FabGrid.prototype.getColumnDragPartitionRange = function(partition) {
    if (partition === 'left') {
      return { start: 0, end: this.frozenColumns };
    }
    if (partition === 'right') {
      return { start: this.scrollableColumnEnd, end: this.visibleColumns.length };
    }
    return { start: this.frozenColumns, end: this.scrollableColumnEnd };
  };

  FabGrid.prototype.getColumnDragTarget = function(clientX, clientY, state) {
    var range = this.getColumnDragPartitionRange(state.partition);
    var headerRect = this.header.getBoundingClientRect();
    var cell;
    var rect;
    var column;
    var beforeColumn;
    var position;
    var i;
    if (clientY < headerRect.top || clientY > headerRect.bottom) {
      return null;
    }
    for (i = range.start; i < range.end; i += 1) {
      cell = this.root.querySelector('.fg-header-cell[data-col="' + i + '"]');
      if (!cell) {
        continue;
      }
      rect = cell.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right) {
        continue;
      }
      column = this.visibleColumns[i];
      position = clientX < rect.left + rect.width / 2 ? 'before' : 'after';
      beforeColumn = position === 'before' ? column :
        i + 1 < range.end ? this.visibleColumns[i + 1] : this.visibleColumns[range.end] || null;
      return {
        index: i,
        position: position,
        beforeColumn: beforeColumn,
        cell: cell,
        column: column
      };
    }
    return null;
  };

  FabGrid.prototype.getColumnDragDestinationIndex = function(column, beforeColumn) {
    var sourceIndex = this.columns.indexOf(column);
    var targetIndex = beforeColumn ? this.columns.indexOf(beforeColumn) : this.columns.length;
    if (sourceIndex < 0) {
      return -1;
    }
    if (targetIndex > sourceIndex) {
      targetIndex -= 1;
    }
    return targetIndex;
  };

  FabGrid.prototype.isColumnDragMoveNeeded = function(state, target) {
    return this.getColumnDragDestinationIndex(state.column, target.beforeColumn) !== this.columns.indexOf(state.column);
  };

  FabGrid.prototype.setColumnDragTarget = function(target) {
    if (this.columnDragTargetCell) {
      this.columnDragTargetCell.classList.remove('fg-column-drag-before', 'fg-column-drag-after');
    }
    this.columnDragTargetCell = target ? target.cell : null;
    this.updateColumnDragIndicator(target);
  };

  FabGrid.prototype.updateColumnDragIndicator = function(target) {
    var rootRect;
    var headerRect;
    var cellRect;
    var left;
    if (!target) {
      if (this.columnDragIndicator) {
        this.columnDragIndicator.style.display = 'none';
      }
      return;
    }
    if (!this.columnDragIndicator) {
      this.columnDragIndicator = document.createElement('div');
      this.columnDragIndicator.className = 'fg-column-drop-indicator';
      this.root.appendChild(this.columnDragIndicator);
    }
    rootRect = this.root.getBoundingClientRect();
    headerRect = this.header.getBoundingClientRect();
    cellRect = target.cell.getBoundingClientRect();
    left = (target.position === 'before' ? cellRect.left : cellRect.right) - rootRect.left;
    this.columnDragIndicator.style.display = 'block';
    this.columnDragIndicator.style.left = Math.round(left) + 'px';
    this.columnDragIndicator.style.top = Math.round(headerRect.top - rootRect.top) + 'px';
    this.columnDragIndicator.style.height = Math.round(headerRect.height) + 'px';
  };

  FabGrid.prototype.showColumnDragPreview = function(state) {
    var preview;
    var title;
    if (state.preview) {
      return;
    }
    preview = document.createElement('div');
    preview.className = state.pointerTarget.className + ' fg-column-drag-preview';
    preview.setAttribute('aria-hidden', 'true');
    title = state.pointerTarget.querySelector('.fg-header-title');
    if (title) {
      preview.appendChild(title.cloneNode(true));
    }
    preview.style.width = state.previewWidth + 'px';
    preview.style.height = state.previewHeight + 'px';
    this.root.appendChild(preview);
    state.preview = preview;
  };

  FabGrid.prototype.updateColumnDragPreview = function(event, state) {
    if (!state.preview) {
      return;
    }
    state.preview.style.left = event.clientX - state.pointerOffsetX + 'px';
    state.preview.style.top = event.clientY - state.pointerOffsetY + 'px';
  };

  FabGrid.prototype.removeColumnDragPreview = function(state) {
    if (state.preview && state.preview.parentNode) {
      state.preview.parentNode.removeChild(state.preview);
    }
    state.preview = null;
  };

  FabGrid.prototype.returnColumnDragPreview = function(state) {
    var preview = state.preview;
    var headerRect;
    var title;
    var titleRect;
    if (!preview) {
      return;
    }
    if (state.pointerTarget && state.pointerTarget.isConnected) {
      headerRect = state.pointerTarget.getBoundingClientRect();
      title = state.pointerTarget.querySelector('.fg-header-title');
      titleRect = title ? title.getBoundingClientRect() : headerRect;
      state.sourceLeft = headerRect.left;
      state.sourceTop = titleRect.top;
    }
    preview.getBoundingClientRect();
    preview.classList.add('fg-column-drag-returning');
    preview.style.left = state.sourceLeft + 'px';
    preview.style.top = state.sourceTop + 'px';
    window.setTimeout(function() {
      if (preview.parentNode) {
        preview.parentNode.removeChild(preview);
      }
    }, 230);
    state.preview = null;
  };

  FabGrid.prototype.updateColumnDrag = function(event) {
    var state = this.columnDragState;
    var target;
    var from;
    var to;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return;
    }
    if (!state.active) {
      if (Math.abs(event.clientX - state.startX) < 5 && Math.abs(event.clientY - state.startY) < 5) {
        return;
      }
      state.active = true;
      this.root.classList.add('fg-column-dragging');
      this.showColumnDragPreview(state);
      if (state.pointerTarget && state.pointerTarget.setPointerCapture && event.pointerId != null) {
        state.pointerTarget.setPointerCapture(event.pointerId);
      }
    }
    event.preventDefault();
    this.updateColumnDragPreview(event, state);
    target = this.getColumnDragTarget(event.clientX, event.clientY, state);
    if (target && target.column && target.column._headerParent !== state.column._headerParent) {
      target = null;
    }
    if (!target || !this.isColumnDragMoveNeeded(state, target)) {
      target = null;
    }
    if (state.target && target && state.target.beforeColumn === target.beforeColumn && state.target.position === target.position) {
      return;
    }
    from = state.sourceIndex;
    to = target ? this.getColumnDragDestinationIndex(state.column, target.beforeColumn) : -1;
    if (target && this.emit('draggingColumn', {
      column: state.column,
      from: from,
      to: to,
      position: target.position
    }) === false) {
      target = null;
    }
    state.target = target;
    this.setColumnDragTarget(target);
  };

  FabGrid.prototype.moveColumnBefore = function(column, beforeColumn) {
    var sourceIndex = this.columns.indexOf(column);
    var destinationIndex = this.getColumnDragDestinationIndex(column, beforeColumn);
    var previousColumns = this.columns.slice();
    var selectedColumn = this.visibleColumns[this.selection.col] || null;
    var anchorColumn = this.visibleColumns[(this.selectionAnchor || this.selection).col] || null;
    if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex === destinationIndex) {
      return false;
    }
    this.columns.splice(sourceIndex, 1);
    this.columns.splice(destinationIndex, 0, column);
    syncColumnIndexes(this);
    if (this.updateLayout() === false) {
      this.columns.splice(destinationIndex, 1);
      this.columns.splice(sourceIndex, 0, column);
      syncColumnIndexes(this);
      return false;
    }
    remapFooterCellValues(this, previousColumns);
    if (selectedColumn) {
      this.selection.col = Math.max(0, this.visibleColumns.indexOf(selectedColumn));
    }
    if (anchorColumn) {
      this.selectionAnchor.col = Math.max(0, this.visibleColumns.indexOf(anchorColumn));
    }
    this.render();
    return true;
  };

  FabGrid.prototype.finishColumnDrag = function(event) {
    var state = this.columnDragState;
    var moved = false;
    var shouldReturn = false;
    var destinationIndex;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return false;
    }
    if (state.active) {
      event.preventDefault();
      this.suppressClick = true;
      if (state.target && this.isColumnDragMoveNeeded(state, state.target)) {
        if (!this.editing || this.finishEditing(true) !== false) {
          destinationIndex = this.getColumnDragDestinationIndex(state.column, state.target.beforeColumn);
          moved = this.moveColumnBefore(state.column, state.target.beforeColumn);
          if (moved) {
            this.emit('draggedColumn', {
              column: state.column,
              from: state.sourceIndex,
              to: destinationIndex,
              position: state.target.position
            });
          }
        }
      }
      shouldReturn = !moved;
    }
    if (state.pointerTarget && state.pointerTarget.releasePointerCapture && event.pointerId != null) {
      try {
        state.pointerTarget.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Ignore a pointer that was already released by the browser.
      }
    }
    this.setColumnDragTarget(null);
    if (shouldReturn) {
      this.returnColumnDragPreview(state);
    } else {
      this.removeColumnDragPreview(state);
    }
    this.root.classList.remove('fg-column-dragging');
    this.columnDragState = null;
    return true;
  };

  FabGrid.prototype.bindPointerInteractionEvents = function() {
    if (this.pointerInteractionEventsBound) {
      return;
    }
    document.addEventListener('pointermove', this._boundPointerMove);
    document.addEventListener('pointerup', this._boundPointerUp);
    document.addEventListener('pointercancel', this._boundPointerUp);
    this.pointerInteractionEventsBound = true;
  };

  FabGrid.prototype.unbindPointerInteractionEvents = function() {
    if (!this.pointerInteractionEventsBound) {
      return;
    }
    document.removeEventListener('pointermove', this._boundPointerMove);
    document.removeEventListener('pointerup', this._boundPointerUp);
    document.removeEventListener('pointercancel', this._boundPointerUp);
    this.pointerInteractionEventsBound = false;
  };

  FabGrid.prototype.handlePointerDown = function(event) {
    var resize = closest(event.target, 'fg-resize');
    var header = closest(event.target, 'fg-header-cell');
    var rowHeader = closest(event.target, 'fg-row-header-cell');
    var cell = closest(event.target, 'fg-cell');
    var colIndex;
    FabGrid.prototype.activateKeyboardEventOwner.call(this, event);
    if (this._stopNavigation === true &&
        (cell || rowHeader || closest(event.target, 'fg-body-scroll') ||
          closest(event.target, 'fg-frozen-pane') ||
          closest(event.target, 'fg-frozen-pane-right') ||
          closest(event.target, 'fg-row-header-pane') ||
          closest(event.target, 'fg-selection-pane') ||
          closest(event.target, 'fg-scrollbar-v') ||
          closest(event.target, 'fg-scrollbar-h'))) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.button != null && event.button !== 0) {
      return;
    }
    if (resize && this.options.allowResizing !== false) {
      this.startResize(event, toNumber(resize.getAttribute('data-resize-col'), 0));
      return;
    }
    if (rowHeader && this.isCellRangeSelectionMode() && !this.canDragRows()) {
      if (this.startCellRangeRowDrag(event, rowHeader)) {
        return;
      }
    }
    if (cell && this.isCellRangeSelectionMode() && !this.canDragRows() &&
        !closest(event.target, 'fg-tree-expander') && !closest(event.target, 'fg-row-group-expander')) {
      if (this.startCellRangeDrag(event, cell)) {
        return;
      }
    }
    if (
      !header ||
      (header.classList && header.classList.contains('fg-header-group-cell')) ||
      closest(event.target, 'fg-header-search') ||
      closest(event.target, 'fg-filter-icon')
    ) {
      return;
    }
    colIndex = toNumber(header.getAttribute('data-col'), -1);
    if (colIndex >= 0) {
      this.startColumnDrag(event, header, colIndex);
    }
  };

  FabGrid.prototype.getCellRangeTargetAtPoint = function(clientX, clientY) {
    var target = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(clientX, clientY) : null;
    var cell = closest(target, 'fg-cell');
    var row;
    var col;
    if (!cell || !this.root.contains(cell)) {
      return null;
    }
    row = toNumber(cell.getAttribute('data-row'), -1);
    col = toNumber(cell.getAttribute('data-col'), -1);
    if (row < 0 || col < 0 || !this.view[row] ||
        this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
      return null;
    }
    return { row: row, col: col };
  };

  FabGrid.prototype.getCellRangeRowTargetAtPoint = function(clientX, clientY) {
    var target = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(clientX, clientY) : null;
    var rowTarget = closest(target, 'fg-row-header-cell') || closest(target, 'fg-cell');
    var row;
    if (!rowTarget || !this.root.contains(rowTarget)) {
      return null;
    }
    row = toNumber(rowTarget.getAttribute('data-row'), -1);
    if (row < 0 || !this.view[row] || this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
      return null;
    }
    return { row: row };
  };

  FabGrid.prototype.startCellRangeDrag = function(event, cell) {
    var row = toNumber(cell.getAttribute('data-row'), -1);
    var col = toNumber(cell.getAttribute('data-col'), -1);
    var isDoubleClick;
    if (row < 0 || col < 0 || !this.view[row] ||
        this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
      return false;
    }
    isDoubleClick = this.isCellRangePointerDoubleClick(event, row, col);
    this.suppressCellRangeClick = false;
    this.suppressCellRangeClickEvent = false;
    if (event.shiftKey === true) {
      this.extendCellRangeSelection(row, col);
    } else {
      this._selectVisibleCell(row, col);
    }
    this.cellRangeDragState = {
      pointerId: event.pointerId,
      startRow: row,
      startCol: col,
      wholeRow: false,
      clientX: event.clientX,
      clientY: event.clientY,
      isDoubleClick: isDoubleClick,
      didMove: false
    };
    this.bindPointerInteractionEvents();
    event.preventDefault();
    this.root.focus();
    return true;
  };

  FabGrid.prototype.startCellRangeRowDrag = function(event, rowHeader) {
    var row = toNumber(rowHeader.getAttribute('data-row'), -1);
    if (row < 0 || !this.view[row] || !this.visibleColumns.length ||
        this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
      return false;
    }
    this.suppressCellRangeClick = false;
    this.suppressCellRangeClickEvent = false;
    if (event.shiftKey === true) {
      this.extendCellRangeRowSelection(row);
    } else {
      this.selectCellRangeRows(row, row);
    }
    this.cellRangeDragState = {
      pointerId: event.pointerId,
      startRow: row,
      startCol: 0,
      wholeRow: true,
      clientX: event.clientX,
      clientY: event.clientY,
      isDoubleClick: false,
      didMove: false
    };
    this.bindPointerInteractionEvents();
    event.preventDefault();
    this.root.focus();
    return true;
  };

  FabGrid.prototype.isCellRangePointerDoubleClick = function(event, row, col) {
    var previous = this.cellRangeClickCandidate;
    var time = toNumber(event.timeStamp, Date.now());
    var detail = toNumber(event.detail, 0);
    var sameCell = !!(previous && previous.row === row && previous.col === col);
    var isDoubleClick = sameCell && (detail === 2 || (
      time - previous.time >= 0 &&
      time - previous.time <= 500 &&
      Math.abs((event.clientX || 0) - previous.clientX) <= 8 &&
      Math.abs((event.clientY || 0) - previous.clientY) <= 8
    ));
    if (isDoubleClick) {
      this.cellRangeClickCandidate = null;
      return true;
    }
    this.cellRangeClickCandidate = {
      row: row,
      col: col,
      time: time,
      clientX: event.clientX || 0,
      clientY: event.clientY || 0
    };
    return false;
  };

  FabGrid.prototype.getCellRangeAutoScrollDelta = function(clientX, clientY) {
    var rect;
    var threshold = 24;
    var deltaX = 0;
    var deltaY = 0;
    var scrollableLeft;
    var scrollableRight;
    if (!this.bodyScroll) {
      return { x: 0, y: 0 };
    }
    rect = this.bodyScroll.getBoundingClientRect();
    scrollableLeft = rect.left + this.getFixedLeftWidth() + this.frozenWidth;
    scrollableRight = rect.right - this.frozenRightWidth;
    if (clientY < rect.top + threshold) {
      deltaY = -this.options.rowHeight;
    } else if (clientY > rect.bottom - threshold) {
      deltaY = this.options.rowHeight;
    }
    if (clientX >= scrollableLeft && clientX < scrollableLeft + threshold) {
      deltaX = -32;
    } else if (clientX <= scrollableRight && clientX > scrollableRight - threshold) {
      deltaX = 32;
    }
    return { x: deltaX, y: deltaY };
  };

  FabGrid.prototype.updateCellRangeDragTarget = function(clientX, clientY) {
    var rect = this.bodyScroll.getBoundingClientRect();
    var x = clamp(clientX, rect.left + 1, rect.right - 1);
    var y = clamp(clientY, rect.top + 1, rect.bottom - 1);
    var state = this.cellRangeDragState;
    var target = state && state.wholeRow ?
      this.getCellRangeRowTargetAtPoint(x, y) :
      this.getCellRangeTargetAtPoint(x, y);
    if (!target || !state) {
      return false;
    }
    if (state.wholeRow) {
      if (target.row === this.selection.row && this.selection.col === 0) {
        return false;
      }
      state.didMove = state.didMove || target.row !== state.startRow;
      this.extendCellRangeRowSelection(target.row);
      return true;
    }
    if (target.row === this.selection.row && target.col === this.selection.col) {
      return false;
    }
    state.didMove = state.didMove || target.row !== state.startRow || target.col !== state.startCol;
    this.extendCellRangeSelection(target.row, target.col);
    return true;
  };

  FabGrid.prototype.scrollCellRangeDrag = function() {
    var state = this.cellRangeDragState;
    var delta;
    var previousLeft;
    var previousTop;
    if (!state || !this.bodyScroll) {
      return false;
    }
    delta = this.getCellRangeAutoScrollDelta(state.clientX, state.clientY);
    if (state.wholeRow) {
      delta.x = 0;
    }
    if (!delta.x && !delta.y) {
      return false;
    }
    previousLeft = this.bodyScroll.scrollLeft;
    previousTop = this.bodyScroll.scrollTop;
    this.bodyScroll.scrollLeft += delta.x;
    this.bodyScroll.scrollTop += delta.y;
    if (previousLeft === this.bodyScroll.scrollLeft && previousTop === this.bodyScroll.scrollTop) {
      return false;
    }
    this.render();
    this.updateCellRangeDragTarget(state.clientX, state.clientY);
    return true;
  };

  FabGrid.prototype.scheduleCellRangeAutoScroll = function() {
    var self = this;
    if (this.cellRangeAutoScrollRaf || !this.cellRangeDragState) {
      return;
    }
    this.cellRangeAutoScrollRaf = requestAnimationFrame(function() {
      self.cellRangeAutoScrollRaf = 0;
      if (self.scrollCellRangeDrag()) {
        self.scheduleCellRangeAutoScroll();
      }
    });
  };

  FabGrid.prototype.updateCellRangeDrag = function(event) {
    var state = this.cellRangeDragState;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return false;
    }
    state.clientX = event.clientX;
    state.clientY = event.clientY;
    this.updateCellRangeDragTarget(event.clientX, event.clientY);
    if (this.scrollCellRangeDrag()) {
      this.scheduleCellRangeAutoScroll();
    }
    event.preventDefault();
    return true;
  };

  FabGrid.prototype.finishCellRangeDrag = function(event) {
    var self = this;
    var state = this.cellRangeDragState;
    var canceled;
    if (!state || (state.pointerId != null && event.pointerId != null && state.pointerId !== event.pointerId)) {
      return false;
    }
    canceled = event.type === 'pointercancel';
    if (this.cellRangeAutoScrollRaf) {
      cancelAnimationFrame(this.cellRangeAutoScrollRaf);
      this.cellRangeAutoScrollRaf = 0;
    }
    this.cellRangeDragState = null;
    this.suppressCellRangeClick = !canceled;
    this.suppressCellRangeClickEvent = !canceled && state.didMove;
    if (canceled || state.didMove) {
      this.cellRangeClickCandidate = null;
    } else if (state.isDoubleClick) {
      this.scheduleCellDblClick(event, state.startRow, state.startCol);
    }
    if (!canceled) {
      setTimeout(function() {
        self.suppressCellRangeClick = false;
        self.suppressCellRangeClickEvent = false;
      }, 0);
    }
    return true;
  };

  FabGrid.prototype.cancelPendingCellDblClick = function() {
    if (this.cellDblClickTimer) {
      window.clearTimeout(this.cellDblClickTimer);
      this.cellDblClickTimer = 0;
    }
    this.pendingCellDblClick = null;
  };

  FabGrid.prototype.scheduleCellDblClick = function(event, row, col) {
    var self = this;
    this.cancelPendingCellDblClick();
    this.pendingCellDblClick = {
      row: row,
      col: col,
      screenX: event.screenX || 0,
      screenY: event.screenY || 0,
      clientX: event.clientX || 0,
      clientY: event.clientY || 0,
      ctrlKey: event.ctrlKey === true,
      altKey: event.altKey === true,
      shiftKey: event.shiftKey === true,
      metaKey: event.metaKey === true,
      button: event.button || 0
    };
    this.cellDblClickTimer = window.setTimeout(function() {
      var pending = self.pendingCellDblClick;
      var cell;
      var dblClickEvent;
      if (!pending || self.disposed) {
        self.cancelPendingCellDblClick();
        return;
      }
      self.cellDblClickTimer = 0;
      self.pendingCellDblClick = null;
      if (!self.view[pending.row] || self.isRowGroup(self.view[pending.row]) || self.isRowGroupFooter(self.view[pending.row])) {
        return;
      }
      cell = self.root.querySelector(
        '.fg-cell[data-row="' + pending.row + '"][data-col="' + pending.col + '"]'
      );
      if (!cell) {
        return;
      }
      if (typeof MouseEvent === 'function') {
        dblClickEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          view: window,
          detail: 2,
          screenX: pending.screenX,
          screenY: pending.screenY,
          clientX: pending.clientX,
          clientY: pending.clientY,
          ctrlKey: pending.ctrlKey,
          altKey: pending.altKey,
          shiftKey: pending.shiftKey,
          metaKey: pending.metaKey,
          button: pending.button
        });
      } else {
        dblClickEvent = document.createEvent('MouseEvents');
        dblClickEvent.initMouseEvent(
          'dblclick',
          true,
          true,
          window,
          2,
          pending.screenX,
          pending.screenY,
          pending.clientX,
          pending.clientY,
          pending.ctrlKey,
          pending.altKey,
          pending.shiftKey,
          pending.metaKey,
          pending.button,
          null
        );
      }
      cell.dispatchEvent(dblClickEvent);
    }, 0);
  };

  FabGrid.prototype.handleDblClick = function(event) {
    var resize = closest(event.target, 'fg-resize');
    var cell = closest(event.target, 'fg-cell');
    var rowHeader = closest(event.target, 'fg-row-header-cell');
    var rowIndex;
    if (this._stopNavigation === true && (cell || rowHeader)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.pendingCellDblClick) {
      if (cell) {
        this.cancelPendingCellDblClick();
      } else {
        event.stopPropagation();
        return;
      }
    }
    if (resize && this.options.allowResizing !== false) {
      event.preventDefault();
      event.stopPropagation();
      this.autoSizeColumn(toNumber(resize.getAttribute('data-resize-col'), -1));
      return;
    }
    if (rowHeader) {
      rowIndex = toNumber(rowHeader.getAttribute('data-row'), -1);
      if (rowIndex === 0 && this.isRowGroup(this.view[rowIndex])) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleAllRowGroups();
        this.root.focus();
      }
      return;
    }
    if (!cell || !this.options.allowEditing) {
      return;
    }
    this._startEditingVisible(toNumber(cell.getAttribute('data-row'), 0), toNumber(cell.getAttribute('data-col'), 0));
  };

  FabGrid.prototype.handleMouseMove = function(event) {
    var rowHeader = closest(event.target, 'fg-row-header-cell');
    var selectionCell = closest(event.target, 'fg-selection-cell');
    var cell = closest(event.target, 'fg-cell');
    var nextRow = null;
    if (rowHeader) {
      nextRow = toNumber(rowHeader.getAttribute('data-row'), null);
    } else if (selectionCell) {
      nextRow = toNumber(selectionCell.getAttribute('data-row'), null);
    } else if (cell) {
      nextRow = toNumber(cell.getAttribute('data-row'), null);
    }
    this.updateInvalidTip(cell);
    if (this.hoverRow !== nextRow) {
      this.hoverRow = nextRow;
      this.renderVisibleRows();
    }
  };

  FabGrid.prototype.handleMouseLeave = function() {
    this.hideInvalidTip();
    if (this.hoverRow !== null) {
      this.hoverRow = null;
      this.renderVisibleRows();
    }
  };

  FabGrid.prototype.cancelEditingForSelection = function(row, col) {
    if (!this.editing ||
        (this.editing.row === row && this.editing.col === col)) {
      return false;
    }
    return this.finishEditing(false, { restoreFocus: false });
  };

  FabGrid.prototype.updateInvalidTip = function(cell) {
    var rowIndex;
    var colIndex;
    var row;
    var column;
    var error;
    if (!cell || !this.invalidTip || cell.className.indexOf('fg-cell-invalid') < 0) {
      this.hideInvalidTip();
      return;
    }
    rowIndex = toNumber(cell.getAttribute('data-row'), -1);
    colIndex = toNumber(cell.getAttribute('data-col'), -1);
    row = this.view[rowIndex];
    column = this.visibleColumns[colIndex];
    error = this.getCellValidationError(row, column);
    if (!error) {
      this.hideInvalidTip();
      return;
    }
    this.showInvalidTip(cell, error.message || this.getText('validation.invalidValue'));
  };

  FabGrid.prototype.showInvalidTip = function(cell, message) {
    var cellRect = cell.getBoundingClientRect();
    var bodyRect = this.body.getBoundingClientRect();
    var tip = this.invalidTip;
    var left;
    var top;
    var maxLeft;
    if (!tip) {
      return;
    }
    tip.textContent = message;
    tip.style.display = 'block';
    left = cellRect.right - bodyRect.left + 8;
    top = cellRect.top - bodyRect.top + Math.max(4, (cellRect.height - tip.offsetHeight) / 2);
    maxLeft = this.body.clientWidth - tip.offsetWidth - 8;
    if (left > maxLeft) {
      left = cellRect.left - bodyRect.left - tip.offsetWidth - 8;
    }
    if (left < 8) {
      left = Math.min(maxLeft, Math.max(8, cellRect.left - bodyRect.left));
      top = cellRect.bottom - bodyRect.top + 6;
    }
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  };

  FabGrid.prototype.hideInvalidTip = function() {
    if (this.invalidTip) {
      this.invalidTip.style.display = 'none';
    }
  };

  FabGrid.prototype.isHeaderToggleKey = function(event) {
    return isHotKey(event, this.options.headerToggleKey);
  };

  FabGrid.prototype.isMacPlatform = function() {
    var platform = '';
    if (typeof navigator !== 'undefined') {
      platform = navigator.userAgentData && navigator.userAgentData.platform ?
        navigator.userAgentData.platform :
        navigator.platform || navigator.userAgent || '';
    }
    return /mac/i.test(platform);
  };

  FabGrid.prototype.getVerticalBoundaryHotKeyDirection = function(event) {
    if (this.isMacPlatform()) {
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'PageUp') {
        return -1;
      }
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'PageDown') {
        return 1;
      }
      return 0;
    }
    if (event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.key === 'ArrowUp') {
      return -1;
    }
    if (event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.key === 'ArrowDown') {
      return 1;
    }
    return 0;
  };

  FabGrid.prototype.getHorizontalBoundaryHotKeyDirection = function(event) {
    if (this.isMacPlatform()) {
      if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'Home') {
        return -1;
      }
      if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'End') {
        return 1;
      }
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'Home') {
        return -1;
      }
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'End') {
        return 1;
      }
      return 0;
    }
    if (event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.key === 'ArrowLeft') {
      return -1;
    }
    if (event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && event.key === 'ArrowRight') {
      return 1;
    }
    return 0;
  };

  FabGrid.prototype.isKeyboardEventOwner = function(event) {
    var target = event && event.target;
    var ownerRoot = closest(target, 'fg-root');
    var ownerDocument = (this.root && this.root.ownerDocument) ||
      (target && target.ownerDocument) ||
      (typeof document !== 'undefined' ? document : null);
    var activeElement = ownerDocument && ownerDocument.activeElement;
    var activeRoot;
    var ownedPopups;
    var i;

    if (ownerRoot && ownerRoot !== this.root) {
      return false;
    }
    if (!ownerDocument || !activeElement) {
      return !ownerRoot || ownerRoot === this.root;
    }
    activeRoot = closest(activeElement, 'fg-root');
    if (activeRoot) {
      return activeRoot === this.root;
    }
    ownedPopups = [
      this.filterMenu,
      this.topLeftMenu,
      this.columnChooser,
      this.dateboxPanel,
      this.comboboxPanel,
      this.colorPanel
    ];
    for (i = 0; i < ownedPopups.length; i += 1) {
      if (containsNode(ownedPopups[i], activeElement)) {
        return true;
      }
    }
    if (ownerDocument[activeKeyboardGridKey] &&
        (activeElement === ownerDocument.body || activeElement === ownerDocument.documentElement)) {
      return ownerDocument[activeKeyboardGridKey] === this;
    }
    return false;
  };

  FabGrid.prototype.activateKeyboardEventOwner = function(event) {
    var target = event && event.target;
    var ownerRoot = closest(target, 'fg-root');
    var ownerDocument = (this.root && this.root.ownerDocument) ||
      (target && target.ownerDocument) ||
      (typeof document !== 'undefined' ? document : null);
    if (!ownerDocument || (ownerRoot && ownerRoot !== this.root)) {
      return false;
    }
    ownerDocument[activeKeyboardGridKey] = this;
    return true;
  };

  FabGrid.prototype.deactivateKeyboardEventOwner = function() {
    var ownerDocument = (this.root && this.root.ownerDocument) ||
      (typeof document !== 'undefined' ? document : null);
    if (ownerDocument && ownerDocument[activeKeyboardGridKey] === this) {
      ownerDocument[activeKeyboardGridKey] = null;
    }
  };

  FabGrid.prototype.claimKeyboardEvent = function(event) {
    if (!handledKeyboardEvents || !event || (typeof event !== 'object' && typeof event !== 'function')) {
      return true;
    }
    if (handledKeyboardEvents.has(event)) {
      return false;
    }
    handledKeyboardEvents.add(event);
    return true;
  };

  FabGrid.prototype.handleKeyDown = function(event) {
    var row = this.selection.row;
    var col = this.selection.col;
    var boundaryDirection;
    var horizontalBoundaryDirection;
    var targetName = event.target && event.target.tagName ? event.target.tagName.toUpperCase() : '';
    var searchInput = closest(event.target, 'fg-header-search-input');

    if (!FabGrid.prototype.isKeyboardEventOwner.call(this, event) ||
        !FabGrid.prototype.claimKeyboardEvent.call(this, event)) {
      return;
    }

    if (this._stopNavigation === true && isNavigationKey(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (this.busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.key === 'Escape' && this.isFilterMenuOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.hideFilterMenu();
      return;
    }

    if (event.key === 'Escape' && this.isTopLeftMenuOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.hideTopLeftMenu();
      return;
    }

    if (event.key === 'Escape' && this.isColumnChooserOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.hideColumnChooser();
      return;
    }

    if (searchInput && this.handleHeaderSearchKeyDown(event, searchInput)) {
      event.stopPropagation();
      return;
    }

    if (this.isHeaderToggleKey(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleHeaderDisplayMode();
      return;
    }

    if (this.editing) {
      if (event.key === 'Enter' || event.key === 'Tab' ||
          event.key === 'ArrowDown' || event.key === 'ArrowUp' ||
          event.key === 'ArrowLeft' || event.key === 'ArrowRight' ||
          event.key === 'Escape') {
        event.stopPropagation();
      }
      if (this.options.editOnSelect !== true && event.key === 'Tab') {
        event.preventDefault();
        this.finishEditing(true);
        return;
      }
      if (event.target === this.editor && this.handleNumberSpinnerKeyDown(event)) {
        return;
      }
      if (event.target === this.editor && this.handleMaskedEditorDelete(event)) {
        return;
      }
      if (event.target === this.editor && this.handleDateboxKeyDown(event, this.editor)) {
        return;
      }
      if (event.target === this.editor && this.handleComboboxKeyDown(event)) {
        return;
      }
      if (event.target === this.editor && this.handleColorKeyDown(event)) {
        return;
      }
      if (event.target === this.editor && this.shouldBlockEditorKey(event)) {
        event.preventDefault();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        this.finishEditing(false);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.shiftKey) {
          this.commitEditingAndMoveLeft();
        } else {
          this.commitEditingAndMoveRight();
        }
        return;
      }
      if (this.options.editOnSelect !== true) {
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        if (event.shiftKey) {
          this.commitEditingAndMoveLeft();
        } else {
          this.commitEditingAndMoveRight();
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.commitEditingAndMoveVertical(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.commitEditingAndMoveVertical(-1);
      }
      return;
    }

    if (targetName === 'INPUT' && event.target !== this.editor) {
      return;
    }

    if (this.handleFirstRowSearchFocus(event, row, col)) {
      return;
    }

    if (this.options.autoClipboard !== false && (event.ctrlKey || event.metaKey) && !event.altKey && String(event.key).toLowerCase() === 'c') {
      event.preventDefault();
      event.stopPropagation();
      this.copySelection();
      return;
    }

    if (event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space') {
      event.preventDefault();
      event.stopPropagation();
      if (this.options.multiSelectRows === true && this.view.length) {
        this.toggleRowSelection(row, col);
        this._scrollVisibleIntoView(row, col);
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' ||
        event.key === 'ArrowLeft' || event.key === 'ArrowRight' ||
        event.key === 'PageDown' || event.key === 'PageUp' ||
        event.key === 'Home' || event.key === 'End') {
      event.stopPropagation();
    }

    if (this.handleCellRangeKeyDown(event)) {
      return;
    }

    boundaryDirection = this.getVerticalBoundaryHotKeyDirection(event);
    if (boundaryDirection) {
      event.preventDefault();
      this.moveVertical(boundaryDirection < 0 ? 0 : this.view.length - 1, col);
      return;
    }

    horizontalBoundaryDirection = this.getHorizontalBoundaryHotKeyDirection(event);
    if (horizontalBoundaryDirection) {
      event.preventDefault();
      this.moveHorizontalBoundary(horizontalBoundaryDirection, row);
      return;
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && (event.key === 'PageDown' || event.key === 'PageUp')) {
      event.preventDefault();
      this.movePage(event.key === 'PageDown' ? 1 : -1);
      return;
    }

    if (this.handleTreeKeyDown(event, row, col)) {
      return;
    }

    if (event.key === 'ArrowDown') {
      row += 1;
      event.preventDefault();
      this.moveVertical(row, col);
      return;
    } else if (event.key === 'ArrowUp') {
      row -= 1;
      event.preventDefault();
      this.moveVertical(row, col);
      return;
    } else if (event.key === 'ArrowRight') {
      col += 1;
    } else if (event.key === 'ArrowLeft') {
      col -= 1;
    } else if (event.key === 'Enter' || event.key === 'F2') {
      if (this.options.allowEditing) {
        event.preventDefault();
        this._startEditingVisible(row, col);
      }
      return;
    } else if (this.options.editOnSelect !== true &&
        this.options.allowEditing !== false &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.isComposing &&
        typeof event.key === 'string' &&
        event.key.length === 1 &&
        event.key !== ' ') {
      if (this._startEditingVisible(row, col)) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.shouldBlockEditorKey(event)) {
          this.editor.value = event.key;
          this.handleEditorInput();
          if (typeof this.editor.setSelectionRange === 'function') {
            this.editor.setSelectionRange(
              this.editor.value.length,
              this.editor.value.length
            );
          }
        }
      }
      return;
    } else {
      return;
    }
    event.preventDefault();
    this.moveCell(row, col);
  };

  FabGrid.prototype.handleFirstRowSearchFocus = function(event, row, col) {
    if (event.key !== 'ArrowUp' ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
      row !== 0 ||
      !this.options ||
      getActiveFilterMode(this.options) !== 'searchRow' ||
      typeof this.focusHeaderSearchInput !== 'function') {
      return false;
    }
    if (!this.focusHeaderSearchInput(col)) {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    return true;
  };

  FabGrid.prototype.handleCellRangeKeyDown = function(event) {
    var row = this.selection.row;
    var col = this.selection.col;
    var rowStep = 0;
    if (!this.isCellRangeSelectionMode() || event.shiftKey !== true ||
        event.ctrlKey || event.metaKey || event.altKey) {
      return false;
    }
    if (event.key === 'ArrowDown') {
      rowStep = 1;
      row += 1;
    } else if (event.key === 'ArrowUp') {
      rowStep = -1;
      row -= 1;
    } else if (event.key === 'ArrowRight') {
      col += 1;
    } else if (event.key === 'ArrowLeft') {
      col -= 1;
    } else {
      return false;
    }
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    while (rowStep && row >= 0 && row < this.view.length &&
        (this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row]))) {
      row += rowStep;
    }
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    if (this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
      return true;
    }
    event.preventDefault();
    this.extendCellRangeSelection(row, col);
    this._scrollVisibleIntoView(row, col, { directionY: rowStep });
    return true;
  };

  FabGrid.prototype.moveCell = function(row, col) {
    var next;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.options.editOnSelect === true) {
      next = this.findEditableCellInRow(row, col, col >= this.selection.col ? 1 : -1);
      if (next) {
        row = next.row;
        col = next.col;
      }
      this._selectVisibleCell(row, col);
      this._scrollVisibleIntoView(row, col);
      if (this.shouldEditOnSelect(row, col)) {
        this._startEditingVisible(row, col, { selectRow: this.options.multiSelectRows !== true });
      }
      return;
    }
    this._selectVisibleRow(row, col);
    this._scrollVisibleIntoView(row, col);
  };

  FabGrid.prototype.moveVertical = function(row, col) {
    var next;
    var direction = row > this.selection.row ? 1 : row < this.selection.row ? -1 : 0;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.options.editOnSelect === true) {
      if (!this.isCellEditable(this.selection.row, this.selection.col)) {
        if (this.options.multiSelectRows === true) {
          this._selectVisibleCell(row, col);
        } else {
          this._selectVisibleRow(row, col);
        }
        this._scrollVisibleIntoView(row, col, { directionY: direction });
        return;
      }
      next = this.findEditableCellInRow(row, col, 1);
      if (next) {
        this._selectVisibleCell(next.row, next.col);
        this._scrollVisibleIntoView(next.row, next.col, { directionY: direction });
        this._startEditingVisible(next.row, next.col, { selectRow: this.options.multiSelectRows !== true });
      }
      return;
    }
    if (this.options.multiSelectRows === true) {
      this._selectVisibleCell(row, col);
      this._scrollVisibleIntoView(row, col, { directionY: direction });
      return;
    }
    this._selectVisibleRow(row, col);
    this._scrollVisibleIntoView(row, col, { directionY: direction });
  };

  FabGrid.prototype.movePage = function(direction) {
    var rowHeight;
    var visibleRows;
    var currentRow;
    var targetRow;
    var relativeTop;
    var targetScrollTop;
    var maxScrollTop;
    if (!this.view.length || !this.bodyScroll || !direction) {
      return;
    }
    direction = direction > 0 ? 1 : -1;
    rowHeight = Math.max(1, toNumber(this.options.rowHeight, DEFAULT_OPTIONS.rowHeight));
    visibleRows = Math.max(1, Math.floor(this.getScrollableContentHeight() / rowHeight));
    currentRow = this.selection.row;
    targetRow = clamp(currentRow + direction * visibleRows, 0, this.view.length - 1);
    relativeTop = currentRow * rowHeight - this.bodyScroll.scrollTop;
    this.moveVertical(targetRow, this.selection.col);
    if (this.selection.row !== targetRow) {
      return;
    }
    maxScrollTop = Math.max(0, this.bodyScroll.scrollHeight - this.bodyScroll.clientHeight);
    targetScrollTop = clamp(targetRow * rowHeight - relativeTop, 0, maxScrollTop);
    this.bodyScroll.scrollTop = targetScrollTop;
    this.render();
  };

  FabGrid.prototype.moveHorizontalBoundary = function(direction, row) {
    var targetCol;
    var maxScrollLeft;
    if (!this.visibleColumns.length || !this.bodyScroll || !direction) {
      return;
    }
    direction = direction > 0 ? 1 : -1;
    targetCol = direction > 0 ? this.visibleColumns.length - 1 : 0;
    this.moveCell(row, targetCol);
    if (this.selection.col !== targetCol) {
      return;
    }
    maxScrollLeft = Math.max(0, this.bodyScroll.scrollWidth - this.bodyScroll.clientWidth);
    this.bodyScroll.scrollLeft = direction > 0 ? maxScrollLeft : 0;
    this.render();
  };

  FabGrid.prototype._selectVisibleCell = function(row, col) {
    var selected;
    var rowHeight;
    var rowTop;
    var rowBottom;
    var currentTop;
    var currentBottom;
    row = Number(row);
    col = col == null ? 0 : col;
    col = Number(col);
    if (!isFinite(row) || Math.floor(row) !== row || row < 0 || row >= this.view.length ||
        !isFinite(col) || Math.floor(col) !== col || col < 0 || col >= this.visibleColumns.length) {
      return false;
    }
    selected = this.applyCellSelection(row, col, row, col);
    if (selected !== true || !this.bodyScroll || typeof this.getScrollableContentHeight !== 'function') {
      return selected;
    }
    rowHeight = Math.max(1, toNumber(this.options.rowHeight, DEFAULT_OPTIONS.rowHeight));
    rowTop = this.selection.row * rowHeight;
    rowBottom = rowTop + rowHeight;
    currentTop = this.bodyScroll.scrollTop;
    currentBottom = currentTop + this.getScrollableContentHeight();
    if (rowTop < currentTop || rowBottom > currentBottom) {
      this._scrollVisibleIntoView(this.selection.row, this.selection.col, { alignY: 'start' });
    }
    return selected;
  };

  FabGrid.prototype.select = function(row, col) {
    var column;
    var visibleCol;
    if (col == null) {
      visibleCol = 0;
    } else {
      col = getColumnIndex(this, col);
      if (col < 0) {
        return false;
      }
      column = this.columns[col];
      visibleCol = this.visibleColumns.indexOf(column);
      if (visibleCol < 0) {
        return false;
      }
    }
    return FabGrid.prototype._selectVisibleCell.call(this, row, visibleCol);
  };

  FabGrid.prototype.selectRange = function(row, col, row2, col2) {
    var viewCol = getVisibleColumnIndex(this, col);
    var viewCol2 = getVisibleColumnIndex(this, col2);
    if (viewCol < 0 || viewCol2 < 0) {
      return false;
    }
    if (!this.isCellRangeSelectionMode()) {
      return this._selectVisibleCell(row2, viewCol2);
    }
    return this.applyCellSelection(row, viewCol, row2, viewCol2);
  };

  FabGrid.prototype.extendCellRangeSelection = function(row, col) {
    var anchor = this.selectionAnchor || this.selection;
    if (!this.isCellRangeSelectionMode()) {
      return this._selectVisibleCell(row, col);
    }
    return this.applyCellSelection(anchor.row, anchor.col, row, col);
  };

  FabGrid.prototype.applyCellSelection = function(anchorRow, anchorCol, row, col, rowHeaderSelection) {
    var nextRowSelection;
    var rowSelectionChanged;
    var rowHeaderSelectionChanged;
    var args;
    var currentAnchor = this.selectionAnchor || this.selection;
    anchorRow = clamp(anchorRow, 0, Math.max(0, this.view.length - 1));
    anchorCol = clamp(anchorCol, 0, Math.max(0, this.visibleColumns.length - 1));
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    nextRowSelection = this.options.multiSelectRows === true ? null : row;
    rowSelectionChanged = this.rowSelection !== nextRowSelection;
    rowHeaderSelectionChanged = rowHeaderSelection === true ?
      !this._rowHeaderSelection ||
        this._rowHeaderSelection.row !== anchorRow ||
        this._rowHeaderSelection.row2 !== row :
      !!this._rowHeaderSelection;
    if (this.selection.row === row && this.selection.col === col &&
        currentAnchor.row === anchorRow && currentAnchor.col === anchorCol &&
        !rowSelectionChanged && !rowHeaderSelectionChanged) {
      return true;
    }
    args = this.getSelectionEventArgs(row, col, anchorRow, anchorCol);
    if (this.emit('selectionChanging', args) === false) {
      return false;
    }
    if (rowSelectionChanged && this.options.multiSelectRows !== true && this.emit('rowSelectionChanging', { row: nextRowSelection }) === false) {
      return false;
    }
    this.cancelEditingForSelection(row, col);
    this.rowSelection = nextRowSelection;
    if (this.options.multiSelectRows !== true) {
      this._rowSelectionCleared = false;
    }
    this.selectionAnchor = { row: anchorRow, col: anchorCol };
    this.selection = { row: row, col: col };
    this._rowHeaderSelection = rowHeaderSelection === true ?
      { row: anchorRow, row2: row } : null;
    this.emit('selectionChanged', Object.assign({}, args));
    if (rowSelectionChanged && this.options.multiSelectRows !== true) {
      this.raiseRowSelectionChanged({ row: nextRowSelection });
    }
    this.render();
    return true;
  };

  FabGrid.prototype.selectRow = function(row, col) {
    var viewCol = col == null ? this.selection.col : getVisibleColumnIndex(this, col);
    if (viewCol < 0) {
      return false;
    }
    return FabGrid.prototype._selectVisibleRow.call(this, row, viewCol);
  };

  FabGrid.prototype._selectVisibleRow = function(row, col, rowHeaderSelection) {
    var item;
    var selectionArgs;
    var rowArgs;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = col == null ? this.selection.col : col;
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    selectionArgs = Object.assign(this.getSelectionEventArgs(row, col, row, col), {
      changedRow: row,
      selected: true
    });
    rowArgs = { row: row, selected: true };
    if (!canChangeRowSelection(this, selectionArgs, rowArgs)) {
      return false;
    }
    this.cancelEditingForSelection(row, col);
    this.rowSelection = row;
    this._rowSelectionCleared = false;
    if (this.options.multiSelectRows === true) {
      this.selectedRowMap[row] = true;
      item = this.view[row];
      if (!this.isRowGroup(item) && !this.isRowGroupFooter(item)) {
        this.setItemSelectionState(item, true);
      }
    }
    this.selection = {
      row: row,
      col: col
    };
    this.selectionAnchor = { row: row, col: col };
    this._rowHeaderSelection = rowHeaderSelection === true ?
      { row: row, row2: row } : null;
    raiseRowSelectionEvents(this, selectionArgs, rowArgs);
    this.render();
    return true;
  };

  FabGrid.prototype.toggleRowSelection = function(row, col) {
    var item;
    var groupState;
    var selected;
    var selectionArgs;
    var rowArgs;
    row = clamp(row, 0, Math.max(0, this.view.length - 1));
    col = col == null ? this.selection.col : col;
    col = clamp(col, 0, Math.max(0, this.visibleColumns.length - 1));
    if (this.options.multiSelectRows !== true) {
      return this._selectVisibleRow(row, col);
    }
    item = this.view[row];
    if (this.isRowGroup(item)) {
      groupState = this.getRowGroupSelectionState(item);
      selected = !groupState.checked;
    } else {
      selected = !this.isItemSelected(item);
    }
    selectionArgs = Object.assign(this.getSelectionEventArgs(row, col, row, col), {
      changedRow: row,
      selected: selected
    });
    rowArgs = { row: row, selected: selected };
    if (!canChangeRowSelection(this, selectionArgs, rowArgs)) {
      return false;
    }
    this.cancelEditingForSelection(row, col);
    if (this.isRowGroup(item)) {
      this.setItemsSelectionState(item.items || [], selected);
    } else {
      this.setItemSelectionState(item, selected);
    }
    this.rebuildSelectedRowMap();
    this.rowSelection = row;
    this.selection = { row: row, col: col };
    this.selectionAnchor = { row: row, col: col };
    this._rowHeaderSelection = null;
    selectionArgs.selected = this.isRowSelected(row);
    rowArgs.selected = selectionArgs.selected;
    raiseRowSelectionEvents(this, selectionArgs, rowArgs);
    this.render();
    return true;
  };

  FabGrid.prototype.unselectRow = function(row) {
    var item;
    var groupState;
    var previousRow;
    var selectionArgs;
    var rowArgs;
    var args;
    if (!this.view.length) {
      return false;
    }
    if (this.options.multiSelectRows !== true) {
      previousRow = this.rowSelection;
      if (previousRow == null) {
        return false;
      }
      row = row == null ? previousRow : clamp(row, 0, this.view.length - 1);
      if (row !== previousRow) {
        return false;
      }
      args = { row: null, previousRow: previousRow, selected: false };
      selectionArgs = this._createSelectionChangedEventArgs({
        changedRow: previousRow,
        selected: false
      });
      if (!canChangeRowSelection(this, selectionArgs, args)) {
        return false;
      }
      this.rowSelection = null;
      this._rowSelectionCleared = true;
      this._rowHeaderSelection = null;
      raiseRowSelectionEvents(this, selectionArgs, args);
      this.render();
      return true;
    }
    row = row == null ? this.rowSelection : row;
    if (row == null) {
      return false;
    }
    row = clamp(row, 0, this.view.length - 1);
    item = this.view[row];
    if (this.isRowGroup(item)) {
      groupState = this.getRowGroupSelectionState(item);
      if (groupState.selectedCount < 1) {
        return false;
      }
    } else {
      if (this.isRowGroupFooter(item) || !this.isItemSelected(item)) {
        return false;
      }
    }
    selectionArgs = this._createSelectionChangedEventArgs({
      changedRow: row,
      selected: false
    });
    rowArgs = { row: row, selected: false };
    if (!canChangeRowSelection(this, selectionArgs, rowArgs)) {
      return false;
    }
    if (this.isRowGroup(item)) {
      this.setItemsSelectionState(item.items || [], false);
    } else {
      this.setItemSelectionState(item, false);
    }
    this.rebuildSelectedRowMap();
    if (this._rowHeaderSelection && this._isRowHeaderCellSelected(row)) {
      this._rowHeaderSelection = null;
    }
    raiseRowSelectionEvents(this, selectionArgs, rowArgs);
    this.render();
    return true;
  };

  FabGrid.prototype.setAllRowsSelected = function(selected) {
    var selectionArgs;
    var rowArgs;
    selected = selected === true;
    selectionArgs = this._createSelectionChangedEventArgs({
      selected: selected,
      allRows: true
    });
    rowArgs = { row: null, selected: selected, allRows: true };
    if (!canChangeRowSelection(this, selectionArgs, rowArgs)) {
      return false;
    }
    this.resetSelectedItemSelection(this.options.multiSelectRows === true && selected ? (this.dataView || []).slice() : []);
    this.rebuildSelectedRowMap();
    this._rowHeaderSelection = null;
    raiseRowSelectionEvents(this, selectionArgs, rowArgs);
    this.render();
    return true;
  };

  FabGrid.prototype.isRowSelected = function(row) {
    if (this.options.multiSelectRows === true) {
      return this.selectedRowMap[row] === true;
    }
    return this.rowSelection === row;
  };

  FabGrid.prototype.getSelectedRowCount = function() {
    var count = 0;
    var key;
    for (key in this.selectedRowMap) {
      if (Object.prototype.hasOwnProperty.call(this.selectedRowMap, key) && this.selectedRowMap[key]) {
        count += 1;
      }
    }
    return count;
  };

  FabGrid.prototype.isItemSelected = function(item) {
    if (!item) {
      return false;
    }
    if (this._selectedItemSet && isWeakSetValue(item)) {
      return this._selectedItemSet.has(item);
    }
    return this.selectedItemRefs.indexOf(item) >= 0;
  };

  FabGrid.prototype.setItemSelectionState = function(item, selected) {
    var index;
    if (!item || this.isRowGroup(item) || this.isRowGroupFooter(item)) {
      return;
    }
    index = this.selectedItemRefs.indexOf(item);
    if (selected && index < 0) {
      this.selectedItemRefs.push(item);
      if (this._selectedItemSet && isWeakSetValue(item)) {
        this._selectedItemSet.add(item);
      }
    } else if (!selected && index >= 0) {
      this.selectedItemRefs.splice(index, 1);
      if (this._selectedItemSet && isWeakSetValue(item)) {
        this._selectedItemSet.delete(item);
      }
    }
  };

  FabGrid.prototype.resetSelectedItemSelection = function(items) {
    var item;
    var i;
    items = Array.isArray(items) ? items : [];
    this.selectedItemRefs = [];
    this._selectedItemSet = typeof WeakSet === 'function' ? new WeakSet() : null;
    for (i = 0; i < items.length; i += 1) {
      item = items[i];
      if (this._selectedItemSet && isWeakSetValue(item)) {
        if (this._selectedItemSet.has(item)) {
          continue;
        }
        this._selectedItemSet.add(item);
      } else if (this.selectedItemRefs.indexOf(item) >= 0) {
        continue;
      }
      this.selectedItemRefs.push(item);
    }
  };

  FabGrid.prototype.setItemsSelectionState = function(items, selected) {
    var i;
    for (i = 0; i < items.length; i += 1) {
      this.setItemSelectionState(items[i], selected);
    }
  };

  FabGrid.prototype.getRowGroupSelectionState = function(group) {
    var items = group && Array.isArray(group.items) ? group.items : [];
    var selectedCount = 0;
    var i;
    for (i = 0; i < items.length; i += 1) {
      if (this.isItemSelected(items[i])) {
        selectedCount += 1;
      }
    }
    return {
      checked: items.length > 0 && selectedCount === items.length,
      indeterminate: selectedCount > 0 && selectedCount < items.length,
      selectedCount: selectedCount,
      totalCount: items.length
    };
  };

  FabGrid.prototype.syncSelectedItemRefsFromView = function() {
    var item;
    var i;
    if (this.options.multiSelectRows !== true) {
      return;
    }
    for (i = 0; i < this.view.length; i += 1) {
      item = this.view[i];
      if (!this.isRowGroup(item) && !this.isRowGroupFooter(item)) {
        this.setItemSelectionState(item, this.selectedRowMap[i] === true);
      }
    }
  };

  FabGrid.prototype.rebuildSelectedRowMap = function() {
    var next = {};
    var item;
    var i;
    if (this.options.multiSelectRows !== true) {
      this.selectedRowMap = next;
      return;
    }
    for (i = 0; i < this.view.length; i += 1) {
      item = this.view[i];
      if ((this.isRowGroup(item) && this.getRowGroupSelectionState(item).checked) ||
          (!this.isRowGroup(item) && !this.isRowGroupFooter(item) && this.isItemSelected(item))) {
        next[i] = true;
      }
    }
    this.selectedRowMap = next;
  };

  FabGrid.prototype.captureSelectionState = function() {
    var selectedItems = [];
    var key;
    var index;
    if (this.options.multiSelectRows === true) {
      this.syncSelectedItemRefsFromView();
      for (key in this.selectedRowMap) {
        if (Object.prototype.hasOwnProperty.call(this.selectedRowMap, key) && this.selectedRowMap[key]) {
          index = toNumber(key, -1);
          if (index >= 0 && index < this.view.length) {
            selectedItems.push(this.view[index]);
          }
        }
      }
    }
    return {
      rowSelectionItem: this.rowSelection != null ? this.view[this.rowSelection] : null,
      activeItem: this.view[this.selection.row] || null,
      anchorItem: this.view[(this.selectionAnchor || this.selection).row] || null,
      anchorCol: (this.selectionAnchor || this.selection).col,
      selectedItems: selectedItems
    };
  };

  FabGrid.prototype.restoreSelectionState = function(state) {
    var rowIndex;
    var activeIndex;
    var anchorIndex;
    var i;
    if (!state) {
      return;
    }
    if (this.options.multiSelectRows === true) {
      for (i = 0; i < state.selectedItems.length; i += 1) {
        if (!this.isRowGroup(state.selectedItems[i]) && !this.isRowGroupFooter(state.selectedItems[i])) {
          this.setItemSelectionState(state.selectedItems[i], true);
        }
      }
      this.rebuildSelectedRowMap();
    }
    rowIndex = findRowIndexByItem(this.view, state.rowSelectionItem);
    this.rowSelection = rowIndex >= 0 ? rowIndex : null;
    activeIndex = findRowIndexByItem(this.view, state.activeItem);
    if (activeIndex >= 0) {
      this.selection.row = activeIndex;
    } else if (this.rowSelection != null) {
      this.selection.row = this.rowSelection;
    }
    anchorIndex = findRowIndexByItem(this.view, state.anchorItem);
    this.selectionAnchor = {
      row: anchorIndex >= 0 ? anchorIndex : this.selection.row,
      col: state.anchorCol == null ? this.selection.col : state.anchorCol
    };
    if (this._rowHeaderSelection) {
      this._rowHeaderSelection = {
        row: this.selectionAnchor.row,
        row2: this.selection.row
      };
    }
  };

  FabGrid.prototype.pruneSelectedRows = function() {
    this.syncSelectedItemRefsFromView();
    this.rebuildSelectedRowMap();
  };

  FabGrid.prototype.copySelection = function() {
    var text = this.getSelectedText();
    var fullCol = getFullColumnIndex(this, this.selection.col);
    var args;
    if (text == null) {
      return false;
    }
    args = {
      row: this.selection.row,
      col: fullCol,
      viewCol: this.selection.col,
      text: text,
      data: text
    };
    if (this.emit('copying', args) === false) {
      return false;
    }
    args = Object.assign({}, args);
    if (this.emit('copyingCell', args) === false) {
      return false;
    }
    text = args.text == null ? '' : String(args.text);
    this.copyText(text);
    args = Object.assign({}, args);
    args.text = text;
    args.data = text;
    this.emit('copied', args);
    this.emit('copiedCell', Object.assign({}, args));
    return true;
  };

  FabGrid.prototype.getSelectedText = function() {
    var range = this._getRowHeaderSelectionRange();
    var lines;
    var values;
    var row;
    var col;
    if (!range && !this.isCellRangeSelectionMode()) {
      return this.getCellCopyText(this.selection.row, this.selection.col);
    }
    range = range || this.getSelectionRange();
    lines = [];
    for (row = range.row; row <= range.row2; row += 1) {
      if (this.isRowGroup(this.view[row]) || this.isRowGroupFooter(this.view[row])) {
        continue;
      }
      values = [];
      for (col = range.col; col <= range.col2; col += 1) {
        values.push(this.getCellCopyText(row, col));
      }
      lines.push(values.join('\t'));
    }
    return lines.join('\n');
  };

  FabGrid.prototype.getCellCopyText = function(row, col) {
    var value = this.getCellData(row, getFullColumnIndex(this, col));
    var column = this.visibleColumns[col];
    var mask = getExplicitEditorMask(column);
    if (mask) {
      return getMaskCopyText(value, getMaskOptions(column, mask));
    }
    if (column && column.dataType === 'number') {
      return getNumberCopyText(value);
    }
    return value == null ? '' : String(value);
  };

  FabGrid.prototype.copyText = function(text) {
    var self = this;
    this.copyBuffer = text;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function() {
        self.copyTextWithTextarea(text);
      });
      return;
    }
    this.copyTextWithTextarea(text);
  };

  FabGrid.prototype.copyTextWithTextarea = function(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.left = '-1000px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (error) {
      this.emit('copyFailed', { error: error, text: text });
    }
    document.body.removeChild(textarea);
    this.root.focus();
  };

  FabGrid.prototype.clampSelection = function() {
    this.selection.row = clamp(this.selection.row, 0, Math.max(0, this.view.length - 1));
    this.selection.col = clamp(this.selection.col, 0, Math.max(0, this.visibleColumns ? this.visibleColumns.length - 1 : 0));
    this.selectionAnchor = this.selectionAnchor || { row: this.selection.row, col: this.selection.col };
    this.selectionAnchor.row = clamp(this.selectionAnchor.row, 0, Math.max(0, this.view.length - 1));
    this.selectionAnchor.col = clamp(this.selectionAnchor.col, 0, Math.max(0, this.visibleColumns ? this.visibleColumns.length - 1 : 0));
    if (!this.isCellRangeSelectionMode()) {
      this.selectionAnchor.row = this.selection.row;
      this.selectionAnchor.col = this.selection.col;
    }
    if (this.options.multiSelectRows !== true && this.rowSelection == null &&
        this._rowSelectionCleared !== true && this.view.length) {
      this.rowSelection = this.selection.row;
    }
    if (this.rowSelection != null && this.rowSelection >= this.view.length) {
      this.rowSelection = this.view.length ? this.view.length - 1 : null;
    }
  };

  FabGrid.prototype.scrollIntoView = function(row, col, options) {
    var viewCol = getVisibleColumnIndex(this, col);
    if (viewCol < 0) {
      return false;
    }
    return FabGrid.prototype._scrollVisibleIntoView.call(this, row, viewCol, options);
  };

  FabGrid.prototype._scrollVisibleIntoView = function(row, col, options) {
    var rowTop = row * this.options.rowHeight;
    var rowBottom = rowTop + this.options.rowHeight;
    var colObj = this.visibleColumns[col];
    var contentHeight = this.getScrollableContentHeight();
    var currentTop = this.bodyScroll.scrollTop;
    var currentBottom = currentTop + contentHeight;
    var lastFullRowTop = currentBottom - this.options.rowHeight;
    var partialBottomHeight;
    var maxScrollTop;
    if (!colObj) {
      return false;
    }
    options = options || {};
    if (options.alignY === 'start') {
      maxScrollTop = Math.max(0, this.bodyScroll.scrollHeight - this.bodyScroll.clientHeight);
      this.bodyScroll.scrollTop = Math.min(rowTop, maxScrollTop);
    } else if (options.directionY > 0 && rowTop >= lastFullRowTop) {
      this.bodyScroll.scrollTop = Math.max(0, rowBottom - contentHeight);
    } else if (rowTop < currentTop) {
      this.bodyScroll.scrollTop = rowTop;
    } else if (rowBottom > currentBottom) {
      this.bodyScroll.scrollTop = rowBottom - contentHeight;
    } else if (options.directionY > 0 && contentHeight > this.options.rowHeight) {
      partialBottomHeight = currentBottom - rowBottom;
      if (partialBottomHeight > 0 && partialBottomHeight < this.options.rowHeight) {
        this.bodyScroll.scrollTop = Math.max(0, rowBottom - contentHeight);
      }
    }
    adjustColumnScrollIntoView(this, col);
    this.render();
    return true;
  };

  FabGrid.prototype.getAutoSizeCanvasContext = function() {
    var style;
    var font;
    if (!this._autoSizeCanvas) {
      this._autoSizeCanvas = document.createElement('canvas');
      this._autoSizeContext = this._autoSizeCanvas.getContext && this._autoSizeCanvas.getContext('2d');
    }
    if (!this._autoSizeContext) {
      return null;
    }
    style = window.getComputedStyle(this.root);
    font = style.font;
    if (!font || font === 'normal normal normal normal medium / normal serif') {
      font = [
        style.fontStyle || 'normal',
        style.fontWeight || '400',
        style.fontSize || '14px',
        style.fontFamily || 'sans-serif'
      ].join(' ');
    }
    this._autoSizeContext.font = font;
    return this._autoSizeContext;
  };

  FabGrid.prototype.measureAutoSizeText = function(text, context) {
    var normalized = String(text == null ? '' : text).replace(/\s+/g, ' ');
    var style;
    var fontSize;
    if (context && typeof context.measureText === 'function') {
      return context.measureText(normalized).width;
    }
    style = window.getComputedStyle(this.root);
    fontSize = Math.max(1, parseFloat(style.fontSize) || 14);
    return normalized.length * fontSize * 0.6;
  };

  FabGrid.prototype.getAutoSizeColumnWidth = function(column) {
    var context = this.getAutoSizeCanvasContext();
    var editorConfig = getColumnEditorConfig(column);
    var cellExtraWidth = editorConfig.type === 'color' && typeof column.formatter !== 'function' ? 35 : 15;
    var width = this.measureAutoSizeText(this.getHeaderCellText(column), context) + 35;
    var footerText;
    var item;
    var value;
    var text;
    var i;
    var r;
    for (i = 0; i < this.view.length; i += 1) {
      item = this.view[i];
      if (this.isRowGroup(item)) {
        if (!column.aggregate) {
          continue;
        }
        value = this.getRowGroupAggregateValue(item, column);
        text = this.formatAggregateValue(value, column, item.items);
      } else {
        value = this.isRowGroupFooter(item) ?
          this.getRowGroupFooterValue(item, column) :
          getByBinding(item, column.binding);
        text = this.getCellDisplayText(item, column, value);
      }
      width = Math.max(width, this.measureAutoSizeText(text, context) + cellExtraWidth + this.getTreeAutoSizeExtra(item, column));
    }
    if (this.options.showFooter === true) {
      for (r = 0; r < this.getFooterRowCount(); r += 1) {
        footerText = this.getFooterCellText(r, column);
        width = Math.max(width, this.measureAutoSizeText(footerText, context) + 21);
      }
    }
    return Math.max(getColumnMinWidth(this), Math.ceil(width));
  };

  FabGrid.prototype.autoSizeColumn = function(column) {
    var target = typeof column === 'object' ? column : this.getColumn(column);
    var previousConfiguredWidth;
    var previousWidth;
    var args;
    var width;
    if (!target || this.columns.indexOf(target) < 0) {
      return false;
    }
    previousConfiguredWidth = target.width;
    previousWidth = target._width;
    args = {
      column: target,
      previousWidth: previousWidth,
      width: this.getAutoSizeColumnWidth(target)
    };
    if (this.emit('autoSizingColumn', args) === false) {
      return false;
    }
    width = Math.max(getColumnMinWidth(this), toNumber(args.width, previousWidth));
    target._width = width;
    target.width = width;
    if (this.updateLayout() === false) {
      target._width = previousWidth;
      target.width = previousConfiguredWidth;
      return false;
    }
    this.render();
    this.emit('autoSizedColumn', {
      column: target,
      previousWidth: previousWidth,
      width: width
    });
    return width;
  };

  FabGrid.prototype.startResize = function(event, colIndex) {
    var column = this.visibleColumns[colIndex];
    if (!column) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.target && event.target.setPointerCapture && event.pointerId != null) {
      event.target.setPointerCapture(event.pointerId);
    }
    this.resizeState = {
      column: column,
      startX: event.clientX,
      startWidth: column._width,
      hasResized: false,
      pointerId: event.pointerId
    };
    this.bindPointerInteractionEvents();
    document.body.classList.add('fg-resizing-active');
  };

  FabGrid.prototype.handlePointerMove = function(event) {
    var state = this.resizeState;
    var previousConfiguredWidth;
    var previousWidth;
    var width;
    if (this.updateCellRangeDrag(event)) {
      return;
    }
    if (!state) {
      this.updateColumnDrag(event);
      return;
    }
    event.preventDefault();
    width = Math.max(getColumnMinWidth(this), state.startWidth + event.clientX - state.startX);
    if (this.emit('resizingColumn', { column: state.column, width: width }) === false) {
      return;
    }
    previousConfiguredWidth = state.column.width;
    previousWidth = state.column._width;
    state.column._width = width;
    state.column.width = width;
    if (this.updateLayout() === false) {
      state.column._width = previousWidth;
      state.column.width = previousConfiguredWidth;
      return;
    }
    state.hasResized = state.hasResized || width !== state.startWidth;
    this.render();
  };

  FabGrid.prototype.handlePointerUp = function(event) {
    if (this.finishCellRangeDrag(event)) {
      this.unbindPointerInteractionEvents();
      return;
    }
    if (!this.resizeState) {
      if (this.finishColumnDrag(event)) {
        this.unbindPointerInteractionEvents();
      }
      return;
    }
    if (this.resizeState.pointerId != null && event.pointerId != null && this.resizeState.pointerId !== event.pointerId) {
      return;
    }
    if (this.resizeState.hasResized) {
      this.emit('resizedColumn', { column: this.resizeState.column });
    }
    this.suppressClick = true;
    this.resizeState = null;
    document.body.classList.remove('fg-resizing-active');
    this.unbindPointerInteractionEvents();
  };

  FabGrid.prototype.getCellData = function(row, col) {
    var item = this.view[row];
    var columnIndex = getColumnIndex(this, col);
    var column = columnIndex >= 0 ? this.columns[columnIndex] : null;
    if (!column || this.isRowGroup(item)) {
      return undefined;
    }
    if (this.isRowGroupFooter(item)) {
      return this.getRowGroupFooterValue(item, column);
    }
    return item && column ? getByBinding(item, column.binding) : undefined;
  };

  FabGrid.prototype.setCellData = function(row, col, value) {
    var item = this.view[row];
    var columnIndex = getColumnIndex(this, col);
    var column = columnIndex >= 0 ? this.columns[columnIndex] : null;
    if (!item || !column || !isSafeBinding(column.binding) || this.isRowGroup(item) || this.isRowGroupFooter(item)) {
      return false;
    }
    this._suppressObservedItemChange += 1;
    try {
      setByBinding(item, column.binding, parseValue(getExplicitEditorMask(column) ?
        getMaskDataValue(value, getMaskOptions(column, getExplicitEditorMask(column))) :
        value, column.dataType));
    } finally {
      this._suppressObservedItemChange -= 1;
    }
    if (typeof this._invalidateFooterAggregateCache === 'function') {
      this._invalidateFooterAggregateCache();
    }
    if (!this.refreshCollectionView()) {
      this.applyView();
      this.render();
    }
    return true;
  };

  FabGrid.prototype._getColumnIndex = function(value) {
    return getColumnIndex(this, value);
  };

  FabGrid.prototype.getColumn = function(value) {
    var i;
    var columnIndex = FabGrid.prototype._getColumnIndex.call(this, value);
    if (columnIndex >= 0) {
      return this.columns[columnIndex];
    }
    for (i = 0; i < this.columns.length; i += 1) {
      if (this.columns[i].binding === value || this.columns[i].header === value || this.columns[i].name === value) {
        return this.columns[i];
      }
    }
    return null;
  };

  FabGrid.prototype.getClipString = function() {
    return this.getSelectedText();
  };

  FabGrid.prototype.setClipString = function(text) {
    return this.setCellData(
      this.selection.row,
      getFullColumnIndex(this, this.selection.col),
      text
    );
  };

  FabGrid.prototype.selectAll = function() {
    this.rowSelection = null;
    this._rowSelectionCleared = true;
    this._rowHeaderSelection = null;
    this.selection = { row: 0, col: 0 };
    this.selectionAnchor = { row: 0, col: 0 };
    this.emit('selectionChanged', Object.assign(
      this.getSelectionEventArgs(0, 0, 0, 0),
      { selected: true, allRows: true }
    ));
    this.raiseSelectedRowChanged('selection');
    this.render();
  };
}
