(function(global) {
  'use strict';

  //for vue
  global.System.config({
    map: {
      'vue-loader': './vendor/systemjs-vue-browser.js'
    },
    meta: {
      '*.vue': {
        loader: 'vue-loader'
      }
    }
  });
}(window));
