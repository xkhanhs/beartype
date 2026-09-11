import { Config, CustomThemeColors } from "@monkeytype/schemas/configs";

const obj: Config = {
  theme: "serika_dark",
  themeLight: "serika",
  themeDark: "serika_dark",
  autoSwitchTheme: false,
  customTheme: false,
  customThemeColors: [
    "#323437",
    "#e2b714",
    "#e2b714",
    "#646669",
    "#2c2e31",
    "#d1d0c5",
    "#ca4754",
    "#7e2a33",
    "#ca4754",
    "#7e2a33",
  ] as CustomThemeColors,
  favThemes: [],
  smoothCaret: "medium",
  words: 50,
  time: 30,
  mode: "time",
  language: "english",
  fontSize: 2,
  indicateTypos: "off",
  randomTheme: "off",
  keymapMode: "off",
  fontFamily: "Roboto_Mono",
  capsLockWarning: true,
  playSoundOnError: "off",
  playSoundOnClick: "off",
  soundVolume: 0.5,
  showOutOfFocusWarning: true,
  ads: "result",
  monkey: false,
  resultSaving: true,
  customBackground: "",
  customBackgroundSize: "cover",
  customBackgroundFilter: [0, 1, 1, 1],
  monkeyPowerLevel: "off",
  playTimeWarning: "off",
};

export function getDefaultConfig(): Config {
  return structuredClone(obj);
}
