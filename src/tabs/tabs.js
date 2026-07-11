export function createTabsFactory() {
  'use strict';

  var defaults = {
    width: 'auto',
    height: 'auto',
    fit: false,
    border: true,
    plain: false,
    narrow: false,
    pill: false,
    justified: false,
    tabPosition: 'top',
    tabWidth: 'auto',
    tabHeight: 28,
    selected: 0,
    locale: 'en',
    showHeader: true,
    tools: [],
    tabs: [],
    onBeforeSelect: null,
    onSelect: null,
    onUnselect: null,
    onBeforeClose: null,
    onClose: null,
    onAdd: null,
    onUpdate: null,
    onLoad: null
  };
  var localePacks = {
    en: {
      untitled: 'Untitled',
      previous: 'Previous tabs',
      next: 'Next tabs',
      close: 'Close {title}',
      tool: 'Tab tool {index}',
      loadError: 'Unable to load tab content: {status}'
    },
    'zh-TW': {
      untitled: '未命名',
      previous: '上一組頁籤',
      next: '下一組頁籤',
      close: '關閉 {title}',
      tool: '頁籤工具 {index}',
      loadError: '無法載入頁籤內容：{status}'
    },
    'zh-CN': {
      untitled: '未命名',
      previous: '上一组页签',
      next: '下一组页签',
      close: '关闭 {title}',
      tool: '页签工具 {index}',
      loadError: '无法加载页签内容：{status}'
    }
  };

  function assign(target) {
    var source;
    var key;
    var i;
    for (i = 1; i < arguments.length; i += 1) {
      source = arguments[i] || {};
      for (key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
      }
    }
    return target;
  }

  function resolveElement(element) {
    return typeof element === 'string' ? document.querySelector(element) : element;
  }

  function cssSize(value) {
    if (value == null || value === '' || value === 'auto') return 'auto';
    return typeof value === 'number' ? value + 'px' : String(value);
  }

  function normalizePosition(value) {
    value = String(value || 'top').toLowerCase();
    return ['top', 'bottom', 'left', 'right'].indexOf(value) >= 0 ? value : 'top';
  }

  function normalizeLocale(value) {
    value = String(value || 'en');
    return localePacks[value] ? value : 'en';
  }

  function formatText(text, values) {
    return String(text || '').replace(/\{([^}]+)\}/g, function(match, key) {
      return values && values[key] != null ? values[key] : match;
    });
  }

  function readBoolean(element, name, fallback) {
    var value = element.getAttribute(name);
    if (value == null) return fallback;
    return value === '' || value === name || value === 'true' || value === '1';
  }

  function Tabs(element, options) {
    var children;
    var configuredTabs;
    var i;
    if (!(this instanceof Tabs)) return new Tabs(element, options);
    this.element = resolveElement(element);
    if (!this.element || this.element.nodeType !== 1) {
      throw new Error('fabui.Tabs requires a container element.');
    }
    if (this.element.__fabuiTabs) return this.element.__fabuiTabs;
    this._listeners = {};
    this._tabs = [];
    this._selectedIndex = -1;
    this._destroyed = false;
    this._originalClassName = this.element.className;
    this._originalStyle = this.element.getAttribute('style');
    this._options = assign({}, defaults, options || {});
    this._options.tabPosition = normalizePosition(this._options.tabPosition);
    this._options.locale = normalizeLocale(this._options.locale);
    children = Array.prototype.slice.call(this.element.children);
    this._build();
    for (i = 0; i < children.length; i += 1) {
      this._appendExistingPanel(children[i]);
    }
    configuredTabs = Array.isArray(this._options.tabs) ? this._options.tabs : [];
    for (i = 0; i < configuredTabs.length; i += 1) {
      this.add(assign({}, configuredTabs[i], { selected: false }), true);
    }
    this._renderTools();
    this._applyOptions();
    if (this._tabs.length) this.select(this._options.selected, true);
    this.element.__fabuiTabs = this;
  }

  Tabs.prototype._build = function() {
    var header = document.createElement('div');
    var previous = document.createElement('button');
    var next = document.createElement('button');
    var viewport = document.createElement('div');
    var list = document.createElement('div');
    var tools = document.createElement('div');
    var panels = document.createElement('div');
    this.element.textContent = '';
    this.element.className = (this._originalClassName ? this._originalClassName + ' ' : '') + 'fui-tabs';
    header.className = 'fui-tabs-header';
    previous.type = 'button';
    previous.className = 'fui-tabs-scroll fui-tabs-scroll-prev';
    previous.setAttribute('aria-label', this._getText('previous'));
    previous.textContent = '‹';
    next.type = 'button';
    next.className = 'fui-tabs-scroll fui-tabs-scroll-next';
    next.setAttribute('aria-label', this._getText('next'));
    next.textContent = '›';
    viewport.className = 'fui-tabs-viewport';
    list.className = 'fui-tabs-list';
    list.setAttribute('role', 'tablist');
    tools.className = 'fui-tabs-tools';
    panels.className = 'fui-tabs-panels';
    viewport.appendChild(list);
    header.appendChild(previous);
    header.appendChild(viewport);
    header.appendChild(next);
    header.appendChild(tools);
    this.element.appendChild(header);
    this.element.appendChild(panels);
    this.header = header;
    this.previousButton = previous;
    this.nextButton = next;
    this.viewport = viewport;
    this.list = list;
    this.tools = tools;
    this.panels = panels;
    this._bind();
  };

  Tabs.prototype._bind = function() {
    var self = this;
    this._onTabClick = function(event) {
      var close = event.target.closest('.fui-tabs-close');
      var tab = event.target.closest('.fui-tabs-tab');
      var index;
      if (!tab || !self.list.contains(tab)) return;
      index = Number(tab.getAttribute('data-index'));
      if (close) {
        event.preventDefault();
        event.stopPropagation();
        self.close(index);
        return;
      }
      self.select(index);
    };
    this._onTabKeyDown = function(event) {
      var tab = event.target.closest('.fui-tabs-tab');
      var index;
      var nextIndex;
      if (!tab) return;
      index = Number(tab.getAttribute('data-index'));
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = self._findEnabled(index, 1);
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = self._findEnabled(index, -1);
      if (event.key === 'Home') nextIndex = self._findEnabled(-1, 1);
      if (event.key === 'End') nextIndex = self._findEnabled(0, -1);
      if (event.key === 'Delete' && self._tabs[index] && self._tabs[index].options.closable) {
        event.preventDefault();
        self.close(index);
        return;
      }
      if (nextIndex != null && nextIndex >= 0) {
        event.preventDefault();
        self.select(nextIndex);
        self._tabs[nextIndex].tab.focus();
      }
    };
    this._onPrevious = function() { self._scrollTabs(-120); };
    this._onNext = function() { self._scrollTabs(120); };
    this._onResize = function() { self._syncOverflow(); };
    this.list.addEventListener('click', this._onTabClick);
    this.list.addEventListener('keydown', this._onTabKeyDown);
    this.previousButton.addEventListener('click', this._onPrevious);
    this.nextButton.addEventListener('click', this._onNext);
    window.addEventListener('resize', this._onResize);
  };

  Tabs.prototype._appendExistingPanel = function(panel) {
    var options = {
      title: panel.getAttribute('title') || panel.getAttribute('data-title') || 'Tab ' + (this._tabs.length + 1),
      closable: readBoolean(panel, 'data-closable', false),
      disabled: readBoolean(panel, 'data-disabled', false),
      iconCls: panel.getAttribute('data-icon-cls') || '',
      selected: readBoolean(panel, 'data-selected', false),
      href: panel.getAttribute('data-href') || ''
    };
    panel.removeAttribute('title');
    this._createRecord(panel, options);
    if (options.selected) this._options.selected = this._tabs.length - 1;
  };

  Tabs.prototype._createRecord = function(panel, options) {
    var record = { panel: panel, options: assign({
      title: this._getText('untitled'),
      closable: false,
      disabled: false,
      iconCls: '',
      selected: false,
      tabWidth: null,
      href: '',
      content: null,
      tools: []
    }, options || {}), loaded: false };
    panel.classList.add('fui-tabs-panel');
    panel.setAttribute('role', 'tabpanel');
    panel.hidden = true;
    this.panels.appendChild(panel);
    this._tabs.push(record);
    this._renderRecord(record, this._tabs.length - 1);
    this._syncIndexes();
    return record;
  };

  Tabs.prototype._renderRecord = function(record, index) {
    var tab = record.tab || document.createElement('button');
    var icon;
    var title;
    var close;
    tab.type = 'button';
    tab.className = 'fui-tabs-tab';
    tab.setAttribute('role', 'tab');
    tab.textContent = '';
    if (record.options.iconCls) {
      icon = document.createElement('span');
      icon.className = 'fui-tabs-icon ' + record.options.iconCls;
      tab.appendChild(icon);
    }
    title = document.createElement('span');
    title.className = 'fui-tabs-title';
    title.textContent = record.options.title;
    tab.appendChild(title);
    if (record.options.closable) {
      close = document.createElement('span');
      close.className = 'fui-tabs-close';
      close.setAttribute('aria-label', formatText(this._getText('close'), { title: record.options.title }));
      close.textContent = '×';
      tab.appendChild(close);
    }
    tab.disabled = Boolean(record.options.disabled);
    tab.classList.toggle('fui-tabs-disabled', Boolean(record.options.disabled));
    tab.style.width = cssSize(record.options.tabWidth != null ? record.options.tabWidth : this._options.tabWidth);
    tab.style.height = cssSize(this._options.tabHeight);
    tab.style.lineHeight = cssSize(this._options.tabHeight);
    tab.setAttribute('data-index', index);
    tab.id = this._getId() + '-tab-' + index;
    record.panel.id = record.panel.id || this._getId() + '-panel-' + index;
    tab.setAttribute('aria-controls', record.panel.id);
    record.panel.setAttribute('aria-labelledby', tab.id);
    if (!record.tab) this.list.appendChild(tab);
    record.tab = tab;
    tab.classList.toggle('fui-tabs-selected', index === this._selectedIndex);
    tab.setAttribute('aria-selected', index === this._selectedIndex ? 'true' : 'false');
    tab.tabIndex = index === this._selectedIndex ? 0 : -1;
    record.panel.hidden = index !== this._selectedIndex;
  };

  Tabs.prototype._getId = function() {
    if (!this._id) this._id = 'fui-tabs-' + Tabs._nextId++;
    return this._id;
  };

  Tabs.prototype._applyOptions = function() {
    var position = normalizePosition(this._options.tabPosition);
    this._options.tabPosition = position;
    this.element.classList.toggle('fui-tabs-borderless', this._options.border === false);
    this.element.classList.toggle('fui-tabs-plain', Boolean(this._options.plain));
    this.element.classList.toggle('fui-tabs-narrow', Boolean(this._options.narrow));
    this.element.classList.toggle('fui-tabs-pill', Boolean(this._options.pill));
    this.element.classList.toggle('fui-tabs-justified', Boolean(this._options.justified));
    this.element.classList.remove('fui-tabs-top', 'fui-tabs-bottom', 'fui-tabs-left', 'fui-tabs-right');
    this.element.classList.add('fui-tabs-' + position);
    this.header.hidden = this._options.showHeader === false;
    this.element.insertBefore(this.header, this.panels);
    this.resize(this._options.width, this._options.height);
    this._tabs.forEach(function(record, index) {
      this._renderRecord(record, index);
    }, this);
    this._syncOverflow();
  };

  Tabs.prototype._renderTools = function() {
    var self = this;
    var tools = Array.isArray(this._options.tools) ? this._options.tools : [];
    this.tools.textContent = '';
    tools.forEach(function(tool, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'fui-tabs-tool' + (tool.iconCls ? ' ' + tool.iconCls : '');
      button.title = tool.title || '';
      button.setAttribute('aria-label', tool.title || formatText(self._getText('tool'), { index: index + 1 }));
      if (tool.text) button.textContent = tool.text;
      button.addEventListener('click', function(event) {
        if (typeof tool.onClick === 'function') {
          event.data = { target: self.element, tabs: self, index: index, tool: button };
          tool.onClick.call(self, event);
        }
      });
      self.tools.appendChild(button);
    });
    this.tools.hidden = tools.length === 0;
  };

  Tabs.prototype._syncIndexes = function() {
    this._tabs.forEach(function(record, index) {
      record.tab.setAttribute('data-index', index);
      record.tab.id = this._getId() + '-tab-' + index;
      record.panel.setAttribute('aria-labelledby', record.tab.id);
    }, this);
  };

  Tabs.prototype._resolveIndex = function(which) {
    var i;
    if (typeof which === 'number' && isFinite(which)) return which >= 0 && which < this._tabs.length ? which : -1;
    if (typeof which === 'string') {
      for (i = 0; i < this._tabs.length; i += 1) {
        if (this._tabs[i].options.title === which) return i;
      }
    }
    for (i = 0; i < this._tabs.length; i += 1) {
      if (this._tabs[i] === which || this._tabs[i].panel === which || this._tabs[i].tab === which) return i;
    }
    return -1;
  };

  Tabs.prototype._findEnabled = function(start, direction) {
    var length = this._tabs.length;
    var i;
    var index;
    if (!length) return -1;
    for (i = 1; i <= length; i += 1) {
      index = (start + direction * i + length) % length;
      if (!this._tabs[index].options.disabled) return index;
    }
    return -1;
  };

  Tabs.prototype._load = function(record) {
    var self = this;
    if (!record.options.href || record.loaded) return;
    record.panel.classList.add('fui-tabs-loading');
    fetch(record.options.href, { method: record.options.method || 'GET' }).then(function(response) {
      if (!response.ok) throw new Error(formatText(self._getText('loadError'), { status: response.status }));
      return response.text();
    }).then(function(html) {
      record.panel.innerHTML = html;
      record.loaded = true;
      record.panel.classList.remove('fui-tabs-loading');
      self._invoke('onLoad', record.panel, record.options.title);
      self._emit('load', { tab: record.panel, title: record.options.title });
    }).catch(function(error) {
      record.panel.classList.remove('fui-tabs-loading');
      record.panel.textContent = error.message;
    });
  };

  Tabs.prototype._scrollTabs = function(distance) {
    this.viewport.scrollLeft += distance;
    this._syncOverflow();
  };

  Tabs.prototype._syncOverflow = function() {
    var overflows;
    if (!this.viewport || this._destroyed) return;
    overflows = this.viewport.scrollWidth > this.viewport.clientWidth + 1;
    this.element.classList.toggle('fui-tabs-overflow', overflows);
    this.previousButton.disabled = !overflows || this.viewport.scrollLeft <= 0;
    this.nextButton.disabled = !overflows || this.viewport.scrollLeft + this.viewport.clientWidth >= this.viewport.scrollWidth - 1;
  };

  Tabs.prototype._invoke = function(name) {
    var callback = this._options[name];
    if (typeof callback === 'function') return callback.apply(this, Array.prototype.slice.call(arguments, 1));
    return undefined;
  };

  Tabs.prototype._getText = function(key) {
    var locale = localePacks[normalizeLocale(this._options && this._options.locale)] || localePacks.en;
    return locale[key] == null ? localePacks.en[key] : locale[key];
  };

  Tabs.prototype._emit = function(name, detail) {
    (this._listeners[name] || []).slice().forEach(function(listener) { listener(detail); });
  };

  Tabs.prototype.on = function(name, listener) {
    if (typeof listener !== 'function') return this;
    if (!this._listeners[name]) this._listeners[name] = [];
    this._listeners[name].push(listener);
    return this;
  };

  Tabs.prototype.off = function(name, listener) {
    var list = this._listeners[name] || [];
    var index = list.indexOf(listener);
    if (index >= 0) list.splice(index, 1);
    return this;
  };

  Tabs.prototype.select = function(which, silent) {
    var index = this._resolveIndex(which);
    var current = this._tabs[this._selectedIndex];
    var next = this._tabs[index];
    if (!next || next.options.disabled || index === this._selectedIndex) return next ? next.panel : null;
    if (!silent && this._invoke('onBeforeSelect', next.options.title, index, next.panel) === false) return null;
    if (current) {
      current.tab.classList.remove('fui-tabs-selected');
      current.tab.setAttribute('aria-selected', 'false');
      current.tab.tabIndex = -1;
      current.panel.hidden = true;
      if (!silent) this._invoke('onUnselect', current.options.title, this._selectedIndex, current.panel);
    }
    this._selectedIndex = index;
    next.tab.classList.add('fui-tabs-selected');
    next.tab.setAttribute('aria-selected', 'true');
    next.tab.tabIndex = 0;
    next.panel.hidden = false;
    this._load(next);
    if (next.tab.scrollIntoView) next.tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (!silent) {
      this._invoke('onSelect', next.options.title, index, next.panel);
      this._emit('select', { title: next.options.title, index: index, tab: next.panel });
    }
    this._syncOverflow();
    return next.panel;
  };

  Tabs.prototype.add = function(options, silent) {
    var panel = document.createElement('div');
    var record;
    options = assign({}, options || {});
    if (options.content instanceof Node) panel.appendChild(options.content);
    else if (options.content != null) panel.innerHTML = String(options.content);
    record = this._createRecord(panel, options);
    if (options.style && typeof options.style === 'object') assign(panel.style, options.style);
    if (options.selected !== false || this._selectedIndex < 0) this.select(this._tabs.length - 1, silent);
    this._syncOverflow();
    if (!silent) {
      this._invoke('onAdd', options.title, this._tabs.length - 1, panel);
      this._emit('add', { title: options.title, index: this._tabs.length - 1, tab: panel });
    }
    return panel;
  };

  Tabs.prototype.close = function(which) {
    var index = this._resolveIndex(which);
    var record = this._tabs[index];
    var wasSelected = index === this._selectedIndex;
    var nextIndex;
    if (!record) return false;
    if (this._invoke('onBeforeClose', record.options.title, index, record.panel) === false) return false;
    record.tab.remove();
    record.panel.remove();
    this._tabs.splice(index, 1);
    if (wasSelected) this._selectedIndex = -1;
    else if (index < this._selectedIndex) this._selectedIndex -= 1;
    this._syncIndexes();
    if (wasSelected && this._tabs.length) {
      nextIndex = Math.min(index, this._tabs.length - 1);
      if (this._tabs[nextIndex].options.disabled) nextIndex = this._findEnabled(nextIndex, 1);
      if (nextIndex >= 0) this.select(nextIndex, true);
    }
    this._syncOverflow();
    this._invoke('onClose', record.options.title, index);
    this._emit('close', { title: record.options.title, index: index });
    return true;
  };

  Tabs.prototype.update = function(which, options) {
    var index = this._resolveIndex(which);
    var record = this._tabs[index];
    if (!record) return null;
    options = options || {};
    assign(record.options, options);
    if (Object.prototype.hasOwnProperty.call(options, 'content')) {
      record.panel.innerHTML = '';
      if (options.content instanceof Node) record.panel.appendChild(options.content);
      else record.panel.innerHTML = String(options.content == null ? '' : options.content);
    }
    if (Object.prototype.hasOwnProperty.call(options, 'href')) record.loaded = false;
    this._renderRecord(record, index);
    this._invoke('onUpdate', record.options.title, index, record.panel);
    this._emit('update', { title: record.options.title, index: index, tab: record.panel });
    this._syncOverflow();
    return record.panel;
  };

  Tabs.prototype.disableTab = function(which) {
    var index = this._resolveIndex(which);
    if (index < 0) return this;
    this._tabs[index].options.disabled = true;
    this._renderRecord(this._tabs[index], index);
    if (index === this._selectedIndex) {
      index = this._findEnabled(index, 1);
      if (index >= 0) this.select(index);
    }
    return this;
  };

  Tabs.prototype.enableTab = function(which) {
    var index = this._resolveIndex(which);
    if (index < 0) return this;
    this._tabs[index].options.disabled = false;
    this._renderRecord(this._tabs[index], index);
    return this;
  };

  Tabs.prototype.getSelected = function() {
    return this._tabs[this._selectedIndex] ? this._tabs[this._selectedIndex].panel : null;
  };

  Tabs.prototype.getTab = function(which) {
    var index = this._resolveIndex(which);
    return index >= 0 ? this._tabs[index].panel : null;
  };

  Tabs.prototype.getTabIndex = function(tab) {
    return this._resolveIndex(tab);
  };

  Tabs.prototype.getTabs = function() {
    return this._tabs.map(function(record) { return record.panel; });
  };

  Tabs.prototype.exists = function(which) {
    return this._resolveIndex(which) >= 0;
  };

  Tabs.prototype.resize = function(width, height) {
    if (width != null) this._options.width = width;
    if (height != null) this._options.height = height;
    this.element.style.width = this._options.fit ? '100%' : cssSize(this._options.width);
    this.element.style.height = this._options.fit ? '100%' : cssSize(this._options.height);
    this.element.classList.toggle('fui-tabs-auto-height', this.element.style.height === 'auto');
    this._syncOverflow();
    return this;
  };

  Tabs.prototype.setOptions = function(options) {
    assign(this._options, options || {});
    this._options.locale = normalizeLocale(this._options.locale);
    this.previousButton.setAttribute('aria-label', this._getText('previous'));
    this.nextButton.setAttribute('aria-label', this._getText('next'));
    this._renderTools();
    this._applyOptions();
    return this;
  };

  Tabs.prototype.options = function() {
    return this._options;
  };

  Tabs.prototype.destroy = function() {
    var self = this;
    if (this._destroyed) return;
    this._destroyed = true;
    this.list.removeEventListener('click', this._onTabClick);
    this.list.removeEventListener('keydown', this._onTabKeyDown);
    this.previousButton.removeEventListener('click', this._onPrevious);
    this.nextButton.removeEventListener('click', this._onNext);
    window.removeEventListener('resize', this._onResize);
    this._tabs.forEach(function(record) {
      record.panel.hidden = false;
      record.panel.classList.remove('fui-tabs-panel');
      self.element.appendChild(record.panel);
    });
    this.header.remove();
    this.panels.remove();
    this.element.className = this._originalClassName;
    if (this._originalStyle == null) this.element.removeAttribute('style');
    else this.element.setAttribute('style', this._originalStyle);
    delete this.element.__fabuiTabs;
    this._listeners = {};
  };

  Tabs._nextId = 1;
  Tabs.defaults = defaults;
  Tabs.locales = localePacks;
  Tabs.addLocale = function(name, messages) {
    if (name && messages) localePacks[String(name)] = assign({}, localePacks.en, messages);
    return Tabs;
  };
  return Tabs;
}
