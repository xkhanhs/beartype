import { describe, expect, it } from "vitest";
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
