import { describe, expect, it } from "vitest";

import { THEMES } from "../../src/ts/beartype/config-lock";
import {
  MIN_TYPED_READABILITY,
  readability,
  sameHue,
  textOnAccent,
  typedLetterColor,
} from "../../src/ts/beartype/contrast";
import { themes } from "../../src/ts/constants/themes";

describe("readability", () => {
  // the pairs APCA publishes for checking an implementation
  it("matches APCA's own numbers", () => {
    expect(readability("#000000", "#ffffff")).toBeCloseTo(106.04, 1);
    expect(readability("#ffffff", "#000000")).toBeCloseTo(107.88, 1);
    expect(readability("#888888", "#ffffff")).toBeCloseTo(63.06, 1);
  });

  it("reads nothing into a colour on itself", () => {
    expect(readability("#7a7786", "#7a7786")).toBe(0);
  });

  it("reads short hex the same as long", () => {
    expect(readability("#fff", "#000")).toBeCloseTo(
      readability("#ffffff", "#000000"),
      5,
    );
  });

  it("tells the two directions apart, where the WCAG ratio cannot", () => {
    // bushido's red: the ratio calls black the better label by 2:1, but a
    // pale label on a saturated mid-tone is what actually reads
    expect(readability("#ffffff", "#ec4c56")).toBeGreaterThan(
      readability("#000000", "#ec4c56"),
    );
  });
});

describe("textOnAccent", () => {
  it("keeps a palette colour when it can be read", () => {
    // keybear_light: the page on its own accent is Lc 87
    expect(textOnAccent("#3d475c", "#f4f0f0", "#282640")).toBe("#f4f0f0");
  });

  it("stays with the palette's own text where the page colour fails", () => {
    // serika: its page (Lc 21) greys out on the yellow, its text reads at 60
    expect(textOnAccent("#e2b714", "#e1e1e3", "#323437")).toBe("#323437");
  });

  it("turns to white on a saturated accent neither palette colour suits", () => {
    // 8008: page Lc 44 and text Lc 49 on that pink, white 66
    expect(textOnAccent("#f44c7f", "#333a45", "#e9ecf0")).toBe("#ffffff");
  });

  it("never falls back to something the palette colour already beat", () => {
    for (const name of THEMES) {
      const { main, bg, text } = themes[name];
      const chosen = readability(textOnAccent(main, bg, text), main);
      expect(
        chosen,
        `${name} could letter its filled pills more clearly`,
      ).toBeGreaterThanOrEqual(
        Math.max(readability(bg, main), readability(text, main)),
      );
    }
  });

  // A handful of palettes -- keybear dark and dracula, bento, matrix, gruvbox
  // dark, iceberg dark, vesper light -- hang their accent halfway between
  // black and white, where no label reaches MIN_READABILITY. They land in the
  // fifties, which still reads; a new palette dropping below that has an
  // accent nothing can be written on, and wants a different accent.
  const FLOOR = 54;

  it("gives every palette on offer a legible label on its accent", () => {
    for (const name of THEMES) {
      const { main, bg, text } = themes[name];
      expect(
        readability(textOnAccent(main, bg, text), main),
        `${name} labels its filled pills too faintly`,
      ).toBeGreaterThanOrEqual(FLOOR);
    }
  });
});

describe("typedLetterColor", () => {
  const typed = (name: keyof typeof themes): string => {
    const { main, bg, error, text } = themes[name];
    return typedLetterColor(main, bg, error, text);
  };

  it("writes typed letters in the accent", () => {
    expect(typed("nord")).toBe(themes.nord.main);
    expect(typed("keybear_light")).toBe(themes.keybear_light.main);
    // mustard is the nearest hue to red that still counts as apart
    expect(typed("gruvbox_dark")).toBe(themes.gruvbox_dark.main);
  });

  it("keeps the text colour where the accent is a red", () => {
    for (const name of [
      "bushido",
      "modern_ink",
      "carbon",
      "keybear_racing",
      "vesper",
    ] as const) {
      expect(typed(name), name).toBe(themes[name].text);
    }
  });

  it("keeps the text colour where the accent is too faint on the page", () => {
    expect(typed("serika")).toBe(themes.serika.text);
    expect(typed("midnight")).toBe(themes.midnight.text);
  });

  it("never gives a typed letter the hue of a wrong one", () => {
    for (const name of THEMES) {
      const { main, bg, error, text } = themes[name];
      const chosen = typedLetterColor(main, bg, error, text);
      if (chosen === main) {
        expect(sameHue(main, error), name).toBe(false);
        expect(readability(main, bg), name).toBeGreaterThanOrEqual(
          MIN_TYPED_READABILITY,
        );
      } else {
        expect(chosen, name).toBe(text);
      }
    }
  });

  it("does not take a grey for a red", () => {
    expect(sameHue("#5f605e", "#c43c53")).toBe(false);
  });
});
