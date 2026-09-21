import { Config as ConfigSchema } from "../schemas/configs";
import { Config } from "./store";
import * as ConfigSchemas from "../schemas/configs";
import { getDefaultConfig } from "../constants/default-config";
import { migrateConfig } from "./utils";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { isObject } from "../utils/misc";

// beartype: the config lives in this browser only. Upstream also mirrored
// every change to the account; there is no account to mirror it to.

export const configLS = new LocalStorageWithSchema({
  key: "config",
  schema: ConfigSchemas.ConfigSchema,
  fallback: getDefaultConfig(),
  migrate: (value, _issues) => {
    if (!isObject(value)) {
      return getDefaultConfig();
    }
    // beartype: the hidden word list `#khanh` opened is gone; a browser that
    // last typed it goes on typing Vietnamese, not the default
    if (value["language"] === "vietnamese_khanh") {
      return migrateConfig({ ...value, language: "vietnamese" });
    }
    return migrateConfig(value);
  },
});

export function saveToLocalStorage(
  _key: keyof ConfigSchema,
  nosave = false,
): void {
  if (nosave) return;
  configLS.set(Config);
}

export function saveFullConfigToLocalStorage(): void {
  console.log("saving full config to localStorage");
  configLS.set(Config);
}
