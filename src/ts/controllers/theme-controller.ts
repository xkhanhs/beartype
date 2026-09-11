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
        // under "follow the computer" the theme on screen is keybear's light
        // or dark palette, not Config.theme
        await apply(autoTheme());
      } else {
        await apply(Config.theme);
      }
    }
  }
}

window
  .matchMedia?.("(prefers-color-scheme: dark)")
  ?.addEventListener?.("change", () => {
    if (!Config.autoSwitchTheme) return;
    void set(autoTheme(), true);
  });

let ignoreConfigEvent = false;

configEvent.subscribe(async ({ key, newValue }) => {
  if (key === "fullConfigChange") {
    ignoreConfigEvent = true;
  }
  if (key === "fullConfigChangeFinished") {
    ignoreConfigEvent = false;

    await clearPreview(false);

    if (Config.autoSwitchTheme) {
      await set(autoTheme(), true);
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
      await set(autoTheme(), true);
    } else {
      await set(Config.theme);
    }
  }
});

function autoTheme(): ThemeIdentifier {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "keybear_dark"
    : "keybear_light";
}
