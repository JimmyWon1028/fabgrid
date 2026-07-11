import { createEditorDefinitions } from './editor/editor-definitions.js';
import { createFabGridFactory } from './grid/fabgrid.js';

var editorDefinitions = createEditorDefinitions();
var FabGrid = createFabGridFactory(editorDefinitions);
var fabui = {
  version: '2026.7.11',
  editorDefinitions: editorDefinitions,
  FabGrid: FabGrid,
  FabGridLocales: FabGrid.locales
};

export { fabui };
export default fabui;
