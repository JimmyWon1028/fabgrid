function normalizeLocaleName(value) {
  var name = String(value || 'en').trim().replace(/_/g, '-');
  var lower = name.toLowerCase();
  if (lower === 'zh' || lower === 'zh-tw' || lower === 'zh-hant' ||
      lower === 'zh-hant-tw' || lower === 'tw') {
    return 'zh-TW';
  }
  if (lower === 'zh-cn' || lower === 'zh-hans' ||
      lower === 'zh-hans-cn' || lower === 'cn') {
    return 'zh-CN';
  }
  if (lower === 'en' || lower.indexOf('en-') === 0) {
    return 'en';
  }
  return name || 'en';
}

function mergeLocale(target, source) {
  var index;
  var key;
  target = target || {};
  for (index = 1; index < arguments.length; index += 1) {
    source = arguments[index] || {};
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

function installLocale(target, locale, messages) {
  if (!target || !messages) return;
  if (typeof target.addLocale === 'function') {
    target.addLocale(locale, messages);
    return;
  }
  if (typeof target.extendLocale === 'function') {
    target.extendLocale(locale, messages);
    return;
  }
  if (target.locales) {
    target.locales[locale] = mergeLocale({}, target.locales.en, messages);
  }
}

export function createLocaleManager() {
  var currentLocale = 'en';
  var localePacks = { en: {} };
  var targets = [];
  var instances = new Set();

  function updateTargetLocale(target, locale) {
    if (!target) return;
    if (target.defaults && Object.prototype.hasOwnProperty.call(target.defaults, 'locale')) {
      target.defaults.locale = locale;
    }
    if (typeof target.setDefaultLocale === 'function') {
      target.setDefaultLocale(locale);
    }
    if (typeof target !== 'function' && typeof target.setLocale === 'function') {
      target.setLocale(locale);
    }
  }

  function unregisterInstance(instance) {
    instances.delete(instance);
  }

  function trackInstance(instance) {
    var destroy;
    var dispose;
    if (!instance || typeof instance.setLocale !== 'function' || instances.has(instance)) {
      return instance;
    }
    instances.add(instance);
    destroy = typeof instance.destroy === 'function' ? instance.destroy : null;
    dispose = typeof instance.dispose === 'function' ? instance.dispose : null;
    if (destroy) {
      instance.destroy = function() {
        var result = destroy.apply(this, arguments);
        unregisterInstance(this);
        return result;
      };
    }
    if (dispose && dispose !== destroy) {
      instance.dispose = function() {
        var result = dispose.apply(this, arguments);
        unregisterInstance(this);
        return result;
      };
    }
    return instance;
  }

  function prepareArguments(args) {
    var next = Array.prototype.slice.call(args || []);
    var options = next[1];
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      options = {};
    } else {
      options = mergeLocale({}, options);
    }
    if (!Object.prototype.hasOwnProperty.call(options, 'locale')) {
      options.locale = currentLocale;
    }
    next[1] = options;
    return next;
  }

  function trackType(target) {
    var proxy;
    if (typeof target !== 'function' || typeof Proxy !== 'function') {
      return target;
    }
    proxy = new Proxy(target, {
      apply: function(original, thisArg, args) {
        return trackInstance(Reflect.construct(original, prepareArguments(args), original));
      },
      construct: function(original, args, newTarget) {
        return trackInstance(Reflect.construct(
          original,
          prepareArguments(args),
          newTarget === proxy ? original : newTarget
        ));
      }
    });
    return proxy;
  }

  function registerTarget(name, target, packName) {
    var record;
    var locale;
    var tracked;
    if (!name || !target) return target;
    tracked = trackType(target);
    record = {
      name: String(name),
      packName: String(packName || name),
      target: tracked
    };
    targets.push(record);
    for (locale in localePacks) {
      if (Object.prototype.hasOwnProperty.call(localePacks, locale) &&
          localePacks[locale][record.packName]) {
        installLocale(tracked, locale, localePacks[locale][record.packName]);
      }
    }
    updateTargetLocale(tracked, currentLocale);
    return tracked;
  }

  function addLocale(locale, pack) {
    var name = normalizeLocaleName(locale);
    var index;
    localePacks[name] = mergeLocale(localePacks[name] || {}, pack || {});
    for (index = 0; index < targets.length; index += 1) {
      if (localePacks[name][targets[index].packName]) {
        installLocale(
          targets[index].target,
          name,
          localePacks[name][targets[index].packName]
        );
      }
    }
    setLocale(name);
    return name;
  }

  function setLocale(locale) {
    var name = normalizeLocaleName(locale);
    var activeInstances;
    var index;
    if (!Object.prototype.hasOwnProperty.call(localePacks, name)) {
      name = 'en';
    }
    currentLocale = name;
    for (index = 0; index < targets.length; index += 1) {
      updateTargetLocale(targets[index].target, name);
    }
    activeInstances = Array.from(instances);
    for (index = 0; index < activeInstances.length; index += 1) {
      if (typeof activeInstances[index].setLocale === 'function') {
        activeInstances[index].setLocale(name);
      }
    }
    return currentLocale;
  }

  return {
    addLocale: addLocale,
    getLocale: function() {
      return currentLocale;
    },
    getLocales: function() {
      return Object.keys(localePacks);
    },
    normalizeLocale: normalizeLocaleName,
    registerTarget: registerTarget,
    setLocale: setLocale,
    trackInstance: trackInstance
  };
}
