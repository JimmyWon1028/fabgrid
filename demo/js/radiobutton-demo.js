(function(global) {
  'use strict';

  var messages = {
    en: {
      ready: 'RadioButton Demo is ready.',
      changed: 'Selected: {0}',
      empty: 'No option selected.',
      form: 'FormData fruit: {0}'
    },
    'zh-TW': {
      ready: 'RadioButton Demo 已就緒。',
      changed: '已選擇：{0}',
      empty: '尚未選擇。',
      form: 'FormData fruit：{0}'
    },
    'zh-CN': {
      ready: 'RadioButton Demo 已就绪。',
      changed: '已选择：{0}',
      empty: '尚未选择。',
      form: 'FormData fruit：{0}'
    }
  };

  function format(text, value) {
    return String(text).replace('{0}', value);
  }

  function mountRadioButtonDemo(fabui) {
    var themeSelect = document.getElementById('radiobutton-theme');
    var localeSelect = document.getElementById('radiobutton-locale');
    var status = document.getElementById('radiobutton-status');
    var controls = [];
    var buttons = [];
    var dynamic;

    function text(key) {
      return (messages[localeSelect.value] || messages.en)[key];
    }

    function create(selector, options) {
      var control = new fabui.RadioButton(selector, options);
      controls.push(control);
      return control;
    }

    function selectedFruit() {
      var selected = controls.find(function(control) {
        return control.hostElement.name === 'fruit' && control.isChecked();
      });
      return selected ? selected.getValue() : '';
    }

    function updateSelection() {
      var value = selectedFruit();
      status.textContent = value ? format(text('changed'), value) : text('empty');
    }

    if (!fabui || typeof fabui.RadioButton !== 'function') {
      throw new Error('fabui.RadioButton class is unavailable.');
    }

    create('#radiobutton-apple', {
      label: 'Apple:',
      value: 'Apple',
      checked: true,
      locale: localeSelect.value,
      onChange: updateSelection
    });
    create('#radiobutton-orange', {
      label: 'Orange:',
      value: 'Orange',
      locale: localeSelect.value,
      onChange: updateSelection
    });
    create('#radiobutton-banana', {
      label: 'Banana:',
      value: 'Banana',
      locale: localeSelect.value,
      onChange: updateSelection
    });
    create('#radiobutton-before', {
      label: 'Before',
      labelPosition: 'before',
      checked: true,
      locale: localeSelect.value
    });
    create('#radiobutton-after', {
      label: 'After',
      labelPosition: 'after',
      locale: localeSelect.value
    });
    create('#radiobutton-top', {
      label: 'Top',
      labelPosition: 'top',
      locale: localeSelect.value
    });
    create('#radiobutton-disabled', {
      label: 'Disabled',
      disabled: true,
      locale: localeSelect.value
    });
    dynamic = create('#radiobutton-dynamic', {
      label: 'Runtime API',
      value: 'runtime',
      locale: localeSelect.value
    });

    Array.prototype.forEach.call(
      document.querySelectorAll('.radiobutton-demo a[data-fabui-button]'),
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
      controls.forEach(function(control) {
        control.setTheme('inherit');
      });
      buttons.forEach(function(button) {
        button.setTheme('inherit');
      });
    });

    localeSelect.addEventListener('change', function() {
      controls.forEach(function(control) {
        control.setLocale(localeSelect.value);
      });
      status.textContent = text('ready');
    });

    document.getElementById('radiobutton-check').addEventListener('click', function() {
      dynamic.check();
    });
    document.getElementById('radiobutton-clear').addEventListener('click', function() {
      dynamic.clear();
    });
    document.getElementById('radiobutton-toggle').addEventListener('click', function() {
      if (dynamic.options().disabled) dynamic.enable();
      else dynamic.disable();
    });
    document.getElementById('radiobutton-reset').addEventListener('click', function() {
      document.getElementById('radiobutton-form').reset();
      setTimeout(updateSelection, 0);
    });
    document.getElementById('radiobutton-form').addEventListener('submit', function(event) {
      var value;
      event.preventDefault();
      value = new FormData(event.currentTarget).get('fruit') || '—';
      status.textContent = format(text('form'), value);
    });

    status.textContent = text('ready');
    global.fabRadioButtonDemo = {
      controls: controls,
      dynamic: dynamic
    };
  }

  global.mountFabUIRadioButtonDemo = mountRadioButtonDemo;
})(typeof window !== 'undefined' ? window : globalThis);
