# FabGrid jQuery Wrapper API

`fabgrid-jquery` 是 `fabui.FabGrid` 的薄型 jQuery adapter。它只負責 instance、方法、option、事件與生命週期轉接，不參與 cell rendering 或 virtualization。

## 載入與初始化

Browser global build 依序載入 jQuery、FabUI 與 wrapper：

```html
<link rel="stylesheet" href="./fabui.css">
<div id="grid"></div>
<script src="./jquery.min.js"></script>
<script src="./fabui.min.js"></script>
<script src="./dist/wrapper/fabgrid-jquery.min.js"></script>
<script>
  $('#grid').fabgrid({
    itemsSource: rows,
    columns: columns,
    frozenColumns: 1
  });
</script>
```

ES module 可自行注入 jQuery 與 FabUI：

```js
import $ from 'jquery';
import fabui from './fabui.esm.js';
import { createFabGridJQuery } from './fabgrid-jquery.esm.js';

createFabGridJQuery($, fabui);
```

## Instance 與方法

```js
var grid = $('#grid').fabgrid('instance');

$('#grid').fabgrid('refresh');
$('#grid').fabgrid('select', 10, 2);
$('#grid').fabgrid('setItemsSource', nextRows);
$('#grid').fabgrid('exportExcel', 'report.xlsx');
```

初始化、無回傳值的方法、option setter 與 `destroy` 回傳原 jQuery collection。具有回傳值的 core 方法會回傳方法結果。以多元素 collection 呼叫具有回傳值的方法時，回傳最後一個 element 的結果。

名稱以 `_` 開頭的 private method 不可透過 wrapper 呼叫。未初始化便呼叫方法會拋出錯誤。

## Option

```js
var locale = $('#grid').fabgrid('option', 'locale');

$('#grid').fabgrid('option', 'locale', 'zh-TW');
$('#grid').fabgrid('option', {
  frozenColumns: 2,
  allowEditing: false
});
```

`itemsSource`、`columns`、`locale`、凍結欄與其他具有正式 setter 的設定會轉交 core setter；其他設定更新 `grid.options` 後呼叫 `invalidate()`。

再次傳入 options 不會建立第二個 instance，而是更新既有 instance。

## 事件

所有公開 FabGrid events 轉成小寫 jQuery event，namespace 固定為 `.fabgrid`：

```js
$('#grid').on('selectionchanged.fabgrid', function(event, args, grid) {
  console.log(args.row, args.col);
});
```

也可以在初始化 options 傳入與 core event 同名的 callback：

```js
$('#grid').fabgrid({
  cellEditEnding: function(event, args, grid) {
    if (!isValid(args)) return false;
  }
});
```

handler 呼叫 `event.preventDefault()`、回傳 `false`，或將 `args.cancel` 設為 `true`，都會把取消狀態傳回 core event。

Wrapper lifecycle events：

- `initialized.fabgrid`
- `destroyed.fabgrid`

## 銷毀

```js
$('#grid').fabgrid('destroy');
```

`destroy` 會解除 wrapper 對 core events 的監聽、呼叫 `FabGrid.dispose()` 並清除 element 上儲存的 instance。它不會移除使用者綁定的其他 jQuery events；同一個 element 之後可以重新初始化。
