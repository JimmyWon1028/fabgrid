# fabLoader API 操作手冊

`fabLoader` 是獨立的 browser global 資源載入器，不依賴 FabUI 或其他
套件。目前版本為 `0.12.0`，發佈檔內建小型 jQuery-like DOM helper。

主要功能：

- 動態載入 JavaScript、ES module 與 CSS。
- 循序或平行安排載入工作。
- 預載單張、陣列或名稱物件格式的圖片。
- 載入並快取文字、HTML 與 XML。
- 將 HTML 掛載到指定元素，並依序執行片段內的 script。
- 選用 SystemJS 載入 Vue 2 SFC 或 React JSX。
- 提供 timeout、取消、失敗重試及資源去重。

## 載入

正式版：

```html
<script src="./dist/fabLoader.min.js"></script>
```

開發版：

```html
<script src="./dist/fabLoader.js"></script>
```

載入後公開：

```js
console.log(fabLoader.version);
```

`fabLoader` 不會附加到 `fabui` namespace。

## 快速開始

```js
fabLoader
  .style('./app.css')
  .script('./library.js')
  .wait(function() {
    return fabLoader.loadHtml('./fragment.html');
  })
  .run(function() {
    startApplication();
  })
  .catch(function(error) {
    console.error(error);
  });
```

不必先呼叫 `queue()`。從 `style()`、`script()`、`module()`、`vue()`、
`react()`、`run()` 或 `wait()` 開始，都會自動建立一條新的獨立佇列。

## 公開屬性與方法

| API | 回傳值 | 用途 |
| --- | --- | --- |
| `version` | `string` | fabLoader 版本。 |
| `setConfig(options)` | `fabLoader` | 設定四個資源桶的預設 options。 |
| `getConfig()` | `object` | 取得目前設定的獨立副本。 |
| `queue()` | `FabLoaderQueue` | 明確建立空佇列；一般使用時可省略。 |
| `style(urls, options?)` | `FabLoaderQueue` | 開始 CSS 載入佇列。 |
| `script(urls, options?)` | `FabLoaderQueue` | 開始 JavaScript 載入佇列。 |
| `module(url, options?)` | `FabLoaderQueue` | 開始 ES module 載入佇列。 |
| `vue(url)` | `FabLoaderQueue` | 透過頁面既有 SystemJS 載入 Vue 2 SFC。 |
| `react(url)` | `FabLoaderQueue` | 透過頁面既有 SystemJS 載入 React JSX。 |
| `run(callback)` | `FabLoaderQueue` | 在目前佇列執行 callback。 |
| `wait(callback)` | `FabLoaderQueue` | `run(callback)` 的相容別名。 |
| `loadScript(url, options?)` | `Promise<HTMLScriptElement>` | 直接載入 JavaScript。 |
| `loadCss(url, options?)` | `Promise<HTMLLinkElement>` | 直接載入 CSS。 |
| `preloadImage(input, options?)` | `Promise` | 預載單張或一組圖片。 |
| `loadText(url, options?)` | `Promise<string>` | 非同步載入並快取文字。 |
| `getText(url, options?)` | `string \| null` | 同步讀取已完成的文字快取。 |
| `loadHtml(input, options?)` | `Promise` | 載入單一、陣列或名稱物件格式的 HTML 文字。 |
| `getHtml(url, options?)` | `string \| null` | `getText()` 的 HTML 相容名稱。 |
| `loadXml(url, options?)` | `Promise<XMLDocument>` | 載入文字並解析為新的 XMLDocument。 |
| `clearTextCache(url?, options?)` | `undefined` | 清除文字、HTML 與 XML 共用原文快取。 |
| `mountHtml(target, url, options?)` | `Promise<object>` | 將 HTML 掛載到元素並執行 script。 |
| `cancel(bucket?, url?)` | `number` | 取消符合條件的 pending 載入並回傳數量。 |
| `dom(target)` | `FabDomCollection` | 建立內建 jQuery-like collection。 |
| `useDom()` | `function` | 取得頁面 jQuery 或內建 `fabLoader.dom`。 |

## 全域設定

### setConfig(options)

設定之後建立的載入工作。只需提供要修改的資源桶與欄位：

```js
fabLoader.setConfig({
  script: {
    timeout: 15000,
    async: false,
    attributes: {
      crossorigin: 'anonymous'
    }
  },
  css: {
    timeout: 15000,
    media: 'all'
  },
  image: {
    timeout: 10000,
    crossOrigin: 'anonymous'
  },
  text: {
    timeout: 10000,
    credentials: 'include'
  }
});
```

每次呼叫仍可用 options 覆寫該次載入。`setConfig()` 回傳
`fabLoader`，可以繼續呼叫其他方法。

### getConfig()

```js
var config = fabLoader.getConfig();
```

回傳獨立副本，修改 `config` 不會直接改變 fabLoader 內部設定。

### 預設值

| 資源桶 | 欄位 | 預設值 |
| --- | --- | --- |
| `script` | `timeout` | `30000` |
| `script` | `type` | `''` |
| `script` | `async` | `false` |
| `script` | `attributes` | `{ crossorigin: 'anonymous' }` |
| `css` | `timeout` | `30000` |
| `css` | `media` | `'all'` |
| `css` | `attributes` | `{}` |
| `image` | `timeout` | `30000` |
| `image` | `crossOrigin` | `'anonymous'` |
| `image` | `referrerPolicy` | `''` |
| `image` | `fetchPriority` | `''` |
| `text` | `timeout` | `30000` |
| `text` | `credentials` | `'same-origin'` |

`credentials` 只接受 `'same-origin'`、`'include'` 或 `'omit'`。
`timeout: 0` 表示不設定 timeout。

## 佇列 API

### script(url, options?)

單一 URL 是一個循序步驟：

```js
fabLoader
  .script('./jquery.js')
  .script('./jquery-plugin.js')
  .run(function() {
    startApplication();
  });
```

第二個 script 會等第一個完成後才開始。

URL 陣列會平行載入，整組完成後才繼續：

```js
fabLoader
  .script([
    './library-a.js',
    './library-b.js'
  ])
  .run(function() {
    startApplication();
  });
```

陣列內的 scripts 不保證執行順序，只適合放互不依賴的程式。

### style(urls, options?)

```js
fabLoader
  .style([
    './base.css',
    './feature.css'
  ])
  .run(function() {
    renderPage();
  });
```

單一 CSS 直接載入；陣列內的 CSS 平行載入。

### module(url, options?)

```js
fabLoader
  .module('./app.js')
  .run(function() {
    console.log('Module loaded');
  });
```

等同以 `type="module"` 動態建立 script。這個 API 載入瀏覽器原生
ES module，不會轉譯 JSX、Vue SFC 或其他非瀏覽器原生格式。

### run(callback)／wait(callback)

`wait()` 是 `run()` 的同一函數別名，兩者行為完全相同：

```js
fabLoader
  .script('./app.js')
  .wait(function() {
    initializeApp();
  });
```

callback 回傳 Promise 時，後續步驟會等待 Promise 完成：

```js
fabLoader
  .wait(function() {
    return fabLoader.loadHtml('./part.html');
  })
  .run(function() {
    console.log('HTML loaded');
  });
```

箭頭函數省略 `{}` 時會隱含回傳：

```js
fabLoader.wait(function() {
  return fabLoader.loadHtml('./part.html');
});

fabLoader.wait(() => fabLoader.loadHtml('./part.html'));
```

如果 callback 啟動非同步工作卻沒有回傳 Promise，佇列不會等待：

```js
fabLoader.wait(function() {
  fabLoader.loadHtml('./part.html');
});
```

### done(callback)

在前面所有步驟完成後執行 callback：

```js
fabLoader
  .script('./app.js')
  .done(function() {
    console.log('Done');
  });
```

`done()` 仍回傳佇列，不是原生 Promise。

### catch(callback)

處理前方佇列步驟的載入錯誤、timeout、取消或 callback 例外：

```js
fabLoader
  .script('./app.js')
  .run(function() {
    startApplication();
  })
  .catch(function(error) {
    console.error(error);
  });
```

建議將 `catch()` 放在載入鏈的最後。

### queue()

只有需要先建立空佇列時才使用：

```js
var loader = fabLoader.queue();

loader
  .style('./app.css')
  .script('./app.js');
```

一般情況直接從 `fabLoader.script()` 或其他頂層佇列方法開始即可。

## 直接載入 Script 與 CSS

### loadScript(url, options?)

```js
fabLoader.loadScript('./app.js').then(function(script) {
  console.log(script.src);
});
```

Script options：

| Option | 說明 |
| --- | --- |
| `timeout` | timeout 毫秒；`0` 表示停用。 |
| `type` | script type；例如 `'module'`。 |
| `async` | 是否設定動態 script 的 async。 |
| `attributes` | 套用到 script 的其他 HTML attributes。 |

`src`、`type` 與 `async` 由專用 options 控制，不能透過
`attributes` 覆蓋。

### loadCss(url, options?)

```js
fabLoader.loadCss('./app.css').then(function(link) {
  console.log(link.href);
});
```

CSS options：

| Option | 說明 |
| --- | --- |
| `timeout` | timeout 毫秒；`0` 表示停用。 |
| `media` | stylesheet media，預設 `'all'`。 |
| `attributes` | 套用到 link 的其他 HTML attributes。 |

`href` 與 `rel` 由 fabLoader 控制。

## 圖片預載

### preloadImage(url, options?)

```js
fabLoader.preloadImage('./logo.png').then(function(image) {
  document.body.appendChild(image);
});
```

相同 URL 與 identity options 共用一次網路預載，但每次呼叫都回傳
不同的 `<img>` 節點，因此可以安全插入不同位置。

圖片 options：

| Option | 說明 |
| --- | --- |
| `timeout` | timeout 毫秒；`0` 表示停用。 |
| `crossOrigin` | 圖片 `crossOrigin`。 |
| `referrerPolicy` | 圖片 `referrerPolicy`。 |
| `fetchPriority` | 圖片 `fetchPriority`。 |

### 圖片陣列

```js
fabLoader.preloadImage([
  './loader.png',
  './unlock.png'
]).then(function(images) {
  window.myImages = images;
});

$('#place-a').append(myImages[0]);
$('#place-b').append(myImages[0]);
```

回傳真正的 Array，順序與輸入相同。每個索引都是可重複讀取的
getter，因此兩次讀取 `myImages[0]` 會得到不同 DOM 節點。

### 名稱圖片物件

```js
fabLoader.preloadImage({
  loader: './loader.png',
  unlock: './unlock.png'
}).then(function(images) {
  window.myImage = images;
});

$('#place-a').append(myImage.loader);
$('#place-b').append(myImage.loader);
```

每次讀取同一名稱也會得到新的 `<img>` 節點。

## 文字、HTML 與 XML

文字、HTML 與 XML 原文共用 `text` 資源桶及記憶體快取。

### loadText(url, options?)

```js
fabLoader.loadText('./notes.txt').then(function(text) {
  console.log(text);
});
```

發出 Fetch 請求或等待相同的 pending 請求，成功後將文字保存在
記憶體。

### getText(url, options?)

```js
var text = fabLoader.getText('./notes.txt');
```

只同步讀取已完成快取，不會發出請求。未命中或尚未完成時回傳
`null`。

若載入時使用不同 `credentials`，讀取時也要提供相同 options：

```js
var text = fabLoader.getText('./notes.txt', {
  credentials: 'include'
});
```

### loadHtml(input, options?)

單一 HTML：

```js
fabLoader.loadHtml('./part.html').then(function(html) {
  console.log(html);
});
```

URL 陣列會平行載入，回傳順序相同的文字陣列：

```js
fabLoader.loadHtml([
  './header.html',
  './body.html'
]).then(function(htmlList) {
  console.log(htmlList[0]);
  console.log(htmlList[1]);
});
```

名稱物件會平行載入並保留名稱：

```js
fabLoader.loadHtml({
  header: './header.html',
  body: './body.html'
}).then(function(html) {
  console.log(html.header);
  console.log(html.body);
});
```

將名稱陣列對應到另一個 URL 物件：

```js
var names = [
  'ppm_refCtrl_src',
  'ppm_grdView_src',
  'ppm_grdReport_src'
];

return fabLoader.loadHtml(
  names.map(function(name) {
    return $g.part[name];
  })
).then(function(htmlList) {
  names.forEach(function(name, index) {
    $g[name] = htmlList[index];
  });
});
```

### getHtml(url, options?)

`getText()` 的 HTML 相容名稱，只讀取單一 URL 的已完成快取：

```js
var html = fabLoader.getHtml('./part.html');
```

### loadXml(url, options?)

```js
fabLoader.loadXml('./data.xml').then(function(xml) {
  console.log(xml.documentElement);
});
```

XML 原文使用共用文字快取，但每次呼叫都重新解析並回傳新的
`XMLDocument`。解析失敗會 reject，並清除該筆原文快取。

### clearTextCache(url?, options?)

清除全部文字快取：

```js
fabLoader.clearTextCache();
```

清除指定 URL 的全部 credentials 變體：

```js
fabLoader.clearTextCache('./part.html');
```

只清除指定 URL 與 options 的快取：

```js
fabLoader.clearTextCache('./part.html', {
  credentials: 'include'
});
```

若被清除的紀錄仍在載入，該請求也會被取消。

## 掛載 HTML

### mountHtml(target, url, options?)

```js
fabLoader.mountHtml('#target', './part.html').then(function(result) {
  console.log(result.target);
});
```

`target` 可使用 CSS selector 或 Element。

Options：

| Option | 預設 | 說明 |
| --- | --- | --- |
| `append` | `false` | `false` 取代目標內容；`true` 追加內容。 |
| `executeScripts` | `true` | 是否執行片段內可執行的 script。 |
| `timeout` | text 設定 | HTML 下載 timeout。 |
| `credentials` | text 設定 | HTML Fetch credentials。 |

成功結果：

| 欄位 | 說明 |
| --- | --- |
| `target` | 實際掛載的 Element。 |
| `url` | 原始解析後的請求 URL。 |
| `responseUrl` | Fetch 最終回應 URL，包含 redirect 結果。 |
| `html` | 原始 HTML 文字。 |

片段內的 `src`、`href`、`action` 與 `poster` 相對路徑會以最終
`responseUrl` 為基準改寫。可執行 script 會依 HTML 原始順序執行；
前一個外部 script 完成後才執行下一個。

HTML 文字不會進行 sanitization。只能掛載可信任內容，尤其是啟用
script 執行時。

## 取消與 timeout

### cancel(bucket?, url?)

取消指定 URL：

```js
fabLoader.cancel('text', './part.html');
```

取消整個資源桶：

```js
fabLoader.cancel('image');
```

取消所有 pending 載入：

```js
fabLoader.cancel();
```

支援的 bucket：

- `'script'`
- `'css'`
- `'style'`，等同 `'css'`
- `'image'`
- `'text'`

回傳實際取消的 pending record 數量。已完成的資源不會受到影響。

Timeout error 的 `name` 是 `'TimeoutError'`，主動取消 error 的
`name` 是 `'AbortError'`。失敗、timeout 或取消都會移除該筆資源
紀錄，因此相同資源之後可以重新載入。

## 快取與資源去重

相同 URL 只有在資源 identity options 相同時才會共用紀錄。

| 資源 | 納入快取鍵的 options |
| --- | --- |
| Script | `type`、`async`、`attributes` |
| CSS | `media`、`attributes` |
| Image | `crossOrigin`、`referrerPolicy`、`fetchPriority` |
| Text／HTML／XML | `credentials` |

`timeout` 不影響資源身份，不納入快取鍵。

Script 與 CSS 重複呼叫會回傳相同的已載入 DOM element。圖片共用
網路預載，但對外回傳新的 `<img>`。文字與 HTML 重複呼叫會回傳同一
份文字內容。

## Vue 2 SFC

### vue(url)

```js
fabLoader
  .script([
    './vendor/vue.min.js',
    './vendor/system.js'
  ])
  .script('./systemjs.config.js')
  .vue('./components/hello.vue')
  .run(function() {
    console.log('Vue component loaded');
  })
  .catch(function(error) {
    console.error(error);
  });
```

只有呼叫 `vue()` 時才檢查：

- `System.import()` 或 `SystemJS.import()`。
- Vue 2。
- 包含 `Vue.compile()` 的 Vue 2 完整版。

fabLoader 不內建 Vue、SystemJS 或 `.vue` loader。

## React JSX

### react(url)

```js
fabLoader
  .script([
    './vendor/system.js',
    './vendor/react-runtime.min.js'
  ])
  .script('./runtime.config.js')
  .react('./components/hello.jsx')
  .run(function() {
    console.log('React component loaded');
  })
  .catch(function(error) {
    console.error(error);
  });
```

只有呼叫 `react()` 時才檢查：

- `System.import()` 或 `SystemJS.import()`。
- `React.createElement()`。
- `ReactDOMClient.createRoot()`。

fabLoader 不內建 React、SystemJS、Babel 或 JSX loader。

## DOM helper

### dom(target)

```js
var $target = fabLoader.dom('#target');

$target
  .html('<strong>Ready</strong>')
  .addClass('ready')
  .css('color', 'green');
```

如果頁面沒有 jQuery，且 `$` 尚未被其他程式使用，載入 fabLoader
時會安全設定：

```js
window.$ === fabLoader.dom;
```

既有 jQuery 或其他 `$` 不會被覆蓋。

### useDom()

```js
var $ = fabLoader.useDom();
```

有效的 `window.jQuery` 存在時回傳 jQuery，否則回傳
`fabLoader.dom`。不會修改目前的全域 `$`。

### FabDomCollection

| 分類 | Methods |
| --- | --- |
| 遍歷 collection | `each()`、`get()`、`eq()`、`first()`、`last()` |
| 內容 | `html()`、`text()`、`val()`、`empty()` |
| 插入與移除 | `append()`、`prepend()`、`before()`、`after()`、`remove()` |
| Attribute／property | `attr()`、`removeAttr()`、`prop()` |
| CSS／class | `css()`、`addClass()`、`removeClass()`、`toggleClass()`、`hasClass()` |
| 事件 | `on()`、`off()` |
| DOM 遍歷 | `find()`、`closest()`、`parent()`、`children()`、`is()` |
| HTML 載入 | `load()` |

Getter 讀取第一個符合元素；setter 套用到全部元素並回傳原 collection。
`text()` getter 會合併全部符合元素的文字。插入方法接受可信任 HTML
字串、DOM Node、NodeList 或 fabDom collection。

事件支援直接監聽與 selector 委派：

```js
$('#list').on('click', 'button', function(event) {
  console.log(this, event);
});
```

移除監聽：

```js
$('#list').off('click', 'button', handler);
$('#list').off();
```

fabDom 不提供完整 jQuery 相容層，也不包含動畫、完整 Ajax、event
namespace、trigger 或 plugin system。

### dom(target).load(url, options?, callback?)

```js
fabLoader.dom('#target').load(
  './part.html',
  function(responseText, status, result) {
    if (status === 'success') {
      fabLoader.dom(this).addClass('ready');
    }
  }
);
```

`.load()` 立即回傳原 collection，實際工作交由 `mountHtml()` 執行。
callback 的 `this` 是目前目標元素。

| Callback 參數 | 說明 |
| --- | --- |
| `responseText` | 成功時為 HTML；失敗時為 `null`。 |
| `status` | `'success'` 或 `'error'`。 |
| `result` | 成功時為 mount result；失敗時為 Error。 |

需要等待 `.load()` 完成時，可使用 collection 的 `_loadPromise`：

```js
var request = fabLoader.dom('#target').load('./part.html');

request._loadPromise.then(function() {
  console.log('Mounted');
});
```

`_loadPromise` 是目前 helper 的實用欄位，不是完整 jQuery API。

## 錯誤處理

直接載入方法使用 Promise：

```js
fabLoader.loadHtml('./part.html').catch(function(error) {
  console.error(error);
});
```

佇列方法使用鏈尾 `.catch()`：

```js
fabLoader
  .style('./app.css')
  .script('./app.js')
  .catch(function(error) {
    console.error(error);
  });
```

常見錯誤：

| Error | 情況 |
| --- | --- |
| `TypeError` | URL 空白、timeout 無效、credentials 無效或 callback 不是函數。 |
| `TimeoutError` | 資源超過設定 timeout。 |
| `AbortError` | 載入被 `cancel()` 或快取清理取消。 |
| `Error` | 網路、HTTP、script、CSS、圖片、XML 或 optional runtime 載入失敗。 |

直接方法的部分參數錯誤可能在建立 Promise 前同步拋出。若希望所有
錯誤都進入同一個 `.catch()`，可把直接方法放入 `run()`／`wait()`
佇列中。

## Build

一般 Loader build：

```sh
npm run build:loader
```

只輸出：

- `dist/fabLoader.js`
- `dist/fabLoader.min.js`

只保留壓縮版：

```sh
npm run build:loader -- min
```

fabLoader 不產生 ESM 發佈檔，也不納入 FabUI core 或
`build:all`。
