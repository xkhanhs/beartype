import { beforeEach, describe, expect, it } from "vitest";
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
  punctuation: false,
  numbers: false,
  language: "vietnamese",
  difficulty: "normal",
  lazyMode: false,
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
    expect(
      getLocalPB("time", "30", false, false, "vietnamese", "normal", false),
    ).toEqual({
      wpm: 62,
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
