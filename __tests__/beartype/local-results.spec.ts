import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompletedEvent } from "../../src/ts/schemas/results";
import {
  __testing,
  getLocalPB,
  isStandard,
  recentSummary,
  saveResult,
} from "../../src/ts/beartype/local-results";

const time30 = { mode: "time", mode2: "30" };
const time60 = { mode: "time", mode2: "60" };

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
    save(50, "vietnamese", time60);
    save(62, "vietnamese", time60);
    save(90, "english", time60);
    expect(getLocalPB("vietnamese")).toEqual({ wpm: 62, acc: 98 });
  });

  it("pools every mode and length of a language, but a best needs a standard test", () => {
    save(40);
    save(70, "vietnamese", { mode: "words", mode2: "25" });
    save(55, "vietnamese", time60);
    save(58, "vietnamese", { mode: "words", mode2: "50" });
    save(90, "english", { mode: "words", mode2: "25" });
    expect(getLocalPB("vietnamese")).toEqual({ wpm: 58, acc: 98 });
    expect(recentSummary("vietnamese", null)).toMatchObject({
      best: 58,
      usual: 56.5,
      practiceSeconds: 120,
    });
    expect(getLocalPB("english")).toBeUndefined();
    expect(recentSummary("english", null)).toMatchObject({
      best: null,
      practiceSeconds: 30,
    });
  });

  it("tells a standard test from a short one", () => {
    expect(isStandard({ mode: "time", mode2: "30" })).toBe(false);
    expect(isStandard({ mode: "time", mode2: "60" })).toBe(true);
    expect(isStandard({ mode: "time", mode2: "120" })).toBe(true);
    expect(isStandard({ mode: "words", mode2: "25" })).toBe(false);
    expect(isStandard({ mode: "words", mode2: "50" })).toBe(true);
    expect(isStandard({ mode: "custom", mode2: "custom" })).toBe(false);
  });

  it("counts an old Vietnamese or English list as the language itself", () => {
    save(40, "vietnamese_1k");
    save(60);
    save(80, "english_1k", time60);
    expect(recentSummary("vietnamese", null)).toMatchObject({
      practiceSeconds: 60,
    });
    expect(getLocalPB("english")).toEqual({ wpm: 80, acc: 98 });
  });

  it("still loads and matches an old entry stored with punctuation, numbers, lazyMode and difficulty", async () => {
    // beartype used to store these fields on every result; a browser that
    // saved a test before they were dropped still has this in localStorage.
    // zod objects are not `.strict()`, so the extra fields are just ignored.
    const legacyEntry = {
      timestamp: Date.now(),
      mode: "time",
      mode2: "60",
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
    const current = {
      wpm: 80,
      acc: 96,
      consistency: 70,
      timestamp: 3,
      ...time60,
      testDuration: 60,
    };
    const summary = recentSummary("vietnamese", current);
    expect(summary).toMatchObject({
      best: 80,
      usual: 60,
      usualAcc: 98,
      usualConsistency: 80,
      practiceSeconds: 120,
    });
    expect(summary?.recent.map((t) => t.wpm)).toEqual([40, 60, 80]);
    expect(summary?.recent.at(-1)).toEqual(current);
  });

  it("leaves out a test that will not be kept", () => {
    save(40);
    expect(recentSummary("vietnamese", null)).toMatchObject({
      best: null,
      practiceSeconds: 30,
    });
  });

  it("has nothing to say before the first test", () => {
    expect(recentSummary("vietnamese", null)).toBeNull();
  });

  it("counts every test but draws only the last twenty", () => {
    for (let wpm = 1; wpm <= 25; wpm++) save(wpm, "vietnamese", time60);
    const summary = recentSummary("vietnamese", null);
    // the usual speed is the median of the twenty drawn, 6 to 25
    expect(summary).toMatchObject({
      practiceSeconds: 750,
      best: 25,
      usual: 15.5,
    });
    expect(summary?.recent.map((t) => t.wpm)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 6),
    );
  });
});
