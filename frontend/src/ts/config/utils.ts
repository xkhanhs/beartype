import type {
  Config as ConfigSchema,
  PartialConfig,
} from "@monkeytype/schemas/configs";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { typedKeys } from "@monkeytype/util/objects";
import { getDefaultConfig } from "../constants/default-config";
import { sanitize } from "../utils/sanitize";
import { Config } from "./store";
/**
 * migrates possible outdated config and merges with the default config values
 * @param config partial or possible outdated config
 * @returns
 */
export function migrateConfig(config: PartialConfig | object): ConfigSchema {
  return mergeWithDefaultConfig(sanitizeConfig(replaceLegacyValues(config)));
}

function mergeWithDefaultConfig(config: PartialConfig): ConfigSchema {
  const defaultConfig = getDefaultConfig();
  const mergedConfig = {} as ConfigSchema;
  for (const key of typedKeys(defaultConfig)) {
    const newValue = config[key] ?? defaultConfig[key];
    //@ts-expect-error cant be bothered to deal with this
    mergedConfig[key] = newValue;
  }
  return mergedConfig;
}

/**
 * remove all values from the config which are not valid
 */
function sanitizeConfig(
  config: ConfigSchemas.PartialConfig,
): ConfigSchemas.PartialConfig {
  //make sure to use strip()
  return sanitize(ConfigSchemas.PartialConfigSchema.strip(), config);
}

function replaceLegacyValues(
  configObj: ConfigSchemas.PartialConfig,
): ConfigSchemas.PartialConfig {
  if (typeof configObj.smoothCaret === "boolean") {
    configObj.smoothCaret = configObj.smoothCaret ? "medium" : "off";
  }

  if (typeof configObj.playSoundOnError === "boolean") {
    configObj.playSoundOnError = configObj.playSoundOnError ? "1" : "off";
  }

  if (typeof configObj.soundVolume === "string") {
    configObj.soundVolume = parseFloat(configObj.soundVolume);
  }

  if (typeof configObj.indicateTypos === "boolean") {
    configObj.indicateTypos =
      configObj.indicateTypos === false ? "off" : "replace";
  }

  if (typeof configObj.fontSize === "string") {
    //legacy values use strings
    const oldValue = configObj.fontSize;
    let newValue = parseInt(oldValue);

    if (oldValue === "125") {
      newValue = 1.25;
    } else if (oldValue === "15") {
      newValue = 1.5;
    }

    configObj.fontSize = newValue;
  } else if (configObj.fontSize !== undefined && configObj.fontSize < 0) {
    configObj.fontSize = 1;
  }

  if (
    Array.isArray(configObj.customThemeColors) &&
    //@ts-expect-error legacy configs
    configObj.customThemeColors.length === 9
  ) {
    // migrate existing configs missing sub alt color
    const colors = configObj.customThemeColors;
    colors.splice(4, 0, "#000000");
    configObj.customThemeColors = colors;
  }

  if (
    Array.isArray(configObj.customBackgroundFilter) &&
    //@ts-expect-error legacy configs
    configObj.customBackgroundFilter.length === 5
  ) {
    const arr = configObj.customBackgroundFilter;
    configObj.customBackgroundFilter = [arr[0], arr[1], arr[2], arr[3]];
  }

  return configObj;
}

export function getConfigChanges(): Partial<ConfigSchema> {
  const configChanges: Partial<ConfigSchema> = {};
  typedKeys(Config)
    .filter((key) => {
      return Config[key] !== getDefaultConfig()[key];
    })
    .forEach((key) => {
      //@ts-expect-error this is fine
      configChanges[key] = Config[key];
    });
  return configChanges;
}
