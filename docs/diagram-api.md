# fabui.Diagram API 操作手冊

`fabui.Diagram` 是 FabUI core 內建的 pure JavaScript SVG 圖表設計器。介面參考 DevExtreme Diagram Overview 的工具列、圖形工具箱、畫布與屬性區配置，但不依賴 DevExtreme、jQuery 或其他 runtime；內部操作按鈕重用 `fabui.Button`，搜尋與屬性欄位重用 `fabui.EditBox`。

工具箱的「一般」、「流程圖」與「DFD」分類標題使用 `fabui.Button`，可各自疊合或展開；切換語系及搜尋圖形時會保留目前的疊合狀態。44 種圖形預覽重用 Diagram SVG shape renderer，統一顯示為空心輪廓，不影響拖到畫布後的填色。DFD 提供 Entity、Process、Data Store 節點與 Data Flow 工具；Data Flow 會啟用帶箭頭的弧線 connector 模式。

## 建立

```html
<div id="diagram"></div>
<script>
  var diagram = new fabui.Diagram('#diagram', {
    height: 620,
    locale: 'zh-TW',
    nodes: [{
      id: 'start',
      type: 'terminator',
      text: '開始',
      x: 80,
      y: 80
    }, {
      id: 'review',
      type: 'process',
      text: '審核',
      x: 320,
      y: 80
    }],
    connectors: [{
      id: 'c1',
      from: 'start',
      to: 'review'
    }]
  });
</script>
```

同一個 host 重複建立時會回傳既有 instance。也可用 `fabui.Diagram.getControl(host)` 或 `fabui.Control.getControl(host)` 取得 instance。

## 資料格式

### Node

| 欄位 | 說明 |
| --- | --- |
| `id` | 唯一字串 id；省略時自動產生。 |
| `type` | 一般圖形：`text`、`rectangle`、`ellipse`、`cross`、`triangle`、`diamond`、`heart`、`pentagon`、`hexagon`、`octagon`、`star`、`arrowUp`、`arrowDown`、`arrowLeft`、`arrowRight`、`arrowUpDown`、`arrowLeftRight`、`roundedRectangle`、`cloud`；流程圖：`process`、`decision`、`terminator`、`predefinedProcess`、`document`、`multipleDocuments`、`manualInput`、`preparation`、`data`、`database`、`directData`、`internalStorage`、`paperTape`、`manualOperation`、`delay`、`storedData`、`sequentialData`、`merge`、`onPageReference`、`summingJunction`、`orJunction`、`display`。 |
| `text` | 圖形內文字。 |
| `x`／`y` | 頁面座標。 |
| `width`／`height` | 圖形尺寸，最小 40×30。 |
| `fill`／`stroke`／`strokeWidth` | 填色、框線色與框線寬度。 |
| `textColor` | 文字顏色。 |

### Connector

| 欄位 | 說明 |
| --- | --- |
| `id` | 唯一字串 id。 |
| `from`／`to` | 起點與終點 node id。 |
| `fromPoint`／`toPoint` | 六個連接點名稱：`top`、`rightTop`、`rightBottom`、`bottom`、`leftBottom`、`leftTop`；省略時依圖形相對位置自動選邊。 |
| `type` | `orthogonal` 或 `straight`。 |
| `text` | 連線標籤。 |
| `stroke`／`strokeWidth` | 線條色與寬度。 |
| `lineStyle` | `solid` 或 `dashed`。 |

`setData()`／`import()` 也接受 `edges` 作為 `connectors` 的相容別名。指向不存在 node 或自行連回同一 node 的 connector 會被排除。

所有 connector 端點都會依連線方向投影到圖形的實際輪廓；橢圓、菱形與其他多邊形不會停在外接矩形的空白區。

## Options

| Option | 預設 | 說明 |
| --- | --- | --- |
| `width`／`height` | `'100%'`／`620` | 元件尺寸。 |
| `nodes`／`connectors` | `[]`／`[]` | 初始資料。 |
| `paperSize`／`paperOrientation` | `'A4'`／`'landscape'` | 紙張尺寸與方向；尺寸支援 A3、A4、A5、Letter、Legal，方向支援 `portrait`／`landscape`。 |
| `pageWidth`／`pageHeight` | `1123`／`794` | SVG 頁面尺寸；未明確指定時依紙張設定換算，預設為 A4 橫向。 |
| `pageColor` | `'#ffffff'` | 頁面底色。 |
| `showGrid`／`snapToGrid` | `true`／`true` | 顯示格線與拖曳貼齊格線。 |
| `gridSize` | `20` | 格線間距。 |
| `zoomLevel` | `1` | 初始縮放比例。 |
| `minZoom`／`maxZoom` | `0.25`／`2` | 縮放範圍。 |
| `toolbox`／`toolboxSearch` | `true`／`true` | 顯示圖形工具箱與搜尋欄。 |
| `propertiesPanel` | `true` | 顯示選取項目的屬性區。 |
| `mainToolbar`／`viewToolbar` | `true`／`true` | 顯示編輯與畫面工具列。 |
| `readOnly`／`disabled` | `false`／`false` | 唯讀或停用互動。 |
| `locale` | `'en'` | `en`、`zh-TW`、`zh-CN`。 |
| `theme` | `'inherit'` | 繼承外層 `fg-theme-*`，或指定 16 組 FabUI theme。 |

## Methods

| Method | 說明 |
| --- | --- |
| `getData()`／`setData(data)` | 取得深層副本或替換完整 Diagram 資料。 |
| `getPaper()`／`setPaper(size, orientation)` | 取得或設定紙張尺寸與方向；設定後會更新畫布尺寸。 |
| `getNode(id)`／`getConnector(id)` | 取得目前資料中的項目。 |
| `addNode(node)`／`addConnector(connector)` | 新增圖形或連線。 |
| `removeSelected()` | 刪除所有選取項目；刪除 node 時一併刪除相連 connector。 |
| `selectItem(type, id)`／`clearSelection()`／`getSelection()` | 管理單一主要選取；多選時 `getSelection()` 回傳最後選取的主要 node。 |
| `getSelections()` | 取得目前所有選取項目的 `{ type, id }` 陣列。 |
| `setConnectMode(enabled, type?)` | 進入連線模式，再依序點擊起點與終點圖形；`type` 支援 `'orthogonal'`、`'straight'`、`'curved'`。 |
| `undo()`／`redo()`／`canUndo()`／`canRedo()` | 管理編輯歷程。 |
| `setZoom(value)`／`fitToContent()` | 設定縮放或符合目前內容。 |
| `setShowGrid(value)` | 顯示或隱藏格線。 |
| `toggleFullscreen()` | 切換瀏覽器全螢幕。 |
| `import(jsonOrObject)` | 匯入 JSON 字串或資料物件。 |
| `export(filename?)` | 回傳 JSON；傳入檔名時同時下載。 |
| `getSvg()`／`exportSvg(filename?)` | 取得或下載 SVG。 |
| `setLocale(locale)`／`setTheme(theme)`／`setReadOnly(value)` | 更新語系、主題與唯讀狀態。 |
| `render()` | 依目前資料重畫 SVG。 |
| `destroy()`／`dispose()` | 移除 listener、內部控件與 registry，還原原始 host。 |

## Events

建構 option 使用 `onXxx`，也可用 `diagram.on(name, listener)`／`off()` 監聽對應小寫事件。

- `onContentReady`
- `onSelectionChanged`
- `onItemClick`
- `onItemDblClick`
- `onChanged`

`onChanged` 的 event args 包含 `action`、完整 `data`，以及變更項目的 `itemType`／`item`。

## 操作與鍵盤

- 從工具箱點擊或拖曳圖形到畫布。
- 在畫布空白處雙擊會開啟使用 `fabui.Window`、`fabui.EditBox` 與 `fabui.Button` 組成的紙張設定視窗；套用後紙張設定會保存在 `getData()`／匯出 JSON 的 `page` 欄位。
- DFD 的 Entity、Process、Data Store 與其他 node 共用圖形內文字編輯；雙擊後以透明多行 `fabui.EditBox` 輸入文字。
- 在畫布空白處拖曳可框選多個圖形；按住 `Shift`、`Ctrl` 或 `Cmd` 點擊可累加或取消選取。
- 多選圖形可一起拖曳、使用方向鍵移動或刪除；主要 node 仍可使用八個方形控制點縮放。
- 每個已選圖形會顯示六個圓形連接點；從其中一點拖到另一圖形的連接點即可建立 connector，並保存 `fromPoint`／`toPoint`。
- 在 node 圖形上雙擊會於圖形內開啟透明多行 `fabui.EditBox` 並自動全選文字；`Enter` 換行，`Ctrl／Command + Enter` 或失焦提交，`Escape` 取消。
- 在 connector 線條上雙擊會於線條中點開啟 `fabui.EditBox`；按 `Enter` 或離開輸入框提交文字，按 `Escape` 取消。
- `Delete`／`Backspace`：刪除選取項目。
- `Ctrl/Cmd + Z`：復原；`Ctrl/Cmd + Shift + Z` 或 `Ctrl/Cmd + Y`：重做。
- 方向鍵：移動選取 node；按住 `Shift` 每次移動 10。
- `Escape`：離開連線模式並清除選取。

Source-mode Demo：[`demo/dev-diagram.html`](../demo/dev-diagram.html)
Build-mode Demo：[`demo/diagram.html`](../demo/diagram.html)
