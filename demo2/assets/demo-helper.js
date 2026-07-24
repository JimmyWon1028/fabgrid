(function(global) {
  'use strict';

  global.demo2Helper = {
    mark: function(name, message) {
      global.demo2SetStatus(name, message);
    }
  };
}(window));
