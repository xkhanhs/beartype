import type { Config } from "@monkeytype/schemas/configs";
import { getDefaultConfig } from "../constants/default-config";

/**
 * The settings a person can still change. Everything else in upstream's
 * config -- about a hundred keys -- is fixed.
 *
 * The typing code reads those keys everywhere (`Config.stopOnError`,
 * `Config.mode === "zen"`, ...). Deleting the branches would mean editing the
 * code this app exists to leave alone, so the keys stay and their values are
 * pinned instead.
 */
export const USER_KEYS = [
  "mode",
  "time",
  "words",
  "language",
  "theme",
  "autoSwitchTheme",
  "themeLight",
  "themeDark",
  "smoothCaret",
  "paceCaret",
] as const satisfies readonly (keyof Config)[];

type UserKey = (typeof USER_KEYS)[number];

/**
 * Where beartype departs from upstream's defaults.
 *
 * The caret and pace caret are the settings this app was measured against on
 * monkeytype.com; the rest turn off features that no longer exist here, so
 * that nothing waits on them.
 */
const BEARTYPE_DEFAULTS: Partial<Config> = {
  language: "vietnamese",
  smoothCaret: "slow",
  paceCaret: "average",
  ads: "off",
  punctuation: false,
  numbers: false,
  funbox: [],
  keymapMode: "off",
  playSoundOnClick: "off",
  playSoundOnError: "off",
  playTimeWarning: "off",
  monkey: false,
  monkeyPowerLevel: "off",
  customBackground: "",
  randomTheme: "off",
  resultSaving: true,
};

/** Times and word counts on offer; anything else falls back to the default. */
export const TIMES = [15, 30, 60, 120] as const;
export const WORD_COUNTS = [10, 25, 50, 100] as const;
export const LANGUAGES = ["vietnamese", "english"] as const;
export const MODES = ["time", "words"] as const;
export const SMOOTH_CARETS = ["off", "slow", "medium", "fast"] as const;
export const PACE_CARETS = ["off", "average", "pb", "last"] as const;

export function getBeartypeDefaults(): Config {
  return { ...getDefaultConfig(), ...BEARTYPE_DEFAULTS };
}

function allowed(key: UserKey, value: unknown): boolean {
  const lists: Partial<Record<UserKey, readonly unknown[]>> = {
    mode: MODES,
    time: TIMES,
    words: WORD_COUNTS,
    language: LANGUAGES,
    smoothCaret: SMOOTH_CARETS,
    paceCaret: PACE_CARETS,
  };
  const list = lists[key];
  return list === undefined || list.includes(value);
}

/**
 * The config to run with, given what was stored. Only the user keys survive
 * from `stored`, and only with a value on offer: an old localStorage entry or
 * a hand-edited one cannot bring back a feature that was taken out.
 */
export function lockConfig(stored: Config | undefined): Config {
  const config = getBeartypeDefaults();
  if (stored === undefined) return config;
  for (const key of USER_KEYS) {
    if (allowed(key, stored[key])) {
      // @ts-expect-error the key indexes both objects with the same type
      config[key] = stored[key];
    }
  }
  return config;
}
