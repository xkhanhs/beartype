import { beforeEach, describe, expect, it, vi } from "vitest";

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
    expect(book.savedTexts()).toEqual([
      { name: "thơ", text: "Đêm nay trăng sáng" },
      { name: "một hai ba bốn…", text: "một hai ba bốn năm sáu" },
    ]);
  });

  it("overwrites a text saved under the same name, and deletes by name", async () => {
    const book = await import("../../src/ts/beartype/custom-text");
    book.saveText("a", "cũ");
    book.saveText("b", "khác");
    book.saveText("a", "mới");
    expect(book.savedTexts()).toEqual([
      { name: "a", text: "mới" },
      { name: "b", text: "khác" },
    ]);
    book.deleteText("a");
    expect(book.savedTexts()).toEqual([{ name: "b", text: "khác" }]);
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
    expect(book.savedTexts()).toEqual([
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
