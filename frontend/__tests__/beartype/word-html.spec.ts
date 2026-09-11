import { describe, expect, it } from "vitest";
import { wordHtml } from "../../src/ts/beartype/word-html";

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
