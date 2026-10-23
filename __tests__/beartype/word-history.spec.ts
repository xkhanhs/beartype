import { describe, expect, it } from "vitest";
import type { TestEventNoMs } from "../../src/ts/test/events/types";
import { levelOf, wordRuns } from "../../src/ts/beartype/word-history";

/** A key into `wordIndex` at `testMs`; `commits` for the word's space. */
function key(
  wordIndex: number,
  testMs: number,
  commits = false,
): TestEventNoMs {
  return {
    type: "input",
    testMs,
    data: {
      inputType: "insertText",
      data: commits ? " " : "x",
      wordIndex,
      charIndex: 0,
      correct: true,
      ...(commits ? { commitsWord: true } : {}),
    },
  } as unknown as TestEventNoMs;
}

describe("levelOf", () => {
  it("puts the slow book's line between the slow shades and the rest", () => {
    expect(levelOf(0.5)).toBe(0);
    expect(levelOf(0.8)).toBe(1);
    expect(levelOf(1)).toBe(2);
    expect(levelOf(1.2)).toBe(3);
    expect(levelOf(2)).toBe(4);
  });
});

describe("wordRuns", () => {
  // "ba" costs three keys (b, a and the space): 3 keys in 360 ms is 100 wpm
  const targets = ["ba", "ba", "ba", "ba"];

  it("times each word from the commit before, and colours it against the bar", () => {
    const events = [
      key(0, 0),
      key(0, 360, true),
      key(1, 400),
      key(1, 720, true),
      key(2, 800),
      key(2, 1440, true),
    ];
    const runs = wordRuns(
      targets,
      ["ba ", "ba ", "ba "],
      events,
      new Set(),
      () => 100,
    );
    expect(runs.map((r) => r.wpm)).toEqual([100, 100, 50]);
    expect(runs.map((r) => r.level)).toEqual([2, 2, 0]);
  });

  it("falls back to the round's own median while the pool has no bar", () => {
    const events = [key(0, 0), key(0, 360, true), key(1, 720, true)];
    const runs = wordRuns(
      targets,
      ["ba ", "ba "],
      events,
      new Set(),
      () => null,
    );
    expect(runs.map((r) => r.level)).toEqual([2, 2]);
  });

  it("marks a word wrong for a stumble or a wrong commit, not for being cut short", () => {
    const events = [
      key(0, 0),
      key(0, 360, true),
      key(1, 720, true),
      key(2, 1080, true),
      key(3, 1200),
    ];
    const runs = wordRuns(
      targets,
      ["ba ", "bx ", "ba ", "b"],
      events,
      new Set([2]),
      () => 100,
    );
    expect(runs.map((r) => r.wrong)).toEqual([false, true, true, false]);
    expect(runs.map((r) => r.typed)).toEqual(["ba", "bx", "ba", "b"]);
    // the word the clock cut has no commit, so no speed
    expect(runs[3]?.wpm).toBeNull();
    expect(runs[3]?.level).toBeNull();
  });
});
