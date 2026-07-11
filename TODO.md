# FabGrid TODO

## 遠端資料模式

- [x] 完成 `remote: true` 的分頁、排序與篩選基礎協定。
  - [x] 定義模擬遠端資料來源 `loader(params)` 介面。
  - [x] 支援 `{ page, rows }` 分頁請求與 `{ total, rows }` 回應。
  - [x] 定義載入中、錯誤與過期請求忽略機制。
  - [x] 定義 EasyUI `sort`、`order` 遠端排序請求格式。
  - [x] 定義遠端全域搜尋 `q` 與欄位篩選 `filterRules` 請求格式。
  - 維持 virtualization，不一次建立完整 cell matrix。

目前 `remote` 預設為 `false`。設定為 `true` 已支援 GET／POST、Promise loader、遠端分頁、排序、全域搜尋與欄位篩選。

## 待獨立發佈元件

以下元件目前保留原始碼作為後續開發基礎，但不會由 `src/fabui.js` 或 `dist/fabui.*` 公開或編譯。現階段發佈 bundle 僅包含 `fabui.FabGrid` 與其必要 editor 定義。

- [ ] TextBox
- [ ] NumberBox
- [ ] DateBox
- [ ] YymmBox
- [ ] ComboBox
- [ ] Tabs

待各元件 API、主題與 demo 穩定後，再規劃各自的 entry、CSS 與發佈方式；不得重新併入 FabGrid 核心 bundle。
