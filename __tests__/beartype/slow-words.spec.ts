import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addSpeeds,
  barFor,
  slowIn,
  wordSpeeds,
  type WordSpeed,
} from "../../src/ts/beartype/slow-words";
import { wordCost } from "../../src/ts/beartype/scoring";
import type { TestEventNoMs } from "../../src/ts/test/events/types";

function key(
  wordIndex: number,
  testMs: number,
  data: string,
  extra: { commitsWord?: true; automatic?: true } = {},
): TestEventNoMs {
  return {
    type: "input",
    testMs,
    data: {
      inputType: "insertText",
      data,
      correct: true,
      wordIndex,
      charIndex: 0,
      inputValue: "",
      ...extra,
    },
  };
}

const space = (wordIndex: number, testMs: number): TestEventNoMs =>
  key(wordIndex, testMs, " ", { commitsWord: true });

describe("wordSpeeds", () => {
  it("times a word from the commit before it, in keys", () => {
    // `bán` costs five keys with its space: one word a second is 60 wpm
    const speeds = wordSpeeds(
      ["a", "bán", "hoa"],
      ["a ", "bán ", "hoa "],
      [space(0, 100), space(1, 1100), space(2, 2100)],
      new Set(),
    );
    expect(speeds).toEqual([
      { word: "bán", wpm: 60 },
      { word: "hoa", wpm: 48 },
    ]);
  });

  it("leaves out words typed wrong or fixed on the way", () => {
    const speeds = wordSpeeds(
      ["a", "bán", "hoa", "con"],
      ["a ", "ban ", "hoa ", "con "],
      [space(0, 100), space(1, 1100), space(2, 2100), space(3, 3100)],
      new Set([2]),
    );
    expect(speeds.map((s) => s.word)).toEqual(["con"]);
  });

  it("does not hold the other tone style against a word", () => {
    const speeds = wordSpeeds(
      ["a", "hòa"],
      ["a ", "hoà "],
      [space(0, 100), space(1, 1100)],
      new Set(),
    );
    expect(speeds.map((s) => s.word)).toEqual(["hòa"]);
  });

  it("gives no time to a run that arrived at once", () => {
    const speeds = wordSpeeds(
      ["a", "hoa"],
      ["a ", "hoa "],
      [space(0, 100), space(1, 100)],
      new Set(),
    );
    expect(speeds).toEqual([]);
  });

  it("gives no time to a word typed into again after its commit", () => {
    const speeds = wordSpeeds(
      ["a", "hoa", "con"],
      ["a ", "hoa ", "con "],
      [
        space(0, 100),
        space(1, 1100),
        key(1, 1300, "a"),
        space(1, 1500),
        space(2, 2500),
      ],
      new Set(),
    );
    // `hoa` was reopened; `con` has no clean commit before it to count from
    expect(speeds).toEqual([]);
  });

  it("gives no time to a word with input the app made itself", () => {
    const speeds = wordSpeeds(
      ["a", "hoa"],
      ["a ", "hoa "],
      [space(0, 100), key(1, 600, "h", { automatic: true }), space(1, 1100)],
      new Set(),
    );
    expect(speeds).toEqual([]);
  });

  it("times the last word of a words test by its final key", () => {
    const speeds = wordSpeeds(
      ["a", "hoa"],
      ["a ", "hoa"],
      [space(0, 100), key(1, 500, "h"), key(1, 900, "o"), key(1, 1100, "a")],
      new Set(),
    );
    expect(speeds).toEqual([{ word: "hoa", wpm: 48 }]);
  });

  it("leaves out the word the clock cut short", () => {
    const speeds = wordSpeeds(
      ["a", "hoa"],
      ["a ", "ho"],
      [space(0, 100), key(1, 500, "h"), key(1, 900, "o")],
      new Set(),
    );
    expect(speeds).toEqual([]);
  });
});

/** `n` samples of words costing `keys`, all at `wpm`. */
function samples(n: number, keys: number, wpm: number): [number, number][] {
  return Array.from({ length: n }, () => [keys, wpm]);
}

describe("barFor", () => {
  it("has no bar until there are enough samples", () => {
    expect(barFor(4, samples(99, 4, 50))).toBeNull();
    expect(barFor(4, samples(100, 4, 50))).toBe(50);
  });

  it("keeps each key count to its own bar", () => {
    const recent = [...samples(60, 3, 30), ...samples(60, 7, 70)];
    expect(barFor(3, recent)).toBe(30);
    expect(barFor(7, recent)).toBe(70);
  });

  it("widens a thin key count to its neighbours", () => {
    const recent = [
      ...samples(5, 5, 90),
      ...samples(50, 4, 40),
      ...samples(50, 6, 60),
    ];
    // five samples at 5 keys are too few alone; with 4 and 6 beside them
    // the median is the middle of all 105
    expect(barFor(5, recent)).toBe(60);
  });
});

type Page = Parameters<typeof slowIn>[0];

/** A page whose bar is `wpm` for every key count, and no words yet. */
function pageAt(wpm: number): Page {
  const recent: [number, number][] = [];
  for (let keys = 2; keys <= 9; keys++) recent.push(...samples(20, keys, wpm));
  return { words: {}, recent };
}

describe("slowIn", () => {
  it("does not judge a word typed fewer than three times", () => {
    const page = { ...pageAt(50), words: { hoa: [10, 10] } };
    expect(slowIn(page)).toEqual([]);
  });

  it("does not call one hesitation a slow word", () => {
    const page = { ...pageAt(50), words: { hoa: [50, 10, 52] } };
    expect(slowIn(page)).toEqual([]);
  });

  it("lists the slow words, slowest first", () => {
    const page = {
      ...pageAt(50),
      words: { hoa: [40, 40, 40], con: [20, 20, 20], nhà: [50, 50, 50] },
    };
    expect(slowIn(page)).toEqual(["con", "hoa"]);
  });

  it("lets a word go once it is typed at pace again", () => {
    let page: Page = { ...pageAt(50), words: { hoa: [30, 30, 30] } };
    expect(slowIn(page)).toEqual(["hoa"]);
    const fast: WordSpeed[] = [
      { word: "hoa", wpm: 50 },
      { word: "hoa", wpm: 50 },
      { word: "hoa", wpm: 50 },
    ];
    page = addSpeeds(page, fast);
    // three of the last five at pace: the median has passed the bar
    expect(slowIn(page)).toEqual([]);
  });

  it("does not fill up with short words", () => {
    // a fixed step between words, then 120 ms a key: per key, short words
    // run slower than long ones -- against one bar for all, `à` would be
    // slow -- and none of them is slow for its length
    const words = ["à", "có", "hoa", "người", "nghiêng"];
    let page: Page = { words: {}, recent: [] };
    for (let round = 0; round < 40; round++) {
      page = addSpeeds(
        page,
        words.map((word) => {
          const keys = wordCost(word);
          const ms = 600 + 120 * keys;
          return { word, wpm: keys / 5 / (ms / 60000) };
        }),
      );
    }
    expect(slowIn(page)).toEqual([]);
  });
});

describe("the stored book", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });

  it("keeps a round's speeds per language, and reads them back", async () => {
    const book = await import("../../src/ts/beartype/slow-words");
    const speeds = Array.from({ length: 120 }, () => ({
      word: "hoa",
      wpm: 50,
    }));
    book.recordSpeeds("vietnamese", speeds);
    expect(book.measuredCount("vietnamese")).toBe(1);
    expect(book.measuredCount("english")).toBe(0);

    vi.resetModules();
    const reread = await import("../../src/ts/beartype/slow-words");
    expect(reread.measuredCount("vietnamese")).toBe(1);
  });

  it("starts empty from a missing or broken entry", async () => {
    window.localStorage.setItem("beartype:v1:slowbook", "{not json");
    const book = await import("../../src/ts/beartype/slow-words");
    expect(book.slowWords("vietnamese")).toEqual([]);
    expect(book.measuredCount("vietnamese")).toBe(0);
  });
});
