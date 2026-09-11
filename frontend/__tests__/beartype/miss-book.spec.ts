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
});

describe("committedWords", () => {
  it("keeps words ended by a space and drops the one the clock cut", () => {
    expect(committedWords(["tôi", "đi", "học"], ["tôi ", "di ", "họ"])).toEqual(
      { words: ["tôi", "đi"], typed: ["tôi", "di"] },
    );
  });

  it("keeps the last word of a words test once it is typed in full", () => {
    expect(committedWords(["tôi", "đi"], ["tôi ", "đi"])).toEqual({
      words: ["tôi", "đi"],
      typed: ["tôi", "đi"],
    });
  });
});
