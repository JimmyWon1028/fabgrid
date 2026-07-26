function CollectionViewEvent(sender) {
  this.sender = sender;
  this.handlers = [];
}

CollectionViewEvent.prototype.addHandler = function(handler, self) {
  if (typeof handler === 'function') {
    this.handlers.push({ handler: handler, self: self || null });
  }
  return this;
};

CollectionViewEvent.prototype.removeHandler = function(handler, self) {
  var hasSelf = arguments.length > 1;
  this.handlers = this.handlers.filter(function(record) {
    return record.handler !== handler || hasSelf && record.self !== self;
  });
  return this;
};

CollectionViewEvent.prototype.raise = function(sender, args) {
  var cancelled = false;
  this.handlers.slice().forEach(function(record) {
    if (record.handler.call(record.self || sender, sender, args || {}) === false) {
      cancelled = true;
    }
  });
  return !cancelled;
};

CollectionViewEvent.prototype.clearHandlers = function() {
  this.handlers.length = 0;
};

export function isCollectionView(value) {
  return Boolean(
    value &&
    value.__fabuiCollectionView === true &&
    Array.isArray(value.sourceCollection) &&
    Array.isArray(value.items) &&
    value.collectionChanged &&
    typeof value.collectionChanged.addHandler === 'function'
  );
}

export function CollectionView(sourceCollection, options) {
  options = options || {};
  this.__fabuiCollectionView = true;
  this._sourceCollection = Array.isArray(sourceCollection) ? sourceCollection : [];
  this._filter = typeof options.filter === 'function' ? options.filter : null;
  this._consumerFilters = [];
  this._consumerSorters = [];
  this._updating = 0;
  this._pendingRefresh = false;
  this._initialized = false;
  this.items = [];
  this.currentItem = null;
  this.currentPosition = -1;
  this.collectionChanged = new CollectionViewEvent(this);
  this.currentChanging = new CollectionViewEvent(this);
  this.currentChanged = new CollectionViewEvent(this);
  this.refresh();
  if (options.currentPosition != null) {
    this.moveCurrentToPosition(options.currentPosition);
  }
}

Object.defineProperties(CollectionView.prototype, {
  sourceCollection: {
    enumerable: true,
    get: function() {
      return this._sourceCollection;
    },
    set: function(value) {
      this._sourceCollection = Array.isArray(value) ? value : [];
      this.refresh();
    }
  },
  filter: {
    enumerable: true,
    get: function() {
      return this._filter;
    },
    set: function(value) {
      this._filter = typeof value === 'function' ? value : null;
      this.refresh();
    }
  },
  itemCount: {
    enumerable: true,
    get: function() {
      return this.items.length;
    }
  },
  isEmpty: {
    enumerable: true,
    get: function() {
      return this.items.length === 0;
    }
  },
  isUpdating: {
    enumerable: true,
    get: function() {
      return this._updating > 0;
    }
  }
});

CollectionView.prototype.refresh = function() {
  var previousItem = this.currentItem;
  var previousPosition = this.currentPosition;
  var filters = this._consumerFilters.map(function(record) {
    return record.filter;
  });
  var publicFilter = this._filter;
  var nextPosition;
  if (this._updating > 0) {
    this._pendingRefresh = true;
    return this;
  }
  this.items = this._sourceCollection.filter(function(item, index) {
    var i;
    if (publicFilter && publicFilter(item, index) !== true) {
      return false;
    }
    for (i = 0; i < filters.length; i += 1) {
      if (filters[i](item, index) !== true) {
        return false;
      }
    }
    return true;
  });
  this._consumerSorters.forEach(function(record) {
    var sortedItems = record.sorter(this.items.slice());
    if (Array.isArray(sortedItems)) {
      this.items = sortedItems;
    }
  }, this);
  nextPosition = previousItem == null ? -1 : this.items.indexOf(previousItem);
  if (!this._initialized && nextPosition < 0 && this.items.length) {
    nextPosition = 0;
  }
  if (nextPosition < 0 && this.items.length) {
    nextPosition = 0;
  }
  this.currentPosition = nextPosition;
  this.currentItem = nextPosition < 0 ? null : this.items[nextPosition];
  this._initialized = true;
  this.collectionChanged.raise(this, {
    action: 'reset',
    items: this.items,
    sourceCollection: this._sourceCollection
  });
  if (this.currentItem !== previousItem || this.currentPosition !== previousPosition) {
    this.currentChanged.raise(this, {
      item: this.currentItem,
      position: this.currentPosition,
      previousItem: previousItem,
      previousPosition: previousPosition
    });
  }
  return this;
};

CollectionView.prototype.beginUpdate = function() {
  this._updating += 1;
};

CollectionView.prototype.endUpdate = function(force) {
  if (this._updating > 0) {
    this._updating -= 1;
  }
  if (this._updating === 0 && (this._pendingRefresh || force === true)) {
    this._pendingRefresh = false;
    this.refresh();
  }
};

CollectionView.prototype.deferUpdate = function(callback, force) {
  this.beginUpdate();
  try {
    if (typeof callback === 'function') {
      callback();
    }
  } finally {
    this.endUpdate(force);
  }
};

CollectionView.prototype.contains = function(item) {
  return this.items.indexOf(item) >= 0;
};

CollectionView.prototype.moveCurrentToPosition = function(position) {
  var args;
  var previousItem = this.currentItem;
  var previousPosition = this.currentPosition;
  position = Number(position);
  if (!isFinite(position) || Math.floor(position) !== position || position < -1 || position >= this.items.length) {
    return false;
  }
  if (position === previousPosition) {
    return true;
  }
  args = {
    item: position < 0 ? null : this.items[position],
    position: position,
    previousItem: previousItem,
    previousPosition: previousPosition,
    cancel: false
  };
  if (this.currentChanging.raise(this, args) === false || args.cancel === true) {
    return false;
  }
  this.currentPosition = position;
  this.currentItem = args.item;
  this.currentChanged.raise(this, args);
  return true;
};

CollectionView.prototype.moveCurrentTo = function(item) {
  var position = this.items.indexOf(item);
  return position < 0 ? false : this.moveCurrentToPosition(position);
};

CollectionView.prototype.moveCurrentToFirst = function() {
  return this.moveCurrentToPosition(this.items.length ? 0 : -1);
};

CollectionView.prototype.moveCurrentToLast = function() {
  return this.moveCurrentToPosition(this.items.length ? this.items.length - 1 : -1);
};

CollectionView.prototype.moveCurrentToNext = function() {
  if (this.currentPosition >= this.items.length - 1) {
    return false;
  }
  return this.moveCurrentToPosition(this.currentPosition + 1);
};

CollectionView.prototype.moveCurrentToPrevious = function() {
  if (this.currentPosition <= 0) {
    return false;
  }
  return this.moveCurrentToPosition(this.currentPosition - 1);
};

CollectionView.prototype._setConsumerFilter = function(owner, filter) {
  var index = -1;
  var i;
  for (i = 0; i < this._consumerFilters.length; i += 1) {
    if (this._consumerFilters[i].owner === owner) {
      index = i;
      break;
    }
  }
  if (typeof filter === 'function') {
    if (index < 0) {
      this._consumerFilters.push({ owner: owner, filter: filter });
    } else {
      this._consumerFilters[index].filter = filter;
    }
  } else if (index >= 0) {
    this._consumerFilters.splice(index, 1);
  }
  this.refresh();
  return this;
};

CollectionView.prototype._setConsumerSort = function(owner, sorter) {
  var index = -1;
  var i;
  for (i = 0; i < this._consumerSorters.length; i += 1) {
    if (this._consumerSorters[i].owner === owner) {
      index = i;
      break;
    }
  }
  if (typeof sorter === 'function') {
    if (index < 0) {
      this._consumerSorters.push({ owner: owner, sorter: sorter });
    } else {
      this._consumerSorters[index].sorter = sorter;
    }
  } else if (index >= 0) {
    this._consumerSorters.splice(index, 1);
  }
  this.refresh();
  return this;
};

CollectionView.prototype.dispose = function() {
  this._consumerFilters.length = 0;
  this._consumerSorters.length = 0;
  this.collectionChanged.clearHandlers();
  this.currentChanging.clearHandlers();
  this.currentChanged.clearHandlers();
};
