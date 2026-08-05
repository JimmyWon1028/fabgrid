import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

test('default build compiles FabUI core without wrapper bundles', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var buildSource = fs.readFileSync('build/build.cjs', 'utf8');
  var themeBuilderSource = fs.readFileSync('build/theme-builder.cjs', 'utf8');
  var smokeSource = fs.readFileSync('build/smoke.cjs', 'utf8');

  assert.equal(packageJson.scripts.build, 'node build/build.cjs');
  assert.doesNotMatch(
    buildSource,
    /rmSync\(distDir,\s*\{\s*recursive:\s*true/
  );
  assert.match(buildSource, /'fabui\.js',[\s\S]*'fabui\.min\.css'/);
  assert.match(
    buildSource,
    /rmSync\(path\.join\(distDir, 'theme'\), \{ recursive: true, force: true \}\)/
  );
  assert.match(buildSource, /'editbox\/time-editbox\.js'/);
  assert.match(buildSource, /'core\/clipboard\.js'/);
  assert.match(buildSource, /'core\/config\.js'/);
  assert.match(buildSource, /global\.fabui\.Clipboard = Clipboard/);
  assert.match(buildSource, /global\.fabui\.setConfig = setConfig/);
  assert.match(buildSource, /global\.fabui\.getConfig = getConfig/);
  assert.match(buildSource, /buildThemeOutput\(\{/);
  assert.match(themeBuilderSource, /path\.join\(outputThemeDir, 'mono'\)/);
  assert.match(
    smokeSource,
    /\(\?:diagram\|lite\|gantt\|scheduler\|htmleditor\)/
  );
  assert.match(smokeSource, /fabLoader\(\?:\\\.min\)\?\\\.js/);
  assert.doesNotMatch(smokeSource, /fabDom\(\?:\\\.min\)\?\\\.js/);
  assert.doesNotMatch(smokeSource, /wrapper outputs are incomplete/);
  assert.doesNotMatch(smokeSource, /'wrapper'/);
});

test('all build commands omit ESM output files', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var buildScripts = [
    'build/build.cjs',
    'build/build-lite.cjs',
    'build/build-diagram.cjs',
    'build/build-gantt.cjs',
    'build/build-scheduler.cjs',
    'build/build-htmleditor.cjs',
    'build/build-loader.cjs',
    'build/build-locale.cjs',
    'build/build-theme.cjs',
    'build/build-vue.cjs',
    'build/build-jquery.cjs'
  ];
  var vuePackage = JSON.parse(fs.readFileSync('packages/fabgrid-vue/package.json', 'utf8'));
  var jqueryPackage = JSON.parse(fs.readFileSync('packages/fabgrid-jquery/package.json', 'utf8'));

  assert.equal(packageJson.module, undefined);
  assert.equal(vuePackage.module, undefined);
  assert.equal(jqueryPackage.module, undefined);
  buildScripts.forEach(function(filePath) {
    var source = fs.readFileSync(filePath, 'utf8');
    assert.doesNotMatch(source, /format:\s*['"]esm['"]/, filePath);
    assert.doesNotMatch(source, /writeFileSync\([\s\S]{0,160}\.esm\./, filePath);
  });
});

test('default build preserves public constructor names and descendant pseudo selectors', function() {
  var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fabui-core-build-'));
  var result;
  var context;
  var minifiedCss;

  try {
    result = spawnSync(process.execPath, ['build/build.cjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FABUI_DIST_DIR: tempDir })
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    minifiedCss = fs.readFileSync(path.join(tempDir, 'fabui.min.css'), 'utf8');
    assert.match(minifiedCss, /:root :is\(/);
    assert.match(minifiedCss, /:root :where\(/);
    assert.doesNotMatch(minifiedCss, /:root:is\(/);
    assert.doesNotMatch(minifiedCss, /:root:where\(/);
    context = {};
    context.window = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(tempDir, 'fabui.min.js'), 'utf8'), context);
    assert.equal(context.fabui.FabGrid.name, 'FabGrid');
    assert.equal(typeof context.fabui.Clipboard.copy, 'function');
    assert.equal(context.fabui.CellType.Cell, 1);
    assert.equal(context.fabui.FabGrid.CellType, undefined);
    assert.equal(typeof context.fabui.chart.animation.ChartAnimation, 'function');
    assert.equal(typeof context.fabui.collections.CollectionView, 'function');
    assert.deepEqual(
      Array.from(context.fabui.getLocales()),
      ['en']
    );
    context.fabui.setLocale('zh-TW');
    assert.equal(context.fabui.getLocale(), 'en');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('theme build supports regular and min-only isolated output', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fabui-theme-build-'));
  var sentinel = path.join(tempDir, 'fabui.lite.min.js');
  var result;
  var themeFiles;

  assert.equal(packageJson.scripts['build:theme'], 'node build/build-theme.cjs');
  fs.writeFileSync(sentinel, 'keep', 'utf8');
  try {
    result = spawnSync(process.execPath, ['build/build-theme.cjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FABUI_DIST_DIR: tempDir })
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    themeFiles = fs.readdirSync(path.join(tempDir, 'theme'));
    assert.equal(themeFiles.filter(function(file) {
      return /^fabui\..+\.css$/i.test(file) && !/\.min\.css$/i.test(file);
    }).length, 17);
    assert.equal(themeFiles.filter(function(file) {
      return /^fabui\..+\.min\.css$/i.test(file);
    }).length, 17);
    assert.equal(themeFiles.includes('fabui.default.css'), true);
    assert.equal(themeFiles.includes('fabui.default.min.css'), true);

    result = spawnSync(process.execPath, ['build/build-theme.cjs', 'min'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FABUI_DIST_DIR: tempDir })
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    themeFiles = fs.readdirSync(path.join(tempDir, 'theme'));
    assert.equal(themeFiles.filter(function(file) {
      return /^fabui\..+\.min\.css$/i.test(file);
    }).length, 17);
    assert.equal(themeFiles.filter(function(file) {
      return /^fabui\..+\.css$/i.test(file) && !/\.min\.css$/i.test(file);
    }).length, 0);
    assert.equal(themeFiles.includes('fabui.default.min.css'), true);
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'keep');
    assert.equal(fs.existsSync(path.join(tempDir, 'theme', 'mono', 'pagination-next.svg')), true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('locale build supports regular and min-only isolated output', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fabui-locale-build-'));
  var sentinel = path.join(tempDir, 'fabui.min.js');
  var result;
  var localeDir;
  var context;

  assert.equal(packageJson.scripts['build:locale'], 'node build/build-locale.cjs');
  fs.writeFileSync(sentinel, 'keep', 'utf8');
  try {
    result = spawnSync(process.execPath, ['build/build-locale.cjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FABUI_DIST_DIR: tempDir })
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    localeDir = path.join(tempDir, 'locales');
    assert.deepEqual(fs.readdirSync(localeDir).sort(), [
      'fabui-locale.en.js',
      'fabui-locale.en.min.js',
      'fabui-locale.zh-CN.js',
      'fabui-locale.zh-CN.min.js',
      'fabui-locale.zh-TW.js',
      'fabui-locale.zh-TW.min.js'
    ]);
    context = { registered: {} };
    context.window = context;
    context.fabui = {
      addLocale: function(name, pack) {
        context.registered[name] = pack;
      }
    };
    vm.createContext(context);
    vm.runInContext(
      fs.readFileSync(path.join(localeDir, 'fabui-locale.en.min.js'), 'utf8'),
      context
    );
    assert.ok(context.registered.en);
    vm.runInContext(
      fs.readFileSync(path.join(localeDir, 'fabui-locale.zh-TW.min.js'), 'utf8'),
      context
    );
    assert.equal(
      context.registered['zh-TW'].FabGrid.pagination.ariaLabel,
      '分頁導覽'
    );
    assert.equal(context.registered['zh-TW'].Diagram.snapSize, '吸附間距');

    result = spawnSync(process.execPath, ['build/build-locale.cjs', 'min'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FABUI_DIST_DIR: tempDir })
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(fs.readdirSync(localeDir).sort(), [
      'fabui-locale.en.min.js',
      'fabui-locale.zh-CN.min.js',
      'fabui-locale.zh-TW.min.js'
    ]);
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'keep');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Lite build keeps Mono assets in the shared flat directory', function() {
  var buildSource = fs.readFileSync('build/build-lite.cjs', 'utf8');

  assert.match(buildSource, /replace\('theme\/mono\/images\/', 'theme\/mono\/'\)/);
  assert.match(
    buildSource,
    /rmSync\(path\.join\(distDir, 'theme', 'mono', 'images'\), \{ recursive: true, force: true \}\)/
  );
});

test('Lite build supports min-only isolated output', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fabui-lite-build-'));
  var sentinel = path.join(tempDir, 'fabui.min.js');
  var result;
  var context;

  assert.equal(packageJson.scripts['build:lite'], 'node build/build-lite.cjs');
  fs.writeFileSync(sentinel, 'keep', 'utf8');
  try {
    result = spawnSync(process.execPath, ['build/build-lite.cjs', 'min'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: Object.assign({}, process.env, { FABUI_DIST_DIR: tempDir })
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.min.js')), true);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.min.css')), true);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.js')), false);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.css')), false);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.esm.js')), false);
    assert.equal(fs.existsSync(path.join(tempDir, 'fabui.lite.esm.min.js')), false);
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'keep');
    context = {};
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(tempDir, 'fabui.lite.min.js'), 'utf8'), context);
    assert.equal(typeof context.fabui.FabGrid, 'function');
    assert.equal(typeof context.fabui.Clipboard.copy, 'function');
    assert.equal(context.fabui.CellType.Cell, 1);
    assert.equal(context.fabui.FabGrid.CellType, undefined);
    assert.equal(typeof context.fabui.chart.animation.ChartAnimation, 'function');
    assert.equal(typeof context.fabui.collections.CollectionView, 'function');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
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

test('build command contract supports comma-separated scopes', function() {
  var packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  var agents = fs.readFileSync('AGENTS.md', 'utf8');
  var readme = fs.readFileSync('README.md', 'utf8');
  var readmeZh = fs.readFileSync('README.zh-TW.md', 'utf8');

  assert.match(agents, /`build`／`build fabui`/);
  assert.match(agents, /`build <scope>,<scope> \[min\]`/);
  assert.match(agents, /`build fabui,htmleditor min`/);
  assert.match(agents, /`build locale`/);
  assert.match(agents, /`build locale min`/);
  assert.match(
    packageJson.scripts['build:all'],
    /npm run build:locale && npm run build:vue && npm run build:jquery && npm run build:fabui-jquery$/
  );
  assert.match(agents, /`build htmleditor min`/);
  assert.match(agents, /`build fabloader`/);
  assert.match(agents, /`build fabloader min`/);
  assert.match(agents, /`build loader`/);
  assert.match(agents, /`build loader min`/);
  assert.doesNotMatch(agents, /`build dom(?: min)?`/);
  assert.match(agents, /逗號左右不得有空白/);
  assert.match(agents, /`all` 與 `clear` 必須單獨使用/);
  assert.match(readme, /`build fabui,htmleditor min`/);
  assert.match(readme, /`npm run build:locale`/);
  assert.match(readme, /`build locale min` maps to `npm run build:locale -- min`/);
  assert.match(readme, /`build fabloader min`/);
  assert.match(readme, /`build loader min`/);
  assert.doesNotMatch(readme, /`build dom(?: min)?`/);
  assert.match(
    readme,
    /`build htmleditor min` maps to `npm run build:htmleditor -- min`/
  );
  assert.match(
    readme,
    /`dist\/fabui\.htmleditor\.min\.js` and `dist\/fabui\.htmleditor\.min\.css`/
  );
  assert.match(
    readme,
    /`fabui`, `lite`, `diagram`, `gantt`, `scheduler`, `htmleditor`, `theme`, and `locale`/
  );
  assert.match(readmeZh, /`npm run build:locale`/);
  assert.match(readmeZh, /`build locale min` 對應 `npm run build:locale -- min`/);
  assert.match(readmeZh, /`build fabloader min`/);
  assert.match(readmeZh, /`build loader min`/);
});
