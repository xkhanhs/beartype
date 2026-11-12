import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompletedEvent } from "../../src/ts/schemas/results";
import {
  __testing,
  getLocalPB,
  recentSummary,
  saveResult,
  testShape,
} from "../../src/ts/beartype/local-results";

const time30 = { mode: "time", mode2: "30" };
const time60 = { mode: "time", mode2: "60" };
const words10 = { mode: "words", mode2: "10" };

function save(
  wpm: number,
  language = "vietnamese",
  mode: { mode: string; mode2: string } = time30,
  shape = `${mode.mode} ${mode.mode2}`,
  testDuration = 30,
): void {
  saveResult(
    {
      ...mode,
      language,
      timestamp: Date.now(),
      wpm,
      acc: 98,
      rawWpm: wpm + 2,
      consistency: 80,
      testDuration,
      afkDuration: 0,
      incompleteTestSeconds: 0,
    } as unknown as CompletedEvent,
    shape,
  );
}

describe("local results", () => {
  beforeEach(() => {
    __testing.reset();
  });

  it("names a round by its mode and length, a text's by how long it runs", () => {
    expect(testShape("time", 30, 25, "text")).toBe("time 30");
    expect(testShape("words", 30, 10, "time")).toBe("words 10");
    expect(testShape("custom", 30, 25, "time")).toBe("custom time 30");
    expect(testShape("custom", 30, 25, "words")).toBe("custom words 25");
    expect(testShape("custom", 30, 25, "text")).toBe("custom text");
  });

  it("answers the personal best for the same language and shape only", () => {
    save(50, "vietnamese", time60);
    save(62, "vietnamese", time60);
    save(80, "vietnamese", words10);
    save(90, "english", time60);
    expect(getLocalPB("vietnamese", "time 60")).toEqual({ wpm: 62, acc: 98 });
    expect(getLocalPB("vietnamese", "words 10")).toEqual({ wpm: 80, acc: 98 });
    expect(getLocalPB("vietnamese", "time 30")).toBeUndefined();
  });

  it("reads a round only against rounds of its own shape, but counts all practice", () => {
    save(40);
    save(70, "vietnamese", words10);
    save(90, "vietnamese", words10);
    save(55, "vietnamese", time60);
    save(90, "english", words10);
    expect(recentSummary("vietnamese", "words 10", null)).toMatchObject({
      best: 90,
      usual: 80,
      practiceSeconds: 120,
    });
    expect(
      recentSummary("vietnamese", "words 10", null)?.recent.map((t) => t.wpm),
    ).toEqual([70, 90]);
    expect(recentSummary("vietnamese", "time 60", null)).toMatchObject({
      best: 55,
      usual: 55,
    });
    expect(recentSummary("vietnamese", "words 25", null)).toBeNull();
  });

  it("reads a result kept before shapes were stored off its mode", async () => {
    window.localStorage.setItem(
      "beartype:v1:results",
      JSON.stringify([
        {
          timestamp: 1,
          mode: "words",
          mode2: "10",
          language: "vietnamese",
          wpm: 70,
          acc: 98,
          rawWpm: 72,
          consistency: 80,
          testDuration: 8,
          afkDuration: 0,
          incompleteTestSeconds: 0,
        },
        {
          timestamp: 2,
          mode: "custom",
          mode2: "custom",
          language: "text:a",
          wpm: 50,
          acc: 98,
          rawWpm: 52,
          consistency: 80,
          testDuration: 30,
          afkDuration: 0,
          incompleteTestSeconds: 0,
        },
      ]),
    );
    vi.resetModules();
    const fresh = await import("../../src/ts/beartype/local-results");
    expect(fresh.recentSummary("vietnamese", "words 10", null)).toMatchObject({
      usual: 70,
    });
    // a text round from then did not say how long it ran
    expect(fresh.recentSummary("text:a", "custom text", null)).toBeNull();
  });

  it("counts an old Vietnamese or English list as the language itself", () => {
    save(40, "vietnamese_1k");
    save(60);
    save(80, "english_1k", time60);
    expect(recentSummary("vietnamese", "time 30", null)).toMatchObject({
      usual: 50,
      practiceSeconds: 60,
    });
    expect(getLocalPB("english", "time 60")).toEqual({ wpm: 80, acc: 98 });
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
    expect(fresh.getLocalPB("vietnamese", "time 60")).toEqual({
      wpm: 70,
      acc: 98,
    });
  });

  it("sums up the recent tests with the one just typed", () => {
    save(40, "vietnamese", time60);
    save(60, "vietnamese", time60);
    save(99);
    const current = {
      wpm: 80,
      acc: 96,
      consistency: 70,
      timestamp: 3,
      ...time60,
      testDuration: 60,
    };
    const summary = recentSummary("vietnamese", "time 60", current);
    expect(summary).toMatchObject({
      best: 80,
      usual: 60,
      usualAcc: 98,
      usualConsistency: 80,
      practiceSeconds: 150,
    });
    expect(summary?.recent.map((t) => t.wpm)).toEqual([40, 60, 80]);
    expect(summary?.recent.at(-1)).toEqual(current);
  });

  it("leaves out a test that will not be kept", () => {
    save(40);
    expect(recentSummary("vietnamese", "time 30", null)).toMatchObject({
      best: 40,
      practiceSeconds: 30,
    });
  });

  it("has nothing to say before the first test", () => {
    expect(recentSummary("vietnamese", "time 30", null)).toBeNull();
  });

  it("counts every test but draws only the last twenty", () => {
    // a minute at over 100 wpm: twenty rounds hold well over 500 words
    for (let wpm = 101; wpm <= 125; wpm++) {
      save(wpm, "vietnamese", time60, "time 60", 60);
    }
    const summary = recentSummary("vietnamese", "time 60", null);
    // the usual speed is the median of the twenty drawn, 106 to 125
    expect(summary).toMatchObject({
      practiceSeconds: 1500,
      best: 125,
      usual: 115.5,
      usualCount: 20,
    });
    expect(summary?.recent.map((t) => t.wpm)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 106),
    );
  });

  it("reads the usual figures over about 500 words, from 20 rounds up to 50", () => {
    // 60 wpm for 20 seconds is 20 words a round: 25 rounds hold 500
    for (let i = 0; i < 30; i++) save(60, "vietnamese", time30, "time 30", 20);
    expect(recentSummary("vietnamese", "time 30", null)).toMatchObject({
      usualCount: 25,
    });
  });

  it("stops at 50 rounds of short sprints, and still draws twenty", () => {
    // a few words a round: the window runs to its cap, rounds 11 to 60
    for (let wpm = 1; wpm <= 60; wpm++) {
      save(wpm, "vietnamese", words10, "words 10", 5);
    }
    const summary = recentSummary("vietnamese", "words 10", null);
    expect(summary).toMatchObject({ usualCount: 50, usual: 35.5 });
    expect(summary?.recent).toHaveLength(20);
  });
});
