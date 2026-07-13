import type { JQueryStatic } from 'jquery';

export interface FabGridJQueryPlugin {
  dataKey: string;
  eventNamespace: string;
  getInstance(element: Element): unknown;
  destroy(element: Element): void;
}

export declare function toJQueryEventName(value: string): string;
export declare function isPublicMethod(instance: unknown, name: string): boolean;
export declare function createFabGridJQuery($: JQueryStatic, fabui: { FabGrid: new (element: Element, options?: object) => unknown }): FabGridJQueryPlugin;
export default createFabGridJQuery;

declare global {
  interface JQuery {
    fabgrid(options?: object): this;
    fabgrid(command: 'instance'): unknown;
    fabgrid(command: 'option', name: string): unknown;
    fabgrid(command: 'option', name: string, value: unknown): this;
    fabgrid(command: 'option', options: object): this;
    fabgrid(command: 'destroy'): this;
    fabgrid(command: string, ...args: unknown[]): unknown;
  }
}
