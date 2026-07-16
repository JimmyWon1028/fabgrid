import { createEditorDefinitions } from './editor/editor-definitions.js?v=20260713-color-names-v10';
import { createChartFactory } from './chart/chart.js?v=20260712-pie-label-v1';
import { Control } from './core/control.js?v=20260716-control-events-v3';
import { createFabGridFactory } from './grid/fabgrid.js?v=20260716-selection-pointer-v3';
import { CellType } from './grid/fabgrid-types.js?v=20260716-row-types-v1';

var editorDefinitions = createEditorDefinitions();
var FabGrid = createFabGridFactory(editorDefinitions);
var Chart = createChartFactory();
var fabui = {
  version: '2026.7.11',
  editorDefinitions: editorDefinitions,
  Control: Control,
  Chart: Chart,
  FabGrid: FabGrid,
  CellType: CellType,
  FabGridLocales: FabGrid.locales
};

export { fabui };
export default fabui;
