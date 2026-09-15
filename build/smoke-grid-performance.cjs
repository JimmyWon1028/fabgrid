const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const port = 4178;
const debuggerPort = 9228;
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml'
};
const thresholds = {
  initialRenderMs: Number(process.env.FABGRID_BROWSER_INITIAL_MAX_MS || 1500),
  scrollRenderMs: Number(process.env.FABGRID_BROWSER_SCROLL_MAX_MS || 250),
  rapidScrollMaxHandlerMs: Number(process.env.FABGRID_BROWSER_RAPID_SCROLL_HANDLER_MAX_MS || 8),
  searchColdMs: Number(process.env.FABGRID_BROWSER_SEARCH_COLD_MAX_MS || 500),
  searchCachedMs: Number(process.env.FABGRID_BROWSER_SEARCH_CACHED_MAX_MS || 100),
  searchProgressiveMs: Number(process.env.FABGRID_BROWSER_SEARCH_PROGRESSIVE_MAX_MS || 100),
  unchangedEditMoveMs: Number(process.env.FABGRID_BROWSER_EDIT_MOVE_MAX_MS || 100),
  repeatedEditMoveMaxMs: Number(process.env.FABGRID_BROWSER_EDIT_REPEAT_MAX_MS || 100)
};

function serveFile(req, res) {
  const urlPath = req.url.split('?')[0] === '/' ?
    '/test/grid-performance-smoke.html' :
    req.url.split('?')[0];
  const filePath = path.normalize(path.join(root, urlPath));
  if (filePath !== root && filePath.indexOf(root + path.sep) !== 0) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, function(error, body) {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(filePath)] || 'text/plain; charset=utf-8'
    });
    res.end(body);
  });
}

function delay(milliseconds) {
  return new Promise(function(resolve) {
    setTimeout(resolve, milliseconds);
  });
}

async function getDebuggerPage() {
  let response;
  let pages;
  let page;
  let attempt;
  for (attempt = 0; attempt < 100; attempt += 1) {
    try {
      response = await fetch('http://127.0.0.1:' + debuggerPort + '/json/list');
      pages = await response.json();
      page = pages.find(function(candidate) {
        return candidate.type === 'page' &&
          candidate.url.indexOf('chrome-extension://') !== 0;
      });
      if (page && page.webSocketDebuggerUrl) {
        return page;
      }
    } catch (error) {
      // Chrome may still be starting.
    }
    await delay(50);
  }
  throw new Error('Chrome DevTools endpoint did not become ready.');
}

function createCdpClient(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let nextId = 1;
  socket.addEventListener('message', function(event) {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) {
      request.reject(new Error(message.error.message));
    } else {
      request.resolve(message.result);
    }
  });
  return {
    ready: new Promise(function(resolve, reject) {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    }),
    call: function(method, params) {
      return new Promise(function(resolve, reject) {
        const id = nextId;
        nextId += 1;
        pending.set(id, { resolve: resolve, reject: reject });
        socket.send(JSON.stringify({ id: id, method: method, params: params || {} }));
      });
    },
    close: function() {
      socket.close();
    }
  };
}

async function runChrome() {
  const child = spawn(chromePath, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    '--remote-debugging-port=' + debuggerPort,
    'about:blank'
  ]);
  let errorOutput = '';
  let lastPageState = null;
  let client;
  child.stderr.on('data', function(chunk) {
    errorOutput += chunk.toString();
  });
  try {
    const page = await getDebuggerPage();
    client = createCdpClient(page.webSocketDebuggerUrl);
    await client.ready;
    await client.call('Page.enable');
    await client.call('Runtime.enable');
    await client.call('Page.navigate', {
      url: 'http://127.0.0.1:' + port + '/test/grid-performance-smoke.html'
    });
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const evaluation = await client.call('Runtime.evaluate', {
        expression: "(function(){var el=document.getElementById('result');return {url:location.href,readyState:document.readyState,complete:!!(el&&el.dataset.complete==='true'),text:el?el.textContent:null,hasGrid:!!document.querySelector('.fg-grid')};})()",
        returnByValue: true
      });
      lastPageState = evaluation.result && evaluation.result.value;
      if (lastPageState && lastPageState.complete) {
        return JSON.parse(lastPageState.text);
      }
      await delay(50);
    }
    throw new Error(
      'FabGrid browser performance test timed out. ' +
      JSON.stringify(lastPageState) + '\n' + errorOutput
    );
  } finally {
    if (client) client.close();
    child.kill();
  }
}

function verifyResult(result) {
  const failures = [];
  if (!result.passed) {
    failures.push(result.error || 'browser assertions failed');
  }
  Object.keys(thresholds).forEach(function(name) {
    if (!(result[name] <= thresholds[name])) {
      failures.push(name + ' ' + result[name] + ' > ' + thresholds[name]);
    }
  });
  if (failures.length) {
    throw new Error(
      'FabGrid browser performance smoke failed: ' + failures.join(', ') +
      '\n' + JSON.stringify(result, null, 2)
    );
  }
}

const server = http.createServer(serveFile);

server.listen(port, '127.0.0.1', async function() {
  try {
    const result = await runChrome();
    verifyResult(result);
    console.log(JSON.stringify({
      passed: true,
      metrics: result,
      thresholds: thresholds
    }, null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
