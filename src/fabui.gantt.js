import fabui from './fabui.js?v=20260720-gantt-core-v1';
import {
  registerControl,
  unregisterControl
} from './core/control.js?v=20260716-control-events-v3';
import { createGanttFactory } from './gantt/gantt.js?v=20260720-gantt-v3';

if (!fabui || typeof fabui.Control !== 'function') {
  throw new Error('Load FabUI core before fabui.gantt.');
}

var Gantt = createGanttFactory(fabui, registerControl, unregisterControl);
fabui.Gantt = Gantt;

export { fabui, Gantt };
export default fabui;
