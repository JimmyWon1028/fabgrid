(function() {
  'use strict';

  new fabui.NumberBox('#numberboxPrice', {
    label: 'List Price:',
    labelPosition: 'top',
    precision: 2,
    width: 300
  });

  new fabui.NumberBox('#numberboxAmount', {
    label: 'Amount:',
    labelPosition: 'top',
    width: 300
  });

  new fabui.NumberBox('#numberboxDiscount', {
    label: 'Discount:',
    labelPosition: 'top',
    suffix: '%',
    width: 300
  });

  new fabui.NumberBox('#numberboxRangeAmount', {
    label: 'Amount:',
    labelPosition: 'top',
    min: 10,
    max: 90,
    precision: 2,
    width: 300
  });

  new fabui.NumberBox('#numberboxWeight', {
    label: 'Weight:',
    labelPosition: 'top',
    min: 10,
    max: 90,
    width: 300
  });

  new fabui.NumberBox('#numberboxAge', {
    label: 'Age:',
    labelPosition: 'top',
    min: 0,
    max: 100,
    width: 300
  });

  new fabui.NumberBox('#numberboxUs', {
    label: 'Number in the United States',
    labelPosition: 'top',
    precision: 2,
    thousandsSeparator: true,
    width: '100%'
  });

  new fabui.NumberBox('#numberboxFrance', {
    label: 'Number in France',
    labelPosition: 'top',
    precision: 2,
    groupSeparator: ' ',
    decimalSeparator: ',',
    width: '100%'
  });

  new fabui.NumberBox('#numberboxUsd', {
    label: 'Currency: USD',
    labelPosition: 'top',
    precision: 2,
    thousandsSeparator: true,
    decimalSeparator: '.',
    prefix: '$',
    width: '100%'
  });

  new fabui.NumberBox('#numberboxEurPrefix', {
    label: 'Currency: EUR (prefix)',
    labelPosition: 'top',
    precision: 2,
    groupSeparator: ',',
    decimalSeparator: ' ',
    prefix: '€',
    width: '100%'
  });

  new fabui.NumberBox('#numberboxEurSuffix', {
    label: 'Currency: EUR (suffix)',
    labelPosition: 'top',
    precision: 2,
    groupSeparator: ' ',
    decimalSeparator: ',',
    suffix: '€',
    width: '100%'
  });

  new fabui.NumberBox('#numberboxFluidFull', {
    label: 'width: 100%',
    labelPosition: 'top',
    precision: 2,
    width: '100%'
  });

  new fabui.NumberBox('#numberboxFluidHalf', {
    label: 'width: 50%',
    labelPosition: 'top',
    width: '50%'
  });
}());
