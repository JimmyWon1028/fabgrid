import { createEditorDefinitions } from './editbox/editbox-definitions.js?v=20260803-text-charcase-v2';
import { createEditBoxFactory } from './editbox/editbox.js?v=20260803-text-charcase-v2';
import { createButtonFactory } from './button/button.js?v=20260725-remove-mono-variants-v1';
import { createAccordionFactory } from './accordion/accordion.js?v=20260728-locale-packs-v1';
import { createCalendarFactory } from './calendar/calendar.js?v=20260728-locale-packs-v1';
import { createCheckBoxFactory } from './checkbox/checkbox.js?v=20260728-locale-packs-v1';
import { createCheckGroupFactory } from './checkgroup/checkgroup.js?v=20260728-locale-packs-v1';
import { createSwitchButtonFactory } from './switchbutton/switchbutton.js?v=20260728-locale-packs-v1';
import { createRadioButtonFactory } from './radiobutton/radiobutton.js?v=20260728-locale-packs-v1';
import { createRadioGroupFactory } from './radiogroup/radiogroup.js?v=20260728-locale-packs-v1';
import { createFileBoxFactory } from './filebox/filebox.js?v=20260728-locale-packs-v1';
import { createFormFactory } from './form/form.js?v=20260728-locale-packs-v1';
import { CollectionView } from './collections/collection-view.js?v=20260727-collection-view-sort-v1';
import { createChartNamespace } from './chart/chart.js?v=20260805-chart-compatible-data-v1';
import { createDiagramFactory } from './diagram/diagram.js?v=20260728-locale-packs-v1';
import {
  Control,
  registerControl,
  unregisterControl
} from './core/control.js?v=20260725-remove-mono-variants-v1';
import { Clipboard } from './core/clipboard.js?v=20260724-clipboard-v1';
import { getConfig, setConfig } from './core/config.js?v=20260723-global-config-v1';
import { createLocaleManager } from './core/locale.js?v=20260728-locale-packs-v1';
import { createFabGridFactory } from './grid/fabgrid.js?v=20260805-grid-pivot-audit-fixes-v1';
import { createExcelNamespace } from './grid/fabgrid-export.js?v=20260804-excel-workbook-v1';
import { CellType } from './grid/fabgrid-types.js?v=20260716-row-types-v1';
import { createLayoutFactory } from './layout/layout.js?v=20260728-locale-packs-v1';
import { createMenuFactory } from './menu/menu.js?v=20260728-locale-packs-v1';
import { createMenuButtonFactory } from './menubutton/menubutton.js?v=20260725-remove-mono-variants-v1';
import { createMessagerFactory } from './messager/messager.js?v=20260728-locale-packs-v1';
import { createPanelFactory } from './panel/panel.js?v=20260728-locale-packs-v1';
import { createPropertyGridFactory } from './propertygrid/propertygrid.js?v=20260728-locale-packs-v1';
import { createSplitButtonFactory } from './splitbutton/splitbutton.js?v=20260725-remove-mono-variants-v1';
import { createTabsFactory } from './tabs/tabs.js?v=20260728-locale-packs-v1';
import { createTreeFactory } from './tree/tree.js?v=20260730-external-drop-v1';
import { createTooltipFactory } from './tooltip/tooltip.js?v=20260725-remove-mono-variants-v1';
import { createWindowFactory } from './window/window.js?v=20260728-locale-packs-v1';
import {
  PivotAggregate,
  PivotEngine,
  PivotField,
  PivotShowAs,
  PivotShowTotals
} from './pivot/pivot-engine.js?v=20260805-grid-pivot-audit-fixes-v1';
import { createPivotChartFactory } from './pivot/pivot-chart.js?v=20260725-remove-mono-variants-v1';
import { createPivotGridFactory } from './pivot/pivot-grid.js?v=20260804-persist-field-width-v3';
import { createPivotPanelFactory } from './pivot/pivot-panel.js?v=20260805-grid-pivot-audit-fixes-v1';
import { createPivotSlicerFactory } from './pivot/pivot-slicer.js?v=20260724-native-controls-v1';
import { createPivotWorkspaceFactory } from './pivot/pivot-workspace.js?v=20260725-remove-mono-variants-v1';

var localeManager = createLocaleManager();
var editorDefinitions = createEditorDefinitions();
var EditBox = localeManager.registerTarget(
  'EditBox',
  createEditBoxFactory(editorDefinitions)
);
var Button = createButtonFactory(Control, registerControl, unregisterControl);
var Calendar = localeManager.registerTarget(
  'Calendar',
  createCalendarFactory(Control, registerControl, unregisterControl)
);
var CheckBox = localeManager.registerTarget(
  'CheckBox',
  createCheckBoxFactory(Control, registerControl, unregisterControl)
);
var CheckGroup = localeManager.registerTarget(
  'CheckGroup',
  createCheckGroupFactory(
    Control,
    registerControl,
    unregisterControl,
    CheckBox
  )
);
var SwitchButton = localeManager.registerTarget(
  'SwitchButton',
  createSwitchButtonFactory(
    Control,
    registerControl,
    unregisterControl
  )
);
var RadioButton = localeManager.registerTarget(
  'RadioButton',
  createRadioButtonFactory(Control, registerControl, unregisterControl)
);
var RadioGroup = localeManager.registerTarget(
  'RadioGroup',
  createRadioGroupFactory(
    Control,
    registerControl,
    unregisterControl,
    RadioButton
  )
);
var FileBox = localeManager.registerTarget(
  'FileBox',
  createFileBoxFactory(
    Control,
    registerControl,
    unregisterControl,
    EditBox
  )
);
var Form = localeManager.registerTarget(
  'Form',
  createFormFactory(
    Control,
    registerControl,
    unregisterControl,
    EditBox
  )
);
var FabGridBase = createFabGridFactory(editorDefinitions, getConfig);
var FabGrid = localeManager.registerTarget('FabGrid', FabGridBase);
var Excel = createExcelNamespace();
var chartNamespace = createChartNamespace();
chartNamespace.Chart = localeManager.registerTarget('Chart', chartNamespace.Chart);
chartNamespace.Pie = localeManager.registerTarget('Pie', chartNamespace.Pie, 'Chart');
var Chart = chartNamespace.Chart;
var Window = localeManager.registerTarget(
  'Window',
  createWindowFactory(Control, registerControl, unregisterControl)
);
var Menu = localeManager.registerTarget(
  'Menu',
  createMenuFactory(Control, registerControl, unregisterControl)
);
var Tabs = localeManager.registerTarget(
  'Tabs',
  createTabsFactory(Control, registerControl, unregisterControl)
);
var Diagram = localeManager.registerTarget(
  'Diagram',
  createDiagramFactory(
    Control,
    registerControl,
    unregisterControl,
    Button,
    EditBox,
    Menu,
    Tabs
  )
);
var MenuButton = createMenuButtonFactory(
  Control,
  registerControl,
  unregisterControl,
  Button,
  Menu
);
var SplitButton = createSplitButtonFactory(
  Control,
  registerControl,
  unregisterControl,
  MenuButton
);
var Panel = localeManager.registerTarget(
  'Panel',
  createPanelFactory(Control, registerControl, unregisterControl)
);
var Accordion = localeManager.registerTarget(
  'Accordion',
  createAccordionFactory(
    Control,
    registerControl,
    unregisterControl,
    Panel
  )
);
var PropertyGrid = localeManager.registerTarget(
  'PropertyGrid',
  createPropertyGridFactory(
    Control,
    registerControl,
    unregisterControl,
    EditBox
  )
);
var Tree = localeManager.registerTarget(
  'Tree',
  createTreeFactory(Control, registerControl, unregisterControl)
);
var Tooltip = createTooltipFactory(Control, registerControl, unregisterControl);
var Layout = localeManager.registerTarget(
  'Layout',
  createLayoutFactory(Control, registerControl, unregisterControl, Panel)
);
var Messager = localeManager.registerTarget(
  'Messager',
  createMessagerFactory(Window, Button)
);
var PivotChart = localeManager.registerTarget(
  'PivotChart',
  createPivotChartFactory(Control, registerControl, unregisterControl, PivotEngine, Chart, FabGrid),
  'FabGrid'
);
var PivotGrid = localeManager.registerTarget(
  'PivotGrid',
  createPivotGridFactory(FabGridBase, PivotEngine, CellType),
  'FabGrid'
);
var PivotPanel = localeManager.registerTarget(
  'PivotPanel',
  createPivotPanelFactory(Control, registerControl, unregisterControl, PivotEngine, FabGrid),
  'FabGrid'
);
var PivotSlicer = localeManager.registerTarget(
  'PivotSlicer',
  createPivotSlicerFactory(
    Control,
    registerControl,
    unregisterControl,
    PivotEngine,
    FabGrid
  ),
  'FabGrid'
);
var PivotWorkspace = localeManager.registerTarget(
  'PivotWorkspace',
  createPivotWorkspaceFactory(
    Control,
    registerControl,
    unregisterControl,
    PivotEngine,
    PivotPanel,
    PivotGrid,
    PivotChart,
    FabGrid
  ),
  'FabGrid'
);
var pivotNamespace = {
  PivotAggregate: PivotAggregate,
  PivotChart: PivotChart,
  PivotEngine: PivotEngine,
  PivotField: PivotField,
  PivotGrid: PivotGrid,
  PivotPanel: PivotPanel,
  PivotShowAs: PivotShowAs,
  PivotShowTotals: PivotShowTotals,
  PivotSlicer: PivotSlicer,
  PivotWorkspace: PivotWorkspace
};
var collectionsNamespace = {
  CollectionView: CollectionView
};
var fabui = {
  version: '2026.7.18',
  setConfig: setConfig,
  getConfig: getConfig,
  addLocale: function(locale, pack) {
    localeManager.addLocale(locale, pack);
    return fabui;
  },
  getLocale: localeManager.getLocale,
  getLocales: localeManager.getLocales,
  setLocale: function(locale) {
    localeManager.setLocale(locale);
    return fabui;
  },
  registerLocaleTarget: localeManager.registerTarget,
  editorDefinitions: editorDefinitions,
  Accordion: Accordion,
  Button: Button,
  Calendar: Calendar,
  CheckBox: CheckBox,
  CheckGroup: CheckGroup,
  SwitchButton: SwitchButton,
  RadioButton: RadioButton,
  RadioGroup: RadioGroup,
  Clipboard: Clipboard,
  CellType: CellType,
  Control: Control,
  chart: chartNamespace,
  collections: collectionsNamespace,
  Diagram: Diagram,
  EditBox: EditBox,
  Excel: Excel,
  FileBox: FileBox,
  Form: Form,
  FabGrid: FabGrid,
  Layout: Layout,
  Menu: Menu,
  MenuButton: MenuButton,
  Messager: Messager,
  Panel: Panel,
  PropertyGrid: PropertyGrid,
  SplitButton: SplitButton,
  Tabs: Tabs,
  Tree: Tree,
  Tooltip: Tooltip,
  Window: Window,
  pivot: pivotNamespace,
  FabGridLocales: FabGrid.locales
};

export { fabui };
export default fabui;
