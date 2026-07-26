import fabui from './fabui.js?v=20260725-remove-mono-variants-v1';
import { createHtmlEditorFactory } from './htmleditor/htmleditor.js?v=20260725-remove-mono-variants-v1';

if (!fabui.HtmlEditor) {
  fabui.HtmlEditor = createHtmlEditorFactory(fabui);
}

var HtmlEditor = fabui.HtmlEditor;

export { fabui, HtmlEditor };
export default fabui;
