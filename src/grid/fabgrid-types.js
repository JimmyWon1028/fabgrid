export var CellType = Object.freeze({
  None: 0,
  Cell: 1,
  ColumnHeader: 2,
  RowHeader: 3,
  TopLeft: 4,
  ColumnFooter: 5,
  BottomLeft: 6
});

export function Row(grid, index, dataItem) {
  this.grid = grid || null;
  this.index = index == null ? -1 : index;
  this.dataItem = dataItem;
  this.visible = true;
  this.isReadOnly = false;
}

Object.defineProperties(Row.prototype, {
  dataIndex: {
    get: function() {
      return this.index;
    }
  },
  collectionView: {
    get: function() {
      return this.grid ? this.grid.collectionView : null;
    }
  }
});

export function GroupRow(grid, index, dataItem) {
  Row.call(this, grid, index, dataItem);
}

GroupRow.prototype = Object.create(Row.prototype);
GroupRow.prototype.constructor = GroupRow;

Object.defineProperties(GroupRow.prototype, {
  level: {
    get: function() {
      return this.dataItem && this.dataItem.level != null ? this.dataItem.level : 0;
    }
  },
  hasChildren: {
    get: function() {
      return !!(this.dataItem && this.dataItem.__fgRowType === 'group' &&
        this.dataItem.items && this.dataItem.items.length);
    }
  },
  isCollapsed: {
    get: function() {
      return !!(this.dataItem && this.dataItem.__fgRowType === 'group' && this.dataItem.collapsed);
    }
  },
  isGroupFooter: {
    get: function() {
      return !!(this.dataItem && this.dataItem.__fgRowType === 'groupFooter');
    }
  }
});

export function createGridPanel(grid, cellType) {
  var panel = {
    grid: grid,
    cellType: cellType,
    getCellData: function(row, col, formatted) {
      return grid.getPanelCellData(panel, row, col, formatted === true);
    }
  };

  Object.defineProperties(panel, {
    rows: {
      get: function() {
        return grid.rows;
      }
    },
    columns: {
      get: function() {
        return grid.columns;
      }
    }
  });

  return panel;
}
