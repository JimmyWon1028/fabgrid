const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const compiler = require('vue-template-compiler');
const transpileTemplate = require('vue-template-es2015-compiler');

const root = path.resolve(__dirname, '..');
const demoDir = path.join(root, 'demo');
const entryFile = path.join(demoDir, 'vue2-sfc-entry.js');
const componentFile = path.join(demoDir, 'vue2-grid.vue');
const outputDir = path.join(demoDir, 'build');
const componentSource = fs.readFileSync(componentFile, 'utf8');
const component = compiler.parseComponent(componentSource, { pad: 'line' });

function createVuePlugin() {
  return {
    name: 'fabgrid-vue2-sfc',
    setup: function(build) {
      build.onLoad({ filter: /\.vue$/ }, function(args) {
        const source = fs.readFileSync(args.path, 'utf8');
        const descriptor = compiler.parseComponent(source, { pad: 'line' });
        const compiled = compiler.compile(descriptor.template ? descriptor.template.content : '<div></div>');
        const script = descriptor.script ? descriptor.script.content : 'export default {}';
        const scriptWithoutDefaultExport = script.replace(/export\s+default/, 'const component =');
        const render = transpileTemplate('function render() {' + compiled.render + '}');
        const staticRenderFns = compiled.staticRenderFns.map(function(code) {
          return transpileTemplate('function() {' + code + '}');
        });
        if (compiled.errors && compiled.errors.length) {
          throw new Error('Vue template compilation failed:\n' + compiled.errors.join('\n'));
        }
        return {
          contents: scriptWithoutDefaultExport + '\n' +
            'component.render = ' + render + ';\n' +
            'component.staticRenderFns = [' + staticRenderFns.join(',') + '];\n' +
            'component._compiled = true;\n' +
            'export default component;\n',
          loader: 'js',
          resolveDir: path.dirname(args.path)
        };
      });
    }
  };
}

async function buildJavaScript() {
  await esbuild.build({
    entryPoints: [entryFile],
    outfile: path.join(outputDir, 'vue2-grid.js'),
    bundle: true,
    format: 'iife',
    target: ['es2017'],
    legalComments: 'none',
    plugins: [createVuePlugin()]
  });
}

async function buildStyles() {
  const styles = component.styles.map(function(style) {
    return style.content;
  }).join('\n');
  await esbuild.build({
    stdin: {
      contents: styles,
      loader: 'css',
      resolveDir: demoDir,
      sourcefile: 'vue2-grid.vue.css'
    },
    outfile: path.join(outputDir, 'vue2-grid.css'),
    bundle: true,
    loader: {
      '.gif': 'file',
      '.jpg': 'file',
      '.jpeg': 'file',
      '.png': 'file',
      '.svg': 'file'
    },
    assetNames: 'assets/[name]-[hash]',
    legalComments: 'none'
  });
}

async function main() {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  await Promise.all([buildJavaScript(), buildStyles()]);
  ['vue2-grid.js', 'vue2-grid.css'].forEach(function(name) {
    const file = path.join(outputDir, name);
    if (!fs.existsSync(file) || !fs.statSync(file).size) throw new Error('Missing Vue Demo output: ' + name);
  });
  console.log('Built Vue 2 SFC Demo without Vite.');
}

main().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
