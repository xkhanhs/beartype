import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { JSXElement } from "solid-js";

import { getDefaultConfig } from "../constants/default-config";
import { showNoticeNotification } from "../states/notifications";
import { FaObject } from "../types/font-awesome";
import { isDevEnvironment } from "../utils/env";
import { reloadAfter } from "../utils/misc";
import { getOptions } from "../utils/zod";
// type SetBlock = {
//   [K in keyof ConfigSchemas.Config]?: ConfigSchemas.Config[K][];
// };

// type RequiredConfig = {
//   [K in keyof ConfigSchemas.Config]?: ConfigSchemas.Config[K];
// };

export type OptionMetadata = {
  displayString?: string;
  fa?: FaObject;
  visible?: boolean;
};

export type ConfigMetadata<K extends keyof ConfigSchemas.Config> = {
  /**
   * The config key that this metadata is for
   */
  key: K;

  /**
   * Optional display string for the config key.
   */
  displayString?: string;
  /**
   * Should the config change trigger a resize event? handled in ui.ts:108
   */
  triggerResize?: true;

  description?: string | JSXElement;

  /**
   * Fa object (icon)
   */
  fa: FaObject;

  optionsMetadata?: ConfigSchemas.Config[K] extends string | number | symbol
    ? Record<ConfigSchemas.Config[K], OptionMetadata>
    : ConfigSchemas.Config[K] extends boolean
      ? Partial<{
          true: OptionMetadata;
          false: OptionMetadata;
        }>
      : never;

  // commandline?: {
  //   displayValues?: ConfigSchemas.Config[K] extends string | number | symbol
  //     ? Partial<Record<ConfigSchemas.Config[K], string>>
  //     : never;
  // };

  /**
   * Group that this config belongs to. Used for partial presets
   */
  group: ConfigSchemas.ConfigGroupName;

  /**
   * Is a test restart required after this config change?
   */
  changeRequiresRestart: boolean;
  /**
   * Optional function that checks if the config value is blocked from being set.
   * Returns true if setting the config value should be blocked.
   * @param options - The options object containing the value being set and the current config.
   */
  isBlocked?: (options: {
    value: ConfigSchemas.Config[K];
    currentConfig: Readonly<ConfigSchemas.Config>;
  }) => boolean;
  /**
   * Optional function to override the value before setting it.
   * Returns the modified value.
   * @param options - The options object containing the value being set, the current value, and the current config.
   * @returns The modified value to be set for the config key.
   */
  overrideValue?: (options: {
    value: ConfigSchemas.Config[K];
    currentValue: ConfigSchemas.Config[K];
    currentConfig: Readonly<ConfigSchemas.Config>;
  }) => ConfigSchemas.Config[K];
  /**
   * Optional function to override other config values before this one is set.
   * Returns an object with the config keys and their new values.
   * @param options - The options object containing the value being set and the current config.
   */
  overrideConfig?: (options: {
    value: ConfigSchemas.Config[K];
    currentConfig: Readonly<ConfigSchemas.Config>;
  }) => Partial<ConfigSchemas.Config>;
  /**
   * Optional function that is called after the config value is set.
   * It can be used to perform additional actions, like reloading the page.
   * @param options - The options object containing the nosave flag and the current config.
   */
  afterSet?: (options: {
    nosave: boolean;
    currentConfig: Readonly<ConfigSchemas.Config>;
  }) => void;
};

export type ConfigMetadataObject = {
  [K in keyof ConfigSchemas.Config]: ConfigMetadata<K>;
};

//todo:
// maybe have generic set somehow handle test restarting

export const configMetadata: ConfigMetadataObject = {
  // test
  words: {
    key: "words",
    fa: { icon: "fa-font" },
    displayString: "word count",
    changeRequiresRestart: true,
    group: "test",
    overrideConfig: ({ currentConfig }) => {
      if (currentConfig.mode !== "words") {
        return {
          mode: "words",
        };
      }
      return {};
    },
  },
  time: {
    key: "time",
    fa: { icon: "fa-clock" },
    changeRequiresRestart: true,
    displayString: "time",
    group: "test",
    overrideConfig: ({ currentConfig }) => {
      if (currentConfig.mode !== "time") {
        return {
          mode: "time",
        };
      }
      return {};
    },
  },
  mode: {
    key: "mode",
    fa: { icon: "fa-bars" },
    changeRequiresRestart: true,
    optionsMetadata: {
      time: {
        fa: { icon: "fa-clock" },
      },
      words: {
        fa: { icon: "fa-font" },
      },
      custom: {
        fa: { icon: "fa-wrench" },
      },
    },
    group: "test",
  },
  language: {
    key: "language",
    fa: { icon: "fa-language" },
    displayString: "language",
    changeRequiresRestart: true,
    group: "test",
    description: "Change in which language you want to type.",
  },
  // behavior
  resultSaving: {
    key: "resultSaving",
    fa: { icon: "fa-save" },
    displayString: "result saving",
    changeRequiresRestart: false,
    group: "behavior",
    description:
      'Set this setting to "off" in case you want to practice without saving new results to your account and affecting your statistics.',
  },
  // input
  indicateTypos: {
    key: "indicateTypos",
    fa: { icon: "fa-exclamation" },
    displayString: "indicate typos",
    changeRequiresRestart: false,
    group: "input",
    description:
      'Shows typos that you\'ve made. "Below" shows what you typed below the letters, "replace" will replace the letters with the ones you typed and "both" will do the same as replace and below, but it will show the correct letters below your mistakes.',
  },
  // sound
  soundVolume: {
    key: "soundVolume",
    fa: { icon: "fa-volume-down" },
    displayString: "sound volume",
    changeRequiresRestart: false,
    group: "sound",
    description: "Change the volume of the sound effects.",
  },
  playSoundOnClick: {
    key: "playSoundOnClick",
    optionsMetadata: {
      off: {},
      "1": { displayString: "click" },
      "2": { displayString: "beep" },
      "3": { displayString: "pop" },
      "4": { displayString: "nk creams" },
      "5": { displayString: "typewriter" },
      "6": { displayString: "osu" },
      "7": { displayString: "hitmarker" },
      "8": { displayString: "sine" },
      "9": { displayString: "sawtooth" },
      "10": { displayString: "square" },
      "11": { displayString: "triangle" },
      "12": { displayString: "pentatonic" },
      "13": { displayString: "wholetone" },
      "14": { displayString: "fist fight" },
      "15": { displayString: "rubber keys" },
      "16": { displayString: "fart" },
      "17": { displayString: "akko lavenders" },
      "18": { displayString: "cherrymx black abs" },
      "19": { displayString: "cherrymx black pbt" },
      "20": { displayString: "cherrymx blue abs" },
      "21": { displayString: "cherrymx blue pbt" },
      "22": { displayString: "cherrymx brown pbt" },
      "23": { displayString: "kalih box white" },
      "24": { displayString: "razer green" },
      "25": { displayString: "tealios v2" },
      "26": { displayString: "trust gxt" },
    },
    fa: { icon: "fa-volume-up" },
    displayString: "play sound on click",
    changeRequiresRestart: false,
    group: "sound",
    description: "Plays a short sound when you press a key.",
  },
  playSoundOnError: {
    key: "playSoundOnError",
    optionsMetadata: {
      off: {},
      "1": { displayString: "damage" },
      "2": { displayString: "triangle" },
      "3": { displayString: "square" },
      "4": { displayString: "missed punch" },
    },
    fa: { icon: "fa-volume-mute" },
    displayString: "play sound on error",
    changeRequiresRestart: false,
    group: "sound",
    description:
      "Plays a short sound if you press an incorrect key or press space too early.",
  },
  playTimeWarning: {
    key: "playTimeWarning",
    optionsMetadata: {
      off: {},
      "1": { displayString: "1 second" },
      "3": { displayString: "3 seconds" },
      "5": { displayString: "5 seconds" },
      "10": { displayString: "10 seconds" },
    },
    fa: { icon: "fa-exclamation-triangle" },
    displayString: "play time warning",
    changeRequiresRestart: false,
    group: "sound",
    description:
      "Play a short warning sound if you are close to the end of a timed test.",
  },

  // caret
  smoothCaret: {
    key: "smoothCaret",
    fa: { icon: "fa-i-cursor" },
    displayString: "smooth caret",
    changeRequiresRestart: false,
    group: "caret",
    description: "The caret will move smoothly between letters and words.",
  },
  // appearance
  fontSize: {
    key: "fontSize",
    fa: { icon: "fa-font" },
    changeRequiresRestart: false,
    triggerResize: true,
    displayString: "font size",
    group: "appearance",
    description: "Change the font size of the test words.",
  },
  fontFamily: {
    key: "fontFamily",
    fa: { icon: "fa-font" },
    displayString: "font family",
    changeRequiresRestart: false,
    group: "appearance",
    description:
      "Change the font family used by the website. Using a local font will override your choice. ",
    optionsMetadata: {
      Comic_Sans_MS: {
        displayString: "Helvetica",
      },
    },
  },
  keymapMode: {
    key: "keymapMode",
    fa: { icon: "fa-keyboard" },
    displayString: "keymap mode",
    changeRequiresRestart: false,
    group: "appearance",
    description:
      "Displays your current layout while taking a test. React shows what you pressed and Next shows what you need to press next.",
  },
  // theme
  customBackground: {
    key: "customBackground",
    fa: { icon: "fa-link" },
    displayString: "custom background",
    changeRequiresRestart: false,
    group: "theme",
    overrideValue: ({ value }) => {
      return value.trim();
    },
    description:
      "Set an image url or local image to be a custom background image. Local image always take priority over the image url. Cover fits the image to cover the screen. Contain fits the image to be fully visible. Max fits the image corner to corner.",
  },
  customBackgroundSize: {
    key: "customBackgroundSize",
    fa: { icon: "fa-image" },
    displayString: "custom background size",
    changeRequiresRestart: false,
    group: "theme",
    description:
      "Set an image url or local image to be a custom background image. Cover fits the image to cover the screen. Contain fits the image to be fully visible. Max fits the image corner to corner.",
  },
  customBackgroundFilter: {
    key: "customBackgroundFilter",
    fa: { icon: "fa-image" },
    displayString: "custom background filter",
    changeRequiresRestart: false,
    group: "theme",
    description: "Apply various effects to the custom background.",
  },
  autoSwitchTheme: {
    key: "autoSwitchTheme",
    fa: { icon: "fa-palette" },
    displayString: "auto switch theme",
    changeRequiresRestart: false,
    group: "theme",
    description:
      "Enabling this will automatically switch the theme between light and dark depending on the system theme.",
  },
  themeLight: {
    key: "themeLight",
    fa: { icon: "fa-palette" },
    displayString: "theme light",
    changeRequiresRestart: false,
    group: "theme",
  },
  themeDark: {
    key: "themeDark",
    fa: { icon: "fa-palette" },
    displayString: "theme dark",
    changeRequiresRestart: false,
    group: "theme",
  },
  randomTheme: {
    key: "randomTheme",
    fa: { icon: "fa-palette" },
    changeRequiresRestart: false,
    displayString: "random theme",
    group: "theme",
    description:
      "After completing a test, the theme will be set to a random one. The random themes are not saved to your config. If set to 'favorite' only favorite themes will be randomized. If set to 'light' or 'dark', only presets with light or dark background colors will be randomized, respectively. If set to 'auto' dark or light themes are used, depending on your system theme. If set to 'custom', custom themes will be randomized.",
    optionsMetadata: {
      fav: {
        displayString: "favorite",
      },
      auto: {},
      custom: {},
      dark: {},
      light: {},
      off: {},
      on: {},
    },
    isBlocked: ({ value }) => {
      if (value === "custom") {
        // beartype: saved custom themes lived in the account
        showNoticeNotification("Random theme 'custom' is unavailable");
        return true;
      }
      return false;
    },
  },
  favThemes: {
    key: "favThemes",
    fa: { icon: "fa-palette" },
    displayString: "favorite themes",
    changeRequiresRestart: false,
    group: "theme",
  },
  theme: {
    key: "theme",
    fa: { icon: "fa-palette" },
    changeRequiresRestart: false,
    group: "theme",
    description:
      "Completely change the look and feel of the website by picking one of the presets, or by creating your own completely custom theme.",
    overrideConfig: () => {
      return {
        customTheme: false,
      };
    },
  },
  customTheme: {
    key: "customTheme",
    fa: { icon: "fa-palette" },
    displayString: "custom theme",
    changeRequiresRestart: false,
    group: "theme",
  },
  customThemeColors: {
    key: "customThemeColors",
    fa: { icon: "fa-palette" },
    displayString: "custom theme colors",
    changeRequiresRestart: false,
    group: "theme",
    overrideValue: ({ value }) => {
      const allColorsThesame = value.every((color) => color === value[0]);
      if (allColorsThesame) {
        return getDefaultConfig().customThemeColors;
      } else {
        return value;
      }
    },
  },

  // hide elements
  showOutOfFocusWarning: {
    key: "showOutOfFocusWarning",
    fa: { icon: "fa-exclamation" },
    displayString: "show out of focus warning",
    changeRequiresRestart: false,
    group: "hideElements",
    description:
      "Shows an out of focus reminder after 1 second of being 'out of focus' (not being able to type).",
    optionsMetadata: {
      true: { displayString: "show" },
      false: { displayString: "hide" },
    },
  },
  capsLockWarning: {
    key: "capsLockWarning",
    fa: { icon: "fa-exclamation-triangle" },
    displayString: "caps lock warning",
    changeRequiresRestart: false,
    group: "hideElements",
    description: "Displays a warning when caps lock is on.",
    optionsMetadata: {
      true: { displayString: "show" },
      false: { displayString: "hide" },
    },
  },
  // other (hidden)
  monkey: {
    key: "monkey",
    fa: { icon: "fa-egg" },
    displayString: "monkey",
    changeRequiresRestart: false,
    group: "hidden",
  },
  monkeyPowerLevel: {
    key: "monkeyPowerLevel",
    fa: { icon: "fa-egg" },
    displayString: "monkey power level",
    changeRequiresRestart: false,
    group: "hidden",
  },

  // ads
  ads: {
    key: "ads",
    fa: { icon: "fa-ad" },
    changeRequiresRestart: false,
    description: `You can disable or enable ads at any time. "Result" will show one ad on the result page, "on" will add floating vertical banners, and "sellout" will add multiple ads on every page.`,
    group: "ads",
    overrideValue: ({ value }) => {
      if (isDevEnvironment()) {
        return "off";
      }
      return value;
    },
    isBlocked: ({ value }) => {
      if (value !== "off" && isDevEnvironment()) {
        showNoticeNotification("Ads are disabled in development mode.");
        return true;
      }
      return false;
    },
    afterSet: ({ nosave }) => {
      if (!nosave && !isDevEnvironment()) {
        reloadAfter(3);
        showNoticeNotification("Ad settings changed. Refreshing...");
      }
    },
  },
};

// typed accessor for a single option's metadata, avoiding per-callsite casts
export function getOptionMetadata<K extends keyof ConfigSchemas.Config>(
  key: K,
  option: ConfigSchemas.Config[K],
): OptionMetadata | undefined {
  return (
    configMetadata[key] as {
      optionsMetadata?: Record<string, OptionMetadata> | undefined;
    }
  ).optionsMetadata?.[String(option)];
}

// the selectable options for a config key, excluding those marked visible:false
export function getVisibleOptions<K extends keyof ConfigSchemas.Config>(
  key: K,
): ConfigSchemas.Config[K][] | undefined {
  return getOptions(ConfigSchemas.ConfigSchema.shape[key])?.filter(
    (option) =>
      getOptionMetadata(key, option as ConfigSchemas.Config[K])?.visible !==
      false,
  ) as ConfigSchemas.Config[K][] | undefined;
}

// the label shown for a single option (and used to match it while searching)
export function getOptionLabel<K extends keyof ConfigSchemas.Config>(
  key: K,
  option: ConfigSchemas.Config[K],
): string {
  const optionMeta = getOptionMetadata(key, option);
  if (optionMeta?.displayString !== undefined) return optionMeta.displayString;
  if (option === true) return "on";
  if (option === false) return "off";
  return String(option).replace(/_/g, " ");
}

// all of a setting's visible option labels joined, so search can match on them
export function getOptionSearchKeywords<K extends keyof ConfigSchemas.Config>(
  key: K,
): string {
  return (getVisibleOptions(key) ?? [])
    .map((option) => getOptionLabel(key, option))
    .join(" ");
}
