const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = process.env.FABUI_DIST_DIR ?
  path.resolve(process.env.FABUI_DIST_DIR) :
  path.join(root, 'dist');
const filesystemRoot = path.parse(distDir).root;

if (distDir === root || distDir === filesystemRoot) {
  throw new Error('Refusing to clear an unsafe dist directory.');
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

console.log('Cleared FabUI dist directory.');
