import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompletedEvent } from "@monkeytype/schemas/results";
import {
  __testing,
  getLocalPB,
  recentSummary,
  saveResult,
} from "../../src/ts/beartype/local-results";

const filter = {
  mode: "time",
  mode2: "30",
  language: "vietnamese",
} as const;

function save(wpm: number, language = "vietnamese"): void {
  saveResult({
    ...filter,
    language,
    timestamp: Date.now(),
    wpm,
    acc: 98,
    rawWpm: wpm + 2,
    consistency: 80,
    testDuration: 30,
    afkDuration: 0,
    incompleteTestSeconds: 0,
  } as unknown as CompletedEvent);
}

describe("local results", () => {
  beforeEach(() => {
    __testing.reset();
  });

  it("answers the personal best for the same settings only", () => {
    save(50);
    save(62);
    save(90, "english");
    expect(getLocalPB("time", "30", "vietnamese")).toEqual({
      wpm: 62,
      acc: 98,
    });
  });

  it("still loads and matches an old entry stored with punctuation, numbers, lazyMode and difficulty", async () => {
    // beartype used to store these fields on every result; a browser that
    // saved a test before they were dropped still has this in localStorage.
    // zod objects are not `.strict()`, so the extra fields are just ignored.
    const legacyEntry = {
      timestamp: Date.now(),
      mode: "time",
      mode2: "30",
      language: "vietnamese",
      difficulty: "normal",
      wpm: 70,
      acc: 98,
      rawWpm: 72,
      consistency: 80,
      testDuration: 30,
      afkDuration: 0,
      incompleteTestSeconds: 0,
      punctuation: true,
      numbers: true,
      lazyMode: true,
    };
    window.localStorage.setItem(
      "beartype:v1:results",
      JSON.stringify([legacyEntry]),
    );

    vi.resetModules();
    const fresh = await import("../../src/ts/beartype/local-results");

    expect(fresh.getResults()).toMatchObject([{ wpm: 70 }]);
    expect(fresh.getLocalPB("time", "30", "vietnamese")).toEqual({
      wpm: 70,
      acc: 98,
    });
  });

  it("sums up the recent tests with the one just typed", () => {
    save(40);
    save(60);
    const current = { wpm: 80, acc: 96, timestamp: 3 };
    const summary = recentSummary(filter, current);
    expect(summary).toMatchObject({
      best: 80,
      usual: 60,
      usualAcc: 98,
      count: 3,
    });
    expect(summary?.recent.map((t) => t.wpm)).toEqual([40, 60, 80]);
    expect(summary?.recent.at(-1)).toEqual(current);
  });

  it("leaves out a test that will not be kept", () => {
    save(40);
    expect(recentSummary(filter, null)).toMatchObject({ best: 40, count: 1 });
  });

  it("has nothing to say before the first test", () => {
    expect(recentSummary(filter, null)).toBeNull();
  });

  it("keeps only the last twenty", () => {
    for (let wpm = 1; wpm <= 25; wpm++) save(wpm);
    const summary = recentSummary(filter, null);
    expect(summary?.count).toBe(20);
    expect(summary?.recent.map((t) => t.wpm)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 6),
    );
  });
});
