//most of the code is thanks to
//https://stackoverflow.com/questions/29971898/how-to-create-an-accurate-timer-in-javascript

import { Config } from "../config/store";
import * as CustomText from "./custom-text";
import {
  showNoticeNotification,
  showErrorNotification,
  removeNotification,
} from "../states/notifications";
import * as Caret from "./caret";
import * as SlowTimer from "../legacy-states/slow-timer";
import { timerEvent } from "../events/timer";
import { clearLowFpsMode, setLowFpsMode } from "../anim";
import { createTimer } from "animejs";
import { buildEventLog, logTestEvent } from "./events/data";
import { roundTo2 } from "@monkeytype/util/numbers";
import {
  getLiveCachedAccuracy,
  getLiveCachedTestDurationMs,
  getLiveCachedTestSeconds,
  getLiveCachedTimerStartMs,
} from "./events/live-cache";
import { getChars } from "./events/stats";
import { calculateWpm } from "../utils/numbers";
import { isTestActive, setCurrentLiveStats } from "../states/test";

let emittedTicks = 0;
let stopped = true;
const newTimer = createTimer({
  duration: 1000,
  autoplay: false,
  onComplete: () => {
    // sync guard — finish() is async and isTestActive() flips behind an await
    if (stopped) return;

    const timerStartMs = getLiveCachedTimerStartMs();
    if (timerStartMs === null) {
      throw new Error("Timer start ms not found in cache");
    }

    const now = performance.now();
    const expectedThisFireMs = timerStartMs + (emittedTicks + 1) * 1000;
    const drift = roundTo2(now - expectedThisFireMs);

    // animejs is rAF-quantized and can fire fractionally early — reschedule
    // the remainder; bounded by rAF granularity, can't tight-loop
    if (drift < 0) {
      console.debug("Rescheduling timer, fired early by", -drift, "ms");
      newTimer.duration = expectedThisFireMs - now;
      newTimer.restart();
      return;
    }

    checkIfTimerIsSlow(drift);

    // Catch up missed ticks via the cheap timerStep path, so a stall recovery
    // doesn't pay N times for buildEventLog/WPM/UI. Each missed tick still
    // gets a step event.
    const ticksDue = Math.floor((now - timerStartMs) / 1000);
    while (!stopped && emittedTicks + 1 < ticksDue) {
      console.debug(
        "Catching up timer, missed tick at",
        emittedTicks + 1,
        "seconds",
      );
      timerStep(now, true);
      logTestEvent("timer", now, {
        event: "step",
        timer: emittedTicks,
        slowTimer: SlowTimer.get() ? true : undefined,
        catchup: true,
      });
    }
    // Gated on !stopped to avoid duplicating the last catch-up event when a
    // catch-up tick was the one that triggered finish. timerStep itself can
    // flip stopped (Time hits maxTime) — we still log because the tick ran.
    if (!stopped) {
      timerStep(now, false);
      logTestEvent("timer", now, {
        event: "step",
        timer: emittedTicks,
        slowTimer: SlowTimer.get() ? true : undefined,
        drift,
      });
    }

    if (stopped) return;

    // Anchor to the ideal grid relative to test start (not `now`) so a late
    // tick doesn't permanently offset every tick after it.
    const expectedNextFireMs = timerStartMs + (emittedTicks + 1) * 1000;

    newTimer.duration = Math.max(0, expectedNextFireMs - now);
    newTimer.restart();
  },
});

type TimerStats = {
  dateNow: number;
  now: number;
  expected: number;
  nextDelay: number;
};

let slowTimerCount = 0;
let slowTimerNotifIds: number[] = [];
let timer: NodeJS.Timeout | null = null;
const interval = 1000;
let expected = 0;

let slowTimerFailEnabled = true;
export function disableSlowTimerFail(): void {
  slowTimerFailEnabled = false;
}

let timerDebug = false;
export function enableTimerDebug(): void {
  timerDebug = true;
}

export function clear(logEnd = false, now = performance.now()): void {
  stopped = true;
  clearLowFpsMode();
  newTimer.reset();
  if (timer !== null) clearTimeout(timer);
  if (logEnd) {
    logTestEvent("timer", now, {
      event: "end",
      timer: getLiveCachedTestSeconds(now),
      date: new Date().getTime(),
    });
  }
}

function checkIfTimeIsUp(testTime: number): void {
  if (timerDebug) console.time("times up check");

  let maxTime = undefined;

  if (Config.mode === "time") {
    maxTime = Config.time;
  } else if (Config.mode === "custom" && CustomText.getLimitMode() === "time") {
    maxTime = CustomText.getLimitValue();
  }
  if (maxTime !== undefined && maxTime !== 0 && testTime >= maxTime) {
    //times up
    if (timer !== null) clearTimeout(timer);
    Caret.hide();
    SlowTimer.clear();
    slowTimerCount = 0;
    timerEvent.dispatch({ key: "finish" });
    return;
  }

  if (timerDebug) console.timeEnd("times up check");
}

// ---------------------------------------

let timerStats: TimerStats[] = [];

export function getTimerStats(): TimerStats[] {
  return timerStats;
}

function timerStep(now: number, catchingUp: boolean): void {
  if (timerDebug) console.time("timer step -----------------------------");

  emittedTicks++;
  const testTime = emittedTicks;

  if (catchingUp) {
    // cheap per-tick side effects — must run for every missed tick during catch-up
    // so warnings/layout switches still fire on the correct seconds
    checkIfTimeIsUp(testTime);
  } else {
    //calc — only the final, real-time tick pays for these
    const eventLog = buildEventLog();

    const chars = getChars(eventLog, true);

    const currentTestDurationMs = getLiveCachedTestDurationMs(now);
    const acc = getLiveCachedAccuracy();
    const wpmAndRaw = {
      wpm: Math.round(
        calculateWpm(chars.correctWord, currentTestDurationMs / 1000),
      ),
      raw: Math.round(
        calculateWpm(
          chars.allCorrect + chars.extra + chars.incorrect,
          currentTestDurationMs / 1000,
        ),
      ),
    };

    setCurrentLiveStats({
      wpm: wpmAndRaw.wpm,
      acc,
      raw: wpmAndRaw.raw,
      seconds: getLiveCachedTestSeconds(now),
    });

    //logic
    checkIfTimeIsUp(testTime);
  }

  if (timerDebug) console.timeEnd("timer step -----------------------------");
}

function checkIfTimerIsSlow(drift: number): void {
  if (!slowTimerFailEnabled) return;
  if (
    (Config.mode === "time" && Config.time < 130 && Config.time > 0) ||
    (Config.mode === "words" && Config.words < 250 && Config.words > 0)
  ) {
    if (drift > 125) {
      //slow timer
      SlowTimer.set();
      setLowFpsMode();
    }
    if (drift > 250) {
      slowTimerCount++;
    }

    if (drift > 500 || slowTimerCount > 5) {
      //slow timer

      // beartype: the two messages in Vietnamese, like the rest of the page
      showNoticeNotification(
        'Có thể do "chế độ tiết kiệm" (efficiency mode) của Microsoft Edge.',
      );

      slowTimerNotifIds.push(
        showErrorNotification(
          "Bài bị dừng vì máy đang chạy chậm: đồng hồ trễ thì tốc độ và độ chính xác sẽ tính sai. Nếu hay gặp, hãy báo lỗi trên GitHub.",
        ),
      );

      timerEvent.dispatch({ key: "fail", value: "slow timer" });
    }
  }
}

export async function start(now: number): Promise<void> {
  SlowTimer.clear();
  slowTimerCount = 0;
  emittedTicks = 0;
  for (const id of slowTimerNotifIds) {
    removeNotification(id, "clear");
  }
  slowTimerNotifIds = [];
  void _startNew(now);
  // void _startOld(now);
}

async function _startNew(now: number): Promise<void> {
  stopped = false;
  newTimer.duration = 1000;
  newTimer.play();
  logTestEvent("timer", now, {
    event: "start",
    timer: 0,
    date: new Date().getTime(),
  });
}

async function _startOld(now: number): Promise<void> {
  timerStats = [];
  expected = now + interval;
  logTestEvent("timer", now, {
    event: "start",
    timer: 0,
    date: new Date().getTime(),
  });
  (function loop(): void {
    const delay = expected - performance.now();
    timerStats.push({
      dateNow: Date.now(),
      now: performance.now(),
      expected: expected,
      nextDelay: delay,
    });
    const drift = roundTo2(Math.abs(interval - delay));
    checkIfTimerIsSlow(drift);
    timer = setTimeout(function () {
      if (!isTestActive()) {
        if (timer !== null) clearTimeout(timer);
        SlowTimer.clear();
        slowTimerCount = 0;
        return;
      }

      const now = performance.now();

      logTestEvent("timer", now, {
        event: "step",
        timer: getLiveCachedTestSeconds(now),
        drift: drift,
        slowTimer: SlowTimer.get() ? true : undefined,
      });

      timerStep(now, false);

      expected += interval;
      loop();
    }, delay);
  })();
}
