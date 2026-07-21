const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const port = 4177;
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

function serveFile(req, res) {
  const requestPath = req.url.split('?')[0] === '/' ?
    '/test/scheduler-smoke.html' :
    req.url.split('?')[0];
  const file = path.normalize(path.join(root, requestPath));
  if (file !== root && file.indexOf(root + path.sep) !== 0) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(file, function(error, body) {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'text/plain; charset=utf-8'
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
      '--virtual-time-budget=2500',
      '--dump-dom',
      'http://127.0.0.1:' + port + '/test/scheduler-smoke.html'
    ]);
    let output = '';
    let errors = '';
    child.stdout.on('data', function(chunk) {
      output += chunk.toString();
    });
    child.stderr.on('data', function(chunk) {
      errors += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', function(code) {
      if (code !== 0) {
        reject(new Error(errors || 'Chrome exited with code ' + code));
        return;
      }
      resolve(output);
    });
  });
}

function readResult(dom) {
  const match = /<pre id="result">([\s\S]*?)<\/pre>/.exec(dom);
  if (!match) throw new Error('Scheduler smoke result was not found.');
  return JSON.parse(
    match[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  );
}

const server = http.createServer(serveFile);

server.listen(port, '127.0.0.1', async function() {
  try {
    const result = readResult(await runChrome());
    if (
      !result.hasScheduler ||
      !result.schedulerIsSeparateScript ||
      !result.controlLookupWorks ||
      result.initialEvents < 2 ||
      result.monthCells !== 42 ||
      result.yearMonths !== 12 ||
      result.agendaEvents < 2 ||
      result.timelineTracks !== 1 ||
      !result.addUpdateWorks ||
      !result.dayViewWorks ||
      !result.localeWorks ||
      !result.themeMetadataWorks ||
      !result.viewMetadataWorks
    ) {
      throw new Error(
        'FabUI Scheduler smoke failed: ' + JSON.stringify(result)
      );
    }
    console.log('FabUI Scheduler smoke passed.');
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
