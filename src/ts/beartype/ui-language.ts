import type { Language } from "../schemas/languages";
import { UiLanguageSchema } from "../schemas/configs";

/**
 * Which language the page speaks. Separate from the language being typed:
 * someone can read the page in Vietnamese while typing English words, and
 * upstream's `Config.language` is the word list, not the interface.
 *
 * The two are tied at one point only, in `config/metadata.tsx`: picking a
 * language for the page also picks the word list to match, because a visitor
 * who switches the page to English almost always came to type English. Once
 * they change the options bar by hand, that choice stands.
 *
 * This module holds no strings and imports nothing from the config store, so
 * `constants/default-config.ts` can ask it what a first visit should get.
 */

export type UiLanguage = (typeof UiLanguageSchema.options)[number];

export const UI_LANGUAGES = UiLanguageSchema.options;

/** The word list that goes with a page in this language. */
export const TYPING_LANGUAGE: Record<UiLanguage, Language> = {
  vi: "vietnamese",
  en: "english",
};

/** The tag for `toLocaleString`, so numbers and dates read the same way. */
export const LOCALE_TAG: Record<UiLanguage, string> = {
  vi: "vi-VN",
  en: "en-US",
};

/**
 * The language of the page on a first visit, read from the browser's own
 * list of preferred languages. The first entry that names a language this
 * page speaks wins, so a browser asking for French then English gets
 * English. When no entry names either -- and when the browser says nothing
 * at all -- the page stays Vietnamese, which is what it has always been.
 */
export function detectUiLanguage(): UiLanguage {
  const preferred =
    navigator.languages !== undefined && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const tag of preferred) {
    // a tag is a language and then some: `vi`, `en-GB`, `en_US`
    const base = tag.toLowerCase().split(/[-_]/)[0];
    const match = UI_LANGUAGES.find((language) => language === base);
    if (match !== undefined) return match;
  }

  return "vi";
}

/**
 * The page language that goes with a word list, for a config stored before
 * this setting existed: someone already typing Vietnamese was reading a
 * Vietnamese page, whatever their browser asks for.
 */
export function uiLanguageOf(language: Language): UiLanguage {
  return language === "english" ? "en" : "vi";
}
