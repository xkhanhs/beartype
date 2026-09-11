import { describe, expect, it } from "vitest";
import type { EventLog } from "../../src/ts/test/events/types";
import { idleReason, longestPauseMs } from "../../src/ts/beartype/idle";

/** Keys at `keys` ms into the test, and the clock ending at `end`. */
function log(keys: number[], end: number): EventLog {
  return {
    version: 1,
    events: [
      { type: "timer", testMs: 0, data: { event: "start" } },
      ...keys.map((testMs) => ({ type: "keydown", testMs, data: {} })),
      { type: "timer", testMs: end, data: { event: "end" } },
    ],
    context: {},
  } as unknown as EventLog;
}

describe("longestPauseMs", () => {
  it("measures the longest stretch between two keys", () => {
    expect(longestPauseMs(log([0, 200, 400, 6400, 6600], 6700))).toBe(6000);
  });

  it("counts the stretch from the last key to the end of the test", () => {
    expect(longestPauseMs(log([0, 200], 30000))).toBe(29800);
  });

  it("starts at the first key, which is what starts the test", () => {
    expect(longestPauseMs(log([1500, 1700], 1800))).toBe(200);
  });
});

describe("idleReason", () => {
  const steady = Array.from({ length: 150 }, (_, i) => i * 200);

  it("keeps a test typed without a long stop", () => {
    expect(idleReason(log(steady, 30000), 0, 30)).toBeNull();
  });

  it("drops a test with a single stop of five seconds", () => {
    const keys = [...steady.slice(0, 50), ...steady.slice(75)];
    expect(idleReason(log(keys, 30000), 4, 30)).toBe(
      "có lúc ngừng gõ liền 5 giây",
    );
  });

  it("drops a test idle for more than a fifth of it in short stops", () => {
    expect(idleReason(log(steady, 30000), 7, 30)).toBe(
      "ngừng gõ 23% thời gian bài",
    );
  });

  it("keeps a test idle for exactly a fifth of it", () => {
    expect(idleReason(log(steady, 30000), 6, 30)).toBeNull();
  });
});
