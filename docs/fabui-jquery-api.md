# FabUI jQuery Wrapper API

`fabui-jquery` 是 FabUI pure JavaScript 元件的薄型 jQuery 相容層。它負責
EasyUI 風格的 plugin 呼叫、`easyui-*` class parser、`data-options`、
instance、公開方法與生命週期轉接；實際元件行為仍由 FabUI core 負責。

## 載入順序

```html
<script src="jquery.min.js"></script>
<script src="fabui.min.js"></script>
<script src="fabgrid-jquery.min.js"></script>
<script src="fabui-jquery.min.js"></script>
```

FabGrid 與 FabUI 各自使用獨立 Wrapper。Grid 公開入口固定為
`$.fn.fabgrid`，FabUI Wrapper 不註冊 `$.fn.datagrid` 別名。

## 支援的 plugin

- Layout、Panel、Tabs、Window／Dialog、Form。
- TextBox、NumberBox、DateBox、ComboBox、ColorBox、ValidateBox、FileBox。
- LinkButton、Menu、MenuButton、SplitButton、Tooltip、Tree、SwitchButton。

Grid 不在本 Wrapper 的支援清單內，請使用獨立的 `fabgrid-jquery` 與
`$.fn.fabgrid`。

所有 plugin 都保留 `instance`、`options`、`option`、公開方法與 `destroy`
入口。回傳 DOM element 的 getter 會轉為 jQuery collection，供舊程式繼續
使用 `.find()`、`.attr()`、`.addClass()` 等操作。

`tabs('tabs')` 與 `tabs('getTabs')` 會回傳 jQuery Panel 陣列，保留舊程式逐一
呼叫 `tab.find()` 或 `tab.panel()` 的契約。

## Parser

```js
$.parser.parse(document);
$.parser.parse(document.querySelector('#form-host'));
```

Parser 只解析既有 `easyui-*` class 與 `data-options`，不執行 `data-options`
中的 JavaScript。事件 callback 應使用程式式 options 傳入。

## Build

```bash
npm run build:fabui-jquery
```

此獨立 Build 只輸出：

- `packages/fabui-jquery/dist/fabui-jquery.js`
- `packages/fabui-jquery/dist/fabui-jquery.min.js`
- `dist/wrapper/fabui-jquery.min.js`

不會併入或重建 `dist/fabui.*`。
