(function(global) {
  'use strict';

  var THEMES = [
    'default', 'bootstrap', 'cupertino', 'material', 'material-blue',
    'material-teal', 'metro', 'metro-blue', 'metro-gray', 'metro-green',
    'metro-orange', 'metro-red', 'sunny', 'pepper-grinder', 'dark-hive',
    'black', 'mono'
  ];

  function mountLayoutDemo(fabui) {
    var theme = document.getElementById('layout-theme');
    var status = document.getElementById('layout-status');
    var layout;

    function applyTheme(value) {
      THEMES.forEach(function(name) {
        document.body.classList.remove('fg-theme-' + name);
      });
      document.body.classList.add('fg-theme-' + value);
      if (layout) layout.setTheme('inherit');
    }

    function log(message) {
      status.textContent = message;
    }

    function toggleRegion(region) {
      var record = layout.regions[region];
      if (record && record.collapsed) layout.expand(region);
      else layout.collapse(region);
    }

    function toggleRegionVisibility(region) {
      if (!layout.panel(region)) return;
      if (layout.isVisible(region)) layout.hide(region);
      else layout.show(region);
    }

    if (!fabui || typeof fabui.Layout !== 'function') {
      throw new Error('fabui.Layout class is unavailable.');
    }

    applyTheme(theme.value);
    layout = new fabui.Layout('#demo-layout', {
      fit: true,
      locale: 'zh-TW',
      regions: {
        north: { split: true, height: 82, expandMode: 'dock' },
        south: { split: true, height: 66, expandMode: 'dock' },
        west: { split: true, width: 220, expandMode: 'dock' },
        east: { split: true, width: 240, expandMode: 'dock' },
        center: { border: true }
      },
      onCollapse: function(sender, args) {
        log('已收合：' + args.region);
      },
      onExpand: function(sender, args) {
        log('已展開：' + args.region);
      },
      onHide: function(sender, args) {
        log('已隱藏：' + args.region);
      },
      onShow: function(sender, args) {
        log('已顯示：' + args.region);
      },
      onRegionResize: function(sender, args) {
        log('調整尺寸：' + args.region + ' ' + args.width + ' × ' + args.height);
      }
    });

    theme.addEventListener('change', function() {
      applyTheme(theme.value);
      log('主題：' + theme.value);
    });
    document.getElementById('toggle-north').addEventListener('click', function() {
      toggleRegion('north');
    });
    document.getElementById('toggle-south').addEventListener('click', function() {
      toggleRegion('south');
    });
    document.getElementById('toggle-west').addEventListener('click', function() {
      toggleRegion('west');
    });
    document.getElementById('toggle-east').addEventListener('click', function() {
      toggleRegion('east');
    });
    document.getElementById('visibility-north').addEventListener('click', function() {
      toggleRegionVisibility('north');
    });
    document.getElementById('visibility-south').addEventListener('click', function() {
      toggleRegionVisibility('south');
    });
    document.getElementById('visibility-west').addEventListener('click', function() {
      toggleRegionVisibility('west');
    });
    document.getElementById('visibility-east').addEventListener('click', function() {
      toggleRegionVisibility('east');
    });
    document.getElementById('remove-east').addEventListener('click', function() {
      if (layout.panel('east')) {
        layout.remove('east');
        log('已移除 east');
      } else {
        layout.add({
          region: 'east',
          title: 'East',
          width: 240,
          split: true,
          expandMode: 'dock',
          content: '<p>動態加入的 East region。</p>'
        });
        log('已加入 east');
      }
    });

    global.fabLayoutDemo = layout;
    log('Layout Demo 已就緒');
  }

  global.mountFabUILayoutDemo = mountLayoutDemo;
}(typeof window !== 'undefined' ? window : this));
