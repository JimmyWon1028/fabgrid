import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

var gridCss = fs.readFileSync('src/grid/fabgrid.css', 'utf8');
var pivotCss = fs.readFileSync('src/pivot/pivot-panel.css', 'utf8');
var gridGridCss = fs.readFileSync('demo/style/grid-grid.css', 'utf8');
var gridTreeCss = fs.readFileSync('demo/style/grid-treegrid.css', 'utf8');
var gridDemoCss = fs.readFileSync('demo/style/style.css', 'utf8');

test('Grid column and row insertion indicators share the semi-transparent opacity', function() {
  assert.match(gridCss, /--fg-drag-indicator-opacity:\s*0\.55;/);
  assert.match(
    gridCss,
    /\.fg-column-drop-indicator\s*\{[\s\S]*?opacity:\s*var\(--fg-drag-indicator-opacity\);[\s\S]*?\}/
  );
  assert.match(
    gridCss,
    /\.fg-row-drop-indicator\s*\{[\s\S]*?opacity:\s*var\(--fg-drag-indicator-opacity\);[\s\S]*?\}/
  );
});

test('PivotPanel field insertion indicator uses the shared semi-transparent opacity', function() {
  assert.match(
    pivotCss,
    /\.fg-pivot-panel-insert-line\s*\{[\s\S]*?opacity:\s*var\(--fg-drag-indicator-opacity,\s*0\.55\);[\s\S]*?\}/
  );
  assert.match(
    pivotCss,
    /\.fg-pivot-panel-field\.fg-pivot-panel-merge-target,[\s\S]*?box-shadow:\s*inset 0 0 0 2px var\(--fg-selected-border\);[\s\S]*?\}/
  );
});

test('PivotPanel gives Fields half of the available height with vertical scrolling', function() {
  assert.match(
    pivotCss,
    /\.fg-pivot-panel-header\s*\{[\s\S]*?flex:\s*0 0 50%;[\s\S]*?min-height:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?\}/
  );
  assert.match(
    pivotCss,
    /\.fg-pivot-panel-fields\s*\{[\s\S]*?min-height:\s*0;[\s\S]*?overflow-x:\s*hidden;[\s\S]*?overflow-y:\s*auto;[\s\S]*?\}/
  );
});

test('Build-mode drag demos keep insertion indicators semi-transparent without rebuilding dist', function() {
  assert.match(
    gridGridCss,
    /\.grid-grid-page \.fg-row-drop-indicator\s*\{[\s\S]*?opacity:\s*0\.55;[\s\S]*?\}/
  );
  assert.match(gridGridCss, /rgba\(47,\s*128,\s*237,\s*0\.55\)/);
  assert.match(
    gridTreeCss,
    /\.grid-tree-page \.fg-row-drop-indicator\s*\{[\s\S]*?opacity:\s*0\.55;[\s\S]*?\}/
  );
  assert.match(gridTreeCss, /rgba\(47,\s*128,\s*237,\s*0\.55\)/);
  assert.match(
    gridDemoCss,
    /\.fg-column-drop-indicator,\s*\.fg-row-drop-indicator\s*\{[\s\S]*?opacity:\s*0\.55;[\s\S]*?\}/
  );
});
