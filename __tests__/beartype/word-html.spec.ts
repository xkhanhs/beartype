import { describe, expect, it } from "vitest";
import { typoHints, wordHtml } from "../../src/ts/beartype/word-html";

/** `letter:class` for each cell, the way the test screen would show it. */
function cells(target: string, input: string, composing = ""): string[] {
  const doc = new DOMParser().parseFromString(
    `<div>${wordHtml(target, input, composing)}</div>`,
    "text/html",
  );
  return [...doc.querySelectorAll("letter")].map(
    (l) => `${l.textContent}:${l.className.trim()}`,
  );
}

describe("wordHtml", () => {
  it("draws a letter on its way to its mark as partial, never wrong", () => {
    // VTX builds `sẵn` as s, a → (delete) ă → (delete) ẵ
    expect(cells("sẵn", "sa")).toEqual([
      "s:correct",
      "ẵ:correct partial",
      "n:",
    ]);
    expect(cells("sẵn", "să")).toEqual([
      "s:correct",
      "ẵ:correct partial",
      "n:",
    ]);
    expect(cells("sẵn", "sẵ")).toEqual(["s:correct", "ẵ:correct", "n:"]);
  });

  it("keeps one cell per letter while the input method holds `cuoo`", () => {
    expect(cells("cuộc", "cuoo")).toEqual([
      "c:correct",
      "u:correct",
      "ộ:correct partial",
      "c:",
    ]);
  });

  it("marks a wrong letter and a letter typed past the word", () => {
    expect(cells("sẵn", "sb")).toEqual(["s:correct", "ẵ:incorrect", "n:"]);
    expect(cells("sẵn", "sẵnx")).toEqual([
      "s:correct",
      "ẵ:correct",
      "n:correct",
      "x:incorrect extra",
    ]);
  });

  it("draws English exactly as upstream does", () => {
    expect(cells("hello", "helo")).toEqual([
      "h:correct",
      "e:correct",
      "l:correct",
      "l:incorrect",
      "o:",
    ]);
    expect(cells("hello", "hxllo")).toEqual([
      "h:correct",
      "e:incorrect",
      "l:correct",
      "l:correct",
      "o:correct",
    ]);
  });

  it("puts composing text where the next letters go", () => {
    expect(cells("tiếng", "ti", "ế")).toEqual([
      "t:correct",
      "i:correct",
      "ế:dead correct",
      "n:",
      "g:",
    ]);
  });

  it("accepts the other tone style", () => {
    expect(cells("hòa", "hoà")).toEqual([
      "h:correct",
      "ò:correct",
      "a:correct",
    ]);
  });
});

describe("typoHints", () => {
  it("hangs nothing under a letter still being built", () => {
    // Telex on its way to `tiếng`, `cuộc` and `sẵn`
    expect(typoHints("tiếng", "tie")).toEqual([]);
    expect(typoHints("tiếng", "tiee")).toEqual([]);
    expect(typoHints("tiếng", "tiêngs")).toEqual([]);
    expect(typoHints("cuộc", "cuooc")).toEqual([]);
    expect(typoHints("sẵn", "să")).toEqual([]);
  });

  it("hangs the character typed under each wrong letter", () => {
    expect(typoHints("sẵn", "sb")).toEqual([{ index: 1, typed: "b" }]);
    expect(typoHints("hello", "hxllo")).toEqual([{ index: 1, typed: "x" }]);
    // each of the three keys of `ố` knocks out a letter, as keybear draws it
    expect(typoHints("tiếng", "tiống")).toEqual([
      { index: 2, typed: "ố" },
      { index: 3, typed: "ố" },
      { index: 4, typed: "ố" },
    ]);
  });

  it("indexes the letters wordHtml draws", () => {
    const hints = typoHints("hello", "hxlyo");
    expect(hints.map((h) => h.index)).toEqual([1, 3]);
    for (const { index } of hints) {
      expect(cells("hello", "hxlyo")[index]).toMatch(/:incorrect$/);
    }
  });

  it("leaves extra letters alone and escapes what it hangs", () => {
    expect(typoHints("sẵn", "sẵnx")).toEqual([]);
    expect(typoHints("a", "<")).toEqual([{ index: 0, typed: "&lt;" }]);
  });
});
