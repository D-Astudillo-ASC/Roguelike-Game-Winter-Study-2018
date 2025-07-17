import { Scheduler, Engine } from "rot-js";

const SCHEDULER = new Scheduler.Action();
const TIME_ENGINE = new Engine(SCHEDULER);

export { SCHEDULER, TIME_ENGINE };
