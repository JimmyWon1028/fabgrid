(function(global) {
  'use strict';

  var groupData = [
    { value: '1', label: 'Item1' },
    { value: '2', label: 'Item2', disabled: true },
    { value: '3', label: 'Item3' },
    { value: '4', label: 'Item4' },
    { value: '5', label: 'Item5' }
  ];
  var messages = {
    en: {
      ready: 'RadioGroup Demo is ready.',
      changed: 'Selected: {0}',
      empty: 'No option selected.',
      form: 'FormData choice: {0}'
    },
    'zh-TW': {
      ready: 'RadioGroup Demo 已就緒。',
      changed: '已選擇：{0}',
      empty: '尚未選擇。',
      form: 'FormData choice：{0}'
    },
    'zh-CN': {
      ready: 'RadioGroup Demo 已就绪。',
      changed: '已选择：{0}',
      empty: '尚未选择。',
      form: 'FormData choice：{0}'
    }
  };

  function format(text, value) {
    return String(text).replace('{0}', value);
  }

  function mountRadioGroupDemo(fabui) {
    var themeSelect = document.getElementById('radiogroup-theme');
    var localeSelect = document.getElementById('radiogroup-locale');
    var status = document.getElementById('radiogroup-status');
    var groups = [];
    var buttons = [];
    var horizontal;
    var vertical;
    var runtime;

    function text(key) {
      return (messages[localeSelect.value] || messages.en)[key];
    }

    function report(value) {
      status.textContent = value == null ?
        text('empty') :
        format(text('changed'), value);
    }

    function create(selector, options) {
      var group = new fabui.RadioGroup(selector, options);
      groups.push(group);
      return group;
    }

    if (!fabui || typeof fabui.RadioGroup !== 'function') {
      throw new Error('fabui.RadioGroup class is unavailable.');
    }

    horizontal = create('#radiogroup-horizontal', {
      name: 'choice',
      value: '1',
      data: groupData,
      locale: localeSelect.value,
      onChange: report
    });
    vertical = create('#radiogroup-vertical', {
      name: 'verticalChoice',
      value: '3',
      data: groupData,
      dir: 'v',
      locale: localeSelect.value,
      onChange: report
    });
    runtime = create('#radiogroup-runtime', {
      name: 'runtimeChoice',
      value: '4',
      data: groupData,
      labelPosition: 'before',
      locale: localeSelect.value,
      onChange: report
    });

    Array.prototype.forEach.call(
      document.querySelectorAll('.radiogroup-demo a[data-fabui-button]'),
      function(button) {
        var options = { theme: 'inherit' };
        if (typeof fabui.Button === 'function') {
          if (button.getAttribute('data-button-type') === 'submit') {
            options.onClick = function() {
              button.closest('form').requestSubmit();
            };
          }
          buttons.push(new fabui.Button(button, options));
        }
      }
    );

    themeSelect.addEventListener('change', function() {
      document.body.className = 'fg-theme-' + themeSelect.value;
      groups.forEach(function(group) {
        group.setTheme('inherit');
      });
      buttons.forEach(function(button) {
        button.setTheme('inherit');
      });
    });

    localeSelect.addEventListener('change', function() {
      groups.forEach(function(group) {
        group.setLocale(localeSelect.value);
      });
      status.textContent = text('ready');
    });

    document.getElementById('radiogroup-next').addEventListener('click', function() {
      var values = ['1', '3', '4', '5'];
      var current = values.indexOf(String(runtime.getValue()));
      runtime.setValue(values[(current + 1) % values.length]);
    });
    document.getElementById('radiogroup-clear').addEventListener('click', function() {
      runtime.clear();
    });
    document.getElementById('radiogroup-reset').addEventListener('click', function() {
      runtime.reset();
    });
    document.getElementById('radiogroup-toggle').addEventListener('click', function() {
      if (runtime.options().disabled) runtime.enable();
      else runtime.disable();
    });
    document.getElementById('radiogroup-form').addEventListener('submit', function(event) {
      var value;
      event.preventDefault();
      value = new FormData(event.currentTarget).get('choice') || '—';
      status.textContent = format(text('form'), value);
    });

    status.textContent = text('ready');
    global.fabRadioGroupDemo = {
      horizontal: horizontal,
      vertical: vertical,
      runtime: runtime,
      groups: groups
    };
  }

  global.mountFabUIRadioGroupDemo = mountRadioGroupDemo;
})(typeof window !== 'undefined' ? window : globalThis);
