import { describe, expect, it } from "vitest";
import { configLS } from "../../src/ts/config/persistence";
import { lockConfig } from "../../src/ts/beartype/config-lock";

// A localStorage "config" entry as the current production app (with funbox,
// pace caret, punctuation, tape mode, custom themes...) would have written
// it, plus the settings beartype still offers.
const PRODUCTION_CONFIG = {
  funbox: ["nospace"],
  paceCaret: "average",
  paceCaretCustomSpeed: 100,
  punctuation: true,
  numbers: true,
  tapeMode: "letter",
  customTheme: false,
  customThemeColors: [
    "#323437",
    "#e2b714",
    "#e2b714",
    "#646669",
    "#2c2e31",
    "#d1d0c5",
    "#ca4754",
    "#7e2a33",
    "#ca4754",
    "#7e2a33",
  ],
  quickRestart: "esc",
  difficulty: "normal",
  layout: "default",
  // fixed at one value in beartype, then taken out of the config
  resultSaving: true,
  themeLight: "keybear_light",
  themeDark: "keybear_dark",
  showOutOfFocusWarning: true,
  capsLockWarning: true,
  // the sounds, since taken out
  playSoundOnClick: "keybear",
  playSoundOnError: "1",
  soundVolume: 0.8,
  mode: "words",
  time: 60,
  words: 25,
  language: "english",
  theme: "keybear_ocean",
  fontFamily: "Be_Vietnam_Pro",
  fontSize: 2.5,
  smoothCaret: "fast",
};

describe("a production localStorage config", () => {
  it("loads without error and drops keys beartype no longer has", () => {
    window.localStorage.setItem("config", JSON.stringify(PRODUCTION_CONFIG));

    const stored = configLS.get();

    for (const upstreamOnlyKey of [
      "funbox",
      "paceCaret",
      "paceCaretCustomSpeed",
      "punctuation",
      "numbers",
      "tapeMode",
      "customTheme",
      "customThemeColors",
      "quickRestart",
      "difficulty",
      "layout",
      "resultSaving",
      "themeLight",
      "themeDark",
      "showOutOfFocusWarning",
      "capsLockWarning",
      "playSoundOnClick",
      "playSoundOnError",
      "soundVolume",
      "fontFamily",
    ]) {
      expect(stored).not.toHaveProperty(upstreamOnlyKey);
    }
  });

  it("keeps the user's choices and pins everything else", () => {
    window.localStorage.setItem("config", JSON.stringify(PRODUCTION_CONFIG));

    const locked = lockConfig(configLS.get());

    expect(locked.mode).toBe("words");
    expect(locked.time).toBe(60);
    expect(locked.words).toBe(25);
    expect(locked.language).toBe("english");
    expect(locked.theme).toBe("keybear_ocean");
    expect(locked.fontSize).toBe(2.5);
    expect(locked.smoothCaret).toBe("fast");
  });

  it("can be saved back without failing schema validation", () => {
    window.localStorage.setItem("config", JSON.stringify(PRODUCTION_CONFIG));

    const locked = lockConfig(configLS.get());

    expect(configLS.set(locked)).toBe(true);
  });
});
