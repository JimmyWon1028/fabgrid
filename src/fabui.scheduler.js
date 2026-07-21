import fabui from './fabui.js?v=20260720-scheduler-extension-v1';
import { createSchedulerFactory } from './scheduler/scheduler.js?v=20260720-scheduler-v6';

if (!fabui.Scheduler) {
  fabui.Scheduler = createSchedulerFactory(fabui);
}

var Scheduler = fabui.Scheduler;

export { fabui, Scheduler };
export default fabui;
