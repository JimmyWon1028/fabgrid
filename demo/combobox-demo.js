(function() {
  'use strict';

  var languages = [
    { id: 1, text: 'Java', desc: 'Write once, run anywhere' },
    { id: 2, text: 'C#', desc: 'A language designed for the Common Language Infrastructure' },
    { id: 3, text: 'Ruby', desc: 'A dynamic, reflective object-oriented language' },
    { id: 4, text: 'Perl', desc: 'A high-level interpreted language' },
    { id: 5, text: 'Basic', desc: 'A family of general-purpose languages' }
  ];
  var browsers = [
    { value: 'f20', text: 'Firefox 2.0 or higher', group: 'Firefox' },
    { value: 'f15', text: 'Firefox 1.5.x', group: 'Firefox' },
    { value: 'f10', text: 'Firefox 1.0.x', group: 'Firefox' },
    { value: 'ie7', text: 'Microsoft Internet Explorer 7.0 or higher', group: 'Microsoft Internet Explorer' },
    { value: 'ie6', text: 'Microsoft Internet Explorer 6.x', group: 'Microsoft Internet Explorer' },
    { value: 'op9', text: 'Opera 9.0 or higher', group: 'Opera' },
    { value: 'op8', text: 'Opera 8.x', group: 'Opera' },
    { value: 'safari', text: 'Safari', group: 'Other' }
  ];
  var states = [
    { id: 'AL', name: 'Alabama' },
    { id: 'AK', name: 'Alaska' },
    { id: 'AZ', name: 'Arizona' },
    { id: 'CA', name: 'California' },
    { id: 'CO', name: 'Colorado' },
    { id: 'FL', name: 'Florida' },
    { id: 'NY', name: 'New York' },
    { id: 'TX', name: 'Texas' },
    { id: 'WA', name: 'Washington' }
  ];

  new fabui.ComboBox('#comboboxState', {
    label: 'State:',
    labelPosition: 'top',
    width: 300,
    panelHeight: 220
  });

  new fabui.ComboBox('#comboboxMultiple', {
    label: 'Language:',
    labelPosition: 'top',
    width: 300,
    panelHeight: 'auto',
    valueField: 'id',
    textField: 'text',
    data: languages,
    value: [1, 3],
    multiple: true
  });

  new fabui.ComboBox('#comboboxGroup', {
    label: 'Browser:',
    labelPosition: 'top',
    width: 360,
    panelHeight: 240,
    valueField: 'value',
    textField: 'text',
    groupField: 'group',
    groupPosition: 'sticky',
    data: browsers
  });

  new fabui.ComboBox('#comboboxFormat', {
    label: 'Language:',
    labelPosition: 'top',
    width: 360,
    panelWidth: 420,
    panelHeight: 'auto',
    valueField: 'id',
    textField: 'text',
    data: languages,
    formatter: function(row) {
      return '<strong>' + row.text + '</strong><br><span class="combobox-demo-description">' + row.desc + '</span>';
    }
  });

  new fabui.ComboBox('#comboboxIcons', {
    label: 'Perform Action:',
    labelPosition: 'top',
    width: 300,
    panelHeight: 'auto',
    editable: false,
    showItemIcon: true,
    value: 'excel',
    data: [
      { value: 'add', text: 'Add', iconCls: 'icon-add' },
      { value: 'remove', text: 'Remove', iconCls: 'icon-remove' },
      { value: 'excel', text: 'Export Excel', iconCls: 'icon-excel' },
      { value: 'close', text: 'Close', iconCls: 'icon-close' }
    ]
  });

  new fabui.ComboBox('#comboboxRemote', {
    label: 'State:',
    labelPosition: 'top',
    prompt: '輸入州名',
    width: 300,
    mode: 'remote',
    valueField: 'id',
    textField: 'name',
    delay: 180,
    loader: function(params) {
      var query = String(params.q || '').toLowerCase();
      return new Promise(function(resolve) {
        window.setTimeout(function() {
          resolve(states.filter(function(row) {
            return !query || row.name.toLowerCase().indexOf(query) >= 0;
          }));
        }, 220);
      });
    }
  });

  var actionCombo = new fabui.ComboBox('#comboboxActions', {
    label: 'Language:',
    labelPosition: 'top',
    width: 300,
    panelHeight: 'auto',
    valueField: 'id',
    textField: 'text',
    data: languages,
    value: 3
  });
  document.querySelector('.combobox-demo-actions').addEventListener('click', function(event) {
    var action = event.target.getAttribute('data-action');
    if (!action) return;
    if (action === 'set') actionCombo.setValue(2);
    if (action === 'get') document.querySelector('#comboboxActionResult').textContent = 'Value: ' + actionCombo.getValue();
    if (action === 'disable') actionCombo.disable();
    if (action === 'enable') actionCombo.enable();
    if (action === 'load') actionCombo.loadData([
      { id: 'js', text: 'JavaScript' },
      { id: 'ts', text: 'TypeScript' },
      { id: 'py', text: 'Python' }
    ]);
  });

  new fabui.ComboBox('#comboboxMultiline', {
    label: 'Select States:',
    labelPosition: 'top',
    width: 360,
    height: 100,
    multiple: true,
    multiline: true,
    valueField: 'id',
    textField: 'name',
    data: states,
    value: ['CA', 'NY', 'TX']
  });

  new fabui.ComboBox('#comboboxFluidFull', {
    label: 'width: 100%',
    labelPosition: 'top',
    width: '100%',
    valueField: 'value',
    textField: 'text',
    groupField: 'group',
    data: browsers
  });

  new fabui.ComboBox('#comboboxFluidHalf', {
    label: 'width: 50%',
    labelPosition: 'top',
    width: '50%',
    valueField: 'value',
    textField: 'text',
    groupField: 'group',
    data: browsers
  });
}());
