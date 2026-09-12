import * as ConfigSchemas from "../schemas/configs";

type ConfigMetadata<K extends keyof ConfigSchemas.Config> = {
  /**
   * The config key that this metadata is for
   */
  key: K;

  /**
   * Optional display string for the config key, used in warning/error
   * messages when a value is blocked or an override fails.
   */
  displayString?: string;
  /**
   * Should the config change trigger a resize event? handled in ui.ts:108
   */
  triggerResize?: true;

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

export const configMetadata: ConfigMetadataObject = {
  // test
  words: {
    key: "words",
    displayString: "word count",
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
    displayString: "time",
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
  },
  language: {
    key: "language",
    displayString: "language",
  },
  // interface
  // beartype: picking a language for the page also picks the word list, but
  // the button in the footer sets both keys itself rather than overriding
  // from here. An override would fire again on every full config load, and
  // reading the page in one language while typing the other is a real choice.
  uiLanguage: {
    key: "uiLanguage",
    displayString: "interface language",
  },
  // input
  indicateTypos: {
    key: "indicateTypos",
    displayString: "indicate typos",
  },
  // caret
  smoothCaret: {
    key: "smoothCaret",
    displayString: "smooth caret",
  },
  paceCaret: {
    key: "paceCaret",
    displayString: "pace caret",
  },
  // difficulty
  strictAccuracy: {
    key: "strictAccuracy",
    displayString: "strict accuracy",
  },
  // appearance
  fontSize: {
    key: "fontSize",
    triggerResize: true,
    displayString: "font size",
  },
  keymapMode: {
    key: "keymapMode",
    displayString: "keymap mode",
  },
  // theme
  autoSwitchTheme: {
    key: "autoSwitchTheme",
    displayString: "auto switch theme",
  },
  theme: {
    key: "theme",
  },
  randomTheme: {
    key: "randomTheme",
    displayString: "random theme",
  },
};
