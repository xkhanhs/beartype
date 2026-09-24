import { describe, expect, it } from "vitest";
import {
  addRound,
  EMPTY_PAGE,
  movesOf,
  strokesOf,
} from "../../src/ts/beartype/transition-book";
import {
  bigramKind,
  trigramKind,
} from "../../src/ts/beartype/transition-kinds";
import type { TestEventNoMs } from "../../src/ts/test/events/types";

function input(
  wordIndex: number,
  testMs: number,
  inputValue: string,
  extra: {
    inputType?: "insertText" | "deleteContentBackward";
    correct?: boolean;
  } = {},
): TestEventNoMs {
  const inputType = extra.inputType ?? "insertText";
  return {
    type: "input",
    testMs,
    data:
      inputType === "insertText"
        ? {
            inputType,
            data: inputValue.slice(-1),
            correct: extra.correct ?? true,
            wordIndex,
            charIndex: 0,
            inputValue,
          }
        : { inputType, wordIndex, charIndex: 0, inputValue },
  };
}

/** One word typed a value at a time, `gap` ms apart. */
function typed(
  wordIndex: number,
  start: number,
  values: string[],
  gap = 100,
): TestEventNoMs[] {
  return values.map((value, index) =>
    input(wordIndex, start + index * gap, value),
  );
}

const keys = (events: TestEventNoMs[]): string =>
  strokesOf(events)
    .map((stroke) => stroke.key ?? "|")
    .join("");

describe("strokesOf", () => {
  it("recovers Telex keys from what the input read", () => {
    // `tốt` typed `t o o t s`, the tone last
    expect(keys(typed(0, 0, ["t", "to", "tô", "tôt", "tốt"]))).toBe("|toots");
  });

  it("counts the one `w` of `ươ` as one key", () => {
    // `người` typed `n g u o w i f`
    expect(
      keys(typed(0, 0, ["n", "ng", "ngu", "nguo", "ngươ", "ngươi", "người"])),
    ).toBe("|nguowif");
  });

  it("reads an input method's delete-and-insert burst as one key", () => {
    const events = [
      ...typed(0, 0, ["v", "vo"]),
      // `w` turns `vo` into `vơ`: delete and insert on the same tick
      input(0, 200, "v", { inputType: "deleteContentBackward" }),
      input(0, 200, "vơ"),
    ];
    const strokes = strokesOf(events);
    expect(keys(events)).toBe("|vow");
    expect(strokes.at(-1)).toEqual({ key: "w", ms: 100, miss: false });
  });

  it("breaks the run at a new word and after a correction", () => {
    const events = [
      ...typed(0, 0, ["t", "tr"]),
      input(0, 200, "t", { inputType: "deleteContentBackward" }),
      input(0, 300, "th"),
      ...typed(1, 400, ["a"]),
    ];
    expect(keys(events)).toBe("|tr|h|a");
  });

  it("cuts the run after a missed key", () => {
    const events = [
      ...typed(0, 0, ["t", "tr"]),
      input(0, 200, "trx", { correct: false }),
    ];
    const { bigrams } = movesOf(strokesOf(events));
    expect(bigrams).toEqual([
      { gram: "tr", ms: 100, miss: false },
      { gram: "rx", ms: null, miss: true },
    ]);
  });
});

describe("addRound", () => {
  it("weighs the newer round more", () => {
    const events = typed(0, 0, ["v", "va"]);
    const page = addRound(addRound(EMPTY_PAGE, events), events);
    expect(page.rounds).toBe(2);
    expect(page.bigrams["va"]?.[0]).toBe(1.98);
  });
});

describe("kinds on DH-Việt", () => {
  it("classes moves by the board's geometry", () => {
    expect(bigramKind("eu", "dh-viet")).toBe("sfb-near");
    expect(bigramKind("tr", "dh-viet")).toBe("scissor");
    expect(bigramKind("va", "dh-viet")).toBe("scissor");
    expect(bigramKind("va", "dh-viet-vb")).toBe("roll-out");
    expect(trigramKind("vow", "dh-viet")).toBe("sfs");
    expect(trigramKind("vow", "dh-viet-vb")).toBe("alternate");
  });
});
