import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('default build compiles FabUI core without wrapper bundles', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var smokeSource = fs.readFileSync('build/smoke.cjs', 'utf8');

  assert.equal(packageJson.scripts.build, 'node build/build.cjs');
  assert.doesNotMatch(smokeSource, /wrapper outputs are incomplete/);
  assert.doesNotMatch(smokeSource, /'wrapper'/);
});

test('EditBox jQuery wrapper remains removed', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var removedPaths = [
    'build/build-editbox-jquery.cjs',
    'demo/dev-editbox-jquery.html',
    'demo/editbox-jquery.html',
    'demo/js/editbox-jquery-demo.js',
    'dist/wrapper/fabeditbox-jquery.min.js',
    'docs/editbox-jquery-api.md',
    'packages/fabeditbox-jquery/index.d.ts',
    'packages/fabeditbox-jquery/package.json',
    'packages/fabeditbox-jquery/dist/fabeditbox-jquery.js',
    'packages/fabeditbox-jquery/src/fabeditbox-jquery.js',
    'test/editbox-jquery-wrapper.test.js'
  ];

  assert.equal(packageJson.scripts['build:editbox-jquery'], undefined);
  assert.equal(packageJson.scripts['build:jquery'], 'node build/build-jquery.cjs');
  removedPaths.forEach(function(filePath) {
    assert.equal(fs.existsSync(filePath), false, filePath + ' should not exist');
  });
});
