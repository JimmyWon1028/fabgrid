function copyWithTextarea(text) {
  var textarea;
  var copied = false;
  if (typeof document === 'undefined' || !document.body ||
      typeof document.createElement !== 'function' ||
      typeof document.execCommand !== 'function') {
    return false;
  }
  textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    copied = document.execCommand('copy') !== false;
  } catch (error) {
    copied = false;
  }
  document.body.removeChild(textarea);
  return copied;
}

export var Clipboard = Object.freeze({
  copy: function(value) {
    var text = value == null ? '' : String(value);
    var clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : null;
    if (clipboard && typeof clipboard.writeText === 'function') {
      try {
        return Promise.resolve(clipboard.writeText(text)).then(function() {
          return true;
        }, function() {
          return copyWithTextarea(text);
        });
      } catch (error) {
        return Promise.resolve(copyWithTextarea(text));
      }
    }
    return Promise.resolve(copyWithTextarea(text));
  }
});
