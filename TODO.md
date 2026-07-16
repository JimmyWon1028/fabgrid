# FabGrid TODO

## FabUI PivotGrid

- [x] 由 `fabui.pivot` 公開 `PivotEngine`、`PivotField`、`PivotPanel`、`PivotGrid`、`PivotAggregate` 與 `PivotShowTotals`。
- [x] PivotPanel Fields／Filters／Rows／Columns／Values、拖放、排序、單值 filter、aggregate 與 viewDefinition 儲存還原。
- [x] 本機 Array row／column／value／filter fields 與 Sum、Count、Average、Min、Max。
- [x] 多層欄標頭、固定 row fields、小計／總計、前後位置、列／欄展開收合。
- [x] Dimension 排序、Pivot 右鍵選單、雙擊原始明細與 viewDefinition。
- [x] 沿用 FabGrid virtualization、selection、clipboard、export、locale 與 theme variables。
- [x] `demo/dev-pivot.html` source-mode 與 `demo/pivot.html` build-mode Demo。
- [ ] 非同步分批彙總與取消中的工作。
- [ ] PivotPanel 進階多值 filter dialog、deferredUpdate、touch drag、Slicer、PivotChart、calculated fields、weighted aggregate 與 ShowAs。
- [ ] Server-side Pivot／SSAS 與 Vue 2／jQuery Pivot wrapper。

## 遠端資料模式

- [x] 完成 `remote: true` 的分頁、排序與篩選基礎協定。
  - [x] 定義模擬遠端資料來源 `loader(params)` 介面。
  - [x] 支援 `{ page, rows }` 分頁請求與 `{ total, rows }` 回應。
  - [x] 定義載入中、錯誤與過期請求忽略機制。
  - [x] 定義 EasyUI `sort`、`order` 遠端排序請求格式。
  - [x] 定義遠端全域搜尋 `q` 與欄位篩選 `filterRules` 請求格式。
  - 維持 virtualization，不一次建立完整 cell matrix。

目前 `remote` 預設為 `false`。設定為 `true` 已支援 GET／POST、Promise loader、遠端分頁、排序、全域搜尋與欄位篩選。

## FabGrid 模組拆分

拆分原則：FabGrid 專用程式統一放在 `src/grid/`，以完整責任領域整併，不再建立過多小型 feature 檔案；公開 API 與既有行為必須保持相容。

已完成：

- [x] `src/grid/fabgrid-export.js`
  - CSV、Excel 公開 API 與下載流程。
  - XLSX package、workbook、worksheet、relationships 與 document properties。
  - group／footer row、frozen pane、column width 與 computed CSS style resolver。
  - style registry、font、fill、border、number format 與 cell XML。
  - ZIP、UTF-8 byte 與 CRC32 writer。
- [x] `src/grid/fabgrid-data.js`
  - binding、typed comparison、pagination、remote request／response。
  - itemsSource、observed source、remote load/reload 與 pager options。
  - filter、global／column search、sorting 與 `applyView()`。
  - grouping prototype 流程、group state、group row 與 aggregate 協調。
- [x] `src/grid/fabgrid-tree.js`
  - `childItemsPath` 階層資料讀取、可視樹列扁平化與循環資料保護。
  - 節點收合狀態、同層排序、篩選祖先路徑、階層鍵盤導覽與 TreeGrid API。
- [x] `src/grid/fabgrid-editor.js` 基礎 helper
  - mask、caret、copy 與 validation result helper。
- [x] Grid 專用版面樣式移至 `src/grid/fabgrid.css`。
- [x] 共用 icon 樣式更名為 `src/fabui.icon.css`，保留在 `src/`。

尚未完成：

- [ ] 完成 `src/grid/fabgrid-editor.js`
  - 移入 editor lifecycle、textbox／numberbox、datebox／年月模式、combobox 與 color。
  - 移入同步／非同步 validation、invalid item 狀態與 popup rendering／定位。
- [ ] 完成 editor 領域後重新評估 `src/grid/fabgrid.js`；renderer、selection、dragging、resizing 與 virtualization 暫不拆分，除非能維持清楚邊界且不增加循環依賴。
- [ ] 每批拆分後執行 `npm test`、JavaScript 語法檢查與 `/tmp` 隔離副本 smoke；未明確要求 build 時不得改寫工作區 `dist`。

## FabUI Chart

- [x] 主 bundle 公開 `fabui.Chart`。
- [x] 支援直條圖、橫條圖、折線圖與圓餅圖。
- [x] SVG rendering、tooltip、legend、ResizeObserver、資料更新與 dispose。
- [x] 英文、繁中、簡中基本文字。
- [x] 四種圖表 Demo、API 文件、單元測試與 browser smoke。

## 待獨立發佈元件

以下表單元件目前保留原始碼作為後續開發基礎，但不會由 `src/fabui.js` 或 `dist/fabui.*` 公開或編譯。現階段主 bundle 包含 `fabui.FabGrid`、`fabui.Chart` 與必要定義。

- [ ] TextBox
- [ ] NumberBox
- [ ] DateBox
- [ ] ComboBox
- [ ] Tabs

待各元件 API、主題與 demo 穩定後，再規劃各自的 entry、CSS 與發佈方式；不得重新併入 FabGrid 核心 bundle。
