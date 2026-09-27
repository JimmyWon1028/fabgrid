# FabGrid 程式碼檢查報告

日期：2026-09-27（Asia/Taipei）

檢查版本：`main`／`b812a72`，最近提交時間 2026-09-24 09:29:46 +08:00。

初次工作範圍為檢查與報告；後續依指示只修正 F01～F05。未重建專案 `dist`。

## 優先修正進度（2026-09-27）

- [x] **F01**：封堵控制字元混淆的 JavaScript URL 及 iframe `srcdoc` 繞過，保留正常連結、圖片、影片、表格、格式與原有過濾開關。
- [x] **F02**：jQuery options callback 只執行一次，更新／移除不再留下舊 callback；保留初始化事件、取消、重新載入、option getter 與使用者自行綁定的事件。
- [x] **F03**：驗證識別改為每個 Grid 的 WeakMap；共享資料、舊 ID 與 frozen item 不再造成錯誤碰撞，且不再替資料物件加上識別欄位。
- [x] **F04**：`dispose`／`destroy` 別名都會解除語系追蹤；取消銷毀仍保留追蹤，原參數、回傳值與例外語意維持不變。
- [x] **F05**：TimeBox 未載入語系時回退英文；已載入語系及別名、runtime 更新、mask、autoUnmask 與 spinner 行為保留。
- [ ] **F06～F18**：本批未處理。
- [ ] **C01**：語系覆寫與英文回退的契約衝突，本批未變更。

修正後驗證：**847 項 Node 測試通過、9 個真實瀏覽器回歸情境通過、36 個 source Demo 初始化無未捕捉例外**。以原始版本暫存副本執行相同回歸頁，能重現 F01～F05 的問題；沒有切換或覆寫工作樹。

`npm run benchmark:grid` 通過：100 萬資料格，冷搜尋 74.20 ms、雙欄排序 20.60 ms、可視 cell 計算上限 784。瀏覽器效能檢查亦通過：initial render 119.6 ms、scroll render 104.8 ms、實際 body cell 550，DOM 重用維持有效。

永久回歸頁：[priority-fixes-source.html](/Users/jimmywon/ai/fabgrid/test/priority-fixes-source.html)。驗證使用 source；既有 `dist` 尚未包含此次修正。

以下保留初次稽核的問題描述與證據，完成狀態以上方勾選清單為準。

## 結論

目前不需要因效能而全面重寫 Grid。既有 842 項測試全數通過，100 萬資料格 benchmark 與實際瀏覽器的虛擬化檢查也通過。不過，跨元件整合、非同步回應順序、語系生命週期和邊界輸入仍有測試未涵蓋的問題。

本次確認 **18 項問題：5 項 P1、12 項 P2、1 項 P3**，另有 **1 項原始碼／測試與文件的契約衝突**。其中最需要優先處理的是 HtmlEditor 過濾缺口、jQuery callback 重複執行、跨 Grid 驗證 ID 碰撞、語系管理器保留已銷毀元件，以及 TimeBox 在指定未載入中文語系時無法建立。

優先級定義：

- **P1：優先修正。** 有安全性、資料驗證、重複副作用、持續資源保留或常用元件無法初始化的影響。
- **P2：排入下一批。** 在可重現的操作順序或特定資料條件下，結果違反既有行為／API 契約。
- **P3：低優先清理。** 已確認殘留狀態，但本次未觀察到直接功能故障。

## 檢查範圍與方法

全庫盤點涵蓋 `src/`、三個 wrapper、build scripts、Demo、測試及 API 文件。`src/` 共 167 個 JS／CSS 檔，約 87,120 行；另盤點 3 個 wrapper source、19 個 build JS 檔及 benchmark script。第三方 vendor、`node_modules` 與既有 `dist` 不列為手寫原始碼審查範圍。

| 領域 | 本次檢查重點 |
| --- | --- |
| Grid 資料流程 | binding、數字正規化、CollectionView、排序、搜尋、篩選、遠端載入、群組與 TreeGrid |
| Grid 互動 | selection、公開欄位 index、事件、編輯、驗證、拖曳、resize、popup、dispose |
| Grid 顯示與輸出 | virtualization、DOM 重用、Footer、XLSX、hidden columns |
| FabUI 共用層 | Control registry、locale、config、基本控制項、表單、Tree、視窗與面板生命週期 |
| 附加元件 | Chart／Pivot、Diagram、Gantt、Scheduler、HtmlEditor 的入口與主要資料／互動流程 |
| 整合與交付 | FabGrid Vue、FabGrid jQuery、FabUI jQuery、fabLoader／fabDom、build scope、theme／locale、Demo 初始化 |

採用全量語法／依賴檢查，加上高風險流程的逐段追蹤與定向重現；並非宣稱每一條互動分支都已有完整端到端測試。下列問題均以這次的原始碼與重現結果為依據，沒有沿用舊報告中的問題判定。

## 初次檢查驗證結果

| 檢查 | 結果 |
| --- | --- |
| `npm test` | **842 通過、0 失敗、0 skipped** |
| `node --check` | **149 個專案 JS／MJS／CJS 檔通過**；不含第三方 vendor 與產物 |
| Source import／CSS 資產引用 | **71 個 JS、96 個 CSS 檔，未發現缺少的本機引用** |
| `npm run benchmark:grid:check` | **通過**，20,000 × 50，共 100 萬資料格 |
| Source-mode 瀏覽器效能 | **通過既有門檻**，確認可視 cell 重用與虛擬化 |
| 額外定向檢查 | **20 個情境**，結果整理於下列問題及契約衝突 |
| Source-mode Demo 初始化 | **36 頁中 35 頁未觀察到未捕捉例外；EditBox 頁失敗**，詳見 F05 |
| 工作樹 | 原有未追蹤檔案保留；本次只新增本報告 |

Demo 檢查使用獨立的本機 headless Chrome，阻擋外部請求。未納入需要外部 jQuery CDN 的 `dev-jquery-grid.html` 與真實遠端服務的 `dev-grid-remote.html`；jQuery wrapper 另以本機 jQuery 和真實 Grid 重現。其餘 Demo 檢查限初始化，不代表每個按鈕及每種 theme 均完成互動驗收。另有一筆無關功能的 `/favicon.ico` 404。

效能數據來自本機獨立重跑，未使用與完整測試同時執行時的受干擾數據：

| 指標 | 結果 |
| --- | ---: |
| binding scan | 3.53 ms |
| 全域搜尋，冷快取 | 68.20 ms |
| 全域搜尋，已有快取 | 0.05 ms |
| 漸進搜尋 | 0.12 ms |
| 雙欄排序 | 17.21 ms |
| benchmark 計算的 rendered cell 上限 | 784／1,000,000 |
| 瀏覽器 initial render | 117.5 ms |
| 瀏覽器 scroll render | 102.0 ms |
| 瀏覽器實際 body cell 數 | 550 |
| 連續 scroll 最大同步 handler 時間 | 約 0.2 ms |

這些結果支持目前的效能方向，不能外推為所有裝置的保證。這次沒有修改 Grid 熱路徑。

## 已確認問題

### F01 · P1 · HtmlEditor 啟用過濾後仍保留可執行內容

位置：[htmleditor.js:1119](/Users/jimmywon/ai/fabgrid/src/htmleditor/htmleditor.js:1119)、[htmleditor-api.md:71](/Users/jimmywon/ai/fabgrid/docs/htmleditor-api.md:71)。

- **條件：** `codeviewFilter: true`、`codeviewIframeFilter: true`，離開原始碼模式時處理 HTML。
- **重現：** `href="java&#10;script:void(0)"` 通過過濾後，瀏覽器解析的 protocol 仍為 `javascript:`；具有允許的 YouTube `src` 的 iframe，也保留含 script 的 `srcdoc`。
- **原因與影響：** URL 檢查只比對連續的 `javascript:`；iframe 只驗證 `src`，沒有處理優先於 `src` 的 `srcdoc`。開啟過濾的使用者仍可能保存並呈現可執行內容。
- **建議：** 明確限定允許的 URL protocol、以瀏覽器一致的正規化方式判斷 URL，並限制 iframe 的 `srcdoc` 及其他可執行內容入口。以完整 HTML 過濾策略處理，避免只追加幾個字串黑名單。
- **驗證界線：** 已確認危險結構保留與瀏覽器 URL 解讀；測試使用無副作用內容，未執行竊取資料或外部請求。

### F02 · P1 · jQuery wrapper 的 options callback 會執行兩次，更新後舊 callback 仍存在

位置：[fabgrid-jquery.js:148](/Users/jimmywon/ai/fabgrid/packages/fabgrid-jquery/src/fabgrid-jquery.js:148)、[fabgrid-jquery.js:208](/Users/jimmywon/ai/fabgrid/packages/fabgrid-jquery/src/fabgrid-jquery.js:208)、[fabgrid.js:989](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid.js:989)。

- **重現：** 初始化傳入 `selectionChanged`，執行一次 `grid.select()`，同一 callback 被呼叫兩次。第一次收到 Grid sender，第二次收到 jQuery Event。更新為新 callback 後，下一次選取仍先呼叫舊 callback，再呼叫新 callback。
- **原因與影響：** wrapper 將原 options 直接傳給 Core，Core 已綁一次；wrapper 的轉送流程再執行一次。可能重複發出應用程式請求，且依文件呼叫 `event.preventDefault()` 時，第一次參數不是 jQuery Event。
- **建議：** 讓 wrapper callback 只有一個受管理的註冊來源；建立 Core 時分離這些 callback，並保留初始化事件所需的時序。補上更新、移除、取消事件及 callback 參數的真實 Core 整合測試。

### F03 · P1 · 不同 Grid 的資料合併後，驗證 ID 會碰撞

位置：[fabgrid-editor-runtime.js:2276](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-editor-runtime.js:2276)。

- **重現：** 兩個 Grid 各自使用一筆不同的資料，兩筆都被標成 `__fgValidationId: 'r1'`；將兩筆放進同一 Grid，分別驗證失敗，`invalidItems` 卻只有 **1 筆**，應為 2 筆。
- **原因與影響：** ID 由每個 Grid 的區域序號產生，卻寫在共享資料物件上；後續 Grid 直接信任既有 ID。跨 Grid 移動、重用或合併資料時，不同列的錯誤會互相覆蓋或清除。
- **建議：** 使用 Grid 自己的物件身分索引，例如 `WeakMap`，或真正不碰撞的識別方式；測試共享 item、不同來源合併及跨 Grid row drag。

### F04 · P1 · Locale manager 保留已 dispose 的元件，且誤移除取消銷毀的元件

位置：[locale.js:71](/Users/jimmywon/ai/fabgrid/src/core/locale.js:71)。

- **重現一：** 建立 Calendar 後呼叫 `dispose()`，再切換全域語言，已 dispose 的 Calendar 仍被呼叫 `setLocale()`。
- **重現二：** Panel 的 `onBeforeDestroy` 回傳 `false`，Panel 仍存活，但後續全域切換語言已不再通知它。
- **原因與影響：** 當原本 `dispose === destroy` 時，管理器只包裝 `destroy`，留下舊 `dispose` 別名；強參照 `Set` 因此持續保留元件及其引用。另一分支則不檢查銷毀是否取消，就直接 unregister。
- **建議：** 讓兩個入口都正確解除追蹤，且只在實際銷毀後解除；以真實 Calendar／Panel 測試別名與可取消生命週期。單純只具有 `dispose()` 的假元件測試不足以涵蓋此問題。

### F05 · P1 · TimeBox 指定未載入中文語系時直接拋出例外

位置：[time-editbox.js:46](/Users/jimmywon/ai/fabgrid/src/editbox/time-editbox.js:46)、[time-editbox.js:93](/Users/jimmywon/ai/fabgrid/src/editbox/time-editbox.js:93)、[editbox-demo.js:114](/Users/jimmywon/ai/fabgrid/demo/js/editbox-demo.js:114)。

- **重現：** 只載入 Core，建立 `new fabui.EditBox(input, { editor: 'time', locale: 'zh-TW' })`，出現 `Cannot read properties of undefined (reading 'increaseValueText')`。`zh-CN` 與 `zh_Hant_TW` 也相同。
- **影響：** 元件無法初始化。目前 `demo/dev-editbox.html` 就符合條件，後面的控制項與 Demo 初始化流程也因例外中止。
- **原因：** 語系正規化無條件回傳中文代碼，constructor 隨後直接讀取尚不存在的 locale pack，沒有回退英文。
- **建議：** constructor 與 `setLocale()` 使用一致的已載入檢查及英文回退；需要中文的 Demo 再明確載入語言包，但不能只改 Demo 來掩蓋 Core 問題。

### F06 · P2 · 較舊的 `validateRow()` 非同步結果覆蓋新結果

位置：[fabgrid-editor-runtime.js:2097](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-editor-runtime.js:2097)。

- **重現：** 舊值開始驗證，改成新值後再驗證；新驗證先通過，舊驗證稍後失敗。最後資料仍是新值，`invalidItems` 卻重新出現舊值的錯誤。
- **原因與影響：** `Promise.all()` 完成後直接寫入驗證狀態，缺少同一 item／column 的驗證世代及值是否仍有效的檢查，可能顯示過期錯誤或清除較新的錯誤。
- **建議：** 將 `validateRow()` 納入與 cell 非同步驗證一致的有效性管理；同時檢查 dispose、資料更換及驗證值變更。

### F07 · P2 · Form 的舊遠端回應會覆寫目前表單

位置：[form.js:1066](/Users/jimmywon/ai/fabgrid/src/form/form.js:1066)。

- **重現：** 依序 `load('/old-record')`、`load('/new-record')`，讓新請求先完成、舊請求後完成；表單最後顯示 `old`。
- **原因與影響：** `_loadRemote()` 沒有區分最新 load，任何成功回應都呼叫 `_applyData()`。快速切換記錄時可能把舊資料放到目前表單。
- **建議：** 為 load 加上請求世代；過期回應不套用資料或成功事件。取消能力與 submit 請求分開管理。
- **驗證方式：** 真實 Form 配合可控制回應順序的 XMLHttpRequest 替身，未連線正式後端。

### F08 · P2 · Tree 同時載入不同節點會讓前一節點卡在 loading

位置：[tree.js:1049](/Users/jimmywon/ai/fabgrid/src/tree/tree.js:1049)。

- **重現：** 同時載入 A、B 兩個節點，兩個 loader 都成功回呼；B 有資料，A 仍為 `_loading: true`、沒有子節點，A 的 Promise 也未完成。
- **原因與影響：** 所有節點共用 `_loadSequence`，載入 B 使 A 的回應失效；失效分支直接 return，沒有清理或完成 Promise。
- **建議：** 不同節點各自追蹤請求，root reload 另外管理；所有取消、取代及銷毀路徑都必須結束 Promise 並清理 loading。

### F09 · P2 · Source-mode 載入出兩套 Control registry

位置：[fabui.js:20](/Users/jimmywon/ai/fabgrid/src/fabui.js:20)、[fabgrid.js:35](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid.js:35)。

- **重現：** 從公開 `src/fabui.js` 建立 Grid，`fabui.Control.getControl(grid.host) === grid` 為 `false`；`grid instanceof fabui.Control` 也為 `false`。
- **原因與影響：** 兩處匯入同一 `control.js` 卻使用不同 `?v=`；瀏覽器將其視為不同 ES module，分別建立類別與 registry，違反公開 Control 查找契約。
- **建議：** 統一有狀態共用模組的 import URL，並驗證公開入口的類別身分、registry 與插件整合。
- **範圍：** 已確認 source-mode；這次沒有重建 bundle，不據此宣稱所有 dist 版本也失敗。

### F10 · P2 · XLSX 遇到 XML 禁用控制字元時產生無效工作表

位置：[fabgrid-export.js:118](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-export.js:118)、[fabgrid-export.js:204](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-export.js:204)。

- **重現：** 匯出字串 `one\u0001two`，產生的 worksheet XML 經 DOMParser 解析，回報 `Invalid character U+0001`。
- **原因與影響：** `xmlEscape()` 只有 XML 特殊符號跳脫，沒有處理 XML 禁用控制字元；外部匯入資料若含此類內容，XLSX 可能被試算表軟體拒絕或要求修復。
- **建議：** 使用符合 SpreadsheetML 的文字編碼策略，並涵蓋原始 `_xNNNN_` 字串、tab、換行及 Unicode 邊界。
- **驗證界線：** 已證實 XML 無效；未以桌面 Excel 驗證實際修復提示。

### F11 · P2 · Nested binding 寫入失敗，API 仍回報成功

位置：[fabgrid-selection.js:2922](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-selection.js:2922)、[fabgrid-data.js:62](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-data.js:62)、[fabgrid-editor-runtime.js:1871](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-editor-runtime.js:1871)。

- **重現：** item 為 `{ a: 1 }`，column binding 為 `a.b`；`setCellData(0, 0, 'x')` 回傳 `true`，資料卻仍是 `{ a: 1 }`。
- **原因與影響：** `setByBinding()` 已回傳 `false`，呼叫端未處理。編輯提交也忽略相同回傳值，原始碼顯示仍會發出 `cellEditEnded` 並結束 editor。
- **建議：** 讓失敗向上傳遞，避免回報／觸發成功；不要擅自把原本 scalar 資料覆寫成物件。API 路徑已重現，editor 分支目前是同根因的靜態確認。

### F12 · P2 · Wrapper 事件清單未跟上正式 Core 事件

位置：[fabgrid-vue.js:1](/Users/jimmywon/ai/fabgrid/packages/fabgrid-vue/src/fabgrid-vue.js:1)、[fabgrid-jquery.js:3](/Users/jimmywon/ai/fabgrid/packages/fabgrid-jquery/src/fabgrid-jquery.js:3)。

- **重現／證據：** 真實 Grid 綁定 Vue wrapper 的事件轉送方法後，改變列只轉送 `selection-changed` 等事件，沒有 `selected-row-changed`。jQuery 清單同樣沒有 `selectedRowChanged`，且仍列出若干 Core 未實作的相容事件。
- **影響：** 透過 wrapper 的事件介面無法取得新公開事件。jQuery 文件宣稱「所有公開 FabGrid events」皆會轉送，與目前清單不一致。
- **建議：** 由正式事件 metadata 導出 wrapper 清單，或建立清單對照驗證；Vue 若維持刻意的子集合，應明確寫出支援範圍。
- **驗證界線：** Vue 使用 wrapper method 加真實 Grid，沒有掛載完整 Vue 2 應用程式。

### F13 · P2 · `resizingColumn` 修改 `e.width` 沒有套用

位置：[fabgrid-selection.js:2856](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-selection.js:2856)。

- **重現：** 欄寬 100，pointer 移動 50；handler 將 `e.width` 設為 200，最後欄寬仍是 150。
- **原因與影響：** 事件收到暫時建立的 args，後續仍使用原本區域變數 `width`；應用程式無法依既有可修改 event args 契約調整拖曳寬度。
- **建議：** 派送後使用事件 args 中的 width，套用有限值／最小寬度檢查，保留取消及 layout rollback 行為。

### F14 · P2 · Column drag 收到 `pointercancel` 仍會重排欄位

位置：[fabgrid-selection.js:850](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-selection.js:850)、[fabgrid-selection.js:895](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-selection.js:895)。

- **重現：** 建立有效拖曳狀態，把 B 指向 A 前方；以 `pointercancel` 結束，欄位仍由 `[a, b]` 變成 `[b, a]`。
- **原因與影響：** `pointercancel` 與 `pointerup` 共用完成流程，未區分取消。瀏覽器中斷 pointer 操作時，未完成的動作仍可能提交。
- **建議：** 拆開完成與取消語意；取消只收回預覽、capture 與 listeners，不重排或觸發完成事件。
- **驗證方式：** 真實 Grid 加上受控的拖曳狀態，直接呼叫結束流程；未使用實體觸控裝置。

### F15 · P2 · PivotChart 有隱藏欄位時捲向錯誤欄位

位置：[pivot-chart.js:450](/Users/jimmywon/ai/fabgrid/src/pivot/pivot-chart.js:450)。

- **重現：** 完整欄位 index 0 隱藏，選中資料欄應為 index 2；流程呼叫 `select(0, 2)`，接著卻呼叫 `scrollIntoView(0, 1)`。
- **原因與影響：** select 已換算完整欄位 index，scroll 仍使用可視 index；選取位置與捲動目標不一致。
- **建議：** 兩個公開 API 都使用換算後的 `columnIndex`。本次以實際 PivotChart method 配合記錄 API 呼叫的 Grid 替身確認座標。

### F16 · P2 · 遠端有效 filter rules 存在時，`getFilterState().active` 仍可能為 false

位置：[fabgrid-data.js:1245](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-data.js:1245)。

- **重現：** 遠端模式傳入 backend-only 欄位規則 `tenantCode = ACME`；`getFilterState().filterRules` 含該有效條件，`active` 卻是 `false`。
- **原因與影響：** active 只看 predicate、searchText、Search Row 和 Excel UI 狀態，沒有納入實際輸出的有效 rules，讓應用程式誤判目前沒有篩選。
- **建議：** 以有效篩選快照計算 active，並維持停用 filter mode 時的既有規則。此次驗證使用配置狀態，沒有送出後端請求。

### F17 · P2 · `unselectRow(-1)` 會誤取消第 0 列

位置：[fabgrid-selection.js:2301](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-selection.js:2301)、[fabgrid-selection.js:2324](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-selection.js:2324)。

- **重現：** 選取第 0 列，呼叫 `unselectRow(-1)`，回傳 `true` 並清除該列選取。
- **原因與影響：** 指定 index 被 clamp 到有效範圍；常見的 `findIndex()` 未找到結果 `-1` 會誤操作首列。超出上界也有同類的尾列風險。
- **建議：** 省略參數維持目前 selected row 語意；明確傳入的參數先驗證整數與範圍，不將無效目標轉成其他列。

### F18 · P3 · Resize 中 dispose 留下頁面層狀態

位置：[fabgrid.js:2178](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid.js:2178)、[fabgrid-selection.js:2852](/Users/jimmywon/ai/fabgrid/src/grid/fabgrid-selection.js:2852)。

- **重現：** 開始欄寬 resize 後立即 `dispose()`，`document.body` 仍有 `fg-resizing-active`。
- **原因：** dispose 解除 pointer listeners，卻沒有走完 resize 狀態清理。
- **建議：** 在 dispose 使用不提交操作的清理流程，解除互動狀態與 class。
- **優先度限制：** 目前 source CSS 未找到使用這個 class 的規則，本次沒有證實它造成當下畫面故障，因此列為 P3，不放大為高風險問題。

## C01 · 契約衝突：英文回退與語言包覆寫英文預設

位置：[fabui-locale.zh-TW.js:37](/Users/jimmywon/ai/fabgrid/src/locales/fabui-locale.zh-TW.js:37)、[i18n-theme-audit.test.js:115](/Users/jimmywon/ai/fabgrid/test/i18n-theme-audit.test.js:115)、[fabgrid-api.md:54](/Users/jimmywon/ai/fabgrid/docs/fabgrid-api.md:54)。

**目前程式及測試：** 載入中文 pack 後，除了註冊中文語系，也將中文直接寫入各元件的 `locales.en`。測試明確要求 `Loading a locale pack overwrites loaded component English defaults`。

**文件及專案規則：** 指定未載入的語言應回退英文。

**實際重現：** 載入 zh-TW pack 後，呼叫 `fabui.setLocale('fr')`，`getLocale()` 是 `en`，新 Calendar 的 DOM `aria-label` 卻是「日曆」，而非原本的 `Calendar`。

這是已確認的行為矛盾，但與現有測試刻意保留的行為有關，不能當成只需修一行的普通錯誤。修正前需要確認：英文 baseline 是否永久保留，還是 API 文件要改成「回退目前預設文字」。依目前專案規則，較一致的方向是保留真正的英文 baseline，並同步調整對應測試；本次沒有變更任一契約。

## 建議修正順序

1. **先處理 P1：** F01 安全性過濾；F02、F03 事件與驗證正確性；F04 生命週期；F05 TimeBox 初始化。每項分開修正及驗證，避免把數個互不相關的行為混在同一批改動。
2. **接著處理非同步與資料結果：** F06、F07、F08、F10、F11；優先補上舊回應較晚完成、共享 item、異常資料等測試。
3. **再處理公開契約與互動：** F09、F12 至 F17；F18 可隨生命週期清理處理。C01 先確認契約再修改。

不建議這一輪先做大規模拆檔或全面重構。最有價值的結構改善是統一正式事件 metadata、共用有狀態模組的 import URL，以及一致的非同步有效性／dispose 管理；這些都應在對應問題修正時小範圍進行。

## 測試需要補強的地方

- **真實 Core 與 wrapper 整合：** 現有替身未反映 Core 已自動綁定 option callback 的行為，因而漏掉 F02。
- **非同步亂序：** 覆蓋同一欄連續驗證、切換 Form 記錄、不同 Tree 節點並行載入，以及取消／dispose。
- **真實生命週期：** 使用具有 `dispose = destroy` 別名及可取消 destroy 的元件，而非只有單一方法的 Probe。
- **瀏覽器 ES module 整合：** Node 或抽取函式測試無法充分涵蓋不同 query URL 所產生的獨立 registry。
- **語系矩陣：** 未載入 pack、只載入中文 pack、再切換到英文或未載入語系；包括實際建立 TimeBox。
- **格式與輸入邊界：** XML 禁用字元、無法寫入的 nested path、無效 row index，以及 HtmlEditor 的 URL／iframe 輸入。

部分既有測試採用原始碼字串斷言，適合守住結構規則，但不足以證明真實物件的執行時序與瀏覽器行為。此次 842 項全綠與上列問題同時存在，正反映這些缺口。

## 驗證界線與交付狀態

本次沒有重建或驗證新產生的正式 bundles；未操作正式後端、未在 Safari／Firefox／Windows 瀏覽器重跑，也未在桌面 Excel 開啟匯出檔。安全性檢查限此次讀到的程式與定向輸入，不等同完整滲透測試或第三方依賴漏洞稽核。

完整測試、benchmark、瀏覽器結果與暫存重現程式留在本機 `/tmp`，可供本次修正接續使用；它們不是已加入專案的永久測試：

- [既有測試結果](/tmp/fabgrid-audit-20260927-tests.log)
- [獨立 benchmark 結果](/tmp/fabgrid-audit-20260927-benchmark-isolated.log)
- [瀏覽器效能結果](/tmp/fabgrid-audit-20260927-browser-performance.log)
- [20 個定向情境結果](/tmp/fabgrid-audit-20260927-browser-cases.log)
- [36 頁 Demo 初始化結果](/tmp/fabgrid-audit-20260927-demo-sweep.log)
- [暫存重現頁](/tmp/fabgrid-audit-cases.html)
- [暫存本機測試啟動程式](/tmp/fabgrid-audit-browser-cases.cjs)

初次交付只有這份報告；後續 F01～F05 的程式修正與回歸檢查已完成。其他問題與 build 尚未執行。

修正後的暫存驗證紀錄：

- [847 項 Node 測試](/tmp/fabgrid-priority-tests-20260927.log)
- [9 個瀏覽器回歸情境](/tmp/fabgrid-priority-browser-20260927.log)
- [原始版本的回歸對照](/tmp/fabgrid-priority-baseline-browser-20260927.log)
- [36 頁 Demo 初始化](/tmp/fabgrid-priority-demo-sweep-20260927.log)
- [Grid benchmark](/tmp/fabgrid-priority-benchmark-20260927.log)
- [瀏覽器效能](/tmp/fabgrid-priority-browser-performance-20260927.log)
