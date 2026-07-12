import Vue, { PluginObject } from 'vue';

export interface FabGridVuePlugin extends PluginObject<never> {
  FabGrid: typeof Vue;
  FabGridColumn: typeof Vue;
}

export declare function createFabGridVue(VueConstructor: typeof Vue, fabui: { FabGrid: new (host: Element, options?: object) => unknown }): FabGridVuePlugin;

export declare function toKebabCase(value: string): string;
export declare function normalizeColumnProps(source: object): object;
export declare function createGridOptions(vm: object): object;

export default createFabGridVue;
