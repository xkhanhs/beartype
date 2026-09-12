import { describe, expect, it } from "vitest";

import { THEMES } from "../../src/ts/beartype/config-lock";
import { themes } from "../../src/ts/constants/themes";
import { isColorDark } from "../../src/ts/utils/colors";

describe("themes", () => {
  it("has colours for every name on offer", () => {
    for (const name of THEMES) {
      expect(themes[name]).toBeDefined();
    }
    expect(Object.keys(themes).sort()).toEqual([...THEMES].sort());
  });

  it("only asks for a css file where beartype ships one", () => {
    const withCss = THEMES.filter((name) => themes[name].hasCss === true);
    expect(withCss).toEqual([
      "keybear_princess",
      "keybear_racing",
      "keybear_pixel",
    ]);
  });

  // the rotation draws from one of these two groups, so neither may be empty
  it("splits into pale and dark palettes", () => {
    const dark = THEMES.filter((name) => isColorDark(themes[name].bg));
    const light = THEMES.filter((name) => !isColorDark(themes[name].bg));
    expect(dark.length).toBeGreaterThan(0);
    expect(light.length).toBeGreaterThan(0);
    expect(dark).toContain("serika_dark");
    expect(light).toContain("keybear_light");
  });
});
