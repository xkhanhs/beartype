import {
  type Config,
  IndicateTyposSchema,
  KeymapModeSchema,
  PlaySoundOnClickSchema,
  PlaySoundOnErrorSchema,
} from "../schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { typedKeys } from "../utils/objects";

/** Times and word counts on offer; anything else falls back to the default. */
export const TIMES = [15, 30, 60, 120] as const;
export const WORD_COUNTS = [10, 25, 50, 100] as const;
export const LANGUAGES = ["vietnamese", "english"] as const;
export const MODES = ["time", "words"] as const;
export const SMOOTH_CARETS = ["off", "slow", "medium", "fast"] as const;
/**
 * keybear's typing fonts, in the order its picker shows them. Each ships the
 * vietnamese subset (see `beartype.scss`); without it every accented letter
 * falls back to a system font.
 */
export const FONTS = [
  "Roboto_Mono",
  "IBM_Plex_Mono",
  "Be_Vietnam_Pro",
  "Lexend",
  "Open_Sans",
  "Quicksand",
] as const;
/**
 * Chrome's zoom steps from 80% to 200%, in rem around upstream's 2rem. The
 * four sizes offered before (80, 100, 125, 150%) are among them, so a stored
 * choice still stands.
 */
export const FONT_SIZES = [1.6, 1.8, 2, 2.2, 2.5, 3, 3.5, 4] as const;
export const CLICK_SOUNDS = PlaySoundOnClickSchema.options;
export const ERROR_SOUNDS = PlaySoundOnErrorSchema.options;
export const KEYMAP_MODES = KeymapModeSchema.options;
export const TYPO_INDICATORS = IndicateTyposSchema.options;
export const THEMES = [
  "keybear_light",
  "keybear_dark",
  "keybear_princess",
  "keybear_ocean",
  "keybear_forest",
  "keybear_racing",
  "keybear_dracula",
  "keybear_pixel",
  "keybear_hero",
] as const;

function allowed(key: keyof Config, value: unknown): boolean {
  const lists: Partial<Record<keyof Config, readonly unknown[]>> = {
    mode: MODES,
    time: TIMES,
    words: WORD_COUNTS,
    language: LANGUAGES,
    smoothCaret: SMOOTH_CARETS,
    fontFamily: FONTS,
    fontSize: FONT_SIZES,
    theme: THEMES,
    playSoundOnClick: CLICK_SOUNDS,
    playSoundOnError: ERROR_SOUNDS,
    keymapMode: KEYMAP_MODES,
    indicateTypos: TYPO_INDICATORS,
  };
  if (key === "soundVolume") {
    return typeof value === "number" && value >= 0 && value <= 1;
  }
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
  if (stored === undefined) return config;
  for (const key of typedKeys(config)) {
    if (allowed(key, stored[key])) {
      // @ts-expect-error the key indexes both objects with the same type
      config[key] = stored[key];
    }
  }
  return config;
}
