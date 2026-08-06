# FabGrid TODO

## fabLoader 後續優化

- [ ] 補充 `mountHtml()` script 錯誤契約，說明資源載入錯誤可由 `.catch()` 處理，但 script 執行階段的 runtime error 不保證進入 Loader queue 的 `.catch()`。
- [ ] 擴充 HTML 相對路徑轉換，評估支援 `srcset`、`formaction`、`object[data]` 與 inline style 的 `url()`。
- [ ] 長時間執行且載入大量不同資源時，評估文字快取容量上限、LRU 淘汰，以及已完成 Script／CSS／圖片載入紀錄的清除 API。
- [ ] 補充重複 `mountHtml()` 與更多掛載失敗路徑的測試。

## fabDom

- [ ] API 方向確認穩定後合併到 `fabui`，公開名稱固定為 `fabui.loader` 與 `fabui.dom`；整合時再決定 standalone 相容期。
