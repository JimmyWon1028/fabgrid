(function() {
  'use strict';

  var list = document.getElementById('demo-list');
  var draggingRow = null;

  function getRow(target) {
    var row = target && target.closest ? target.closest('tr') : null;
    return row && row.parentNode === list ? row : null;
  }

  function getDragHandle(target) {
    var cell = target && target.closest ? target.closest('td') : null;
    var row = cell ? getRow(cell) : null;
    return row && row.cells[0] === cell ? cell : null;
  }

  function clearDropState() {
    Array.prototype.forEach.call(list.rows, function(row) {
      row.classList.remove('drop-before', 'drop-after');
    });
  }

  Array.prototype.forEach.call(list.rows, function(row) {
    var handle = row.cells[0];
    handle.draggable = true;
    handle.tabIndex = 0;
    handle.setAttribute('aria-label', handle.textContent + '，可上下拖曳調整順序');
  });

  Array.prototype.forEach.call(list.querySelectorAll('a'), function(link) {
    link.draggable = false;
    link.addEventListener('dragstart', function(event) {
      event.preventDefault();
    });
  });

  list.addEventListener('dragstart', function(event) {
    var handle = getDragHandle(event.target);
    if (!handle) {
      event.preventDefault();
      return;
    }
    draggingRow = handle.parentNode;
    draggingRow.classList.add('dragging');
    draggingRow.setAttribute('aria-grabbed', 'true');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggingRow.cells[0].textContent);
  });

  list.addEventListener('dragover', function(event) {
    var targetRow = getRow(event.target);
    var rect;
    var before;
    if (!draggingRow || !targetRow || targetRow === draggingRow) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    rect = targetRow.getBoundingClientRect();
    before = event.clientY < rect.top + rect.height / 2;
    clearDropState();
    targetRow.classList.add(before ? 'drop-before' : 'drop-after');
  });

  list.addEventListener('dragleave', function(event) {
    var targetRow = getRow(event.target);
    if (targetRow && !targetRow.contains(event.relatedTarget)) {
      targetRow.classList.remove('drop-before', 'drop-after');
    }
  });

  list.addEventListener('drop', function(event) {
    var targetRow = getRow(event.target);
    var before;
    if (!draggingRow || !targetRow || targetRow === draggingRow) return;
    event.preventDefault();
    before = targetRow.classList.contains('drop-before');
    list.insertBefore(draggingRow, before ? targetRow : targetRow.nextSibling);
    draggingRow.cells[0].focus();
    clearDropState();
  });

  list.addEventListener('dragend', function() {
    if (draggingRow) {
      draggingRow.classList.remove('dragging');
      draggingRow.removeAttribute('aria-grabbed');
    }
    draggingRow = null;
    clearDropState();
  });
}());
