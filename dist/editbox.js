/*! FabUI browser global | Pure JavaScript EditBox bundle */
(() => {
  // src/editbox/editbox-definitions.js?v=20260717-editbox-v21
  function createEditorDefinitions() {
    "use strict";
    function removeAll(text, token) {
      return token ? String(text).split(token).join("") : String(text);
    }
    function normalizePrecision(value) {
      if (value == null || value === false || value === "") return null;
      value = Math.floor(Number(value));
      return isFinite(value) && value >= 0 ? Math.min(20, value) : null;
    }
    function getGroupSeparator(options) {
      options = options || {};
      if (options.groupSeparator != null && options.groupSeparator !== "") return String(options.groupSeparator);
      if (options.thousandsSeparator === true || options.useThousandsSeparator === true || options.showThousandsSeparator === true) return ",";
      return "";
    }
    function getDecimalSeparator(options) {
      return options && options.decimalSeparator ? String(options.decimalSeparator) : ".";
    }
    function stripNumberFormatting(value, options) {
      var text = value == null ? "" : String(value).trim();
      var groupSeparator = getGroupSeparator(options);
      var decimalSeparator = getDecimalSeparator(options);
      text = removeAll(text, groupSeparator);
      if (decimalSeparator !== ".") text = text.replace(decimalSeparator, ".");
      return text.replace(/\s/g, "");
    }
    function sanitizeNumber(value, options) {
      var text = stripNumberFormatting(value, options);
      var output = "";
      var hasDecimal = false;
      var allowNegative = !options || options.min == null || Number(options.min) < 0;
      var index;
      var character;
      for (index = 0; index < text.length; index += 1) {
        character = text.charAt(index);
        if (character >= "0" && character <= "9") {
          output += character;
        } else if (character === "." && !hasDecimal) {
          output += character;
          hasDecimal = true;
        } else if (character === "-" && allowNegative && output === "") {
          output = "-";
        }
      }
      return output;
    }
    function formatNumber(value, options) {
      var text = stripNumberFormatting(value, options);
      var precision = normalizePrecision(options && options.precision);
      var groupSeparator = getGroupSeparator(options);
      var decimalSeparator = getDecimalSeparator(options);
      var number;
      var sign = "";
      var hasDecimal;
      var parts;
      var integer;
      var decimal;
      if (text === "" || text === "-") return text;
      if (!/^-?\d*(?:\.\d*)?$/.test(text)) return String(value);
      if (precision != null) {
        number = Number(text);
        if (isFinite(number)) text = number.toFixed(precision);
      }
      if (text.charAt(0) === "-") {
        sign = "-";
        text = text.slice(1);
      }
      hasDecimal = text.indexOf(".") >= 0;
      parts = text.split(".");
      integer = parts[0] || "0";
      decimal = parts.length > 1 ? parts[1] : "";
      integer = integer.replace(/^0+(?=\d)/, "");
      if (groupSeparator) integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
      return sign + integer + (hasDecimal ? decimalSeparator + decimal : "");
    }
    function parseNumber(value, options) {
      var text = sanitizeNumber(value, options);
      var number;
      if (text === "" || text === "-" || text === "." || text === "-.") return null;
      number = Number(text);
      return isFinite(number) ? number : null;
    }
    function isNumberTextAllowed(editor, text, options) {
      var start = editor.selectionStart == null ? editor.value.length : editor.selectionStart;
      var end = editor.selectionEnd == null ? start : editor.selectionEnd;
      var next = editor.value.slice(0, start) + text + editor.value.slice(end);
      return stripNumberFormatting(next, options) === sanitizeNumber(next, options);
    }
    function pad2(value) {
      return value < 10 ? "0" + value : String(value);
    }
    function parseDate(value) {
      var text;
      var match;
      var year;
      var month;
      var day;
      var date;
      if (value instanceof Date && isFinite(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
      if (value == null || value === "") return null;
      text = String(value).trim();
      match = text.match(/^(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})$/);
      if (!match) {
        match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
        if (match) {
          year = Number(match[3]);
          month = Number(match[1]) - 1;
          day = Number(match[2]);
        }
      } else {
        year = Number(match[1]);
        month = Number(match[2]) - 1;
        day = Number(match[3]);
      }
      if (!match) return null;
      date = new Date(year, month, day);
      return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
    }
    function extractDateDigits(value) {
      var date = parseDate(value);
      if (date) return date.getFullYear() + pad2(date.getMonth() + 1) + pad2(date.getDate());
      return String(value == null ? "" : value).replace(/[^0-9]/g, "").slice(0, 8);
    }
    function applyDateMask(raw, mask) {
      var digits = String(raw || "").replace(/[^0-9]/g, "").slice(0, 8);
      var output = "";
      var index = 0;
      var maskIndex;
      mask = String(mask || "9999/99/99");
      for (maskIndex = 0; maskIndex < mask.length; maskIndex += 1) {
        if (mask.charAt(maskIndex) === "9") {
          if (index >= digits.length) break;
          output += digits.charAt(index);
          index += 1;
        } else if (index > 0) {
          output += mask.charAt(maskIndex);
        }
      }
      return output;
    }
    function formatDate(value, options) {
      return applyDateMask(extractDateDigits(value), options && options.mask);
    }
    function getDateDataValue(value) {
      var date = parseDate(value);
      return date ? date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate()) : value == null ? "" : String(value);
    }
    function getDateCopyText(value, options) {
      if (shouldAutoUnmaskDate(options)) {
        return extractDateDigits(value);
      }
      return formatDate(value, options);
    }
    function shouldAutoUnmaskDate(options) {
      options = options || {};
      if (options.autoUnmask === true) return true;
      if (options.autoUnmask === false) return false;
      if (options.maskValueIncludesLiterals === false || options.maskIncludesLiterals === false || options.maskLiteralsInValue === false) {
        return true;
      }
      if (options.maskValueIncludesLiterals === true || options.maskIncludesLiterals === true || options.maskLiteralsInValue === true) {
        return false;
      }
      return true;
    }
    function countDateDigitsBeforeCaret(value, caret) {
      return String(value == null ? "" : value).slice(0, caret).replace(/[^0-9]/g, "").length;
    }
    function getDateCaretPosition(value, rawIndex) {
      var text = String(value || "");
      var count = 0;
      var index;
      if (rawIndex <= 0) return 0;
      for (index = 0; index < text.length; index += 1) {
        if (/[0-9]/.test(text.charAt(index))) {
          count += 1;
          if (count >= rawIndex) return index + 1;
        }
      }
      return text.length;
    }
    function handleDateDelete(editor, key, options) {
      var start = editor.selectionStart == null ? editor.value.length : editor.selectionStart;
      var end = editor.selectionEnd == null ? start : editor.selectionEnd;
      var raw = extractDateDigits(editor.value);
      var deleteStart = countDateDigitsBeforeCaret(editor.value, start);
      var deleteEnd = countDateDigitsBeforeCaret(editor.value, end);
      var nextRaw;
      var nextText;
      var nextCaret;
      if (start === end) {
        if (key === "Backspace") {
          if (deleteStart <= 0) return true;
          deleteStart -= 1;
        } else if (deleteStart >= raw.length) {
          return true;
        } else {
          deleteEnd += 1;
        }
      }
      nextRaw = raw.slice(0, deleteStart) + raw.slice(deleteEnd);
      nextText = applyDateMask(nextRaw, options && options.mask);
      nextCaret = getDateCaretPosition(nextText, deleteStart);
      editor.value = nextText;
      if (editor.setSelectionRange) editor.setSelectionRange(nextCaret, nextCaret);
      return true;
    }
    function parseYymm(value) {
      var text;
      var match;
      var year;
      var month;
      if (value instanceof Date && isFinite(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), 1);
      if (value == null || value === "") return null;
      text = String(value).trim();
      match = text.match(/^(\d{4})(?:[-\/](\d{1,2})|(\d{2}))$/);
      if (!match) return null;
      year = Number(match[1]);
      month = Number(match[2] || match[3]) - 1;
      return year >= 1 && month >= 0 && month <= 11 ? new Date(year, month, 1) : null;
    }
    function extractYymmDigits(value) {
      var date = parseYymm(value);
      if (date) return date.getFullYear() + pad2(date.getMonth() + 1);
      return String(value == null ? "" : value).replace(/[^0-9]/g, "").slice(0, 6);
    }
    function formatYymm(value, options) {
      return applyDateMask(extractYymmDigits(value), options && options.mask ? options.mask : "9999/99");
    }
    function getYymmDataValue(value) {
      var date = parseYymm(value);
      return date ? date.getFullYear() + pad2(date.getMonth() + 1) : value == null ? "" : String(value);
    }
    function getYymmCopyText(value, options) {
      if (shouldAutoUnmaskDate(options)) {
        return extractYymmDigits(value);
      }
      return formatYymm(value, options);
    }
    function handleYymmDelete(editor, key, options) {
      var yymmOptions = {};
      var name;
      options = options || {};
      for (name in options) {
        if (Object.prototype.hasOwnProperty.call(options, name)) yymmOptions[name] = options[name];
      }
      yymmOptions.mask = options.mask || "9999/99";
      return handleDateDelete(editor, key, yymmOptions);
    }
    function isYearMonthMask(options) {
      var mask = options && options.mask ? String(options.mask) : "";
      return mask === "9999/99" || mask === "9999-99";
    }
    var CSS_NAMED_COLORS = {
      aliceblue: "f0f8ff",
      antiquewhite: "faebd7",
      aqua: "00ffff",
      aquamarine: "7fffd4",
      azure: "f0ffff",
      beige: "f5f5dc",
      bisque: "ffe4c4",
      black: "000000",
      blanchedalmond: "ffebcd",
      blue: "0000ff",
      blueviolet: "8a2be2",
      brown: "a52a2a",
      burlywood: "deb887",
      cadetblue: "5f9ea0",
      chartreuse: "7fff00",
      chocolate: "d2691e",
      coral: "ff7f50",
      cornflowerblue: "6495ed",
      cornsilk: "fff8dc",
      crimson: "dc143c",
      cyan: "00ffff",
      darkblue: "00008b",
      darkcyan: "008b8b",
      darkgoldenrod: "b8860b",
      darkgray: "a9a9a9",
      darkgreen: "006400",
      darkgrey: "a9a9a9",
      darkkhaki: "bdb76b",
      darkmagenta: "8b008b",
      darkolivegreen: "556b2f",
      darkorange: "ff8c00",
      darkorchid: "9932cc",
      darkred: "8b0000",
      darksalmon: "e9967a",
      darkseagreen: "8fbc8f",
      darkslateblue: "483d8b",
      darkslategray: "2f4f4f",
      darkslategrey: "2f4f4f",
      darkturquoise: "00ced1",
      darkviolet: "9400d3",
      deeppink: "ff1493",
      deepskyblue: "00bfff",
      dimgray: "696969",
      dimgrey: "696969",
      dodgerblue: "1e90ff",
      firebrick: "b22222",
      floralwhite: "fffaf0",
      forestgreen: "228b22",
      fuchsia: "ff00ff",
      gainsboro: "dcdcdc",
      ghostwhite: "f8f8ff",
      gold: "ffd700",
      goldenrod: "daa520",
      gray: "808080",
      green: "008000",
      greenyellow: "adff2f",
      grey: "808080",
      honeydew: "f0fff0",
      hotpink: "ff69b4",
      indianred: "cd5c5c",
      indigo: "4b0082",
      ivory: "fffff0",
      khaki: "f0e68c",
      lavender: "e6e6fa",
      lavenderblush: "fff0f5",
      lawngreen: "7cfc00",
      lemonchiffon: "fffacd",
      lightblue: "add8e6",
      lightcoral: "f08080",
      lightcyan: "e0ffff",
      lightgoldenrodyellow: "fafad2",
      lightgray: "d3d3d3",
      lightgreen: "90ee90",
      lightgrey: "d3d3d3",
      lightpink: "ffb6c1",
      lightsalmon: "ffa07a",
      lightseagreen: "20b2aa",
      lightskyblue: "87cefa",
      lightslategray: "778899",
      lightslategrey: "778899",
      lightsteelblue: "b0c4de",
      lightyellow: "ffffe0",
      lime: "00ff00",
      limegreen: "32cd32",
      linen: "faf0e6",
      magenta: "ff00ff",
      maroon: "800000",
      mediumaquamarine: "66cdaa",
      mediumblue: "0000cd",
      mediumorchid: "ba55d3",
      mediumpurple: "9370db",
      mediumseagreen: "3cb371",
      mediumslateblue: "7b68ee",
      mediumspringgreen: "00fa9a",
      mediumturquoise: "48d1cc",
      mediumvioletred: "c71585",
      midnightblue: "191970",
      mintcream: "f5fffa",
      mistyrose: "ffe4e1",
      moccasin: "ffe4b5",
      navajowhite: "ffdead",
      navy: "000080",
      oldlace: "fdf5e6",
      olive: "808000",
      olivedrab: "6b8e23",
      orange: "ffa500",
      orangered: "ff4500",
      orchid: "da70d6",
      palegoldenrod: "eee8aa",
      palegreen: "98fb98",
      paleturquoise: "afeeee",
      palevioletred: "db7093",
      papayawhip: "ffefd5",
      peachpuff: "ffdab9",
      peru: "cd853f",
      pink: "ffc0cb",
      plum: "dda0dd",
      powderblue: "b0e0e6",
      purple: "800080",
      rebeccapurple: "663399",
      red: "ff0000",
      rosybrown: "bc8f8f",
      royalblue: "4169e1",
      saddlebrown: "8b4513",
      salmon: "fa8072",
      sandybrown: "f4a460",
      seagreen: "2e8b57",
      seashell: "fff5ee",
      sienna: "a0522d",
      silver: "c0c0c0",
      skyblue: "87ceeb",
      slateblue: "6a5acd",
      slategray: "708090",
      slategrey: "708090",
      snow: "fffafa",
      springgreen: "00ff7f",
      steelblue: "4682b4",
      tan: "d2b48c",
      teal: "008080",
      thistle: "d8bfd8",
      tomato: "ff6347",
      transparent: "00000000",
      turquoise: "40e0d0",
      violet: "ee82ee",
      wheat: "f5deb3",
      white: "ffffff",
      whitesmoke: "f5f5f5",
      yellow: "ffff00",
      yellowgreen: "9acd32"
    };
    function normalizeColor(value) {
      var text = value == null ? "" : String(value).trim().toLowerCase();
      var hex;
      if (!text) return "";
      if (Object.prototype.hasOwnProperty.call(CSS_NAMED_COLORS, text)) {
        return "#" + CSS_NAMED_COLORS[text];
      }
      if (text.charAt(0) !== "#") text = "#" + text;
      hex = text.slice(1);
      if (!/^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) return "";
      if (hex.length === 3 || hex.length === 4) {
        hex = hex.replace(/./g, function(character) {
          return character + character;
        });
      }
      return "#" + hex;
    }
    function parseColor(value) {
      var text = value == null ? "" : String(value).trim();
      var normalized = normalizeColor(value);
      if (Object.prototype.hasOwnProperty.call(CSS_NAMED_COLORS, text.toLowerCase())) {
        return text;
      }
      return normalized || text;
    }
    var definitions = {
      text: {
        type: "text",
        className: "textbox-f fg-editor-textbox",
        inputMode: "text",
        normalize: function(value) {
          return value == null ? "" : String(value);
        }
      },
      number: {
        type: "number",
        className: "textbox-f numberbox-f fg-editor-numberbox",
        inputMode: "decimal",
        normalizePrecision,
        getGroupSeparator,
        stripFormatting: stripNumberFormatting,
        sanitize: sanitizeNumber,
        format: formatNumber,
        parse: parseNumber,
        getCopyText: stripNumberFormatting,
        isTextAllowed: isNumberTextAllowed
      },
      combo: {
        type: "combo",
        className: "textbox-f combobox-f fg-editor-combobox",
        inputMode: "text",
        normalize: function(value) {
          return value == null ? "" : String(value);
        }
      },
      date: {
        type: "date",
        className: "textbox-f datebox-f fg-editor-datebox",
        inputMode: "numeric",
        mask: "9999/99/99",
        sanitize: function(value, options) {
          return isYearMonthMask(options) ? formatYymm(value, options) : formatDate(value, options);
        },
        format: function(value, options) {
          return isYearMonthMask(options) ? formatYymm(value, options) : formatDate(value, options);
        },
        parse: function(value, options) {
          return isYearMonthMask(options) ? parseYymm(value) : parseDate(value);
        },
        getDataValue: function(value, options) {
          return isYearMonthMask(options) ? getYymmDataValue(value) : getDateDataValue(value);
        },
        getCopyText: function(value, options) {
          return isYearMonthMask(options) ? getYymmCopyText(value, options) : getDateCopyText(value, options);
        },
        handleDelete: function(editor, key, options) {
          return isYearMonthMask(options) ? handleYymmDelete(editor, key, options) : handleDateDelete(editor, key, options);
        },
        isTextAllowed: function(editor, text) {
          return /^[0-9]+$/.test(String(text || ""));
        }
      },
      color: {
        type: "color",
        className: "textbox-f color-f fg-editor-color",
        inputMode: "text",
        normalize: normalizeColor,
        parse: parseColor,
        isValid: function(value) {
          return value == null || String(value).trim() === "" || Boolean(normalizeColor(value));
        }
      }
    };
    definitions.textbox = definitions.text;
    definitions.numberbox = definitions.number;
    definitions.datebox = definitions.date;
    definitions.combobox = definitions.combo;
    return definitions;
  }

  // src/editbox/color-editbox.js?v=20260717-editbox-v21
  function createColorEditBoxFactory(TextBox, editorDefinitions2) {
    "use strict";
    if (typeof TextBox !== "function") {
      throw new Error("fabui.ColorEditBox requires fabui.TextBox.");
    }
    editorDefinitions2 = editorDefinitions2 || {};
    var editorDefinition = editorDefinitions2.color || null;
    var localePacks = {
      en: {
        openColorText: "Open color palette",
        saturationText: "Saturation and brightness",
        hueText: "Hue",
        alphaText: "Alpha"
      },
      "zh-TW": {
        openColorText: "\u958B\u555F\u8272\u76E4",
        saturationText: "\u98FD\u548C\u5EA6\u8207\u660E\u5EA6",
        hueText: "\u8272\u76F8",
        alphaText: "\u900F\u660E\u5EA6"
      },
      "zh-CN": {
        openColorText: "\u6253\u5F00\u8272\u677F",
        saturationText: "\u9971\u548C\u5EA6\u4E0E\u660E\u5EA6",
        hueText: "\u8272\u76F8",
        alphaText: "\u900F\u660E\u5EA6"
      }
    };
    var defaultPalette = [
      "#ffffff",
      "#000000",
      "#ff0000",
      "#ffc000",
      "#ffff00",
      "#92d050",
      "#00b050",
      "#00b0f0",
      "#0070c0",
      "#7030a0",
      "#f2f2f2",
      "#737373",
      "#ffe5e5",
      "#fff9e5",
      "#ffffe5",
      "#f3ffe5",
      "#e5fff1",
      "#e5f8ff",
      "#e5f4ff",
      "#f4e5ff",
      "#d9d9d9",
      "#595959",
      "#e6a1a1",
      "#e6d4a1",
      "#e5e6a1",
      "#c4e6a1",
      "#a1e6c0",
      "#a1d3e6",
      "#a1c9e6",
      "#c8a1e6",
      "#bfbfbf",
      "#404040",
      "#cc6666",
      "#ccb366",
      "#cccc66",
      "#9bcc66",
      "#66cc94",
      "#66b1cc",
      "#66a2cc",
      "#a066cc",
      "#a6a6a6",
      "#262626",
      "#b23636",
      "#b29436",
      "#b2b236",
      "#76b236",
      "#36b26e",
      "#3691b2",
      "#367eb2",
      "#7d36b2",
      "#8c8c8c",
      "#0d0d0d",
      "#990f0f",
      "#99770f",
      "#99990f",
      "#56990f",
      "#0f994e",
      "#0f7499",
      "#0f6099",
      "#5e0f99"
    ];
    var defaults = {
      iconWidth: 28,
      panelWidth: 420,
      locale: "en",
      openColorText: null,
      saturationText: null,
      hueText: null,
      alphaText: null,
      palette: defaultPalette,
      colors: null,
      showAlpha: true,
      onChange: null,
      onSelect: null,
      onShowPanel: null,
      onHidePanel: null
    };
    function assign2(target) {
      var index;
      var source;
      var key;
      for (index = 1; index < arguments.length; index += 1) {
        source = arguments[index] || {};
        for (key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
        }
      }
      return target;
    }
    function resolveElement2(element) {
      return typeof element === "string" ? document.querySelector(element) : element;
    }
    function normalizeLocale(name) {
      if (localePacks[name]) return name;
      if (/^zh(?:-|_)?tw/i.test(name || "")) return "zh-TW";
      if (/^zh/i.test(name || "")) return "zh-CN";
      return "en";
    }
    function cssSize(value, fallback) {
      if (value == null || value === "") return fallback + "px";
      return typeof value === "number" ? value + "px" : String(value);
    }
    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }
    function rgbToHsv(red, green, blue) {
      var r = red / 255;
      var g = green / 255;
      var b = blue / 255;
      var max = Math.max(r, g, b);
      var min = Math.min(r, g, b);
      var delta = max - min;
      var hue = 0;
      if (delta) {
        if (max === r) {
          hue = (g - b) / delta % 6;
        } else if (max === g) {
          hue = (b - r) / delta + 2;
        } else {
          hue = (r - g) / delta + 4;
        }
        hue *= 60;
        if (hue < 0) hue += 360;
      }
      return {
        h: hue,
        s: max === 0 ? 0 : delta / max,
        v: max
      };
    }
    function hsvToRgb(hue, saturation, value) {
      var chroma = value * saturation;
      var section = hue / 60;
      var x = chroma * (1 - Math.abs(section % 2 - 1));
      var m = value - chroma;
      var r = 0;
      var g = 0;
      var b = 0;
      if (section < 1) {
        r = chroma;
        g = x;
      } else if (section < 2) {
        r = x;
        g = chroma;
      } else if (section < 3) {
        g = chroma;
        b = x;
      } else if (section < 4) {
        g = x;
        b = chroma;
      } else if (section < 5) {
        r = x;
        b = chroma;
      } else {
        r = chroma;
        b = x;
      }
      return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
      };
    }
    function createColorState(value, normalize) {
      var color = normalize(value) || "#ff0000";
      var hex = color.slice(1);
      var rgb;
      var state;
      if (hex.length === 6) hex += "ff";
      rgb = {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
      state = rgbToHsv(rgb.r, rgb.g, rgb.b);
      state.a = parseInt(hex.slice(6, 8), 16) / 255;
      return state;
    }
    function toHexColorPart(value) {
      var text = clamp(Math.round(value), 0, 255).toString(16);
      return text.length < 2 ? "0" + text : text;
    }
    function colorStateToHex(state, showAlpha) {
      var rgb = hsvToRgb(state.h, state.s, state.v);
      var alpha = clamp(state.a == null ? 1 : state.a, 0, 1);
      var value = "#" + toHexColorPart(rgb.r) + toHexColorPart(rgb.g) + toHexColorPart(rgb.b);
      if (showAlpha && alpha < 0.999) value += toHexColorPart(Math.round(alpha * 255));
      return value;
    }
    function ColorEditBox(element, options) {
      var source = resolveElement2(element);
      var userOptions = options || {};
      var textOptions;
      var icons;
      var self = this;
      if (!(this instanceof ColorEditBox)) return new ColorEditBox(element, options);
      if (!source || !/^(INPUT|TEXTAREA)$/.test(source.tagName)) {
        throw new Error("fabui.ColorEditBox requires an input or textarea element.");
      }
      if (source.__fabuiColorEditBox) return source.__fabuiColorEditBox;
      this._source = source;
      this._listeners = {};
      this._panelVisible = false;
      this._destroyed = false;
      this._options = assign2({}, defaults, userOptions);
      this._options.locale = normalizeLocale(this._options.locale);
      if (!Object.prototype.hasOwnProperty.call(userOptions, "openColorText")) {
        this._options.openColorText = localePacks[this._options.locale].openColorText;
      }
      if (!Object.prototype.hasOwnProperty.call(userOptions, "saturationText")) {
        this._options.saturationText = localePacks[this._options.locale].saturationText;
      }
      if (!Object.prototype.hasOwnProperty.call(userOptions, "hueText")) {
        this._options.hueText = localePacks[this._options.locale].hueText;
      }
      if (!Object.prototype.hasOwnProperty.call(userOptions, "alphaText")) {
        this._options.alphaText = localePacks[this._options.locale].alphaText;
      }
      this._options.palette = Array.isArray(this._options.palette) ? this._options.palette.slice() : defaultPalette.slice();
      if (Array.isArray(this._options.colors) && this._options.colors.length) {
        this._options.palette = this._options.colors.slice();
      }
      this._options.showAlpha = this._options.showAlpha !== false;
      icons = Array.isArray(this._options.icons) ? this._options.icons.slice() : [];
      icons.push({
        iconCls: "fui-colorbox-trigger fui-combobox-arrow",
        align: "right",
        width: this._options.iconWidth,
        title: this._options.openColorText,
        onClick: function() {
          self.togglePanel();
        }
      });
      textOptions = assign2({}, userOptions, {
        cls: ((this._options.cls || "") + " fui-colorbox").trim(),
        icons,
        onChange: function(newValue, oldValue) {
          self._syncColor();
          self._invoke("onChange", newValue, oldValue);
          self._emit("change", { value: newValue, oldValue });
        }
      });
      this._textbox = new TextBox(source, textOptions);
      this._editor = this._textbox.textbox();
      if (editorDefinition && editorDefinition.className) {
        editorDefinition.className.split(/\s+/).forEach(function(className) {
          if (className) self._editor.classList.add(className);
        });
      }
      this._field = this._editor.closest(".fui-textbox-field");
      this._shell = this._editor.closest(".fui-textbox");
      this._trigger = this._textbox.getIcon(icons.length - 1);
      this._buildPanel();
      this._bind();
      this._syncColor();
      source.__fabuiColorEditBox = this;
    }
    ColorEditBox.prototype._buildPanel = function() {
      var self = this;
      var panel = document.createElement("div");
      var palette = document.createElement("div");
      var controls = document.createElement("div");
      var sv = document.createElement("div");
      var svMarker = document.createElement("span");
      var hue = document.createElement("div");
      var hueMarker = document.createElement("span");
      var alpha = document.createElement("div");
      var alphaFill = document.createElement("span");
      var alphaMarker = document.createElement("span");
      panel.className = "fui-colorbox-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", this._options.openColorText);
      panel.style.width = cssSize(this._options.panelWidth, 420);
      palette.className = "fui-colorbox-palette";
      palette.setAttribute("role", "listbox");
      this._options.palette.forEach(function(color) {
        var normalized = self._normalizeColor(color);
        var swatch;
        if (!normalized) return;
        swatch = document.createElement("button");
        swatch.type = "button";
        swatch.className = "fui-colorbox-swatch";
        swatch.setAttribute("role", "option");
        swatch.setAttribute("aria-label", String(color));
        swatch.title = String(color);
        swatch.dataset.value = String(color);
        swatch.dataset.normalizedValue = normalized;
        swatch.style.backgroundColor = normalized;
        palette.appendChild(swatch);
      });
      controls.className = "fui-colorbox-controls";
      sv.className = "fui-colorbox-sv";
      sv.setAttribute("aria-label", this._options.saturationText);
      svMarker.className = "fui-colorbox-marker fui-colorbox-sv-marker";
      sv.appendChild(svMarker);
      hue.className = "fui-colorbox-hue";
      hue.setAttribute("aria-label", this._options.hueText);
      hueMarker.className = "fui-colorbox-marker fui-colorbox-hue-marker";
      hue.appendChild(hueMarker);
      alpha.className = "fui-colorbox-alpha";
      alpha.setAttribute("aria-label", this._options.alphaText);
      alphaFill.className = "fui-colorbox-alpha-fill";
      alphaMarker.className = "fui-colorbox-marker fui-colorbox-alpha-marker";
      alpha.appendChild(alphaFill);
      alpha.appendChild(alphaMarker);
      controls.appendChild(sv);
      controls.appendChild(hue);
      if (this._options.showAlpha) controls.appendChild(alpha);
      panel.appendChild(palette);
      panel.appendChild(controls);
      panel.setAttribute("aria-hidden", "true");
      document.body.appendChild(panel);
      this._panel = panel;
      this._palette = palette;
      this._sv = sv;
      this._hue = hue;
      this._alpha = alpha;
    };
    ColorEditBox.prototype._bind = function() {
      var self = this;
      this._onPanelPointerDown = function(event) {
        var swatch = event.target.closest(".fui-colorbox-swatch");
        var area;
        var mode;
        if (swatch) {
          event.preventDefault();
          self.setValue(swatch.dataset.value);
          self._invoke("onSelect", self.getValue());
          self._emit("select", { value: self.getValue() });
          return;
        }
        area = event.target.closest(".fui-colorbox-sv");
        mode = "sv";
        if (!area) {
          area = event.target.closest(".fui-colorbox-hue");
          mode = "hue";
        }
        if (!area) {
          area = event.target.closest(".fui-colorbox-alpha");
          mode = "alpha";
        }
        if (!area) return;
        event.preventDefault();
        self._colorDragState = {
          mode,
          element: area,
          pointerId: event.pointerId
        };
        if (area.setPointerCapture && event.pointerId != null) {
          area.setPointerCapture(event.pointerId);
        }
        self._updateColorFromPointer(event);
      };
      this._onPanelPointerMove = function(event) {
        if (!self._colorDragState) return;
        event.preventDefault();
        self._updateColorFromPointer(event);
      };
      this._onPanelPointerUp = function(event) {
        var drag = self._colorDragState;
        if (!drag) return;
        if (drag.element.releasePointerCapture && drag.pointerId != null) {
          try {
            drag.element.releasePointerCapture(drag.pointerId);
          } catch (error) {
          }
        }
        self._colorDragState = null;
      };
      this._onDocumentPointerDown = function(event) {
        if (!self._panelVisible) return;
        if (self._panel.contains(event.target) || self._shell.contains(event.target)) return;
        self.hidePanel();
      };
      this._onDocumentKeyDown = function(event) {
        if (event.key === "Escape" && self._panelVisible) {
          event.preventDefault();
          self.hidePanel();
          self.focus();
        }
      };
      this._onWindowResize = function() {
        if (self._panelVisible) self._positionPanel();
      };
      this._onWindowScroll = this._onWindowResize;
      this._panel.addEventListener("pointerdown", this._onPanelPointerDown);
      this._panel.addEventListener("pointermove", this._onPanelPointerMove);
      this._panel.addEventListener("pointerup", this._onPanelPointerUp);
      this._panel.addEventListener("pointercancel", this._onPanelPointerUp);
      document.addEventListener("pointerdown", this._onDocumentPointerDown, true);
      document.addEventListener("keydown", this._onDocumentKeyDown);
      window.addEventListener("resize", this._onWindowResize);
      window.addEventListener("scroll", this._onWindowScroll, true);
    };
    ColorEditBox.prototype._normalizeColor = function(value) {
      if (!editorDefinition || typeof editorDefinition.normalize !== "function") {
        return value == null ? "" : String(value);
      }
      return editorDefinition.normalize(value);
    };
    ColorEditBox.prototype._parseColor = function(value) {
      if (!editorDefinition || typeof editorDefinition.parse !== "function") {
        return value == null ? "" : String(value);
      }
      return editorDefinition.parse(value);
    };
    ColorEditBox.prototype._syncColor = function() {
      var normalized = this._normalizeColor(this.getValue());
      if (this._trigger) {
        this._trigger.style.setProperty("--fui-colorbox-value", normalized || "transparent");
      }
      this._editor.style.setProperty("--fui-colorbox-value", normalized || "transparent");
      this._editor.style.setProperty("--fg-editor-color", normalized || "transparent");
      if (!this._colorDragState) {
        this._colorState = createColorState(normalized || "#ff0000", this._normalizeColor.bind(this));
      }
      Array.prototype.forEach.call(this._palette.children, function(swatch) {
        var selected = Boolean(normalized) && swatch.dataset.normalizedValue === normalized;
        swatch.classList.toggle("fui-colorbox-swatch-selected", selected);
        swatch.setAttribute("aria-selected", selected ? "true" : "false");
      });
      this._updateColorPanelVisuals();
    };
    ColorEditBox.prototype._updateColorPanelVisuals = function() {
      var state = this._colorState || createColorState("#ff0000", this._normalizeColor.bind(this));
      var rgb = hsvToRgb(state.h, state.s, state.v);
      var svMarker = this._panel.querySelector(".fui-colorbox-sv-marker");
      var hueMarker = this._panel.querySelector(".fui-colorbox-hue-marker");
      var alphaFill = this._panel.querySelector(".fui-colorbox-alpha-fill");
      var alphaMarker = this._panel.querySelector(".fui-colorbox-alpha-marker");
      this._sv.style.backgroundColor = "hsl(" + Math.round(state.h) + ", 100%, 50%)";
      svMarker.style.left = state.s * 100 + "%";
      svMarker.style.top = (1 - state.v) * 100 + "%";
      hueMarker.style.top = state.h / 360 * 100 + "%";
      if (alphaFill) {
        alphaFill.style.backgroundImage = "linear-gradient(to right, rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", 0), rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + "))";
      }
      if (alphaMarker) alphaMarker.style.left = state.a * 100 + "%";
    };
    ColorEditBox.prototype._updateColorFromPointer = function(event) {
      var drag = this._colorDragState;
      var rect;
      var x;
      var y;
      if (!drag || !drag.element) return;
      rect = drag.element.getBoundingClientRect();
      x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);
      this._colorState = this._colorState || createColorState(this.getValue() || "#ff0000", this._normalizeColor.bind(this));
      if (drag.mode === "sv") {
        this._colorState.s = x;
        this._colorState.v = 1 - y;
      } else if (drag.mode === "hue") {
        this._colorState.h = Math.min(359.999, y * 360);
      } else if (drag.mode === "alpha") {
        this._colorState.a = x;
      }
      this._textbox.setValue(
        colorStateToHex(this._colorState, this._options.showAlpha)
      );
      this._updateColorPanelVisuals();
    };
    ColorEditBox.prototype._positionPanel = function() {
      var rect;
      var width;
      var height;
      var left;
      var top;
      if (!this._panelVisible) return;
      rect = this._shell.getBoundingClientRect();
      width = this._panel.offsetWidth;
      height = this._panel.offsetHeight;
      left = rect.left;
      top = rect.bottom + 2;
      if (left + width > window.innerWidth - 6) left = Math.max(6, window.innerWidth - width - 6);
      if (top + height > window.innerHeight - 6 && rect.top > height + 8) {
        top = rect.top - height - 2;
      }
      this._panel.style.left = Math.round(left) + "px";
      this._panel.style.top = Math.round(top) + "px";
    };
    ColorEditBox.prototype._invoke = function(name) {
      var callback = this._options[name];
      if (typeof callback === "function") {
        return callback.apply(this, Array.prototype.slice.call(arguments, 1));
      }
      return void 0;
    };
    ColorEditBox.prototype._emit = function(name, detail) {
      (this._listeners[name] || []).slice().forEach(function(listener) {
        listener(detail);
      });
    };
    ColorEditBox.prototype.options = function() {
      return this._options;
    };
    ColorEditBox.prototype.textbox = function() {
      return this._textbox.textbox();
    };
    ColorEditBox.prototype.button = function() {
      return this._textbox.button();
    };
    ColorEditBox.prototype.panel = function() {
      return this._panel;
    };
    ColorEditBox.prototype.getIcon = function(index) {
      return this._textbox.getIcon(index);
    };
    ColorEditBox.prototype.getText = function() {
      return this._textbox.getText();
    };
    ColorEditBox.prototype.getValue = function() {
      return this._textbox.getValue();
    };
    ColorEditBox.prototype.setText = function(value) {
      return this.setValue(value);
    };
    ColorEditBox.prototype.setValue = function(value, silent) {
      this._textbox.setValue(this._parseColor(value), silent);
      this._syncColor();
      return this;
    };
    ColorEditBox.prototype.initValue = function(value) {
      this._textbox.initValue(this._parseColor(value));
      this._syncColor();
      return this;
    };
    ColorEditBox.prototype.clear = function() {
      return this.setValue("");
    };
    ColorEditBox.prototype.reset = function() {
      this._textbox.reset();
      this._syncColor();
      return this;
    };
    ColorEditBox.prototype.focus = function() {
      this._textbox.focus();
      return this;
    };
    ColorEditBox.prototype.showPanel = function() {
      if (this._panelVisible || this._options.disabled || this._options.readonly) return this;
      this._panelVisible = true;
      this._colorState = createColorState(
        this.getValue() || "#ff0000",
        this._normalizeColor.bind(this)
      );
      this._updateColorPanelVisuals();
      this._panel.style.display = "flex";
      this._panel.setAttribute("aria-hidden", "false");
      this._shell.classList.add("fui-colorbox-open");
      this._positionPanel();
      this._invoke("onShowPanel");
      this._emit("showPanel", { panel: this._panel });
      return this;
    };
    ColorEditBox.prototype.hidePanel = function() {
      if (!this._panelVisible) return this;
      this._panelVisible = false;
      this._panel.style.display = "none";
      this._panel.setAttribute("aria-hidden", "true");
      this._shell.classList.remove("fui-colorbox-open");
      this._invoke("onHidePanel");
      this._emit("hidePanel", { panel: this._panel });
      return this;
    };
    ColorEditBox.prototype.togglePanel = function() {
      return this._panelVisible ? this.hidePanel() : this.showPanel();
    };
    ColorEditBox.prototype.resize = function(width, height) {
      if (width != null) this._options.width = width;
      if (height != null) this._options.height = height;
      this._textbox.resize(width, height);
      this._positionPanel();
      return this;
    };
    ColorEditBox.prototype.disable = function() {
      this.hidePanel();
      this._options.disabled = true;
      this._textbox.disable();
      return this;
    };
    ColorEditBox.prototype.enable = function() {
      this._options.disabled = false;
      this._textbox.enable();
      return this;
    };
    ColorEditBox.prototype.readonly = function(mode) {
      this._options.readonly = mode !== false;
      if (this._options.readonly) this.hidePanel();
      this._textbox.readonly(mode);
      return this;
    };
    ColorEditBox.prototype.setEditable = function(mode) {
      this._options.editable = mode !== false;
      this._textbox.setEditable(mode);
      return this;
    };
    ColorEditBox.prototype.on = function(name, listener) {
      if (typeof listener !== "function") return this;
      if (!this._listeners[name]) this._listeners[name] = [];
      this._listeners[name].push(listener);
      return this;
    };
    ColorEditBox.prototype.off = function(name, listener) {
      var listeners = this._listeners[name];
      if (!listeners) return this;
      this._listeners[name] = listener ? listeners.filter(function(item) {
        return item !== listener;
      }) : [];
      return this;
    };
    ColorEditBox.prototype.destroy = function() {
      if (this._destroyed) return;
      this._destroyed = true;
      this.hidePanel();
      this._panel.removeEventListener("pointerdown", this._onPanelPointerDown);
      this._panel.removeEventListener("pointermove", this._onPanelPointerMove);
      this._panel.removeEventListener("pointerup", this._onPanelPointerUp);
      this._panel.removeEventListener("pointercancel", this._onPanelPointerUp);
      document.removeEventListener("pointerdown", this._onDocumentPointerDown, true);
      document.removeEventListener("keydown", this._onDocumentKeyDown);
      window.removeEventListener("resize", this._onWindowResize);
      window.removeEventListener("scroll", this._onWindowScroll, true);
      if (this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
      delete this._source.__fabuiColorEditBox;
      this._textbox.destroy();
      this._listeners = {};
    };
    ColorEditBox.defaults = defaults;
    ColorEditBox.editorDefinition = editorDefinition;
    return ColorEditBox;
  }

  // src/editbox/text-editbox.js?v=20260717-editbox-v21
  function createTextBoxFactory(editorDefinitions2) {
    "use strict";
    editorDefinitions2 = editorDefinitions2 || {};
    var editorDefinition = editorDefinitions2.text || editorDefinitions2.textbox || null;
    var defaults = {
      width: 200,
      height: 30,
      cls: "",
      prompt: "",
      value: "",
      autoUnmask: true,
      type: "text",
      label: "",
      labelWidth: 80,
      labelPosition: "before",
      labelAlign: "left",
      multiline: false,
      editable: true,
      disabled: false,
      readonly: false,
      required: false,
      icons: [],
      iconWidth: 18,
      buttonText: "",
      buttonIcon: "",
      buttonAlign: "right",
      clearButton: false,
      onChange: null,
      onResize: null,
      onClickButton: null,
      onClickIcon: null
    };
    function assign2(target) {
      var index;
      var source;
      var key;
      for (index = 1; index < arguments.length; index += 1) {
        source = arguments[index] || {};
        for (key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
    function resolveElement2(element) {
      if (typeof element === "string") {
        return document.querySelector(element);
      }
      return element;
    }
    function cssSize(value, fallback) {
      if (value == null || value === "") {
        return fallback + "px";
      }
      return typeof value === "number" ? value + "px" : String(value);
    }
    function normalizePosition(value, allowed, fallback) {
      return allowed.indexOf(value) >= 0 ? value : fallback;
    }
    function TextBox(element, options) {
      if (!(this instanceof TextBox)) {
        return new TextBox(element, options);
      }
      this._source = resolveElement2(element);
      if (!this._source || !/^(INPUT|TEXTAREA)$/.test(this._source.tagName)) {
        throw new Error("fabui.TextBox requires an input or textarea element.");
      }
      if (this._source.__fabuiTextBox) {
        return this._source.__fabuiTextBox;
      }
      this._listeners = {};
      this._iconElements = [];
      this._destroyed = false;
      this._originalDisplay = this._source.style.display;
      this._initialValue = this._source.value || "";
      this._options = assign2({}, defaults, this._readElementOptions(), options || {});
      if (options && Object.prototype.hasOwnProperty.call(options, "value")) {
        this._initialValue = options.value == null ? "" : String(options.value);
      } else {
        this._options.value = this._initialValue;
      }
      this._build();
      this._bind();
      this._source.__fabuiTextBox = this;
      this.setValue(this._options.value, true);
      this._applyState();
      this.resize(this._options.width, this._options.height, true);
    }
    TextBox.prototype._readElementOptions = function() {
      var source = this._source;
      return {
        prompt: source.getAttribute("placeholder") || "",
        type: source.getAttribute("type") || "text",
        multiline: source.tagName === "TEXTAREA",
        editable: !source.hasAttribute("readonly"),
        disabled: source.disabled,
        readonly: source.readOnly,
        required: source.required,
        value: source.value || ""
      };
    };
    TextBox.prototype._build = function() {
      var options = this._options;
      var parent = this._source.parentNode;
      var field = document.createElement("span");
      var label = null;
      var shell = document.createElement("span");
      var editor = document.createElement(options.multiline ? "textarea" : "input");
      var before = document.createElement("span");
      var after = document.createElement("span");
      field.className = "fui-textbox-field";
      if (options.cls) {
        field.className += " " + options.cls;
      }
      shell.className = "fui-textbox";
      before.className = "fui-textbox-addon fui-textbox-addon-left";
      after.className = "fui-textbox-addon fui-textbox-addon-right";
      editor.className = "fui-textbox-text" + (editorDefinition && editorDefinition.className ? " " + editorDefinition.className : " textbox-f fg-editor-textbox");
      editor.setAttribute("autocomplete", this._source.getAttribute("autocomplete") || "off");
      editor.setAttribute("placeholder", options.prompt || "");
      editor.setAttribute("aria-label", options.label || this._source.getAttribute("aria-label") || options.prompt || "TextBox");
      if (!options.multiline) {
        editor.type = options.type || "text";
      }
      editor.inputMode = editorDefinition && editorDefinition.inputMode ? editorDefinition.inputMode : "text";
      if (options.label) {
        label = document.createElement("label");
        label.className = "fui-textbox-label fui-textbox-label-" + normalizePosition(options.labelPosition, ["before", "after", "top"], "before");
        label.textContent = options.label;
        label.style.textAlign = normalizePosition(options.labelAlign, ["left", "center", "right"], "left");
        label.style.width = cssSize(options.labelWidth, 80);
        label.addEventListener("click", function() {
          editor.focus();
        });
      }
      shell.appendChild(before);
      shell.appendChild(editor);
      shell.appendChild(after);
      if (options.labelPosition === "after") {
        field.appendChild(shell);
        if (label) field.appendChild(label);
      } else {
        if (label) field.appendChild(label);
        field.appendChild(shell);
      }
      parent.insertBefore(field, this._source);
      field.appendChild(this._source);
      this._source.style.display = "none";
      this._source.setAttribute("aria-hidden", "true");
      this._field = field;
      this._label = label;
      this._shell = shell;
      this._editor = editor;
      this._beforeAddon = before;
      this._afterAddon = after;
      this._renderAddons();
    };
    TextBox.prototype._renderAddons = function() {
      var options = this._options;
      var icons = Array.isArray(options.icons) ? options.icons.slice() : [];
      var index;
      var descriptor;
      var iconClassName;
      var icon;
      var addon;
      this._iconElements = [];
      this._beforeAddon.textContent = "";
      this._afterAddon.textContent = "";
      if (options.clearButton) {
        icons.push({
          iconCls: "fui-textbox-clear-icon",
          align: "right",
          clear: true,
          title: "Clear"
        });
      }
      for (index = 0; index < icons.length; index += 1) {
        descriptor = assign2({}, icons[index]);
        addon = descriptor.align === "left" ? this._beforeAddon : this._afterAddon;
        icon = document.createElement("button");
        icon.type = "button";
        iconClassName = descriptor.iconCls || descriptor.className || descriptor.iconClass || descriptor.icon || "";
        icon.className = "fui-textbox-icon" + (iconClassName ? " " + iconClassName : "");
        icon.style.width = cssSize(descriptor.width || options.iconWidth, 18);
        icon.setAttribute(
          "aria-label",
          descriptor.ariaLabel || descriptor.label || descriptor.title || "TextBox icon " + (index + 1)
        );
        icon.title = descriptor.title || "";
        icon.textContent = descriptor.text || "";
        icon.disabled = Boolean(descriptor.disabled);
        icon.__fabuiIcon = descriptor;
        icon.__fabuiIconIndex = index;
        addon.appendChild(icon);
        this._iconElements.push(icon);
      }
      if (options.buttonText || options.buttonIcon) {
        this._button = document.createElement("button");
        this._button.type = "button";
        this._button.className = "fui-textbox-button" + (options.buttonIcon ? " " + options.buttonIcon : "");
        this._button.classList.add(options.buttonText && options.buttonIcon ? "fui-textbox-button-with-icon" : "fui-textbox-button-icon-only");
        this._button.textContent = options.buttonText || "";
        this._button.setAttribute("aria-label", options.buttonText || "TextBox button");
        if (options.buttonAlign === "left") {
          this._beforeAddon.insertBefore(this._button, this._beforeAddon.firstChild);
        } else {
          this._afterAddon.appendChild(this._button);
        }
      } else {
        this._button = null;
      }
      this._updateClearButton();
    };
    TextBox.prototype._bind = function() {
      var self = this;
      this._onInput = function() {
        self._commitEditorValue();
      };
      this._onFocus = function() {
        self._shell.classList.add("fui-textbox-focused");
      };
      this._onBlur = function() {
        self._shell.classList.remove("fui-textbox-focused");
      };
      this._onAddonClick = function(event) {
        var target = event.target.closest(".fui-textbox-icon");
        var descriptor;
        var callback;
        if (!target || target.disabled || self._options.disabled || self._options.readonly) return;
        descriptor = target.__fabuiIcon || {};
        event.data = assign2({}, event.data || {}, {
          target: self._source,
          textbox: self,
          icon: target,
          index: target.__fabuiIconIndex
        });
        if (descriptor.clear) {
          self.clear();
          self.focus();
        }
        callback = descriptor.onClick || descriptor.click || descriptor.handler;
        if (typeof callback === "function") {
          callback.call(self, event);
        }
        self._invoke("onClickIcon", target.__fabuiIconIndex);
        self._emit("iconClick", { index: target.__fabuiIconIndex, icon: target });
      };
      this._onButtonClick = function() {
        if (self._options.disabled) return;
        self._invoke("onClickButton");
        self._emit("buttonClick", { button: self._button });
      };
      this._onFormReset = function() {
        window.setTimeout(function() {
          if (!self._destroyed) self.reset();
        }, 0);
      };
      this._editor.addEventListener("input", this._onInput);
      this._editor.addEventListener("focus", this._onFocus);
      this._editor.addEventListener("blur", this._onBlur);
      this._beforeAddon.addEventListener("click", this._onAddonClick);
      this._afterAddon.addEventListener("click", this._onAddonClick);
      if (this._button) this._button.addEventListener("click", this._onButtonClick);
      if (this._source.form) this._source.form.addEventListener("reset", this._onFormReset);
    };
    TextBox.prototype._commitEditorValue = function() {
      var oldValue = this._source.value;
      var newValue = this._editor.value;
      this._source.value = newValue;
      this._options.value = newValue;
      this._updateClearButton();
      if (newValue !== oldValue) {
        this._invoke("onChange", newValue, oldValue);
        this._emit("change", { value: newValue, oldValue });
      }
    };
    TextBox.prototype._applyState = function() {
      var disabled = Boolean(this._options.disabled);
      var readonly = Boolean(this._options.readonly);
      this._editor.disabled = disabled;
      this._editor.readOnly = readonly || !this._options.editable;
      this._editor.required = Boolean(this._options.required);
      this._source.disabled = disabled;
      this._source.readOnly = readonly;
      this._field.classList.toggle("fui-textbox-disabled", disabled);
      this._field.classList.toggle("fui-textbox-readonly", readonly);
      if (this._label) this._label.classList.toggle("fui-textbox-label-disabled", disabled);
      this._iconElements.forEach(function(icon) {
        icon.classList.toggle("fui-textbox-icon-readonly", readonly);
      });
      if (this._button) this._button.disabled = disabled;
    };
    TextBox.prototype._updateClearButton = function() {
      var hasValue = Boolean(this._editor && this._editor.value);
      this._iconElements.forEach(function(icon) {
        if (icon.__fabuiIcon && icon.__fabuiIcon.clear) {
          icon.classList.toggle("fui-textbox-icon-hidden", !hasValue);
        }
      });
    };
    TextBox.prototype._invoke = function(name) {
      var callback = this._options[name];
      if (typeof callback === "function") {
        return callback.apply(this, Array.prototype.slice.call(arguments, 1));
      }
      return void 0;
    };
    TextBox.prototype._emit = function(name, detail) {
      var listeners = (this._listeners[name] || []).slice();
      listeners.forEach(function(listener) {
        listener(detail);
      });
    };
    TextBox.prototype.options = function() {
      return this._options;
    };
    TextBox.prototype.textbox = function() {
      return this._editor;
    };
    TextBox.prototype.button = function() {
      return this._button;
    };
    TextBox.prototype.getIcon = function(index) {
      return this._iconElements[index] || null;
    };
    TextBox.prototype.getText = function() {
      return this._editor.value;
    };
    TextBox.prototype.setText = function(value) {
      return this.setValue(value);
    };
    TextBox.prototype.getValue = function() {
      return this._source.value;
    };
    TextBox.prototype.setValue = function(value, silent) {
      var oldValue = this._source.value;
      var newValue = editorDefinition && typeof editorDefinition.normalize === "function" ? editorDefinition.normalize(value) : value == null ? "" : String(value);
      this._editor.value = newValue;
      this._source.value = newValue;
      this._options.value = newValue;
      this._updateClearButton();
      if (!silent && newValue !== oldValue) {
        this._invoke("onChange", newValue, oldValue);
        this._emit("change", { value: newValue, oldValue });
      }
      return this;
    };
    TextBox.prototype.initValue = function(value) {
      this._initialValue = value == null ? "" : String(value);
      return this.setValue(this._initialValue, true);
    };
    TextBox.prototype.clear = function() {
      return this.setValue("");
    };
    TextBox.prototype.reset = function() {
      return this.setValue(this._initialValue);
    };
    TextBox.prototype.focus = function() {
      this._editor.focus();
      return this;
    };
    TextBox.prototype.disable = function() {
      this._options.disabled = true;
      this._applyState();
      return this;
    };
    TextBox.prototype.enable = function() {
      this._options.disabled = false;
      this._applyState();
      return this;
    };
    TextBox.prototype.readonly = function(mode) {
      this._options.readonly = mode !== false;
      this._applyState();
      return this;
    };
    TextBox.prototype.setEditable = function(mode) {
      this._options.editable = mode !== false;
      this._applyState();
      return this;
    };
    TextBox.prototype.resize = function(width, height, silent) {
      this._options.width = width == null ? this._options.width : width;
      this._options.height = height == null ? this._options.height : height;
      this._shell.style.width = cssSize(this._options.width, 200);
      this._shell.style.height = cssSize(this._options.height, 30);
      this._field.classList.toggle("fui-textbox-label-top-field", this._options.labelPosition === "top");
      if (!silent) {
        this._invoke("onResize", this._options.width, this._options.height);
        this._emit("resize", { width: this._options.width, height: this._options.height });
      }
      return this;
    };
    TextBox.prototype.on = function(name, listener) {
      if (typeof listener !== "function") return this;
      if (!this._listeners[name]) this._listeners[name] = [];
      this._listeners[name].push(listener);
      return this;
    };
    TextBox.prototype.off = function(name, listener) {
      var listeners = this._listeners[name];
      if (!listeners) return this;
      this._listeners[name] = listener ? listeners.filter(function(item) {
        return item !== listener;
      }) : [];
      return this;
    };
    TextBox.prototype.destroy = function() {
      var parent;
      if (this._destroyed) return;
      this._destroyed = true;
      this._editor.removeEventListener("input", this._onInput);
      this._editor.removeEventListener("focus", this._onFocus);
      this._editor.removeEventListener("blur", this._onBlur);
      this._beforeAddon.removeEventListener("click", this._onAddonClick);
      this._afterAddon.removeEventListener("click", this._onAddonClick);
      if (this._button) this._button.removeEventListener("click", this._onButtonClick);
      if (this._source.form) this._source.form.removeEventListener("reset", this._onFormReset);
      parent = this._field.parentNode;
      this._source.style.display = this._originalDisplay;
      this._source.removeAttribute("aria-hidden");
      delete this._source.__fabuiTextBox;
      parent.insertBefore(this._source, this._field);
      parent.removeChild(this._field);
      this._listeners = {};
    };
    TextBox.defaults = defaults;
    TextBox.editorDefinition = editorDefinition;
    return TextBox;
  }

  // src/editbox/number-editbox.js?v=20260717-editbox-v21
  function createNumberBoxFactory(TextBox, editorDefinitions2) {
    "use strict";
    if (typeof TextBox !== "function") {
      throw new Error("fabui.NumberBox requires fabui.TextBox.");
    }
    editorDefinitions2 = editorDefinitions2 || {};
    var editorDefinition = editorDefinitions2.number || editorDefinitions2.numberbox || null;
    var numberDefaults = {
      min: null,
      max: null,
      precision: null,
      thousandsSeparator: false,
      decimalSeparator: ".",
      groupSeparator: "",
      prefix: "",
      suffix: "",
      parser: null,
      formatter: null,
      filter: null,
      onChange: null
    };
    function assign2(target) {
      var index;
      var source;
      var key;
      for (index = 1; index < arguments.length; index += 1) {
        source = arguments[index] || {};
        for (key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
    function resolveElement2(element) {
      return typeof element === "string" ? document.querySelector(element) : element;
    }
    function readNumberAttribute(element, name) {
      var value = element.getAttribute(name);
      return value == null || value === "" || !isFinite(Number(value)) ? void 0 : Number(value);
    }
    function readElementOptions(element) {
      var options = {};
      var names = ["decimalSeparator", "groupSeparator", "prefix", "suffix"];
      var index;
      var value;
      value = readNumberAttribute(element, "min");
      if (value !== void 0) options.min = value;
      value = readNumberAttribute(element, "max");
      if (value !== void 0) options.max = value;
      value = readNumberAttribute(element, "precision");
      if (value !== void 0) options.precision = value;
      for (index = 0; index < names.length; index += 1) {
        value = element.getAttribute(names[index]);
        if (value != null) options[names[index]] = value;
      }
      return options;
    }
    function removeAll(text, token) {
      return token ? text.split(token).join("") : text;
    }
    function normalizePrecision(value) {
      if (editorDefinition && typeof editorDefinition.normalizePrecision === "function") {
        return editorDefinition.normalizePrecision(value);
      }
      if (value == null || value === false || value === "") return null;
      value = Math.floor(Number(value));
      return isFinite(value) && value >= 0 ? Math.min(20, value) : null;
    }
    function NumberBox(element, options) {
      var sourceValue;
      var textBoxOptions;
      if (!(this instanceof NumberBox)) {
        return new NumberBox(element, options);
      }
      this._source = resolveElement2(element);
      if (!this._source || this._source.tagName !== "INPUT") {
        throw new Error("fabui.NumberBox requires an input element.");
      }
      if (this._source.__fabuiNumberBox) {
        return this._source.__fabuiNumberBox;
      }
      options = options || {};
      sourceValue = Object.prototype.hasOwnProperty.call(options, "value") ? options.value : this._source.value;
      this._options = assign2({}, TextBox.defaults || {}, numberDefaults, readElementOptions(this._source), options);
      this._options.precision = normalizePrecision(this._options.precision);
      if (!this._options.groupSeparator && (this._options.thousandsSeparator === true || this._options.useThousandsSeparator === true || this._options.showThousandsSeparator === true)) {
        this._options.groupSeparator = ",";
      }
      this._listeners = {};
      this._destroyed = false;
      textBoxOptions = assign2({}, options, {
        cls: "fui-numberbox" + (options.cls ? " " + options.cls : ""),
        value: "",
        type: "text",
        multiline: false,
        onChange: null
      });
      this._textbox = new TextBox(this._source, textBoxOptions);
      this._editor = this._textbox.textbox();
      if (editorDefinition && editorDefinition.className) {
        editorDefinition.className.split(/\s+/).forEach(function(className) {
          if (className) this._editor.classList.add(className);
        }, this);
      } else {
        this._editor.classList.add("textbox-f", "numberbox-f", "fg-editor-numberbox");
      }
      this._editor.inputMode = editorDefinition && editorDefinition.inputMode ? editorDefinition.inputMode : "decimal";
      this._initialValue = this._normalizeValue(sourceValue);
      this._lastCommittedValue = "";
      this._bind();
      this._source.__fabuiNumberBox = this;
      this.setValue(sourceValue, true);
    }
    NumberBox.prototype._bind = function() {
      var self = this;
      this._onFocus = function() {
        self._editor.value = self._getEditingText(self.getValue());
        self._editor.select();
      };
      this._onBlur = function() {
        self.fix();
      };
      this._onKeyDown = function(event) {
        self._handleKeyDown(event);
      };
      this._onInput = function() {
        self._syncLiveValue();
      };
      this._onCopy = function(event) {
        self._handleCopy(event);
      };
      this._onFormReset = function() {
        window.setTimeout(function() {
          if (!self._destroyed) self.reset();
        }, 0);
      };
      this._editor.addEventListener("focus", this._onFocus);
      this._editor.addEventListener("blur", this._onBlur);
      this._editor.addEventListener("keydown", this._onKeyDown);
      this._editor.addEventListener("input", this._onInput);
      this._editor.addEventListener("copy", this._onCopy);
      if (this._source.form) this._source.form.addEventListener("reset", this._onFormReset);
    };
    NumberBox.prototype._handleKeyDown = function(event) {
      var key = event.key;
      var text = this._editor.value;
      var selectionStart = this._editor.selectionStart == null ? text.length : this._editor.selectionStart;
      var selectionEnd = this._editor.selectionEnd == null ? selectionStart : this._editor.selectionEnd;
      var selectedText = text.slice(selectionStart, selectionEnd);
      if (key === "Enter") {
        event.preventDefault();
        this.fix();
        this._editor.select();
        return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || key.length !== 1) {
        return;
      }
      if (typeof this._options.filter === "function") {
        if (this._options.filter.call(this._source, event) === false) {
          event.preventDefault();
        }
        return;
      }
      if (editorDefinition && typeof editorDefinition.isTextAllowed === "function") {
        if (!editorDefinition.isTextAllowed(this._editor, key, this._options)) event.preventDefault();
        return;
      }
      if (key >= "0" && key <= "9") {
        return;
      }
      if (key === "-" && !(this._options.min != null && Number(this._options.min) >= 0)) {
        if (text.indexOf("-") < 0 || selectedText.indexOf("-") >= 0) {
          return;
        }
      }
      if (key === this._options.decimalSeparator && this._options.precision > 0) {
        if (text.indexOf(key) < 0 || selectedText.indexOf(key) >= 0) {
          return;
        }
      }
      if (this._options.groupSeparator && key === this._options.groupSeparator) {
        return;
      }
      event.preventDefault();
    };
    NumberBox.prototype._syncLiveValue = function() {
      var text;
      var number;
      this._sanitizeEditingText();
      text = this._stripFormatting(this._editor.value);
      number = editorDefinition && typeof editorDefinition.parse === "function" ? editorDefinition.parse(text, this._options) : parseFloat(text);
      this._source.value = number != null && isFinite(number) ? String(number) : "";
    };
    NumberBox.prototype._sanitizeEditingText = function() {
      var text;
      var result = "";
      var sign = "";
      var hasDecimal = false;
      var decimalSeparator = String(this._options.decimalSeparator || ".");
      var groupSeparator = String(this._options.groupSeparator || "");
      var selectionStart;
      var index;
      var character;
      if (typeof this._options.filter === "function") {
        return;
      }
      text = this._editor.value;
      selectionStart = this._editor.selectionStart == null ? text.length : this._editor.selectionStart;
      if (editorDefinition && typeof editorDefinition.sanitize === "function") {
        result = editorDefinition.sanitize(text, this._options);
        result = editorDefinition.format(result, assign2({}, this._options, { precision: null }));
        if (result !== text) {
          this._editor.value = result;
          if (this._editor.setSelectionRange) {
            selectionStart = Math.min(selectionStart, result.length);
            this._editor.setSelectionRange(selectionStart, selectionStart);
          }
        }
        return;
      }
      for (index = 0; index < text.length; index += 1) {
        character = text.charAt(index);
        if (character >= "0" && character <= "9") {
          result += character;
        } else if (character === "-" && !sign && !(this._options.min != null && Number(this._options.min) >= 0)) {
          sign = "-";
        } else if (character === decimalSeparator && this._options.precision > 0 && !hasDecimal) {
          result += character;
          hasDecimal = true;
        } else if (groupSeparator && character === groupSeparator) {
          result += character;
        }
      }
      result = sign + result;
      if (result !== text) {
        this._editor.value = result;
        if (this._editor.setSelectionRange) {
          selectionStart = Math.min(selectionStart, result.length);
          this._editor.setSelectionRange(selectionStart, selectionStart);
        }
      }
    };
    NumberBox.prototype._stripFormatting = function(value) {
      var text = value == null ? "" : String(value).trim();
      text = removeAll(text, String(this._options.prefix || "").trim());
      text = removeAll(text, String(this._options.suffix || "").trim());
      if (editorDefinition && typeof editorDefinition.stripFormatting === "function") {
        return editorDefinition.stripFormatting(text, this._options);
      }
      text = removeAll(text, this._options.groupSeparator);
      if (this._options.decimalSeparator && this._options.decimalSeparator !== ".") {
        text = text.replace(this._options.decimalSeparator, ".");
      }
      return text.replace(/\s/g, "");
    };
    NumberBox.prototype._normalizeValue = function(value) {
      var parsed = value;
      var number;
      var precision = this._options.precision;
      if (value == null || value === "") {
        return "";
      }
      if (typeof this._options.parser === "function") {
        parsed = this._options.parser.call(this._source, value);
      } else if (editorDefinition && typeof editorDefinition.parse === "function") {
        parsed = this._stripFormatting(value);
        number = editorDefinition.parse(parsed, this._options);
        parsed = number;
      } else {
        parsed = this._stripFormatting(value);
      }
      if (number == null) number = parseFloat(parsed);
      if (!isFinite(number)) {
        return "";
      }
      if (this._options.min != null) {
        number = Math.max(Number(this._options.min), number);
      }
      if (this._options.max != null) {
        number = Math.min(Number(this._options.max), number);
      }
      if (number === 0) {
        number = 0;
      }
      return precision == null ? String(number) : number.toFixed(precision);
    };
    NumberBox.prototype._formatValue = function(value) {
      var parts;
      var integer;
      var fraction;
      var sign = "";
      if (value == null || value === "") {
        return "";
      }
      if (typeof this._options.formatter === "function") {
        return String(this._options.formatter.call(this._source, value));
      }
      if (editorDefinition && typeof editorDefinition.format === "function") {
        return String(this._options.prefix || "") + editorDefinition.format(value, this._options) + String(this._options.suffix || "");
      }
      parts = String(value).split(".");
      integer = parts[0];
      fraction = parts[1] || "";
      if (integer.charAt(0) === "-") {
        sign = "-";
        integer = integer.slice(1);
      }
      if (this._options.groupSeparator) {
        integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, this._options.groupSeparator);
      }
      return String(this._options.prefix || "") + sign + integer + (fraction ? String(this._options.decimalSeparator || ".") + fraction : "") + String(this._options.suffix || "");
    };
    NumberBox.prototype._getEditingText = function(value) {
      if (value == null || value === "") {
        return "";
      }
      return this._options.decimalSeparator === "." ? String(value) : String(value).replace(".", this._options.decimalSeparator);
    };
    NumberBox.prototype._handleCopy = function(event) {
      var start = this._editor.selectionStart;
      var end = this._editor.selectionEnd;
      var text;
      var clipboardData;
      if (!editorDefinition || typeof editorDefinition.getCopyText !== "function" || start == null || end == null || start === end) return;
      text = this._stripFormatting(this._editor.value.slice(Math.min(start, end), Math.max(start, end)));
      clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.setData) return;
      clipboardData.setData("text/plain", text);
      event.preventDefault();
      event.stopPropagation();
    };
    NumberBox.prototype._emit = function(name, detail) {
      var listeners = (this._listeners[name] || []).slice();
      listeners.forEach(function(listener) {
        listener(detail);
      });
    };
    NumberBox.prototype.options = function() {
      return this._options;
    };
    NumberBox.prototype.textbox = function() {
      return this._editor;
    };
    NumberBox.prototype.button = function() {
      return this._textbox.button();
    };
    NumberBox.prototype.getIcon = function(index) {
      return this._textbox.getIcon(index);
    };
    NumberBox.prototype.getText = function() {
      return this._editor.value;
    };
    NumberBox.prototype.setText = function(value) {
      this._editor.value = value == null ? "" : String(value);
      this._syncLiveValue();
      return this;
    };
    NumberBox.prototype.getValue = function() {
      return this._source.value;
    };
    NumberBox.prototype.getNumber = function() {
      return this.getValue() === "" ? null : Number(this.getValue());
    };
    NumberBox.prototype.setValue = function(value, silent) {
      var oldValue = this._lastCommittedValue;
      var normalized = this._normalizeValue(value);
      var text = this._formatValue(normalized);
      this._textbox.setValue(text, true);
      this._source.value = normalized;
      this._options.value = normalized;
      this._lastCommittedValue = normalized;
      if (!silent && normalized !== oldValue) {
        if (typeof this._options.onChange === "function") {
          this._options.onChange.call(this, normalized, oldValue);
        }
        this._emit("change", { value: normalized, oldValue });
      }
      return this;
    };
    NumberBox.prototype.fix = function() {
      return this.setValue(this._editor.value);
    };
    NumberBox.prototype.initValue = function(value) {
      this._initialValue = this._normalizeValue(value);
      return this.setValue(this._initialValue, true);
    };
    NumberBox.prototype.clear = function() {
      return this.setValue("");
    };
    NumberBox.prototype.reset = function() {
      return this.setValue(this._initialValue);
    };
    NumberBox.prototype.focus = function() {
      this._textbox.focus();
      return this;
    };
    NumberBox.prototype.resize = function(width, height) {
      this._textbox.resize(width, height);
      this._options.width = this._textbox.options().width;
      this._options.height = this._textbox.options().height;
      return this;
    };
    NumberBox.prototype.disable = function() {
      this._textbox.disable();
      this._options.disabled = true;
      return this;
    };
    NumberBox.prototype.enable = function() {
      this._textbox.enable();
      this._options.disabled = false;
      return this;
    };
    NumberBox.prototype.readonly = function(mode) {
      this._textbox.readonly(mode);
      this._options.readonly = mode !== false;
      return this;
    };
    NumberBox.prototype.setEditable = function(mode) {
      this._textbox.setEditable(mode);
      this._options.editable = mode !== false;
      return this;
    };
    NumberBox.prototype.on = function(name, listener) {
      if (typeof listener !== "function") return this;
      if (!this._listeners[name]) this._listeners[name] = [];
      this._listeners[name].push(listener);
      return this;
    };
    NumberBox.prototype.off = function(name, listener) {
      var listeners = this._listeners[name];
      if (!listeners) return this;
      this._listeners[name] = listener ? listeners.filter(function(item) {
        return item !== listener;
      }) : [];
      return this;
    };
    NumberBox.prototype.destroy = function() {
      if (this._destroyed) return;
      this._destroyed = true;
      this._editor.removeEventListener("focus", this._onFocus);
      this._editor.removeEventListener("blur", this._onBlur);
      this._editor.removeEventListener("keydown", this._onKeyDown);
      this._editor.removeEventListener("input", this._onInput);
      this._editor.removeEventListener("copy", this._onCopy);
      if (this._source.form) this._source.form.removeEventListener("reset", this._onFormReset);
      delete this._source.__fabuiNumberBox;
      this._textbox.destroy();
      this._listeners = {};
    };
    NumberBox.defaults = assign2({}, TextBox.defaults || {}, numberDefaults);
    NumberBox.editorDefinition = editorDefinition;
    return NumberBox;
  }

  // src/editbox/date-editbox.js?v=20260717-editbox-v21
  function createDateBoxFactory(TextBox, editorDefinitions2) {
    "use strict";
    if (typeof TextBox !== "function") {
      throw new Error("fabui.DateBox requires fabui.TextBox.");
    }
    editorDefinitions2 = editorDefinitions2 || {};
    var editorDefinition = editorDefinitions2.date || editorDefinitions2.datebox || null;
    var localePacks = {
      en: {
        currentText: "Today",
        closeText: "Close",
        okText: "Ok",
        yearText: "Year",
        previousYearText: "Previous year",
        nextYearText: "Next year",
        weeks: ["S", "M", "T", "W", "T", "F", "S"],
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      },
      "zh-TW": {
        currentText: "\u4ECA\u5929",
        closeText: "\u95DC\u9589",
        okText: "\u78BA\u5B9A",
        yearText: "\u5E74\u4EFD",
        previousYearText: "\u4E0A\u4E00\u5E74",
        nextYearText: "\u4E0B\u4E00\u5E74",
        weeks: ["\u65E5", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"],
        months: ["\u4E00\u6708", "\u4E8C\u6708", "\u4E09\u6708", "\u56DB\u6708", "\u4E94\u6708", "\u516D\u6708", "\u4E03\u6708", "\u516B\u6708", "\u4E5D\u6708", "\u5341\u6708", "\u5341\u4E00\u6708", "\u5341\u4E8C\u6708"]
      },
      "zh-CN": {
        currentText: "\u4ECA\u5929",
        closeText: "\u5173\u95ED",
        okText: "\u786E\u5B9A",
        yearText: "\u5E74\u4EFD",
        previousYearText: "\u4E0A\u4E00\u5E74",
        nextYearText: "\u4E0B\u4E00\u5E74",
        weeks: ["\u65E5", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"],
        months: ["\u4E00\u6708", "\u4E8C\u6708", "\u4E09\u6708", "\u56DB\u6708", "\u4E94\u6708", "\u516D\u6708", "\u4E03\u6708", "\u516B\u6708", "\u4E5D\u6708", "\u5341\u6708", "\u5341\u4E00\u6708", "\u5341\u4E8C\u6708"]
      }
    };
    var dateDefaults = {
      iconWidth: 28,
      panelWidth: 250,
      panelHeight: "auto",
      locale: "en",
      firstDay: 0,
      showWeek: false,
      weekNumberHeader: "",
      currentText: null,
      closeText: null,
      okText: null,
      yearText: null,
      previousYearText: null,
      nextYearText: null,
      weeks: null,
      months: null,
      buttons: null,
      sharedCalendar: null,
      validator: null,
      formatter: null,
      parser: null,
      mask: "9999/99/99",
      autoUnmask: true,
      maskValueIncludesLiterals: null,
      onSelect: null,
      onChange: null,
      onShowPanel: null,
      onHidePanel: null,
      editorType: "datebox",
      calendarMode: "days"
    };
    function assign2(target) {
      var index;
      var source;
      var key;
      for (index = 1; index < arguments.length; index += 1) {
        source = arguments[index] || {};
        for (key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
    function resolveElement2(element) {
      return typeof element === "string" ? document.querySelector(element) : element;
    }
    function cssSize(value, fallback) {
      if (value == null || value === "") return fallback + "px";
      return typeof value === "number" ? value + "px" : String(value);
    }
    function cloneDate(date) {
      return date instanceof Date && isFinite(date.getTime()) ? new Date(date.getTime()) : null;
    }
    function dateOnly(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
    function sameDate(left, right) {
      return Boolean(left && right) && left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
    }
    function pad(value) {
      return value < 10 ? "0" + value : String(value);
    }
    function defaultFormatter(date) {
      return pad(date.getMonth() + 1) + "/" + pad(date.getDate()) + "/" + date.getFullYear();
    }
    function defaultParser(value) {
      var text = value == null ? "" : String(value).trim();
      var parts;
      var year;
      var month;
      var day;
      var parsed;
      if (!text) return dateOnly(/* @__PURE__ */ new Date());
      parts = text.split("/");
      month = parseInt(parts[0], 10);
      day = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        parsed = new Date(year, month - 1, day);
        if (parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) {
          return parsed;
        }
      }
      return dateOnly(/* @__PURE__ */ new Date());
    }
    function readElementOptions(element) {
      var options = {};
      var panelWidth = element.getAttribute("panelWidth");
      var panelHeight = element.getAttribute("panelHeight");
      var firstDay = element.getAttribute("firstDay");
      var locale = element.getAttribute("locale");
      if (panelWidth != null && panelWidth !== "") options.panelWidth = isFinite(Number(panelWidth)) ? Number(panelWidth) : panelWidth;
      if (panelHeight != null && panelHeight !== "") options.panelHeight = isFinite(Number(panelHeight)) ? Number(panelHeight) : panelHeight;
      if (firstDay != null && firstDay !== "") options.firstDay = Number(firstDay);
      if (locale) options.locale = locale;
      return options;
    }
    function normalizeLocale(name) {
      if (localePacks[name]) return name;
      if (/^zh(?:-|_)?tw/i.test(name || "")) return "zh-TW";
      if (/^zh/i.test(name || "")) return "zh-CN";
      return "en";
    }
    function isYearMonthMask(mask) {
      return /^9999[\/-]99$/.test(String(mask || ""));
    }
    function CalendarController(owner) {
      this.owner = owner;
      this.element = owner._calendar;
    }
    CalendarController.prototype.options = function(options) {
      if (!options) {
        return {
          current: cloneDate(this.owner._viewDate),
          selected: cloneDate(this.owner._selectedDate),
          firstDay: this.owner._options.firstDay,
          weeks: this.owner._options.weeks.slice(),
          months: this.owner._options.months.slice(),
          showWeek: this.owner._options.showWeek,
          validator: this.owner._options.validator
        };
      }
      assign2(this.owner._options, options);
      this.owner._normalizeCalendarOptions();
      this.owner._renderCalendar();
      return this;
    };
    CalendarController.prototype.moveTo = function(date) {
      var value = cloneDate(date);
      if (value) {
        this.owner._viewDate = dateOnly(value);
        this.owner._renderCalendar();
      }
      return this;
    };
    CalendarController.prototype.select = function(date) {
      this.owner._selectDate(date);
      return this;
    };
    CalendarController.prototype.resize = function() {
      this.owner._positionPanel();
      return this;
    };
    function DateBox(element, options) {
      var source;
      var userOptions = options || {};
      var textOptions;
      var icons;
      var locale;
      var self = this;
      if (!(this instanceof DateBox)) return new DateBox(element, options);
      source = resolveElement2(element);
      if (!source || !/^(INPUT|TEXTAREA)$/.test(source.tagName)) {
        throw new Error("fabui.DateBox requires an input or textarea element.");
      }
      if (source.__fabuiDateBox) return source.__fabuiDateBox;
      this._source = source;
      this._listeners = {};
      this._destroyed = false;
      this._panelVisible = false;
      this._hasCustomFormatter = typeof userOptions.formatter === "function";
      this._hasCustomParser = typeof userOptions.parser === "function";
      this._explicitMask = Object.prototype.hasOwnProperty.call(userOptions, "mask");
      this._initialValue = Object.prototype.hasOwnProperty.call(userOptions, "value") ? userOptions.value : source.value;
      this._options = assign2({}, DateBox.defaults, readElementOptions(source), userOptions);
      this._editorDefinition = editorDefinitions2[this._options.editorType] || editorDefinition;
      locale = localePacks[normalizeLocale(this._options.locale)];
      this._options.locale = normalizeLocale(this._options.locale);
      if (!Object.prototype.hasOwnProperty.call(userOptions, "currentText")) this._options.currentText = locale.currentText;
      if (!Object.prototype.hasOwnProperty.call(userOptions, "closeText")) this._options.closeText = locale.closeText;
      if (!Object.prototype.hasOwnProperty.call(userOptions, "okText")) this._options.okText = locale.okText;
      if (!Object.prototype.hasOwnProperty.call(userOptions, "yearText")) this._options.yearText = locale.yearText;
      if (!Object.prototype.hasOwnProperty.call(userOptions, "previousYearText")) this._options.previousYearText = locale.previousYearText;
      if (!Object.prototype.hasOwnProperty.call(userOptions, "nextYearText")) this._options.nextYearText = locale.nextYearText;
      if (!Object.prototype.hasOwnProperty.call(userOptions, "weeks")) this._options.weeks = locale.weeks.slice();
      if (!Object.prototype.hasOwnProperty.call(userOptions, "months")) this._options.months = locale.months.slice();
      this._normalizeCalendarOptions();
      icons = Array.isArray(userOptions.icons) ? userOptions.icons.slice() : [];
      icons.push({
        iconCls: "icon-datebox fui-datebox-trigger",
        align: "right",
        width: this._options.iconWidth,
        title: "Calendar",
        onClick: function() {
          self.togglePanel();
        }
      });
      textOptions = assign2({}, userOptions, {
        cls: ((userOptions.cls || "") + " fui-datebox").trim(),
        icons,
        onChange: null
      });
      this._textbox = new TextBox(source, textOptions);
      this._editor = this._textbox.textbox();
      if (this._editorDefinition && this._editorDefinition.className) {
        this._editorDefinition.className.split(/\s+/).forEach(function(className) {
          if (className) this._editor.classList.add(className);
        }, this);
      } else {
        this._editor.classList.add("textbox-f", "datebox-f", "fg-editor-datebox");
      }
      this._editor.inputMode = this._editorDefinition && this._editorDefinition.inputMode ? this._editorDefinition.inputMode : "numeric";
      this._field = this._editor.closest(".fui-textbox-field");
      this._shell = this._editor.closest(".fui-textbox");
      this._buildPanel();
      this._configureSharedCalendar();
      this._bind();
      source.__fabuiDateBox = this;
      this.initValue(this._initialValue);
    }
    DateBox.prototype._normalizeCalendarOptions = function() {
      var self = this;
      var definition = this._editorDefinition;
      this._options.calendarMode = isYearMonthMask(this._options.mask) ? "months" : this._options.calendarMode === "months" ? "months" : "days";
      this._options.firstDay = Math.max(0, Math.min(6, parseInt(this._options.firstDay, 10) || 0));
      this._options.weeks = Array.isArray(this._options.weeks) && this._options.weeks.length === 7 ? this._options.weeks.slice() : localePacks.en.weeks.slice();
      this._options.months = Array.isArray(this._options.months) && this._options.months.length === 12 ? this._options.months.slice() : localePacks.en.months.slice();
      this._options.formatter = typeof this._options.formatter === "function" ? this._options.formatter : definition && typeof definition.format === "function" ? function(date) {
        return definition.format(date, self._options || {});
      } : defaultFormatter;
      this._options.parser = typeof this._options.parser === "function" ? this._options.parser : definition && typeof definition.parse === "function" ? function(value) {
        return definition.parse(value, self._options || {});
      } : defaultParser;
      this._options.validator = typeof this._options.validator === "function" ? this._options.validator : function() {
        return true;
      };
    };
    DateBox.prototype._buildPanel = function() {
      var panel = document.createElement("div");
      var calendar = document.createElement("div");
      var header = document.createElement("div");
      var title = document.createElement("button");
      var body = document.createElement("div");
      var menu = document.createElement("div");
      var footer = document.createElement("div");
      var nav = [
        ["fui-calendar-prevyear", "Previous year", -12],
        ["fui-calendar-prevmonth", "Previous month", -1],
        ["fui-calendar-nextmonth", "Next month", 1],
        ["fui-calendar-nextyear", "Next year", 12]
      ];
      var index;
      var button;
      panel.className = "fui-datebox-panel fui-" + this._options.editorType + "-panel";
      panel.hidden = true;
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "false");
      calendar.className = "fui-calendar" + (this._options.calendarMode === "months" ? " fui-calendar-month-mode" : "");
      header.className = "fui-calendar-header";
      title.className = "fui-calendar-title";
      title.type = "button";
      body.className = "fui-calendar-body";
      menu.className = "fui-calendar-menu";
      menu.hidden = true;
      footer.className = "fui-datebox-buttons";
      for (index = 0; index < nav.length; index += 1) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "fui-calendar-nav " + nav[index][0];
        button.setAttribute("aria-label", nav[index][1]);
        button.setAttribute("data-month-offset", nav[index][2]);
        header.appendChild(button);
      }
      header.appendChild(title);
      calendar.appendChild(header);
      calendar.appendChild(body);
      calendar.appendChild(menu);
      panel.appendChild(calendar);
      panel.appendChild(footer);
      document.body.appendChild(panel);
      this._panel = panel;
      this._calendar = calendar;
      this._calendarHeader = header;
      this._calendarTitle = title;
      this._calendarBody = body;
      this._calendarMenu = menu;
      this._buttonBar = footer;
      this._viewDate = dateOnly(/* @__PURE__ */ new Date());
      this._selectedDate = null;
      this._calendarController = new CalendarController(this);
      this._renderButtons();
      this._renderCalendar();
    };
    DateBox.prototype._configureSharedCalendar = function() {
      var host = resolveElement2(this._options.sharedCalendar);
      var state;
      var self = this;
      if (host) {
        state = host.__fabuiDateBoxSharedCalendar;
        if (state) {
          if (this._calendar.parentNode) this._calendar.parentNode.removeChild(this._calendar);
          this._calendar = state.calendar;
          this._calendarHeader = this._calendar.querySelector(".fui-calendar-header");
          this._calendarTitle = this._calendar.querySelector(".fui-calendar-title");
          this._calendarBody = this._calendar.querySelector(".fui-calendar-body");
          this._calendarMenu = this._calendar.querySelector(".fui-calendar-menu");
        } else {
          state = { calendar: this._calendar, host };
          host.__fabuiDateBoxSharedCalendar = state;
          host.classList.add("fui-datebox-shared-calendar");
          host.appendChild(this._calendar);
        }
        this._sharedCalendarState = state;
      }
      this._calendarController = new CalendarController(this);
      if (!this._calendar.__fabuiDateBoxClickBound) {
        this._calendar.addEventListener("click", function(event) {
          var owner = self._calendar.__fabuiDateBoxOwner;
          if (owner && !owner._destroyed) owner._handleCalendarClick(event);
        });
        this._calendar.__fabuiDateBoxClickBound = true;
      }
      this._calendar.__fabuiDateBoxOwner = this;
      this._renderCalendar();
    };
    DateBox.prototype._bind = function() {
      var self = this;
      this._onInputKeyDown = function(event) {
        self._handleKeyDown(event);
      };
      this._onInput = function() {
        self._handleInput();
      };
      this._onCopy = function(event) {
        self._handleCopy(event);
      };
      this._onInputBlur = function() {
        window.setTimeout(function() {
          if (!self._destroyed && !self._panel.contains(document.activeElement)) self.fix();
        }, 0);
      };
      this._onPanelMouseDown = function(event) {
        if (!event.target.closest("input")) event.preventDefault();
      };
      this._onPanelClick = function(event) {
        if (event.target.closest("[data-button-index]")) self._handleCalendarClick(event);
      };
      this._onDocumentMouseDown = function(event) {
        if (self._panelVisible && !self._panel.contains(event.target) && !self._field.contains(event.target)) self.hidePanel();
      };
      this._onDocumentKeyDown = function(event) {
        if (!self._panelVisible || event.key !== "Escape") return;
        event.preventDefault();
        self.hidePanel();
      };
      this._onWindowResize = function() {
        if (self._panelVisible) self._positionPanel();
      };
      this._onWindowScroll = function() {
        if (self._panelVisible) self._positionPanel();
      };
      this._onFormReset = function() {
        window.setTimeout(function() {
          if (!self._destroyed) self.reset();
        }, 0);
      };
      this._editor.addEventListener("keydown", this._onInputKeyDown);
      this._editor.addEventListener("input", this._onInput);
      this._editor.addEventListener("copy", this._onCopy);
      this._editor.addEventListener("blur", this._onInputBlur);
      this._panel.addEventListener("mousedown", this._onPanelMouseDown);
      this._panel.addEventListener("click", this._onPanelClick);
      document.addEventListener("mousedown", this._onDocumentMouseDown);
      document.addEventListener("keydown", this._onDocumentKeyDown);
      window.addEventListener("resize", this._onWindowResize);
      window.addEventListener("scroll", this._onWindowScroll, true);
      if (this._source.form) this._source.form.addEventListener("reset", this._onFormReset);
    };
    DateBox.prototype._renderCalendar = function() {
      var year = this._viewDate.getFullYear();
      var month = this._viewDate.getMonth();
      var first = new Date(year, month, 1);
      var offset = (first.getDay() - this._options.firstDay + 7) % 7;
      var cursor = new Date(year, month, 1 - offset);
      var today = dateOnly(/* @__PURE__ */ new Date());
      var table = document.createElement("table");
      var head = document.createElement("thead");
      var row = document.createElement("tr");
      var body = document.createElement("tbody");
      var index;
      var dayIndex;
      var cell;
      var button;
      var date;
      var valid;
      this._calendarTitle.textContent = this._options.months[month] + " " + year;
      table.setAttribute("role", "grid");
      if (this._options.showWeek) {
        cell = document.createElement("th");
        cell.className = "fui-calendar-week-number";
        cell.textContent = this._options.weekNumberHeader || "";
        row.appendChild(cell);
      }
      for (index = 0; index < 7; index += 1) {
        cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = this._options.weeks[(this._options.firstDay + index) % 7];
        row.appendChild(cell);
      }
      head.appendChild(row);
      table.appendChild(head);
      for (index = 0; index < 6; index += 1) {
        row = document.createElement("tr");
        if (this._options.showWeek) {
          cell = document.createElement("td");
          cell.className = "fui-calendar-week-number";
          cell.textContent = this._weekNumber(cursor);
          row.appendChild(cell);
        }
        for (dayIndex = 0; dayIndex < 7; dayIndex += 1) {
          date = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
          valid = this._options.validator.call(this._source, date);
          cell = document.createElement("td");
          button = document.createElement("button");
          button.type = "button";
          button.className = "fui-calendar-day";
          button.textContent = date.getDate();
          button.setAttribute("data-date", date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()));
          button.setAttribute("aria-label", defaultFormatter(date));
          if (date.getMonth() !== month) button.classList.add("fui-calendar-other-month");
          if (date.getDay() === 0) button.classList.add("fui-calendar-sunday");
          if (date.getDay() === 6) button.classList.add("fui-calendar-saturday");
          if (sameDate(date, today)) button.classList.add("fui-calendar-today");
          if (sameDate(date, this._selectedDate)) {
            button.classList.add("fui-calendar-selected");
            button.setAttribute("aria-selected", "true");
          }
          if (!valid) {
            button.disabled = true;
            button.classList.add("fui-calendar-disabled");
          }
          cell.appendChild(button);
          row.appendChild(cell);
          cursor.setDate(cursor.getDate() + 1);
        }
        body.appendChild(row);
      }
      table.appendChild(body);
      this._calendarBody.textContent = "";
      this._calendarBody.appendChild(table);
      this._renderMonthMenu();
      if (this._options.calendarMode === "months") {
        this._calendarMenu.hidden = false;
        this._calendarBody.hidden = true;
      }
    };
    DateBox.prototype._weekNumber = function(date) {
      var current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      var day = current.getUTCDay() || 7;
      var yearStart;
      current.setUTCDate(current.getUTCDate() + 4 - day);
      yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
      return Math.ceil(((current - yearStart) / 864e5 + 1) / 7);
    };
    DateBox.prototype._renderMonthMenu = function() {
      var yearRow = document.createElement("div");
      var yearInput = document.createElement("input");
      var previousYear = document.createElement("button");
      var nextYear = document.createElement("button");
      var grid = document.createElement("div");
      var index;
      var button;
      yearRow.className = "fui-calendar-menu-year-row";
      yearInput.className = "fui-calendar-menu-year";
      yearInput.type = "number";
      yearInput.value = this._viewDate.getFullYear();
      yearInput.setAttribute("aria-label", this._options.yearText);
      previousYear.type = "button";
      previousYear.className = "fui-calendar-menu-year-nav fui-calendar-menu-prevyear";
      previousYear.setAttribute("aria-label", this._options.previousYearText);
      previousYear.setAttribute("data-year-offset", "-1");
      nextYear.type = "button";
      nextYear.className = "fui-calendar-menu-year-nav fui-calendar-menu-nextyear";
      nextYear.setAttribute("aria-label", this._options.nextYearText);
      nextYear.setAttribute("data-year-offset", "1");
      yearRow.appendChild(previousYear);
      yearRow.appendChild(yearInput);
      yearRow.appendChild(nextYear);
      grid.className = "fui-calendar-menu-months";
      for (index = 0; index < 12; index += 1) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "fui-calendar-menu-month";
        button.textContent = this._options.months[index];
        button.setAttribute("data-month", index);
        if (this._selectedDate && this._selectedDate.getFullYear() === this._viewDate.getFullYear() && this._selectedDate.getMonth() === index) {
          button.classList.add("fui-calendar-menu-month-selected");
          button.setAttribute("aria-selected", "true");
        }
        if (!this._options.validator.call(this._source, new Date(this._viewDate.getFullYear(), index, 1))) {
          button.disabled = true;
          button.classList.add("fui-calendar-menu-month-disabled");
        }
        grid.appendChild(button);
      }
      this._calendarMenu.textContent = "";
      this._calendarMenu.appendChild(yearRow);
      this._calendarMenu.appendChild(grid);
    };
    DateBox.prototype._renderButtons = function() {
      var buttons = Array.isArray(this._options.buttons) ? this._options.buttons : [
        { text: this._options.currentText, action: "today" },
        { text: this._options.closeText, action: "close" }
      ];
      var index;
      var button;
      var descriptor;
      this._buttonDescriptors = buttons.slice();
      this._buttonBar.textContent = "";
      for (index = 0; index < buttons.length; index += 1) {
        descriptor = buttons[index] || {};
        button = document.createElement("button");
        button.type = "button";
        button.className = "fui-datebox-button";
        button.textContent = typeof descriptor.text === "function" ? descriptor.text(this._source) : String(descriptor.text || "");
        button.setAttribute("data-button-index", index);
        this._buttonBar.appendChild(button);
      }
    };
    DateBox.prototype._handleCalendarClick = function(event) {
      var nav = event.target.closest("[data-month-offset]");
      var yearNav = event.target.closest("[data-year-offset]");
      var day = event.target.closest("[data-date]");
      var month = event.target.closest("[data-month]");
      var footer = event.target.closest("[data-button-index]");
      var yearInput;
      var date;
      var descriptor;
      if (yearNav) {
        yearInput = this._calendarMenu.querySelector(".fui-calendar-menu-year");
        this._viewDate = new Date(
          (parseInt(yearInput.value, 10) || this._viewDate.getFullYear()) + Number(yearNav.getAttribute("data-year-offset")),
          this._viewDate.getMonth(),
          1
        );
        this._renderCalendar();
        return;
      }
      if (nav) {
        this._moveMonth(Number(nav.getAttribute("data-month-offset")));
        return;
      }
      if (event.target === this._calendarTitle) {
        if (this._options.calendarMode === "months") return;
        this._calendarMenu.hidden = !this._calendarMenu.hidden;
        this._calendarBody.hidden = !this._calendarMenu.hidden;
        return;
      }
      if (month) {
        yearInput = this._calendarMenu.querySelector(".fui-calendar-menu-year");
        this._viewDate = new Date(parseInt(yearInput.value, 10) || this._viewDate.getFullYear(), Number(month.getAttribute("data-month")), 1);
        if (this._options.calendarMode === "months" && !month.disabled) {
          this._selectDate(this._viewDate);
          return;
        }
        this._calendarMenu.hidden = true;
        this._calendarBody.hidden = false;
        this._renderCalendar();
        return;
      }
      if (day && !day.disabled) {
        date = this._parseIsoDate(day.getAttribute("data-date"));
        this._selectDate(date);
        return;
      }
      if (footer) {
        descriptor = this._buttonDescriptors[Number(footer.getAttribute("data-button-index"))] || {};
        if (typeof descriptor.handler === "function") {
          descriptor.handler.call(footer, this._source, this);
        } else if (descriptor.action === "today") {
          this._selectDate(dateOnly(/* @__PURE__ */ new Date()));
        } else if (descriptor.action === "close") {
          this.hidePanel();
        }
      }
    };
    DateBox.prototype._handleKeyDown = function(event) {
      var key = event.key;
      var current;
      var definition = this._editorDefinition;
      if ((key === "Backspace" || key === "Delete") && definition && typeof definition.handleDelete === "function" && !this._hasCustomFormatter && !this._hasCustomParser) {
        event.preventDefault();
        definition.handleDelete(this._editor, key, this._options);
        this._handleInput();
        return;
      }
      if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing && key.length === 1 && definition && typeof definition.isTextAllowed === "function") {
        if (!definition.isTextAllowed(this._editor, key, this._options)) event.preventDefault();
        return;
      }
      if (key === "ArrowDown" && (event.altKey || event.metaKey) || key === "F4") {
        event.preventDefault();
        this.showPanel();
        return;
      }
      if (key === "Escape" && this._panelVisible) {
        event.preventDefault();
        this.hidePanel();
        return;
      }
      if (key === "Enter") {
        event.preventDefault();
        if (this._panelVisible) {
          this._selectDate(this._viewDate);
        } else {
          this.fix();
        }
        return;
      }
      if (!this._panelVisible || ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown"].indexOf(key) < 0) return;
      event.preventDefault();
      current = cloneDate(this._viewDate) || dateOnly(/* @__PURE__ */ new Date());
      if (this._options.calendarMode === "months") {
        if (key === "ArrowLeft") current.setMonth(current.getMonth() - 1);
        if (key === "ArrowRight") current.setMonth(current.getMonth() + 1);
        if (key === "ArrowUp") current.setMonth(current.getMonth() - 4);
        if (key === "ArrowDown") current.setMonth(current.getMonth() + 4);
        if (key === "PageUp") current.setFullYear(current.getFullYear() - 1);
        if (key === "PageDown") current.setFullYear(current.getFullYear() + 1);
        this._viewDate = current;
        this._renderCalendar();
        return;
      }
      if (key === "ArrowLeft") current.setDate(current.getDate() - 1);
      if (key === "ArrowRight") current.setDate(current.getDate() + 1);
      if (key === "ArrowUp") current.setDate(current.getDate() - 7);
      if (key === "ArrowDown") current.setDate(current.getDate() + 7);
      if (key === "PageUp") current.setMonth(current.getMonth() - 1);
      if (key === "PageDown") current.setMonth(current.getMonth() + 1);
      this._viewDate = current;
      this._renderCalendar();
    };
    DateBox.prototype._handleInput = function() {
      var text;
      var dataValue;
      var definition = this._editorDefinition;
      if (!definition || typeof definition.sanitize !== "function" || this._hasCustomFormatter || this._hasCustomParser) return;
      text = definition.sanitize(this._editor.value, this._options);
      if (text !== this._editor.value) {
        this._editor.value = text;
        if (this._editor.setSelectionRange) this._editor.setSelectionRange(text.length, text.length);
      }
      dataValue = definition.getDataValue(text, this._options);
      this._source.value = definition.parse(text, this._options) ? dataValue : text;
    };
    DateBox.prototype._handleCopy = function(event) {
      var start = this._editor.selectionStart;
      var end = this._editor.selectionEnd;
      var clipboardData;
      var text;
      var definition = this._editorDefinition;
      if (!definition || typeof definition.getCopyText !== "function" || start == null || end == null || start === end) return;
      text = definition.getCopyText(this._editor.value.slice(Math.min(start, end), Math.max(start, end)), this._options);
      clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.setData) return;
      clipboardData.setData("text/plain", text);
      event.preventDefault();
      event.stopPropagation();
    };
    DateBox.prototype._moveMonth = function(offset) {
      var date = new Date(this._viewDate.getFullYear(), this._viewDate.getMonth() + offset, 1);
      this._viewDate = date;
      this._renderCalendar();
    };
    DateBox.prototype._parseIsoDate = function(value) {
      var parts = String(value).split("-");
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    };
    DateBox.prototype._selectDate = function(date) {
      var value = cloneDate(date);
      if (!value || !this._options.validator.call(this._source, value)) return this;
      this.setDate(value);
      if (typeof this._options.onSelect === "function") this._options.onSelect.call(this._source, cloneDate(value));
      this._emit("select", { date: cloneDate(value) });
      this.hidePanel();
      return this;
    };
    DateBox.prototype._positionPanel = function() {
      var rect;
      var width;
      var height;
      var top;
      var left;
      if (!this._panelVisible) return;
      rect = this._shell.getBoundingClientRect();
      width = this._options.panelWidth === "auto" ? rect.width : parseFloat(this._options.panelWidth) || 250;
      this._panel.style.width = cssSize(width, 250);
      this._panel.style.height = this._options.panelHeight === "auto" ? "auto" : cssSize(this._options.panelHeight, 290);
      height = this._panel.offsetHeight;
      top = rect.bottom + window.pageYOffset;
      left = rect.left + window.pageXOffset;
      if (rect.bottom + height > document.documentElement.clientHeight && rect.top > height) {
        top = rect.top + window.pageYOffset - height;
      }
      if (left + width > window.pageXOffset + document.documentElement.clientWidth) {
        left = Math.max(window.pageXOffset, window.pageXOffset + document.documentElement.clientWidth - width);
      }
      this._panel.style.left = Math.round(left) + "px";
      this._panel.style.top = Math.round(top) + "px";
    };
    DateBox.prototype._emit = function(name, detail) {
      var listeners = (this._listeners[name] || []).slice();
      listeners.forEach(function(listener) {
        listener(detail);
      });
    };
    DateBox.prototype.options = function() {
      return this._options;
    };
    DateBox.prototype.calendar = function() {
      return this._calendarController;
    };
    DateBox.prototype.panel = function() {
      return this._panel;
    };
    DateBox.prototype.textbox = function() {
      return this._editor;
    };
    DateBox.prototype.getIcon = function(index) {
      return this._textbox.getIcon(index);
    };
    DateBox.prototype.getText = function() {
      return this._editor.value;
    };
    DateBox.prototype.getValue = function() {
      return this._source.value;
    };
    DateBox.prototype.getDate = function() {
      return cloneDate(this._selectedDate);
    };
    DateBox.prototype.setText = function(value) {
      this._textbox.setValue(value == null ? "" : String(value), true);
      this._source.value = value == null ? "" : String(value);
      return this;
    };
    DateBox.prototype.setValue = function(value, silent) {
      var oldValue = this._lastCommittedValue || "";
      var text = value == null ? "" : String(value).trim();
      var date = null;
      var dataValue = "";
      if (text) date = cloneDate(this._options.parser.call(this._source, text));
      if (date) {
        date = dateOnly(date);
        text = String(this._options.formatter.call(this._source, date));
        dataValue = this._editorDefinition && typeof this._editorDefinition.getDataValue === "function" ? this._editorDefinition.getDataValue(date, this._options) : text;
      } else {
        text = "";
      }
      this._selectedDate = date;
      if (date) this._viewDate = cloneDate(date);
      this._textbox.setValue(text, true);
      this._source.value = dataValue;
      this._options.value = dataValue;
      this._lastCommittedValue = dataValue;
      this._renderCalendar();
      if (!silent && dataValue !== oldValue) {
        if (typeof this._options.onChange === "function") this._options.onChange.call(this, dataValue, oldValue);
        this._emit("change", { value: dataValue, oldValue });
      }
      return this;
    };
    DateBox.prototype.setDate = function(date, silent) {
      var value = cloneDate(date);
      return this.setValue(value ? this._options.formatter.call(this._source, value) : "", silent);
    };
    DateBox.prototype.fix = function() {
      return this.setValue(this._editor.value);
    };
    DateBox.prototype.initValue = function(value) {
      this._initialValue = value == null ? "" : String(value);
      return this.setValue(this._initialValue, true);
    };
    DateBox.prototype.clear = function() {
      return this.setValue("");
    };
    DateBox.prototype.reset = function() {
      return this.setValue(this._initialValue);
    };
    DateBox.prototype.focus = function() {
      this._textbox.focus();
      return this;
    };
    DateBox.prototype.showPanel = function() {
      if (this._options.disabled || this._panelVisible) return this;
      if (this._editor.value) this.setValue(this._editor.value, true);
      if (this._sharedCalendarState) this._panel.insertBefore(this._calendar, this._buttonBar);
      this._calendar.__fabuiDateBoxOwner = this;
      this._renderCalendar();
      this._panelVisible = true;
      this._panel.hidden = false;
      this._shell.classList.add("fui-datebox-open");
      this._positionPanel();
      if (typeof this._options.onShowPanel === "function") this._options.onShowPanel.call(this);
      this._emit("showPanel", { panel: this._panel });
      return this;
    };
    DateBox.prototype.hidePanel = function() {
      if (!this._panelVisible) return this;
      this._panelVisible = false;
      this._panel.hidden = true;
      this._shell.classList.remove("fui-datebox-open");
      if (this._sharedCalendarState && this._sharedCalendarState.host) {
        this._sharedCalendarState.host.appendChild(this._calendar);
      }
      if (typeof this._options.onHidePanel === "function") this._options.onHidePanel.call(this);
      this._emit("hidePanel", { panel: this._panel });
      return this;
    };
    DateBox.prototype.togglePanel = function() {
      return this._panelVisible ? this.hidePanel() : this.showPanel();
    };
    DateBox.prototype.resize = function(width, height) {
      this._textbox.resize(width, height);
      this._options.width = this._textbox.options().width;
      this._options.height = this._textbox.options().height;
      this._positionPanel();
      return this;
    };
    DateBox.prototype.disable = function() {
      this.hidePanel();
      this._textbox.disable();
      this._options.disabled = true;
      return this;
    };
    DateBox.prototype.enable = function() {
      this._textbox.enable();
      this._options.disabled = false;
      return this;
    };
    DateBox.prototype.readonly = function(mode) {
      this._textbox.readonly(mode);
      this._options.readonly = mode !== false;
      return this;
    };
    DateBox.prototype.setEditable = function(mode) {
      this._textbox.setEditable(mode);
      this._options.editable = mode !== false;
      return this;
    };
    DateBox.prototype.cloneFrom = function(from) {
      var source = from instanceof DateBox ? from : resolveElement2(from);
      var instance = source instanceof DateBox ? source : source && source.__fabuiDateBox;
      if (!instance) throw new Error("fabui.DateBox cloneFrom requires another DateBox.");
      assign2(this._options, instance.options());
      this._normalizeCalendarOptions();
      this._renderButtons();
      this.resize(this._options.width, this._options.height);
      return this.setValue(instance.getValue(), true);
    };
    DateBox.prototype.on = function(name, listener) {
      if (typeof listener !== "function") return this;
      if (!this._listeners[name]) this._listeners[name] = [];
      this._listeners[name].push(listener);
      return this;
    };
    DateBox.prototype.off = function(name, listener) {
      var listeners = this._listeners[name];
      if (!listeners) return this;
      this._listeners[name] = listener ? listeners.filter(function(item) {
        return item !== listener;
      }) : [];
      return this;
    };
    DateBox.prototype.destroy = function() {
      if (this._destroyed) return;
      this._destroyed = true;
      this._editor.removeEventListener("keydown", this._onInputKeyDown);
      this._editor.removeEventListener("input", this._onInput);
      this._editor.removeEventListener("copy", this._onCopy);
      this._editor.removeEventListener("blur", this._onInputBlur);
      this._panel.removeEventListener("mousedown", this._onPanelMouseDown);
      this._panel.removeEventListener("click", this._onPanelClick);
      document.removeEventListener("mousedown", this._onDocumentMouseDown);
      document.removeEventListener("keydown", this._onDocumentKeyDown);
      window.removeEventListener("resize", this._onWindowResize);
      window.removeEventListener("scroll", this._onWindowScroll, true);
      if (this._source.form) this._source.form.removeEventListener("reset", this._onFormReset);
      if (this._sharedCalendarState && this._sharedCalendarState.host && this._calendar.parentNode !== this._sharedCalendarState.host) {
        this._sharedCalendarState.host.appendChild(this._calendar);
      }
      if (!this._sharedCalendarState && this._calendar.__fabuiDateBoxOwner === this) {
        this._calendar.__fabuiDateBoxOwner = null;
      }
      if (this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
      delete this._source.__fabuiDateBox;
      this._textbox.destroy();
      this._listeners = {};
    };
    DateBox.defaults = assign2({}, TextBox.defaults || {}, dateDefaults, localePacks.en, {
      formatter: editorDefinition ? null : defaultFormatter,
      parser: editorDefinition ? null : defaultParser
    });
    DateBox.editorDefinition = editorDefinition;
    DateBox.locales = localePacks;
    DateBox.addLocale = function(name, pack) {
      if (name && pack) localePacks[name] = assign2({}, localePacks.en, pack);
      return DateBox;
    };
    return DateBox;
  }

  // src/editbox/combo-editbox.js?v=20260717-editbox-v21
  function createComboBoxFactory(TextBox, editorDefinitions2) {
    "use strict";
    if (typeof TextBox !== "function") {
      throw new Error("fabui.ComboBox requires fabui.TextBox.");
    }
    editorDefinitions2 = editorDefinitions2 || {};
    var editorDefinition = editorDefinitions2.combo || editorDefinitions2.combobox || null;
    var localePacks = {
      en: { openListText: "Open list" },
      "zh-TW": { openListText: "\u958B\u555F\u6E05\u55AE" },
      "zh-CN": { openListText: "\u6253\u5F00\u5217\u8868" }
    };
    var comboDefaults = {
      iconWidth: 28,
      valueField: "value",
      textField: "text",
      groupField: null,
      groupPosition: "static",
      groupFormatter: null,
      mode: "local",
      method: "post",
      url: null,
      data: null,
      queryParams: {},
      panelWidth: null,
      panelHeight: 300,
      panelMinWidth: null,
      panelMaxWidth: null,
      panelMinHeight: null,
      panelMaxHeight: null,
      panelAlign: "left",
      panelValign: "auto",
      multiple: false,
      multiline: false,
      separator: ",",
      hasDownArrow: true,
      selectOnNavigation: true,
      showItemIcon: false,
      showValueInList: false,
      limitToList: false,
      delay: 200,
      locale: "en",
      openListText: null,
      filter: null,
      formatter: null,
      loader: null,
      loadFilter: null,
      onBeforeLoad: null,
      onLoadSuccess: null,
      onLoadError: null,
      onSelect: null,
      onUnselect: null,
      onClick: null,
      onChange: null,
      onShowPanel: null,
      onHidePanel: null
    };
    function assign2(target) {
      var index;
      var source;
      var key;
      for (index = 1; index < arguments.length; index += 1) {
        source = arguments[index] || {};
        for (key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
        }
      }
      return target;
    }
    function resolveElement2(element) {
      return typeof element === "string" ? document.querySelector(element) : element;
    }
    function cssSize(value, fallback) {
      if (value == null || value === "") return fallback + "px";
      return typeof value === "number" ? value + "px" : String(value);
    }
    function uniqueStrings(values) {
      var result = [];
      (values || []).forEach(function(value) {
        value = value == null ? "" : String(value);
        if (result.indexOf(value) < 0) result.push(value);
      });
      return result;
    }
    function readElementOptions(element) {
      var options = {};
      var stringNames = ["valueField", "textField", "groupField", "groupPosition", "mode", "method", "url", "separator", "panelAlign", "panelValign"];
      var numberNames = ["panelWidth", "panelHeight", "panelMinWidth", "panelMaxWidth", "panelMinHeight", "panelMaxHeight", "delay"];
      var booleanNames = ["multiple", "multiline", "hasDownArrow", "selectOnNavigation", "showItemIcon", "showValueInList", "limitToList"];
      var index;
      var value;
      for (index = 0; index < stringNames.length; index += 1) {
        value = element.getAttribute(stringNames[index]);
        if (value != null && value !== "") options[stringNames[index]] = value;
      }
      for (index = 0; index < numberNames.length; index += 1) {
        value = element.getAttribute(numberNames[index]);
        if (value != null && value !== "") options[numberNames[index]] = isFinite(Number(value)) ? Number(value) : value;
      }
      for (index = 0; index < booleanNames.length; index += 1) {
        value = element.getAttribute(booleanNames[index]);
        if (value != null) options[booleanNames[index]] = value !== "false";
      }
      if (element.hasAttribute("multiple")) options.multiple = true;
      options.disabled = element.disabled;
      options.readonly = element.readOnly;
      options.required = element.required;
      value = element.getAttribute("label");
      if (value) options.label = value;
      value = element.getAttribute("labelPosition");
      if (value) options.labelPosition = value;
      return options;
    }
    function normalizeLocale(name) {
      if (localePacks[name]) return name;
      if (/^zh(?:-|_)?tw/i.test(name || "")) return "zh-TW";
      if (/^zh/i.test(name || "")) return "zh-CN";
      return "en";
    }
    function encodeParams(params) {
      var parts = [];
      Object.keys(params || {}).forEach(function(key) {
        var value = params[key];
        if (value == null) return;
        parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(value)));
      });
      return parts.join("&");
    }
    function ComboBox(element, options) {
      var source = resolveElement2(element);
      var userOptions = options || {};
      var markupOptions;
      var textOptions;
      var icons;
      var self = this;
      if (!(this instanceof ComboBox)) return new ComboBox(element, options);
      if (!source || !/^(INPUT|SELECT|TEXTAREA)$/.test(source.tagName)) {
        throw new Error("fabui.ComboBox requires an input, select, or textarea element.");
      }
      if (source.__fabuiComboBox) return source.__fabuiComboBox;
      this._source = source;
      this._listeners = {};
      this._data = [];
      this._filteredData = [];
      this._values = [];
      this._activeIndex = -1;
      this._panelVisible = false;
      this._destroyed = false;
      this._queryTimer = null;
      this._requestToken = 0;
      this._originalDisplay = source.style.display;
      this._originalAriaHidden = source.getAttribute("aria-hidden");
      markupOptions = readElementOptions(source);
      this._options = assign2({}, ComboBox.defaults, markupOptions, userOptions);
      this._options.multiple = Boolean(this._options.multiple);
      this._options.multiline = Boolean(this._options.multiline);
      this._options.mode = this._options.mode === "remote" ? "remote" : "local";
      this._options.method = String(this._options.method || "post").toLowerCase();
      this._options.locale = normalizeLocale(this._options.locale);
      if (!Object.prototype.hasOwnProperty.call(userOptions, "openListText")) {
        this._options.openListText = localePacks[this._options.locale].openListText;
      }
      this._options.filter = typeof this._options.filter === "function" ? this._options.filter : function(query, row) {
        return String(row[this._options.textField] == null ? "" : row[this._options.textField]).toLowerCase().indexOf(String(query || "").toLowerCase()) >= 0;
      };
      this._options.loadFilter = typeof this._options.loadFilter === "function" ? this._options.loadFilter : function(data) {
        return data;
      };
      this._selectData = source.tagName === "SELECT" ? this._readSelectData(source) : [];
      this._initialValues = this._readInitialValues(userOptions);
      if (source.tagName === "SELECT") {
        this._textboxSource = document.createElement("input");
        this._textboxSource.type = "text";
        source.parentNode.insertBefore(this._textboxSource, source);
        source.style.display = "none";
        source.setAttribute("aria-hidden", "true");
      } else {
        this._textboxSource = source;
      }
      icons = Array.isArray(this._options.icons) ? this._options.icons.slice() : [];
      if (this._options.hasDownArrow) {
        icons.push({
          iconCls: "fui-combobox-arrow",
          align: "right",
          width: this._options.iconWidth,
          title: this._options.openListText,
          onClick: function() {
            self.togglePanel();
          }
        });
      }
      textOptions = assign2({}, markupOptions, userOptions, {
        cls: ((this._options.cls || "") + " fui-combobox").trim(),
        multiple: void 0,
        multiline: this._options.multiline,
        icons,
        editable: this._options.editable,
        disabled: this._options.disabled,
        readonly: this._options.readonly,
        value: "",
        onChange: null
      });
      this._textbox = new TextBox(this._textboxSource, textOptions);
      this._editor = this._textbox.textbox();
      if (editorDefinition && editorDefinition.className) {
        editorDefinition.className.split(/\s+/).forEach(function(className) {
          if (className) this._editor.classList.add(className);
        }, this);
      }
      if (editorDefinition && editorDefinition.inputMode) {
        this._editor.inputMode = editorDefinition.inputMode;
      }
      this._field = this._editor.closest(".fui-textbox-field");
      this._shell = this._editor.closest(".fui-textbox");
      this._buildPanel();
      this._bind();
      source.__fabuiComboBox = this;
      if (this._options.data) {
        this.loadData(this._options.data, true);
      } else if (this._selectData.length) {
        this.loadData(this._selectData, true);
      } else {
        this.setValues(this._initialValues, true);
      }
      if (!this._options.data && !this._selectData.length && (this._options.url || this._options.loader)) {
        this.reload();
      }
    }
    ComboBox.prototype._readSelectData = function(select) {
      var options = this._options;
      var data = [];
      Array.prototype.forEach.call(select.children, function(child) {
        var group = child.tagName === "OPTGROUP" ? child.label : null;
        var elements = child.tagName === "OPTGROUP" ? child.children : [child];
        Array.prototype.forEach.call(elements, function(option) {
          if (option.tagName !== "OPTION") return;
          var row = {};
          row[options.valueField] = option.value || option.textContent;
          row[options.textField] = option.textContent;
          row.selected = option.selected;
          row.disabled = option.disabled;
          row.iconCls = option.getAttribute("iconCls") || "";
          if (group) {
            options.groupField = options.groupField || "group";
            row[options.groupField] = group;
          }
          data.push(row);
        });
      });
      return data;
    };
    ComboBox.prototype._readInitialValues = function(userOptions) {
      var value;
      var values = [];
      if (Object.prototype.hasOwnProperty.call(userOptions, "value")) {
        value = userOptions.value;
        values = Array.isArray(value) ? value : String(value == null ? "" : value).split(this._options.separator);
      } else if (this._source.tagName === "SELECT") {
        Array.prototype.forEach.call(this._source.options, function(option) {
          if (option.selected) values.push(option.value || option.textContent);
        });
      } else if (this._source.value) {
        values = this._options.multiple ? this._source.value.split(this._options.separator) : [this._source.value];
      }
      return uniqueStrings(values.filter(function(item) {
        return item !== "";
      }));
    };
    ComboBox.prototype._buildPanel = function() {
      var panel = document.createElement("div");
      panel.className = "fui-combobox-panel";
      panel.hidden = true;
      panel.setAttribute("role", "listbox");
      panel.setAttribute("aria-multiselectable", this._options.multiple ? "true" : "false");
      document.body.appendChild(panel);
      this._panel = panel;
    };
    ComboBox.prototype._bind = function() {
      var self = this;
      this._onInput = function() {
        self._handleInput();
      };
      this._onKeyDown = function(event) {
        self._handleKeyDown(event);
      };
      this._onBlur = function() {
        window.setTimeout(function() {
          if (!self._destroyed && !self._panel.contains(document.activeElement)) {
            self._fixInput();
            self.hidePanel();
          }
        }, 60);
      };
      this._onPanelMouseDown = function(event) {
        event.preventDefault();
      };
      this._onPanelClick = function(event) {
        self._handlePanelClick(event);
      };
      this._onPanelMouseOver = function(event) {
        var item = event.target.closest(".fui-combobox-item");
        if (!item || item.classList.contains("fui-combobox-item-disabled")) return;
        self._setActiveIndex(Number(item.getAttribute("data-index")), false);
      };
      this._onDocumentPointerDown = function(event) {
        if (!self._panelVisible) return;
        if (self._panel.contains(event.target) || self._shell.contains(event.target)) return;
        self.hidePanel();
      };
      this._onDocumentKeyDown = function(event) {
        if (!self._panelVisible || event.key !== "Escape") return;
        event.preventDefault();
        self.hidePanel();
      };
      this._onWindowResize = function() {
        if (self._panelVisible) self._positionPanel();
      };
      this._onWindowScroll = function() {
        if (self._panelVisible) self._positionPanel();
      };
      this._onFormReset = function() {
        window.setTimeout(function() {
          if (!self._destroyed) self.reset();
        }, 0);
      };
      this._editor.addEventListener("input", this._onInput);
      this._editor.addEventListener("keydown", this._onKeyDown);
      this._editor.addEventListener("blur", this._onBlur);
      this._panel.addEventListener("mousedown", this._onPanelMouseDown);
      this._panel.addEventListener("click", this._onPanelClick);
      this._panel.addEventListener("mouseover", this._onPanelMouseOver);
      document.addEventListener("pointerdown", this._onDocumentPointerDown, true);
      document.addEventListener("keydown", this._onDocumentKeyDown);
      window.addEventListener("resize", this._onWindowResize);
      window.addEventListener("scroll", this._onWindowScroll, true);
      if (this._source.form) this._source.form.addEventListener("reset", this._onFormReset);
    };
    ComboBox.prototype._handleInput = function() {
      var self = this;
      var query = this._getQueryText();
      window.clearTimeout(this._queryTimer);
      this._setTypedValues(this._editor.value);
      this.showPanel();
      this._queryTimer = window.setTimeout(function() {
        if (self._options.mode === "remote") {
          self._request({ q: query }, true);
        } else {
          self._filterData(query);
        }
      }, Math.max(0, Number(this._options.delay) || 0));
    };
    ComboBox.prototype._getQueryText = function() {
      var text = this._editor.value;
      if (!this._options.multiple) return text.trim();
      return text.split(this._options.separator).pop().trim();
    };
    ComboBox.prototype._setTypedValues = function(text) {
      var values = this._options.multiple ? String(text).split(this._options.separator) : [text];
      var old = this._values.slice();
      values = values.map(function(value) {
        return value.trim();
      }).filter(function(value) {
        return value !== "";
      });
      if (!this._options.multiple && !values.length) values = [];
      this._values = uniqueStrings(values);
      this._syncSourceValue();
      this._notifyChange(old);
    };
    ComboBox.prototype._filterData = function(query) {
      var self = this;
      var exact;
      this._filteredData = this._data.filter(function(row) {
        return self._options.filter.call(self, query, row) !== false;
      });
      this._activeIndex = -1;
      this._renderPanel();
      if (!this._options.multiple && query) {
        exact = this._findRowByText(query);
        if (exact) this.setValue(exact[this._options.valueField]);
      }
    };
    ComboBox.prototype._handleKeyDown = function(event) {
      var key = event.key;
      if (key === "ArrowDown" && (event.altKey || event.metaKey) || key === "F4") {
        event.preventDefault();
        this.showPanel();
        return;
      }
      if (key === "Escape" && this._panelVisible) {
        event.preventDefault();
        this.hidePanel();
        return;
      }
      if (key === "ArrowDown" || key === "ArrowUp") {
        event.preventDefault();
        this.showPanel();
        this._moveActive(key === "ArrowDown" ? 1 : -1);
        return;
      }
      if (key === "Enter" && this._panelVisible) {
        event.preventDefault();
        if (this._activeIndex >= 0) this._chooseRow(this._filteredData[this._activeIndex]);
        if (!this._options.multiple) this.hidePanel();
        return;
      }
      if (key === "Enter") {
        event.preventDefault();
        this._fixInput();
      }
    };
    ComboBox.prototype._moveActive = function(direction) {
      var length = this._filteredData.length;
      var index = this._activeIndex;
      var attempts = 0;
      if (!length) return;
      do {
        index = (index + direction + length) % length;
        attempts += 1;
      } while (this._filteredData[index] && this._filteredData[index].disabled && attempts <= length);
      this._setActiveIndex(index, this._options.selectOnNavigation);
    };
    ComboBox.prototype._setActiveIndex = function(index, selectRow) {
      var active;
      this._activeIndex = index;
      Array.prototype.forEach.call(this._panel.querySelectorAll(".fui-combobox-item-active"), function(item) {
        item.classList.remove("fui-combobox-item-active");
      });
      active = this._panel.querySelector('.fui-combobox-item[data-index="' + index + '"]');
      if (active) {
        active.classList.add("fui-combobox-item-active");
        if (active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
        if (selectRow && this._filteredData[index]) this._chooseRow(this._filteredData[index], true);
      }
    };
    ComboBox.prototype._handlePanelClick = function(event) {
      var item = event.target.closest(".fui-combobox-item");
      var row;
      if (!item || item.classList.contains("fui-combobox-item-disabled")) return;
      row = this._filteredData[Number(item.getAttribute("data-index"))];
      if (!row) return;
      if (typeof this._options.onClick === "function") this._options.onClick.call(this._source, row);
      this._emit("click", { record: row });
      this._chooseRow(row);
      if (!this._options.multiple) this.hidePanel();
    };
    ComboBox.prototype._chooseRow = function(row, remainOpen) {
      var value = String(row[this._options.valueField]);
      if (this._options.multiple && this._values.indexOf(value) >= 0) {
        this.unselect(value);
      } else {
        this.select(value);
      }
      if (!remainOpen && !this._options.multiple) this.hidePanel();
    };
    ComboBox.prototype._fixInput = function() {
      var self = this;
      var values;
      if (this._options.limitToList) {
        values = this._values.map(function(value) {
          var row = self._findRow(value) || self._findRowByText(value);
          return row ? String(row[self._options.valueField]) : null;
        }).filter(function(value) {
          return value != null;
        });
        this.setValues(values);
      } else {
        this.setValues(this._values);
      }
    };
    ComboBox.prototype._renderPanel = function() {
      var self = this;
      var lastGroup;
      this._panel.textContent = "";
      this._filteredData.forEach(function(row, index) {
        var group = self._options.groupField ? row[self._options.groupField] : null;
        var groupElement;
        var item;
        var icon;
        var text;
        var code;
        var output;
        var value = String(row[self._options.valueField]);
        if (group != null && group !== lastGroup) {
          groupElement = document.createElement("div");
          groupElement.className = "fui-combobox-group" + (self._options.groupPosition === "sticky" ? " fui-combobox-group-sticky" : "");
          if (typeof self._options.groupFormatter === "function") {
            output = self._options.groupFormatter.call(self._source, group);
            self._appendFormatted(groupElement, output);
          } else {
            groupElement.textContent = String(group);
          }
          self._panel.appendChild(groupElement);
          lastGroup = group;
        }
        item = document.createElement("div");
        item.className = "fui-combobox-item" + (group != null ? " fui-combobox-group-item" : "");
        item.setAttribute("data-index", index);
        item.setAttribute("data-value", value);
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", self._values.indexOf(value) >= 0 ? "true" : "false");
        if (row.disabled) item.classList.add("fui-combobox-item-disabled");
        if (self._values.indexOf(value) >= 0) item.classList.add("fui-combobox-item-selected");
        if (self._options.showItemIcon && row.iconCls) {
          icon = document.createElement("span");
          icon.className = "fui-combobox-item-icon " + row.iconCls;
          item.appendChild(icon);
        }
        if (typeof self._options.formatter === "function") {
          output = self._options.formatter.call(self._source, row);
          self._appendFormatted(item, output);
        } else {
          text = String(row[self._options.textField] == null ? "" : row[self._options.textField]);
          code = String(row[self._options.valueField] == null ? "" : row[self._options.valueField]);
          if (self._options.showValueInList && code && code !== text) {
            output = document.createElement("span");
            output.className = "fui-combobox-item-text";
            output.textContent = text;
            item.appendChild(output);
            output = document.createElement("span");
            output.className = "fui-combobox-item-value";
            output.textContent = "(" + code + ")";
            item.appendChild(output);
            item.setAttribute("aria-label", text + " (" + code + ")");
          } else {
            item.appendChild(document.createTextNode(text));
          }
        }
        self._panel.appendChild(item);
      });
      if (!this._filteredData.length) {
        var empty = document.createElement("div");
        empty.className = "fui-combobox-empty";
        empty.textContent = "";
        this._panel.appendChild(empty);
      }
    };
    ComboBox.prototype._appendFormatted = function(element, output) {
      if (output && output.nodeType) {
        element.appendChild(output);
      } else {
        element.insertAdjacentHTML("beforeend", output == null ? "" : String(output));
      }
    };
    ComboBox.prototype._findRow = function(value) {
      var field = this._options.valueField;
      var stringValue = String(value);
      var index;
      for (index = 0; index < this._data.length; index += 1) {
        if (String(this._data[index][field]) === stringValue) return this._data[index];
      }
      return null;
    };
    ComboBox.prototype._findRowByText = function(text) {
      var field = this._options.textField;
      var query = String(text).toLowerCase();
      var index;
      for (index = 0; index < this._data.length; index += 1) {
        if (String(this._data[index][field]).toLowerCase() === query) return this._data[index];
      }
      return null;
    };
    ComboBox.prototype._syncText = function() {
      var self = this;
      var texts = this._values.map(function(value) {
        var row = self._findRow(value);
        return row ? String(row[self._options.textField]) : String(value);
      });
      this._textbox.setValue(texts.join(this._options.separator), true);
      this._syncSourceValue();
      this._updateTextboxIcon();
    };
    ComboBox.prototype._syncSourceValue = function() {
      var self = this;
      if (this._source.tagName === "SELECT") {
        Array.prototype.forEach.call(this._source.options, function(option) {
          option.selected = self._values.indexOf(String(option.value || option.textContent)) >= 0;
        });
        this._textboxSource.value = this._values.join(this._options.separator);
      } else {
        this._source.value = this._options.multiple ? this._values.join(this._options.separator) : this._values[0] || "";
      }
    };
    ComboBox.prototype._updateTextboxIcon = function() {
      var row = this._values.length ? this._findRow(this._values[this._values.length - 1]) : null;
      if (this._textboxIconCls) this._editor.classList.remove(this._textboxIconCls);
      this._textboxIconCls = "";
      this._editor.classList.remove("fui-combobox-text-icon");
      if (this._options.showItemIcon && row && row.iconCls) {
        this._textboxIconCls = row.iconCls;
        this._editor.classList.add("fui-combobox-text-icon", row.iconCls);
      }
    };
    ComboBox.prototype._notifyChange = function(oldValues) {
      var oldValue = this._options.multiple ? oldValues.slice() : oldValues[0] || "";
      var newValue = this._options.multiple ? this._values.slice() : this._values[0] || "";
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
      if (typeof this._options.onChange === "function") this._options.onChange.call(this, newValue, oldValue);
      this._emit("change", { value: newValue, oldValue });
    };
    ComboBox.prototype._positionPanel = function() {
      var rect;
      var width;
      var height;
      var left;
      var top;
      if (!this._panelVisible) return;
      rect = this._shell.getBoundingClientRect();
      width = this._options.panelWidth == null ? rect.width : parseFloat(this._options.panelWidth) || rect.width;
      this._panel.style.width = cssSize(width, rect.width);
      this._panel.style.height = this._options.panelHeight === "auto" ? "auto" : cssSize(this._options.panelHeight, 300);
      this._panel.style.minWidth = this._options.panelMinWidth == null ? "" : cssSize(this._options.panelMinWidth, 0);
      this._panel.style.maxWidth = this._options.panelMaxWidth == null ? "" : cssSize(this._options.panelMaxWidth, width);
      this._panel.style.minHeight = this._options.panelMinHeight == null ? "" : cssSize(this._options.panelMinHeight, 0);
      this._panel.style.maxHeight = this._options.panelMaxHeight == null ? "" : cssSize(this._options.panelMaxHeight, 300);
      height = this._panel.offsetHeight;
      left = this._options.panelAlign === "right" ? rect.right + window.pageXOffset - width : rect.left + window.pageXOffset;
      top = rect.bottom + window.pageYOffset;
      if (this._options.panelValign === "top" || this._options.panelValign === "auto" && rect.bottom + height > document.documentElement.clientHeight && rect.top > height) {
        top = rect.top + window.pageYOffset - height;
      }
      if (left + width > window.pageXOffset + document.documentElement.clientWidth) left = Math.max(window.pageXOffset, window.pageXOffset + document.documentElement.clientWidth - width);
      this._panel.style.left = Math.round(left) + "px";
      this._panel.style.top = Math.round(top) + "px";
    };
    ComboBox.prototype._emit = function(name, detail) {
      var listeners = (this._listeners[name] || []).slice();
      listeners.forEach(function(listener) {
        listener(detail);
      });
    };
    ComboBox.prototype.options = function() {
      return this._options;
    };
    ComboBox.prototype.panel = function() {
      return this._panel;
    };
    ComboBox.prototype.textbox = function() {
      return this._editor;
    };
    ComboBox.prototype.getIcon = function(index) {
      return this._textbox.getIcon(index);
    };
    ComboBox.prototype.getData = function() {
      return this._data.slice();
    };
    ComboBox.prototype.getValue = function() {
      return this._values[0] || "";
    };
    ComboBox.prototype.getValues = function() {
      return this._values.slice();
    };
    ComboBox.prototype.getText = function() {
      return this._editor.value;
    };
    ComboBox.prototype.setText = function(text) {
      this._textbox.setValue(text == null ? "" : String(text), true);
      this._setTypedValues(this._editor.value);
      return this;
    };
    ComboBox.prototype.setValue = function(value, silent) {
      return this.setValues(Array.isArray(value) ? value : [value], silent);
    };
    ComboBox.prototype.setValues = function(values, silent) {
      var self = this;
      var old = this._values.slice();
      var normalized = Array.isArray(values) ? values : String(values == null ? "" : values).split(this._options.separator);
      normalized = uniqueStrings(normalized.filter(function(value) {
        return value != null && String(value) !== "";
      }));
      if (!this._options.multiple && normalized.length > 1) normalized = [normalized[0]];
      if (this._options.limitToList) normalized = normalized.filter(function(value) {
        return self._findRow(value) != null;
      });
      old.forEach(function(value) {
        if (normalized.indexOf(value) < 0) {
          var row = self._findRow(value);
          if (row && typeof self._options.onUnselect === "function") self._options.onUnselect.call(self._source, row);
          if (row) self._emit("unselect", { record: row });
        }
      });
      normalized.forEach(function(value) {
        if (old.indexOf(value) < 0) {
          var row = self._findRow(value);
          if (row && typeof self._options.onSelect === "function") self._options.onSelect.call(self._source, row);
          if (row) self._emit("select", { record: row });
        }
      });
      this._values = normalized;
      this._syncText();
      this._renderPanel();
      if (!silent) this._notifyChange(old);
      return this;
    };
    ComboBox.prototype.select = function(value) {
      var values = this._options.multiple ? this._values.concat([String(value)]) : [String(value)];
      return this.setValues(values);
    };
    ComboBox.prototype.unselect = function(value) {
      value = String(value);
      return this.setValues(this._values.filter(function(item) {
        return item !== value;
      }));
    };
    ComboBox.prototype.clear = function() {
      return this.setValues([]);
    };
    ComboBox.prototype.initValue = function(value) {
      this._initialValues = Array.isArray(value) ? uniqueStrings(value) : uniqueStrings([value]);
      if (!this._options.multiple && this._initialValues.length > 1) {
        this._initialValues = [this._initialValues[0]];
      }
      return this.setValues(this._initialValues, true);
    };
    ComboBox.prototype.reset = function() {
      return this.setValues(this._initialValues);
    };
    ComboBox.prototype.loadData = function(data, silent) {
      var filtered = this._options.loadFilter.call(this._source, data);
      var selected = [];
      var current = this._values.length ? this._values.slice() : this._initialValues.slice();
      this._data = Array.isArray(filtered) ? filtered.slice() : filtered && Array.isArray(filtered.rows) ? filtered.rows.slice() : [];
      this._data.forEach(function(row) {
        if (row && row.selected) selected.push(String(row[this._options.valueField]));
      }, this);
      if (selected.length) current = this._options.multiple ? uniqueStrings(current.concat(selected)) : [selected[selected.length - 1]];
      this._filteredData = this._data.slice();
      this._renderPanel();
      this.setValues(current, silent !== false);
      if (typeof this._options.onLoadSuccess === "function") this._options.onLoadSuccess.call(this._source, data);
      this._emit("loadSuccess", { data });
      return this;
    };
    ComboBox.prototype._request = function(params, remainText, url) {
      var self = this;
      var requestParams = assign2({}, this._options.queryParams || {}, params || {});
      var token = ++this._requestToken;
      var success = function(data) {
        if (token !== self._requestToken || self._destroyed) return;
        var text = self._editor.value;
        self.loadData(data, true);
        if (remainText) self._textbox.setValue(text, true);
      };
      var error = function(errorValue) {
        if (token !== self._requestToken || self._destroyed) return;
        if (typeof self._options.onLoadError === "function") self._options.onLoadError.call(self._source, errorValue);
        self._emit("loadError", { error: errorValue });
      };
      var result;
      if (url) this._options.url = url;
      if (typeof this._options.onBeforeLoad === "function" && this._options.onBeforeLoad.call(this._source, requestParams) === false) return this;
      if (typeof this._options.loader === "function") {
        try {
          result = this._options.loader.call(this._source, requestParams, success, error);
          if (result && typeof result.then === "function") result.then(success, error);
        } catch (loadError) {
          error(loadError);
        }
        return this;
      }
      if (!this._options.url || typeof fetch !== "function") return this;
      var method = this._options.method === "get" ? "GET" : "POST";
      var query = encodeParams(requestParams);
      var requestUrl = this._options.url;
      var fetchOptions = { method, headers: {} };
      if (method === "GET" && query) requestUrl += (requestUrl.indexOf("?") >= 0 ? "&" : "?") + query;
      if (method === "POST") {
        fetchOptions.headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
        fetchOptions.body = query;
      }
      fetch(requestUrl, fetchOptions).then(function(response) {
        if (!response.ok) throw new Error("ComboBox request failed: " + response.status);
        return response.json();
      }).then(success, error);
      return this;
    };
    ComboBox.prototype.reload = function(urlOrParams) {
      if (typeof urlOrParams === "string") return this._request({}, false, urlOrParams);
      if (urlOrParams && typeof urlOrParams === "object") this._options.queryParams = assign2({}, urlOrParams);
      return this._request({}, false);
    };
    ComboBox.prototype.scrollTo = function(value) {
      var stringValue = String(value);
      var item = Array.prototype.filter.call(this._panel.querySelectorAll(".fui-combobox-item"), function(candidate) {
        return candidate.getAttribute("data-value") === stringValue;
      })[0];
      if (item && item.scrollIntoView) item.scrollIntoView({ block: "nearest" });
      return this;
    };
    ComboBox.prototype.showPanel = function() {
      if (this._options.disabled || this._panelVisible) return this;
      this._panelVisible = true;
      this._panel.hidden = false;
      this._shell.classList.add("fui-combobox-open");
      this._filteredData = this._data.slice();
      this._renderPanel();
      this._positionPanel();
      this.scrollTo(this.getValue());
      if (typeof this._options.onShowPanel === "function") this._options.onShowPanel.call(this);
      this._emit("showPanel", { panel: this._panel });
      return this;
    };
    ComboBox.prototype.hidePanel = function() {
      if (!this._panelVisible) return this;
      this._panelVisible = false;
      this._panel.hidden = true;
      this._shell.classList.remove("fui-combobox-open");
      this._activeIndex = -1;
      if (typeof this._options.onHidePanel === "function") this._options.onHidePanel.call(this);
      this._emit("hidePanel", { panel: this._panel });
      return this;
    };
    ComboBox.prototype.togglePanel = function() {
      return this._panelVisible ? this.hidePanel() : this.showPanel();
    };
    ComboBox.prototype.focus = function() {
      this._textbox.focus();
      return this;
    };
    ComboBox.prototype.resize = function(width, height) {
      this._textbox.resize(width, height);
      this._options.width = this._textbox.options().width;
      this._options.height = this._textbox.options().height;
      this._positionPanel();
      return this;
    };
    ComboBox.prototype.disable = function() {
      this.hidePanel();
      this._textbox.disable();
      this._options.disabled = true;
      return this;
    };
    ComboBox.prototype.enable = function() {
      this._textbox.enable();
      this._options.disabled = false;
      return this;
    };
    ComboBox.prototype.readonly = function(mode) {
      this._textbox.readonly(mode);
      this._options.readonly = mode !== false;
      return this;
    };
    ComboBox.prototype.setEditable = function(mode) {
      this._textbox.setEditable(mode);
      this._options.editable = mode !== false;
      return this;
    };
    ComboBox.prototype.on = function(name, listener) {
      if (typeof listener !== "function") return this;
      if (!this._listeners[name]) this._listeners[name] = [];
      this._listeners[name].push(listener);
      return this;
    };
    ComboBox.prototype.off = function(name, listener) {
      var listeners = this._listeners[name];
      if (!listeners) return this;
      this._listeners[name] = listener ? listeners.filter(function(item) {
        return item !== listener;
      }) : [];
      return this;
    };
    ComboBox.prototype.destroy = function() {
      if (this._destroyed) return;
      this._destroyed = true;
      window.clearTimeout(this._queryTimer);
      this._editor.removeEventListener("input", this._onInput);
      this._editor.removeEventListener("keydown", this._onKeyDown);
      this._editor.removeEventListener("blur", this._onBlur);
      this._panel.removeEventListener("mousedown", this._onPanelMouseDown);
      this._panel.removeEventListener("click", this._onPanelClick);
      this._panel.removeEventListener("mouseover", this._onPanelMouseOver);
      document.removeEventListener("pointerdown", this._onDocumentPointerDown, true);
      document.removeEventListener("keydown", this._onDocumentKeyDown);
      window.removeEventListener("resize", this._onWindowResize);
      window.removeEventListener("scroll", this._onWindowScroll, true);
      if (this._source.form) this._source.form.removeEventListener("reset", this._onFormReset);
      if (this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
      this._textbox.destroy();
      if (this._source.tagName === "SELECT") {
        if (this._textboxSource.parentNode) this._textboxSource.parentNode.removeChild(this._textboxSource);
        this._source.style.display = this._originalDisplay;
        if (this._originalAriaHidden == null) this._source.removeAttribute("aria-hidden");
        else this._source.setAttribute("aria-hidden", this._originalAriaHidden);
      }
      delete this._source.__fabuiComboBox;
      this._listeners = {};
    };
    ComboBox.defaults = assign2({}, TextBox.defaults || {}, comboDefaults);
    ComboBox.locales = localePacks;
    ComboBox.addLocale = function(name, pack) {
      if (name && pack) localePacks[name] = assign2({}, localePacks.en, pack);
      return ComboBox;
    };
    return ComboBox;
  }

  // src/editbox/editbox.js
  var EDITOR_TYPES = ["text", "number", "date", "combo", "color"];
  function assign(target) {
    var index;
    var source;
    var key;
    for (index = 1; index < arguments.length; index += 1) {
      source = arguments[index] || {};
      for (key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }
  function resolveElement(element) {
    return typeof element === "string" ? document.querySelector(element) : element;
  }
  function normalizeEditorType(value) {
    var type = String(value == null ? "" : value).toLowerCase();
    if (type === "text" || type === "textbox") return "text";
    if (type === "number" || type === "numberbox" || type === "numeric") return "number";
    if (type === "date" || type === "datebox" || type === "calendar") return "date";
    if (type === "combo" || type === "combobox" || type === "select" || type === "dropdown") return "combo";
    if (type === "colour" || type === "colorbox" || type === "colourbox") return "color";
    return EDITOR_TYPES.indexOf(type) >= 0 ? type : "";
  }
  function normalizeDefinitionName(value) {
    return normalizeEditorType(value) || String(value == null ? "" : value).toLowerCase();
  }
  function inferEditorType(element, options) {
    var explicit = normalizeEditorType(
      options.editor || options.editType || options.kind
    );
    var inputType;
    if (explicit) return explicit;
    if (normalizeEditorType(options.type)) return normalizeEditorType(options.type);
    if (element && element.tagName === "SELECT") return "combo";
    inputType = element && element.getAttribute ? String(element.getAttribute("type") || "").toLowerCase() : "";
    if (inputType === "number") return "number";
    if (inputType === "date" || inputType === "month") return "date";
    if (inputType === "color") return "color";
    return "text";
  }
  function createEditBoxFactory(editorDefinitions2) {
    var definitions = editorDefinitions2 || createEditorDefinitions();
    var TextBox = createTextBoxFactory(definitions);
    var NumberBox = createNumberBoxFactory(TextBox, definitions);
    var DateBox = createDateBoxFactory(TextBox, definitions);
    var ComboBox = createComboBoxFactory(TextBox, definitions);
    var ColorEditBox = createColorEditBoxFactory(TextBox, definitions);
    var factories = {
      text: TextBox,
      number: NumberBox,
      date: DateBox,
      combo: ComboBox,
      color: ColorEditBox
    };
    function EditBox2(element, options) {
      var childOptions;
      var factory;
      if (!(this instanceof EditBox2)) {
        return new EditBox2(element, options);
      }
      this._source = resolveElement(element);
      if (!this._source || !/^(INPUT|TEXTAREA|SELECT)$/.test(this._source.tagName)) {
        throw new Error("fabui.EditBox requires an input, textarea, or select element.");
      }
      if (this._source.__fabuiEditBox) {
        return this._source.__fabuiEditBox;
      }
      options = options || {};
      this._editorType = inferEditorType(this._source, options);
      factory = factories[this._editorType];
      if (!factory) {
        throw new Error("Unsupported fabui.EditBox editor: " + String(options.editor || options.type || ""));
      }
      if (this._source.tagName === "SELECT" && this._editorType !== "combo") {
        throw new Error('fabui.EditBox select elements require editor "combo".');
      }
      childOptions = assign({}, options);
      delete childOptions.editor;
      delete childOptions.editType;
      delete childOptions.kind;
      if (normalizeEditorType(childOptions.type)) {
        delete childOptions.type;
      }
      childOptions.cls = "fui-editbox" + (childOptions.cls ? " " + childOptions.cls : "");
      this._destroyed = false;
      this._control = new factory(this._source, childOptions);
      this._source.__fabuiEditBox = this;
    }
    EditBox2.prototype.getEditorType = function() {
      return this._editorType;
    };
    EditBox2.prototype.getDefinition = function(name) {
      return definitions[normalizeDefinitionName(name || this._editorType)] || null;
    };
    EditBox2.prototype.options = function() {
      var options = this._control.options();
      options.editor = this._editorType;
      return options;
    };
    EditBox2.prototype.textbox = function() {
      return this._control.textbox();
    };
    EditBox2.prototype.button = function() {
      return typeof this._control.button === "function" ? this._control.button() : null;
    };
    EditBox2.prototype.panel = function() {
      return typeof this._control.panel === "function" ? this._control.panel() : null;
    };
    EditBox2.prototype.calendar = function() {
      return typeof this._control.calendar === "function" ? this._control.calendar() : null;
    };
    EditBox2.prototype.getIcon = function(index) {
      return this._control.getIcon(index);
    };
    EditBox2.prototype.getText = function() {
      return this._control.getText();
    };
    EditBox2.prototype.setText = function(value) {
      this._control.setText(value);
      return this;
    };
    EditBox2.prototype.getValue = function() {
      return this._control.getValue();
    };
    EditBox2.prototype.setValue = function(value, silent) {
      this._control.setValue(value, silent);
      return this;
    };
    EditBox2.prototype.getNumber = function() {
      if (typeof this._control.getNumber !== "function") return null;
      return this._control.getNumber();
    };
    EditBox2.prototype.getDate = function() {
      if (typeof this._control.getDate !== "function") return null;
      return this._control.getDate();
    };
    EditBox2.prototype.getData = function() {
      if (typeof this._control.getData !== "function") return [];
      return this._control.getData();
    };
    EditBox2.prototype.getValues = function() {
      if (typeof this._control.getValues !== "function") return [this.getValue()];
      return this._control.getValues();
    };
    EditBox2.prototype.setValues = function(values, silent) {
      if (typeof this._control.setValues !== "function") {
        return this.setValue(Array.isArray(values) ? values[0] : values, silent);
      }
      this._control.setValues(values, silent);
      return this;
    };
    EditBox2.prototype.select = function(value) {
      if (typeof this._control.select !== "function") {
        throw new Error('fabui.EditBox select() requires editor "combo".');
      }
      this._control.select(value);
      return this;
    };
    EditBox2.prototype.unselect = function(value) {
      if (typeof this._control.unselect !== "function") {
        throw new Error('fabui.EditBox unselect() requires editor "combo".');
      }
      this._control.unselect(value);
      return this;
    };
    EditBox2.prototype.scrollTo = function(value) {
      if (typeof this._control.scrollTo !== "function") {
        throw new Error('fabui.EditBox scrollTo() requires editor "combo".');
      }
      this._control.scrollTo(value);
      return this;
    };
    EditBox2.prototype.setDate = function(value, silent) {
      if (typeof this._control.setDate !== "function") {
        throw new Error('fabui.EditBox setDate() requires editor "date".');
      }
      this._control.setDate(value, silent);
      return this;
    };
    EditBox2.prototype.initValue = function(value) {
      this._control.initValue(value);
      return this;
    };
    EditBox2.prototype.clear = function() {
      this._control.clear();
      return this;
    };
    EditBox2.prototype.reset = function() {
      this._control.reset();
      return this;
    };
    EditBox2.prototype.focus = function() {
      this._control.focus();
      return this;
    };
    EditBox2.prototype.resize = function(width, height) {
      this._control.resize(width, height);
      return this;
    };
    EditBox2.prototype.disable = function() {
      this._control.disable();
      return this;
    };
    EditBox2.prototype.enable = function() {
      this._control.enable();
      return this;
    };
    EditBox2.prototype.readonly = function(mode) {
      this._control.readonly(mode);
      return this;
    };
    EditBox2.prototype.setEditable = function(mode) {
      this._control.setEditable(mode);
      return this;
    };
    EditBox2.prototype.fix = function() {
      if (typeof this._control.fix === "function") this._control.fix();
      return this;
    };
    EditBox2.prototype.showPanel = function() {
      if (typeof this._control.showPanel === "function") this._control.showPanel();
      return this;
    };
    EditBox2.prototype.hidePanel = function() {
      if (typeof this._control.hidePanel === "function") this._control.hidePanel();
      return this;
    };
    EditBox2.prototype.togglePanel = function() {
      if (typeof this._control.togglePanel === "function") this._control.togglePanel();
      return this;
    };
    EditBox2.prototype.loadData = function(data, silent) {
      if (typeof this._control.loadData !== "function") {
        throw new Error('fabui.EditBox loadData() requires editor "combo".');
      }
      this._control.loadData(data, silent);
      return this;
    };
    EditBox2.prototype.reload = function(urlOrParams) {
      if (typeof this._control.reload !== "function") {
        throw new Error('fabui.EditBox reload() requires editor "combo".');
      }
      this._control.reload(urlOrParams);
      return this;
    };
    EditBox2.prototype.cloneFrom = function(from) {
      var source = from instanceof EditBox2 ? from._control : from;
      if (typeof this._control.cloneFrom !== "function") {
        throw new Error('fabui.EditBox cloneFrom() requires editor "date".');
      }
      this._control.cloneFrom(source);
      return this;
    };
    EditBox2.prototype.on = function(name, listener) {
      this._control.on(name, listener);
      return this;
    };
    EditBox2.prototype.off = function(name, listener) {
      this._control.off(name, listener);
      return this;
    };
    EditBox2.prototype.destroy = function() {
      if (this._destroyed) return;
      this._destroyed = true;
      delete this._source.__fabuiEditBox;
      this._control.destroy();
      this._control = null;
    };
    EditBox2.prototype.dispose = EditBox2.prototype.destroy;
    EditBox2.editorDefinitions = definitions;
    EditBox2.editorTypes = EDITOR_TYPES.slice();
    EditBox2.getEditorDefinition = function(name) {
      return definitions[normalizeDefinitionName(name)] || null;
    };
    EditBox2.getControl = function(element) {
      element = resolveElement(element);
      return element && element.__fabuiEditBox ? element.__fabuiEditBox : null;
    };
    return EditBox2;
  }
  var editorDefinitions = createEditorDefinitions();
  var EditBox = createEditBoxFactory(editorDefinitions);
  var editbox_default = EditBox;

  // editbox.browser.js
  var root = typeof globalThis !== "undefined" ? globalThis : window;
  root.fabui = root.fabui || {};
  root.fabui.EditBox = editbox_default;
  root.fabui.EditBox.editorDefinitions = editorDefinitions;
})();
