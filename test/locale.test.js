import test from 'node:test';
import assert from 'node:assert/strict';

import { createLocaleManager } from '../src/core/locale.js';

function createProbeType() {
  function Probe(element, options) {
    this.element = element;
    this.options = options || {};
    this.locale = this.options.locale;
    this.disposed = false;
  }

  Probe.prototype.setLocale = function(locale) {
    this.locale = locale;
    return this;
  };

  Probe.prototype.dispose = function() {
    this.disposed = true;
  };

  Probe.defaults = { locale: 'en' };
  Probe.locales = {
    en: { label: 'English' }
  };

  return Probe;
}

test('locale manager falls back to English until a requested pack is loaded', function() {
  var manager = createLocaleManager();
  var Probe = manager.registerTarget('Probe', createProbeType());
  var existing = new Probe(null);

  assert.equal(existing.locale, 'en');
  assert.equal(manager.getLocale(), 'en');
  assert.deepEqual(manager.getLocales(), ['en']);
  assert.equal(manager.setLocale('zh_Hant_TW'), 'en');
  assert.equal(existing.locale, 'en');

  manager.addLocale('zh_Hant_TW', {
    Probe: { label: '繁體中文' }
  });
  assert.equal(manager.getLocale(), 'zh-TW');
  assert.deepEqual(manager.getLocales(), ['en', 'zh-TW']);
  assert.equal(Probe.defaults.locale, 'zh-TW');
  assert.equal(Probe.locales['zh-TW'].label, '繁體中文');
  assert.equal(existing.locale, 'zh-TW');
  assert.equal(new Probe(null).locale, 'zh-TW');
});

test('locale manager installs loaded packs into extensions registered later', function() {
  var manager = createLocaleManager();
  var Probe;
  var disposed;

  manager.addLocale('zh-CN', {
    Extension: { label: '简体中文' }
  });
  Probe = manager.registerTarget(
    'Extension',
    createProbeType()
  );
  disposed = new Probe(null);

  assert.equal(Probe.locales['zh-CN'].label, '简体中文');
  assert.equal(disposed.locale, 'zh-CN');
  disposed.dispose();
  manager.setLocale('en');
  assert.equal(disposed.locale, 'zh-CN');
  assert.equal(new Probe(null).locale, 'en');
});
