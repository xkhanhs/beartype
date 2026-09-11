import { isColorDark } from "../utils/colors";

import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import { configEvent } from "../events/config";
import { debounce } from "throttle-debounce";
import { themes } from "../constants/themes";
import { qs } from "../utils/dom";
import { setTheme, ThemeIdentifier } from "../states/theme";

let isPreviewingTheme = false;

async function apply(themeName: ThemeIdentifier): Promise<void> {
  console.debug(`Theme controller applying theme ${themeName}`);

  const themeColors = themes[themeName];

  setTheme({ ...themeColors, name: themeName });

  if (isColorDark(themeColors.bg)) {
    qs("body")?.addClass("darkMode");
  } else {
    qs("body")?.removeClass("darkMode");
  }
}

let previewTheme: ThemeIdentifier | null = null;

export function preview(themeIdentifier: ThemeIdentifier): void {
  previewTheme = themeIdentifier;
  debouncedPreview();
}

const debouncedPreview = debounce<() => void>(250, () => {
  if (previewTheme !== null) {
    isPreviewingTheme = true;
    void apply(previewTheme);
  }
});

async function set(
  themeIdentifier: ThemeIdentifier,
  isAutoSwitch = false,
): Promise<void> {
  console.debug("Theme controller setting theme", themeIdentifier, {
    isAutoSwitch,
  });
  await apply(themeIdentifier);

  if (!isAutoSwitch && Config.autoSwitchTheme) {
    setConfig("autoSwitchTheme", false);
  }
}

export async function clearPreview(applyTheme = true): Promise<void> {
  previewTheme = null;

  if (isPreviewingTheme) {
    isPreviewingTheme = false;
    if (applyTheme) {
      if (Config.autoSwitchTheme) {
        // beartype: under "follow the computer" the theme on screen is
        // themeLight or themeDark, not Config.theme
        await apply(
          prefersColorSchemeDark() ? Config.themeDark : Config.themeLight,
        );
      } else {
        await apply(Config.theme);
      }
    }
  }
}

window
  .matchMedia?.("(prefers-color-scheme: dark)")
  ?.addEventListener?.("change", (event) => {
    if (!Config.autoSwitchTheme) return;
    if (event.matches) {
      void set(Config.themeDark, true);
    } else {
      void set(Config.themeLight, true);
    }
  });

let ignoreConfigEvent = false;

configEvent.subscribe(async ({ key, newValue, nosave }) => {
  if (key === "fullConfigChange") {
    ignoreConfigEvent = true;
  }
  if (key === "fullConfigChangeFinished") {
    ignoreConfigEvent = false;

    await clearPreview(false);

    if (Config.autoSwitchTheme) {
      if (prefersColorSchemeDark()) {
        await set(Config.themeDark, true);
      } else {
        await set(Config.themeLight, true);
      }
    } else {
      await set(Config.theme);
    }
  }

  // this is here to prevent calling set / preview multiple times during a full config loading
  // once the full config is loaded, we can apply everything once
  if (ignoreConfigEvent) return;

  if (key === "theme") {
    await clearPreview(false);
    await set(newValue);
  }
  if (key === "autoSwitchTheme") {
    if (newValue) {
      if (prefersColorSchemeDark()) {
        await set(Config.themeDark, true);
      } else {
        await set(Config.themeLight, true);
      }
    } else {
      await set(Config.theme);
    }
  }
  if (
    key === "themeLight" &&
    Config.autoSwitchTheme &&
    !prefersColorSchemeDark() &&
    !nosave
  ) {
    await set(Config.themeLight, true);
  }
  if (
    key === "themeDark" &&
    Config.autoSwitchTheme &&
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches &&
    !nosave
  ) {
    await set(Config.themeDark, true);
  }
});

function prefersColorSchemeDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}
