# FabUI PivotGrid API

`fabui.pivot.PivotGrid` 是以 FabGrid virtualization 與樣式系統為基礎的唯讀樞紐分析 Grid。原始資料先交由 `fabui.pivot.PivotEngine` 分組彙總，再由 PivotGrid 顯示多層欄標頭、列欄位、小計、總計與明細資料。

## 建立 PivotEngine

```js
var engine = new fabui.pivot.PivotEngine({
  itemsSource: rows,
  fields: [
    { key: 'region', binding: 'region', header: '區域' },
    { key: 'platform', binding: 'platform', header: '平台' },
    { key: 'sales', binding: 'sales', header: '銷售額', dataType: 'number', aggregate: 'Sum', format: 'n0' }
  ],
  rowFields: ['region'],
  columnFields: ['platform'],
  valueFields: ['sales'],
  showRowTotals: 'Subtotals',
  showColumnTotals: 'GrandTotals'
});
```

欄位 reference 可以使用 `key`、`header`、`binding` 或 `PivotField` instance。若同一 binding 需要不同用途，應指定不同且穩定的 `key`。

### PivotEngine options

| Option | 說明 |
|---|---|
| `itemsSource` | 原始資料 Array。 |
| `fields` | `PivotField` 定義。未提供時可由第一筆資料自動產生。 |
| `autoGenerateFields` | 是否自動產生欄位，預設 `true`。 |
| `rowFields` | 依序建立左側列階層。 |
| `columnFields` | 依序建立上方欄階層。 |
| `valueFields` | 要彙總的 measure 欄位。 |
| `filterFields` | 保存供篩選使用的欄位清單。實際條件設於 `PivotField.filter`。 |
| `showRowTotals` | `None`、`GrandTotals`、`Subtotals`。 |
| `showColumnTotals` | `None`、`GrandTotals`、`Subtotals`。 |
| `totalsBeforeData` | `true` 時將小計／總計放在資料前。 |
| `showZeros` | 沒有 aggregate value 時是否顯示 `0`。 |

### PivotField

| Property | 說明 |
|---|---|
| `key` | 欄位穩定識別值。 |
| `binding` | 原始資料 property path。 |
| `header` | 顯示名稱。 |
| `dataType` | `string`、`number`、`date`、`boolean`。 |
| `aggregate` | `Sum`、`Count`、`Average`、`Min`、`Max`。 |
| `format` | `n0`、`n2`、`p0`、`c2` 等顯示格式。 |
| `descending` | Dimension 是否使用降冪排序。 |
| `filter` | Function、允許值 Array，或 `{ values, predicate }`。 |
| `groupBy` | `Year`、`Quarter`、`Month`、`Day` 或 Function。 |
| `getValue` | 自訂原始值 getter。 |
| `width`、`align` | PivotGrid 欄寬與對齊。 |

### Aggregate 列舉

```js
fabui.pivot.PivotAggregate.Sum
fabui.pivot.PivotAggregate.Count
fabui.pivot.PivotAggregate.Average
fabui.pivot.PivotAggregate.Min
fabui.pivot.PivotAggregate.Max
```

### Totals 列舉

```js
fabui.pivot.PivotShowTotals.None
fabui.pivot.PivotShowTotals.GrandTotals
fabui.pivot.PivotShowTotals.Subtotals
```

### PivotEngine properties

- `itemsSource`
- `fields`
- `rowFields`
- `columnFields`
- `valueFields`
- `filterFields`
- `pivotView`
- `viewDefinition`
- `isUpdating`

`viewDefinition` 是可序列化的 plain object，可用 `JSON.stringify()` 保存，再指定回另一個 PivotEngine。

若 `PivotField.filter` 使用單一允許值，該條件也會包含在 `viewDefinition.fields` 內；Function predicate 不會序列化。

### PivotEngine methods

- `setItemsSource(rows)`
- `setFields(definitions)`
- `setViewFields(name, references)`
- `getField(reference)`
- `removeField(reference)`
- `beginUpdate()`
- `endUpdate()`
- `deferUpdate(callback)`
- `refresh()`
- `getDetail(row, column)`
- `getKeys(row, column)`
- `dispose()`

### PivotEngine events

- `itemsSourceChanged`
- `viewDefinitionChanged`
- `updatingView`
- `progress`
- `updatedView`
- `error`

事件支援兩種形式：

```js
engine.updatedView.addHandler(function(sender, args) {});
engine.on('updatedView', function(args) {});
```

## 建立 PivotPanel

```js
var panel = new fabui.pivot.PivotPanel('#pivotPanel', {
  itemsSource: engine,
  locale: 'zh-TW'
});
```

PivotPanel 與 PivotGrid 綁定同一個 PivotEngine。使用者可以勾選欄位，或將欄位拖曳到 Filters、Rows、Columns、Values 區域；每次變更都會立即重建 Pivot view。四個區域的排列全部使用滑鼠拖曳，拖曳時會以橫線標示實際插入位置，不顯示上下移動按鈕。

主要互動：

- 勾選一般欄位加入 Rows；勾選 number 欄位加入 Values。
- 拖放欄位可在四個區域之間移動並重新排序。
- Rows、Columns、Values 直接拖曳排序並顯示插入橫線；`×` 從目前區域移除。
- Filters 區只顯示欄位名稱、拖曳排序與移除，不在 PivotPanel 內選值。
- Filters 區的欄位會依順序顯示在 PivotGrid 左上角、row field 標頭上方；單一值或全部的內容選擇只在 PivotGrid 進行。
- Values 只顯示完整欄位名稱；在數值欄位上按滑鼠右鍵，可切換 Sum、Count、Average、Min、Max。

PivotPanel 公開 `itemsSource`／`engine`、`fields`、`filterFields`、`rowFields`、`columnFields`、`valueFields`、`isViewDefined` 與 `viewDefinition`。主要方法為 `setItemsSource()`、`setLocale()`、`moveField()`、`removeField()`、`setAggregate()`、`showAggregateMenu()`、`hideAggregateMenu()`、`isAggregateMenuOpen()`、`refresh()` 與 `dispose()`。

PivotPanel 的 `viewDefinition` 使用 JSON 字串，方便直接保存到 `localStorage`：

```js
localStorage.pivotView = panel.viewDefinition;
panel.viewDefinition = localStorage.pivotView;
```

## 建立 PivotGrid

```js
var pivot = new fabui.pivot.PivotGrid('#pivotGrid', {
  itemsSource: engine,
  locale: 'zh-TW',
  collapsibleSubtotals: true,
  showDetailOnDoubleClick: true,
  customContextMenu: true,
  selectionMode: 'CellRange'
});
```

`PivotGrid.itemsSource` 必須是 `fabui.pivot.PivotEngine` instance。`engine` property 會回傳目前連接的 PivotEngine。

### PivotGrid 專用 options

| Option | 預設 | 說明 |
|---|---:|---|
| `pivotHeaderHeight` | `headerHeight` | 每一層 Pivot header 高度。 |
| `collapsibleSubtotals` | `true` | 顯示列／欄小計展開按鈕。 |
| `showRowFieldHeaders` | `true` | 顯示左側 row field 標頭。 |
| `showDetailOnDoubleClick` | `true` | 雙擊 aggregate cell 顯示原始明細。 |
| `customContextMenu` | `true` | 啟用 Pivot 專用右鍵選單。 |

PivotGrid 固定為唯讀，並停用一般 FabGrid 的編輯、欄位 Search Row、Excel-like filter、pagination、row drag 與 column drag。原始資料篩選必須由 PivotField filter 在 aggregate 前處理。

### PivotGrid methods

- `setPivotEngine(engine)`
- `expandAll()`
- `collapseAll()`
- `toggleRowSubtotal(key)`
- `toggleColumnSubtotal(key)`
- `togglePivotFieldSort(field)`
- `getCellKeys(row, col)`
- `showDetail(row, col)`
- `hideDetail()`
- `isDetailOpen()`
- `dispose()`

FabGrid 的選取、CellRange、clipboard、CSV／Excel 匯出、`formatItem`、`hitTest()`、`refresh()`、`invalidate()` 與 `Control.getControl()` 仍可使用。

## 互動行為

- 點擊左側 row field header：切換升冪／降冪。
- PivotPanel Filters 欄位的內容選擇器會同步顯示在 PivotGrid 左上角；選擇全部或單一值後，在 aggregate 前篩選原始資料。
- 相鄰列若具有相同的父層 row field 值，PivotGrid 會將該父層顯示為一個跨越明細與小計列的疊合 cell，不重複列出相同文字。
- 點擊疊合父層 cell 旁的 `＋`／`−`：展開或收合後代；收合時只保留該群組的小計列，展開時恢復明細列。
- 雙擊 aggregate cell：使用同一份 FabGrid style 開啟原始明細 Grid。
- Header 或 aggregate cell 右鍵：排序、aggregate、移除欄位、明細與匯出。
- `Escape`：關閉明細或已開啟的 Grid popup，不提交其他變更。

## 樣式與 Theme

PivotGrid 與 PivotPanel root 都具有 `.fg-root`，直接沿用 FabGrid 的：

- `--fg-border`
- `--fg-border-strong`
- `--fg-header-bg`
- `--fg-header-text`
- `--fg-cell-bg`
- `--fg-cell-text`
- `--fg-selected-bg`
- `--fg-selected-border`
- scrollbar、frozen divider、hover 與 active cell 規則

套用 `.fg-theme-default`、`.fg-theme-metro-blue`、`.fg-theme-material` 等現有 FabGrid theme class 即可，不需要 Pivot 專用 theme 檔。

## Demo

- `demo/dev-pivot.html`：source-mode 開發版，引用 `src/fabui.js` 與 `src/fabui.css`。
- `demo/pivot.html`：build-mode 正式版，只引用 `dist/fabui.min.js` 與 `dist/fabui.css`。

## 第一版限制

- 僅處理本機 Array，不支援 server-side OLAP／SSAS。
- 尚未提供 Slicer、PivotChart、calculated fields、weighted aggregate、ShowAs 計算與進階多值 filter dialog。
- 彙總目前為同步處理；Grid DOM rendering 仍使用 FabGrid 雙向 virtualization。
- Vue 2 與 jQuery wrapper 尚未加入 PivotGrid 專用 component／plugin API。
