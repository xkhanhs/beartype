import { describe, expect, it } from "vitest";
import {
  commitScore,
  cutoffScore,
  inTargetStyle,
  keyCounts,
  partialScore,
  unpaidKeys,
} from "../../src/ts/beartype/scoring";

const CASES: [string, string][] = [
  ["tiếng", "tiếng"],
  ["tiếng", "tieng"],
  ["tiếng", "tie"],
  ["tiếng", "ti"],
  ["cuộc", "cuooc"],
  ["cuộc", "cx"],
  ["nhằm", "nhaxxx"],
  ["người", "ngươi"],
  ["nghiêng", "nghieng"],
  ["hello", "helo"],
  ["hello", "hellooo"],
  ["hello", ""],
];

describe("unpaidKeys", () => {
  it.each([
    // letters never reached
    ["nhanh", "nha", 2],
    // marks left off a word of the right length: circumflex and grave
    ["thần", "than", 2],
    // an unfinished mark and a letter never reached
    ["thần", "thâ", 2],
    // the wrong key on `a` was already counted, the n and h were not
    ["nhanh", "nhx", 2],
    ["tiếng", "tiếng", 0],
    // the other tone style is the same word
    ["hòa", "hoà", 0],
  ] as [string, string, number][])("%s ← %s owes %i", (target, typed, keys) => {
    expect(unpaidKeys(target, typed)).toBe(keys);
  });
});

function total(c: ReturnType<typeof keyCounts>): number {
  return c.correct + c.incorrect + c.extra + c.missed;
}

describe("keyCounts adds up to keybear's scores", () => {
  it.each(CASES)("commit %s ← %s", (target, typed) => {
    const c = keyCounts(target, typed, "all", true);
    const s = commitScore(target, typed);
    expect(c.correct).toBe(s.correct);
    expect(total(c)).toBe(s.total);
  });

  it.each(CASES)("partial %s ← %s", (target, typed) => {
    const c = keyCounts(target, typed, "reached", false);
    const s = partialScore(target, typed);
    expect(c.correct).toBe(s.correct);
    expect(total(c)).toBe(s.total);
  });

  it.each(CASES)("cutoff %s ← %s", (target, typed) => {
    const c = keyCounts(target, typed, "cutoff", false);
    const s = cutoffScore(target, typed);
    expect(c.correct).toBe(s.correct);
    expect(total(c)).toBe(s.total);
  });
});

describe("the numbers a typist sees", () => {
  it("counts tiếng typed in full as six keys and the space", () => {
    expect(keyCounts("tiếng", "tiếng", "all", true)).toEqual({
      correct: 8,
      incorrect: 0,
      extra: 0,
      missed: 0,
    });
  });

  it("drops only the two marks when tiếng is committed bare", () => {
    expect(keyCounts("tiếng", "tieng", "all", true)).toEqual({
      correct: 6,
      incorrect: 2,
      extra: 0,
      missed: 0,
    });
  });

  it("does not charge the clock's last word its unfinished marks", () => {
    expect(keyCounts("tiếng", "tie", "cutoff", false)).toEqual({
      correct: 3,
      incorrect: 0,
      extra: 0,
      missed: 0,
    });
  });

  it("owes the letters skipped by an early space", () => {
    expect(keyCounts("tiếng", "ti", "all", true).missed).toBe(5);
  });
});

describe("tone style", () => {
  it("takes hoà where hòa is shown", () => {
    expect(inTargetStyle("hòa", "hoà")).toBe("hòa");
    expect(keyCounts("hòa", "hoà", "all", true)).toEqual({
      correct: 5,
      incorrect: 0,
      extra: 0,
      missed: 0,
    });
  });

  it("leaves words with one place for the tone alone", () => {
    expect(inTargetStyle("toàn", "toàn")).toBe("toàn");
    expect(inTargetStyle("quý", "quý")).toBe("quý");
  });
});
