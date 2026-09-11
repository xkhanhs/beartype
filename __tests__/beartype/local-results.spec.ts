import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompletedEvent } from "../../src/ts/schemas/results";
import {
  __testing,
  getLocalPB,
  recentSummary,
  saveResult,
} from "../../src/ts/beartype/local-results";

const time30 = { mode: "time", mode2: "30" };

function save(
  wpm: number,
  language = "vietnamese",
  mode: { mode: string; mode2: string } = time30,
): void {
  saveResult({
    ...mode,
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

  it("answers the personal best for the same language only", () => {
    save(50);
    save(62);
    save(90, "english");
    expect(getLocalPB("vietnamese")).toEqual({ wpm: 62, acc: 98 });
  });

  it("pools every mode and length of a language", () => {
    save(40);
    save(70, "vietnamese", { mode: "words", mode2: "25" });
    save(55, "vietnamese", { mode: "time", mode2: "60" });
    save(90, "english", { mode: "words", mode2: "25" });
    expect(getLocalPB("vietnamese")).toEqual({ wpm: 70, acc: 98 });
    expect(recentSummary("vietnamese", null)).toMatchObject({
      best: 70,
      usual: 55,
      count: 3,
    });
    expect(recentSummary("english", null)).toMatchObject({
      best: 90,
      count: 1,
    });
  });

  it("counts an old Vietnamese or English list as the language itself", () => {
    save(40, "vietnamese_1k");
    save(60);
    save(80, "english_1k");
    expect(recentSummary("vietnamese", null)).toMatchObject({ count: 2 });
    expect(getLocalPB("english")).toEqual({ wpm: 80, acc: 98 });
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
    expect(fresh.getLocalPB("vietnamese")).toEqual({
      wpm: 70,
      acc: 98,
    });
  });

  it("sums up the recent tests with the one just typed", () => {
    save(40);
    save(60);
    const current = { wpm: 80, acc: 96, timestamp: 3 };
    const summary = recentSummary("vietnamese", current);
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
    expect(recentSummary("vietnamese", null)).toMatchObject({
      best: 40,
      count: 1,
    });
  });

  it("has nothing to say before the first test", () => {
    expect(recentSummary("vietnamese", null)).toBeNull();
  });

  it("counts every test but draws only the last twenty", () => {
    for (let wpm = 1; wpm <= 25; wpm++) save(wpm);
    const summary = recentSummary("vietnamese", null);
    expect(summary).toMatchObject({ count: 25, best: 25, usual: 13 });
    expect(summary?.recent.map((t) => t.wpm)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 6),
    );
  });
});
