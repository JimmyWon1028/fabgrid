import { createEditorDefinitions } from './editor/editor-definitions.js?v=20260713-color-names-v10';
import { createChartFactory } from './chart/chart.js?v=20260712-pie-label-v1';
import {
  Control,
  registerControl,
  unregisterControl
} from './core/control.js?v=20260716-control-events-v3';
import { createFabGridFactory } from './grid/fabgrid.js?v=20260716-selection-pointer-v3';
import { CellType } from './grid/fabgrid-types.js?v=20260716-row-types-v1';
import {
  PivotAggregate,
  PivotEngine,
  PivotField,
  PivotShowTotals
} from './pivot/pivot-engine.js?v=20260716-pivot-build-v2';
import { createPivotGridFactory } from './pivot/pivot-grid.js?v=20260716-pivot-toggle-single-click-v4';
import { createPivotPanelFactory } from './pivot/pivot-panel.js?v=20260716-pivot-panel-drag-only-v7';

var editorDefinitions = createEditorDefinitions();
var FabGrid = createFabGridFactory(editorDefinitions);
var PivotGrid = createPivotGridFactory(FabGrid, PivotEngine);
var PivotPanel = createPivotPanelFactory(Control, registerControl, unregisterControl, PivotEngine, FabGrid);
var Chart = createChartFactory();
var pivotNamespace = {
  PivotAggregate: PivotAggregate,
  PivotEngine: PivotEngine,
  PivotField: PivotField,
  PivotGrid: PivotGrid,
  PivotPanel: PivotPanel,
  PivotShowTotals: PivotShowTotals
};
var fabui = {
  version: '2026.7.11',
  editorDefinitions: editorDefinitions,
  Control: Control,
  Chart: Chart,
  FabGrid: FabGrid,
  pivot: pivotNamespace,
  CellType: CellType,
  FabGridLocales: FabGrid.locales
};

export { fabui };
export default fabui;
