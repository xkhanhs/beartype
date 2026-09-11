import { describe, expect, it } from "vitest";
import {
  getBeartypeDefaults,
  lockConfig,
} from "../../src/ts/beartype/config-lock";
import { getDefaultConfig } from "../../src/ts/constants/default-config";

describe("lockConfig", () => {
  it("starts in Vietnamese with the slow caret and the average pace caret", () => {
    const config = lockConfig(undefined);
    expect(config.language).toBe("vietnamese");
    expect(config.smoothCaret).toBe("slow");
    expect(config.paceCaret).toBe("average");
  });

  it("keeps what the user chose", () => {
    const config = lockConfig({
      ...getBeartypeDefaults(),
      mode: "words",
      words: 25,
      language: "english",
      smoothCaret: "fast",
      paceCaret: "off",
    });
    expect(config.mode).toBe("words");
    expect(config.words).toBe(25);
    expect(config.language).toBe("english");
    expect(config.smoothCaret).toBe("fast");
    expect(config.paceCaret).toBe("off");
  });

  it("pins every setting the user cannot reach", () => {
    const config = lockConfig({
      ...getDefaultConfig(),
      stopOnError: "letter",
      funbox: ["nospace"],
      punctuation: true,
      keymapMode: "react",
    });
    expect(config.stopOnError).toBe("off");
    expect(config.funbox).toEqual([]);
    expect(config.punctuation).toBe(false);
    expect(config.keymapMode).toBe("off");
  });

  it("drops values no longer on offer", () => {
    const config = lockConfig({
      ...getDefaultConfig(),
      mode: "zen",
      time: 45,
      words: 500,
      language: "spanish",
      paceCaret: "tagPb",
    });
    expect(config.mode).toBe("time");
    expect(config.time).toBe(30);
    expect(config.words).toBe(50);
    expect(config.language).toBe("vietnamese");
    expect(config.paceCaret).toBe("average");
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
      lockConfig({ ...getBeartypeDefaults(), theme: "serika_dark" }).theme,
    ).toBe("keybear_light");
  });
});
