import { beforeEach, describe, expect, it } from "vitest";
import type { CompletedEvent } from "@monkeytype/schemas/results";
import {
  __testing,
  getLocalPB,
  getUserAverage10Once,
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
      getLocalPB("time", "30", false, false, "vietnamese", "normal", false, []),
    ).toEqual({
      wpm: 62,
      acc: 98,
    });
  });

  it("averages the last ten", async () => {
    for (let wpm = 1; wpm <= 12; wpm++) save(wpm * 10);
    expect((await getUserAverage10Once(filter)).wpm).toBe(75);
  });

  it("sums up the recent tests with the one just typed", () => {
    save(40);
    save(60);
    expect(recentSummary(filter, { wpm: 80 })).toEqual({
      best: 80,
      usual: 60,
      count: 3,
    });
  });
});
