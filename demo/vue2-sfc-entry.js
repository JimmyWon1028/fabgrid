import Vue from 'vue';
import App from './vue2-grid.vue';

new Vue({
  render: function(createElement) {
    return createElement(App);
  }
}).$mount('#app');
