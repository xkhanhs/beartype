import { isColorDark } from "../utils/colors";

import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import { configEvent } from "../events/config";
import { debounce } from "throttle-debounce";
import { themes } from "../constants/themes";
import { qs } from "../utils/dom";
import { setTheme, ThemeIdentifier } from "../states/theme";
import { THEMES } from "../beartype/config-lock";
import { shuffle } from "../utils/arrays";

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

/**
 * beartype: the palette a rotating test is wearing, or null when the colours
 * are the chosen ones. It is kept out of Config.theme so that turning the
 * rotation off puts back the palette the person actually picked.
 */
let randomTheme: ThemeIdentifier | null = null;
/** What is left of the shuffled pack; a new pack is dealt when it runs out. */
let randomBag: ThemeIdentifier[] = [];

function randomPool(): ThemeIdentifier[] {
  if (Config.randomTheme === "all") return [...THEMES];
  const wantDark = Config.randomTheme === "dark";
  return THEMES.filter((name) => isColorDark(themes[name].bg) === wantDark);
}

/**
 * Dresses the page in the next palette of the rotation, if one is on. Dealing
 * from a shuffled pack rather than drawing at random each time means every
 * palette comes up once before any comes up twice.
 */
export async function randomizeTheme(): Promise<void> {
  if (Config.randomTheme === "off") return;

  if (randomBag.length === 0) {
    randomBag = randomPool();
    shuffle(randomBag);
    // a fresh pack must not open on the palette the last one closed with
    if (randomBag.length > 1 && randomBag.at(-1) === randomTheme) {
      randomBag.unshift(randomBag.pop() as ThemeIdentifier);
    }
  }

  const next = randomBag.pop();
  if (next === undefined) return;

  randomTheme = next;
  await apply(next);
}

/** Forgets the rotation, so the chosen palette is what shows next. */
function clearRandom(): void {
  randomTheme = null;
  randomBag = [];
}

/**
 * The palette that belongs on screen: the rotation's if one is running, else
 * the computer's light or dark one, else the chosen one.
 */
function currentTheme(): ThemeIdentifier {
  if (randomTheme !== null) return randomTheme;
  return Config.autoSwitchTheme ? autoTheme() : Config.theme;
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
      // under "follow the computer" the theme on screen is keybear's light
      // or dark palette, not Config.theme; under a rotation it is neither
      await apply(currentTheme());
    }
  }
}

window
  .matchMedia?.("(prefers-color-scheme: dark)")
  ?.addEventListener?.("change", () => {
    // a rotating test wears its own palette, whatever the computer switches to
    if (!Config.autoSwitchTheme || randomTheme !== null) return;
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

    if (Config.randomTheme !== "off") {
      // the first test of the session already opens in a rotated palette
      await randomizeTheme();
    } else if (Config.autoSwitchTheme) {
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
  if (key === "randomTheme") {
    await clearPreview(false);
    clearRandom();
    if (newValue === "off") {
      await apply(currentTheme());
    } else {
      // show what was just turned on, rather than waiting for the next test
      await randomizeTheme();
    }
  }
});

function autoTheme(): ThemeIdentifier {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "keybear_dark"
    : "keybear_light";
}
