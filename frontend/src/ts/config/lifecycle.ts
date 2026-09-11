import * as ConfigSchemas from "@monkeytype/schemas/configs";
import {
  configLS,
  saveToLocalStorage,
  saveFullConfigToLocalStorage,
} from "./persistence";
import { Config, setFullConfigStore } from "./store";
import { getDefaultConfig } from "../constants/default-config";
import { configEvent } from "../events/config";
import { migrateConfig } from "./utils";
import { promiseWithResolvers } from "../utils/misc";
import { setConfig } from "./setters";
import { typedKeys } from "@monkeytype/util/objects";
import { lockConfig } from "../beartype/config-lock";

export async function loadFromLocalStorage(): Promise<void> {
  console.log("loading localStorage config");
  // beartype: only a handful of settings are the user's; the rest are pinned.
  // With nothing stored yet, configLS hands back upstream's defaults, which
  // must not pass for a choice the user made.
  const firstRun = window.localStorage.getItem("config") === null;
  await applyConfig(lockConfig(firstRun ? undefined : configLS.get()));
  saveFullConfigToLocalStorage();
  loadDone();
}

const lastConfigsToApply: Set<keyof ConfigSchemas.Config> = new Set([
  "keymapMode",
  "words",
  "time",
  "mode",
]);

export async function applyConfig(
  partialConfig: Partial<ConfigSchemas.Config>,
): Promise<void> {
  if (partialConfig === undefined || partialConfig === null) return;

  //migrate old values if needed, remove additional keys and merge with default config
  const fullConfig: ConfigSchemas.Config = migrateConfig(partialConfig);

  configEvent.dispatch({ key: "fullConfigChange" });

  const defaultConfig = getDefaultConfig();
  for (const key of typedKeys(fullConfig)) {
    //@ts-expect-error this is fine, both are of type config
    Config[key] = defaultConfig[key];
  }

  const configKeysToReset: (keyof ConfigSchemas.Config)[] = [];

  const firstKeys = typedKeys(fullConfig).filter(
    (key) => !lastConfigsToApply.has(key),
  );

  for (const configKey of [...firstKeys, ...lastConfigsToApply]) {
    const configValue = fullConfig[configKey];

    const set = setConfig(configKey, configValue, {
      nosave: true,
      partOfFullConfigChange: true,
    });

    if (!set) {
      configKeysToReset.push(configKey);
    }
  }

  for (const key of configKeysToReset) {
    saveToLocalStorage(key);
  }

  configEvent.dispatch({ key: "fullConfigChangeFinished" });
  setFullConfigStore(fullConfig);
}

const { promise: configLoadPromise, resolve: loadDone } =
  promiseWithResolvers();

export { configLoadPromise };
