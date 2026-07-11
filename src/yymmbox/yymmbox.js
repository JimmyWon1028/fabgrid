export function createYymmBoxFactory(DateBox, editorDefinitions) {
  'use strict';

  if (typeof DateBox !== 'function') {
    throw new Error('fabui.YymmBox requires fabui.DateBox.');
  }

  editorDefinitions = editorDefinitions || {};
  var editorDefinition = editorDefinitions.yymmbox || null;

  function assign(target) {
    var index;
    var source;
    var key;
    for (index = 1; index < arguments.length; index += 1) {
      source = arguments[index] || {};
      for (key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
      }
    }
    return target;
  }

  function resolveElement(element) {
    return typeof element === 'string' ? document.querySelector(element) : element;
  }

  function YymmBox(element, options) {
    var source;
    var yymmOptions;
    if (!(this instanceof YymmBox)) return new YymmBox(element, options);
    source = resolveElement(element);
    if (!source || !/^(INPUT|TEXTAREA)$/.test(source.tagName)) {
      throw new Error('fabui.YymmBox requires an input or textarea element.');
    }
    if (source.__fabuiYymmBox) return source.__fabuiYymmBox;
    yymmOptions = assign({
      editorType: 'yymmbox',
      calendarMode: 'months',
      mask: editorDefinition && editorDefinition.mask ? editorDefinition.mask : '9999/99'
    }, options || {});
    DateBox.call(this, source, yymmOptions);
    source.__fabuiYymmBox = this;
  }

  YymmBox.prototype = Object.create(DateBox.prototype);
  YymmBox.prototype.constructor = YymmBox;

  YymmBox.prototype.destroy = function() {
    if (this._source) delete this._source.__fabuiYymmBox;
    return DateBox.prototype.destroy.call(this);
  };

  YymmBox.defaults = assign({}, DateBox.defaults || {}, {
    editorType: 'yymmbox',
    calendarMode: 'months',
    mask: editorDefinition && editorDefinition.mask ? editorDefinition.mask : '9999/99'
  });
  YymmBox.editorDefinition = editorDefinition;
  YymmBox.locales = DateBox.locales;
  YymmBox.addLocale = function(name, pack) {
    DateBox.addLocale(name, pack);
    return YymmBox;
  };

  return YymmBox;
}
