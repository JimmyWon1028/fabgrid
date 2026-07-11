(function() {
  'use strict';

  var basicTabs = new fabui.Tabs('#tabsBasic', {
    width: 700,
    height: 250,
    locale: 'zh-TW'
  });
  var autoHeightTabs = new fabui.Tabs('#tabsAutoHeight', {
    width: 700,
    height: 'auto',
    locale: 'zh-TW'
  });
  var nestedTabs = new fabui.Tabs('#tabsNested', {
    width: 700,
    height: 250,
    locale: 'zh-TW'
  });
  var nestedInnerTabs = new fabui.Tabs('#tabsNestedInner', {
    fit: true,
    plain: true,
    locale: 'zh-TW'
  });
  var toolIndex = 0;
  var toolsTabs;
  var fixedTabs = new fabui.Tabs('#tabsFixed', {
    width: 700,
    height: 250,
    tabWidth: 112,
    locale: 'zh-TW'
  });
  var justifiedTabs = new fabui.Tabs('#tabsJustified', {
    width: 700,
    height: 250,
    justified: true,
    locale: 'zh-TW'
  });
  var styleTabs = new fabui.Tabs('#tabsStyle', {
    width: 700,
    height: 250,
    locale: 'zh-TW'
  });
  var positionTabs = new fabui.Tabs('#tabsPosition', {
    width: 700,
    height: 250,
    locale: 'zh-TW'
  });
  var fluidTabs = new fabui.Tabs('#tabsFluid', {
    width: '100%',
    height: 250,
    locale: 'zh-TW'
  });
  var demoThemes = [
    ['default', 'Default'],
    ['bootstrap', 'Bootstrap'],
    ['cupertino', 'Cupertino'],
    ['material', 'Material'],
    ['material-blue', 'Material Blue'],
    ['material-teal', 'Material Teal'],
    ['metro', 'Metro'],
    ['metro-blue', 'Metro Blue'],
    ['metro-gray', 'Metro Gray'],
    ['metro-green', 'Metro Green'],
    ['metro-orange', 'Metro Orange'],
    ['metro-red', 'Metro Red'],
    ['sunny', 'Sunny'],
    ['pepper-grinder', 'Pepper Grinder'],
    ['dark-hive', 'Dark Hive'],
    ['black', 'Black']
  ];
  var themeInput = document.getElementById('tabsThemeInput');
  var allTabs;

  toolsTabs = new fabui.Tabs('#tabsTools', {
    width: 700,
    height: 250,
    locale: 'zh-TW',
    tools: [{
      iconCls: 'icon-add',
      title: '新增頁籤',
      onClick: function() {
        toolIndex += 1;
        toolsTabs.add({
          title: 'Tab ' + toolIndex,
          content: '<div class="tabs-demo-panel">Content ' + toolIndex + '</div>',
          closable: true
        });
      }
    }, {
      iconCls: 'icon-remove',
      title: '移除目前頁籤',
      onClick: function() {
        var selected = toolsTabs.getSelected();
        if (selected) toolsTabs.close(toolsTabs.getTabIndex(selected));
      }
    }]
  });
  toolsTabs.add({ title: 'Tab 1', content: '<div class="tabs-demo-panel">Content 1</div>', closable: true });
  toolIndex = 1;
  allTabs = [basicTabs, autoHeightTabs, nestedTabs, nestedInnerTabs, toolsTabs, fixedTabs, justifiedTabs, styleTabs, positionTabs, fluidTabs];
  demoThemes.forEach(function(theme) {
    var option = document.createElement('option');
    option.value = theme[0];
    option.textContent = theme[1];
    themeInput.appendChild(option);
  });
  themeInput.addEventListener('change', function(event) {
    applyTabsTheme(event.target.value);
  });
  applyTabsTheme('default');

  ['tabsPlain', 'tabsNarrow', 'tabsPill', 'tabsJustifyStyle'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', updateStyleTabs);
  });

  document.getElementById('tabsPositionInput').addEventListener('change', function(event) {
    positionTabs.setOptions({ tabPosition: event.target.value });
  });

  function updateStyleTabs() {
    styleTabs.setOptions({
      plain: document.getElementById('tabsPlain').checked,
      narrow: document.getElementById('tabsNarrow').checked,
      pill: document.getElementById('tabsPill').checked,
      justified: document.getElementById('tabsJustifyStyle').checked
    });
  }

  function applyTabsTheme(theme) {
    allTabs.forEach(function(tabs) {
      demoThemes.forEach(function(item) {
        tabs.element.classList.remove('fg-theme-' + item[0]);
      });
      tabs.element.classList.add('fg-theme-' + theme);
    });
  }

  window.fabuiTabsDemo = {
    basic: basicTabs,
    autoHeight: autoHeightTabs,
    nested: nestedTabs,
    nestedInner: nestedInnerTabs,
    tools: toolsTabs,
    fixed: fixedTabs,
    justified: justifiedTabs,
    style: styleTabs,
    position: positionTabs,
    fluid: fluidTabs
  };
}());
