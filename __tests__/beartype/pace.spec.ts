import { describe, expect, it } from "vitest";

import {
  keyCost,
  pacePosition,
  paceTargetWpm,
} from "../../src/ts/beartype/pace";

describe("paceTargetWpm", () => {
  it("takes the share of the usual speed the setting names", () => {
    expect(paceTargetWpm(50, "80")).toBe(40);
    expect(paceTargetWpm(50, "100")).toBe(50);
    expect(paceTargetWpm(50, "120")).toBe(60);
  });

  it("has no pace to run when the setting is off", () => {
    expect(paceTargetWpm(50, "off")).toBeNull();
  });

  // a browser with nothing typed on it yet has no speed of its own, and a
  // pace taken from no measurement is a number made up
  it("has no pace to run without a usual speed", () => {
    expect(paceTargetWpm(null, "100")).toBeNull();
    expect(paceTargetWpm(0, "100")).toBeNull();
  });
});

describe("keyCost", () => {
  it("counts a plain word letter by letter", () => {
    expect(keyCost("hello")).toBe(5);
  });

  // the marks are what the display length gets wrong: `ế` is one letter on
  // the screen and three keys under the hands
  it("counts what the marks cost in Telex", () => {
    expect(keyCost("ế")).toBe(3); // ees
    expect(keyCost("được")).toBe(8); // dd uw owj c
    expect(keyCost("đã")).toBe(4); // dd ax
  });
});

describe("pacePosition", () => {
  const words = ["một", "hai"];

  it("starts before the first letter", () => {
    expect(pacePosition(words, 0)).toEqual({ wordIndex: 0, letterIndex: 0 });
  });

  // `một` is m-ooj-t: `ộ` costs three keys, so the pace stands on it while
  // all three are typed rather than running two letters ahead of the hands
  it("stays on a letter for as long as its keys take", () => {
    expect(pacePosition(words, 1)).toEqual({ wordIndex: 0, letterIndex: 1 });
    expect(pacePosition(words, 2)).toEqual({ wordIndex: 0, letterIndex: 1 });
    expect(pacePosition(words, 3)).toEqual({ wordIndex: 0, letterIndex: 1 });
    expect(pacePosition(words, 4)).toEqual({ wordIndex: 0, letterIndex: 2 });
  });

  it("stands after the last letter once the word is paid for", () => {
    expect(pacePosition(words, 5)).toEqual({ wordIndex: 0, letterIndex: 3 });
  });

  // the space that commits the word is a keystroke of its own
  it("spends a key on the space before the next word", () => {
    expect(pacePosition(words, 6)).toEqual({ wordIndex: 1, letterIndex: 0 });
    expect(pacePosition(words, 7)).toEqual({ wordIndex: 1, letterIndex: 1 });
  });

  // in a timed test the words beyond the ones on screen do not exist yet
  it("stops at the end of the words it has", () => {
    expect(pacePosition(words, 99)).toEqual({ wordIndex: 1, letterIndex: 3 });
  });

  it("has somewhere to stand with no words at all", () => {
    expect(pacePosition([], 4)).toEqual({ wordIndex: 0, letterIndex: 0 });
  });
});
