const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const distDir = process.env.FABUI_DIST_DIR ?
  path.resolve(process.env.FABUI_DIST_DIR) :
  path.join(root, 'dist');
const port = 4176;
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

function serveFile(req, res) {
  const urlPath = req.url.split('?')[0] === '/' ?
    '/test/gantt-smoke.html' :
    req.url.split('?')[0];
  const baseDir = urlPath.indexOf('/dist/') === 0 ? distDir : root;
  const relativePath = urlPath.indexOf('/dist/') === 0 ?
    urlPath.slice('/dist/'.length) :
    urlPath;
  const filePath = path.normalize(path.join(baseDir, relativePath));
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
      'http://127.0.0.1:' + port + '/test/gantt-smoke.html'
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
  if (!match) throw new Error('Gantt smoke result was not found.');
  return JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
}

const server = http.createServer(serveFile);

server.listen(port, '127.0.0.1', async function() {
  try {
    const result = extractResult(await runChrome());
    const failures = Object.keys(result).filter(function(key) {
      return key === 'coreHasGanttBeforeExtension' ? result[key] !== false : result[key] !== true &&
        !['taskRows', 'taskBars', 'dependencyPaths', 'milestoneBars'].includes(key);
    });
    if (
      result.taskRows !== 3 ||
      result.taskBars !== 3 ||
      result.dependencyPaths !== 1 ||
      result.milestoneBars !== 1
    ) {
      failures.push('renderCounts');
    }
    if (failures.length) {
      throw new Error('Gantt smoke checks failed: ' + failures.join(', '));
    }
    console.log('FabUI Gantt browser smoke passed.');
    server.close();
  } catch (error) {
    console.error(error);
    server.close(function() {
      process.exitCode = 1;
    });
  }
});
