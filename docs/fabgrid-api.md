# FabGrid API 操作手冊

本手冊說明目前已發佈的 `fabui.FabGrid` 操作方式。FabGrid 是 pure JavaScript data grid；不依賴 Vue、React 或後端。

## 1. 載入與建立 Grid

### Browser global

```html
<link rel="stylesheet" href="./dist/fabui.css">
<div id="grid" style="height:260px;"></div>
<script src="./dist/fabui.min.js"></script>
<script>
  var grid = new fabui.FabGrid('#grid', {
    itemsSource: [
      { id: 1, name: '王小明', amount: 1280 },
      { id: 2, name: '陳小華', amount: 2560 }
    ],
    columns: [
      { binding: 'id', header: '編號', width: 80, align: 'center', dataType: 'number' },
      { binding: 'name', header: '姓名', width: 160 },
      { binding: 'amount', header: '金額', width: 120, align: 'right', dataType: 'number' }
    ]
  });
</script>
```

建構式第一個參數可傳 CSS selector 或 DOM element；找不到目標 element 時會拋出錯誤。
FabGrid 高度跟隨 host element，不強制設定最小高度；可使用固定高度、百分比、Flex 或 Layout 控制。

### 載入主題

Default 配色已包含在 `fabui.css`；theme build 也會產生可選用的 `dist/theme/fabui.default.{css,min.css}`。其他主題必須在所有 FabUI 與附加元件 CSS 之後載入：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<link rel="stylesheet" href="./dist/theme/fabui.metro-blue.css">
<div id="grid"></div>
<script src="./dist/fabui.min.js"></script>
<script>
  var grid = new fabui.FabGrid('#grid', options);
</script>
```

切換主題時更換外部 Theme CSS 並重新載入頁面。完整規則請見 [Theme API](./theme-api.md)。

### 公開 namespace 與靜態 API

| API | 說明 |
| --- | --- |
| `fabui.version` | 發佈日期版本，格式為 `YYYY.M.D`。 |
| `fabui.setConfig(options)` | 合併 FabUI 全域設定；目前支援 `request.credentials`。 |
| `fabui.getConfig()` | 回傳目前全域設定的獨立副本。 |
| `fabui.setLocale(locale)` | 切換已載入的全域顯示語言並更新既有控件；未載入時回退英文。 |
| `fabui.getLocale()` | 回傳目前全域顯示語言。 |
| `fabui.getLocales()` | 回傳已載入語言名稱陣列。 |
| `fabui.addLocale(locale, pack)` | 註冊完整 FabUI 語言包並立即設為全域顯示語言。 |
| `fabui.Button` | 支援 icon、plain、disabled、toggle、group 與多尺寸的按鈕；詳見 [Button API](./button-api.md)。 |
| `fabui.Calendar` | 與 DatePopup 共用 renderer 的獨立月曆；詳見 [Calendar API](./calendar-api.md)。 |
| `fabui.CheckBox` | 原生表單相容的核取方塊、label 位置、尺寸與狀態 API；詳見 [CheckBox API](./checkbox-api.md)。 |
| `fabui.CheckGroup` | 組合 CheckBox 的水平／垂直多選群組與原生表單欄位；詳見 [CheckGroup API](./checkgroup-api.md)。 |
| `fabui.SwitchButton` | 原生 checkbox 相容的滑動切換按鈕、ON／OFF／handle、reversed 與狀態 API；詳見 [SwitchButton API](./switchbutton-api.md)。 |
| `fabui.RadioButton` | 原生表單相容的單選按鈕；詳見 [RadioButton API](./radiobutton-api.md)。 |
| `fabui.RadioGroup` | 組合 RadioButton 的單選群組；詳見 [RadioGroup API](./radiogroup-api.md)。 |
| `fabui.FileBox` | 組合 EditBox 與原生 file input 的檔案選擇控件；詳見 [FileBox API](./filebox-api.md)。 |
| `fabui.Form` | 管理原生表單欄位與 FabUI 控件；詳見 [Form API](./form-api.md)。 |
| `fabui.Tabs` | 動態頁籤、工具列、四方向排列與 overflow；詳見 [Tabs API](./tabs-api.md)。 |
| `fabui.Tree` | 階層清單、checkbox、拖放、編輯、篩選與 lazy loading；詳見 [Tree API](./tree-api.md)。 |
| `fabui.PropertyGrid` | 兩欄式屬性編輯、群組、共用 EditBox editor 與變更追蹤；詳見 [PropertyGrid API](./propertygrid-api.md)。 |
| `fabui.Tooltip` | 四方向定位、HTML、滑鼠追蹤與延遲提示；詳見 [Tooltip API](./tooltip-api.md)。 |
| `fabui.Menu` | Context／inline menu、巢狀 submenu、鍵盤與 runtime item API；詳見 [Menu API](./menu-api.md)。 |
| `fabui.MenuButton` | 組合 Button 與 Menu 的下拉選單按鈕；詳見 [MenuButton API](./menubutton-api.md)。 |
| `fabui.SplitButton` | 主區域執行動作、箭頭區顯示 Menu 的分割按鈕；詳見 [SplitButton API](./splitbutton-api.md)。 |
| `fabui.Messager` | Alert、Confirm、Prompt、Toast 與 Progress 訊息服務；詳見 [Messager API](./messager-api.md)。 |
| `fabui.EditBox` | FabUI core 內建的文字、數字、日期、清單與顏色編輯控件；詳見 [EditBox API](./editbox-api.md)。 |
| `fabui.Panel` | Header／Body／Footer 內容容器，支援 tools、狀態與遠端載入；詳見 [Panel API](./panel-api.md)。 |
| `fabui.Accordion` | 直接組合 Panel 的摺疊集合，支援單一／多重展開、動態 Panel 與三方向排列；詳見 [Accordion API](./accordion-api.md)。 |
| `fabui.Window` | 可拖曳、縮放、收合、最小化、最大化與 Modal 的視窗控件；詳見 [Window API](./window-api.md)。 |
| `fabui.Layout` | 以 Panel 組成的 north／south／east／west／center 五區版面；詳見 [Layout API](./layout-api.md)。 |
| `fabui.chart.Chart`／`fabui.chart.Pie` | SVG Column、Bar、Line 與 Pie；詳見 [Chart API](./chart-api.md)。 |
| `fabui.pivot` | PivotEngine、PivotPanel、PivotGrid、PivotChart、PivotSlicer 與 PivotWorkspace；詳見 [Pivot API](./pivotgrid-api.md)。 |
| `fabui.Diagram`／`Gantt`／`Scheduler` | 載入對應獨立 bundle 後附加；詳見 [文件索引](./README.md)。 |
| `fabui.FabGrid.SelectionMode` | `Cell`、`CellRange` 選取模式常數。 |
| `fabui.FabGrid.Row` / `GroupRow` | 一般資料列與群組列類型。 |
| `fabui.CellType` | Cell、ColumnHeader、RowHeader、TopLeft、ColumnFooter、BottomLeft 列舉。 |
| `fabui.Clipboard.copy(str)` | 將文字複製到系統剪貼簿，回傳 `Promise<boolean>`。 |
| `fabui.Control` | Control registry 與受管理的 DOM listener；詳見 [Control API](./control-api.md)。 |
| `fabui.editorDefinitions` | FabGrid 與 `fabui.EditBox` 共用的 editor 定義。 |
| `fabui.FabGridLocales` | 已載入的 FabGrid locale registry；core 初始只有 `en`。 |

### 全域語言

FabUI core 與獨立附加元件預設內建英文。`en`、繁中、簡中語言檔集中於
`dist/locales/`，需要時才在 FabUI core 之後載入；英文檔可明確切回內建英文：

```html
<script src="./dist/fabui.min.js"></script>
<script src="./dist/locales/fabui-locale.zh-TW.min.js"></script>
```

語言包載入完成時會呼叫 `fabui.addLocale()`，自動設為該語言，並對已建立
且支援語系的控件呼叫 `setLocale()`。之後載入 Diagram、Gantt、Scheduler
或 HtmlEditor 等獨立元件時，也會自動取得已載入的語言資料。

語言檔也會像 jQuery EasyUI locale 一樣，直接覆蓋已載入元件的英文預設
文字。使用 `fabLoader` 時只需載入目標語言檔：

```js
fabLoader.script('./dist/locales/fabui-locale.zh-TW.min.js');
```

語言檔首次載入完成後會直接切換顯示語言，不需要另外呼叫切換 API。
fabLoader 維持獨立的通用 script 快取，不會辨識或處理 FabUI 語言。

載入 `fabui-locale.en.min.js` 會以相同覆蓋方式切回英文。可用
`fabui.getLocale()`、`fabui.getLocales()` 查詢目前語言與已載入語言。

`zh-Hant`、`zh_Hant_TW` 會正規化為 `zh-TW`；`zh-Hans`、`zh_CN` 會正規化
為 `zh-CN`。若對應語言包尚未載入，顯示語言維持英文。

### 全域設定

請在建立 FabGrid 前設定全域 request credentials：

```js
fabui.setConfig({
  request: {
    credentials: 'include'
  }
});
```

`request.credentials` 支援 `'omit'`、`'same-origin'` 與 `'include'`，預設為 `'same-origin'`。設定會作為之後建立之 FabGrid 的內建 `url` 請求預設值；單一 Grid 明確傳入的 `credentials` 優先。自訂 `loader` 不套用此設定。

`fabui.getConfig()` 會回傳獨立副本，修改回傳物件不會改變全域設定。

## 2. 建構選項

### 資料、版面與互動

| 選項 | 型別 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `itemsSource` | `Array<object>` | `[]` | 本機資料來源。 |
| `columns` | `Array<Column \| ColumnGroup>` | `[]` | 欄位定義；群組可用巢狀 `columns` 建立多列合併 Header。 |
| `rowHeight` | `number` | `32` | 每列固定高度；非正數或非有限數字回復為預設值。 |
| `columnMinWidth` | `number` | `20` | Column 未指定 `width` 時的預設欄寬，也是拖曳調寬與 AutoFit 的全域下限。 |
| `headerHeight` | `number` | `32` | 每一層欄位標題列的高度。 |
| `overscanRows` | `number` | `8` | 垂直虛擬化預先渲染列數；正規化為非負整數。 |
| `fastScrollOverscanRows` | `number` | `64` | 快速捲動時額外渲染列數。 |
| `overscanColumns` | `number` | `3` | 水平虛擬化預先渲染欄數；正規化為非負整數。 |
| `frozenColumns` | `number` | `0` | 左側凍結欄範圍；hidden 欄位也計入指定數量，但不會產生可見的凍結 cell。 |
| `frozenRightColumns` | `number` | `0` | 右側凍結欄範圍；hidden 欄位也計入指定數量，並避免與左側凍結範圍重疊。 |
| `showRowHeaders` | `boolean \| 'numbers' \| 'none' \| 'cell'` | `true` | 顯示左側列號欄；`false`／`'none'` 隱藏，`'cell'` 只保留窄列頭 cell。 |
| `showRowHeaderMenu` | `boolean` | `false` | 是否在 Header cell 右鍵選單顯示「列號」子選單；預設隱藏，設為 `false` 不會改變目前列號欄狀態。 |
| `showFullscreenMenu` | `boolean` | `false` | 是否在 Header cell 右鍵選單顯示 Grid 全螢幕選項；不影響 `toggleFullscreen()` API。 |
| `rowHeaderWidth` | `number` | `60` | 列號欄寬度。 |
| `rowHeaderHeader` | `string` | `''` | 左上角列頭標題文字。 |
| `showColumnChooser` | `boolean` | `true` | 顯示左上角欄位選擇器；popup 可按 `Escape` 或點擊 popup 外部關閉。 |
| `showFooter` | `boolean` | `false` | 顯示 footer aggregate 列。 |
| `footerHeight` | `number` | `32` | 每一列 Footer 的高度。 |
| `footerLabel` | `string` | `''` | 未設定 `footerRows` 時，單列 Footer 左側的列頭文字。 |
| `footerRows` | `Array<{ key, label, values? }>` | `null` | 定義多列 Footer；`key` 可供 Footer API 定位列，`label` 顯示於左側列頭，`values` 可用完整欄位 index 或 binding 提供初始值。未設定時維持一列；數字值預設靠右並顯示千位分隔。 |
| `multiSelectRows` | `boolean` | `false` | 加入多選列 checkbox 欄。 |
| `selectionCheckboxWidth` | `number` | `44` | 多選列 checkbox 欄寬。 |
| `selectionMode` | `'Cell' \| 'CellRange'` | `'Cell'` | `Cell` 選取單一 active cell；`CellRange` 可用滑鼠拖曳、列號整列拖曳、`Shift + Click` 或 `Shift + 方向鍵`選取連續矩形範圍。可由 `fabui.FabGrid.SelectionMode` 取得常數。 |
| `highlightActiveRow` | `boolean` | `true` | 顯示 active cell 所在列的背景；設為 `false` 時只保留 active cell／range，不影響多選列。 |
| `activeCellBorder` | `number` | `1` | Active cell 與 cell editor 邊框寬度，單位為 px；設為 `0` 可隱藏邊框。 |
| `stopNavigation` | `boolean` | `false` | 暫停使用者的鍵盤導覽、cell／row 點選、滑鼠滾輪、觸控與捲軸操作；不限制選取、捲動與資料更新 API。可於 runtime 直接指定。 |
| `allowSorting` | `boolean` | `true` | 是否允許點擊標題排序；排序可將垂直位置回到第一列。已完整可見的 Header 會保留水平位置，部分被凍結區或右側邊界遮住時只做最小幅度調整，讓該欄完整可見。 |
| `allowMultiSorting` | `boolean` | `true` | 是否允許以 `Shift + 點擊` 或 `toggleSort(colIndex, true)` 建立多欄排序；設為 `false` 時只保留目前操作的單一排序欄。 |
| `allowFiltering` | `boolean` | `true` | 舊版相容入口。`false` 等同 `filterMode: false`；`true` 等同 `filterMode: ['excel', 'searchRow']`。新程式請直接使用 `filterMode`。 |
| `allowEditing` | `boolean` | `true` | 是否允許編輯。 |
| `editOnSelect` | `boolean` | `false` | 點選 cell 時直接開始編輯。 |
| `allowResizing` | `boolean` | `true` | 是否允許拖曳調整欄寬；雙擊 header 分隔線會自動調整為合適欄寬。 |
| `allowDragging` | `'None' \| 'Columns' \| 'Rows' \| 'All'` | `'None'` | `'Columns'` 重排欄位；`'Rows'` 啟用同一 Grid 或跨 Grid 資料列拖曳；`'All'` 同時啟用兩者。Row drag 僅支援本機資料。 |
| `filterMode` | `false \| Array<'excel' \| 'searchRow'>` | `['excel', 'searchRow']` | 可用篩選模式；第一項是目前模式。多於一項時，Header 右鍵功能表可切換模式。 |
| `filterRules` | `Array<{field, op, value}> \| string` | `[]` | 初始化 Search Row 規則；本機與遠端細節見[篩選與搜尋](#篩選與搜尋)。 |
| `excelFilterMaxValues` | `number` | `1000` | Excel-like「依值篩選」最多收集的唯一候選值數量；不控制 popup 高度，套用時仍保留未列出值原本的選取狀態。 |
| `updatedView` | `function(grid, eventArgs)` | `null` | View 完成更新時呼叫；等同註冊 `grid.updatedView.addHandler()`。 |
| `searchDelay` | `number` | `400` | Search Row 輸入 debounce 時間；設為 `0` 時立即套用。 |
| `searchRowHeight` | `number \| null` | `null` | 搜尋列高度；`null` 時沿用 `headerHeight`。 |
| `headerDisplayMode` | `'header' \| 'binding'` | `'header'` | 標題顯示欄位標題或 binding。 |
| `headerToggleKey` | `string \| false` | `false` | 切換標題顯示模式的快捷鍵，例如 `'F4'`。 |
| `alternatingRowStep` | `false \| number` | `1` | 交替列背景的分段列數；`false` 關閉，正整數 `1`、`2`、`3`…分別每 1、2、3…列切換一次背景。 |
| `autoClipboard` | `boolean` | `true` | 是否攔截 `Ctrl/Cmd + C` 並複製目前 cell、CellRange 或 RowHeader 整列選取。 |
| `syncScrollRender` | `boolean` | `true` | 捲動時同步更新可視內容；設為 `false` 時改由 animation frame 排程。 |
| `itemFormatter` | `(cells, row, col, cell) => void` | `null` | Body cell 建立後的輕量格式化 callback；新程式優先使用 `formatItem` 或 `cellTemplate`。 |
| `exportBusyText` | `string \| null` | `null` | Excel 匯出期間顯示的忙碌文字。 |
| `locale` | `string \| object` | `null` | Locale 名稱或 locale object。 |
| `messages` | `object` | `null` | 覆寫 locale 文字。 |
| `observeItemsSource` | `boolean` | `false` | 以 Proxy 觀察直接修改的資料列；同一同步批次的多次 mutation 會合併為一次 view refresh。 |
| `rowGroups` | `Array<object>` | `[]` | 1 至 3 階列群組設定；TreeGrid 模式不套用。 |
| `childItemsPath` | `string \| function` | `null` | 指定子節點陣列的 binding path 或 callback；設定後啟用 TreeGrid。 |
| `treeColumn` | `number \| string \| Column` | `null` | 顯示階層箭頭與縮排的欄位；數字及十進位整數字串使用完整 `grid.columns` index，也可傳入 binding／name／header 或 Column object；預設為第一個可見欄。 |
| `treeIndent` | `number` | `20` | 每一階 TreeGrid 縮排寬度，單位為 px。 |

### 分頁與遠端資料

| 選項 | 型別 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `remote` | `boolean` | `false` | 啟用遠端資料模式。 |
| `url` | `string` | `null` | 遠端端點。 |
| `method` | `'get' \| 'post'` | `'get'` | 使用 `url` 時的 HTTP method。 |
| `credentials` | `'omit' \| 'same-origin' \| 'include'` | `'same-origin'` | 內建 `url` 請求使用的 Fetch credentials mode。 |
| `loader` | `(params) => Promise<Response>` | `null` | 自訂載入函式；設定後優先於 `url`。 |
| `loadMsg` | `string \| null` | `null` | 遠端載入期間顯示的文字。 |
| `pagination` | `boolean` | `false` | 顯示分頁器。 |
| `pageNumber` | `number` | `1` | 目前頁碼。 |
| `pageSize` | `number` | `10` | 每頁筆數。 |
| `pageList` | `number[]` | `[10,20,30,40,50]` | 可選 page size。 |
| `pager` | `object` | `null` | 分頁器設定，可包含 `pageNumber`、`pageSize`、`pageList`、`showPageList`、`showPageInfo`、`showRefresh`。 |
| `showPageList` | `boolean` | `false` | 是否顯示 page size 下拉選單。 |
| `showPageInfo` | `boolean` | `true` | 是否顯示範圍與總筆數。 |
| `showRefresh` | `boolean` | `true` | 是否顯示重新整理按鈕。 |
| `paginationHeight` | `number` | `35` | 分頁器高度。 |

### 列群組

`rowGroups` 依陣列順序建立最多三階群組。每階可用 `binding`／`bindings` 指定一個或多個欄位，也可用 `key(args)` 自訂群組鍵；`header(args)`／`formatter(args)` 可自訂群組列文字。

```js
var grid = new fabui.FabGrid('#grid', {
  itemsSource: rows,
  columns: columns,
  rowGroups: [
    { binding: 'region' },
    {
      bindings: ['year', 'quarter'],
      formatter: function(args) {
        return args.key + '（' + args.count + ' 筆）';
      }
    }
  ]
});
```

具有 `aggregate` 的欄位會在群組列顯示彙總結果。群組收合狀態會在排序、篩選與 refresh 後保留；可使用 `toggleRowGroup()`、`toggleAllRowGroups()` 操作。

### TreeGrid

TreeGrid 是 `fabui.FabGrid` 的階層資料模式，不是另一個 renderer 或 class。只要設定 `childItemsPath`，核心會把目前展開的節點扁平化為可視列，再交給既有垂直與水平 virtualization：

```js
var rows = [
  {
    id: 'D01',
    name: '研發部',
    children: [
      { id: 'T01', name: '前端工程組' },
      { id: 'T02', name: '後端工程組' }
    ]
  }
];

var grid = new fabui.FabGrid('#grid', {
  itemsSource: rows,
  childItemsPath: 'children',
  treeColumn: 'name',
  columns: [
    { binding: 'name', header: '組織', width: 260 },
    { binding: 'id', header: '代碼', width: 100 }
  ]
});

grid.collapseGroupsToLevel(0);
```

節點箭頭與樹欄的左右方向鍵可收合或展開。排序只調整同一父節點下的兄弟順序；本機篩選會保留並暫時展開符合節點的祖先路徑。

列號依完整階層順序編排，收合或篩選不會重新編號。分頁以根節點為單位，子樹不會被拆頁。設定 `childItemsPath` 時，不再套用 `rowGroups`。

在樹欄的任一資料 cell 按滑鼠右鍵會開啟共用 Grid popup，並顯示單一「全部展開」或「全部疊合」狀態項目。只要目前仍有可視的展開節點就顯示「全部疊合」；全部疊合後才切換為「全部展開」。

設定 `allowDragging: 'Rows'` 後，可拖曳同一 TreeGrid 節點或從另一個啟用 row drag 的 Grid 移入。節點列上緣、中央、下緣分別代表 `before`、`inside`、`after`；核心會阻止把父節點移入自己的子孫節點。跨 Grid drop 採 move 語意，成功後資料會從來源 Grid 移除：

```js
var pool = new fabui.FabGrid('#pool', {
  itemsSource: availableRows,
  columns: columns,
  allowDragging: 'Rows'
});

var tree = new fabui.FabGrid('#tree', {
  itemsSource: organizationRows,
  columns: columns,
  childItemsPath: 'children',
  treeColumn: 'name',
  allowDragging: 'Rows'
});
```

若程式直接新增或替換 `children`，呼叫 `refreshTree()` 重新建立可視列。可用收合事件實作 lazy loading：

```js
grid.on('groupCollapsedChanged', function(g, e) {
  if (!e.tree || e.collapsed || e.item.children.length !== 1 || !e.item.children[0].loading) return;
  e.item.children = loadChildren(e.item);
  grid.refreshTree();
});
```

Lazy loading 節點需先放一筆 `{ loading: true }` placeholder，讓核心知道該節點可展開；實際資料載入後再替換 placeholder。

TreeGrid 範例：`demo/dev-treegrid.html` 與 `demo/treegrid.html`。Grid 重排與跨 Grid 移動：`demo/dev-grid-grid.html` 與 `demo/grid-grid.html`。Grid／TreeGrid 拖放：`demo/dev-grid-treegrid.html` 與 `demo/grid-treegrid.html`。

## 3. 欄位設定（`Column`）

### 合併欄位標題（`ColumnGroup`）

欄位定義包含巢狀 `columns` 時，該節點會成為合併 Header；`header` 是群組文字，`align` 控制群組文字對齊。巢狀層數不限：

```js
const columns = [
  {
    header: '規格',
    align: 'center',
    columns: [
      { binding: 'w', width: 45, header: '寬', align: 'right' },
      { binding: 'h', width: 45, header: '高', align: 'right' },
      { binding: 'l', width: 45, header: '深', align: 'right' }
    ]
  }
];
```

`grid.columns`、`visibleColumns`、`getColumn()`、排序、篩選、欄寬、顯示切換與匯出仍只操作實際資料欄位，不會把群組節點當成 Column。未放在群組內的欄位會自動向下合併至最深的 Header 列；Search Row 顯示於所有 Header 列下方。

隱藏子欄後，群組範圍會依剩餘可見子欄重算；子欄全部隱藏時不顯示該群組。群組 Header 本身不排序、不篩選也不提供 resize handle。啟用 Column drag 時，只能在相同直屬群組內重排，避免破壞合併範圍。

```js
const columns = [
  { binding: 'id', header: '編號', width: 72, align: 'center', dataType: 'number' },
  {
    binding: 'amount',
    header: '金額',
    width: 120,
    align: 'right',
    dataType: 'number',
    thousandsSeparator: true,
    precision: 2,
    aggregate: 'sum'
  }
];
```

| 選項 | 型別 | 說明 |
| --- | --- | --- |
| `binding` | `string` | 對應資料欄位，可使用安全的巢狀路徑。 |
| `header` | `string` | 顯示於欄位標題的文字。 |
| `width` | `number` | 欄寬；未設定時使用 Grid `columnMinWidth`（預設 `20`）。明確設定的初始 `width` 可小於 `columnMinWidth`；Column 不提供 `minWidth`。 |
| `align` | `'left' \| 'center' \| 'right'` | 標題、內容與 editor 都沿用此對齊。 |
| `dataType` | `'string' \| 'number' \| 'date' \| 'boolean'` | 排序、解析與資料值型別。`number` 本機排序會先移除字串值的半形千位逗號與空白，再依實際數值排序。時間值使用 `dataType: 'string'` 搭配 `editor: 'time'`。 |
| `visible` | `boolean` | 是否顯示；資料仍會保留。 |
| `isReadOnly` | `boolean` | 讓該欄不可編輯，預設為 `false`。只要 Grid 或 Column 為唯讀，該 cell 就不能開始編輯。 |
| `isRequired` | `boolean` | 是否為必填欄位，預設為 `false`；設為 `true` 時，`null`、`undefined`、空字串與純空白會自動產生 required validation error。 |
| `allowSorting` | `boolean` | 是否允許該欄排序，預設為 `true`；設為 `false` 時不觸發排序事件或遠端查詢。 |
| `multiLine` | `boolean` | 是否讓文字型 cell editor 使用可承載換行內容的 `<textarea>`，預設為 `false`。可輸入或貼入多行值，但不改變既有鍵盤操作與 cell 單行顯示。 |
| `cssClass` | `string \| null` | 套用到此欄所有資料 cell 的 CSS class；可包含多個 class，不套用到 Header，預設為 `null`。 |
| `formatter` | `(value, item, column) => string` | cell 顯示格式化函式。 |
| `cellTemplate` | `string \| ((ctx, cell) => string \| null)` | 產生 body cell HTML；預設為 `null`。函式也可直接修改 `cell` 並回傳 `null`。 |
| `footer` / `footerFormatter` | `string \| function` | 自訂 footer 文字或格式化。 |
| `aggregate` | `'sum' \| 'avg' \| 'average' \| 'count' \| 'min' \| 'max' \| function` | Footer 與群組列的聚合計算。 |
| `editor` | `string \| object` | `text`、`number`、`time`、`date`、`combo` 或 `color`；舊 `*box` 名稱保留為相容別名。字串與 object 寫法都可搭配 Column `charcase`。 |
| `charcase` | `string` | 可設為 `upper` 或 `lower`，套用於 `text`、`combo`、`color` editor；`date`、`time`、`number` 不套用。只轉換 ASCII 英文字母，中文、數字、空白及符號維持原值。 |
| `thousandsSeparator` | `boolean` | number 顯示千分位。 |
| `precision` | `number` | number 顯示與提交時的小數位。 |
| `mask` | `string` | 文字／時間／日期遮罩；支援 `9`、`A`、`*`。Time 預設 `99:99`，也支援 `99:99:99`。 |
| `maskValueIncludesLiterals` | `boolean` | 資料值是否保留 `/` 等遮罩字元。 |
| `autoUnmask` | `boolean` | 所有 editor 類型預設為 `false`；複製與資料輸出時保留遮罩字面值。明確設為 `true` 時移除遮罩。 |
| `validate` | `(args) => ValidationResult \| Promise<ValidationResult>` | 同步或非同步驗證；本機唯一值可呼叫 `args.isDuplicate(options?)`。 |

Footer aggregate 會依目前 `dataView` 快取；cell 編輯提交、`setCellData()`、資料來源更新、排序、篩選、分頁或遠端載入完成後會標記為 dirty，下一次 render 只額外重畫 Footer，不必連帶重建 Header。一般選取及資料未變更的重畫沿用快取。自訂 aggregate 若依賴 Grid 以外的狀態，請在狀態改變後呼叫 `refreshFooter()`；`column.footer` callback 不使用此快取。

`isRequired: true` 的內建必填驗證會先執行，錯誤以 `type: 'required'` 存入 `grid.invalidItems`；數值 `0` 與 boolean `false` 都是有效值。通過必填驗證後才執行 `validate`。`validate` 回傳 `null`、`false` 或空字串表示通過；回傳字串或 `{ message }` 表示失敗。所有驗證失敗項目都存放於 `grid.invalidItems`，值修正後會自動移除對應錯誤。資料列刪除或資料來源被取代後，該列的同步／非同步錯誤會自動移除；排序、篩選、分頁及欄位顯示或順序改變時，保留項目的 `rowIndex`／`rowNumber`／`colIndex`／`colNumber` 會同步更新。

`validate(args)` 的 `args.isDuplicate(options?)` 會使用目前 Column binding 與準備寫入的新值，檢查完整本機資料來源並自動排除目前資料列。`null`、`undefined`、空字串與純空白永遠不視為重複；非空白字串會先移除前後空白再比較。預設區分大小寫，傳入 `{ ignoreCase: true }` 可忽略大小寫。支援 Array、CollectionView、`observeItemsSource`、巢狀 binding 與 TreeGrid：

```js
column.validate = function(args) {
  return args.isDuplicate({ ignoreCase: true })
    ? '此欄位不可重複'
    : null;
};
```

`cssClass` 可在 Grid 初始化前直接放入 Column definition：

```js
const columns = [
  {
    binding: 'amount',
    header: '金額',
    cssClass: 'amount-cell amount-emphasis'
  }
];
```

此 class 只套用 body 資料 cell；Header 樣式請使用 `setHeaderCellStyle()` 或 `formatItem`。

### Cell template

`cellTemplate` 採 Wijmo-compatible 契約，只改變 body cell 顯示，不影響 editor、clipboard、CSV／Excel／JSON 匯出所使用的原始 binding value。Function template 的 context 包含 `col`、`row`、`item`、`value`、`text`；第二個參數是目前 cell element。

```js
grid.columns[idx].cellTemplate = (ctx, cell) => {
  cell.textContent = `${ctx.row.index + 1}. ${ctx.text}`;
  return null;
};
```

Function template 也可以回傳 HTML：

```js
grid.columns[idx].cellTemplate = (ctx) => (
  `<span class="${ctx.value > 0 ? 'change-up' : 'change-down'}">${ctx.text}</span>`
);
```

String template 使用 `${value}`、`${text}`、`${col}`、`${row}`、`${item}` scope：

```js
grid.columns[idx].cellTemplate =
  '<span class="${value > 0 ? \'change-up\' : \'change-down\'}">${text}</span>';
```

Runtime 指派會自動 invalidate Grid。Template 回傳內容會以 HTML 插入；不得直接插入未經處理的不可信資料。Function template 效能較好，也不需要 CSP 的 `unsafe-eval`；String template 需要允許動態函式編譯。

需要可點擊的連結 cell 時，可使用 Wijmo-compatible `FabGrid.CellMaker.makeLink(options)`。`text`、`href` 與 `title` 可使用 template string 或 callback；`click(event, ctx)` 會在取消連結預設動作後執行：

```js
column.cellTemplate = fabui.FabGrid.CellMaker.makeLink({
  text: '<b>${item.orderNo}</b>',
  click: function(event, ctx) {
    openOrder(ctx.item.id);
  }
});
```

連結會建立為 `<a class="fg-cell-maker">`，使用 Grid 的 `--fg-link-text` 顏色；選取 cell 時文字顏色改為繼承選取狀態。

Function callback 執行前，FabGrid 會保存 cell 原本的 inline style。Callback 中直接指定 `cell.style = customStyle` 時，FabGrid 會把變更過的視覺樣式疊加回原樣式，並保護定位與尺寸屬性；指定 `cell.style = null` 時，callback 後會還原成原本的 Grid style。因此不需要自行保存或串接 `cell.style.cssText`。

```js
grid.columns[idx].cellTemplate = (ctx, cell) => {
  cell.style = ctx.value > 0 ? 'color: green; background: #efffed;' : null;
  return ctx.text;
};
```

## 4. 實例方法

### 資料與欄位

所有公開方法的數字欄位參數都對應完整 `grid.columns` index，包含隱藏欄位；十進位整數字串（例如 `"1"`）視為相同 index，不再依方法混用 `visibleColumns` index。欄位 `binding`／`name`／`header` 必須以字母開頭，因此不會和數字字串衝突。需要操作畫面 cell 的方法若指定隱藏欄位會回傳 `false`，`getCellData()`／`setCellData()` 則可直接讀寫隱藏欄位。

| 方法 | 說明 |
| --- | --- |
| `setItemsSource(rows)` | 替換本機資料來源並重新建立 view。 |
| `clearSort()` | 一次清除所有單欄／多欄排序；成功回傳 `true`，目前沒有排序時回傳 `false`。本機與 CollectionView 立即恢復原始順序；遠端模式回到第 1 頁並自動重新載入。 |
| `getSortState()` | 取得安全的排序狀態快照，包含 `active` 與 `sortStates`；每個排序項目包含 `columnIndex`、`visibleColumnIndex`、`binding`、數字 `direction`、字串 `order` 及 `sortIndex`。 |
| `setColumns(columns)` | 替換欄位集合。 |
| `setColumnVisible(column, visible)` | 顯示／隱藏指定欄；數字或十進位整數字串 `column` 為完整 `grid.columns` index，也可傳入該 Grid 的 Column object，不接受 binding 字串。成功回傳 `true`。 |
| `setHeaderCellStyle(binding, style)` | 以欄位 `binding` 設定 Header cell style object；保留原樣式，同名 property 由傳入樣式覆蓋。傳入 `null` 清除，成功回傳 `true`。 |
| `autoSizeColumn(column)` | 依 header、目前 view、群組 aggregate 與可見 footer 自動調整指定欄寬；成功回傳新寬度。 |
| `setRowGroups(groups)` | 設定 1 至 3 階群組設定。 |
| `toggleRowGroup(rowIndex)` | 展開或收合指定群組列，並觸發群組收合事件。 |
| `toggleAllRowGroups()` | 依目前狀態展開或收合所有列群組。 |
| `isRowGroup(item)` | 判斷資料項目是否為合成群組列。 |
| `isRowGroupFooter(item)` | 判斷資料項目是否為合成 group footer。 |
| `setChildItemsPath(path)` | 設定子節點 path／callback 並重新建立 TreeGrid view；傳入 `null` 可停用。 |
| `getTreeRow(row)` | 取得可視樹列 descriptor，包含 `dataItem`、`level`、`parentItem`、`hasChildren`、`isCollapsed`、`rowNumber`。 |
| `toggleTreeNode(row, collapsed?)` | 切換或指定可視樹節點的收合狀態。 |
| `moveTreeItem(item, targetItem, position)` | 移動或插入 TreeGrid 節點；`position` 為 `'before'`、`'inside'`、`'after'`。成功回傳移動結果，無效或形成循環時回傳 `false`。 |
| `insertTreeItem(item, parentItem?, index?)` | 將新節點插入根層或指定父節點。 |
| `removeTreeItem(item)` | 從 TreeGrid 階層移除指定節點。 |
| `moveFlatRowItem(item, targetItem, position)` | 依 `'before'`／`'after'` 重排一般 Grid 的本機資料列。 |
| `removeRowItem(item)` | 從一般 Grid 或 TreeGrid 移除指定資料項目。 |
| `collapseGroupsToLevel(level)` | 將指定階層及以下的父節點收合；`0` 只保留根節點。 |
| `expandAllTreeNodes()` | 展開所有 TreeGrid 節點。 |
| `refreshTree()` | 子節點陣列直接變動後重新建立可視樹列。 |
| `getColumn(indexOrName)` | 依完整 `grid.columns` index（含十進位整數字串）、`binding`、`header` 或 `name` 取得欄位。 |
| `getCellData(row, col)` | 依完整 `grid.columns` index 讀取目前 view 的 cell 值，包含隱藏欄位。 |
| `setCellData(row, col, value)` | 依完整 `grid.columns` index 寫入目前 view 的 cell 值，包含隱藏欄位；成功回傳 `true`。 |
| `toggleSort(col, multiSort?)` | 依完整 `grid.columns` index 切換排序；隱藏或不存在的欄位回傳 `false`。 |
| `beginUpdate()` | 暫停後續 View 更新；可巢狀呼叫，期間資料與一般事件仍照常更新。 |
| `endUpdate(shouldInvalidate?)` | 結束一層批次更新；最外層結束時只執行一次累積的更新。`shouldInvalidate` 預設為 `true`，傳入 `false` 時不自動更新畫面。 |
| `deferUpdate(callback)` | 以 `beginUpdate()`／`endUpdate()` 執行 callback；callback 發生例外時仍會恢復更新，並將例外繼續拋出。 |
| `refresh()` | 重新計算版面與渲染。 |
| `invalidate()` | 標記 Footer aggregate dirty，並在下一個 animation frame 重新渲染；可涵蓋公式直接更新其他唯讀 cell 的情況。 |
| `on(name, handler)` | 註冊 Grid 事件；handler 固定接收 `(grid, eventArgs)`。 |
| `off(name, handler)` | 解除以 `on()` 註冊的 Grid 事件。 |
| `addEventListener(target, type, fn, capture?, passive?)` | 以 Wijmo-compatible Control API 綁定 DOM event；Grid 會管理 listener，並在 `dispose()` 自動解除。 |
| `removeEventListener(target?, type?, fn?, capture?)` | 移除符合條件的 managed DOM listeners，回傳移除數量；不傳參數時全部移除。 |
| `hitTest(point, y?)` | 以 `MouseEvent`、HTMLElement、Point 或 page 座標取得 cell 的 `panel`、`cellType`、`row`、`col`、`viewCol`、`column`、`range`、`mergedRange` 與 `target`；`col` 對應 `grid.columns`，群組／跨列 Header 會回傳 `mergedRange`，Search Row 另有 `isSearchRow: true`。 |
| `dispose()` | 移除 DOM 與事件；元件不再可用。 |

`isUpdating` 是唯讀 boolean，位於 `beginUpdate()` 與最外層 `endUpdate()` 之間時為 `true`。大量修改欄位或 options 時可使用：

```js
grid.deferUpdate(() => {
  grid.setColumns(columns);
  grid.setItemsSource(rows);
  grid.setFrozenColumns(2);
});
```

`setHeaderCellStyle()` 只比對實際 `binding`，不以 `header` 或 `name` 代替。Style 支援 camelCase、kebab-case 與 CSS custom property；FabGrid 會先套用原本的 Header 樣式，再疊加指定樣式，同名 property 以指定值為準。方法會複製傳入 object，後續修改原 object 不會改變已設定樣式。

```js
grid.setHeaderCellStyle('orderNo', {
  backgroundColor: '#fff4cc',
  color: '#663c00',
  'font-weight': 700
});

grid.setHeaderCellStyle('orderNo', null);
```

### 顯示與互動

| 方法 | 說明 |
| --- | --- |
| `setFrozenColumns(count)` | 設定左側凍結欄數。 |
| `setFrozenRightColumns(count)` | 設定右側凍結欄數。 |
| `setRowHeaderWidth(width)` | Runtime 設定列號欄寬度並自動重新計算 layout 與 refresh；負數會限制為 `0`。 |
| `setShowRowHeaders(value)` | 切換列號欄。 |
| `setShowFooter(value)` | 切換 footer aggregate 列。 |
| `getFooterRows()` / `getFooterRowCount()` | 取得 Footer 列定義快照或列數。 |
| `getFooterCellData(row, column, formatted)` | 以列 index／`key` 與完整欄位 index／Column／binding 取得 Footer 值。 |
| `setFooterCellData(row, column, value, refresh?)` | 寫入指定 Footer cell；`refresh` 預設為 `true`，批次寫入時可傳 `false` 後再呼叫 `refreshFooter()`。`columnFooters.getCellData()`／`setCellData()` 亦提供相同 panel 操作。 |
| `getFooterRowLabel(row)` / `setFooterRowLabel(row, label, refresh?)` | 讀寫指定 Footer 左側列頭文字；`bottomLeftCells` panel 亦可讀寫。 |
| `refreshFooter()` | 清除 Footer aggregate 快取並立即重畫 Footer；自訂 aggregate 依賴 Grid 外部狀態時可手動呼叫。 |
| `setAllowFiltering(value)` | 舊版相容方法。`false` 委派至 `setFilterMode(false)`；`true` 委派至預設的兩種模式。 |
| `setFilterMode(mode)` | 設定可用模式與目前模式；規則與 `filterMode` option 相同。回傳是否有實際改變。 |
| `getFilterMode()` | 回傳目前 `filterMode` 的副本，關閉時回傳 `false`。 |
| `isFullscreen()` | Grid root 目前是否處於 fullscreen。 |
| `isFullscreenAvailable()` | 瀏覽器是否支援 Grid fullscreen。 |
| `toggleFullscreen()` | 切換 Grid root fullscreen；不支援時回傳 `false`。 |
| `setEditMode(value)` | `true` 時點選 cell 即開始編輯。 |
| `setMultiSelectRows(value)` | 切換多選列 checkbox 欄。 |
| `setHeaderDisplayMode(mode)` | 設定 `'header'` 或 `'binding'`。 |
| `toggleHeaderDisplayMode()` | 切換標題顯示模式，並回傳新模式。 |
| `getHeaderDisplayMode()` | 取得目前標題顯示模式。 |
| `setLocale(locale, messages)` | 切換 locale 或覆寫顯示文字。 |

需要等待其他區塊處理資料時，可暫停使用者導覽而不封鎖程式控制：

```js
grid.stopNavigation = true;

grid.selectRow(3);
grid.scrollIntoView(3, 0);

grid.stopNavigation = false;
```

`stopNavigation` 不會清除目前 selected row，也不會阻止 `select()`、`selectRow()`、`scrollIntoView()`、`scrollPosition` 或資料更新 API。

### 篩選與搜尋

初始化時可直接傳入與遠端協定相同的 `filterRules`。不必另外呼叫 `setColumnSearchOperator()` 或 `setColumnSearch()`：

```js
var grid = new fabui.FabGrid('#grid', {
  itemsSource: data,
  columns: [
    { binding: 'status', header: '狀態' },
    { binding: 'amount', header: '金額', dataType: 'number' }
  ],
  filterRules: [
    { field: 'status', op: 'eq', value: '草稿' },
    { field: 'amount', op: 'gte', value: 1000 }
  ]
});
```

上例會自動顯示 Search Row，在 `status` input 填入「草稿」並顯示 `=`，在 `amount` input 填入 `1000` 並顯示 `≥`。本機模式支援 `starts`、`contains`、`ends`、`not-starts`、`not-contains`、`not-ends`、`gte`、`gt`、`lte`、`lt`、`ne` 與 `eq`；省略 `op` 時使用 `starts`。`remote: true` 時不套用這份白名單，自訂 `op` 會保留大小寫與符號並原樣送出。

`remote: true` 的 SQL-like 字串運算符會另外映射到既有 Search Row filter icon，但 request 仍保留原始 `op`：`%..%` 對應包含、`..%` 對應開頭、`%..` 對應結尾；前置 `!` 分別對應不包含、非開頭與非結尾。

遠端模式使用 `method: 'POST'` 時，初始化規則會以 JSON 字串放入 `application/x-www-form-urlencoded` Form Data 的 `filterRules` 欄位；規則即使對應到未顯示的伺服器欄位，也會保留在 request 中。

| 方法 | 說明 |
| --- | --- |
| `setFilter(predicate)` | 本機模式設定資料列 predicate；遠端模式不可使用。 |
| `clearFilter()` | 清除 predicate、全域搜尋、Search Row 與 Excel-like 欄位篩選，並觸發 `filterChanged`。 |
| `setFilterRules(rules)` | 在 Grid 建立後一次取代所有 `filterRules`，同步 Search Row input 與運算符，並只觸發一次篩選更新；`remote: true` 時保留自訂 `op` 並重新載入。 |
| `getFilterRules()` | 取得目前實際生效、下一次會送給後端的 rules 陣列；包含 Search Row 最新 input 值，並回傳可安全修改的副本。 |
| `getFilterState()` | 取得安全的完整篩選狀態快照，包含 `active`、目前 `filterMode`、`filterPredicateActive`、Quick Search、`filterRules`、Search Row 值／運算符及 Excel-like filters；不直接暴露 predicate 函式。 |
| `setSearch(text)` | 設定全域搜尋字串。 |
| `setColumnSearch(column, value)` | 設定單欄搜尋值；數字 `column` 為完整 `grid.columns` index，目前模式不是 `'searchRow'` 時回傳 `false`。 |
| `setColumnSearchOperator(column, operator)` | 設定欄位運算子，例如 `starts`、`contains`、`gte`、`eq`；數字 `column` 為完整 `grid.columns` index，目前模式不是 `'searchRow'` 時回傳 `false`。 |
| `clearColumnSearch()` | 清除所有欄位搜尋。 |
| `clearSearchConditions(source)` | 清除全域與欄位搜尋，並觸發 `searchCleared`。 |
| `setExcelFilter(column, filter)` | 目前模式為 `'excel'` 時設定 Excel-like 值篩選，格式為 `{ type: 'values', values: [...] }`；數字 `column` 為完整 `grid.columns` index，其他模式回傳 `false`。 |
| `getExcelFilter(column)` | 依完整 `grid.columns` index 或欄位名稱取得 Excel-like filter 副本；未設定時回傳 `null`。 |
| `clearExcelFilter(column)` | 依完整 `grid.columns` index 或欄位名稱清除 Excel-like filter。 |
| `clearExcelFilters(source?)` | 清除全部 Excel-like filters。 |

Excel-like 篩選 popup 會掛載到頁面 popup layer，以 fixed position 對齊 Header filter icon，因此可以超出 Grid 高度。它會比較 Header 上方與下方的 viewport 可用空間，自動決定開啟方向與高度；候選值超出空間時只捲動 popup 內的值清單，不會增加 Grid 高度。這項行為不需要額外 option。

`excelFilterMaxValues` 只限制最多收集的唯一候選值數量，不是畫面可見筆數或 popup 高度設定。Popup 開啟時可按 `Escape` 或點擊外部關閉；尚未按「套用」的選取變更不會寫入篩選條件。Grid 進入 fullscreen 時，popup 會改掛到 fullscreen element；關閉或 `dispose()` 時會移回 Grid 並清除 viewport listener。

所有 Grid popup（右鍵選單、Filter、欄位選擇器與 date／combo／color editor panel）都會在點擊外部時關閉；點擊 popup 內部或其 trigger 不會誤關閉。若同時存在多個 popup，點進其中一個會關閉其餘 popup。關閉 popup 不會自動套用、清除或提交尚未確認的內容。

Filterable Header 的漏斗 icon 使用獨立 hit area。點擊漏斗只開啟篩選選單，不會同時觸發排序或欄位拖曳；欄位右邊界仍可拖曳調寬或雙擊 AutoFit。

Search Row 遇到 `date`、`combo`、`color` editor 時會使用相同類型的下拉 panel。搜尋輸入只建立 filter，不會執行 cell editor 的欄位驗證。

Search input 聚焦時按 `↓`，焦點會移到目前 selected row 的同欄 active cell，不會移動資料列或啟動 editor。若目標已捲出畫面，Grid 會先將它捲入可視範圍。

第一列 active cell 按 `↑` 會回到同欄 Search input。Popup 開啟時，方向鍵優先由 popup 處理。

頁面同時存在多個 FabGrid，或一個 FabGrid 位於另一個 FabGrid 內時，方向鍵只由最後取得 pointer／焦點且為事件來源最近 `.fg-root` 的 Grid 處理；Grid 消化方向鍵、Page、Home 或 End 導覽後會停止事件冒泡，避免頁面層或另一套鍵盤 handler 再次移動 Grid。即使頁面轉送事件或焦點暫時回到頁面層，同一個動作仍只處理一次，其他 Grid 的 selection 不會跟著移動。

### 分頁、遠端載入與選取

| 方法 | 說明 |
| --- | --- |
| `load(params)` | 在遠端模式載入資料，回傳 `Promise<boolean>`。 |
| `reload()` | 依目前狀態重新載入遠端資料。 |
| `setPage(pageNumber)` | 切換頁碼。遠端模式回傳 `Promise<boolean>`，本機模式回傳 `boolean`。 |
| `setPageSize(pageSize)` | 改變 page size 並回到第一頁。 |
| `selectPage(pageNumber, pageSize)` | 同時設定頁碼與 page size。 |
| `getPager()` | 取得 `.fg-pager` 外層 DOM element。 |
| `select(row, col?)` | 設定 active cell；明確傳入的 `col` 對應完整 `grid.columns` index 並計入隱藏欄位，可直接和 `formatItem` 的 `e.col`、`editRange.col` 比較；省略 `col` 時使用第一個可見欄。指定隱藏欄位，或 Row／Column index 不在目前可用範圍時，回傳 `false` 且不做任何動作，不會自動 clamp 到第 0 列或最後一列。若目標列未完整顯示，會自動捲動並盡量將該列對齊 Grid 可視區第一列。 |
| `startEditing(fullEdit?, row?, col?, focus?, event?)` | Wijmo-compatible 呼叫方式；`startEditing(false)` 會編輯目前 active cell。省略 row／col 時使用目前 selection；數字 `col` 對應完整 `grid.columns` index，也接受 Column `name`／`binding`／`header`。`focus` 預設為 `true`；傳入 `false` 時建立 editor 但不移動焦點。隱藏、唯讀或不存在的 cell 回傳 `false`。既有 `startEditing(row, col, options?)` 的 `col` 也使用完整 index。 |
| `selectRange(row, col, row2, col2)` | 在 `CellRange` 模式設定連續矩形範圍；兩個 `col` 都使用完整 `grid.columns` index，前兩個座標為 anchor，後兩個座標為 active cell。 |
| `selectRow(row, col?)` | 選取一列；指定 `col` 時使用完整 `grid.columns` index。 |
| `unselectRow(row?)` | 取消指定 selected row；單選模式可省略 `row` 以取消目前 selected row，成功後 `selectedRows`／`selectedItems` 為空，排序、篩選或 refresh 後仍保持未選取。多選模式則取消指定或最後操作列的勾選。Active cell 不屬於此方法的行為契約。 |
| `selectAll()` | 將 active cell 移至第一個 cell 並觸發選取事件。 |
| `scrollIntoView(row, col, options?)` | 依完整 `grid.columns` index 捲動指定 cell 至可見範圍；隱藏欄位回傳 `false`。 |
| `validateRow(row)` | 驗證 `itemsSource` 的指定列，回傳 `Promise<boolean>`。 |
| `getSelectedText()` | 取得目前 cell、CellRange 或 RowHeader 整列選取的 TSV 文字；整列只包含可見欄位，合成群組列會被排除。 |
| `copySelection()` | 將目前選取內容寫入系統剪貼簿，成功開始複製時回傳 `true`。 |
| `getClipString()` | Wijmo-compatible alias；回傳值等同 `getSelectedText()`。 |
| `setClipString(text)` | 將文字寫入目前 active cell；回傳值等同 `setCellData()`。 |

### 由 element 或 id 取得 Grid

`fabui.Control.getControl(elementOrSelector)` 可由 FabGrid 的 host element 或 CSS selector 取得既有 instance；沒有對應 Grid 時回傳 `null`。`grid.hostElement` 會回傳建立 Grid 時使用的 host element。

`grid.hasFocus` 是唯讀 boolean；目前 `document.activeElement` 位於該 Grid 內時為 `true`，否則為 `false`。頁面有多個 Grid 時，同一時間最多只有一個 Grid 的 `hasFocus` 為 `true`。

### DOM event 與 hitTest

`addEventListener()` 綁定的 listener 由 Control 管理，`dispose()` 時會自動解除。處理資料 cell 時應判斷 `hitTest()` 的 `cellType`，不要只檢查 `e.target.classList`，因為實際 target 可能是 Header、Search Row 或 cellTemplate 內的子元素。

Search Row 在 FabGrid 中屬於 `ColumnHeader` panel，並額外提供 `isSearchRow: true`。只允許一般資料 cell 的寫法如下：

```js
grid.addEventListener(grid.hostElement, 'dblclick', function(e) {
  var ht = grid.hitTest(e);
  if (ht.cellType !== fabui.CellType.Cell || ht.row < 0 || ht.col < 0) {
    return;
  }

  var row = grid.rows[ht.row];
  if (row instanceof fabui.FabGrid.GroupRow) {
    return;
  }

  var item = row.dataItem;
  var binding = grid.columns[ht.col].binding;
});
```

若只需要單獨辨識 Search Row，也可以使用：

```js
if (grid.hitTest(e).isSearchRow) {
  return;
}
```

### Cell 與 CellRange 選取

`selectionMode: 'Cell'` 維持單一 active cell；`highlightActiveRow` 只控制 active row 背景，預設為 `true`。設為 `false` 不會清除 active cell，也不會影響 `multiSelectRows` 已勾選的資料列。

在 `Cell` 與 `CellRange` 模式點擊左側 RowHeader，都會建立整列選取。RowHeader 維持原本外觀，資料 cell 使用整列範圍背景及外框；`Ctrl/Cmd + C` 依目前可見欄位順序輸出 Tab 分隔文字，不包含欄位標題及隱藏欄位。點擊一般資料 cell 後會清除 RowHeader 整列選取狀態。編輯器開啟時仍由 editor 處理文字選取與複製。

`selectionMode: 'CellRange'` 支援以下操作：

- 在資料 cell 按下滑鼠並拖曳，選取連續矩形範圍。
- 沿列號上下拖曳會選取連續的整列範圍。
- `Shift + Click` 從既有 anchor 延伸到點擊的 cell。
- `Shift + 方向鍵` 延伸範圍；一般方向鍵會移動 active cell 並回到單一 cell。
- `Ctrl/Cmd + C` 複製範圍為 tab／換行分隔文字。
- GroupRow 與 group footer 不會加入 cell range，也不會寫入範圍複製結果。

CellRange 使用資料列選取背景標示範圍，active cell 保留一般 cell 背景，並維持與單格選取相同的完整四邊框。範圍四周外框與 active cell 共用 `activeCellBorder` 的粗細；設為 `0` 時兩者都不顯示外框。`CellRange` 不會因為 `highlightActiveRow` 而額外填滿 active row。Default 與所有外部主題分別透過 `--fg-range-selected-bg`、`--fg-range-active-bg`、`--fg-range-border` 套用各自主題的範圍背景、active cell 背景與邊框色。

一般鍵盤導覽另支援：

- `Page Up`／`Page Down`：保持目前欄位並移動一個可視頁面。
- Windows／Linux `Ctrl + 方向鍵`：跳到同欄資料首尾或同列左右邊界。
- macOS `Fn + Option + ↑/↓`：跳到同欄資料首尾；DOM key 對應 `Option + PageUp/PageDown`。
- macOS `Fn + ←/→` 或 `Fn + Option + ←/→`：跳到同列左右邊界；DOM key 對應 `Home/End` 或 `Option + Home/End`。

```js
const grid = new fabui.FabGrid('#grid', {
  selectionMode: fabui.FabGrid.SelectionMode.CellRange,
  highlightActiveRow: false,
  itemsSource: rows,
  columns: columns
});

grid.selectRange(2, 1, 5, 3);
```

```js
const grdId = 'ordersGrid';
const grid = fabui.Control.getControl('#' + grdId);

if (grid) {
  grid.refresh();
}
```

FabGrid 建立完成後會自動登記，呼叫 `grid.dispose()` 時自動解除，因此不需要額外維護全域 Grid 變數。

### 匯出

| 方法 | 說明 |
| --- | --- |
| `getCsv(visibleOnly?)` | 取得 CSV 字串；預設輸出可見欄，傳入 `false` 時輸出所有欄位。 |
| `exportCsv(filename?, visibleOnly?)` | 下載 CSV。 |
| `getJson(options?)` | 取得 JSON 字串；預設輸出完整 `itemsSource`。傳入 `{ viewOnly: true }` 時輸出目前 view 並排除 group／group footer 合成列；`space` 與 `replacer` 會傳給 `JSON.stringify()`。 |
| `exportJson(filename?, options?)` | 下載 JSON，預設檔名為 `fabgrid.json`。 |
| `importJson(source)` | 匯入 JSON 並透過 `setItemsSource()` 更新 Grid，回傳 `Promise<boolean>`；支援 JSON 字串、Array、`{ rows }`、`{ itemsSource }`、Blob 與 File。 |
| `getExcelBlob(options?)` | 取得 XLSX `Blob`；`options` 支援 `{ sheetName, visibleOnly }`。為相容舊版也可直接傳入 boolean。 |
| `exportExcel(filename?, options?)` | 下載 XLSX，回傳 `Promise<boolean>`；`options` 支援 `{ sheetName, visibleOnly }`，預設檔名為 `fabgrid.xlsx`。為相容舊版也可直接傳入 boolean。 |

JSON 匯入／匯出範例：

```js
const json = grid.getJson({ space: 2 });

grid.exportJson('orders.json', { space: 2 });

await grid.importJson(json);
await grid.importJson(fileInput.files[0]);
```

Excel 工作表名稱與多工作表範例：

```js
grid.exportExcel('會計資料.xlsx', {
  sheetName: '會計科目',
  visibleOnly: false
});

fabui.Excel.export('主檔資料.xlsx', {
  sheets: [
    { name: '會計科目', grid: accountGrid },
    { name: '客戶資料', grid: customerGrid, visibleOnly: true }
  ]
});

const blob = fabui.Excel.getBlob({
  sheets: [
    { name: '會計科目', grid: accountGrid },
    { name: '客戶資料', grid: customerGrid }
  ]
});
```

工作表名稱會自動移除 Excel 不允許的字元、限制為 31 個字元；重複名稱會依序加上 ` (2)`、` (3)`。

JSON 使用標準 `JSON.stringify()`／`JSON.parse()`；日期會依 JSON 規格成為字串，循環參照與 `BigInt` 會由 `JSON.stringify()` 拋出錯誤。預設輸出完整 `itemsSource` 是為了保留 TreeGrid 階層與未顯示資料；只有明確指定 `viewOnly: true` 才輸出目前篩選／排序／分頁後的 view。

CSV 與 Excel 都以目前 Grid view 為資料來源。Excel 預設保留完整欄位集合；畫面隱藏的欄位仍包含資料，並在工作表標記為 hidden。只有明確傳入 `visibleOnly: true` 或相容 boolean `true` 才排除隱藏欄。群組啟用時會保留群組列、aggregate 顯示格式與收合狀態；工作表同時包含凍結窗格、autoFilter 與目前 `headerDisplayMode` 對應的標題。

### Header Row 右鍵功能表

在一般欄位 Header Row 按滑鼠右鍵會開啟 Grid 功能表；左上角列頭、Search Row 與一般資料列不會觸發。正規化後的 `filterMode.length > 1` 時，功能表提供切換目前篩選模式；單一模式時不顯示此項目。另有清除所有篩選、列號、匯出 Excel、匯出 CSV 與 Grid fullscreen。

啟用任一 `filterMode` 時，「清除篩選」會清除 predicate、全域搜尋與所有欄位搜尋；`filterMode: false` 時不顯示此項目。「列號」的下層功能表提供關閉、顯示列號及只顯示 cell，並以勾選標示目前模式；`showRowHeaderMenu: false` 時不顯示整個「列號」項目，但不會改變目前列號欄狀態。`showFullscreenMenu` 預設為 `false`，只有設為 `true` 時才顯示 Grid 全螢幕／離開全螢幕項目。功能表文字跟隨目前 locale，篩選模式與 fullscreen 項目會依當下狀態切換文字。TreeGrid 樹欄資料 cell 是唯一例外，右鍵時使用同一 popup 顯示全部展開／全部疊合。

## 5. 事件

所有 Grid 事件 callback 統一使用 `(grid, eventArgs)`。Constructor option、`grid.on()` 與 Wijmo-compatible `addHandler()` 使用完全相同的參數契約；每個 `eventArgs` 都固定包含 `grid`、`type` 與 `cancel`，且 `eventArgs.grid === grid`。

支援取消的事件可設定 `eventArgs.cancel = true` 或由 handler 回傳 `false`；完成後事件不接受取消。

```js
grid.on('selectionChanged', function(g, e) {
  console.log(g === e.grid); // true
  console.log(e.activeRow, e.activeCol, e.range);
});

grid.on('cellEditEnding', function(g, e) {
  if (e.value === 'blocked') return false;
});
```

| 事件 | 觸發時機 |
| --- | --- |
| `itemsSourceChanging` / `itemsSourceChanged` | 資料來源更新前／後。遠端成功回應套用新 rows 時也會觸發 `itemsSourceChanged`，並帶有 `remote: true`；失敗、取消或過期回應不觸發。 |
| `loadingRows` / `loadedRows` | 本機資料載入流程前／後。 |
| `beforeLoad` / `loadSuccess` / `loadError` | 遠端載入前、成功或失敗。 |
| `pageChanging` / `pageChanged` | 分頁變更前／後。 |
| `selectionChanging` / `selectionChanged` | Active cell、cell range 或列選取變更；固定包含 `row`、`col`、`row2`、`col2`、anchor／active 座標、`range`、對應的 `view*` 座標，以及列勾選用的 `changedRow`、`selected`、`allRows`。`col` 系列使用完整 `grid.columns` index，`view*` 使用可見欄 index；不適用的 `changedRow`／`selected` 為 `null`，一般 cell 選取的 `allRows` 為 `false`。列選取、取消與全選會先依序觸發可取消的 `selectionChanging`、`rowSelectionChanging`，任一事件取消時都不改變狀態。 |
| `selectedRowChanged` | Selected row 改變或資料來源更新時觸發；`reason` 為 `'selection'` 或 `'itemsSource'`，並包含目前與先前的 row index／data item。同一 row 只切換 active column 不觸發。 |
| `sortingColumn` / `sortedColumn` | 排序前／後；`sortingColumn` handler 回傳 `false` 可取消本機或遠端排序，取消時不會送出遠端查詢。 |
| `cellEditEnding` / `cellEditEnded` | cell 編輯提交前／後；`e.col` 對應完整 `grid.columns` index 並計入隱藏欄位，`e.viewCol` 為目前 `visibleColumns` index。 |
| `resizingColumn` / `resizedColumn` | 拖曳欄寬期間／完成後。 |
| `autoSizingColumn` / `autoSizedColumn` | AutoFit 套用欄寬前／後；前者可取消或調整 `e.width`。 |
| `filterModeChanged` | `setFilterMode()` 改變設定後；`e.filterMode` 為正規化後的模式、`e.activeMode` 為目前模式或 `null`，`e.clearedFilter` 表示是否清除原模式的欄位條件。 |
| `rowHeaderModeChanged` | 呼叫 `setShowRowHeaders()` 改變列號模式後；`e.mode` 為 `true`、`false` 或 `'cell'`。 |
| `draggingRow` | Row drag 開始或進入新落點時；可回傳 `false` 取消，`e.phase` 為 `'start'` 或 `'over'`。 |
| `draggedRow` | Row drop 完成後；包含 `e.sourceGrid`、`e.targetGrid`、`e.item`、`e.targetItem`、`e.position`。 |
| `groupCollapsedChanging` / `groupCollapsedChanged` | 群組或 TreeGrid 節點收合前／後；TreeGrid event args 會包含 `tree: true`、`row`、`item`、`level`、`collapsed`。 |
| `updatingLayout` / `updatedLayout` | 版面更新前／後；`updatingLayout` 可回傳 `false` 取消該次 layout 與 render，且不觸發 `updatedLayout`、`updatedView` 或對應完成事件。 |
| `viewportChanged` | 可視 row、column 範圍或 render cell 數變動。 |
| `columnVisibilityChanged` | 欄位顯示狀態變更。 |
| `filterChanged` | Filter 條件套用完成後觸發；`setFilter()`、全域搜尋、Search Row、Excel-like 篩選、模式切換與所有清除 filter 操作都會觸發。 |
| `gotFocus` / `lostFocus` | 焦點從 Grid 外進入／從 Grid 內離開時觸發；Grid 內部切換焦點不觸發。 |
| `formatItem` | Grid cell element 完成預設內容與格式後觸發；可使用 `formatItem.addHandler((g, e) => {})` 修改 Header、Footer、資料 cell 或列頭 DOM。 |
| `searchCleared` | 呼叫 `clearSearchConditions()`。 |
| `excelExporting` / `excelExported` / `excelExportFailed` | Excel 匯出流程；`excelExporting` 可回傳 `false` 取消，且不會進入 busy 狀態或下載檔案。 |

`cellEditStarting` 是 `beginningEdit` 的相容別名，兩者共用同一個 Event object；`cellCopied` 是 `copiedCell` 的相容別名。新程式應優先使用 `beginningEdit` 與 `copiedCell`。

同一個動作的前置與完成事件各自取得獨立的 event args object。Handler 若保留前置事件的 `e` 供非同步流程或除錯使用，其 `e.type`、`e.grid` 與其他欄位不會被後續完成事件改寫；同一事件內的各個 handler 仍共用該次派送的 args，並可依事件契約修改 `e.value`、`e.width` 或 `e.cancel`。

所有 FabGrid 公開事件參數中的 `e.col`／`e.col2`／`e.activeCol`／`e.anchorCol` 都使用完整 `grid.columns` 索引並計入隱藏欄位；需要可見欄索引時使用對應的 `viewCol` 欄位。`formatItem` 原本即遵循此規則，clipboard 與編輯事件也一致。

所有公開 Grid 事件都可以直接在 constructor options 定義，callback 簽名為 `(grid, eventArgs)`。例如 `selectionChanged`：

```js
const grid = new fabui.FabGrid('#grid', {
  itemsSource: rows,
  columns: columns,
  selectionChanged: (g, e) => {
    console.log(e.row, e.col, g.view[e.row]);
  }
});
```

`updatedView` 同樣可直接定義，初次 render 與後續 view 更新都會呼叫：

```js
const grid = new fabui.FabGrid('#grid', {
  itemsSource: rows,
  columns: columns,
  updatedView: (g, e) => {
    console.log(e.totalRows);
  }
});
```

`filterChanged` 會在目前 filter 套用並 refresh 後觸發：

```js
grid.on('filterChanged', function(g, e) {
  console.log(e.source, e.active, e.cleared, e.viewRowCount);
});
```

事件參數包含 `source`、`active`、`cleared`、`remote`、`filterPredicate`、`searchText`、`columnSearchValues`、`columnSearchOperators`、`excelFilters`、`view` 與 `viewRowCount`。遠端模式會在重新載入資料前觸發；資料回傳完成仍使用 `loadSuccess`。

Wijmo-like aliases 也可使用，例如：

```js
grid.selectionChanged.addHandler(function(sender, e) {
  console.log(e.row, e.col, e.range);
});
```

`selectedRowChanged` 可統一監聽使用者換列、取消 selected row，以及 `setItemsSource()`、遠端載入或 `observeItemsSource` mutation 造成的資料來源更新。資料來源更新時，即使 selected row index 相同也會觸發；更新前後都沒有 selected row 時不觸發。這是 changed 事件，handler 回傳 `false` 不會取消已完成的變更。

```js
const grid = new fabui.FabGrid('#grid', {
  selectedRowChanged: (g, e) => {
    console.log(e.reason);
    console.log(e.rowIndex, e.dataItem);
    console.log(e.previousRowIndex, e.previousDataItem);
  }
});

grid.selectedRowChanged.addHandler((g, e) => {
  if (e.rowIndex === -1) {
    console.log('No selected row');
  }
});
```

`formatItem` 使用 `fabui.CellType` 判斷 panel；數值與 Wijmo `CellType` 相容：`Cell=1`、`ColumnHeader=2`、`RowHeader=3`、`TopLeft=4`、`ColumnFooter=5`、`BottomLeft=6`。

多列 Footer 可直接以列 `key` 寫值；既有 `column.footer` 與 `aggregate` 仍作為第 0 列的相容值來源。

```js
const grid = new fabui.FabGrid('#grid', {
  showFooter: true,
  footerHeight: 32,
  footerRows: [
    { key: 'hours', label: '時' },
    { key: 'value', label: '值' }
  ]
});

grid.setFooterCellData('hours', 'workHours', 120, false);
grid.setFooterCellData('value', 'amount', 3000, false);
grid.refreshFooter();
```

```js
grid.formatItem.addHandler((g, e) => {
  if (e.panel.cellType === fabui.CellType.ColumnHeader) {
    e.cell.style.fontWeight = 'normal';
  } else if (e.panel.cellType === fabui.CellType.ColumnFooter) {
    const value = e.panel.getCellData(e.row, e.col, false);
    e.cell.textContent = value == null ? '' : String(value);
  } else if (e.panel.cellType === fabui.CellType.Cell) {
    const rowData = g.rows[e.row].dataItem;
    const field = g.columns[e.col].binding;
    if (rowData[field] < 0) {
      e.cell.classList.add('fg-negative-value');
    }
  }
});
```

事件參數包含 `panel`、`cell`、`range`、`row`、`col`、`data`、`item`、`column`、`value`、`updateContent`、`getRow()` 與 `getColumn()`。`g.rows[e.row].dataItem` 取得目前 view 的資料項目；`e.panel.getCellData(row, col, formatted)` 可讀取 panel 的原始值或顯示值。`formatItem` 會隨 virtualization 與 refresh 重複觸發，handler 應保持輕量並完整覆寫自己設定的 class、style 或內容。

`g.rows` 與 `g.selectedRows` 的成員是 Row instance。一般資料列與 TreeGrid 資料列使用 `fabui.FabGrid.Row`；群組 header 與 group footer 使用繼承自 Row 的 `fabui.FabGrid.GroupRow`。

```js
const r = grid.rows[rowIndex];

if (r instanceof fabui.FabGrid.Row && !(r instanceof fabui.FabGrid.GroupRow)) {
  const rowData = r.dataItem;
}
```

`Row` 提供 `grid`、`index`、`dataIndex`、`dataItem`、`visible`、`isReadOnly` 與 `collectionView`；`GroupRow` 另提供 `level`、`hasChildren`、`isCollapsed` 與 `isGroupFooter`。

## 6. 遠端資料協定

`remote: true` 時，FabGrid 可使用 `url` 或 `loader(params)`。`loader` 優先於 `url`。`itemsSource` 可傳入 Array 或 `fabui.collections.CollectionView`；遠端 rows 會更新 Grid 的 Array 資料來源，或更新同一個 CollectionView instance 的 `sourceCollection`。CollectionView 模式可讓共用 Chart 自動收到 `collectionChanged`，且不會再次套用已由後端處理的 Grid filter／sort。

遠端 Search Row 查詢採背景載入：等待回應時保留目前 rows、Grid 與 Search Row 都可繼續操作，只在 Grid 中央顯示非阻擋式 loading 提示。使用者繼續輸入並觸發新查詢時，內建 `url`／Fetch 會中止前一個 request；自訂 `loader` 的實際取消仍由使用者實作，但 FabGrid 會放棄較舊的回應，只套用最後一次查詢結果。初次載入、分頁、排序與其他遠端載入仍使用全 Grid loading mask。

```js
var grid = new fabui.FabGrid('#grid', {
  remote: true,
  url: '/api/orders',
  method: 'post',
  credentials: 'include',
  pagination: true,
  pager: {
    pageNumber: 1,
    pageSize: 50
  },
  columns: columns
});
```

內建 `url` 模式使用 Fetch，`credentials` 預設繼承 `fabui.getConfig().request.credentials`，其全域初始值為 `'same-origin'`。需要像 jQuery `xhrFields.withCredentials: true` 一樣傳送跨來源 Cookie 時，可使用 `fabui.setConfig()` 設定全域預設，或在單一 Grid 設為 `'include'`；`'omit'` 則永不傳送 credentials。無效值會回復為 `'same-origin'`。使用自訂 `loader` 時，Fetch options 由 loader 自行設定。

跨來源且使用 `credentials: 'include'` 時，後端仍需回傳允許 credentials 的 CORS header，且 `Access-Control-Allow-Origin` 必須是明確來源，不能使用 `*`。

送出的參數如下：

| 參數 | 說明 |
| --- | --- |
| `page` | 目前頁碼。 |
| `rows` | 每頁筆數。 |
| `sort` | 排序欄位，以逗號區隔；多欄排序時依序排列。 |
| `order` | `asc` 或 `desc`，與 `sort` 對應。 |
| `q` | 全域搜尋字串。 |
| `filterRules` | 欄位搜尋規則 JSON 字串，例如 `[{"field":"status","op":"eq","value":"草稿"}]`。`op: "in"` 使用逗號分隔字串傳送 `value`，例如 `[{"field":"facno","op":"in","value":"ZU001,AV001"}]`。 |

伺服器應回傳 EasyUI 格式：

```json
{
  "total": 1250,
  "rows": [
    { "id": 1, "name": "王小明" }
  ]
}
```

`method: 'get'` 會把參數放入 query string；`method: 'post'` 會使用 `application/x-www-form-urlencoded`。

## 7. 常用屬性

| 屬性 | 說明 |
| --- | --- |
| `itemsSource` | 可接受 Array 或 `fabui.collections.CollectionView`；getter 回傳目前指定的資料來源。 |
| `collectionView` | 傳入 CollectionView 時回傳同一 instance；Array 模式維持回傳目前 view Array。 |
| `view` | Grid 排序、篩選、群組與分頁後的目前 Array。 |
| `columns` / `visibleColumns` | 全部欄位與目前可見欄位。 |
| `frozenColumns` / `frozenRightColumns` | 目前左右凍結欄數。 |
| `selectedRow` | 目前 active cell 所在列的唯讀 Row instance；沒有可用列時為 `null`。列索引與資料分別由 `selectedRow.index`、`selectedRow.dataItem` 取得。 |
| `selectedItems` / `selectedRows` | 已選取的資料項目與 Row instance 陣列。 |
| `selectedRanges` | 目前 cell selection range；`Cell` 模式為單一 cell，`CellRange` 為正規化後的矩形範圍。 |
| `activeCell` | 目前 active cell。 |
| `editRange` | 唯讀的目前編輯範圍；編輯中回傳單一 cell 的 `{ row, col, row2, col2 }` 快照，`col`／`col2` 對應 `grid.columns` 並計入隱藏欄位，未編輯時為 `null`。 |
| `activeEditor` | 目前 editor；未編輯時為空。 |
| `invalidItems` | 驗證失敗的 cell 資訊。 |
| `scrollPosition` / `scrollSize` | 捲動位置與可捲動尺寸。 |
| `viewRange` | 目前可見 row、column 範圍。 |
| `isReadOnly` | 唯讀狀態。 |

## 8. 編輯器範例

可用 `editRange` 判斷指定 cell 是否正在編輯：

```js
const rng = g.editRange;
if (rng && rng.row === irow && rng.col === icol) {
  // The target cell is being edited.
}
```

```js
var columns = [
  {
    binding: 'amount',
    header: '金額',
    dataType: 'number',
    align: 'right',
    editor: {
      type: 'number',
      spinner: true,
      increment: 1,
      min: 0,
      max: 1000000
    },
    thousandsSeparator: true,
    precision: 2
  },
  {
    binding: 'startedAt',
    header: '開始時間',
    dataType: 'string',
    mask: '99:99:99',
    autoUnmask: true,
    editor: 'time'
  },
  {
    binding: 'status',
    header: '狀態',
    editor: {
      type: 'combo',
      valueField: 'id',
      textField: 'descr',
      limitToList: true,
      data: [
        { id: 'active', descr: '啟用' },
        { id: 'paused', descr: '暫停' }
      ]
    }
  },
  {
    binding: 'color',
    header: '顏色',
    editor: {
      type: 'color',
      palette: ['#ff0000', '#00ff00', '#0000ff', '']
    }
  }
];
```

- `text`：一般文字輸入。
- `number`：數字預設靠右，支援千分位、`min`／`max`、前後綴與 `precision`。`editor.spinner` 預設為 `false`；設為 `true`／`'right'` 時在右側顯示上下箭頭，設為 `'left'` 時顯示於左側，並以 `increment` 控制每次增減值。
- 時間欄使用 `dataType: 'string'` 搭配 `editor: 'time'`；`time` 是 editor type，不是 `dataType`。`dataType: 'date'` 則會自動選擇 Date editor。
- `editor: 'date'` 同時支援 `dataType: 'string'` 與 `dataType: 'date'`。字串日期必須明確設定 `editor: 'date'`；Date 值可省略 `editor`，也可明確寫出。
- `mask`、`autoUnmask` 與遮罩字面值設定屬於 Column option，即使省略 `editor` 也有效；舊版放在 `editor` 內的寫法會在初始化時正規化到 Column。
- `time`：預設使用 `99:99` 與 `autoUnmask: false`，也支援 `99:99:99`；分秒限制為 `00`–`59`，只有完整 `24:00`／`24:00:00` 可作為上限。可選 Spinner 依游標所在時、分或秒段落增減。
- `date`：日期面板與日期遮罩；`mask: '9999/99'` 或 `'9999-99'` 時改用年份／月份選擇 popup。
- `combo`：可編輯下拉選項；可配合 `editable: false` 停用文字輸入，或用 `limitToList` 限制為清單項目。Column `charcase` 會套用到輸入、選取後的顯示文字與提交比對，但不改變清單資料本身。
- `color`：預設顯示 63 色加清除色彩的 8×8 精簡色盤；支援 `#RGB`、`#RGBA`、`#RRGGBB`、`#RRGGBBAA` 與標準 CSS 顏色名稱。名稱不分大小寫，可直接預覽並保留原輸入文字，例如 `red` 提交後仍為 `red`；hex 短格式仍會正規化，例如 `#f00` 成為 `#ff0000`。`palette` 可自訂色票，空字串項目代表清除色彩。

雙擊 cell、按 `Enter` 或 `F2` 可開始編輯。只要 cell 正在編輯，`Enter` 都會提交並向右尋找下一個可編輯 cell；目前列找不到時，接續到下一列第一個可編輯 cell。`Shift+Enter` 則向左尋找，並可從列首回到上一列最後一個可編輯 cell。此行為不受 `editOnSelect` 影響。`editOnSelect: true` 時，`Tab`／`Shift+Tab` 也會向右／向左尋找且可跨列，上下方向鍵維持跨列連續編輯。`editOnSelect: false` 且允許編輯時，在 active cell 直接輸入可用字元會自動開始編輯並取代原內容；Tab／Shift+Tab 只提交並結束目前編輯，未由 Spinner 或已開啟 Popup 接管的方向鍵保留輸入框原生字元游標移動。`Escape` 一律取消。文字 Column 設定 `multiLine: true` 時 editor 使用 `<textarea>`，可以承載輸入或貼入的多行值，並沿用上述 Enter 導覽契約。此設定不改變 cell 的單行顯示與固定列高。FabGrid 只保留一個 active cell，active editor 必須與該 cell 相同；滑鼠單純離開 edit cell 時維持編輯不變，只有點擊或程式選取其他 cell 時才取消目前編輯，且不提交尚未完成的值。使用鍵盤讓焦點離開 Grid 時，`text`、`number`、`time`、`date`、`combo`、`color` editor 仍會提交目前值。連續編輯移出可視區時只捲動所需列數，active editor 會保持在可視區頂部或底部邊界，不會跳到第一列。

FabGrid 與 `fabui.EditBox` 共用 editor definitions 與主要 options。Icon descriptor 統一為 `{ iconCls, title, ariaLabel, text, width, align, keepFocus, onClick }`；舊欄位名稱只保留相容。`iconCls` 可使用外部普通 CSS class 定義 `background` 或 `background-image`，不需要加上 `:root` 或 `!important`。

日期、清單與顏色 editor／Search Row 分別共用 DatePopup、ComboPopup 與 ColorPopup。Grid 的 `color` cell editor 點選色票或清除色彩後會立即關閉 popup。完整 options 請見 [EditBox API](./editbox-api.md)。

Number cell editor 的 `spinner`、`increment`、`iconWidth`、`min`、`max` 與 `precision` 也直接沿用 `fabui.EditBox` 的共用 number definition。啟用 Spinner 時，`ArrowUp`／`ArrowDown` 會增減目前數值，不會提交並移到上一列或下一列；未啟用時維持原本的 Grid 垂直移動行為。Search Row 不顯示 Spinner，以保留搜尋列既有的方向鍵導覽。

Time cell editor 直接沿用同一個 `editorDefinitions.time`，包含遮罩、格式化、資料值、複製、24 小時驗證與 Spinner 段落調整；`timebox` 保留為相容別名。Search Row 沿用時間遮罩與數字輸入限制，但不顯示 Spinner。

Date editor 設定 `showLunar: true` 時，cell editor 與同欄 Search Row 的共用 DatePopup 都會在國曆日期下方顯示農曆日期；預設為 `false`：

```js
{
  binding: 'date',
  dataType: 'date',
  editor: 'date',
  showLunar: true
}
```

Grid 共用 DatePopup 使用固定 component selector。即使 popup 掛在 `document.body`，也會由頁面最後載入的 Theme CSS 統一決定配色。
