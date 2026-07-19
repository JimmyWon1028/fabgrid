import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { request as requestHttps } from 'node:https';
import { extname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.FABGRID_REMOTE_DEMO_PORT || 4175);
const PROJECT_ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const REMOTE_PATH = '/__fabgrid_remote_data__';
const REMOTE_DATA_URL = new URL(
  'https://www.jeasyui.com/demo/main/datagrid27_getdata.php'
);
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8'
  });
  response.end(message);
}

function readRequestBody(request) {
  return new Promise(function(resolveBody, rejectBody) {
    var chunks = [];
    var size = 0;
    request.on('data', function(chunk) {
      size += chunk.length;
      if (size > 8192) {
        rejectBody(new Error('Request body is too large.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', function() {
      resolveBody(Buffer.concat(chunks).toString('utf8'));
    });
    request.on('error', rejectBody);
  });
}

function requestRemoteData(params) {
  return new Promise(function(resolveData, rejectData) {
    var page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
    var rows = 1000;
    var body = new URLSearchParams({
      page: String(page),
      rows: String(rows)
    }).toString();
    var upstream = requestHttps(REMOTE_DATA_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Content-Length': Buffer.byteLength(body),
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Origin: 'https://www.jeasyui.com',
        Referer: 'https://www.jeasyui.com/tutorial/datagrid/datagrid27_demo.html',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
          'AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36'
      }
    }, function(upstreamResponse) {
      var chunks = [];
      upstreamResponse.on('data', function(chunk) {
        chunks.push(chunk);
      });
      upstreamResponse.on('end', function() {
        var text = Buffer.concat(chunks).toString('utf8');
        var data;
        if (upstreamResponse.statusCode < 200 || upstreamResponse.statusCode >= 300) {
          rejectData(new Error('Remote request failed with HTTP ' + upstreamResponse.statusCode + '.'));
          return;
        }
        try {
          data = JSON.parse(text);
        } catch (error) {
          rejectData(new Error('Remote endpoint did not return valid JSON.'));
          return;
        }
        if (!data || !Array.isArray(data.rows)) {
          rejectData(new Error('Remote endpoint returned an invalid EasyUI data response.'));
          return;
        }
        resolveData(data);
      });
    });
    upstream.on('error', rejectData);
    upstream.setTimeout(15000, function() {
      upstream.destroy(new Error('Remote request timed out.'));
    });
    upstream.end(body);
  });
}

async function serveRemoteData(request, response) {
  var body;
  var params;
  var data;
  if (request.method !== 'POST') {
    sendText(response, 405, 'Method not allowed.');
    return;
  }
  try {
    body = await readRequestBody(request);
    params = new URLSearchParams(body);
    data = await requestRemoteData(params);
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8'
    });
    response.end(JSON.stringify(data));
  } catch (error) {
    sendText(response, 502, error && error.message ? error.message : 'Remote request failed.');
  }
}

function serveStaticFile(request, response) {
  var requestUrl = new URL(request.url, 'http://127.0.0.1');
  var pathname = decodeURIComponent(requestUrl.pathname);
  var relativePath;
  var filePath;
  var fileStat;
  if (pathname === '/') {
    response.writeHead(302, { Location: '/demo/dev-grid-remote.html' });
    response.end();
    return;
  }
  relativePath = normalize(pathname).replace(/^[/\\]+/, '');
  filePath = resolve(PROJECT_ROOT, relativePath);
  if (filePath !== PROJECT_ROOT && !filePath.startsWith(PROJECT_ROOT + sep)) {
    sendText(response, 403, 'Forbidden.');
    return;
  }
  try {
    fileStat = statSync(filePath);
  } catch (error) {
    sendText(response, 404, 'Not found.');
    return;
  }
  if (!fileStat.isFile()) {
    sendText(response, 404, 'Not found.');
    return;
  }
  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Length': fileStat.size,
    'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream'
  });
  createReadStream(filePath).pipe(response);
}

const server = createServer(function(request, response) {
  var requestUrl = new URL(request.url, 'http://127.0.0.1');
  if (requestUrl.pathname === REMOTE_PATH) {
    serveRemoteData(request, response);
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(response, 405, 'Method not allowed.');
    return;
  }
  serveStaticFile(request, response);
});

server.listen(PORT, '127.0.0.1', function() {
  console.log(
    'FabGrid remote demo: http://127.0.0.1:' +
      PORT +
      '/demo/dev-grid-remote.html'
  );
});
