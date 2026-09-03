import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

var css = readFileSync(new URL('../src/grid/fabgrid.css', import.meta.url), 'utf8');
var viewSource = readFileSync(new URL('../src/grid/fabgrid-view.js', import.meta.url), 'utf8');
var themeDir = new URL('../src/theme/', import.meta.url);

test('narrow headers reduce their outer padding to two pixels', function() {
  var compactRule = css.match(/\.fg-header-title-compact\s*\{[^}]*\}/);
  var filterableRule = css.match(/\.fg-header-title-filterable\.fg-header-title-compact\s*\{[^}]*\}/);

  assert.ok(compactRule);
  assert.ok(filterableRule);
  assert.match(compactRule[0], /padding-right:\s*2px/);
  assert.match(compactRule[0], /padding-left:\s*2px/);
  assert.match(filterableRule[0], /padding-right:\s*20px/);
});

test('header width measurement reserves only the icons that are present', function() {
  assert.match(
    viewSource,
    /headerTextWidth = this\.measureAutoSizeText\(headerText, textMeasureContext\);/
  );
  assert.match(
    viewSource,
    /headerBaseContentWidth = headerTextWidth \+ \(filterMode \? 30 : 20\);/
  );
  assert.match(
    viewSource,
    /headerInlineContentWidth = headerBaseContentWidth \+ \(sortDirection \? 13 : 0\);/
  );
  assert.match(
    viewSource,
    /headerBaseContentWidth > headerAvailableWidth[\s\S]*?fg-header-title-compact/
  );
});

test('sorting keeps normal left padding when text and filter already fit', function() {
  assert.match(
    viewSource,
    /if \(headerBaseContentWidth > headerAvailableWidth\)[\s\S]*?if \(filterMode && sortDirection && headerInlineContentWidth > headerAvailableWidth\)/
  );
  assert.match(css, /\.fg-header-title-filterable\s*\{[^}]*padding:\s*0 24px 0 6px/);
});

test('compact filterable headers keep the filter icon visible at the right edge', function() {
  var rule = css.match(
    /\.fg-header-title-filterable\.fg-header-title-compact \.fg-filter-icon\s*\{[^}]*\}/
  );

  assert.ok(rule);
  assert.match(rule[0], /right:\s*2px/);
  assert.doesNotMatch(css, /fg-header-icons-text-only/);
});

test('compact sorted filterable headers stack sort below filter', function() {
  var rule = css.match(
    /\.fg-header-title-filter-stacked \.fg-sort-wrap\s*\{[^}]*\}/
  );
  var compactRule = css.match(
    /\.fg-header-title-filterable\.fg-header-title-compact\.fg-header-title-filter-stacked \.fg-sort-wrap\s*\{[^}]*\}/
  );
  var filterRule = css.match(/\.fg-header-title-filter-stacked \.fg-filter-icon\s*\{[^}]*\}/);

  assert.ok(rule);
  assert.ok(compactRule);
  assert.ok(filterRule);
  assert.match(rule[0], /position:\s*absolute/);
  assert.match(rule[0], /right:\s*-2px/);
  assert.match(compactRule[0], /right:\s*2px/);
  assert.match(rule[0], /bottom:\s*1px/);
  assert.match(filterRule[0], /top:\s*5px/);
  assert.match(
    viewSource,
    /filterMode && sortDirection[\s\S]*?fg-header-title-filter-stacked/
  );
});

test('filter icons sit two pixels closer to the header edge', function() {
  var iconRule = css.match(/:root \.fg-filter-icon\s*\{[^}]*\}/);
  var activeRule = css.match(/:root \.fg-filter-icon-active\s*\{[^}]*\}/);

  assert.ok(iconRule);
  assert.ok(activeRule);
  assert.match(iconRule[0], /right:\s*-2px/);
  assert.match(activeRule[0], /right:\s*-2px/);
});

test('active filter operators use the theme color with normal text weight', function() {
  var rootRule = css.match(/\.fg-root\s*\{[^}]*\}/);
  var activeRule = css.match(/:root \.fg-filter-icon-active\s*\{[^}]*\}/);

  assert.ok(rootRule);
  assert.ok(activeRule);
  assert.match(rootRule[0], /--fg-filter-operator-color:\s*blue/);
  assert.match(activeRule[0], /color:\s*var\(--fg-filter-operator-color,\s*blue\)/);
  assert.match(activeRule[0], /font-weight:\s*normal/);
});

test('light themes inherit the Default operator color and dark themes use white', function() {
  var darkThemes = new Set(['fabgrid.black.css', 'fabgrid.dark-hive.css']);
  var themeFiles = readdirSync(themeDir).filter(function(file) {
    return /^fabgrid\..+\.css$/.test(file);
  });

  assert.equal(themeFiles.length, 17);
  themeFiles.forEach(function(file) {
    var source = readFileSync(new URL(file, themeDir), 'utf8');
    if (darkThemes.has(file)) {
      assert.match(source, /--fg-filter-operator-color:\s*#fff/, file);
    } else {
      assert.doesNotMatch(source, /--fg-filter-operator-color:/, file);
    }
  });
});

test('filter funnel uses a two-pixel left inset', function() {
  var funnelRule = css.match(/\.fg-filter-icon::before\s*\{[^}]*\}/);
  var stemRule = css.match(/\.fg-filter-icon::after\s*\{[^}]*\}/);

  assert.ok(funnelRule);
  assert.ok(stemRule);
  assert.match(funnelRule[0], /left:\s*2px/);
  assert.match(stemRule[0], /left:\s*6px/);
});

test('headers without filtering do not reserve the filter icon slot', function() {
  var compactRule = css.match(/\.fg-header-title-compact\s*\{[^}]*\}/);

  assert.ok(compactRule);
  assert.match(viewSource, /headerBaseContentWidth = headerTextWidth \+ \(filterMode \? 30 : 20\)/);
  assert.match(viewSource, /if \(filterMode\) \{[\s\S]*?title\.appendChild\(filterIcon\);/);
  assert.doesNotMatch(compactRule[0], /padding-right:\s*20px/);
});
