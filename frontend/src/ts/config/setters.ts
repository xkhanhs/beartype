import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { ZodType as ZodSchema } from "zod";
import { saveToLocalStorage } from "../config/persistence";
import { configEvent } from "../events/config";
import { triggerResize } from "../utils/misc";
import { configMetadata } from "./metadata";
import { Config, setConfigStore } from "./store";
import { isConfigValueValid } from "./validation";
import { typedKeys } from "@monkeytype/util/objects";

export function setConfig<T extends keyof ConfigSchemas.Config>(
  key: T,
  value: ConfigSchemas.Config[T],
  options?: {
    nosave?: boolean;
    partOfFullConfigChange?: boolean;
  },
): boolean {
  const metadata = configMetadata[key];
  if (metadata === undefined) {
    throw new Error(`Config metadata for key "${key}" is not defined.`);
  }

  if (metadata.overrideValue) {
    value = metadata.overrideValue({
      value,
      currentValue: Config[key],
      currentConfig: Config,
    });
  }

  const previousValue = Config[key];

  if (metadata.isBlocked?.({ value, currentConfig: Config })) {
    console.warn(
      `Could not set config key "${key}" with value "${JSON.stringify(
        value,
      )}" - blocked.`,
    );
    return false;
  }

  const schema = ConfigSchemas.ConfigSchema.shape[key] as ZodSchema;

  if (!isConfigValueValid(metadata.displayString ?? key, value, schema)) {
    console.warn(
      `Could not set config key "${key}" with value "${JSON.stringify(
        value,
      )}" - invalid value.`,
    );
    return false;
  }

  if (metadata.overrideConfig) {
    const targetConfig = metadata.overrideConfig({
      value,
      currentConfig: Config,
    });

    for (const targetKey of typedKeys(targetConfig)) {
      const targetValue = targetConfig[
        targetKey
      ] as ConfigSchemas.Config[keyof typeof configMetadata];

      if (Config[targetKey] === targetValue) {
        continue; // no need to set if the value is already the same
      }

      const set = setConfig(targetKey, targetValue, options);
      if (!set) {
        throw new Error(
          `Failed to set config key "${targetKey}" with value "${targetValue}" for ${metadata.displayString} config override.`,
        );
      }
    }
  }

  Config[key] = value;
  if (!options?.nosave) saveToLocalStorage(key, options?.nosave);

  // @ts-expect-error i can't figure this out
  configEvent.dispatch({
    key: key,
    newValue: value,
    nosave: options?.nosave ?? false,
    previousValue: previousValue,
  });

  if (!options?.partOfFullConfigChange) {
    setConfigStore(key, value);
  }

  if (metadata.triggerResize && !options?.nosave) {
    triggerResize();
  }

  metadata.afterSet?.({
    nosave: options?.nosave ?? false,
    currentConfig: Config,
  });
  return true;
}

export function setQuoteLengthAll(nosave?: boolean): boolean {
  return setConfig("quoteLength", [0, 1, 2, 3], {
    nosave,
  });
}
