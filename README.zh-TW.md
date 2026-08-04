<p align="center">
  <img src="./assets/fabgrid-logo.png" alt="FabGrid logo" width="520">
</p>

[English](./README.md) | 繁體中文

# FabGrid

FabGrid 是 FabUI 的高效能資料表元件，以 pure JavaScript 開發，不依賴前端框架。核心採水平與垂直 virtualization，只渲染可視範圍，適合大量資料。

FabUI 也提供表單、導覽、視窗、HtmlEditor、Chart、Pivot、Diagram、Gantt 與 Scheduler 等元件。名稱中的 **Fab** 取自 **Fabulous**，代表兼具效能、實用性與良好開發體驗。

## 快速連結

| 類型 | 連結 |
| --- | --- |
| 線上 Demo | [FabGrid](https://jimmywon1028.github.io/fabgrid/demo/grid.html) · [TreeGrid](https://jimmywon1028.github.io/fabgrid/demo/treegrid.html) · [Diagram](https://jimmywon1028.github.io/fabgrid/demo/diagram.html) · [Gantt](https://jimmywon1028.github.io/fabgrid/demo/gantt.html) · [全部 Demo](https://jimmywon1028.github.io/fabgrid/demo/index.html) |
| 本機 Demo | [開發版索引](./demo/dev.html) · [正式版索引](./demo/index.html) |
| API | [文件索引](./docs/) · [FabGrid](./docs/fabgrid-api.md) · [HtmlEditor](./docs/htmleditor-api.md) · [Control](./docs/control-api.md) · [Theme](./docs/theme-api.md) · [Diagram](./docs/diagram-api.md) |
| 專案 | [工作進度](./worklogs/) · [TODO](./TODO.md) |

## 快速開始

### 建立 FabGrid

載入 FabUI core 的 CSS 與 browser global JavaScript，再建立 Grid：

```html
<link rel="stylesheet" href="./dist/fabui.css">

<div id="grid" style="height:260px;"></div>

<script src="./dist/fabui.js"></script>
<script>
  var rows = [
    { id: 1, name: '王小明', amount: 1280 },
    { id: 2, name: '陳小華', amount: 2560 }
  ];

  var grid = new fabui.FabGrid('#grid', {
    itemsSource: rows,
    columns: [
      { binding: 'id', header: '編號', width: 80, align: 'center', dataType: 'number' },
      { binding: 'name', header: '姓名', width: 160 },
      { binding: 'amount', header: '金額', width: 120, align: 'right', dataType: 'number', allowSorting: false }
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

FabGrid 高度完全跟隨 host element，不會強制套用最小高度；請由 host、Flex 或 Layout 明確提供可用高度。

### 載入主題

Default theme 不需要額外 CSS。使用其他主題時，在所有 FabUI 與附加元件 CSS 之後載入對應檔案：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<link rel="stylesheet" href="./dist/fabui.gantt.css">
<link rel="stylesheet" href="./dist/theme/fabui.metro-blue.css">
```

完整載入規則請見[主題與多語系](#主題與多語系)。

### 載入獨立附加元件

Diagram、Gantt、Scheduler 與 HtmlEditor 不包含在 FabUI core。載入順序固定為 core CSS、附加元件 CSS、core JavaScript、附加元件 JavaScript：

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

## FabGrid 主要能力

| 類別 | 能力 |
| --- | --- |
| 效能 | 固定列高與欄寬的雙向 virtualization，只渲染可視範圍；垂直捲動重用既有 layout、Header、Footer 與 Pager，本機多欄排序預先準備每列排序值。 |
| 資料來源 | 本機與 `remote: true` 模式的 `itemsSource` 都可接受 Array 或 `fabui.collections.CollectionView`；遠端 rows 會取代 Array 資料來源，或更新同一個 CollectionView instance，讓共用 Chart 保持同步。內建 `url` 請求可用 `credentials: 'include'`，較新的 load 或 `dispose()` 會中止尚未完成的舊 Fetch。 |
| 表格版面 | 支援巢狀 `columns` 合併多列 Header、hidden 欄位仍計入指定數量的左右凍結欄範圍、列號欄、欄寬調整、欄位顯示切換、Footer aggregate、交替列背景與全螢幕。 |
| Column 寬度 | `width` 預設為 `120px`；`columnMinWidth` 預設為 `20px`，個別 Column 可用 `minWidth` 覆寫。 |
| 排序與篩選 | 支援單欄／Shift 多欄排序、`clearSort()`、安全的 `getSortState()`／`getFilterState()` 狀態快照、`allowMultiSorting: false`、Column `allowSorting: false`、可取消的 `sortingColumn`、含千位符號字串的數值排序、排序時保留水平捲動位置；點擊部分被遮住的 Header 時只做最小幅度調整讓整欄可見，並支援 Quick Search、Search Row、Excel-like 值篩選及 runtime Filter Rules。 |
| 群組與 TreeGrid | 支援 1 至 3 階群組、小計、收合，以及 `childItemsPath` TreeGrid。 |
| 資料列拖曳 | 支援 Grid 內重排、跨 Grid 移動，以及 TreeGrid 的 `before`、`inside`、`after` 階層調整。 |
| 選取與剪貼簿 | 支援 Cell、CellRange、唯讀 `selectedRow` active row、單選列 `unselectRow()`、使用完整 `grid.columns` index 的 `select()`、`selectedRowChanged`、列多選、滑鼠拖曳、列號整列範圍選取、Shift 延伸、鍵盤導覽與 TSV 複製；所有公開事件的 `e.col` 都使用包含隱藏欄位的完整 `grid.columns` index，需要可見欄索引時使用 `e.viewCol`。CellRange 外框沿用 `activeCellBorder`。`stopNavigation` 可暫停使用者選取與捲動，程式 API 仍可操作。 |
| 編輯與驗證 | 內建 `text`、`number`、`time`、`date`、`combo`、`color` editor，支援遮罩與同步／非同步驗證；`text`、`combo`、`color` 支援 `charcase: 'upper'`／`'lower'`，只轉換 ASCII 英文字母並保留其他字元，`date`、`time`、`number` 不套用，Grid 與 EditBox 共用此定義；唯讀 `editRange` 回報目前編輯中的 cell，未編輯時為 `null`；只要 cell 正在編輯，Enter／Shift+Enter 會向右／向左尋找可編輯 cell，並從列尾接續到下一列第一個可編輯 cell，或從列首回到上一列最後一個可編輯 cell，不受 `editOnSelect` 影響；`editOnSelect: true` 時 Tab／Shift+Tab 也可跨列左右搜尋，上下方向鍵跨列編輯；`editOnSelect: false` 時在可編輯 active cell 輸入可用字元會自動開始編輯並取代原值，Tab／Shift+Tab 只提交並結束編輯，未被 Spinner 或 Popup 接管的方向鍵保留 editor 原生字元游標移動；Column `multiLine: true` 讓文字 editor 使用可承載多行值的 `<textarea>`，cell 顯示仍為單行；Column `isReadOnly: true` 在 Grid 可編輯時仍會禁止該欄編輯；Column `isRequired` 預設為 `false`，啟用後空值會自動在 `invalidItems` 建立 required error；刪除資料列或取代資料來源時會移除該列過期的同步／非同步錯誤，列與欄版面改變時會同步更新所有保留錯誤的索引；滑鼠點擊其他 cell 時會先提交目前 editor 值再切換，程式選取其他 cell 仍取消目前編輯；Grid editor 在焦點離開 Grid、EditBox 在焦點離開控件時也會提交目前值，進入該 editor 的 Date／Combo／Color popup 仍屬於同一次編輯；Grid 與 EditBox 共用 63 色加清除色彩的 8×8 精簡色盤，選取後立即關閉 popup；Color cell 保留色塊，色碼文字使用一般 cell 文字色；連續編輯移出可視區時逐列捲動，active editor 保持在頂部或底部邊界。 |
| 顯示自訂 | 提供 Column `cssClass`、formatter、`formatItem`、`cellTemplate`、Header style、Row／GroupRow 與事件 API。 |
| 匯入與匯出 | 支援 JSON、CSV 與 XLSX；Excel 可保留格式、凍結窗格、篩選、群組、Footer 與隱藏欄位。 |
| Popup | 右鍵選單、Filter、欄位選擇器與 editor popup 支援 `Escape` 及點擊外部關閉；`filterMode: false` 時不顯示「清除篩選」，「列號」與全螢幕項目分別由 `showRowHeaderMenu`、`showFullscreenMenu` 控制且預設隱藏。 |
| 生命週期 | `fabui.Control.getControl()` 可取得 instance；`hasFocus` 可直接判斷 Grid 是否取得焦點；`beginUpdate()`／`endUpdate()` 與 `deferUpdate()` 可合併 View 更新，唯讀 `isUpdating` 回報批次狀態；`dispose()` 會解除受管理的 DOM listener。 |
| 事件 | Constructor callback、`grid.on()` 與 Wijmo-compatible `addHandler()` 全部統一使用 `(grid, eventArgs)`；每個事件參數固定包含 `grid`、`type`、`cancel`，且 `eventArgs.grid === grid`。每次事件派送使用獨立 args object，保留的動作前事件參考不會被後續完成事件改寫。所有動作前事件都可取消，包含 `updatingLayout` 與 `excelExporting`。 |
| 剪貼簿 | `fabui.Clipboard.copy(str)` 將文字複製到系統剪貼簿。 |

本機 Column 不可重複檢查可呼叫 `args.isDuplicate()`：同欄非空白值只能出現一次，空白可以重複；傳入 `{ ignoreCase: true }` 可忽略大小寫。

所有公開方法的數字欄位參數都使用完整 `grid.columns` index，包含隱藏欄位；因欄位識別字以字母開頭，`"1"` 這類十進位整數字串也視為相同 index。需要可見欄 index 時只使用事件的 `viewCol` 等 `view*` 欄位。`startEditing(false)` 等 Wijmo-compatible 呼叫會直接編輯目前 active cell；既有 `startEditing(row, col, options)` 的 `col` 也使用完整欄 index。

### 排序與篩選

`filterMode` 可設為 `false` 或模式陣列。陣列第一項是預設模式；只有一個模式時不顯示切換選項。

```js
var grid = new fabui.FabGrid('#grid', {
  filterMode: ['excel', 'searchRow']
});
```

| 主題 | 行為 |
| --- | --- |
| Runtime Filter Rules | `setFilterRules(rules)` 會立即套用規則；`getFilterRules()` 回傳目前規則的深層副本。 |
| 本機資料 | 套用規則後立即重新篩選，不需要呼叫 `reload()`。 |
| 遠端資料 | `remote: true` 會回到第 1 頁並自動重新 request。 |
| Search Row debounce | `searchDelay` 預設為 `400ms`；設為 `0` 時立即套用。 |
| Search Row 鍵盤 | `Enter`／`Tab` 移到下一欄，`Shift+Enter`／`Shift+Tab` 移到上一欄；方向鍵可在 Search Row 與 Grid 間移動，頁面有多個或巢狀 Grid 時只操作最後取得 pointer／焦點的 Grid；Grid 消化導覽鍵後會停止冒泡，同一個動作只處理一次。 |
| Excel-like filter | Popup 可超出 Grid 高度並依瀏覽器視窗顯示更多項目；遠端模式重新開啟欄位時，保留完整候選值與目前勾選狀態。 |

`excelFilterMaxValues` 控制 Excel-like filter 最多收集多少個唯一候選值，不控制 popup 高度。Popup 會依 Header 位置與瀏覽器 viewport 自動向下或向上開啟，候選值超出可用空間時由清單內部捲動。

遠端 Search Row 會將常用 operator 轉為相容符號：

| Operator | 傳送值 | Operator | 傳送值 |
| --- | --- | --- | --- |
| `starts` | `..%` | `not-starts` | `!..%` |
| `contains` | `%..%` | `not-contains` | `!%..%` |
| `ends` | `%..` | `not-ends` | `!%..` |
| `gte`／`gt` | `>=`／`>` | `lte`／`lt` | `<=`／`<` |
| `ne`／`eq` | `<>`／`=` | 自訂 `op` | 原樣傳送 |

`op: 'in'` 不分大小寫，陣列值會轉為逗號分隔字串。空白 Search Row 不會建立或傳送篩選規則。

完整的初始化、遠端 GET／POST 格式與 operator 契約請見 [FabGrid API](./docs/fabgrid-api.md)。

### 欄位顯示

`setColumnVisible()` 接受 Column index 或該 Grid 的 Column object，不接受 binding 字串。

```js
grid.setColumnVisible(1, false);

var column = grid.getColumn('amount');
grid.setColumnVisible(column, true);
```

不要直接修改 `grid.columns[index].visible`，否則不會自動更新 layout、選取狀態與畫面。

### Editor 與 EditBox

FabGrid cell editor、Search Row 與 `fabui.EditBox` 共用 editor definitions、popup 及格式化邏輯。

| 功能 | 說明 |
| --- | --- |
| 自訂 icon | 使用 `icons: [{ iconCls, title, ariaLabel, text, width, align, keepFocus, onClick }]`。`iconCls` 可使用外部 CSS class 定義 `background` 或 `background-image`，不需要加上 `:root` 或 `!important`。 |
| Number Spinner | `spinner: true`／`'right'` 顯示於右側，`spinner: 'left'` 顯示於左側；預設為 `false`。 |
| Spinner 數值 | `increment` 預設為 `1`，並沿用 `min`、`max`、`precision` 與 change／cell edit 契約。 |
| Column 遮罩 | `mask`、`autoUnmask` 與遮罩字面值行為統一定義在 Column，即使省略 `editor` 也有效；舊版 editor 層設定會在初始化時正規化到 Column。 |
| Time editor | 使用 `dataType: 'string'` 搭配 `editor: 'time'`，預設使用 `99:99` 與 `autoUnmask: false`，也支援 `99:99:99`。 |
| Date editor | `editor: 'date'` 同時支援 `dataType: 'string'` 與 `dataType: 'date'`；Date 資料會自動選擇 Date editor，字串資料則必須明確設定 editor。 |
| 時間範圍 | 使用 24 小時制；只有完整的 `24:00`／`24:00:00` 可作為上限。 |

完整範例請見 [EditBox API](./docs/editbox-api.md)。

## Pivot 分析元件

所有 Pivot 元件共用同一個 `PivotEngine`，避免重複彙總資料與分析狀態。

| 元件 | 用途 |
| --- | --- |
| `PivotEngine` | 以 Rows、Columns、Values、Filters 建立 Pivot view；支援常用 aggregate、日期群組、計算欄位、ShowAs 與非同步彙總。 |
| `PivotPanel` | 以勾選、拖放與右鍵選單設定欄位、排序、篩選、aggregate 與 ShowAs。 |
| `PivotGrid` | 延用 FabGrid 的 virtualization、選取、剪貼簿、匯出與全螢幕，並支援多層標頭與小計。 |
| `PivotChart` | 將 Pivot view 顯示為 Column、Bar、Line 或 Pie，並與 PivotGrid 同步展開與選取。 |
| `PivotSlicer` | 提供搜尋、多選、套用與清除，共用 Pivot 篩選狀態。 |
| `PivotWorkspace` | 整合 PivotPanel、PivotGrid 與 PivotChart，提供 RWD 版面、Splitter、進度與 Pane 全螢幕。 |

## FabUI 元件

FabUI core 直接提供下列 pure JavaScript 元件：

| 元件 | 主要用途 |
| --- | --- |
| `Button` | LinkButton、icon、尺寸、狀態、toggle 與 group。 |
| `Calendar` | 年月導覽、週次、日期驗證與農民曆；共用 DatePopup renderer。 |
| `CheckBox`／`RadioButton` | 保留原生 input 的表單、label、鍵盤與 reset 行為。 |
| `CheckGroup`／`RadioGroup` | 組合既有單項元件，支援 data、排列、狀態與原生表單。 |
| `SwitchButton` | 包裝原生 checkbox，支援 ON／OFF、readonly、reversed 與尺寸。 |
| `FileBox` | 組合 EditBox 與原生 file input，保留 FileList 與瀏覽器安全限制。 |
| `Form` | 管理原生欄位與 FabUI 控件，支援 submit、load、validation、dirty、clear 與 reset。 |
| `EditBox` | 提供文字、數字、時間、日期、清單與顏色輸入。 |
| `HtmlEditor` | Summernote 風格 WYSIWYG HTML 編輯器，支援原始碼、全螢幕、表格、媒體與自訂工具列。 |
| `Tabs` | 動態頁籤、四方向、overflow、遠端內容與可選拖曳排序。 |
| `Tree` | 階層資料、checkbox、拖放、編輯、搜尋、鍵盤與 lazy loading。 |
| `PropertyGrid` | 兩欄屬性表、群組、排序、共用 EditBox editor 與變更追蹤。 |
| `Panel`／`Accordion` | 內容容器、狀態動畫，以及單一／多重展開。 |
| `Window`／`Layout` | 浮動視窗、Modal、拖曳縮放，以及支援收合與完全隱藏區域的五區 dock layout。 |
| `Tooltip` | 四方向、HTML、滑鼠追蹤、延遲與 viewport 定位。 |
| `Menu`／`MenuButton`／`SplitButton` | Context menu、巢狀 submenu 與按鈕整合。 |
| `Messager` | Alert、Confirm、Prompt、Toast 與 Progress。 |
| `fabui.collections.CollectionView` | Grid 與 Chart 共用的排序、篩選資料及目前項目。 |
| `fabui.chart.Chart`／`fabui.chart.Pie` | SVG Column、Bar、Line、Pie，可獨立使用或與 Grid／Pivot 連動，並支援 `fabui.chart.animation.ChartAnimation`。 |

Gantt、Scheduler、Diagram 與 HtmlEditor 是獨立附加元件，不會併入 FabUI core。

Grid 與 Chart 要連動時，將同一個 CollectionView 指定給兩者即可；一般本機 FabGrid 的排序、篩選及目前選取項目會自動同步到 Chart，不需要另外監聽 Grid 事件：

```js
const collections = new fabui.collections.CollectionView(rowsData);

const grid = new fabui.FabGrid('#grid', {
  itemsSource: collections
});

const chart = new fabui.chart.Chart('#chart', {
  itemsSource: collections,
  bindingX: 'month',
  series: [{ name: '營收', binding: 'revenue' }]
});
```

## fabui.Diagram

`fabui.Diagram` 是 pure JavaScript SVG 圖表設計器。它提供一般、流程圖、DFD 與組織圖工具，並支援完整的繪圖、編輯、匯出及狀態保存流程。

| 類別 | 能力 |
| --- | --- |
| 紙張 | 預設 A4 橫向；支援 A3、A4、A5、Letter、Legal、直向／橫向、格線與吸附間距。 |
| 工具箱 | 47 種 SVG 圖形；分類可疊合、排序，並可由工具列顯示或隱藏。 |
| 面板 | 工具箱與屬性面板可浮動或停靠左右兩側；`sameSideDockMode` 可設為 `tabs` 或 `stacked`。 |
| 圖形 | 支援 node、框選、多選、群組移動、八方向縮放與批次視覺屬性；多選時可等比例縮放整組。 |
| 連線 | 支援六點連線、任意點連線、直線、直角線、二次／三次貝茲曲線、四種箭頭與控制點。 |
| 文字 | node／connector 可就地編輯；支援字級、粗體、斜體、底線、刪除線與連線標籤。 |
| 超連結 | node 可設定單擊或雙擊開啟網址。`javascript:` URL 只能搭配可信任內容。 |
| 歷程 | 新增、修改、移動、縮放、刪除與清除支援 undo／redo。 |
| 檔案 | 支援 JSON 載入／下載，以及 SVG／PNG 匯出。 |
| 工具列 | 上方提供檔案、輸出、歷程、線型、面板與唯讀操作；右下角提供縮放、符合、格線、展示與全螢幕。 |
| 檢視 | 支援滑鼠定位縮放、平移、框選、投影片展示、列印與全螢幕。 |
| 唯讀 | 保留下載、縮放、格線、全螢幕、匯出、列印及投影片展示；停用編輯工具。 |
| 鍵盤 | 支援 Delete／Backspace、方向鍵與復原；輸入控件聚焦時不攔截原生按鍵。 |
| 狀態保存 | `toolboxStateKey` 會將面板、工具列、紙張、nodes 與 connectors 保存至 `localStorage`。 |

Diagram Demo 內建無外部依賴的生產製造流程範例。完整行為與 API 請見 [Diagram API](./docs/diagram-api.md)。

## 主題與多語系

| 項目 | 說明 |
| --- | --- |
| 主題數量 | 公開元件統一提供 17 組 theme metadata。 |
| Default | 內建於 FabUI core 與 Lite CSS；theme build 也會產生可選用的 `fabui.default.{css,min.css}` 獨立檔。 |
| 其他主題 | 16 組外部 Theme CSS 必須最後載入，並直接覆蓋 Default selector。 |
| Mono | `mono` 使用 `dist/theme/mono/` 的單色 SVG。 |
| 樣式隔離 | FabUI core 原生控制節點使用固定 component class 與隔離基底，避免一般 `button`、`input`、`label`、`select`、`textarea`、`a` selector 改變元件外觀。 |
| 多語系 | Core 預設使用內建英文；`en`、`zh-TW`、`zh-CN` 語言檔需要時才從 `dist/locales/` 載入，英文檔用於明確切回內建英文。 |

所有 Demo 預設使用 `default`。選擇其他主題時，頁面會更換 Theme CSS 並重新載入。

語言包必須在 FabUI core 之後載入。載入後會註冊所有元件文字、自動設為
全域顯示語言，並更新已存在的控件：

```html
<script src="./dist/fabui.min.js"></script>
<script src="./dist/locales/fabui-locale.zh-TW.min.js"></script>
```

載入 `fabui-locale.en.min.js` 會覆蓋目前預設文字並切回英文。指定尚未載入的語言時會維持英文。
可用 `fabui.getLocale()`、`fabui.getLocales()` 查詢目前語言與已載入語言。

語言檔也會像 jQuery EasyUI locale 一樣，直接覆蓋已載入元件的英文預設
文字。使用 fabLoader 時，只需載入目標語言檔：

```js
fabLoader.script('./dist/locales/fabui-locale.zh-TW.min.js');
```

語言檔載入完成後會直接切換，不需要另外呼叫切換 API。fabLoader 維持
獨立並沿用一般 script 快取，不辨識或處理 FabUI 語言檔名。

## Demo 與 API 文件

### Demo

| 範圍 | Source mode | Build mode |
| --- | --- | --- |
| FabGrid | [開發版](./demo/dev-grid.html) | [正式版](./demo/grid.html) |
| TreeGrid | [開發版](./demo/dev-treegrid.html) | [正式版](./demo/treegrid.html) |
| Diagram | [開發版](./demo/dev-diagram.html) | [正式版](./demo/diagram.html) |
| Gantt | [開發版](./demo/dev-gantt.html) | [正式版](./demo/gantt.html) |
| Scheduler | [開發版](./demo/dev-scheduler.html) | [正式版](./demo/scheduler.html) |
| HtmlEditor | [開發版](./demo/dev-htmleditor.html) | [正式版](./demo/htmleditor.html) |
| PivotGrid | [開發版](./demo/dev-pivot.html) | [正式版](./demo/pivot.html) |
| PivotWorkspace | [開發版](./demo/dev-pivot-workspace.html) | [正式版](./demo/pivot-workspace.html) |
| EditBox | [開發版](./demo/dev-editbox.html) | [正式版](./demo/editbox.html) |
| 全部元件 | [開發版索引](./demo/dev.html) | [正式版索引](./demo/index.html) |

Source mode 直接引用 `src/`，適合開發測試；Build mode 引用 `dist/`，用於驗證發佈輸出。`demo/dev-grid.html` 與 `demo/grid.html` 保持相同功能、控制項、預設值與互動，只保留 source／dist 載入方式及必要 locale 載入差異。

### API 文件

- 資料與分析：[FabGrid](./docs/fabgrid-api.md)、[CollectionView](./docs/collection-view-api.md)、[Chart](./docs/chart-api.md)、[Pivot](./docs/pivotgrid-api.md)、[PivotChart](./docs/pivotchart-api.md)、[PivotWorkspace](./docs/pivotworkspace-api.md)
- 編輯與表單：[EditBox](./docs/editbox-api.md)、[HtmlEditor](./docs/htmleditor-api.md)、[FileBox](./docs/filebox-api.md)、[Form](./docs/form-api.md)、[CheckBox](./docs/checkbox-api.md)、[RadioButton](./docs/radiobutton-api.md)
- 導覽與容器：[Tabs](./docs/tabs-api.md)、[Tree](./docs/tree-api.md)、[PropertyGrid](./docs/propertygrid-api.md)、[Panel](./docs/panel-api.md)、[Accordion](./docs/accordion-api.md)、[Window](./docs/window-api.md)、[Layout](./docs/layout-api.md)
- 命令與提示：[Button](./docs/button-api.md)、[Menu](./docs/menu-api.md)、[MenuButton](./docs/menubutton-api.md)、[SplitButton](./docs/splitbutton-api.md)、[Messager](./docs/messager-api.md)、[Tooltip](./docs/tooltip-api.md)
- 附加元件：[Diagram](./docs/diagram-api.md)、[Gantt](./docs/gantt-api.md)、[Scheduler](./docs/scheduler-api.md)、[HtmlEditor](./docs/htmleditor-api.md)
- Wrapper：[Vue 2](./docs/vue-api.md)、[FabGrid jQuery](./docs/jquery-api.md)、[FabUI jQuery 相容層](./docs/fabui-jquery-api.md)

## 發佈套件

| 套件 | 輸出 | 內容 |
| --- | --- | --- |
| FabUI core | `dist/fabui.{js,min.js,css,min.css}` | FabGrid、Chart、Pivot、EditBox 與一般 FabUI 元件。 |
| FabUI Lite | `dist/fabui.lite.{js,min.js,css,min.css}` | FabGrid、TreeGrid、Chart、Pivot 與必要依賴。 |
| Diagram | `dist/fabui.diagram.{js,min.js,css,min.css}` | 獨立附加 `fabui.Diagram`。 |
| Gantt | `dist/fabui.gantt.{js,min.js,css,min.css}` | 獨立附加 `fabui.Gantt`。 |
| Scheduler | `dist/fabui.scheduler.{js,min.js,css,min.css}` | 獨立附加 `fabui.Scheduler`。 |
| HtmlEditor | `dist/fabui.htmleditor.{js,min.js,css,min.css}` | 獨立附加 `fabui.HtmlEditor`。 |
| fabLoader | `dist/fabLoader.{js,min.js}` | 實驗性的獨立動態資源 Loader；`build fabloader` 內建 DOM helper，`build loader` 不包含，不附加到 `fabui`。 |
| Theme | `dist/theme/fabui.<theme>.{css,min.css}` | 包含 Default 的完整 17 組主題與必要圖片。 |
| Locale | `dist/locales/fabui-locale.<locale>.{js,min.js}` | Core 與獨立附加元件共用的 `en`、`zh-TW`、`zh-CN` 選用語言檔。 |

`fabui.EditBox` 已納入 core，不再產生獨立元件 bundle。實驗性的 fabLoader 不納入 `build:all`。fabDom 只保留原始碼並由 `build fabloader` 組合使用，不再產生獨立 dist。Vue 2 與 FabGrid jQuery wrapper 不納入預設 build；FabUI jQuery 相容 Wrapper 也保持獨立，只能以 `npm run build:fabui-jquery` 單獨編譯。

Browser global 使用以下 namespace：

| Namespace | 內容 |
| --- | --- |
| `fabui` | FabGrid、一般 UI 元件、Control、editor definitions 與已載入語言管理。 |
| `fabui.collections` | CollectionView 共用資料 view，提供 Grid／Chart 排序、篩選與目前項目同步。 |
| `fabui.chart` | Chart、Pie、ChartType、Position、SelectionMode，以及包含 ChartAnimation、AnimationMode、Easing 的 animation namespace。 |
| `fabui.pivot` | PivotEngine、PivotField、PivotPanel、PivotGrid、PivotChart、PivotSlicer 與 PivotWorkspace。 |
| `fabui.FabGrid` | Row、GroupRow 等 Grid 專用類型。 |
| `fabui.Diagram`／`Gantt`／`Scheduler`／`HtmlEditor` | 載入對應獨立 bundle 後附加。 |

`fabui.version` 使用 `YYYY.M.D` 格式，build 時依本機日期產生。

全域 request credentials 可在建立 FabGrid 前設定，單一 Grid 的 `credentials` 仍具有較高優先權：

```js
fabui.setConfig({
  request: {
    credentials: 'include'
  }
});
```

使用 `fabui.getConfig()` 可取得目前設定的獨立副本。

## 實驗性 fabLoader

`fabLoader` 是不依賴其他套件的獨立 browser global，目前先由正式版
Diagram Demo 試用，不併入 `fabui` namespace。`build fabloader` 發佈檔
內建小型 DOM helper，可由 `fabLoader.dom()` 使用；頁面沒有 jQuery 且
`$` 尚未被占用時，也會安全地提供 `$` 別名。`build loader` 發佈檔則
不包含 fabDom。

完整操作與參數請參閱 [fabLoader API](./docs/fabloader-api.md)。

| API | 用途 |
| --- | --- |
| `setConfig(options)`、`getConfig()` | 使用前集中設定 Script、CSS、圖片與文字四個載入桶；未設定時使用內建預設，`getConfig()` 回傳獨立副本。 |
| `cancel(bucket?, url?)` | 取消指定 URL、指定載入桶，或全部尚未完成的載入；`style` 可作為 `css` 的別名。 |
| `style()`、`script()`、`module()`、`vue()`、`react()`、`run()`、`wait()` | 從第一個操作自動建立 LAB.js 風格的獨立載入佇列，不必先呼叫 `queue()`；`wait()` 是為相容舊寫法提供的 `run()` 別名；`style(url)` 載入單一 CSS，`style([url, ...])` 平行載入一組 CSS；`script(url)` 循序載入，`script([url, ...])` 平行載入整組並等待全部完成。 |
| `queue()` | 選用；需要明確建立空佇列時使用。 |
| `loadScript(url, options)` | 動態載入 JavaScript，同一資源只載入一次。 |
| `loadCss(url, options)` | 動態載入 CSS，同一資源只載入一次。 |
| `preloadImage(urlOrCollection, options)` | 單一 URL 共用同一次圖片預載請求但每次呼叫回傳不同 `<img>`；陣列或名稱物件會平行預載並回傳可重複讀取的集合。 |
| `loadText(url, options)` | 非同步下載文字並快取於記憶體；同一 URL 與 credentials 只下載一次。 |
| `getText(url, options)` | 同步取得已完成的文字快取，未命中或尚未完成時回傳 `null`。 |
| `loadXml(url, options)` | 使用共用文字快取載入 XML，解析成功後回傳新的 `XMLDocument`。 |
| `loadHtml(urlOrCollection, options)` | `loadText()` 的 HTML 相容名稱，使用相同文字快取；接受單一 URL、平行載入的 URL 陣列，或保留名稱的 `{ name: url }` 物件。 |
| `getHtml(url, options)` | `getText()` 的 HTML 相容名稱，使用相同文字快取。 |
| `clearTextCache(url?, options?)` | 清除指定或全部共用文字／HTML／XML 原文快取。省略 options 時會清除該 URL 的全部 credentials 變體。 |
| `mountHtml(target, url, options)` | 載入 HTML、放入指定元素，並依原始順序執行其中的 script。 |
| `dom(target)` | 取得 jQuery-like collection；`dom(target).load(url, callback)` 直接橋接 `mountHtml()`。 |
| `useDom()` | 回傳可作為局部 `$` 的 DOM provider；頁面有 jQuery 時回傳 jQuery，否則回傳內建 `fabLoader.dom`，不修改既有全域 `$`。 |

未呼叫 `setConfig()` 時，四個載入桶的 timeout 都是 30 秒；
Script 預設 `async: false` 與 `crossorigin="anonymous"`，CSS 預設
`media: "all"`，圖片預設 `crossOrigin: "anonymous"`，文字 Fetch
預設 `credentials: "same-origin"`。可在第一次載入前集中覆寫：

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

單次呼叫的 options 仍可覆寫所屬桶的設定。會影響資源身份的
`type`、`async`、attributes、`media`、圖片請求屬性與 credentials
會納入快取鍵；timeout 不納入。失敗、逾時或取消會清除該筆載入紀錄，
所以相同資源可以重新嘗試。

```js
fabLoader.cancel('text', './data.xml');
fabLoader.cancel('image');
fabLoader.cancel();
```

圖片陣列的每個數字索引都是可重複使用的 getter；每次讀取都回傳來源
相同但 DOM identity 不同的 `<img>`，所以可直接插入不同位置：

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

因此 `myImages[0] !== myImages[0]`。若要修改單次節點的 `alt`、class
或其他屬性，先將該次讀取結果存入變數再設定。

需要名稱時可直接以物件預載，fabLoader 會為每個名稱建立相同的
可重複 getter：

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

`vue(url)` 是選用的 Vue 2 SFC 佇列步驟。未呼叫時 fabLoader
不依賴 Vue 或 SystemJS；呼叫時才檢查頁面已有 `System.import()`、
Vue 2 完整版與瀏覽器 template compiler，並將 `.vue` 交給既有
SystemJS loader 設定載入。缺少依賴或匯入失敗會進入同一條
`catch()`。`demo2/index.html` 提供不依賴 CDN 的簡單展示。

`react(url)` 是選用的 React JSX 佇列步驟。未呼叫時 fabLoader
不依賴 React 或 SystemJS；呼叫時才檢查頁面已有 `System.import()`、
React 與提供 `createRoot()` 的 ReactDOM Client，再將 `.jsx` 交給既有
SystemJS JSX loader 設定載入。Demo2 使用獨立的 `runtime.config.js`
設定本機 systemjs-plugin-babel，原本的 `systemjs.config.js` 只保留
Vue 設定。

`mountHtml()` 預設取代目標元素內容；可用 `append: true` 改為追加，也可用 `executeScripts: false` 只插入 HTML。HTML 內相對路徑會以最終回應 URL 為基準解析。

內建 DOM helper 的 `.load()` 採用接近 jQuery 的格式，立即回傳原
collection，因此可繼續鏈接；載入完成後呼叫
`callback(responseText, status, result)`。`status` 是 `success` 或
`error`，callback 的 `this` 是目前目標元素。實際下載、快取、timeout
及片段 script 執行都只由 `mountHtml()` 處理：

```js
$('#target')
  .load('./fragment.html', function(responseText, status, result) {
    if (status === 'success') {
      $(this).addClass('ready');
    }
  })
  .attr('data-loading', 'true');
```

若頁面已有 jQuery，Loader 不會覆蓋 `$`；此時可固定使用
`fabLoader.dom('#target').load(...)`。

需要讓同一份程式自動使用 jQuery 或內建 DOM helper 時，先取得局部
`$`。即使頁面呼叫過 `jQuery.noConflict()`，也不需要重新占用全域
`$`：

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

`loadText()` 會發出請求或等待既有請求；`getText()` 只同步讀取已完成
的記憶體快取，不會發出請求。`loadXml()` 只快取 XML 原文，每次呼叫
都回傳重新解析的 `XMLDocument`，避免呼叫端修改共用 Document。
XML 格式錯誤時 Promise 會 reject，並清除該筆原文快取以便修正後重試。

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

陣列中的 scripts 會平行載入且不保證彼此執行順序；只有互不依賴的 scripts 適合放在同一組。後續步驟會等待整組完成。

## 實驗性 fabDom

`fabDom` 的實作位於 `src/fabdom/fabDom.js`，由 `build fabloader` 納入
`dist/fabLoader.{js,min.js}` 並由 `fabLoader.dom` 公開；`build loader`
不包含 fabDom，也不再產生獨立 fabDom dist。載入合併版時若頁面沒有
jQuery，且 `$` 尚未被其他程式使用，會自動將 `$` 指向內建 fabDom；
否則不覆蓋既有 `$`。

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

| 分類 | API |
| --- | --- |
| Collection | `each()`、`get()`、`eq()`、`first()`、`last()` |
| 內容與插入 | `html()`、`text()`、`val()`、`append()`、`prepend()`、`before()`、`after()`、`load()` |
| Attribute／Property | `attr()`、`removeAttr()`、`prop()` |
| CSS class | `css()`、`addClass()`、`removeClass()`、`toggleClass()`、`hasClass()` |
| Event | `on()`、`off()`；支援直接事件與 selector 委派 |
| 移除與遍歷 | `empty()`、`remove()`、`find()`、`closest()`、`parent()`、`children()`、`is()` |

Getter 讀取第一個符合元素，setter 套用到全部元素並保持鏈式操作；
常用 setter 支援 callback，`attr({...})`、`prop({...})`、`css({...})`
支援 object setter。`attr(name, null)` 移除 attribute，
`css(name, null)` 移除 inline style，數值 CSS 除 unitless property
外自動補上 `px`。`on()`／`off()` 不提供 event namespace、data、
trigger 或自訂 event system。

`append()`、`prepend()`、`before()` 與 `after()` 同時接受可信任的
HTML 字串、DOM Node、fabDom collection 或 NodeList。DOM Node 會直接
插入頁面，不會被轉成 `[object HTMLImageElement]` 等文字；插入多個
目標時，前面的目標使用深層複本，最後一個目標使用原始節點。

HTML 插入方法不會自動 sanitization，只能直接使用固定或可信任內容。
fabDom 不是完整 jQuery 替代品，也不提供動畫、完整 Ajax 或 plugin
相容；`.load()` 只在 fabLoader 存在時橋接 `mountHtml()`。API 穩定後
預計以 `fabui.loader` 與 `fabui.dom` 併入 FabUI。Demo2 只直接載入
fabLoader；本機 jQuery 4 slim 載入行保留為註解，取消註解時 `$` 由
jQuery 接管，`fabLoader.dom` 仍可獨立使用。

## 本機開發與 Build

### 開發伺服器

```bash
npm run serve
```

- Build mode：`http://127.0.0.1:4173/demo/grid.html`
- Source mode：`http://127.0.0.1:4173/demo/dev-grid.html`

### Build 指令

| 指令 | 範圍 |
| --- | --- |
| `npm run build` | FabUI core、Default CSS、完整 17 組獨立 theme 檔與圖片。 |
| `npm run build:lite` | 只重建 `fabui.lite.*`。 |
| `npm run build:diagram` | 只重建 `fabui.diagram.*`。 |
| `npm run build:gantt` | 只重建 `fabui.gantt.*`。 |
| `npm run build:scheduler` | 只重建 `fabui.scheduler.*`。 |
| `npm run build:htmleditor` | 只重建 `fabui.htmleditor.*`。 |
| `npm run build:loader` | 只重建實驗性的 `dist/fabLoader.js` 與 `dist/fabLoader.min.js`。 |
| `npm run build:theme` | 只重建 `dist/theme/` 下完整 17 組主題，包含 `fabui.default.{css,min.css}`。 |
| `npm run build:locale` | 只重建 `dist/locales/` 下選用的 `en`、`zh-TW`、`zh-CN` 語言檔。 |
| `npm run build:all` | 依序重建 core、Lite、Diagram、Gantt、Scheduler、HtmlEditor 與 Locale。 |
| `npm run build:fabloader` | 重建內建 fabDom helper 的 `fabLoader.*`。 |
| `npm run benchmark:grid` | 以 20,000×50 資料集量測 binding、全域搜尋、雙欄排序與雙向 virtualization 上限，不重建 `dist`。 |
| `npm test` | 執行 Node.js 自動測試，不重建 `dist`。 |

單一 build scope 可在 npm 參數後加入 `-- min`，只保留該範圍的 `.min.js`／`.min.css`；Theme 圖片仍會保留。

所有 build 都只產生 browser global JavaScript、CSS、壓縮檔與必要圖片，不產生 `.esm.*`。

使用 Codex 時可用 `build <scope>,<scope> [min]` 依指定順序組合 `fabui`、`lite`、`diagram`、`gantt`、`scheduler`、`htmleditor`、`theme`、`locale`，例如 `build fabui,htmleditor min`。逗號左右不可留空白；`all` 與 `clear` 必須單獨使用。

`build htmleditor min` 對應 `npm run build:htmleditor -- min`，只產生並保留 `dist/fabui.htmleditor.min.js` 與 `dist/fabui.htmleditor.min.css`，不重建 FabUI core 或其他獨立 bundle。

`build locale` 對應 `npm run build:locale`，只產生 `dist/locales/` 下 `en`、`zh-TW`、`zh-CN` 的一般版與壓縮版語言檔；`build locale min` 對應 `npm run build:locale -- min`，只保留三個 `.min.js` 語言檔。

`build fabloader` 對應 `npm run build:fabloader`，產生內含 fabDom 的 `dist/fabLoader.js` 與 `dist/fabLoader.min.js`；`build fabloader min` 對應 `npm run build:fabloader -- min`，只產生並保留合併版 `dist/fabLoader.min.js`。

`build loader` 對應 `npm run build:loader`，使用相同輸出檔名但不包含 fabDom；`build loader min` 對應 `npm run build:loader -- min`，只產生並保留純 Loader 的 `dist/fabLoader.min.js`。Fabloader 與 Loader 都不納入 `build all` 或逗號分隔的多範圍 build；最後執行的模式會決定同名輸出內容。

### 效能基準

```bash
npm run benchmark:grid
```

基準固定建立 20,000 列、50 欄，共 100 萬個資料格，輸出 binding scan、全域搜尋、雙欄排序的中位數，以及目前 viewport 的 row／column range 與最大渲染 cell 數。時間數字應在相同機器與執行環境下比較；虛擬化結果必須維持遠低於完整 100 萬個 cell。

## 原始碼結構

| 路徑 | 用途 |
| --- | --- |
| `src/fabui.js`、`src/fabui.css` | FabUI core 公開入口。 |
| `src/grid/` | FabGrid 資料、rendering、virtualization、選取、編輯、篩選、TreeGrid、拖曳與匯出。 |
| `src/editbox/` | EditBox、共用 editor definitions、Date／Combo／Color popup 與樣式。 |
| `src/pivot/`、`src/chart/` | Pivot 分析元件與 SVG Chart renderer。 |
| `src/diagram/` | Diagram renderer、工具箱、互動、歷程與匯出。 |
| `src/gantt/`、`src/scheduler/`、`src/htmleditor/` | 獨立 Gantt、Scheduler 與 HtmlEditor 原始碼。 |
| `src/fabloader/` | 實驗性的獨立動態資源 Loader。 |
| `src/theme/`、`src/locales/` | 主題、圖片與選用的 `en`／`zh-TW`／`zh-CN` 語言檔；英文訊息仍內建作為預設。 |
| `src/<component>/` | Button、Calendar、Form、Tabs、Tree、Panel、Window 等一般元件。 |
| `packages/` | 獨立的 Vue 2、FabGrid jQuery 與 FabUI jQuery wrapper。 |
| `build/` | Build、Theme builder 與 smoke scripts。 |
| `demo/` | Source mode 與 Build mode Demo。 |
| `docs/` | API 操作手冊。 |
| `test/` | Node.js 自動測試與 browser smoke 資源。 |

## 專案方向

FabGrid 以效能、穩定核心 API 與實用資料表功能為優先。核心維持 pure JavaScript；框架 wrapper 只負責 options、events、methods 與 lifecycle 對應，不接管 cell rendering。

後續規劃請見 [TODO](./TODO.md)。
