import { afterEach, describe, expect, it, vi } from "vitest";

import {
  detectUiLanguage,
  TYPING_LANGUAGE,
  UI_LANGUAGES,
  uiLanguageOf,
} from "../../src/ts/beartype/ui-language";
import { stringsForTests, t } from "../../src/ts/beartype/strings";
import { lockConfig } from "../../src/ts/beartype/config-lock";
import { getDefaultConfig } from "../../src/ts/constants/default-config";
import { applyConfig } from "../../src/ts/config/lifecycle";
import type { Config } from "../../src/ts/schemas/configs";

/** What the browser says it would rather read. */
function browserAsks(...tags: string[]): void {
  vi.spyOn(navigator, "languages", "get").mockReturnValue(tags);
  vi.spyOn(navigator, "language", "get").mockReturnValue(tags[0] ?? "");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("detectUiLanguage", () => {
  it("takes a language the page speaks", () => {
    browserAsks("vi");
    expect(detectUiLanguage()).toBe("vi");
    browserAsks("en");
    expect(detectUiLanguage()).toBe("en");
  });

  it("reads the region off a tag", () => {
    browserAsks("en-GB");
    expect(detectUiLanguage()).toBe("en");
    browserAsks("vi-VN");
    expect(detectUiLanguage()).toBe("vi");
  });

  it("walks down the list to the first language it speaks", () => {
    browserAsks("fr-FR", "de", "en-US");
    expect(detectUiLanguage()).toBe("en");
  });

  it("stays Vietnamese when no entry names a language it speaks", () => {
    browserAsks("ja", "ko");
    expect(detectUiLanguage()).toBe("vi");
  });

  it("stays Vietnamese when the browser says nothing", () => {
    browserAsks();
    expect(detectUiLanguage()).toBe("vi");
  });
});

describe("the word list that goes with a page", () => {
  it("pairs each language with its own words, both ways", () => {
    for (const language of UI_LANGUAGES) {
      expect(uiLanguageOf(TYPING_LANGUAGE[language])).toBe(language);
    }
  });
});

describe("the language a first visit gets", () => {
  it("follows the browser, and takes the word list with it", () => {
    browserAsks("en-US");
    const english = lockConfig(undefined);
    expect(english.uiLanguage).toBe("en");
    expect(english.language).toBe("english");

    browserAsks("vi");
    const vietnamese = lockConfig(undefined);
    expect(vietnamese.uiLanguage).toBe("vi");
    expect(vietnamese.language).toBe("vietnamese");
  });

  it("stays Vietnamese for a browser asking for neither", () => {
    browserAsks("de-CH");
    const config = lockConfig(undefined);
    expect(config.uiLanguage).toBe("vi");
    expect(config.language).toBe("vietnamese");
  });
});

describe("a config stored before the page had a language of its own", () => {
  /** A stored config from before this setting existed. */
  function storedWithout(language: Config["language"]): Config {
    const stored = { ...getDefaultConfig(), language };
    // @ts-expect-error a config written before the key existed
    delete stored.uiLanguage;
    return stored;
  }

  it("reads the page in the language it was typing, whatever the browser asks", () => {
    browserAsks("en-US");
    expect(lockConfig(storedWithout("vietnamese")).uiLanguage).toBe("vi");
    browserAsks("vi");
    expect(lockConfig(storedWithout("english")).uiLanguage).toBe("en");
  });

  it("keeps a language once it is stored", () => {
    browserAsks("en-US");
    const config = lockConfig({
      ...getDefaultConfig(),
      uiLanguage: "vi",
      language: "english",
    });
    expect(config.uiLanguage).toBe("vi");
    // reading one language while typing the other is a choice, not a mistake
    expect(config.language).toBe("english");
  });

  it("drops a language the page does not speak", () => {
    expect(
      lockConfig({
        ...getDefaultConfig(),
        uiLanguage: "fr" as Config["uiLanguage"],
      }).uiLanguage,
    ).toBe("vi");
  });
});

describe("the strings", () => {
  it("says every one of them in both languages", () => {
    for (const [key, entry] of Object.entries(stringsForTests)) {
      for (const language of UI_LANGUAGES) {
        const value = entry[language];
        expect(value, `${key} is missing ${language}`).toBeDefined();
        if (typeof value === "string") {
          expect(
            value.length,
            `${key} is empty in ${language}`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("wants the same arguments in both languages", () => {
    for (const [key, entry] of Object.entries(stringsForTests)) {
      const kinds = UI_LANGUAGES.map((language) => typeof entry[language]);
      expect(
        new Set(kinds).size,
        `${key} is a sentence in one language and a
        function in the other`,
      ).toBe(1);
      if (typeof entry.vi === "function") {
        expect(
          (entry.en as (...args: never[]) => string).length,
          `${key} takes a different number of arguments in each language`,
        ).toBe(entry.vi.length);
      }
    }
  });

  it("speaks the language the config is in", async () => {
    await applyConfig({ ...getDefaultConfig(), uiLanguage: "vi" });
    expect(t("settings")).toBe("cài đặt");
    await applyConfig({ ...getDefaultConfig(), uiLanguage: "en" });
    expect(t("settings")).toBe("settings");
  });

  it("puts a count where each language wants it", async () => {
    await applyConfig({ ...getDefaultConfig(), uiLanguage: "vi" });
    expect(t("drillCount", 12)).toBe("luyện 12 từ hay sai");
    await applyConfig({ ...getDefaultConfig(), uiLanguage: "en" });
    expect(t("drillCount", 12)).toBe("drill 12 missed words");
  });
});
