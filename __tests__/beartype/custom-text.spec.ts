import { beforeEach, describe, expect, it, vi } from "vitest";

/** The saved texts as the list shows them, without the ids they carry. */
function listed(book: {
  savedTexts: () => readonly { name: string; text: string }[];
}): { name: string; text: string }[] {
  return book.savedTexts().map(({ name, text }) => ({ name, text }));
}

describe("custom text", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("splits on any white space and keeps case and punctuation", async () => {
    const { wordsOf } = await import("../../src/ts/beartype/custom-text");
    expect(wordsOf("  Hà Nội,\n\tmùa  Thu. ")).toEqual([
      "Hà",
      "Nội,",
      "mùa",
      "Thu.",
    ]);
    expect(wordsOf(" \n ")).toEqual([]);
  });

  it("keeps the text the mode runs across a reload", async () => {
    const first = await import("../../src/ts/beartype/custom-text");
    first.setCustomText("Một Hai ba");
    vi.resetModules();
    const again = await import("../../src/ts/beartype/custom-text");
    expect(again.customText()).toBe("Một Hai ba");
  });

  it("saves texts newest first, named by their first words when unnamed", async () => {
    const book = await import("../../src/ts/beartype/custom-text");
    book.saveText("", "một hai ba bốn năm sáu");
    book.saveText("  thơ  ", "Đêm nay trăng sáng");
    expect(listed(book)).toEqual([
      { name: "thơ", text: "Đêm nay trăng sáng" },
      { name: "một hai ba bốn…", text: "một hai ba bốn năm sáu" },
    ]);
  });

  it("overwrites a text saved under the same name, and deletes by name", async () => {
    const book = await import("../../src/ts/beartype/custom-text");
    book.saveText("a", "cũ");
    book.saveText("b", "khác");
    book.saveText("a", "mới");
    expect(listed(book)).toEqual([
      { name: "a", text: "mới" },
      { name: "b", text: "khác" },
    ]);
    book.deleteText("a");
    expect(listed(book)).toEqual([{ name: "b", text: "khác" }]);
  });
});

describe("editing a saved text", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("keeps its place in the list, under a new name too", async () => {
    const book = await import("../../src/ts/beartype/custom-text");
    book.saveText("c", "ba");
    book.saveText("b", "hai");
    book.saveText("a", "một");
    book.saveText("bb", "hai hai", "b");
    expect(listed(book)).toEqual([
      { name: "a", text: "một" },
      { name: "bb", text: "hai hai" },
      { name: "c", text: "ba" },
    ]);
  });

  it("goes to the top when the text it edited was deleted meanwhile", async () => {
    const book = await import("../../src/ts/beartype/custom-text");
    book.saveText("a", "một");
    book.saveText("b", "hai", "gone");
    expect(book.savedTexts().map((s) => s.name)).toEqual(["b", "a"]);
  });
});

describe("how long the text runs", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("runs once, in order, for a store written before the choice", async () => {
    localStorage.setItem(
      "beartype:v1:customtext",
      JSON.stringify({ text: "một hai", saved: [] }),
    );
    const book = await import("../../src/ts/beartype/custom-text");
    expect(book.customText()).toBe("một hai");
    expect(book.customLength()).toBe("text");
    expect(book.customShuffle()).toBe(false);
  });

  it("keeps the length and the shuffle across a reload", async () => {
    const first = await import("../../src/ts/beartype/custom-text");
    first.setCustomLength("time");
    first.setCustomShuffle(true);
    vi.resetModules();
    const again = await import("../../src/ts/beartype/custom-text");
    expect(again.customLength()).toBe("time");
    expect(again.customShuffle()).toBe(true);
  });

  it("gives the generator a time, a count, or the text's own length", async () => {
    const { customRun } = await import("../../src/ts/beartype/custom-text");
    expect(customRun(7, "time", false, 30, 50)).toEqual({
      mode: "repeat",
      limitMode: "time",
      limitValue: 30,
    });
    expect(customRun(7, "words", true, 30, 50)).toEqual({
      mode: "shuffle",
      limitMode: "word",
      limitValue: 50,
    });
    expect(customRun(7, "text", true, 30, 50)).toEqual({
      mode: "shuffle",
      limitMode: "word",
      limitValue: 7,
    });
  });
});

describe("what is measured on a saved text", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("gives a text saved before ids one, and keeps it across a reload", async () => {
    localStorage.setItem(
      "beartype:v1:customtext",
      JSON.stringify({
        text: "một hai",
        saved: [{ name: "a", text: "một hai" }],
      }),
    );
    const first = await import("../../src/ts/beartype/custom-text");
    const id = first.savedTextId("một hai");
    expect(id).not.toBeNull();
    vi.resetModules();
    const again = await import("../../src/ts/beartype/custom-text");
    expect(again.savedTextId("một hai")).toBe(id);
  });

  it("knows a text only while it is saved word for word", async () => {
    const book = await import("../../src/ts/beartype/custom-text");
    book.saveText("a", "một hai");
    expect(book.savedTextId("một hai")).not.toBeNull();
    expect(book.savedTextId("một hai ba")).toBeNull();
  });

  it("keeps a text's id, and so its books, when it is edited", async () => {
    const book = await import("../../src/ts/beartype/custom-text");
    book.saveText("a", "một hai");
    const id = book.savedTextId("một hai");
    book.saveText("b", "một hai ba", "a");
    expect(book.savedTextId("một hai ba")).toBe(id);
  });

  it("deletes a text's rounds and books with it, and only its own", async () => {
    const book = await import("../../src/ts/beartype/custom-text");
    const misses = await import("../../src/ts/beartype/miss-book");
    const slow = await import("../../src/ts/beartype/slow-words");
    const results = await import("../../src/ts/beartype/local-results");
    const { textPool } = await import("../../src/ts/beartype/stats-language");
    book.saveText("a", "một hai ba");
    book.saveText("b", "bốn năm");
    const a = textPool(book.savedTextId("một hai ba") as string);
    const b = textPool(book.savedTextId("bốn năm") as string);
    for (const pool of [a, b, "vietnamese"]) {
      misses.recordMisses(pool, ["hai"], ["hia"], [true]);
      slow.recordSpeeds(pool, [{ word: "hai", wpm: 40 }]);
      results.saveResult(
        {
          timestamp: 1,
          mode: "custom",
          mode2: "custom",
          language: "vietnamese",
          wpm: 40,
          acc: 95,
          rawWpm: 42,
          consistency: 70,
          testDuration: 30,
          afkDuration: 0,
          incompleteTestSeconds: 0,
        } as never,
        pool,
      );
    }
    expect(book.measuredOn(book.savedTextId("một hai ba") as string)).toEqual({
      rounds: 1,
      words: 1,
    });

    book.deleteText("a");
    expect(misses.missWords(a)).toEqual([]);
    expect(slow.poolBar(a, 4)).toBeNull();
    expect(results.countIn(a)).toBe(0);
    // the other text and the word list keep theirs
    expect(misses.missWords(b)).toEqual(["hai"]);
    expect(results.countIn(b)).toBe(1);
    expect(misses.missWords("vietnamese")).toEqual(["hai"]);
    expect(results.countIn("vietnamese")).toBe(1);
  });

  it("drops words taken out of an edited text from its books", async () => {
    const book = await import("../../src/ts/beartype/custom-text");
    const misses = await import("../../src/ts/beartype/miss-book");
    const { textPool } = await import("../../src/ts/beartype/stats-language");
    book.saveText("a", "một hai ba");
    const pool = textPool(book.savedTextId("một hai ba") as string);
    misses.recordMisses(pool, ["hai", "ba"], ["hia", "bá"], [true, true]);
    book.saveText("a", "một ba bốn", "a");
    expect(misses.missWords(pool)).toEqual(["ba"]);
  });
});
