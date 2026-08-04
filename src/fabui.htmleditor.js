import fabui from './fabui.js?v=20260728-locale-packs-v1';
import { createHtmlEditorFactory } from './htmleditor/htmleditor.js?v=20260728-locale-packs-v1';

if (!fabui.HtmlEditor) {
  fabui.HtmlEditor = fabui.registerLocaleTarget(
    'HtmlEditor',
    createHtmlEditorFactory(fabui)
  );
}

var HtmlEditor = fabui.HtmlEditor;

export { fabui, HtmlEditor };
export default fabui;
