(function(global) {
  'use strict';

  // for react
  global.System.config({
    map: {
      'plugin-babel': './vendor/plugin-babel.js',
      'systemjs-babel-build': './vendor/systemjs-babel-browser.js'
    },
    meta: {
      '*.jsx': {
        loader: 'plugin-babel',
        babelOptions: {
          react: true
        }
      }
    }
  });
}(window));
