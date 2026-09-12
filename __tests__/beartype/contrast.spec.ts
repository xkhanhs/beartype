import { describe, expect, it } from "vitest";

import { THEMES } from "../../src/ts/beartype/config-lock";
import {
  contrastRatio,
  MIN_CONTRAST,
  textOnAccent,
} from "../../src/ts/beartype/contrast";
import { themes } from "../../src/ts/constants/themes";

describe("contrastRatio", () => {
  it("measures the two ends of the scale", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#7a7786", "#7a7786")).toBeCloseTo(1, 5);
  });

  it("reads short hex the same as long", () => {
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(
      contrastRatio("#ffffff", "#000000"),
      5,
    );
  });
});

describe("textOnAccent", () => {
  it("keeps a palette colour when it can be read", () => {
    // keybear_light: the page on its own accent is 8.6:1
    expect(textOnAccent("#3d475c", "#f4f0f0", "#282640")).toBe("#f4f0f0");
  });

  it("stays with the palette's own pale text where it can be read", () => {
    // vscode: page 3.70 and text 3.04 on its blue, so neither serves, and
    // white (4.51) reads on that blue where black would darken a dark pill
    expect(textOnAccent("#007acc", "#1e1e1e", "#d4d4d4")).toBe("#ffffff");
  });

  it("turns against the palette only when the pale end fails too", () => {
    // carbon: white is 2.94 on its orange, black 7.15
    expect(textOnAccent("#f66e0d", "#313131", "#f5e6c8")).toBe("#000000");
  });

  it("gives every palette on offer a legible label on its accent", () => {
    for (const name of THEMES) {
      const { main, bg, text } = themes[name];
      expect(
        contrastRatio(textOnAccent(main, bg, text), main),
        `${name} labels its filled pills too faintly`,
      ).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }
  });
});
