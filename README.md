<p align="center">
  <img src="./assets/fabgrid-logo.png" alt="FabGrid logo" width="520">
</p>

English | [繁體中文](./README.zh-TW.md)

# FabGrid

FabGrid is FabUI's high-performance data grid, built with pure JavaScript and no frontend framework dependencies. Its core uses horizontal and vertical virtualization to render only the visible range, making it suitable for large datasets.

FabUI also provides form, navigation, window, HtmlEditor, Chart, Pivot, Diagram, Gantt, and Scheduler components. **Fab** stands for **Fabulous**, reflecting the project's focus on performance, practicality, and a great developer experience.

## Quick Links

| Type | Links |
| --- | --- |
| Online demos | [FabGrid](https://jimmywon1028.github.io/fabgrid/demo/grid.html) · [TreeGrid](https://jimmywon1028.github.io/fabgrid/demo/treegrid.html) · [Diagram](https://jimmywon1028.github.io/fabgrid/demo/diagram.html) · [Gantt](https://jimmywon1028.github.io/fabgrid/demo/gantt.html) · [All demos](https://jimmywon1028.github.io/fabgrid/demo/index.html) |
| Local demos | [Development index](./demo/dev.html) · [Production index](./demo/index.html) |
| API | [Documentation index](./docs/) · [FabGrid](./docs/fabgrid-api.md) · [HtmlEditor](./docs/htmleditor-api.md) · [Control](./docs/control-api.md) · [Theme](./docs/theme-api.md) · [Diagram](./docs/diagram-api.md) |
| Project | [Work logs](./worklogs/) · [TODO](./TODO.md) |

## Quick Start

### Create a FabGrid

Load the FabUI core CSS and browser-global JavaScript, then create the Grid:

```html
<link rel="stylesheet" href="./dist/fabui.css">

<div id="grid" style="height:260px;"></div>

<script src="./dist/fabui.js"></script>
<script>
  var rows = [
    { id: 1, name: 'Alice', amount: 1280 },
    { id: 2, name: 'Bob', amount: 2560 }
  ];

  var grid = new fabui.FabGrid('#grid', {
    itemsSource: rows,
    columns: [
      { binding: 'id', header: 'ID', width: 80, align: 'center', dataType: 'number' },
      { binding: 'name', header: 'Name', width: 160 },
      { binding: 'amount', header: 'Amount', width: 120, align: 'right', dataType: 'number', allowSorting: false }
    ],
    frozenColumns: 1,
    allowSorting: true,
    allowMultiSorting: false,
    allowEditing: true,
    allowResizing: true
  });

  var sameGrid = fabui.Control.getControl('#grid');
</script>
```

FabGrid always follows the height of its host element and does not enforce a minimum height. Give the host an explicit usable height directly, through Flexbox, or through Layout.

### Load a Theme

The Default theme does not require an additional stylesheet. For any other theme, load its stylesheet after all FabUI and extension stylesheets:

```html
<link rel="stylesheet" href="./dist/fabui.css">
<link rel="stylesheet" href="./dist/fabui.gantt.css">
<link rel="stylesheet" href="./dist/theme/fabui.metro-blue.css">
```

See [Themes and Localization](#themes-and-localization) for the complete loading rules.

### Load a Standalone Extension

Diagram, Gantt, Scheduler, and HtmlEditor are not included in FabUI core. Load files in this order: core CSS, extension CSS, core JavaScript, and extension JavaScript.

```html
<link rel="stylesheet" href="./dist/fabui.css">
<link rel="stylesheet" href="./dist/fabui.scheduler.css">

<div id="scheduler"></div>

<script src="./dist/fabui.min.js"></script>
<script src="./dist/fabui.scheduler.min.js"></script>
<script>
  var scheduler = new fabui.Scheduler('#scheduler', {
    currentView: 'workWeek',
    dataSource: []
  });
</script>
```

## Core FabGrid Capabilities

| Category | Capabilities |
| --- | --- |
| Performance | Two-dimensional virtualization with fixed row heights and column widths renders only the visible range. Vertical scrolling reuses the existing layout, Header, Footer, and Pager. Local multi-column sorting prepares each row's sort values in advance. |
| Data sources | `itemsSource` accepts an Array or `fabui.collections.CollectionView` in both local and `remote: true` modes. Remote rows replace the Array source or update the same CollectionView instance, keeping shared Charts synchronized. Built-in `url` requests can use `credentials: 'include'`; a newer load or `dispose()` aborts an unfinished older Fetch request. |
| Grid layout | Supports nested `columns` with merged multi-row Headers, multiple keyed Footer rows, left and right frozen column ranges that include hidden columns in their configured counts, row headers, column resizing, column visibility, cached Footer aggregates that recalculate after data view changes, alternating row backgrounds, and fullscreen mode. |
| Column width | `width` defaults to the Grid `columnMinWidth` (`20px` by default). An explicit initial `width` may be smaller; Column has no `minWidth` property. |
| Sorting and filtering | Supports single-column sorting, Shift multi-column sorting, `clearSort()`, safe `getSortState()` and `getFilterState()` snapshots, `allowMultiSorting: false`, Column-level `allowSorting: false`, cancellable `sortingColumn`, numeric sorting for string values with thousands separators, horizontal scroll preservation while sorting with minimal adjustment for a partially hidden clicked Header, Quick Search, Search Row, Excel-like value filters, and runtime Filter Rules. |
| Grouping and TreeGrid | Supports one to three grouping levels, subtotals, collapsing, and `childItemsPath` TreeGrid data. |
| Row drag and drop | Supports reordering within a Grid, moving rows across Grids, and TreeGrid hierarchy changes using `before`, `inside`, and `after`. |
| Selection and clipboard | Supports Cell, CellRange, the read-only `selectedRow` active row, single-selection `unselectRow()`, `select()` with full `grid.columns` indexes, `selectedRowChanged`, multiple row selection, mouse dragging, whole-row range selection through row headers, Shift extension, keyboard navigation, and TSV copy. Clicking a RowHeader selects the whole row while preserving the RowHeader's original appearance; `Ctrl/Cmd + C` copies every visible column in that row. Every public event `e.col` uses the full `grid.columns` index including hidden columns; `e.viewCol` exposes the visible index when needed. CellRange borders use `activeCellBorder`. `stopNavigation` can pause user selection and scrolling while keeping programmatic APIs available. |
| Editing and validation | Includes `text`, `number`, `time`, `date`, `combo`, and `color` editors with masks and synchronous or asynchronous validation. The `text`, `combo`, and `color` editors support `charcase: 'upper'` or `'lower'`, converting ASCII English letters while preserving all other characters; `date`, `time`, and `number` are excluded. Grid and EditBox share this definition. The read-only `editRange` reports the currently edited cell or `null`. While a cell is editing, Enter/Shift+Enter moves right/left through editable cells and wraps to the next row's first or previous row's last editable cell, regardless of `editOnSelect`. With `editOnSelect: true`, Tab/Shift+Tab may also continue across rows and vertical arrows continue across rows. With `editOnSelect: false`, typing an accepted character on the active editable cell starts editing and replaces the original value; Tab/Shift+Tab commit and end editing, while unclaimed arrow keys keep their native editor caret behavior. Column `multiLine: true` gives text editors a `<textarea>` that can hold multiline values while cells remain single-line. Column `isReadOnly: true` prevents editing even while the Grid is editable. Column `isRequired` defaults to `false`; when enabled, empty values automatically create a required entry in `invalidItems`. Deleting rows or replacing the data source removes their stale synchronous and asynchronous errors, while row and column layout changes update every retained error index. The editor always stays on the only active cell; moving the pointer outside the edit cell keeps editing unchanged, clicking another cell commits the current value before changing selection, while programmatically selecting another cell still cancels the current edit. A keyboard focus transition out of the Grid also commits the editor, and every EditBox commits when focus leaves the control. Grid and EditBox share the compact 8×8 color palette with 63 colors and a clear-color swatch; selecting either immediately closes the popup. Color cells show the swatch while keeping the value text at the normal cell text color. During continuous editing, moving beyond the visible range scrolls one row at a time and keeps the active editor at the top or bottom boundary. |
| Display customization | Provides Column `cssClass`, formatters, `formatItem`, `cellTemplate`, `FabGrid.CellMaker.makeLink()` link templates, Header styles, Row/GroupRow types, and event APIs. |
| Import and export | Supports JSON, CSV, and XLSX. Excel exports support custom sheet names and multi-sheet workbooks from multiple Grids while preserving formatting, frozen panes, filters, groups, Footers, and hidden columns. |
| Popups | Context menus, filters, column choosers, and editor popups close with `Escape` or an outside click. With `filterMode: false`, Clear Filter is hidden. Row Header and fullscreen entries are independently controlled by `showRowHeaderMenu` and `showFullscreenMenu`, both hidden by default. |
| Lifecycle | `fabui.Control.getControl()` retrieves an instance. `hasFocus` reports whether the Grid currently has focus. `beginUpdate()`/`endUpdate()` and `deferUpdate()` coalesce View updates, with read-only `isUpdating` reporting batch state. `dispose()` removes managed DOM listeners. |
| Events | Constructor callbacks, `grid.on()`, and Wijmo-compatible `addHandler()` all use `(grid, eventArgs)`. Every event args object includes `grid`, `type`, and `cancel`, with `eventArgs.grid === grid`. Each event dispatch keeps its own args object, so a retained before-event reference is not rewritten by the matching after-event. Every before/action-start event is cancellable, including `updatingLayout` and `excelExporting`. |
| Clipboard | `fabui.Clipboard.copy(str)` copies text to the system clipboard. |

Local Column uniqueness checks use `args.isDuplicate()`: each non-empty value may appear once, while blank values may repeat. Pass `{ ignoreCase: true }` for case-insensitive comparison.

Every numeric Column argument in a public method uses the full `grid.columns` index, including hidden columns. Decimal integer strings such as `"1"` are accepted as the same index because Column identifiers start with a letter. Visible indexes are exposed only through event `viewCol` and related `view*` fields. Wijmo-compatible calls such as `startEditing(false)` edit the current active cell, and the existing `startEditing(row, col, options)` form uses the same full Column index.

### Sorting and Filtering

`filterMode` accepts `false` or an array of modes. The first array item is the default mode. The mode switcher is hidden when only one mode is available.

```js
var grid = new fabui.FabGrid('#grid', {
  filterMode: ['excel', 'searchRow']
});
```

| Topic | Behavior |
| --- | --- |
| Runtime Filter Rules | `setFilterRules(rules)` applies rules immediately; `getFilterRules()` returns a deep copy of the current rules. |
| Local data | Rules are applied immediately without calling `reload()`. |
| Remote data | With `remote: true`, the Grid returns to page 1 and automatically sends a new request. |
| Search Row debounce | `searchDelay` defaults to `400ms`; use `0` to apply changes immediately. |
| Remote Search Row | Keeps the current rows and Grid interactive while loading; a newer query aborts the built-in Fetch and ignores any older custom loader response. |
| Search Row keyboard | `Enter`/`Tab` moves to the next column and `Shift+Enter`/`Shift+Tab` moves to the previous column. Arrow keys move between the Search Row and Grid. On pages with multiple or nested Grids, only the Grid that most recently received pointer or focus interaction is affected. Once a Grid consumes a navigation key, propagation stops so the action is handled only once. |
| Excel-like filter | The popup may extend beyond the Grid's height to use more of the browser viewport. In remote mode, reopening a column preserves the complete candidate list and current checked state. |

`excelFilterMaxValues` limits the number of unique candidate values collected by an Excel-like filter; it does not control popup height. The popup opens below or above the Header according to the available browser viewport, and the list scrolls internally when candidates exceed that space.

Remote Search Row filters convert common operators to compatible symbols:

| Operator | Sent value | Operator | Sent value |
| --- | --- | --- | --- |
| `starts` | `..%` | `not-starts` | `!..%` |
| `contains` | `%..%` | `not-contains` | `!%..%` |
| `ends` | `%..` | `not-ends` | `!%..` |
| `gte`/`gt` | `>=`/`>` | `lte`/`lt` | `<=`/`<` |
| `ne`/`eq` | `<>`/`=` | Custom `op` | Sent unchanged |

`op: 'in'` is case-insensitive, and array values are converted to a comma-separated string. A blank Search Row does not create or send filter rules.

See the [FabGrid API](./docs/fabgrid-api.md) for complete initialization, remote GET/POST formats, and operator contracts.

### Column Visibility

`setColumnVisible()` accepts a Column index or a Column object from that Grid. It does not accept a binding string.

```js
grid.setColumnVisible(1, false);

var column = grid.getColumn('amount');
grid.setColumnVisible(column, true);
```

Do not directly modify `grid.columns[index].visible`, because that will not automatically update the layout, selection state, or rendered view.

### Editors and EditBox

FabGrid cell editors, the Search Row, and `fabui.EditBox` share editor definitions, popups, and formatting logic.

| Feature | Description |
| --- | --- |
| Custom icons | Use `icons: [{ iconCls, title, ariaLabel, text, width, align, keepFocus, onClick }]`. `iconCls` may be an external CSS class that defines `background` or `background-image`; it does not require `:root` or `!important`. |
| Number Spinner | `spinner: true`/`'right'` displays it on the right; `spinner: 'left'` displays it on the left. The default is `false`. |
| Spinner values | `increment` defaults to `1` and follows `min`, `max`, `precision`, and change/cell-edit contracts. |
| Column masks | Define `mask`, `autoUnmask`, and mask-literal behavior on the Column so they also apply when `editor` is omitted. Legacy editor-level values are normalized to the Column during initialization. |
| Time editor | Use `dataType: 'string'` with `editor: 'time'`. It defaults to `99:99` and `autoUnmask: false`; `99:99:99` is also supported. |
| Date editor | `editor: 'date'` supports both `dataType: 'string'` and `dataType: 'date'`. Date data automatically selects the Date editor, while string data requires the explicit editor. |
| Time range | Uses a 24-hour clock. Only the complete values `24:00` and `24:00:00` are accepted as the upper limit. |

See the [EditBox API](./docs/editbox-api.md) for complete examples.

## Pivot Analysis Components

All Pivot components share one `PivotEngine`, avoiding duplicated aggregation work and analysis state.

| Component | Purpose |
| --- | --- |
| `PivotEngine` | Builds a Pivot view from Rows, Columns, Values, and Filters. Supports common aggregates, date grouping, calculated fields, ShowAs, and asynchronous aggregation. |
| `PivotPanel` | Configures fields, sorting, filtering, aggregates, and ShowAs through checkboxes, drag and drop, and context menus. Dropping on the top or bottom of a field inserts around it; dropping in the center creates a serializable combined text field. |
| `PivotGrid` | Reuses FabGrid virtualization, selection, clipboard, export, and fullscreen features, while supporting multi-level headers and subtotals. |
| `PivotChart` | Displays the Pivot view as Column, Bar, Line, or Pie and synchronizes expansion and selection with PivotGrid. |
| `PivotSlicer` | Provides search, multi-selection, apply, and clear operations over shared Pivot filter state. |
| `PivotWorkspace` | Combines PivotPanel, PivotGrid, and PivotChart with a responsive layout, Splitter, progress display, and pane fullscreen mode. |

## FabUI Components

FabUI core directly provides these pure JavaScript components:

| Component | Primary use |
| --- | --- |
| `Button` | LinkButton, icons, sizes, states, toggle, and groups. |
| `Calendar` | Year/month navigation, week numbers, date validation, and lunar calendar display using the shared DatePopup renderer. |
| `CheckBox`/`RadioButton` | Preserve native input form, label, keyboard, and reset behavior. |
| `CheckGroup`/`RadioGroup` | Compose existing single-item components with data, layout, state, and native form support. |
| `SwitchButton` | Wraps a native checkbox with ON/OFF, read-only, reversed, and sizing options. |
| `FileBox` | Combines EditBox with a native file input while preserving FileList and browser security restrictions. |
| `Form` | Manages native fields and FabUI controls with submit, load, validation, dirty, clear, and reset behavior. |
| `EditBox` | Provides text, number, time, date, list, and color input. |
| `HtmlEditor` | Summernote-style WYSIWYG HTML editor with source mode, fullscreen, tables, media, and custom toolbars. |
| `Tabs` | Dynamic tabs, four directions, overflow, remote content, and optional drag sorting. |
| `Tree` | Hierarchical data, checkboxes, drag and drop, editing, search, keyboard navigation, and lazy loading. |
| `PropertyGrid` | Two-column property table with groups, sorting, shared EditBox editors, and change tracking. |
| `Panel`/`Accordion` | Content containers, state animations, and single or multiple expansion. |
| `Window`/`Layout` | Floating windows, modals, drag-resize behavior, and five-region dock layouts with collapsible and fully hideable regions. |
| `Tooltip` | Four directions, HTML content, pointer tracking, delays, and viewport positioning. |
| `Menu`/`MenuButton`/`SplitButton` | Context menus, nested submenus, and button integration. |
| `Messager` | Alert, Confirm, Prompt, Toast, and Progress. |
| `fabui.collections.CollectionView` | Shared sorted and filtered data plus current-item state for Grid and Chart. |
| `fabui.chart.Chart`/`fabui.chart.Pie` | SVG Column, Bar, Line, and Pie charts that work independently or synchronize with Grid/Pivot, with `fabui.chart.animation.ChartAnimation` support. |

Gantt, Scheduler, Diagram, and HtmlEditor are standalone extensions and are not bundled into FabUI core.

To synchronize a Grid and Chart, assign the same CollectionView to both. Standard local FabGrid sorting, filtering, and current-item selection then synchronize to the Chart automatically, without separate Grid event handlers:

```js
const collections = new fabui.collections.CollectionView(rowsData);

const grid = new fabui.FabGrid('#grid', {
  itemsSource: collections
});

const chart = new fabui.chart.Chart('#chart', {
  itemsSource: collections,
  bindingX: 'month',
  series: [{ name: 'Revenue', binding: 'revenue' }]
});
```

## fabui.Diagram

`fabui.Diagram` is a pure JavaScript SVG diagram designer. It provides general-purpose, flowchart, DFD, and organization-chart tools, together with complete drawing, editing, export, and state-persistence workflows.

| Category | Capabilities |
| --- | --- |
| Paper | Defaults to A4 landscape. Supports A3, A4, A5, Letter, Legal, portrait/landscape orientation, grid lines, and snap spacing. |
| Toolbox | Includes 47 SVG shapes. Categories can be collapsed and sorted, and the toolbox can be shown or hidden from the toolbar. |
| Panels | The toolbox and property panel can float or dock on either side. `sameSideDockMode` accepts `tabs` or `stacked`. |
| Shapes | Supports nodes, marquee selection, multi-selection, grouped movement, eight-direction resizing, and batch visual properties. A multi-selection can be scaled proportionally as a group. |
| Connectors | Supports six-point and arbitrary-point connections, straight and orthogonal lines, quadratic and cubic Bézier curves, four arrow types, and control points. |
| Text | Node and connector text can be edited in place. Supports font size, bold, italic, underline, strikethrough, and connector labels. |
| Links | Nodes can open URLs on a single or double click. `javascript:` URLs must only be used with trusted content. |
| History | Add, modify, move, resize, delete, and clear operations support undo/redo. |
| Files | Supports JSON loading/download and SVG/PNG export. |
| Toolbars | The top toolbar provides file, output, history, line-style, panel, and read-only operations. The lower-right toolbar provides zoom, fit, grid, presentation, and fullscreen controls. |
| View | Supports pointer-centered zoom, panning, marquee selection, slideshow presentation, printing, and fullscreen mode. |
| Read-only | Keeps download, zoom, grid, fullscreen, export, print, and slideshow operations while disabling editing tools. |
| Keyboard | Supports Delete/Backspace, arrow keys, and undo. Native keystrokes are not intercepted while an input control has focus. |
| State persistence | `toolboxStateKey` saves panels, toolbars, paper, nodes, and connectors to `localStorage`. |

The Diagram demo includes a production manufacturing workflow example with no external dependencies. See the [Diagram API](./docs/diagram-api.md) for complete behavior and APIs.

## Themes and Localization

| Item | Description |
| --- | --- |
| Theme count | Public components expose the same metadata for 17 themes. |
| Default | Built into FabUI core and Lite CSS; theme builds also publish optional standalone `fabui.default.{css,min.css}` files. |
| Other themes | The 16 external Theme stylesheets must load last and directly override Default selectors. |
| Mono | `mono` uses monochrome SVG assets from `dist/theme/mono/`. |
| Style isolation | Native controls inside FabUI core use fixed component classes and an isolated base, preventing generic `button`, `input`, `label`, `select`, `textarea`, and `a` selectors from changing component appearance. |
| Localization | Core defaults to embedded English. Optional `en`, `zh-TW`, and `zh-CN` language files are loaded from `dist/locales/` when needed; the English file explicitly switches back to the embedded English messages. |

All demos use `default` initially. Selecting another theme replaces the Theme stylesheet and reloads the page.

Load a language pack after FabUI core. Loading it registers all component
messages, sets the global display language, and updates existing controls:

```html
<script src="./dist/fabui.min.js"></script>
<script src="./dist/locales/fabui-locale.zh-TW.min.js"></script>
```

Loading `fabui-locale.en.min.js` switches back to English by overwriting the
current defaults. If the requested language pack has not been loaded, FabUI
stays in English. Use `fabui.getLocale()` and `fabui.getLocales()` to inspect
the active and loaded locales.

Locale files also overwrite the English defaults of loaded components, like
jQuery EasyUI locale files. With fabLoader, loading the target language file
is enough to switch the display language:

```js
fabLoader.script('./dist/locales/fabui-locale.zh-TW.min.js');
```

No separate switch call is required when the locale file is loaded. fabLoader
remains independent and applies its normal script cache without recognizing
FabUI locale filenames.

## Demos and API Documentation

### Demos

| Area | Source mode | Build mode |
| --- | --- | --- |
| FabGrid | [Development](./demo/dev-grid.html) | [Production](./demo/grid.html) |
| TreeGrid | [Development](./demo/dev-treegrid.html) | [Production](./demo/treegrid.html) |
| Diagram | [Development](./demo/dev-diagram.html) | [Production](./demo/diagram.html) |
| Gantt | [Development](./demo/dev-gantt.html) | [Production](./demo/gantt.html) |
| Scheduler | [Development](./demo/dev-scheduler.html) | [Production](./demo/scheduler.html) |
| HtmlEditor | [Development](./demo/dev-htmleditor.html) | [Production](./demo/htmleditor.html) |
| PivotGrid | [Development](./demo/dev-pivot.html) | [Production](./demo/pivot.html) |
| PivotWorkspace | [Development](./demo/dev-pivot-workspace.html) | [Production](./demo/pivot-workspace.html) |
| EditBox | [Development](./demo/dev-editbox.html) | [Production](./demo/editbox.html) |
| All components | [Development index](./demo/dev.html) | [Production index](./demo/index.html) |

Source mode loads directly from `src/` and is intended for development testing. Build mode loads from `dist/` and verifies release output. `demo/dev-grid.html` and `demo/grid.html` keep the same features, controls, defaults, and interactions; only source/dist loading and required locale loading differ.

### API Documentation

- Data and analysis: [FabGrid](./docs/fabgrid-api.md), [CollectionView](./docs/collection-view-api.md), [Chart](./docs/chart-api.md), [Pivot](./docs/pivotgrid-api.md), [PivotChart](./docs/pivotchart-api.md), [PivotWorkspace](./docs/pivotworkspace-api.md)
- Editing and forms: [EditBox](./docs/editbox-api.md), [HtmlEditor](./docs/htmleditor-api.md), [FileBox](./docs/filebox-api.md), [Form](./docs/form-api.md), [CheckBox](./docs/checkbox-api.md), [RadioButton](./docs/radiobutton-api.md)
- Navigation and containers: [Tabs](./docs/tabs-api.md), [Tree](./docs/tree-api.md), [PropertyGrid](./docs/propertygrid-api.md), [Panel](./docs/panel-api.md), [Accordion](./docs/accordion-api.md), [Window](./docs/window-api.md), [Layout](./docs/layout-api.md)
- Commands and feedback: [Button](./docs/button-api.md), [Menu](./docs/menu-api.md), [MenuButton](./docs/menubutton-api.md), [SplitButton](./docs/splitbutton-api.md), [Messager](./docs/messager-api.md), [Tooltip](./docs/tooltip-api.md)
- Extensions: [Diagram](./docs/diagram-api.md), [Gantt](./docs/gantt-api.md), [Scheduler](./docs/scheduler-api.md), [HtmlEditor](./docs/htmleditor-api.md)
- Wrappers: [Vue 2](./docs/vue-api.md), [FabGrid jQuery](./docs/jquery-api.md), [FabUI jQuery compatibility](./docs/fabui-jquery-api.md)

## Distribution Bundles

| Bundle | Output | Contents |
| --- | --- | --- |
| FabUI core | `dist/fabui.{js,min.js,css,min.css}` | FabGrid, Chart, Pivot, EditBox, and general FabUI components. |
| FabUI Lite | `dist/fabui.lite.{js,min.js,css,min.css}` | FabGrid, TreeGrid, Chart, Pivot, and required dependencies. |
| Diagram | `dist/fabui.diagram.{js,min.js,css,min.css}` | Standalone `fabui.Diagram` extension. |
| Gantt | `dist/fabui.gantt.{js,min.js,css,min.css}` | Standalone `fabui.Gantt` extension. |
| Scheduler | `dist/fabui.scheduler.{js,min.js,css,min.css}` | Standalone `fabui.Scheduler` extension. |
| HtmlEditor | `dist/fabui.htmleditor.{js,min.js,css,min.css}` | Standalone `fabui.HtmlEditor` extension. |
| fabLoader | `dist/fabLoader.{js,min.js}` | Experimental standalone dynamic resource loader. `build fabloader` includes the DOM helper; `build loader` excludes it. Not attached to `fabui`. |
| Theme | `dist/theme/fabui.<theme>.{css,min.css}` | All 17 themes, including Default, and required assets. |
| Locale | `dist/locales/fabui-locale.<locale>.{js,min.js}` | Optional `en`, `zh-TW`, and `zh-CN` language files shared by core and standalone components. |
| Vue 2 wrapper | `dist/wrapper/{vue.min.js,fabgrid-vue2.min.js}` | Browser-global Vue 2 runtime and FabGrid wrapper. |
| FabGrid jQuery wrapper | `dist/wrapper/fabgrid-jquery.min.js` | Browser-global FabGrid jQuery adapter. |
| FabUI jQuery wrapper | `dist/wrapper/fabui-jquery.min.js` | Browser-global FabUI jQuery compatibility adapter. |

`fabui.EditBox` is included in core and no longer has a standalone component bundle. The experimental fabLoader is not included in `build:all`. fabDom remains source-only and is combined by `build fabloader`; it has no standalone distribution files. The three wrappers remain independent bundles: regular `build` excludes them, while `build:all` runs their individual build commands after Locale.

Browser globals use these namespaces:

| Namespace | Contents |
| --- | --- |
| `fabui` | FabGrid, general UI components, Control, editor definitions, and loaded locale management. |
| `fabui.collections` | Shared CollectionView data view for Grid/Chart sorting, filtering, and current-item synchronization. |
| `fabui.chart` | Chart, Pie, ChartType, Position, SelectionMode, and the animation namespace containing ChartAnimation, AnimationMode, and Easing. |
| `fabui.pivot` | PivotEngine, PivotField, PivotPanel, PivotGrid, PivotChart, PivotSlicer, and PivotWorkspace. |
| `fabui.FabGrid` | Grid-specific types such as Row and GroupRow. |
| `fabui.Diagram`/`Gantt`/`Scheduler`/`HtmlEditor` | Added after the corresponding standalone bundle is loaded. |

`fabui.version` uses the `YYYY.M.D` format and is generated from the local date during a build.

Global request credentials can be configured before creating FabGrid instances. A Grid-level `credentials` option still takes precedence:

```js
fabui.setConfig({
  request: {
    credentials: 'include'
  }
});
```

Use `fabui.getConfig()` to retrieve an independent copy of the current configuration.

## Experimental fabLoader

`fabLoader` is a standalone browser global with no package dependencies. It is currently being evaluated by the production Diagram demo and is not included in the `fabui` namespace. The `build fabloader` distribution includes a small DOM helper exposed through `fabLoader.dom()`. When a page has no jQuery and `$` is not already occupied, that combined build also safely provides `$` as an alias. The `build loader` distribution excludes fabDom.

See the [fabLoader API](./docs/fabloader-api.md) for complete usage and parameters.

| API | Purpose |
| --- | --- |
| `setConfig(options)`, `getConfig()` | Centrally configure the Script, CSS, image, and text loading buckets before use. Built-in defaults apply when omitted, and `getConfig()` returns an independent copy. |
| `cancel(bucket?, url?)` | Cancels a URL, a loading bucket, or all unfinished loads. `style` is accepted as an alias for `css`. |
| `style()`, `script()`, `module()`, `vue()`, `react()`, `run()`, `wait()` | The first operation automatically creates an independent LAB.js-style loading queue, so `queue()` is not required first. `wait()` aliases `run()` for compatibility. `style(url)` loads one stylesheet, while `style([url, ...])` loads a group in parallel. `script(url)` loads sequentially, while `script([url, ...])` loads a group in parallel and waits for all members. |
| `queue()` | Optional; explicitly creates an empty queue. |
| `loadScript(url, options)` | Dynamically loads JavaScript and loads the same resource only once. |
| `loadCss(url, options)` | Dynamically loads CSS and loads the same resource only once. |
| `preloadImage(urlOrCollection, options)` | A single URL shares one image preload request but returns a different `<img>` for every call. Arrays and named objects preload in parallel and return reusable collections. |
| `loadText(url, options)` | Downloads text asynchronously and caches it in memory. The same URL and credentials are downloaded only once. |
| `getText(url, options)` | Synchronously reads a completed text cache entry and returns `null` for a miss or an unfinished load. |
| `loadXml(url, options)` | Loads XML through the shared text cache and returns a new `XMLDocument` after successful parsing. |
| `loadHtml(urlOrCollection, options)` | HTML-compatible alias for `loadText()` using the same text cache. Accepts one URL, an array of URLs loaded in parallel, or a name-preserving `{ name: url }` object. |
| `getHtml(url, options)` | HTML-compatible alias for `getText()` using the same text cache. |
| `clearTextCache(url?, options?)` | Clears one or all shared text/HTML/XML source-cache entries. Omitting options clears every credentials variant for that URL. |
| `mountHtml(target, url, options)` | Loads HTML into a target element and executes its scripts in source order. |
| `dom(target)` | Returns a jQuery-like collection. `dom(target).load(url, callback)` delegates directly to `mountHtml()`. |
| `useDom()` | Returns a DOM provider suitable for a local `$`: jQuery when present, otherwise the built-in `fabLoader.dom`. It never changes the existing global `$`. |

Without `setConfig()`, all four loading buckets use a 30-second timeout. Script defaults are `async: false` and `crossorigin="anonymous"`, CSS defaults to `media: "all"`, images default to `crossOrigin: "anonymous"`, and text Fetch defaults to `credentials: "same-origin"`. Override them centrally before the first load:

```js
fabLoader.setConfig({
  script: {
    timeout: 15000,
    attributes: {
      crossorigin: 'anonymous'
    }
  },
  css: {
    timeout: 15000
  },
  image: {
    timeout: 10000
  },
  text: {
    timeout: 10000,
    credentials: 'include'
  }
});
```

Per-call options can still override settings from the corresponding bucket. Identity-affecting values—including `type`, `async`, attributes, `media`, image request attributes, and credentials—are included in the cache key; timeout is not. Failed, timed-out, or canceled loads remove their records so the same resource can be retried.

```js
fabLoader.cancel('text', './data.xml');
fabLoader.cancel('image');
fabLoader.cancel();
```

Every numeric index in an image array is a reusable getter. Each read returns an `<img>` with the same source but a different DOM identity, allowing direct insertion into multiple locations:

```js
fabLoader.preloadImage([
  './images/unlocked32.png',
  './images/exit32.png'
]).then(function(images) {
  window.myImages = images;
});

$('#place-a').append(myImages[0]);
$('#place-b').append(myImages[0]);
```

Therefore, `myImages[0] !== myImages[0]`. To change a single node's `alt`, class, or other attributes, first save that read result in a variable.

For named images, pass an object. fabLoader creates the same kind of reusable getter for each name:

```js
fabLoader.preloadImage({
  loader: './images/fab-loader.svg',
  unlock: './images/unlocked32.png'
}).then(function(images) {
  window.myImage = images;
});

$('#place-a').append(myImage.loader);
$('#place-b').append(myImage.loader);
$('#place-b').append(myImage.unlock);
```

`vue(url)` is an optional Vue 2 SFC queue step. When unused, fabLoader does not depend on Vue or SystemJS. When called, it checks for an existing `System.import()`, the full Vue 2 build, and the browser template compiler, then passes the `.vue` file to the existing SystemJS loader configuration. Missing dependencies or failed imports are logged through `console.error`, and later queue steps continue. `demo2/index.html` provides a simple CDN-free demonstration.

`react(url)` is an optional React JSX queue step. When unused, fabLoader does not depend on React or SystemJS. When called, it checks for an existing `System.import()`, React, and a ReactDOM Client that provides `createRoot()`, then passes the `.jsx` file to the existing SystemJS JSX loader configuration. Demo2 uses a separate `runtime.config.js` for the local systemjs-plugin-babel setup, while the original `systemjs.config.js` remains Vue-only.

By default, `mountHtml()` replaces the target element's contents. Use `append: true` to append instead, or `executeScripts: false` to insert only the HTML. Relative paths in the HTML are resolved against the final response URL.

The built-in DOM helper's `.load()` uses a jQuery-like signature and immediately returns the original collection for chaining. After loading, it calls `callback(responseText, status, result)`, where `status` is `success` or `error` and callback `this` is the current target element. Downloading, caching, timeout handling, and fragment script execution are all delegated to `mountHtml()`:

```js
$('#target')
  .load('./fragment.html', function(responseText, status, result) {
    if (status === 'success') {
      $(this).addClass('ready');
    }
  })
  .attr('data-loading', 'true');
```

When jQuery already exists, the Loader does not replace `$`; use `fabLoader.dom('#target').load(...)` explicitly.

To let the same code automatically use jQuery or the built-in DOM helper, first store a local `$`. This does not reclaim the global `$`, even after `jQuery.noConflict()`:

```js
var $ = fabLoader.useDom();

$('#target').addClass('ready');
```

```js
fabLoader.loadText('./notes.txt').then(function(text) {
  console.log(text);
});

fabLoader.loadXml('./data.xml').then(function(xml) {
  console.log(xml.documentElement);
});
```

`loadText()` sends a request or waits for an existing one. `getText()` only reads completed in-memory cache entries synchronously and never sends a request. `loadXml()` caches only the raw XML source and returns a newly parsed `XMLDocument` on every call, preventing callers from modifying a shared Document. If the XML is invalid, the Promise rejects and the source cache entry is removed so the corrected resource can be retried.

```js
fabLoader
  .style(['base.css', 'feature.css'])
  .script('core.js')
  .run(function() {
    startApplication();
  })
  .module('controls.js')
  .catch(function(error) {
    console.error(error);
  });
```

```js
fabLoader
  .script(['library-a.js', 'library-b.js'])
  .run(function() {
    startApplication();
  });
```

Scripts within an array load in parallel and are not guaranteed to execute in relation to one another. Only mutually independent scripts belong in the same group. Later queue steps wait for the entire group to finish.

Queue resource steps (`style`, `script`, `module`, `vue`, and `react`) log load
errors through `console.error` and continue with the remaining steps. Direct
loading methods still reject their Promises, while queue `catch()` handles
exceptions thrown by `run()` or `done()` callbacks.

## Experimental fabDom

`fabDom` is implemented in `src/fabdom/fabDom.js`, bundled into `dist/fabLoader.{js,min.js}` by `build fabloader`, and exposed as `fabLoader.dom`. It is excluded by `build loader` and no longer has standalone distribution files. When the combined build loads on a page without jQuery and `$` is still unused, `$` automatically points to the built-in fabDom. An existing `$` is never replaced.

```js
$('#target')
  .html('<strong>replace</strong>')
  .append('<span>append</span>')
  .addClass('ready')
  .on('click', function() {
    $(this).toggleClass('active');
  });

$('input').val('new value');
$('#target').attr('data-state', 'ready');
$('#target').css({
  color: '#333',
  width: 240
});
```

| Category | API |
| --- | --- |
| Collection | `each()`, `get()`, `eq()`, `first()`, `last()` |
| Content and insertion | `html()`, `text()`, `val()`, `append()`, `prepend()`, `before()`, `after()`, `load()` |
| Attribute/property | `attr()`, `removeAttr()`, `prop()` |
| CSS classes | `css()`, `addClass()`, `removeClass()`, `toggleClass()`, `hasClass()` |
| Events | `on()`, `off()` with direct events and selector delegation |
| Removal and traversal | `empty()`, `remove()`, `find()`, `closest()`, `parent()`, `children()`, `is()` |

Getters read the first matching element, while setters apply to every element and preserve chaining. Common setters support callbacks, and `attr({...})`, `prop({...})`, and `css({...})` support object setters. `attr(name, null)` removes an attribute, while `css(name, null)` removes an inline style. Numeric CSS values automatically receive `px`, except for unitless properties. `on()` and `off()` do not provide event namespaces, data, triggering, or a custom event system.

`append()`, `prepend()`, `before()`, and `after()` accept trusted HTML strings, DOM Nodes, fabDom collections, or NodeLists. DOM Nodes are inserted directly instead of being converted to text such as `[object HTMLImageElement]`. When inserting into multiple targets, earlier targets receive deep clones and the final target receives the original node.

HTML insertion methods do not sanitize content and must only be used directly with fixed or trusted content. fabDom is not a complete jQuery replacement and does not provide animation, full Ajax, or plugin compatibility. `.load()` delegates to `mountHtml()` only when fabLoader is available. After the API stabilizes, the planned FabUI names are `fabui.loader` and `fabui.dom`. Demo2 loads only fabLoader directly; a local jQuery 4 slim loading line remains commented out. When uncommented, jQuery owns `$` while `fabLoader.dom` remains independently available.

## Local Development and Builds

### Development Server

```bash
npm run serve
```

- Build mode: `http://127.0.0.1:4173/demo/grid.html`
- Source mode: `http://127.0.0.1:4173/demo/dev-grid.html`

### Build Commands

| Command | Scope |
| --- | --- |
| `npm run build` | FabUI core, Default CSS, all 17 standalone theme files, and their image assets. |
| `npm run build:lite` | Rebuilds only `fabui.lite.*`. |
| `npm run build:diagram` | Rebuilds only `fabui.diagram.*`. |
| `npm run build:gantt` | Rebuilds only `fabui.gantt.*`. |
| `npm run build:scheduler` | Rebuilds only `fabui.scheduler.*`. |
| `npm run build:htmleditor` | Rebuilds only `fabui.htmleditor.*`. |
| `npm run build:loader` | Rebuilds only the experimental `dist/fabLoader.js` and `dist/fabLoader.min.js`. |
| `npm run build:theme` | Rebuilds all 17 themes under `dist/theme/`, including `fabui.default.{css,min.css}`. |
| `npm run build:locale` | Rebuilds only the optional `en`, `zh-TW`, and `zh-CN` files under `dist/locales/`. |
| `npm run build:vue` | Rebuilds the Vue 2 runtime and FabGrid Vue 2 wrapper. |
| `npm run build:jquery` | Rebuilds the FabGrid jQuery wrapper. |
| `npm run build:fabui-jquery` | Rebuilds the FabUI jQuery compatibility wrapper. |
| `npm run build:all` | Rebuilds core, Lite, Diagram, Gantt, Scheduler, HtmlEditor, Locale, and all three wrappers in sequence. |
| `npm run build:fabloader` | Rebuilds `fabLoader.*` with the built-in fabDom helper. |
| `npm run benchmark:grid` | Benchmarks binding, global search, two-column sorting, and two-dimensional virtualization limits with a 20,000×50 dataset without rebuilding `dist`. |
| `npm test` | Runs the Node.js automated tests without rebuilding `dist`. |

Add `-- min` after npm arguments for a single build scope to keep only that scope's `.min.js`/`.min.css` output. Theme image assets are preserved.

All builds produce only browser-global JavaScript, CSS, minified files, and required image assets. They do not produce `.esm.*` files.

When using Codex, `build <scope>,<scope> [min]` combines `fabui`, `lite`, `diagram`, `gantt`, `scheduler`, `htmleditor`, `theme`, and `locale` in the specified order. For example: `build fabui,htmleditor min`. Do not put spaces around the comma. `all` and `clear` must be used alone.

`build htmleditor min` maps to `npm run build:htmleditor -- min` and only produces and retains `dist/fabui.htmleditor.min.js` and `dist/fabui.htmleditor.min.css`. It does not rebuild FabUI core or any other standalone bundle.

`build locale` maps to `npm run build:locale` and only produces the regular and minified `en`, `zh-TW`, and `zh-CN` language files under `dist/locales/`. `build locale min` maps to `npm run build:locale -- min` and only retains the three `.min.js` language files.

`build fabloader` maps to `npm run build:fabloader` and produces `dist/fabLoader.js` and `dist/fabLoader.min.js` with fabDom included. `build fabloader min` maps to `npm run build:fabloader -- min` and only produces and retains the combined `dist/fabLoader.min.js`.

`build loader` maps to `npm run build:loader` and produces the same output filenames without fabDom. `build loader min` maps to `npm run build:loader -- min` and only produces and retains the pure `dist/fabLoader.min.js`. Fabloader and Loader are both excluded from `build all` and comma-separated multi-scope builds; the mode built last determines the contents of the same output filenames.

### Performance Benchmark

```bash
npm run benchmark:grid
```

The benchmark always creates 20,000 rows and 50 columns, totaling one million data cells. It reports median times for binding scans, global search, and two-column sorting, plus the current viewport's row/column ranges and maximum rendered cell count. Compare timing numbers only on the same machine and runtime environment. The virtualized result must remain far below the full one-million-cell count.

## Source Structure

| Path | Purpose |
| --- | --- |
| `src/fabui.js`, `src/fabui.css` | Public FabUI core entry points. |
| `src/grid/` | FabGrid data, rendering, virtualization, selection, editing, filtering, TreeGrid, drag and drop, and export. |
| `src/editbox/` | EditBox, shared editor definitions, Date/Combo/Color popups, and styles. |
| `src/pivot/`, `src/chart/` | Pivot analysis components and the SVG Chart renderer. |
| `src/diagram/` | Diagram renderer, toolbox, interactions, history, and export. |
| `src/gantt/`, `src/scheduler/`, `src/htmleditor/` | Standalone Gantt, Scheduler, and HtmlEditor source. |
| `src/fabloader/` | Experimental standalone dynamic resource Loader. |
| `src/theme/`, `src/locales/` | Themes, images, and optional `en`/`zh-TW`/`zh-CN` language files; English messages remain embedded as the default. |
| `src/<component>/` | General components such as Button, Calendar, Form, Tabs, Tree, Panel, and Window. |
| `packages/` | Independent Vue 2, FabGrid jQuery, and FabUI jQuery wrappers. |
| `build/` | Build scripts, Theme builder, and smoke scripts. |
| `demo/` | Source-mode and Build-mode demos. |
| `docs/` | API manuals. |
| `test/` | Node.js automated tests and browser-smoke resources. |

## Project Direction

FabGrid prioritizes performance, a stable core API, and practical data-grid features. The core remains pure JavaScript. Framework wrappers only map options, events, methods, and lifecycle behavior; they do not take over cell rendering.

See [TODO](./TODO.md) for planned work.
