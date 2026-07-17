<p align="center">
  <img src="./assets/fabgrid-logo.png" alt="FabGrid logo" width="520">
</p>

# FabGrid

## FabGrid 介紹

FabGrid 名稱中的 **Fab** 是 **Fabulous** 的縮寫，意思是「出色、令人驚豔」。這個名稱代表專案希望提供兼具效能、實用性與良好開發體驗的資料表元件。

FabUI 是以 pure JavaScript 開發的前端 UI 元件庫，不依賴任何前端框架。主要元件包含 FabGrid、EditBox、Chart，以及 PivotPanel、PivotGrid、PivotChart 與 PivotWorkspace。

FabGrid 是以效能為優先的資料表元件，透過水平與垂直 virtualization 處理大量資料。內建凍結欄、TreeGrid、排序、搜尋、編輯、群組、分頁、JSON 匯入匯出，以及 CSV、Excel 匯出等常用功能。

EditBox 使用單一 class 提供文字、數字、日期、清單與顏色編輯，並可作為 FabGrid 的儲存格編輯器使用。

Pivot 元件共用同一個 PivotEngine。PivotPanel 用來設定分析欄位，PivotGrid 顯示多階列／欄彙總，PivotChart 將分析結果呈現為直條圖、橫條圖、折線圖或圓餅圖。PivotWorkspace 則將這些元件整合成完整的資料分析工作區。

Chart 是以 SVG 繪製的圖表元件，可獨立使用，也能與 FabGrid 或 PivotGrid 連動。

## 文件與 Demo

### 線上 Demo

- [線上 FabGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/grid.html)
- [線上 TreeGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/treegrid.html)
- [線上 Grid / Grid 拖曳 Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-grid.html)
- [線上 Grid / TreeGrid 拖曳 Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-treegrid.html)
- [線上 Chart Demo](https://jimmywon1028.github.io/fabgrid/demo/grid-chart.html)
- [線上 PivotGrid Demo](https://jimmywon1028.github.io/fabgrid/demo/pivot.html)
- [線上 PivotWorkspace Demo](https://jimmywon1028.github.io/fabgrid/demo/pivot-workspace.html)

### 開發測試

- [Demo 索引](./demo/index.html)
- EditBox 本機 Demo：[source-mode 開發版](./demo/dev-editbox.html) 與 [獨立 build-mode 正式版](./demo/editbox.html)。
- EditBox jQuery Demo：[source-mode 開發版](./demo/dev-editbox-jquery.html) 與 [獨立 build-mode 正式版](./demo/editbox-jquery.html)。
- PivotGrid 本機 Demo：[正式 build-mode](./demo/pivot.html) 與 [source-mode 開發版](./demo/dev-pivot.html)；source-mode 已提供右側 PivotChart panel，圖表類型選項會隨繁中、簡中、英文語系切換，正式版在下一次明確執行 build 時同步。
- PivotWorkspace 本機 Demo：[正式 build-mode](./demo/pivot-workspace.html) 與 [source-mode 開發版](./demo/dev-pivot-workspace.html)；整合 PivotPanel、PivotGrid、PivotChart，共用單一 PivotEngine，支援自適應三欄／三列與可拖曳 Splitter。兩個 Demo 的工具列皆可切換主題、語系、排列方式與 Pivot View 範例。
- Pivot 進階 source-mode Demo：[非同步彙總／PivotSlicer／計算欄位](./demo/dev-pivot-advanced.html)；展示 12,000 筆資料的分批彙總、取消、calculated field 與 WeightedAverage。
- Pivot source-mode Demo 使用單畫面 RWD 工作區，桌面顯示 PivotPanel、PivotGrid、PivotChart 三區，窄畫面改為上下排列；可分別隱藏／開啟定義與圖表 Panel。
- [工作進度](./worklogs/)

### API 操作手冊

- [FabGrid API 操作手冊](./docs/fabgrid-api.md)：完整的建構選項、欄位設定、方法、事件、遠端資料協定與匯出說明。
- [PivotGrid API 操作手冊](./docs/pivotgrid-api.md)
- [PivotChart API 操作手冊](./docs/pivotchart-api.md)
- [PivotWorkspace API 操作手冊](./docs/pivotworkspace-api.md)
- [Chart API 操作手冊](./docs/chart-api.md)
- [EditBox API 操作手冊](./docs/editbox-api.md)
- [EditBox jQuery Wrapper API](./docs/editbox-jquery-api.md)
- [Vue 2 Wrapper API](./docs/vue-api.md)
- [jQuery Wrapper API](./docs/jquery-api.md)

## 快速使用

在 HTML 載入 CSS 與 browser global bundle，接著建立 Grid：

```html
<link rel="stylesheet" href="./dist/fabui.css">
<div id="grid"></div>
<script src="./dist/fabui.js"></script>
<script>
  var rows = [
    { id: 1, name: '王小明', amount: 1280 },
    { id: 2, name: '陳小華', amount: 2560 }
  ];

  var columns = [
    { binding: 'id', header: '編號', width: 80, align: 'center', dataType: 'number' },
    { binding: 'name', header: '姓名', width: 160 },
    { binding: 'amount', header: '金額', width: 120, align: 'right', dataType: 'number' }
  ];

  var grid = new fabui.FabGrid('#grid', {
    itemsSource: rows,
    columns: columns,
    frozenColumns: 1,
    allowSorting: true,
    allowEditing: true,
    allowResizing: true
  });

  var sameGrid = fabui.Control.getControl('#grid');
</script>
```

ES module 使用者可由 `dist/fabui.esm.js` 匯入 `fabui`，再以 `new fabui.FabGrid(...)` 建立元件；完整範例與所有 API 請見 [API 操作手冊](./docs/fabgrid-api.md)。

Vue 2 Options API wrapper 位於 `packages/fabgrid-vue`，透過 `<fab-grid>` 使用 pure JavaScript core；Vue 不接管 cell rendering。

jQuery wrapper 位於 `packages/fabgrid-jquery`，透過 `$(element).fabgrid(options)` 建立或操作同一套 pure JavaScript core；jQuery 不參與 cell rendering。jQuery Demo 的初始化、公開方法與事件綁定都明確經過 wrapper：

```js
var $grid = $('#grid');

$grid.fabgrid({
  itemsSource: rows,
  columns: columns
});

$grid.fabgrid('setFrozenColumns', 2);
$grid.fabgrid('exportExcel', 'fabgrid-demo.xlsx');
$grid.on('selectionchanged.fabgrid', function(event, args) {
  console.log(args.row, args.col);
});
```

jQuery Demo 分成以下兩層：

- `demo/js/grid-jquery.js`：jQuery 專用 adapter，集中 `$.fn.fabgrid` 方法、option 與 jQuery event 操作。
- `demo/js/grid.js`：Pure JS 與 jQuery Demo 共用的資料展示、工具列、Popup、篩選及匯出流程。

開發版入口為 `demo/dev-jquery-grid.html`；引用 build 輸出的 browser global 版本為 `demo/grid-jquery.html`。

EditBox 的獨立 jQuery wrapper 位於 `packages/fabeditbox-jquery`，註冊 `$.fn.fabeditbox`，不依賴 FabGrid core：

```js
$('#amount').fabeditbox({
  editor: 'number',
  precision: 2
});

$('#amount').fabeditbox('setValue', 1280.5);
var value = $('#amount').fabeditbox('getValue');
```

也支援 EasyUI 風格的宣告式初始化：

```html
<input class="fab-editbox"
  data-options="editor:'text',iconCls:'icon-search'"
  style="width:300px">

<input class="fab-editbox"
  data-options="editor:'text',iconCls:'icon-search',width:300">

<input class="fab-editbox"
  data-options="editor:'text',iconCls:'icon-search',width:'300px'">
```

Browser global 依序載入 jQuery、`dist/editbox.min.js`、`dist/wrapper/fabeditbox-jquery.min.js` 後，會在 DOM ready 自動解析 `.fab-editbox`；動態加入的內容可呼叫 `fabuiEditBoxJQuery.parse(container)`。

## 主要能力

### FabGrid

| 類別 | 能力 |
| --- | --- |
| 效能 | 固定列高與欄寬的雙向 virtualization，只渲染可視範圍，適合大量資料。 |
| 資料來源 | 支援本機 Array，以及 `remote: true` 的遠端分頁、排序、搜尋與欄位篩選。 |
| 表格版面 | 支援左右凍結欄、列號欄、欄寬調整、欄位顯示切換、Footer aggregate、交替列背景與 Grid 全螢幕。 |
| 排序與篩選 | 提供欄位排序、Quick Search、Search Row 與 Excel-like 值篩選；`allowFiltering` 可統一開關欄位篩選。 |
| 群組與 TreeGrid | 支援 1 至 3 階群組、aggregate、群組收合，以及 `childItemsPath` TreeGrid、節點展開／收合、同層排序與階層鍵盤導覽。 |
| 資料列拖曳 | 支援 Grid 內重排、跨 Grid 移動，以及 TreeGrid 節點的 `before`、`inside`、`after` 階層調整。 |
| 選取與剪貼簿 | 支援 `Cell`、連續矩形 `CellRange`、滑鼠拖曳、Shift 延伸、鍵盤導覽與 TSV 複製。 |
| 編輯與驗證 | 內建 `text`、`number`、`date`、`combo`、`color` editor，支援遮罩、同步／非同步驗證與自訂 editor。 |
| 顯示自訂 | 提供 formatter、`formatItem`、`cellTemplate`、Row／GroupRow、`hitTest()` 與完整事件 API。 |
| 匯入與匯出 | 支援 JSON 匯入／匯出、CSV 與 XLSX 匯出；Excel 可保留格式、凍結窗格、篩選、群組、Footer 與隱藏欄位。 |
| 元件生命週期 | `fabui.Control.getControl()` 可取得既有 instance；managed DOM listener 會在互動結束或 `dispose()` 時解除。 |
| Popup 行為 | 右鍵選單、Filter、欄位選擇器與 editor popup 都支援 `Escape` 及點擊外部關閉，不會提交未確認內容。 |

### Pivot 分析元件

所有 Pivot 元件共用同一個 `PivotEngine`，避免重複彙總資料或維護多份分析狀態。

| 元件 | 用途與能力 |
| --- | --- |
| `PivotEngine` | 以 Rows、Columns、Values、Filters 建立 Pivot view；支援 Sum、Count、Average、Min、Max、WeightedAverage、日期群組、小計、總計、calculated field、ShowAs 與可取消的非同步彙總。 |
| `PivotPanel` | 以勾選、拖放與右鍵選單設定分析欄位、排序、篩選、aggregate 和 ShowAs，並可儲存或還原 `viewDefinition`。 |
| `PivotGrid` | 繼承 FabGrid 的 virtualization、選取、剪貼簿、匯出與全螢幕；支援多層標頭、列／欄小計、群組展開收合、三態排序與原始明細檢視。 |
| `PivotChart` | 將目前 Pivot view 顯示為 Column、Bar、Line 或 Pie；可跟隨 PivotGrid 的展開／收合狀態，並與彙總儲存格雙向同步選取。 |
| `PivotSlicer` | 提供搜尋、多選、套用與清除，可與其他 Pivot 元件共用同一份篩選狀態。 |
| `PivotWorkspace` | 整合 PivotPanel、PivotGrid 與 PivotChart，提供 RWD 三欄／三列版面、Splitter、Panel 顯示切換、彙總進度與 Pane 全螢幕。 |

### 其他 FabUI 能力

| 類別 | 能力 |
| --- | --- |
| EditBox | 獨立使用文字、數字、日期、清單與顏色 editor，並與 FabGrid 共用 editor definitions、格式與 popup 行為。 |
| Chart | 使用 SVG 繪製 Column、Bar、Line、Pie，可獨立使用或與 FabGrid、PivotGrid 連動。 |
| 多語系 | 內建 `en`、`zh-TW`、`zh-CN` locale。 |
| 主題 | 提供多組內建主題，FabGrid、Pivot 與 Chart 共用一致的視覺變數。 |
| 框架整合 | 提供 Vue 2 與 jQuery wrapper，包裝既有 pure JavaScript core，不接管資料格渲染。 |

完整選項、方法、事件與範例請參考前述 [API 操作手冊](#api-操作手冊)。

## 套件與原始碼結構

`fabui` 是最上層 namespace，FabGrid core bundle 公開 `fabui.FabGrid`、`fabui.pivot`、`fabui.Chart` 與必要的 `fabui.Control`、`fabui.CellType`、`fabui.editorDefinitions`、`fabui.FabGridLocales`。獨立載入 `dist/editbox.min.js` 後會增加 `fabui.EditBox`，但 EditBox 不會併入 core bundle；另可載入 `dist/wrapper/fabeditbox-jquery.min.js` 註冊 `$.fn.fabeditbox`。Pivot 類別與列舉統一由 `fabui.pivot.PivotPanel`、`fabui.pivot.PivotGrid`、`fabui.pivot.PivotChart`、`fabui.pivot.PivotWorkspace`、`fabui.pivot.PivotSlicer`、`fabui.pivot.PivotEngine`、`fabui.pivot.PivotField`、`fabui.pivot.PivotAggregate`、`fabui.pivot.PivotShowAs`、`fabui.pivot.PivotShowTotals` 取得；頂層不重複公開。Row 類型只由 `fabui.FabGrid.Row` 與 `fabui.FabGrid.GroupRow` 公開。後續元件 roadmap 另有參考 EasyUI Material Teal 契約的 Window、Panel、Layout，詳見 [TODO](./TODO.md)。

可透過 `fabui.version` 取得發佈日期版本，格式為 `YYYY.M.D`，例如 `2026.7.11`。每次執行 build 時會依本機當天日期自動產生。

```text
src/fabui.js                        公開入口
src/core/control.js                 Host element 與 Control instance registry
src/grid/fabgrid.js                 FabGrid factory、公共 API、事件與模組協調
src/grid/fabgrid-view.js            Layout、雙向 virtualization 與 rendering
src/grid/fabgrid-filter-ui.js       Search Row、Excel-like filter 與 popup UI
src/grid/fabgrid-selection.js       選取、鍵盤、clipboard 與欄位互動
src/grid/fabgrid-editor-runtime.js  Cell editing、editor panel 與 validation
src/grid/fabgrid-data.js            Data view、remote、pagination 與 grouping
src/grid/fabgrid-tree.js            TreeGrid 可視列、狀態與互動
src/grid/fabgrid-drag.js            Row drag 與跨 Grid drop
src/grid/fabgrid-export.js          CSV 與 Excel 匯出
src/editbox/editbox.js             獨立 EditBox 公開入口與統一 API
src/editbox/editbox-definitions.js FabGrid／EditBox 共用 editor 定義
src/editbox/editbox.css            EditBox 獨立樣式入口
packages/fabeditbox-jquery/        EditBox jQuery wrapper source、types 與獨立輸出
src/pivot/pivot-engine.js           Pivot 欄位、分組、彙總與 view definition
src/pivot/pivot-chart.js            Pivot view 到 SVG Chart 的 adapter 與 lifecycle
src/pivot/pivot-chart.css           沿用 FabGrid theme variables 的 PivotChart 樣式
src/pivot/pivot-workspace.js        PivotPanel／PivotGrid／PivotChart 組合與 Splitter lifecycle
src/pivot/pivot-workspace.css       PivotWorkspace 自適應三欄／三列與 Splitter 樣式
src/pivot/pivot-panel.js            Pivot View 欄位配置與儲存還原 UI
src/pivot/pivot-panel.css           沿用 FabGrid theme variables 的 PivotPanel 樣式
src/pivot/pivot-grid.js             PivotGrid lifecycle、多層標頭與互動
src/pivot/pivot-grid.css            沿用 FabGrid CSS variables 的 Pivot 樣式
src/editor/editor-definitions.js   舊 editor definitions import 相容入口
```

FabGrid core 發佈檔位於 `dist/`：`fabui.js`、`fabui.min.js`、`fabui.esm.js`、`fabui.esm.min.js`、`fabui.css` 與主題 CSS。EditBox 獨立輸出為 `editbox.js`、`editbox.min.js`、`editbox.esm.js`、`editbox.esm.min.js`、`editbox.css`、`editbox.min.css`；其 jQuery wrapper 輸出為 `dist/wrapper/fabeditbox-jquery.min.js` 與 `packages/fabeditbox-jquery/dist/`。

## 本機開發

```bash
npm run serve
```

開啟 `http://127.0.0.1:4173/demo/grid.html` 查看 build-mode Demo，或開啟 `http://127.0.0.1:4173/demo/dev-grid.html` 查看 source-mode Demo。若需要重新產生發佈檔，請執行：

```bash
npm run build
```

## 專案方向

FabGrid 保持核心 pure JavaScript 與效能優先；現有 Vue 2 與 jQuery wrapper 僅負責 options、events、methods 與 lifecycle 對應，不接管 cell rendering。
