const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const distDir = process.env.FABUI_DIST_DIR ?
  path.resolve(process.env.FABUI_DIST_DIR) :
  path.join(root, 'dist');
const port = 4177;
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const requestCounts = Object.create(null);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8'
};

function serveFile(req, res) {
  const urlPath = req.url.split('?')[0] === '/' ?
    '/test/fab-loader-smoke.html' :
    req.url.split('?')[0];
  const baseDir = urlPath.indexOf('/dist/') === 0 ? distDir : root;
  const relativePath = urlPath.indexOf('/dist/') === 0 ?
    urlPath.slice('/dist/'.length) :
    urlPath;
  const filePath = path.normalize(path.join(baseDir, relativePath));

  requestCounts[urlPath] = (requestCounts[urlPath] || 0) + 1;
  if (filePath !== baseDir && filePath.indexOf(baseDir + path.sep) !== 0) {
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

function runChrome() {
  return new Promise(function(resolve, reject) {
    const child = spawn(chromePath, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--virtual-time-budget=3000',
      '--dump-dom',
      'http://127.0.0.1:' + port + '/test/fab-loader-smoke.html'
    ]);
    let output = '';
    let errorOutput = '';

    child.stdout.on('data', function(chunk) {
      output += chunk.toString();
    });
    child.stderr.on('data', function(chunk) {
      errorOutput += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', function(code) {
      if (code !== 0) {
        reject(new Error(errorOutput || 'Chrome exited with code ' + code));
        return;
      }
      resolve(output);
    });
  });
}

function extractResult(dom) {
  const match = dom.match(/<pre id="result">([\s\S]*?)<\/pre>/);
  if (!match) throw new Error('fabLoader smoke result was not found.');
  return JSON.parse(
    match[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  );
}

function verifyResult(result) {
  const required = [
    'passed',
    'globalPublished',
    'waitAlias',
    'domPublished',
    'configDefaults',
    'queuePassed',
    'scriptDeduplicated',
    'cssDeduplicated',
    'cssApplied',
    'imageDeduplicated',
    'imageArrayReusable',
    'imageMapReusable',
    'htmlDeduplicated',
    'htmlArrayLoaded',
    'htmlMapLoaded',
    'htmlCached',
    'textSharedWithHtml',
    'textCached',
    'xmlParsed',
    'xmlTextCached',
    'htmlMounted',
    'relativeScriptLoaded',
    'scriptsOrdered',
    'scriptTouchedDom'
  ];
  required.forEach(function(name) {
    if (!result[name]) throw new Error('fabLoader smoke failed: ' + name);
  });
  [
    '/test/fixtures/fab-loader-script.js',
    '/test/fixtures/fab-loader.css',
    '/test/fixtures/fab-loader-image.svg',
    '/test/fixtures/fab-loader-fragment.html',
    '/test/fixtures/fab-loader-text.txt',
    '/test/fixtures/fab-loader-data.xml',
    '/test/fixtures/fab-loader-mounted-script.js',
    '/test/fixtures/fab-loader-module.js'
  ].forEach(function(url) {
    if (requestCounts[url] !== 1) {
      throw new Error(
        'fabLoader requested ' + url + ' ' + (requestCounts[url] || 0) + ' times.'
      );
    }
  });
}

const server = http.createServer(serveFile);

server.listen(port, '127.0.0.1', async function() {
  try {
    const dom = await runChrome();
    const result = extractResult(dom);
    verifyResult(result);
    console.log('fabLoader browser smoke passed.');
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
