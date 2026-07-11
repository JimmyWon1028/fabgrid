(function() {
  'use strict';

  function formatMonth(date) {
    var month = date.getMonth() + 1;
    return date.getFullYear() + '/' + (month < 10 ? '0' + month : month);
  }

  new fabui.YymmBox('#yymmboxBasic', {
    label: 'Year / Month:',
    labelPosition: 'top',
    width: 300
  });

  new fabui.YymmBox('#yymmboxEvents', {
    label: 'Select Month:',
    labelPosition: 'top',
    width: 300,
    onSelect: function(date) {
      document.querySelector('#yymmboxEventResult').textContent = 'Selected month: ' + formatMonth(date);
    }
  });

  new fabui.YymmBox('#yymmboxFluid', {
    label: 'width: 100%',
    labelPosition: 'top',
    width: '100%'
  });
}());
