# FastGrid 專案筆記

## 語言與風格

- 回覆使用者時一律使用繁體中文。
- 代碼註釋必須使用英文。
- 代碼縮排一律使用兩個空白，不使用 tab。

## Git 與 GitHub 工作規則

- 可以依任務需要建立本地 commit，但不要主動推送到 GitHub。
- 只有在使用者明確要求「上傳」、「推送」、「同步到 GitHub」或同等意思時，才執行 `git push` 或 GitHub 遠端操作。

## 產品方向

FastGrid 是一個以效能為優先的 data grid，核心使用 pure JavaScript 建置。

目標不是複製 Wijmo FlexGrid 的所有功能。第一版應該先提供一般資料表常見且實用的能力，同時保持渲染引擎快速、簡單、可擴充。

優先順序：

1. 效能。
2. 穩定的核心 API。
3. 基本 grid 功能。
4. 額外功能與 Vue wrapper。

## 技術方向

- 核心使用不綁定框架的 pure JavaScript。
- 第一版 demo 不需要後端。
- core package 不依賴 Vue。
- core 必須能打包成可在其他專案引用的 library 檔案。
- V1 至少要輸出 ES6 module 版本與 ES5 browser global 版本。
- `dist/fastgrid.min.js` 必須是可用 `<script>` 直接引用的 ES5 相容壓縮版本。
- core 穩定之後，可以再加入 Vue wrapper。
- Vue wrapper 只負責把 props、events、lifecycle 對應到 pure JS core。
- 在大資料量情境下，Vue 不應該接管每個 cell 的渲染。

建議套件方向：

```txt
fastgrid-core
fastgrid-vue
```

建議輸出檔案：

```txt
dist/
  fastgrid.esm.js
  fastgrid.esm.min.js
  fastgrid.js
  fastgrid.min.js
  fastgrid.css
```

`fastgrid.min.js` 必須是 ES5 相容的 browser global build，能在其他專案中直接引用：

```html
<link rel="stylesheet" href="./fastgrid.css">
<script src="./fastgrid.min.js"></script>
<script>
  const grid = new FastGrid('#grid', {
    itemsSource: rows,
    columns
  });
</script>
```

同時保留 ES6 module 匯出，方便現代 bundler 或 `<script type="module">` 使用：

```js
import { FastGrid } from './fastgrid.esm.js';
```

建議核心 API 形式：

```js
const grid = new FastGrid('#grid', {
  rowHeight: 32,
  headerHeight: 36,
  overscanRows: 8,
  overscanColumns: 3,
  frozenColumns: 0,
  itemsSource: rows,
  columns,
  allowSorting: true,
  allowEditing: true,
  allowResizing: true
});
```

## 效能要求

FastGrid 從一開始就必須以雙向 virtualization 為核心設計。

- 縱向捲動只渲染可視 rows 加上 buffer rows。
- 橫向捲動只渲染可視 columns 加上 buffer columns。
- 不渲染完整的 cell matrix。
- 不為每個 row-column 組合建立邏輯 cell object。
- cell value 應該依據 row item 與 column binding 即時計算。
- header、body，以及未來可能加入的 footer，必須共用同一套橫向 virtual range。
- 若設定 `frozenColumns`，左側 frozen pane 只渲染凍結 columns，可捲動區域仍維持橫向 virtualization。
- `frozenColumns` 不應造成所有 columns 都被渲染。
- 捲動相關工作應該透過 `requestAnimationFrame` 排程。
- 使用事件委派，避免替大量 cell 個別綁定 listener。
- 避免在 scroll path 中造成 layout thrashing。
- 預設 cell 渲染使用 `textContent`。
- rich HTML 或框架 template 必須是 opt-in，而且使用範圍應受限制。

初始 demo 目標：

```txt
2000 rows x 20 columns
```

未來壓力測試目標：

```txt
20000 rows x 50 columns
```

架構應該能夠朝壓力測試目標擴充，而不需要重寫。

## V1 Demo 範圍

第一版 demo 只做純前端。

- 不需要後端。
- 不需要 server-side data source。
- 在前端本地產生 mock data。
- 使用 2000 rows x 20 columns。
- 使用 pure JS、CSS、HTML。
- Demo 應該引用打包後的 `dist/fastgrid.min.js` 與 `dist/fastgrid.css`，用來驗證其他專案的引用方式。
- 除非有很強的理由，否則避免第三方依賴。

Demo 應該顯示有助於觀察效能的 runtime stats：

- 總 rows 數。
- 目前可視 row range。
- 目前可視 column range。
- 已渲染 cell 數。

## V1 核心功能

優先實作以下功能：

1. 資料顯示
   - `itemsSource` 綁定 array。
   - `columns` 明確定義 grid columns。
   - 支援 `binding`、`header`、`width`、`minWidth`、`align`、`dataType`。

2. 雙向 virtualization
   - 預設使用固定 `rowHeight`。
   - 可設定 `overscanRows`。
   - 可設定 `overscanColumns`。
   - 可設定 `frozenColumns`，用來指定左側凍結 columns 數量。
   - 維護 column width offsets，用於橫向 virtualization。
   - 橫向 range 計算使用 binary search 或同等效率的查找方式。
   - 橫向 virtualization 只套用在非凍結 columns 的 scrollable pane。

3. Header
   - Sticky header。
   - Header 與 body 橫向捲動同步。
   - Frozen header cells 與 frozen body cells 必須對齊。
   - 顯示排序狀態。
   - 顯示 resize handle。

4. Frozen columns
   - 支援 `frozenColumns` number option。
   - 預設值為 `0`。
   - 凍結 columns 固定在左側，不受橫向捲動影響。
   - 凍結 columns 仍需跟隨縱向 virtualization。
   - 凍結區與可捲動區應共用同一套 row range。
   - `frozenColumns` 不可大於 visible columns 總數，超過時應 clamp。

5. 排序
   - 點擊 header 可對單一 column 排序。
   - 排序狀態包含 ascending、descending、none。
   - 支援 string、number、date、boolean 的基本比較。
   - 提供類似 `sortingColumn`、`sortedColumn` 的事件。

6. 篩選
   - 第一版先做簡單全域搜尋。
   - 支援 `setFilter(predicate)` 與 `clearFilter()` 這類 API hook。
   - V1 不做 Excel-style filter menu。

7. Column resizing
   - 拖曳 header 邊緣調整欄寬。
   - 遵守 `minWidth`。
   - resize 後重建 column offset cache。
   - 若 resize 的 column 位於 frozen pane，需要同步更新 frozen pane width。

8. 選取
   - 單一 cell selection。
   - 點擊 cell 進行選取。
   - 支援方向鍵導覽。
   - 可將選取 cell 捲動到可視區。
   - V1 不做 range selection 或 multi-selection。

9. 編輯
   - Double click、Enter 或 F2 開始編輯。
   - Enter 提交。
   - Escape 取消。
   - 先從文字輸入開始。
   - number 與 boolean 使用簡單 parser。
   - 提供類似 `cellEditStarting`、`cellEditEnded` 的事件。

10. 格式化
   - 支援 column-level formatter function。
   - 支援 grid-level `formatCell` callback。
   - 預設渲染必須保持輕量。

11. 資料更新 API
   - `setItemsSource(rows)`
   - `setColumns(columns)`
   - `setFrozenColumns(count)`
   - `refresh()`
   - `invalidate()`
   - `getCellData(row, col)`
   - `setCellData(row, col, value)`
   - `dispose()`

12. CSV 匯出
   - 匯出目前 view。
   - 支援只匯出可見 columns。
   - V1 不做 xlsx。

## V1 不做的功能

在 core 經過驗證之前，先避免以下功能：

- Grouping。
- Tree grid。
- Merged cells。
- Frozen rows。
- Range selection。
- Clipboard copy/paste。
- Excel-style filter menu。
- Column reorder。
- Column pinning。
- Row details。
- Custom Vue slot cells。
- Variable row height。
- Auto row height。
- Server-side data source。

## 內部架構

建議模組邊界：

```txt
src/
  core/
    FastGrid.js
    Column.js
    EventEmitter.js
  data/
    DataView.js
  layout/
    LayoutEngine.js
    RowVirtualizer.js
    ColumnVirtualizer.js
  render/
    GridRenderer.js
    HeaderRenderer.js
    BodyRenderer.js
    CellRecycler.js
  features/
    Selection.js
    Editing.js
    Sorting.js
    Filtering.js
    Resizing.js
    ExportCsv.js
  styles/
    fastgrid.css
```

建議打包相關檔案：

```txt
package.json
build/
  build.js
dist/
  fastgrid.esm.js
  fastgrid.esm.min.js
  fastgrid.js
  fastgrid.min.js
  fastgrid.css
```

打包需求：

- Source code 使用 ES6 modules 維護。
- `dist/fastgrid.esm.js` 保留 ES6 module 可讀版本。
- `dist/fastgrid.esm.min.js` 提供 ES6 module 壓縮版本。
- `dist/fastgrid.js` 提供 ES5 browser global 可讀版本。
- `dist/fastgrid.min.js` 提供 ES5 browser global 壓縮版本。
- Browser global 名稱使用 `FastGrid`。
- ES module 使用 named export：`export { FastGrid }`。
- ES5 browser global build 應避免使用 `class`、arrow function、`const`、`let`、template literal 等 ES6+ 語法。
- 若使用 build tool，必須把 library code transpile 到 ES5 browser global build。
- CSS 產物為 `dist/fastgrid.css`。
- 不要把 demo-only code 打包進 library。
- Build script 必須可重複執行。

重要設計規則：

```txt
DataView 負責轉換資料。
Virtualizers 負責計算可視範圍。
Renderers 只負責繪製目前 viewport。
Features 負責協調使用者互動。
```

不要把 sorting、filtering 或 grouping 邏輯放進 renderer。

## DOM 策略

主要 body 避免使用原生完整 table。為了 virtualization，優先使用 div-based grid layout。

建議結構：

```txt
.fg-root
  .fg-header
    .fg-header-frozen
    .fg-header-scroll
      .fg-header-canvas
  .fg-body-scroll
    .fg-size-layer
    .fg-frozen-layer
    .fg-cell-layer
```

命名慣例：

```txt
.fg-root
.fg-header
.fg-body
.fg-row
.fg-cell
```

Size layer 負責建立 scrollbar 尺寸：

```txt
width = totalColumnWidth
height = totalRowCount * rowHeight
```

Cell layer 只渲染可視 cells，並使用 transform 或 absolute positioning 定位。

若設定 `frozenColumns`，DOM 需要拆成兩個水平區域：

```txt
frozen pane: 渲染左側凍結 columns，不受 scrollLeft 影響。
scroll pane: 渲染剩餘 columns，依 scrollLeft 進行橫向 virtualization。
```

兩個 pane 必須共用同一個 vertical row range，避免縱向捲動時產生錯位。

## Vue Wrapper 筆記

Vue wrapper 應該在 pure JS core 穩定之後再加入。

預期使用方式：

```vue
<FastGrid
  :items-source="rows"
  :columns="columns"
  :allow-sorting="true"
  :allow-editing="true"
  @cell-edit-ended="handleEdit"
  @selection-changed="handleSelection"
/>
```

Wrapper 職責：

- mount 時建立 core grid。
- unmount 前 dispose core grid。
- watch props 並呼叫 core setters。
- 將 core events 轉成 Vue emits。
- 傳入大型 reactive arrays 到 core 前，先使用 `toRaw`。

V1 避免讓 Vue 負責渲染每個 cell。

## 驗收標準

V1 符合以下條件時可視為成功：

- 2000 x 20 demo 載入快速。
- 縱向捲動體感順暢。
- 橫向捲動體感順暢。
- 已渲染 cell 數受 viewport 大小限制，而不是隨 dataset size 增加。
- Sorting 與 filtering 後仍保留 virtualization。
- Editing 能正確把值寫回 source data。
- Column resizing 能正確更新 layout。
- `frozenColumns` 能固定左側指定數量 columns，且不破壞雙向 virtualization。
- 能產生 `dist/fastgrid.esm.js`，並可用 ES6 `import { FastGrid }` 引用。
- 能產生 ES5 相容的 `dist/fastgrid.min.js`，並可用 `<script src="...">` 在其他專案中引用。
- Demo 頁面使用打包後的 dist 檔案運作。
- `dispose()` 會移除 listeners，且不留下明顯的殘留行為。
