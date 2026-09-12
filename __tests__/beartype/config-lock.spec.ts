import { describe, expect, it } from "vitest";
import type { Config } from "../../src/ts/schemas/configs";
import { lockConfig } from "../../src/ts/beartype/config-lock";
import { getDefaultConfig } from "../../src/ts/constants/default-config";

describe("lockConfig", () => {
  it("starts in Vietnamese with the slow caret", () => {
    const config = lockConfig(undefined);
    expect(config.language).toBe("vietnamese");
    expect(config.smoothCaret).toBe("slow");
  });

  it("keeps what the user chose", () => {
    const config = lockConfig({
      ...getDefaultConfig(),
      mode: "words",
      words: 25,
      language: "english",
      smoothCaret: "fast",
      fontSize: 2.5,
    });
    expect(config.mode).toBe("words");
    expect(config.words).toBe(25);
    expect(config.language).toBe("english");
    expect(config.smoothCaret).toBe("fast");
    expect(config.fontSize).toBe(2.5);
  });

  it("takes the text size in Chrome's zoom steps", () => {
    const at = (fontSize: number): number =>
      lockConfig({ ...getDefaultConfig(), fontSize }).fontSize;
    expect(at(2.2)).toBe(2.2); // 110%
    expect(at(4)).toBe(4); // 200%
    expect(at(2.4)).toBe(2); // 120% is not a step
  });

  it("drops values no longer on offer", () => {
    const config = lockConfig({
      ...getDefaultConfig(),
      mode: "custom",
      time: 45,
      words: 500,
      // an upstream language that no longer exists
      language: "spanish" as Config["language"],
      fontSize: 7,
    });
    expect(config.mode).toBe("time");
    expect(config.time).toBe(30);
    expect(config.words).toBe(50);
    expect(config.language).toBe("vietnamese");
    expect(config.fontSize).toBe(2);
  });
});

describe("keymap", () => {
  it("is off until switched on, and stays on once it is", () => {
    expect(lockConfig(undefined).keymapMode).toBe("off");
    expect(
      lockConfig({ ...getDefaultConfig(), keymapMode: "react" }).keymapMode,
    ).toBe("react");
  });

  it("drops upstream's other modes", () => {
    expect(
      lockConfig({
        ...getDefaultConfig(),
        keymapMode: "next" as Config["keymapMode"],
      }).keymapMode,
    ).toBe("off");
  });
});

describe("typos under the words", () => {
  it("are hidden until switched on, and stay on once they are", () => {
    expect(lockConfig(undefined).indicateTypos).toBe("off");
    expect(
      lockConfig({ ...getDefaultConfig(), indicateTypos: "below" })
        .indicateTypos,
    ).toBe("below");
  });

  it("drops upstream's other ways of showing them", () => {
    expect(
      lockConfig({
        ...getDefaultConfig(),
        indicateTypos: "replace" as Config["indicateTypos"],
      }).indicateTypos,
    ).toBe("off");
  });
});

describe("themes", () => {
  it("follows the computer's light or dark setting by default", () => {
    const config = lockConfig(undefined);
    expect(config.autoSwitchTheme).toBe(true);
  });

  it("keeps the themes on offer and drops an upstream one", () => {
    expect(
      lockConfig({
        ...getDefaultConfig(),
        theme: "keybear_ocean",
        autoSwitchTheme: false,
      }).theme,
    ).toBe("keybear_ocean");
    expect(
      lockConfig({
        ...getDefaultConfig(),
        theme: "serika_dark",
        autoSwitchTheme: false,
      }).theme,
    ).toBe("serika_dark");
    expect(
      lockConfig({
        ...getDefaultConfig(),
        // an upstream theme beartype did not take
        theme: "8008" as Config["theme"],
      }).theme,
    ).toBe("keybear_light");
  });

  it("leaves a colour picked before the rotation existed alone", () => {
    const stored = { ...getDefaultConfig(), theme: "keybear_ocean" as const };
    // @ts-expect-error a config written before the key existed
    delete stored.randomTheme;
    stored.autoSwitchTheme = false;
    const config = lockConfig(stored);
    expect(config.randomTheme).toBe("off");
    expect(config.theme).toBe("keybear_ocean");
  });

  it("rotates for a config stored before the rotation that followed the computer", () => {
    const stored = { ...getDefaultConfig() };
    // @ts-expect-error a config written before the key existed
    delete stored.randomTheme;
    stored.autoSwitchTheme = true;
    expect(lockConfig(stored).randomTheme).toBe("auto");
  });

  it("keeps a rotation setting and drops an unknown one", () => {
    expect(
      lockConfig({ ...getDefaultConfig(), randomTheme: "dark" }).randomTheme,
    ).toBe("dark");
    expect(
      lockConfig({ ...getDefaultConfig(), randomTheme: "off" }).randomTheme,
    ).toBe("off");
    // an unknown one falls back to rotating with the computer, the default
    expect(
      lockConfig({
        ...getDefaultConfig(),
        randomTheme: "fav" as Config["randomTheme"],
      }).randomTheme,
    ).toBe("auto");
  });
});
