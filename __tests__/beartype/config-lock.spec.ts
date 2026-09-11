import { describe, expect, it } from "vitest";
import type { Config } from "../../src/ts/schemas/configs";
import {
  getBeartypeDefaults,
  lockConfig,
} from "../../src/ts/beartype/config-lock";
import { getDefaultConfig } from "../../src/ts/constants/default-config";

describe("lockConfig", () => {
  it("starts in Vietnamese with the slow caret and Roboto Mono", () => {
    const config = lockConfig(undefined);
    expect(config.language).toBe("vietnamese");
    expect(config.smoothCaret).toBe("slow");
    expect(config.fontFamily).toBe("Roboto_Mono");
  });

  it("keeps what the user chose", () => {
    const config = lockConfig({
      ...getBeartypeDefaults(),
      mode: "words",
      words: 25,
      language: "english",
      smoothCaret: "fast",
      fontFamily: "Be_Vietnam_Pro",
      fontSize: 2.5,
    });
    expect(config.mode).toBe("words");
    expect(config.words).toBe(25);
    expect(config.language).toBe("english");
    expect(config.smoothCaret).toBe("fast");
    expect(config.fontFamily).toBe("Be_Vietnam_Pro");
    expect(config.fontSize).toBe(2.5);
  });

  it("takes the text size in Chrome's zoom steps", () => {
    const at = (fontSize: number): number =>
      lockConfig({ ...getBeartypeDefaults(), fontSize }).fontSize;
    expect(at(2.2)).toBe(2.2); // 110%
    expect(at(4)).toBe(4); // 200%
    expect(at(2.4)).toBe(2); // 120% is not a step
  });

  it("pins every setting the user cannot reach", () => {
    const config = lockConfig({
      ...getDefaultConfig(),
      resultSaving: false,
    });
    expect(config.resultSaving).toBe(true);
  });

  it("drops values no longer on offer", () => {
    const config = lockConfig({
      ...getDefaultConfig(),
      mode: "custom",
      time: 45,
      words: 500,
      // an upstream language that no longer exists
      language: "spanish" as Config["language"],
      fontFamily: "Comic_Sans_MS",
      fontSize: 7,
    });
    expect(config.mode).toBe("time");
    expect(config.time).toBe(30);
    expect(config.words).toBe(50);
    expect(config.language).toBe("vietnamese");
    expect(config.fontFamily).toBe("Roboto_Mono");
    expect(config.fontSize).toBe(2);
  });
});

describe("sounds", () => {
  it("are off until switched on", () => {
    const config = lockConfig(undefined);
    expect(config.playSoundOnClick).toBe("off");
    expect(config.playSoundOnError).toBe("off");
  });

  it("keeps a set on offer, the error sound and the volume", () => {
    const config = lockConfig({
      ...getBeartypeDefaults(),
      playSoundOnClick: "4",
      playSoundOnError: "1",
      soundVolume: 0.8,
    });
    expect(config.playSoundOnClick).toBe("4");
    expect(config.playSoundOnError).toBe("1");
    expect(config.soundVolume).toBe(0.8);
  });

  it("drops a set no longer shipped and a volume out of range", () => {
    const config = lockConfig({
      ...getBeartypeDefaults(),
      // upstream's fart sound, whose file beartype does not ship
      playSoundOnClick: "16" as Config["playSoundOnClick"],
      playSoundOnError: "3" as Config["playSoundOnError"],
      soundVolume: 4,
    });
    expect(config.playSoundOnClick).toBe("off");
    expect(config.playSoundOnError).toBe("off");
    expect(config.soundVolume).toBe(0.5);
  });
});

describe("keymap", () => {
  it("is off until switched on, and stays on once it is", () => {
    expect(lockConfig(undefined).keymapMode).toBe("off");
    expect(
      lockConfig({ ...getBeartypeDefaults(), keymapMode: "react" }).keymapMode,
    ).toBe("react");
  });

  it("drops upstream's other modes", () => {
    expect(
      lockConfig({
        ...getBeartypeDefaults(),
        keymapMode: "next" as Config["keymapMode"],
      }).keymapMode,
    ).toBe("off");
  });
});

describe("typos under the words", () => {
  it("are hidden until switched on, and stay on once they are", () => {
    expect(lockConfig(undefined).indicateTypos).toBe("off");
    expect(
      lockConfig({ ...getBeartypeDefaults(), indicateTypos: "below" })
        .indicateTypos,
    ).toBe("below");
  });

  it("drops upstream's other ways of showing them", () => {
    expect(
      lockConfig({
        ...getBeartypeDefaults(),
        indicateTypos: "replace" as Config["indicateTypos"],
      }).indicateTypos,
    ).toBe("off");
  });
});

describe("themes", () => {
  it("follows the computer's light or dark setting by default", () => {
    const config = lockConfig(undefined);
    expect(config.autoSwitchTheme).toBe(true);
    expect(config.themeLight).toBe("keybear_light");
    expect(config.themeDark).toBe("keybear_dark");
  });

  it("keeps a keybear theme and drops an upstream one", () => {
    expect(
      lockConfig({
        ...getBeartypeDefaults(),
        theme: "keybear_ocean",
        autoSwitchTheme: false,
      }).theme,
    ).toBe("keybear_ocean");
    expect(
      lockConfig({
        ...getBeartypeDefaults(),
        // an upstream theme name that no longer exists
        theme: "serika_dark" as Config["theme"],
      }).theme,
    ).toBe("keybear_light");
  });
});
