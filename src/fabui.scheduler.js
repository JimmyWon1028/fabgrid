import fabui from './fabui.js?v=20260728-locale-packs-v1';
import { createSchedulerFactory } from './scheduler/scheduler.js?v=20260728-locale-packs-v1';

if (!fabui.Scheduler) {
  fabui.Scheduler = fabui.registerLocaleTarget(
    'Scheduler',
    createSchedulerFactory(fabui)
  );
}

var Scheduler = fabui.Scheduler;

export { fabui, Scheduler };
export default fabui;
