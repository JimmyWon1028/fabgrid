# FabUI CollectionView API

`fabui.collections.CollectionView` 將一般 JavaScript Array 包裝成可由多個控制項共用的資料 view。FabGrid 與 Chart 的 `itemsSource` 都可接受 Array 或 CollectionView。

```js
const collections = new fabui.collections.CollectionView(rowsData);

const grid = new fabui.FabGrid('#grid', {
  itemsSource: collections
});

const chart = new fabui.chart.Chart('#chart', {
  itemsSource: collections,
  bindingX: 'month',
  series: [{ name: '營收', binding: 'revenue' }],
  selectionMode: fabui.chart.SelectionMode.Point
});
```

Grid 內建排序與篩選會更新同一個 CollectionView。Chart 監聽 `collectionChanged` 後自動依相同順序重繪，不需要另外監聽 Grid 排序或 `filterChanged` 事件。

Grid 與 Chart 也共用 `currentItem`／`currentPosition`。Grid 選取資料列或 Chart 點擊資料點時，會透過 `currentChanged` 自動同步，不提供 `selectionSource`。

`remote: true` 也可直接使用同一個 CollectionView。遠端回應的 rows 會更新該 instance 的 `sourceCollection`，Grid 不會再次套用本機 filter／sort，因此 Grid 與 Chart 會同步顯示後端回傳順序。

## 建構

```js
new fabui.collections.CollectionView(sourceCollection, options?)
```

`sourceCollection` 必須是 Array。`options` 目前支援 `filter` 與 `currentPosition`。

## 屬性

| 屬性 | 說明 |
| --- | --- |
| `sourceCollection` | 未篩選的原始 Array；重新指定時自動 refresh。 |
| `items` | 目前篩選後的資料。 |
| `filter` | 公開 filter predicate；設為 `null` 可清除。 |
| `itemCount` | `items.length`。 |
| `isEmpty` | 目前 view 是否沒有資料。 |
| `isUpdating` | 是否位於 `beginUpdate()`／`endUpdate()` 區段。 |
| `currentItem` | 目前資料項目。 |
| `currentPosition` | `currentItem` 在 `items` 內的位置；沒有目前項目時為 `-1`。 |

## 方法

| 方法 | 說明 |
| --- | --- |
| `refresh()` | 重新套用 filter 並觸發 `collectionChanged`。 |
| `beginUpdate()`／`endUpdate(force?)` | 暫停／恢復 refresh。 |
| `deferUpdate(callback, force?)` | 在單一更新區段執行 callback。 |
| `contains(item)` | 判斷 item 是否位於目前 view。 |
| `moveCurrentTo(item)` | 將指定 item 設為目前項目。 |
| `moveCurrentToPosition(position)` | 依 view index 設定目前項目。 |
| `moveCurrentToFirst()`／`moveCurrentToLast()` | 移到第一筆／最後一筆。 |
| `moveCurrentToNext()`／`moveCurrentToPrevious()` | 移到下一筆／上一筆。 |
| `dispose()` | 清除 CollectionView event handlers。 |

## 事件

事件使用 Wijmo-style `addHandler(handler, self?)`／`removeHandler(handler, self?)`。

| 事件 | 說明 |
| --- | --- |
| `collectionChanged` | `items` 重建後觸發。 |
| `currentChanging` | current item 變更前觸發；handler 回傳 `false` 可取消。 |
| `currentChanged` | current item 或 position 變更後觸發。 |

直接修改原始 Array 或 item property 後，應呼叫 `refresh()`。由 FabGrid cell editor 修改資料時，Grid 會自動 refresh 共用 CollectionView。
