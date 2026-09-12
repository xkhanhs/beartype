import "./event-handlers/global";

import * as Logger from "./utils/logger";
import "./ui";
import { Config } from "./config/store";
import * as TestTimer from "./test/test-timer";
import "./input/listeners";
import { start as startRouter } from "./controllers/route-controller";
import "./elements/no-css";
import { addToGlobal } from "./utils/misc";
import * as Focus from "./test/focus";
import { applyEngineSettings } from "./anim";
import { qs, qsa, qsr } from "./utils/dom";
import { mountComponents } from "./components/mount";
import "./ready";
import { configLoadPromise, loadFromLocalStorage } from "./config/lifecycle";

import { getLastEventLog } from "./states/test";
import { buildEventLog } from "./test/events/data";

// Lock Math.random
Object.defineProperty(Math, "random", {
  value: Math.random,
  writable: false,
  configurable: false,
  enumerable: true,
});

// Freeze Math object
Object.freeze(Math);

// Lock Math on window
Object.defineProperty(window, "Math", {
  value: Math,
  writable: false,
  configurable: false,
  enumerable: true,
});

applyEngineSettings();
void loadFromLocalStorage();
Focus.set(true, true);

addToGlobal({
  config: Config,
  enableTimerDebug: TestTimer.enableTimerDebug,
  toggleDebugLogs: Logger.toggleDebugLogs,
  qs: qs,
  qsa: qsa,
  qsr: qsr,
  lastEventLog: () => getLastEventLog(),
  currentEventLog: buildEventLog,
});

mountComponents();
void configLoadPromise.then(startRouter);
