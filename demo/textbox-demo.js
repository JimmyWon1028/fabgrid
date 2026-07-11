(function() {
  'use strict';

  var buttonResult = document.getElementById('textboxButtonResult');

  new fabui.TextBox('#textboxBasic', {
    label: 'Name:',
    labelPosition: 'before',
    width: 240
  });

  new fabui.TextBox('#textboxClear', {
    clearButton: true,
    width: 280
  });

  new fabui.TextBox('#textboxCustom', {
    cls: 'textbox-custom',
    label: 'Custom:',
    labelPosition: 'top',
    width: 280,
    height: 36
  });

  new fabui.TextBox('#textboxUser', {
    width: 240,
    icons: [
      { iconCls: 'icon-user', align: 'left', title: 'User' },
      { iconCls: 'icon-lock', align: 'right', title: 'Lock' }
    ]
  });

  new fabui.TextBox('#textboxEmail', {
    width: 240,
    icons: [
      { iconCls: 'icon-email', align: 'left', title: 'Email' },
      {
        iconCls: 'icon-clear32',
        align: 'right',
        title: 'Clear',
        onClick: function(e) {
          e.data.textbox.clear().focus();
        }
      }
    ]
  });

  var buttonTextBox = new fabui.TextBox('#textboxButton', {
    width: 320,
    buttonText: 'Search',
    buttonIcon: 'icon-zoom',
    onClickButton: function() {
      buttonResult.textContent = 'Search: ' + (this.getValue() || '(empty)');
    }
  });

  new fabui.TextBox('#textboxSmall', {
    width: 120,
    height: 26
  });

  new fabui.TextBox('#textboxLarge', {
    width: 320,
    height: 42
  });

  new fabui.TextBox('#textboxMultiline', {
    multiline: true,
    width: 420,
    height: 110
  });

  new fabui.TextBox('#textboxFluid', {
    width: '100%',
    clearButton: true
  });

  buttonTextBox.on('change', function() {
    buttonResult.textContent = '';
  });
}());
