(function() {
  'use strict';

  var themes = [
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
  var input = document.getElementById('componentThemeInput');

  if (!input) return;
  themes.forEach(function(theme) {
    var option = document.createElement('option');
    option.value = theme[0];
    option.textContent = theme[1];
    input.appendChild(option);
  });
  input.addEventListener('change', function(event) {
    applyTheme(event.target.value);
  });
  applyTheme('default');

  function applyTheme(theme) {
    themes.forEach(function(item) {
      document.body.classList.remove('fg-theme-' + item[0]);
    });
    document.body.classList.add('fg-theme-' + theme);
  }
}());
