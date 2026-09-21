import {
  type Config,
  IndicateTyposSchema,
  KeymapModeSchema,
  PaceCaretSchema,
  RandomThemeSchema,
  StrictAccuracySchema,
} from "../schemas/configs";
import { ThemeNameSchema } from "../schemas/themes";
import { getDefaultConfig } from "../constants/default-config";
import { typedKeys } from "../utils/objects";
import {
  detectUiLanguage,
  TYPING_LANGUAGE,
  UI_LANGUAGES,
  uiLanguageOf,
} from "./ui-language";

/** Times and word counts on offer; anything else falls back to the default. */
export const TIMES = [15, 30, 60, 120] as const;
export const WORD_COUNTS = [10, 25, 50, 100] as const;
export const LANGUAGES = ["vietnamese", "english"] as const;
export const MODES = ["time", "words"] as const;
export const SMOOTH_CARETS = ["off", "slow", "medium", "fast"] as const;
/**
 * Chrome's zoom steps from 80% to 200%, in rem around upstream's 2rem. The
 * four sizes offered before (80, 100, 125, 150%) are among them, so a stored
 * choice still stands.
 */
export const FONT_SIZES = [1.6, 1.8, 2, 2.2, 2.5, 3, 3.5, 4] as const;
export const KEYMAP_MODES = KeymapModeSchema.options;
export const PACE_CARETS = PaceCaretSchema.options;
export const STRICT_ACCURACIES = StrictAccuracySchema.options;
export const TYPO_INDICATORS = IndicateTyposSchema.options;
/** Every palette on offer, in the order the colour list shows them. */
export const THEMES = ThemeNameSchema.options;
export const RANDOM_THEMES = RandomThemeSchema.options;

function allowed(key: keyof Config, value: unknown): boolean {
  const lists: Partial<Record<keyof Config, readonly unknown[]>> = {
    mode: MODES,
    time: TIMES,
    words: WORD_COUNTS,
    language: LANGUAGES,
    uiLanguage: UI_LANGUAGES,
    smoothCaret: SMOOTH_CARETS,
    fontSize: FONT_SIZES,
    theme: THEMES,
    keymapMode: KEYMAP_MODES,
    paceCaret: PACE_CARETS,
    strictAccuracy: STRICT_ACCURACIES,
    indicateTypos: TYPO_INDICATORS,
    randomTheme: RANDOM_THEMES,
  };
  const list = lists[key];
  return list === undefined || list.includes(value);
}

/**
 * The config to run with, given what was stored. A stored value survives only
 * if it is on offer: an old localStorage entry or a hand-edited one cannot
 * bring back a feature that was taken out.
 */
export function lockConfig(stored: Config | undefined): Config {
  const config = getDefaultConfig();
  if (stored === undefined) {
    // a first visit: the browser says which language it would rather read,
    // and whoever reads the page in English came to type English words
    const uiLanguage = detectUiLanguage();
    config.uiLanguage = uiLanguage;
    config.language = TYPING_LANGUAGE[uiLanguage];
    return config;
  }
  for (const key of typedKeys(config)) {
    if (allowed(key, stored[key])) {
      // @ts-expect-error the key indexes both objects with the same type
      config[key] = stored[key];
    }
  }
  // the rotation is the default, but it was added after people had already
  // been picking colours by hand: a config stored before it existed, by
  // someone who had turned the computer's light and dark setting off to pick
  // one, keeps the colour they picked rather than being painted over
  if (stored.randomTheme === undefined && !stored.autoSwitchTheme) {
    config.randomTheme = "off";
  }
  // a config stored before the page had a language of its own: the word list
  // they were already typing says which page they had been reading, and that
  // beats whatever their browser asks for -- a Vietnamese typist on an
  // English browser must not find the page in English one morning
  if (stored.uiLanguage === undefined) {
    config.uiLanguage = uiLanguageOf(config.language);
  }
  return config;
}
