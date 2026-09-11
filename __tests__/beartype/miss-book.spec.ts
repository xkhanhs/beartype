import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyMisses, committedWords } from "../../src/ts/beartype/miss-book";

describe("applyMisses", () => {
  it("adds a word typed wrong and a word missing its mark", () => {
    const page = applyMisses(
      {},
      ["tiếng", "hoa", "con"],
      ["tieng", "hoa", "cn"],
      1,
    );
    expect(Object.keys(page).sort()).toEqual(["con", "tiếng"]);
    expect(page["tiếng"]).toEqual({ n: 1, at: 1 });
  });

  it("pays a word back when it is typed right, and lets it go at zero", () => {
    let page = applyMisses({}, ["tiếng"], ["tieng"], 1);
    page = applyMisses(page, ["tiếng"], ["tieng"], 2);
    expect(page["tiếng"]?.n).toBe(2);
    page = applyMisses(page, ["tiếng"], ["tiếng"], 3);
    expect(page["tiếng"]?.n).toBe(1);
    page = applyMisses(page, ["tiếng"], ["tiếng"], 4);
    expect(page["tiếng"]).toBeUndefined();
  });

  it("caps the debt at three", () => {
    let page = {};
    for (let i = 0; i < 6; i++) {
      page = applyMisses(page, ["nghiêng"], ["nghieng"], i);
    }
    expect(applyMisses(page, [], [], 0)["nghiêng"]?.n).toBe(3);
  });

  it("does not hold the other tone style against a word", () => {
    expect(applyMisses({}, ["hòa"], ["hoà"], 1)).toEqual({});
  });

  it("adds a word whose wrong key was rubbed out before the space", () => {
    const page = applyMisses({}, ["tiếng", "hoa"], ["tiếng", "hoa"], 1, [
      true,
      false,
    ]);
    expect(page).toEqual({ tiếng: { n: 1, at: 1 } });
  });

  it("does not pay a word back when it was stumbled on and fixed", () => {
    let page = applyMisses({}, ["tiếng"], ["tieng"], 1);
    page = applyMisses(page, ["tiếng"], ["tiếng"], 2, [true]);
    expect(page["tiếng"]).toEqual({ n: 2, at: 2 });
  });
});

describe("committedWords", () => {
  it("keeps words ended by a space and drops the one the clock cut", () => {
    expect(committedWords(["tôi", "đi", "học"], ["tôi ", "di ", "họ"])).toEqual(
      { words: ["tôi", "đi"], typed: ["tôi", "di"], stumbled: [false, false] },
    );
  });

  it("keeps the last word of a words test once it is typed in full", () => {
    expect(committedWords(["tôi", "đi"], ["tôi ", "đi"])).toEqual({
      words: ["tôi", "đi"],
      typed: ["tôi", "đi"],
      stumbled: [false, false],
    });
  });

  it("carries a stumble on a committed word, not on the one the clock cut", () => {
    expect(
      committedWords(
        ["tôi", "đi", "học"],
        ["tôi ", "đi ", "hc"],
        new Set([1, 2]),
      ),
    ).toEqual({
      words: ["tôi", "đi"],
      typed: ["tôi", "đi"],
      stumbled: [false, true],
    });
  });
});

describe("the miss book on disk", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.resetModules();
  });

  it("keeps one page per language, whatever the mode it was missed in", async () => {
    const book = await import("../../src/ts/beartype/miss-book");
    book.recordMisses("vietnamese", ["tiếng"], ["tieng"], [false]);
    book.recordMisses("vietnamese", ["nghiêng"], ["nghieng"], [false]);
    book.recordMisses("english", ["their"], ["thier"], [false]);
    expect(book.missWords("vietnamese").sort()).toEqual(["nghiêng", "tiếng"]);
    expect(book.missWords("english")).toEqual(["their"]);
  });

  it("merges a page kept under an old Vietnamese list into Vietnamese", async () => {
    window.localStorage.setItem(
      "beartype:v1:missbook",
      JSON.stringify({
        vietnamese_1k: { hoa: { n: 3, at: 1 }, tôi: { n: 1, at: 1 } },
        vietnamese: { tôi: { n: 2, at: 2 } },
        english: { their: { n: 1, at: 1 } },
      }),
    );
    const book = await import("../../src/ts/beartype/miss-book");
    expect(book.missWords("vietnamese")).toEqual(["hoa", "tôi"]);

    book.recordMisses("vietnamese", ["hoa"], ["hoa"], [false]);
    expect(
      JSON.parse(window.localStorage.getItem("beartype:v1:missbook") ?? ""),
    ).toEqual({
      vietnamese: { hoa: { n: 2, at: 1 }, tôi: { n: 2, at: 2 } },
      english: { their: { n: 1, at: 1 } },
    });
  });
});
