(function() {
  'use strict';

  function formatIsoDate(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);
  }

  function parseIsoDate(value) {
    var parts = String(value || '').split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);
    var date;
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      date = new Date(year, month - 1, day);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) return date;
    }
    return new Date();
  }

  new fabui.DateBox('#dateboxStart', {
    label: 'Start Date:',
    labelPosition: 'top',
    width: 300
  });

  new fabui.DateBox('#dateboxEnd', {
    label: 'End Date:',
    labelPosition: 'top',
    width: 300
  });

  new fabui.DateBox('#dateboxDefaultButtons', {
    label: 'Date With 2 Buttons:',
    labelPosition: 'top',
    width: 300
  });

  new fabui.DateBox('#dateboxCustomButtons', {
    label: 'Date With 3 Buttons:',
    labelPosition: 'top',
    width: 300,
    buttons: [
      { text: 'Today', action: 'today' },
      {
        text: 'MyBtn',
        handler: function(target, datebox) {
          datebox.setDate(new Date(2026, 6, 11));
          datebox.hidePanel();
        }
      },
      { text: 'Close', action: 'close' }
    ]
  });

  var today = new Date();
  var firstAllowed = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var lastAllowed = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10);
  new fabui.DateBox('#dateboxRestricted', {
    label: 'Select Date:',
    labelPosition: 'top',
    width: 300,
    validator: function(date) {
      return firstAllowed <= date && date <= lastAllowed;
    }
  });

  new fabui.DateBox('#dateboxDefaultFormat', {
    label: 'Default Format:',
    labelPosition: 'top',
    width: 300
  });

  new fabui.DateBox('#dateboxCustomFormat', {
    label: 'Customized Format:',
    labelPosition: 'top',
    width: 300,
    formatter: formatIsoDate,
    parser: parseIsoDate
  });

  new fabui.DateBox('#dateboxEvents', {
    label: 'Select Date:',
    labelPosition: 'top',
    width: 300,
    onSelect: function(date) {
      document.querySelector('#dateboxEventResult').textContent = 'Selected Date: ' + formatIsoDate(date);
    }
  });

  new fabui.DateBox('#dateboxSharedStart', {
    label: 'Start Date:',
    labelPosition: 'top',
    width: 300,
    sharedCalendar: '#dateboxSharedCalendar'
  });

  new fabui.DateBox('#dateboxSharedEnd', {
    label: 'End Date:',
    labelPosition: 'top',
    width: 300,
    sharedCalendar: '#dateboxSharedCalendar'
  });

  var cloneSource = new fabui.DateBox('#dateboxCloneSource', {
    label: 'Select Date:',
    labelPosition: 'top',
    width: 300
  });
  var cloneCount = 0;
  document.querySelector('#dateboxCloneButton').addEventListener('click', function() {
    var input = document.createElement('input');
    var clone;
    cloneCount += 1;
    input.id = 'dateboxClone' + cloneCount;
    document.querySelector('#dateboxCloneHost').appendChild(input);
    clone = new fabui.DateBox(input, {
      label: 'Select Date:',
      labelPosition: 'top',
      width: 300
    });
    clone.cloneFrom(cloneSource);
  });

  new fabui.DateBox('#dateboxFluidFull', {
    label: 'width: 100%',
    labelPosition: 'top',
    width: '100%'
  });

  new fabui.DateBox('#dateboxFluidHalf', {
    label: 'width: 50%',
    labelPosition: 'top',
    width: '50%'
  });
}());
