import { Scheduler, Engine } from 'rot-js';

let SCHEDULER = new Scheduler.Action();
let TIME_ENGINE = new Engine(SCHEDULER);

export { SCHEDULER, TIME_ENGINE };
