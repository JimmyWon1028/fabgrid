import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

var source = [
  fs.readFileSync('src/fabdom/fabDom.js', 'utf8'),
  fs.readFileSync('src/fabloader/fabLoader.js', 'utf8')
].join('\n');

function createLoaderContext(options) {
  var appended = [];
  var removed = [];
  var fetchCount = 0;
  var fetchText = '<section>cached html</section>';
  var fetchStatus = 200;
  var fetchPending = false;
  var elementAutoLoad = true;
  var imageAutoLoad = true;
  var imageLoadCount = 0;
  var lastImage = null;
  var lastFetchOptions = null;

  options = options || {};
  if (options.fetchPending === true) fetchPending = true;
  if (options.elementAutoLoad === false) elementAutoLoad = false;
  if (options.imageAutoLoad === false) imageAutoLoad = false;

  function createElement(tagName) {
    var attributes = Object.create(null);
    return {
      tagName: String(tagName).toUpperCase(),
      attributes: [],
      nodeType: 1,
      parentNode: null,
      setAttribute: function(name, value) {
        attributes[name] = String(value);
        this.attributes = Object.keys(attributes).map(function(key) {
          return { name: key, value: attributes[key] };
        });
      },
      getAttribute: function(name) {
        return Object.prototype.hasOwnProperty.call(attributes, name) ?
          attributes[name] :
          null;
      },
      hasAttribute: function(name) {
        return Object.prototype.hasOwnProperty.call(attributes, name);
      }
    };
  }

  function FakeImage() {
    var self = this;
    lastImage = this;
    this.tagName = 'IMG';
    this.nodeType = 1;
    this.parentNode = null;
    Object.defineProperty(this, 'src', {
      get: function() {
        return self._src || '';
      },
      set: function(value) {
        self._src = value;
        imageLoadCount += 1;
        if (imageAutoLoad) {
          setTimeout(function() {
            if (self.onload) self.onload();
          }, 0);
        }
      }
    });
  }

  FakeImage.prototype.cloneNode = function() {
    var clone = new FakeImage();
    clone._src = this._src;
    clone.crossOrigin = this.crossOrigin;
    clone.referrerPolicy = this.referrerPolicy;
    clone.fetchPriority = this.fetchPriority;
    return clone;
  };

  function FakeDOMParser() {}

  FakeDOMParser.prototype.parseFromString = function(text, contentType) {
    var invalid = text === '<invalid>';
    var rootMatch = text.match(/^\s*<([A-Za-z_][\w:.-]*)[\s>]/);
    return {
      contentType: contentType,
      sourceText: text,
      documentElement: {
        nodeName: invalid ? 'parsererror' : (rootMatch ? rootMatch[1] : '')
      },
      getElementsByTagName: function(name) {
        return name === 'parsererror' && invalid ? [{}] : [];
      }
    };
  };

  var document = {
    baseURI: 'https://example.test/demo/index.html',
    head: {
      appendChild: function(element) {
        appended.push(element);
        element.parentNode = this;
        if (elementAutoLoad) {
          setTimeout(function() {
            if (element.onload) element.onload();
          }, 0);
        }
        return element;
      },
      removeChild: function(element) {
        var index = appended.indexOf(element);
        if (index >= 0) appended.splice(index, 1);
        removed.push(element);
        element.parentNode = null;
        return element;
      }
    },
    createElement: createElement,
    querySelectorAll: function() {
      return [];
    },
    querySelector: function() {
      return null;
    }
  };
  var context = {
    URL: URL,
    Promise: Promise,
    Error: Error,
    TypeError: TypeError,
    Object: Object,
    Array: Array,
    String: String,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    AbortController: AbortController,
    document: document,
    Image: FakeImage,
    DOMParser: FakeDOMParser,
    fetch: function(url, options) {
      fetchCount += 1;
      lastFetchOptions = options;
      if (fetchPending) {
        return new Promise(function(resolve, reject) {
          if (options.signal) {
            options.signal.addEventListener('abort', function() {
              var error = new Error('Aborted');
              error.name = 'AbortError';
              reject(error);
            }, { once: true });
          }
        });
      }
      return Promise.resolve({
        ok: fetchStatus >= 200 && fetchStatus < 300,
        status: fetchStatus,
        url: url,
        text: function() {
          return Promise.resolve(fetchText);
        },
        options: options
      });
    }
  };
  context.window = context;
  context.getAppended = function() {
    return appended.slice();
  };
  context.getFetchCount = function() {
    return fetchCount;
  };
  context.getImageLoadCount = function() {
    return imageLoadCount;
  };
  context.getLastImage = function() {
    return lastImage;
  };
  context.getLastFetchOptions = function() {
    return lastFetchOptions;
  };
  context.getRemoved = function() {
    return removed.slice();
  };
  context.setElementAutoLoad = function(value) {
    elementAutoLoad = value === true;
  };
  context.setImageAutoLoad = function(value) {
    imageAutoLoad = value === true;
  };
  context.setFetchPending = function(value) {
    fetchPending = value === true;
  };
  context.setFetchText = function(value) {
    fetchText = String(value);
  };
  context.setFetchStatus = function(value) {
    fetchStatus = Number(value);
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

test('fabLoader publishes the standalone resource API', function() {
  var context = createLoaderContext();

  assert.equal(context.fabLoader.version, '0.12.0');
  assert.equal(context.fabLoader.dom, context.fabDom);
  assert.equal(context.$, context.fabDom);
  [
    'setConfig',
    'getConfig',
    'cancel',
    'queue',
    'style',
    'script',
    'module',
    'vue',
    'react',
    'useDom',
    'run',
    'wait',
    'loadScript',
    'loadCss',
    'preloadImage',
    'loadText',
    'getText',
    'loadXml',
    'loadHtml',
    'getHtml',
    'clearTextCache',
    'mountHtml'
  ].forEach(function(name) {
    assert.equal(typeof context.fabLoader[name], 'function', name);
  });
  assert.equal(context.fabLoader.clearHtmlCache, undefined);
  assert.equal(context.fabLoader.wait, context.fabLoader.run);
});

test('fabLoader useDom returns a local provider without changing global dollar', function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var occupiedDollar = function() {};
  var jquery = function() {};

  assert.equal(loader.useDom(), loader.dom);

  jquery.fn = { jquery: '4.0.0+slim' };
  context.jQuery = jquery;
  context.$ = occupiedDollar;

  assert.equal(loader.useDom(), jquery);
  assert.equal(context.$, occupiedDollar);

  context.jQuery = undefined;
  assert.equal(loader.useDom(), loader.dom);
  assert.equal(context.$, occupiedDollar);
});

test('fabLoader dom load follows the jQuery callback and chaining shape', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var target = { nodeType: 1 };
  var collection = loader.dom(target);
  var callbackArgs;
  var mountCalls = [];
  var returned;

  loader.mountHtml = function(element, url, options) {
    mountCalls.push({
      element: element,
      url: url,
      options: options
    });
    return Promise.resolve({
      target: element,
      url: url,
      responseUrl: 'https://example.test/demo/fragment.html',
      html: '<section>loaded</section>'
    });
  };

  returned = collection.load(
    './fragment.html',
    { executeScripts: true },
    function(responseText, status, result) {
      callbackArgs = {
        context: this,
        responseText: responseText,
        status: status,
        result: result
      };
    }
  );

  assert.equal(returned, collection);
  await collection._loadPromise;
  assert.equal(mountCalls.length, 1);
  assert.equal(mountCalls[0].element, target);
  assert.equal(mountCalls[0].url, './fragment.html');
  assert.equal(mountCalls[0].options.executeScripts, true);
  assert.equal(callbackArgs.context, target);
  assert.equal(callbackArgs.responseText, '<section>loaded</section>');
  assert.equal(callbackArgs.status, 'success');
  assert.equal(callbackArgs.result.target, target);
});

test('fabLoader uses configurable bucket defaults and returns config copies', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var defaults = JSON.parse(JSON.stringify(loader.getConfig()));
  var copy;
  var script;
  var css;
  var image;

  assert.deepEqual(defaults, {
    script: {
      timeout: 30000,
      type: '',
      async: false,
      attributes: {
        crossorigin: 'anonymous'
      }
    },
    css: {
      timeout: 30000,
      media: 'all',
      attributes: {}
    },
    image: {
      timeout: 30000,
      crossOrigin: 'anonymous',
      referrerPolicy: '',
      fetchPriority: ''
    },
    text: {
      timeout: 30000,
      credentials: 'same-origin'
    }
  });

  copy = loader.getConfig();
  copy.script.timeout = 1;
  copy.script.attributes.crossorigin = null;
  assert.equal(loader.getConfig().script.timeout, 30000);
  assert.equal(
    loader.getConfig().script.attributes.crossorigin,
    'anonymous'
  );

  assert.equal(loader.setConfig({
    script: {
      type: 'text/javascript',
      async: true,
      attributes: {
        integrity: 'sha256-test'
      }
    },
    css: {
      media: 'print',
      attributes: {
        nonce: 'css-nonce'
      }
    },
    image: {
      crossOrigin: 'use-credentials',
      referrerPolicy: 'no-referrer',
      fetchPriority: 'high'
    },
    text: {
      credentials: 'include'
    }
  }), loader);

  [script, css, image] = await Promise.all([
    loader.loadScript('../assets/configured.js'),
    loader.loadCss('../assets/configured.css'),
    loader.preloadImage('../assets/configured.svg'),
    loader.loadText('../assets/configured.txt')
  ]);

  assert.equal(script.type, 'text/javascript');
  assert.equal(script.async, true);
  assert.equal(script.getAttribute('crossorigin'), 'anonymous');
  assert.equal(script.getAttribute('integrity'), 'sha256-test');
  assert.equal(css.media, 'print');
  assert.equal(css.getAttribute('nonce'), 'css-nonce');
  assert.equal(image.crossOrigin, 'use-credentials');
  assert.equal(image.referrerPolicy, 'no-referrer');
  assert.equal(image.fetchPriority, 'high');
  assert.equal(context.getLastFetchOptions().credentials, 'include');

  assert.throws(function() {
    loader.setConfig({ text: { credentials: 'invalid' } });
  }, /credentials must be same-origin, include or omit/);
  assert.throws(function() {
    loader.setConfig({ script: { timeout: -1 } });
  }, /timeout must be a non-negative number/);
  assert.throws(function() {
    loader.setConfig({ unknown: {} });
  }, /Unknown fabLoader config bucket/);
});

test('fabLoader cache keys include resource identity options', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;

  await Promise.all([
    loader.loadScript('../assets/options.js', {
      attributes: { integrity: 'sha256-a' }
    }),
    loader.loadScript('../assets/options.js', {
      attributes: { integrity: 'sha256-b' }
    }),
    loader.loadCss('../assets/options.css', { media: 'screen' }),
    loader.loadCss('../assets/options.css', { media: 'print' }),
    loader.preloadImage('../assets/options.svg', {
      crossOrigin: 'anonymous'
    }),
    loader.preloadImage('../assets/options.svg', {
      crossOrigin: 'use-credentials'
    }),
    loader.loadText('../assets/options.txt', {
      credentials: 'same-origin'
    }),
    loader.loadText('../assets/options.txt', {
      credentials: 'include'
    })
  ]);

  assert.equal(context.getAppended().filter(function(element) {
    return element.tagName === 'SCRIPT';
  }).length, 2);
  assert.equal(context.getAppended().filter(function(element) {
    return element.tagName === 'LINK';
  }).length, 2);
  assert.equal(context.getImageLoadCount(), 2);
  assert.equal(context.getFetchCount(), 2);

  loader.clearTextCache('../assets/options.txt');
  assert.equal(loader.getText('../assets/options.txt', {
    credentials: 'same-origin'
  }), null);
  assert.equal(loader.getText('../assets/options.txt', {
    credentials: 'include'
  }), null);
});

test('fabLoader timeout clears a failed resource so it can retry', async function() {
  var context = createLoaderContext({ elementAutoLoad: false });
  var loader = context.fabLoader;

  loader.setConfig({ script: { timeout: 5 } });
  await assert.rejects(
    loader.loadScript('../assets/timeout.js'),
    function(error) {
      return error.name === 'TimeoutError' &&
        /Timed out loading script after 5ms/.test(error.message);
    }
  );
  assert.equal(context.getAppended().length, 0);
  assert.equal(context.getRemoved().length, 1);

  context.setElementAutoLoad(true);
  loader.setConfig({ script: { timeout: 30000 } });
  await loader.loadScript('../assets/timeout.js');
  assert.equal(context.getAppended().length, 1);
});

test('fabLoader load errors clear script, image and text records', async function() {
  var context = createLoaderContext({
    elementAutoLoad: false,
    imageAutoLoad: false
  });
  var loader = context.fabLoader;
  var script = loader.loadScript('../assets/error.js');
  var image = loader.preloadImage('../assets/error.svg');

  context.getAppended()[0].onerror();
  context.getLastImage().onerror();
  await assert.rejects(script, /Failed to load script/);
  await assert.rejects(image, /Failed to preload image/);

  context.setFetchStatus(503);
  await assert.rejects(
    loader.loadText('../assets/error.txt'),
    /Failed to load text: .* \(503\)/
  );

  context.setElementAutoLoad(true);
  context.setImageAutoLoad(true);
  context.setFetchStatus(200);
  await Promise.all([
    loader.loadScript('../assets/error.js'),
    loader.preloadImage('../assets/error.svg'),
    loader.loadText('../assets/error.txt')
  ]);
  assert.equal(context.getFetchCount(), 2);
});

test('fabLoader cancellation rejects pending loads and allows retry', async function() {
  var context = createLoaderContext({
    elementAutoLoad: false,
    imageAutoLoad: false,
    fetchPending: true
  });
  var loader = context.fabLoader;
  var script = loader.loadScript('../assets/cancel.js');
  var image = loader.preloadImage('../assets/cancel.svg');
  var text = loader.loadText('../assets/cancel.txt');

  assert.equal(loader.cancel('script', '../assets/cancel.js'), 1);
  assert.equal(loader.cancel('image'), 1);
  assert.equal(loader.cancel('text', '../assets/cancel.txt'), 1);
  await assert.rejects(script, function(error) {
    return error.name === 'AbortError';
  });
  await assert.rejects(image, function(error) {
    return error.name === 'AbortError';
  });
  await assert.rejects(text, function(error) {
    return error.name === 'AbortError';
  });
  assert.equal(loader.cancel(), 0);

  context.setElementAutoLoad(true);
  context.setImageAutoLoad(true);
  context.setFetchPending(false);
  await Promise.all([
    loader.loadScript('../assets/cancel.js'),
    loader.preloadImage('../assets/cancel.svg'),
    loader.loadText('../assets/cancel.txt')
  ]);
  assert.equal(context.getFetchCount(), 2);
});

test('fabLoader starts an independent queue from the first chain operation', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var order = [];

  await new Promise(function(resolve, reject) {
    loader
      .style(['../assets/base.css', '../assets/feature.css'])
      .script('../assets/core.js')
      .run(function() {
        order.push('ready');
      })
      .module('../assets/controls.js')
      .done(resolve)
      .catch(reject);
  });

  assert.deepEqual(order, ['ready']);
  assert.deepEqual(context.getAppended().map(function(element) {
    return element.tagName;
  }), ['LINK', 'LINK', 'SCRIPT', 'SCRIPT']);
});

test('fabLoader wait is a compatibility alias of run', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var queue = loader.queue();
  var order = [];

  assert.equal(loader.wait, loader.run);
  assert.equal(queue.wait, queue.run);

  await new Promise(function(resolve, reject) {
    loader
      .wait(function() {
        order.push('first');
      })
      .wait(function() {
        order.push('second');
      })
      .done(resolve)
      .catch(reject);
  });

  assert.deepEqual(order, ['first', 'second']);
});

test('fabLoader loads a script array in parallel before the next queue step', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var groupReady = false;

  await new Promise(function(resolve, reject) {
    loader
      .script(['../assets/a.js', '../assets/b.js'])
      .run(function() {
        groupReady = true;
      })
      .script('../assets/after.js')
      .done(resolve)
      .catch(reject);
  });

  var scripts = context.getAppended().filter(function(element) {
    return element.tagName === 'SCRIPT';
  });
  assert.equal(groupReady, true);
  assert.deepEqual(scripts.map(function(script) {
    return script.src;
  }), [
    'https://example.test/assets/a.js',
    'https://example.test/assets/b.js',
    'https://example.test/assets/after.js'
  ]);
});

test('fabLoader queue hides Promise sequencing behind a chain API', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var order = [];

  await new Promise(function(resolve, reject) {
    loader
      .queue()
      .style(['../assets/base.css', '../assets/feature.css'])
      .run(function() {
        order.push('styles');
      })
      .script('../assets/core.js')
      .run(function() {
        order.push('core');
      })
      .module('../assets/controls.js', {
        attributes: { 'data-test': 'module' }
      })
      .run(function() {
        order.push('module');
      })
      .done(resolve)
      .catch(reject);
  });

  var appended = context.getAppended();
  assert.deepEqual(order, ['styles', 'core', 'module']);
  assert.deepEqual(appended.map(function(element) {
    return element.tagName;
  }), ['LINK', 'LINK', 'SCRIPT', 'SCRIPT']);
  assert.equal(appended[3].type, 'module');
  assert.equal(appended[3].getAttribute('data-test'), 'module');
});

test('fabLoader vue waits for SystemJS and the full Vue 2 build', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var imports = [];
  var order = [];

  context.Vue = function() {};
  context.Vue.version = '2.7.16';
  context.Vue.compile = function() {};
  context.System = {
    import: function(url) {
      imports.push(url);
      order.push('vue');
      return Promise.resolve({ default: { name: 'DemoPage' } });
    }
  };

  await new Promise(function(resolve, reject) {
    loader
      .script('../assets/system-config.js')
      .vue('../components/demo.vue')
      .run(function() {
        order.push('run');
      })
      .done(resolve)
      .catch(reject);
  });

  assert.deepEqual(imports, [
    'https://example.test/components/demo.vue'
  ]);
  assert.deepEqual(order, ['vue', 'run']);
});

test('fabLoader vue reports missing optional dependencies through catch', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var systemMessage;
  var vueMessage;
  var compilerMessage;

  systemMessage = await new Promise(function(resolve) {
    loader
      .vue('../components/demo.vue')
      .catch(function(error) {
        resolve(error.message);
      });
  });

  context.System = {
    import: function() {
      return Promise.resolve({});
    }
  };
  vueMessage = await new Promise(function(resolve) {
    loader
      .vue('../components/demo.vue')
      .catch(function(error) {
        resolve(error.message);
      });
  });

  context.Vue = function() {};
  context.Vue.version = '2.7.16';
  compilerMessage = await new Promise(function(resolve) {
    loader
      .vue('../components/demo.vue')
      .catch(function(error) {
        resolve(error.message);
      });
  });

  assert.equal(
    systemMessage,
    'fabLoader.vue() requires SystemJS with System.import().'
  );
  assert.equal(vueMessage, 'fabLoader.vue() requires Vue 2.');
  assert.equal(
    compilerMessage,
    'fabLoader.vue() requires the full Vue 2 build with the template compiler.'
  );
});

test('fabLoader react waits for SystemJS and the React client runtime', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var imports = [];
  var order = [];

  context.React = {
    createElement: function() {}
  };
  context.ReactDOMClient = {
    createRoot: function() {}
  };
  context.System = {
    import: function(url) {
      imports.push(url);
      order.push('react');
      return Promise.resolve({ default: { name: 'ReactDemo' } });
    }
  };

  await new Promise(function(resolve, reject) {
    loader
      .script('../assets/runtime-config.js')
      .react('../components/demo.jsx')
      .run(function() {
        order.push('run');
      })
      .done(resolve)
      .catch(reject);
  });

  assert.deepEqual(imports, [
    'https://example.test/components/demo.jsx'
  ]);
  assert.deepEqual(order, ['react', 'run']);
});

test('fabLoader react reports missing optional dependencies through catch', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var systemMessage;
  var reactMessage;
  var clientMessage;

  systemMessage = await new Promise(function(resolve) {
    loader
      .react('../components/demo.jsx')
      .catch(function(error) {
        resolve(error.message);
      });
  });

  context.System = {
    import: function() {
      return Promise.resolve({});
    }
  };
  reactMessage = await new Promise(function(resolve) {
    loader
      .react('../components/demo.jsx')
      .catch(function(error) {
        resolve(error.message);
      });
  });

  context.React = {
    createElement: function() {}
  };
  clientMessage = await new Promise(function(resolve) {
    loader
      .react('../components/demo.jsx')
      .catch(function(error) {
        resolve(error.message);
      });
  });

  assert.equal(
    systemMessage,
    'fabLoader.react() requires SystemJS with System.import().'
  );
  assert.equal(reactMessage, 'fabLoader.react() requires React.');
  assert.equal(
    clientMessage,
    'fabLoader.react() requires ReactDOMClient with createRoot().'
  );
});

test('fabLoader queue catch handles an earlier step and stops later loads', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var message = await new Promise(function(resolve, reject) {
    loader
      .queue()
      .run(function() {
        throw new Error('queue stopped');
      })
      .script('../assets/never.js')
      .done(function() {
        reject(new Error('queue should not complete'));
      })
      .catch(function(error) {
        resolve(error.message);
      });
  });

  assert.equal(message, 'queue stopped');
  assert.equal(context.getAppended().length, 0);
});

test('fabLoader deduplicates scripts, styles, images and cached html', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var scriptA = loader.loadScript('../assets/app.js');
  var scriptB = loader.loadScript('../assets/app.js');
  var cssA = loader.loadCss('../assets/app.css');
  var cssB = loader.loadCss('../assets/app.css');
  var imageA = loader.preloadImage('../assets/icon.svg');
  var imageB = loader.preloadImage('../assets/icon.svg');
  var htmlA = loader.loadHtml('../parts/card.html');
  var htmlB = loader.loadHtml('../parts/card.html');
  var results = await Promise.all([
    scriptA,
    scriptB,
    cssA,
    cssB,
    imageA,
    imageB,
    htmlA,
    htmlB
  ]);
  var appended = context.getAppended();

  assert.equal(results[0], results[1]);
  assert.equal(results[2], results[3]);
  assert.notEqual(results[4], results[5]);
  assert.equal(results[4].src, results[5].src);
  assert.equal(results[6], '<section>cached html</section>');
  assert.equal(results[7], results[6]);
  assert.equal(appended.filter(function(element) {
    return element.tagName === 'SCRIPT';
  }).length, 1);
  assert.equal(appended.filter(function(element) {
    return element.tagName === 'LINK';
  }).length, 1);
  assert.equal(results[0].async, false);
  assert.equal(results[0].getAttribute('crossorigin'), 'anonymous');
  assert.equal(context.getImageLoadCount(), 1);
  assert.equal(context.getFetchCount(), 1);
  assert.equal(
    loader.getHtml('../parts/card.html'),
    '<section>cached html</section>'
  );

  loader.clearTextCache('../parts/card.html');
  assert.equal(loader.getHtml('../parts/card.html'), null);
  await loader.loadHtml('../parts/card.html');
  assert.equal(context.getFetchCount(), 2);
});

test('fabLoader image arrays return reusable indexes with fresh nodes', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var images = await loader.preloadImage([
    '../assets/unlocked.svg',
    '../assets/exit.svg'
  ]);
  var firstA = images[0];
  var firstB = images[0];
  var secondA = images[1];
  var secondB = images[1];

  assert.equal(Array.isArray(images), true);
  assert.equal(images.length, 2);
  assert.notEqual(firstA, firstB);
  assert.notEqual(secondA, secondB);
  assert.equal(firstA.src, firstB.src);
  assert.equal(secondA.src, secondB.src);
  assert.notEqual(firstA.src, secondA.src);
  assert.equal(context.getImageLoadCount(), 2);

  images[0] = firstA;
  assert.equal(images[0], firstA);
  assert.equal(images.push(firstB), 3);
  assert.equal(images.pop(), firstB);
});

test('fabLoader image maps return reusable named images with fresh nodes', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var images = await loader.preloadImage({
    loader: '../assets/fab-loader.svg',
    unlock: '../assets/unlocked.svg'
  });
  var loaderA = images.loader;
  var loaderB = images.loader;
  var unlockA = images.unlock;
  var unlockB = images.unlock;

  assert.deepEqual(Object.keys(images), ['loader', 'unlock']);
  assert.notEqual(loaderA, loaderB);
  assert.notEqual(unlockA, unlockB);
  assert.equal(loaderA.src, loaderB.src);
  assert.equal(unlockA.src, unlockB.src);
  assert.notEqual(loaderA.src, unlockA.src);
  assert.equal(context.getImageLoadCount(), 2);

  images.loader = loaderA;
  assert.equal(images.loader, loaderA);
});

test('fabLoader loads text, shares the HTML cache and parses XML', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var text;
  var htmlAlias;
  var xml;
  var xmlAgain;

  context.setFetchText('plain text');
  text = await loader.loadText('../data/readme.txt');
  htmlAlias = await loader.loadHtml('../data/readme.txt');

  assert.equal(text, 'plain text');
  assert.equal(htmlAlias, text);
  assert.equal(loader.getText('../data/readme.txt'), text);
  assert.equal(loader.getHtml('../data/readme.txt'), text);
  assert.equal(context.getFetchCount(), 1);

  context.setFetchText('<catalog><item>one</item></catalog>');
  xml = await loader.loadXml('../data/catalog.xml');
  xmlAgain = await loader.loadXml('../data/catalog.xml');

  assert.equal(xml.contentType, 'application/xml');
  assert.equal(xml.documentElement.nodeName, 'catalog');
  assert.equal(xml.sourceText, loader.getText('../data/catalog.xml'));
  assert.notEqual(xmlAgain, xml);
  assert.equal(context.getFetchCount(), 2);

  context.setFetchText('<invalid>');
  await assert.rejects(
    loader.loadXml('../data/invalid.xml'),
    /Failed to parse XML: https:\/\/example\.test\/data\/invalid\.xml/
  );
  assert.equal(loader.getText('../data/invalid.xml'), null);
  assert.equal(context.getFetchCount(), 3);
});

test('fabLoader loadHtml accepts parallel arrays and named maps', async function() {
  var context = createLoaderContext();
  var loader = context.fabLoader;
  var list;
  var map;

  context.setFetchText('<section>part</section>');
  list = await loader.loadHtml([
    '../parts/shared.html',
    '../parts/shared.html'
  ]);
  map = await loader.loadHtml({
    header: '../parts/header.html',
    body: '../parts/body.html'
  });

  assert.deepEqual(Array.from(list), [
    '<section>part</section>',
    '<section>part</section>'
  ]);
  assert.deepEqual(Object.assign({}, map), {
    header: '<section>part</section>',
    body: '<section>part</section>'
  });
  assert.equal(context.getFetchCount(), 3);
  assert.equal(loader.getHtml('../parts/header.html'), map.header);
  assert.equal(loader.getHtml('../parts/body.html'), map.body);
});

test('fabLoader build supports regular and min-only browser globals', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fab-loader-build-'));
  var sentinel = path.join(tempDir, 'fabui.js');
  var result;
  var output;
  var minifiedOutput;
  var context;

  assert.equal(packageJson.scripts['build:loader'], 'node build/build-loader.cjs');
  fs.writeFileSync(sentinel, 'keep', 'utf8');
  try {
    result = spawnSync(process.execPath, ['build/build-loader.cjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FABUI_DIST_DIR: tempDir })
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(fs.readdirSync(tempDir).sort(), [
      'fabLoader.js',
      'fabLoader.min.js',
      'fabui.js'
    ]);
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'keep');
    output = fs.readFileSync(path.join(tempDir, 'fabLoader.js'), 'utf8');
    minifiedOutput = fs.readFileSync(
      path.join(tempDir, 'fabLoader.min.js'),
      'utf8'
    );
    assert.match(output, /global\.fabLoader = api/);
    assert.doesNotMatch(output, /\b(?:import|export)\s/);
    assert.doesNotMatch(minifiedOutput, /\b(?:import|export)\s/);
    assert.ok(minifiedOutput.length < output.length);

    context = {};
    vm.createContext(context);
    vm.runInContext(minifiedOutput, context);
    assert.equal(context.fabLoader.version, '0.12.0');
    assert.equal(context.fabLoader.dom, context.fabDom);
    assert.equal(context.$, context.fabDom);

    result = spawnSync(process.execPath, ['build/build-loader.cjs', 'min'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FABUI_DIST_DIR: tempDir })
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(fs.readdirSync(tempDir).sort(), [
      'fabLoader.min.js',
      'fabui.js'
    ]);
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'keep');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('the production Diagram Demo loads every external dependency through fabLoader', function() {
  var html = fs.readFileSync('demo/diagram.html', 'utf8');

  assert.match(html, /dist\/fabLoader\.js\?v=20260724-loader-v14/);
  assert.doesNotMatch(html, /\.styles\(/);
  assert.doesNotMatch(html, /\.queue\(\)/);
  assert.match(
    html,
    /\.style\(\[\s*'\.\.\/dist\/fabui\.css/
  );
  assert.match(
    html,
    /\.style\(\[[\s\S]*?'\.\.\/dist\/fabui\.diagram\.css/
  );
  assert.match(
    html,
    /\.script\(\[[\s\S]*?'\.\.\/dist\/fabui\.min\.js/
  );
  assert.match(
    html,
    /\.script\(\s*'\.\/js\/theme-loader\.js/
  );
  assert.match(
    html,
    /\.script\(\s*'\.\.\/dist\/fabui\.diagram\.min\.js/
  );
  assert.match(
    html,
    /\.script\(\s*'\.\/js\/diagram-demo\.js/
  );
  assert.match(
    html,
    /\.module\(\s*'\.\/js\/dist-controls\.js/
  );
  assert.match(
    html,
    /\.script\(\[[\s\S]*?'https:\/\/cdn\.jsdelivr\.net\/npm\/dayjs@1\.11\.13\/dayjs\.min\.js'/
  );
  assert.match(
    html,
    /window\.dayjs\('2026-07-23'\)\.format\('YYYY\/MM\/DD'\)/
  );
  assert.match(
    html,
    /return window\.fabLoader\.mountHtml\('#test', '\.\/test\.html'\)/
  );
  assert.doesNotMatch(
    html,
    /<script src="https:\/\/cdn\.jsdelivr\.net/
  );
  assert.doesNotMatch(
    html,
    /<link rel="stylesheet" href="\.\.\/dist\/fabui/
  );
  assert.doesNotMatch(
    html,
    /<script src="\.\.\/dist\/fabui(?:\.diagram)?(?:\.min)?\.js/
  );
  assert.doesNotMatch(
    html,
    /<script(?: type="module")? src="\.\/js\/(?:theme-loader|diagram-demo|dist-controls)\.js/
  );
});

test('the manual CDN page loads Day.js through the chain API', function() {
  var html = fs.readFileSync('test/fab-loader-cdn.html', 'utf8');

  assert.match(html, /dist\/fabLoader\.js\?v=20260724-loader-v14/);
  assert.match(
    html,
    /\.script\('https:\/\/cdn\.jsdelivr\.net\/npm\/dayjs@1\.11\.13\/dayjs\.min\.js'\)/
  );
  assert.match(html, /\.run\(function\(\)/);
  assert.match(html, /window\.dayjs\('2026-07-23'\)\.format\('YYYY\/MM\/DD'\)/);
  assert.doesNotMatch(
    html,
    /<script src="https:\/\/cdn\.jsdelivr\.net/
  );
});

test('demo2 keeps optional Vue and React runtimes local and loads them through fabLoader', function() {
  var html = fs.readFileSync('demo2/index.html', 'utf8');
  var vueConfig = fs.readFileSync('demo2/systemjs.config.js', 'utf8');
  var runtimeConfig = fs.readFileSync('demo2/runtime.config.js', 'utf8');
  var vueComponent = fs.readFileSync('demo2/components/hello.vue', 'utf8');
  var reactComponent = fs.readFileSync('demo2/components/hello.jsx', 'utf8');
  var demoCss = fs.readFileSync('demo2/styles/demo.css', 'utf8');
  var fragment = fs.readFileSync('demo2/fragments/sample.html', 'utf8');
  var jquery = fs.readFileSync(
    'demo2/vendor/jquery-4.0.0.slim.min.js',
    'utf8'
  );

  assert.match(
    html,
    /<script src="\.\.\/dist\/fabLoader\.js\?v=20260724-loader-v14"><\/script>/
  );
  assert.match(
    html,
    /\.script\('\.\/vendor\/jquery-4\.0\.0\.slim\.min\.js'\)/
  );
  assert.doesNotMatch(html, /\.script\('\.\.\/dist\/fabDom\.js/);
  assert.match(
    html,
    /Uncomment the next line to let jQuery own the `\$` alias/
  );
  assert.match(html, /\.style\(\[[\s\S]*?'\.\/styles\/demo\.css'/);
  assert.match(html, /'\.\.\/dist\/fabui\.min\.css'/);
  assert.match(html, /\.module\('\.\/assets\/demo-module\.js'\)/);
  assert.match(html, /var \$;/);
  assert.match(html, /\$ = fabLoader\.useDom\(\)/);
  assert.doesNotMatch(html, /window\.\$ === window\.(?:jQuery|fabLoader\.dom)/);
  assert.match(html, /\.script\('\.\.\/dist\/fabui\.min\.js'\)/);
  assert.match(html, /new fabui\.EditBox\('#fabui-editbox'/);
  assert.match(html, /new fabui\.EditBox\('#fabui-numberbox'/);
  assert.match(html, /new fabui\.Button\('#fabui-button'/);
  assert.match(html, /new fabui\.CheckBox\('#fabui-checkbox'/);
  assert.match(html, /new fabui\.RadioButton\('#fabui-radio-a'/);
  assert.match(html, /new fabui\.SwitchButton\('#fabui-switch'/);
  assert.equal(
    (html.match(/class="fabui-component-card"/g) || []).length,
    4
  );
  [
    'fabui-tabs',
    'fabui-calendar',
    'fabui-accordion',
    'fabui-menu-button',
    'fabui-tooltip',
    'fabui-output'
  ].forEach(function(id) {
    assert.doesNotMatch(html, new RegExp(id));
  });
  assert.doesNotMatch(
    html,
    /new fabui\.(?:Tabs|Calendar|Accordion|MenuButton|Tooltip)\(/
  );
  assert.match(demoCss, /\.fabui-demo button,/);
  assert.match(demoCss, /\.fabui-demo input,/);
  assert.match(demoCss, /\.fabui-demo label,/);
  assert.match(demoCss, /\.fabui-demo select,/);
  assert.match(demoCss, /\.fabui-demo textarea,/);
  assert.match(demoCss, /\.fabui-demo a,/);
  assert.match(demoCss, /\.fabui-hostile-element:is\(/);
  [
    'div',
    'span',
    'img',
    'svg',
    'canvas',
    'table',
    'ul',
    'li'
  ].forEach(function(tagName) {
    assert.match(demoCss, new RegExp('\\n  ' + tagName + ',?'));
  });
  assert.match(
    html,
    /fabLoader\.preloadImage\(\{\s*loader: '\.\/assets\/fab-loader\.svg',\s*unlock: '\.\/assets\/unlocked32\.png'\s*\}\)/
  );
  assert.match(html, /window\.myImage = images/);
  assert.match(
    html,
    /\$\('#image-demo'\)\.append\(myImage\.loader\)[\s\S]*?\$\('#image-demo2'\)\.append\(myImage\.unlock\)/
  );
  assert.match(html, /fabLoader\.loadHtml\('\.\/fragments\/sample\.html'\)/);
  assert.doesNotMatch(
    html,
    /fabLoader\.mountHtml\('#html-demo', '\.\/fragments\/sample\.html'\)/
  );
  assert.match(
    html,
    /var \$htmlDemo = \$\('#html-demo'\)/
  );
  assert.match(
    html,
    /typeof \$htmlDemo\.load !== 'function'[\s\S]*?\$htmlDemo = fabLoader\.dom\('#html-demo'\)/
  );
  assert.match(
    html,
    /\$htmlDemo\.load\(\s*'\.\/fragments\/sample\.html',\s*function\(html, status, result\)/
  );
  assert.doesNotMatch(html, /\$\('#html-demo'\)\.html\(html\)/);
  assert.match(html, /\$\('body'\)\.addClass\('has-error'\)/);
  assert.doesNotMatch(
    html,
    /document\.body\.classList\.add\('has-error'\)/
  );
  assert.match(
    html,
    /console\.error\('fabLoader 測試失敗：' \+ message, error\)/
  );
  assert.doesNotMatch(html, /alert\('fabLoader 測試失敗：'/);
  assert.match(html, /\$\('#html-script-result'\)\.html\(/);
  assert.doesNotMatch(html, /demo2DomLibrary|data-dom-library/);
  assert.doesNotMatch(fragment, /<script>/);
  assert.match(jquery, /jQuery v4\.0\.0\+slim/);
  assert.match(html, /'\.\/vendor\/vue\.min\.js'/);
  assert.match(html, /'\.\/vendor\/system\.js'/);
  assert.match(html, /'\.\/vendor\/react-runtime\.min\.js'/);
  assert.match(html, /\.script\('\.\/systemjs\.config\.js'\)/);
  assert.match(html, /\.script\('\.\/runtime\.config\.js'\)/);
  assert.match(html, /\.vue\('\.\/components\/hello\.vue'\)/);
  assert.match(html, /\.react\('\.\/components\/hello\.jsx'\)/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(vueConfig, /node_modules|https?:\/\//);
  assert.match(vueConfig, /\/\/for vue/);
  assert.match(vueConfig, /'\.\/vendor\/systemjs-vue-browser\.js'/);
  assert.match(vueConfig, /'\*\.vue'/);
  assert.doesNotMatch(vueConfig, /react|jsx|plugin-babel/i);
  assert.match(runtimeConfig, /\/\/ for react/);
  assert.match(runtimeConfig, /'\.\/vendor\/plugin-babel\.js'/);
  assert.match(runtimeConfig, /'\.\/vendor\/systemjs-babel-browser\.js'/);
  assert.match(runtimeConfig, /'\*\.jsx'/);
  assert.doesNotMatch(runtimeConfig, /node_modules|https?:\/\//);
  assert.match(vueComponent, /new Vue\(\{/);
  assert.match(vueComponent, /el: '#vue-demo'/);
  assert.match(reactComponent, /function HelloReact\(\)/);
  assert.match(reactComponent, /ReactDOMClient\.createRoot\(/);
  assert.match(reactComponent, /\$\('#react-demo'\)\.get\(0\)/);
  [
    html,
    reactComponent,
    vueComponent,
    fs.readFileSync('demo2/assets/demo-helper.js', 'utf8'),
    fs.readFileSync('demo2/assets/demo-module.js', 'utf8')
  ].forEach(function(sourceText) {
    assert.doesNotMatch(
      sourceText,
      /document\.(?:getElementById|querySelector|querySelectorAll)/
    );
  });
  [
    'demo2/vendor/jquery-4.0.0.slim.min.js',
    'demo2/vendor/LICENSE-jQuery.txt',
    'demo2/vendor/vue.min.js',
    'demo2/vendor/system.js',
    'demo2/vendor/systemjs-vue-browser.js',
    'demo2/vendor/react-runtime.min.js',
    'demo2/vendor/plugin-babel.js',
    'demo2/vendor/systemjs-babel-browser.js',
    'demo2/vendor/LICENSE-Vue.txt',
    'demo2/vendor/LICENSE-SystemJS.txt',
    'demo2/vendor/LICENSE-systemjs-vue-browser.txt',
    'demo2/vendor/LICENSE-React.txt',
    'demo2/vendor/LICENSE-systemjs-plugin-babel.txt'
  ].forEach(function(file) {
    assert.equal(fs.existsSync(file), true, file);
  });
});

test('the Diagram HTML fragment marks its inline script execution', function() {
  var html = fs.readFileSync('demo/test.html', 'utf8');

  assert.match(html, /<h1>Test Page<\/h1>/);
  assert.match(
    html,
    /getElementById\('test'\)\.setAttribute\('data-script-executed', 'true'\)/
  );
  assert.match(html, /console\.log\('test page'\)/);
});
