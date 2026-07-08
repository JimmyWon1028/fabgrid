# FastGrid

FastGrid 是一個以效能為優先的 pure JavaScript data grid。核心目標是用簡單、可預測、可打包引用的方式，支援大量資料表的雙向 virtualization、凍結欄、選取、編輯、匯出與接近 Wijmo FlexGrid 的常用 API 形狀。

目前 demo 使用 `1000 x 30` 測試資料，預設左側凍結 2 欄、右側凍結 1 欄。

## 線上 Demo

[https://jimmywon1028.github.io/fastgrid/demo/](https://jimmywon1028.github.io/fastgrid/demo/)

## 專案定位

- 核心不依賴 Vue、React 或後端。
- demo 使用打包後的 `dist/fastgrid.min.js` 與 `dist/fastgrid.css`，用來驗證可直接被其他專案引用。
- 渲染採用 div-based grid，不使用完整原生 table，避免大量 DOM。
- row 與 column 都做 virtualization，只渲染可視範圍與 buffer。
- 固定列高與固定欄寬是目前效能模型的基礎。

## 目前功能

- `itemsSource` array 資料綁定。
- `columns` 欄位定義，支援 `binding`、`header`、`width`、`minWidth`、`align`、`dataType`、`formatter`、`footerFormatter`、`validate`、`mask`、`maskValueIncludesLiterals`、`autoUnmask`、`readOnly`、`aggregate`。
- 欄位標題可用熱鍵在 `header` 與 `binding` 顯示之間切換，`headerToggleKey` 預設為 `false`，可自行設成 `F4`。
- 雙向 virtualization。
- 快速捲動時，超出目前 buffer 會同步補畫 viewport，並依捲動方向動態加大 row buffer，減少凍結欄旁邊短暫空白。
- 左側凍結欄：`frozenColumns`。
- 右側凍結欄：`frozenRightColumns`。
- 左側列號欄，預設寬度 `60px`。
- 列號欄開關：`showRowHeaders`。
- Footer 聚合列：`showFooter`，欄位可設定 `aggregate`。
- 多選列 checkbox 欄：`multiSelectRows`。
- 欄位標題與內容對齊一致，數字欄可靠右，ID 可置中。
- 單一 cell 選取。
- 點選列號可選取整列。
- 點選儲存格或列號會切換該列選取狀態，再點一次可取消。
- 排序或篩選後，選取狀態會跟著同一筆資料列移動。
- row hover 與 selected row 樣式。
- 偶數列背景色，demo 使用 `#fafafa`。
- 編號列在 hover/selected 時保持原本灰底樣式。
- 鍵盤方向鍵移動選取；唯讀狀態下，上/下鍵會移動 row selected 底色，左/右鍵移動 cell 時會保留同一列的 row selected 底色。
- `Space` 會切換目前 active cell 所在列的選取狀態。
- `Ctrl+C` / `Cmd+C` 複製目前選取 cell 文字。
- 數字欄位複製時會輸出未格式化數值，不帶千分位符號。
- double click、Enter、F2 開始編輯。
- 唯讀/編輯模式：`setEditMode(true)` 會開啟點選 cell 直接編輯。
- 每個 column 可用 `readOnly: true` 設定不可編輯。
- 編輯框會沿用欄位內容的 `text-align`。
- Editor 支援 `textbox`、`numberbox`、`datebox`、`combobox`。
- `numberbox` 支援負數、千分位顯示與 `precision` 固定小數位。
- `datebox` 支援日期面板、日期遮罩與自訂 mask，例如 `9999/99/99`、`9999-99-99`。
- `combobox` 支援輸入、下拉選取、`limitToList`、`showValueInList` 與 `Alt/Option + ArrowDown` 開啟清單。
- 編輯狀態下 Enter / Tab 會提交，並向右跳到下一個可編輯 column。
- 編輯狀態下上/下鍵會提交，並移到上/下列同欄繼續編輯。
- Escape 取消。
- 欄位層級 `validate(args)`，支援同步與 Promise 非同步驗證。
- 驗證錯誤會標示 cell、顯示 tooltip，並記錄於 `grid.invalidItems`。
- Header 點擊排序。
- 全域搜尋。
- 欄寬拖曳調整。
- CSV 匯出。
- Excel 匯出，包含欄寬、凍結窗格、filter、footer、number format、grid border、header/cell 背景與文字顏色。
- Excel 匯出時會顯示 busy 提示，並在完成前阻擋 grid 操作。
- 多國語系訊息檔，支援英文、繁體中文，並提供未載入的簡體中文檔案。
- 主題 CSS，來源為 `src/styles/themes/fastgrid.<suffix>.css`，並可依 `src/styles/my.wijmo.*.css` 的後綴產生對應主題。
- 基本 Wijmo-like event/property aliases。

## 快速開始

```bash
npm run build
python3 -m http.server 4176
```

開啟：

```txt
http://127.0.0.1:4176/demo/
```

也可以用 package script 啟動 4173：

```bash
npm run serve
```

## 基本使用

```html
<link rel="stylesheet" href="./dist/fastgrid.css">
<div id="grid"></div>
<script src="./dist/fastgrid.min.js"></script>
<script>
  var grid = new FastGrid('#grid', {
    rowHeight: 32,
    headerHeight: 36,
    overscanRows: 14,
    fastScrollOverscanRows: 64,
    overscanColumns: 3,
    syncScrollRender: true,
    headerDisplayMode: 'header',
    frozenColumns: 2,
    frozenRightColumns: 1,
    showRowHeaders: true,
    multiSelectRows: false,
    alternatingRows: true,
    alternatingRowBackground: '#fafafa',
    itemsSource: rows,
    columns: columns,
    allowSorting: true,
    allowEditing: true,
    allowResizing: true
  });
</script>
```

ES module 用法：

```js
import { FastGrid } from './dist/fastgrid.esm.js';

const grid = new FastGrid('#grid', {
  itemsSource: rows,
  columns
});
```

## 多國語系

FastGrid 核心不內建完整語言包，語言檔會獨立輸出到 `dist/locales/`，依需要載入即可。若用 `<script>` 引用，先載入核心，再載入需要的語言檔：

```html
<script src="./dist/fastgrid.min.js"></script>
<script src="./dist/locales/fastgrid-locale.zh-TW.js"></script>
<script src="./dist/locales/fastgrid-locale.en.js"></script>
```

目前提供：

- `fastgrid-locale.en.js`
- `fastgrid-locale.zh-TW.js`
- `fastgrid-locale.zh-CN.js`

可以在建立 grid 時指定 `locale`，或在執行中呼叫 `setLocale()` 切換。未載入的語言不會自動生效：

```js
var grid = new FastGrid('#grid', {
  locale: 'zh-TW',
  itemsSource: rows,
  columns: columns
});

grid.setLocale('en');
grid.setLocale('zh-TW');
```

若只想覆寫部分文字，可以傳入 `messages`；未提供的項目會回到目前已載入的語系：

```js
grid.setLocale('zh-TW', {
  validation: {
    invalidDate: '日期不正確'
  }
});
```

也可以在程式中新增語系包：

```js
FastGrid.addLocale('ja', {
  emptyText: 'データがありません',
  validation: {
    invalidValue: '入力値が正しくありません'
  }
});

grid.setLocale('ja');
```

ES module 版本會匯出目前的語系 registry，語言資料仍建議用獨立語言檔載入或自行呼叫 `FastGrid.addLocale()`：

```js
import { FastGrid, FastGridLocales } from './dist/fastgrid.esm.js';
```

## 主題

FastGrid 主題來源放在 `src/styles/themes/fastgrid.<suffix>.css`，build 後會輸出到 `dist/themes/`。如果 `src/styles/my.wijmo.<suffix>.css` 存在，build 也會參考同後綴的 Wijmo 主題色票產生對應 FastGrid 主題：

```txt
dist/themes/fastgrid.default.css
dist/themes/fastgrid.material-blue.css
dist/themes/fastgrid.dark-hive.css
```

載入主題檔後，把對應 class 加到 grid root 即可套用：

```html
<link rel="stylesheet" href="./dist/fastgrid.css">
<link rel="stylesheet" href="./dist/themes/fastgrid.dark-hive.css">
```

```js
var grid = new FastGrid('#grid', {
  itemsSource: rows,
  columns: columns
});

grid.root.classList.add('fg-theme-dark-hive');
```

目前 demo 會載入主題清單並提供上方「主題」下拉選單，切換後會記憶在 localStorage。

## 常用 API

```js
grid.setItemsSource(rows);
grid.setColumns(columns);
grid.setFrozenColumns(2);
grid.setFrozenRightColumns(1);
grid.setShowRowHeaders(true);
grid.setShowFooter(true);
grid.setEditMode(true);
grid.setMultiSelectRows(true);
grid.setHeaderDisplayMode('binding');
grid.toggleHeaderDisplayMode();
grid.setLocale('en');
grid.setSearch('keyword');
grid.setFilter(function(item) {
  return item.status === 'Active';
});
grid.clearFilter();
grid.refresh();
grid.invalidate();
grid.select(0, 0);
grid.selectRow(0);
grid.getCellData(0, 0);
grid.setCellData(0, 0, 'new value');
grid.exportCsv('fastgrid-demo.csv');
grid.exportExcel('fastgrid-demo.xlsx').then(function() {
  console.log('Excel exported');
});
grid.dispose();
```

欄位標題顯示模式：

```js
var grid = new FastGrid('#grid', {
  headerDisplayMode: 'header',
  headerToggleKey: 'F4',
  itemsSource: rows,
  columns: columns
});

grid.setHeaderDisplayMode('binding');
grid.setHeaderDisplayMode('header');
grid.toggleHeaderDisplayMode();
```

`headerDisplayMode` 可設定為 `header` 或 `binding`。`headerToggleKey` 預設為 `false`，不會自動啟用熱鍵；若需要可設成 `F4`、`Ctrl+F4` 等按鍵組合。

常用 property aliases：

```js
grid.itemsSource;
grid.collectionView;
grid.rows;
grid.frozenColumns;
grid.frozenRightColumns;
grid.showRowHeaders;
grid.showFooter;
grid.editMode;
grid.multiSelectRows;
grid.selectedItems;
grid.selectedRows;
grid.selectedRanges;
grid.scrollPosition;
grid.scrollSize;
grid.viewRange;
grid.activeCell;
grid.activeEditor;
grid.isReadOnly;
```

事件用法：

```js
grid.on('viewportChanged', function(e) {
  console.log(e.rowStart, e.rowEnd, e.columnStart, e.columnEnd, e.renderedCells);
});

grid.selectionChanged.addHandler(function(sender, e) {
  console.log(e.row, e.col);
});
```

## 欄位設定

```js
var columns = [
  { binding: 'id', header: 'ID', width: 72, minWidth: 56, align: 'center', dataType: 'number' },
  { binding: 'name', header: '客戶名稱', width: 160, minWidth: 100, dataType: 'string' },
  { binding: 'amount', header: '金額', width: 120, minWidth: 90, align: 'right', dataType: 'number' },
  {
    binding: 'status',
    header: '狀態',
    width: 100,
    formatter: function(value) {
      return value || '';
    }
  }
];
```

欄位標題的對齊會跟著欄位內容的 `align` 設定走。數字欄位若要靠右，需要明確設定 `align: 'right'`。
進入編輯時，input editor 也會使用同一個 `align`，例如金額欄會維持靠右。

數字欄位千分位與固定小數位：

```js
var columns = [
  {
    binding: 'amount',
    header: '金額',
    align: 'right',
    dataType: 'number',
    thousandsSeparator: true,
    precision: 2,
    editor: {
      type: 'numberbox'
    }
  }
];
```

`thousandsSeparator: true` 時，非編輯顯示與 numberbox 編輯中會顯示千分位，例如 `1234567` 顯示成 `1,234,567`。設成 `false` 或不設定時不會自動加千分位。`precision: 2` 會讓非編輯狀態顯示固定小數位，例如 `1234` 顯示成 `1,234.00`；編輯中仍可輸入任意小數位，完成編輯時會依設定四捨五入後存回數字值。numberbox editor 會共用 column 上的 `thousandsSeparator` 與 `precision` 設定，不需要在 `editor.options` 重複設定。數字欄位在非編輯狀態或編輯狀態複製時，copy 值都會移除千分位符號，例如複製 `1,234.50` 會得到 `1234.50`。

編輯模式：

```js
const columns = [
  { binding: 'id', header: 'ID', readOnly: true },
  { binding: 'name', header: '客戶名稱' },
  { binding: 'amount', header: '金額', align: 'right', dataType: 'number' }
];

grid.setEditMode(true);
```

編輯模式開啟後，點選可編輯 cell 會直接進入 editor。Enter / Tab 會提交目前值，並向右跳到下一個 `readOnly !== true` 的 column。上/下鍵會提交目前值，並移到上/下列的可編輯 cell 繼續編輯。

Combobox 欄位：

```js
var columns = [
  {
    binding: 'status',
    header: '狀態',
    editor: {
      type: 'combobox',
      valueField: 'id',
      textField: 'descr',
      limitToList: true,
      showValueInList: true,
      limitToListMessage: '請從清單選擇狀態',
      data: [
        { id: 'Active', descr: '啟用' },
        { id: 'Paused', descr: '暫停' },
        { id: 'Pending', descr: '待確認' }
      ]
    }
  }
];
```

`combobox` 可以點右側按鈕展開清單並選取，也可以直接在 cell editor 輸入內容。選到清單項目時，資料會寫回 `valueField` 的值；如果 `limitToList` 不是 `true`，輸入內容不在清單中時會直接寫回輸入文字。顯示時會用 `textField` 對應的文字，找不到對應項目時顯示原始值。

`showValueInList: true` 時，下拉清單會同時顯示文字與 value，例如 `買賣(1)`，其中 `(1)` 會用淡灰色顯示；cell 本身仍只顯示 `textField` 文字。

編輯 combobox cell 時，也可以用 `Alt + ArrowDown`，macOS 上的 `Option + ArrowDown`，展開下拉清單；清單開啟後可用上/下方向鍵移動選項，按 Enter 選取。

設定 `limitToList: true` 時，輸入內容必須符合清單中的 `valueField` 或 `textField`。錯誤時 cell 會標示 invalid，並把錯誤寫入 `grid.invalidItems`。

欄位驗證：

```js
var columns = [
  {
    binding: 'amount',
    header: '金額(同步)',
    align: 'right',
    dataType: 'number',
    editor: 'numberbox',
    validate: function(args) {
      var value = Number(args.value);
      if (!isFinite(value) || value < 0 || value > 1000000) {
        return '金額必須介於 0 到 1,000,000';
      }
      return null;
    }
  },
  {
    binding: 'score',
    header: '分數(非同步)',
    align: 'right',
    dataType: 'number',
    editor: 'numberbox',
    validate: function(args) {
      return getRefReturn(args).then(function(result) {
        if (result.valid) {
          return null;
        }
        return result.message || '分數檢查失敗';
      }).catch(function() {
        return '無法完成分數檢查，請稍後再試';
      });
    }
  }
];

function getRefReturn(args) {
  return new Promise(function(resolve) {
    var value = Number(args.value);
    setTimeout(function() {
      resolve({
        valid: isFinite(value) && value >= 0 && value <= 100,
        message: '分數必須介於 0 到 100'
      });
    }, 120);
  });
}
```

`validate(args)` 可以回傳：

- `null`、`false`、`''`：驗證通過。
- 字串：錯誤訊息，grid 會標示 invalid cell 並顯示 tip。
- object：進階錯誤資訊，例如 `{ message: '錯誤訊息' }`，`type` 與 `value` 可省略。
- Promise：非同步回傳以上任一種結果。

`dataType: 'number'` 的欄位會先把 editor 文字轉成 number 再傳入 `validate(args)`，所以 `args.value` 會是 `number` 或空值 `null`，不會是含千分位符號的字串。

驗證失敗的 cell 會記錄在 `grid.invalidItems`：

```js
grid.invalidItems.forEach(function(item) {
  console.log(item.rowNumber, item.colNumber, item.binding, item.value, item.message);
});
```

`invalidItems` 是 array，每筆資料會包含錯誤 cell 的 row / column 資訊與錯誤訊息；可用 `rowNumber`、`colNumber` 直接顯示給使用者。

文字遮罩欄位：

```js
const columns = [
  {
    binding: 'textDate',
    header: '文字日期',
    dataType: 'string',
    mask: '9999/99/99',
    maskValueIncludesLiterals: false
  }
];
```

`mask` 目前支援 `9` 數字、`A` 英文字母、`*` 英數字元。`maskValueIncludesLiterals: false` 代表資料值不包含 `/` 這類遮罩字元；例如資料是 `20260707`，顯示與編輯時是 `2026/07/07`，copy cell 時仍只會 copy `20260707`。

Footer 聚合列：

```js
const columns = [
  { binding: 'amount', header: '金額', align: 'right', dataType: 'number', aggregate: 'sum' },
  { binding: 'score', header: '分數', align: 'right', dataType: 'number', aggregate: 'avg' }
];

const grid = new FastGrid('#grid', {
  itemsSource: rows,
  columns,
  showFooter: true,
  footerHeight: 28
});
```

`aggregate` 支援 `sum`、`avg` / `average`、`count`、`min`、`max`，也可以傳入 function 自訂。聚合範圍是目前 `view`，因此搜尋或篩選後 footer 會跟著重新計算。

## Demo 狀態

目前 demo：

- 資料量：`1000 x 30`
- 上方設定會記憶在 localStorage，下次載入會先套用上次設定
- 語言：可切換繁體中文 / 英文
- 主題：可切換 `default`、`bootstrap`、`cupertino`、`material`、`material-blue`、`material-teal`、`metro`、`metro-blue`、`metro-gray`、`metro-green`、`metro-orange`、`metro-red`、`sunny`、`pepper-grinder`、`dark-hive`、`black`
- 左凍結欄：`2`
- 右凍結欄：`1`
- 列號欄：預設關閉，可用 `showRowHeaders` 開啟
- Footer：開啟，金額與數字欄做合計，分數做平均
- 多選欄：預設關閉，可用 demo 的「多選」checkbox 或 `multiSelectRows` 開啟
- 多選時：上/下方向鍵只移動 active cell；即使正在編輯，也不會自動勾選或選取 row
- 編輯模式：預設開啟，可用 demo 的「編輯」checkbox 或 `setEditMode(true)` 切換
- Combobox 欄位：demo 的 `狀態`、`分類` 可以下拉選取，也可以直接輸入自訂內容
- 遮罩欄位：demo 的 `文字日期` 使用 `mask: '9999/99/99'`，資料與 copy 值不包含 `/`
- 日期欄位：demo 的 `日期` 使用 `mask: '9999-99-99'`
- 金額欄位：demo 的 `金額(同步)` 使用同步驗證、千分位與 `precision: 2`
- 分數欄位：demo 的 `分數(非同步)` 使用 Promise 非同步驗證
- row header 寬度：`60px`
- font-size：`14px`
- 偶數列背景：`#fafafa`
- row hover：整列變色，包含偶數列
- row selected：資料 cell 整列變色，編號列保持原本樣式
- cell / row header click：切換列選取狀態
- Space：切換目前 active cell 所在列選取狀態
- sort / filter：選取列會保留同一筆 data item，不會停在舊 index
- header / row header 字色：`#808080`
- cell 字色：`#000000`

## Build 與測試

```bash
npm run build
npm run smoke
```

`npm run build` 會產生：

```txt
dist/
  fastgrid.esm.js
  fastgrid.esm.min.js
  fastgrid.js
  fastgrid.min.js
  fastgrid.css
  fastgrid.min.css
  locales/
    fastgrid-locale.en.js
    fastgrid-locale.en.min.js
    fastgrid-locale.zh-TW.js
    fastgrid-locale.zh-TW.min.js
    fastgrid-locale.zh-CN.js
    fastgrid-locale.zh-CN.min.js
  themes/
    fastgrid.<suffix>.css
    fastgrid.<suffix>.min.css
```

`npm run smoke` 會先 build，再啟動本機 HTTP server 與 headless Chrome，驗證核心行為與 computed styles。測試涵蓋：

- FastGrid global 是否存在。
- 搜尋、編輯、複製。
- Wijmo-like aliases/events。
- 左右凍結欄。
- row hover / row selected。
- row header 樣式不被 selected/hover 改掉。
- 偶數列 hover 是否整列變色。
- scrollbar gutter 與左下角空白問題。
- CSV / Excel 相關輸出。
- Excel 是否保留 grid border、header fill、cell color/background、frozen pane、footer、number format。
- numberbox、datebox、combobox、mask、validate、invalidItems。
- locale 載入與 `headerToggleKey` 預設行為。

## 目前開發經驗

### 1. Virtualization 不能讓 frozen columns 破壞渲染範圍

左凍結與右凍結欄必須從可捲動欄位範圍中扣掉：

- 左側：`0 .. frozenColumns - 1`
- 中間：`frozenColumns .. visibleColumns.length - frozenRightColumns - 1`
- 右側：最後 `frozenRightColumns` 欄

中間區域才做橫向 virtualization。左右凍結欄只渲染可視 rows，不能渲染所有 rows。

### 2. 右側凍結欄要避開原生垂直捲軸

右凍結 pane 不能單純 `right: 0`。如果原生垂直 scrollbar 佔位，右凍結欄會被蓋住或對不齊。現在用：

```js
bodyScroll.offsetWidth - bodyScroll.clientWidth
```

量測 vertical scrollbar gutter，再把右凍結 header/body 都往左讓出這個寬度。

### 3. 左下角與底部 scrollbar 要用 gutter 保護

row header pane 與 frozen pane 的 `bottom` 要等於水平 scrollbar 高度，不然左下角會被 cell 或列號覆蓋，也會讓水平捲軸不好操作。

目前用 `bodyScroll.offsetHeight - bodyScroll.clientHeight` 量測水平 scrollbar gutter，並寫入 CSS variable。

### 4. CSS selector 權重要特別小心

偶數列背景曾經蓋掉 hover row 背景。原因是：

```css
.fg-cell.fg-row-even
```

比單純：

```css
.fg-row-hovered
```

權重更高。修正方式是把 hover 規則提高到 cell 層級：

```css
.fg-cell.fg-row-hovered
```

### 5. row header 不應該吃 row selected/hover 的資料列樣式

使用者期待列號欄像 grid header 區，選取或 hover 時保持灰底灰字，不跟資料 cell 一起變黃或變藍。因此 row header selected/hover 要明確覆蓋回原本背景與文字色。

### 6. Header 對齊要跟內容一致

只改 cell 對齊不夠，header label 本身也要依照欄位 `align` 套用 `text-align`。另外空的 sort glyph 不能占位，否則靠右標題會看起來偏掉。

### 7. Excel 匯出要保留視覺語意，不只是資料

目前 Excel 匯出不是單純 values：

- 欄寬會依 grid width 轉換。
- header 有背景。
- cell 有 border。
- formatCell 造成的文字色與背景色會被帶入。
- frozenColumns 會轉成 worksheet frozen pane。
- 會加入 autoFilter。

右側凍結欄目前是畫面行為；Excel 標準 frozen pane 主要支援左側/上方凍結，因此匯出仍以左凍結欄為主。

### 8. Demo cache busting 很重要

demo 直接引用 dist 檔案，瀏覽器容易吃到舊 CSS/JS。每次 UI 行為修正後，`demo/index.html` 的 query version 要同步更新，避免看起來像修改沒有生效。

### 9. Smoke test 要驗證 computed style

這個專案很多問題是「DOM 存在，但視覺結果錯」。因此 smoke test 不只檢查 API，也要檢查 `getComputedStyle()`：

- font-size
- header / row header color
- row header selected background
- even row hover background
- scrollbar gutter bottom
- frozen pane width

## 目前限制

- 尚未做 range selection。
- 尚未做 cell range multi-selection。
- 尚未做 paste。
- 尚未做 Excel-style filter menu。
- 尚未做 column reorder。
- 尚未做 grouping / tree grid / merged cells。
- 尚未做 variable row height。
- 右側凍結欄尚未轉換成 Excel 匯出的右側 frozen 視覺，因 Excel frozen pane 模型與瀏覽器 grid 行為不同。

## 建議下一步

1. 將目前單檔 core 拆成 data、layout、render、features 模組。
2. 為 `frozenRightColumns` 補更多互動測試，例如 resize、sort、editing、scrollIntoView。
3. 補 `getCellRect()` 或類似 API，讓 editor、tooltip、context menu 共用定位邏輯。
4. 補正式文件頁，區分 core API、demo、Wijmo compatibility layer。
5. 規劃 Vue wrapper，但不要讓 Vue 接管 cell rendering。
