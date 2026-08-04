import type { JQueryStatic } from 'jquery';

export interface FabUiJQueryPlugin {
  plugins: Record<string, unknown>;
  parse(context?: ParentNode): JQuery;
  parseOptions(element: Element): Record<string, unknown>;
}

export declare function parseFabUiDataOptions(value: string): Record<string, unknown>;
export declare function isFabUiPublicMethod(instance: unknown, name: string): boolean;
export declare function createFabUiJQuery(
  $: JQueryStatic,
  fabui: Record<string, unknown>
): FabUiJQueryPlugin;
export default createFabUiJQuery;

declare global {
  interface JQuery {
    EditBox(command?: string | object, ...args: unknown[]): unknown;
    layout(command?: string | object, ...args: unknown[]): unknown;
    panel(command?: string | object, ...args: unknown[]): unknown;
    tabs(command?: string | object, ...args: unknown[]): unknown;
    window(command?: string | object, ...args: unknown[]): unknown;
    dialog(command?: string | object, ...args: unknown[]): unknown;
    form(command?: string | object, ...args: unknown[]): unknown;
    linkbutton(command?: string | object, ...args: unknown[]): unknown;
    menu(command?: string | object, ...args: unknown[]): unknown;
    menubutton(command?: string | object, ...args: unknown[]): unknown;
    splitbutton(command?: string | object, ...args: unknown[]): unknown;
    tooltip(command?: string | object, ...args: unknown[]): unknown;
    tree(command?: string | object, ...args: unknown[]): unknown;
    filebox(command?: string | object, ...args: unknown[]): unknown;
    textbox(command?: string | object, ...args: unknown[]): unknown;
    numberbox(command?: string | object, ...args: unknown[]): unknown;
    datebox(command?: string | object, ...args: unknown[]): unknown;
    combobox(command?: string | object, ...args: unknown[]): unknown;
    colorbox(command?: string | object, ...args: unknown[]): unknown;
    validatebox(command?: string | object, ...args: unknown[]): unknown;
    switchbutton(command?: string | object, ...args: unknown[]): unknown;
  }
}
