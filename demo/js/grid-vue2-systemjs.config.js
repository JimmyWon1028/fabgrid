// Vue 2 Grid demo SystemJS configuration.
(function() {
  'use strict';

  System.config({
    transpiler: 'plugin-babel',
    babelOptions: {
      es2015: true
    },
    paths: {
      'npm:': '../node_modules/'
    },
    map: {
      'vue-loader': 'npm:systemjs-vue-browser/index.js',
      css: 'npm:systemjs-plugin-css/css.js',
      'plugin-babel': 'npm:systemjs-plugin-babel/plugin-babel.js',
      'systemjs-babel-build': 'npm:systemjs-plugin-babel/systemjs-babel-browser.js'
    },
    meta: {
      '*.css': { loader: 'css' },
      '*.vue': { loader: 'vue-loader' }
    }
  });
}());
