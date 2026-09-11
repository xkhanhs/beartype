import { Config } from "@monkeytype/schemas/configs";

const obj: Config = {
  theme: "keybear_light",
  themeLight: "keybear_light",
  themeDark: "keybear_dark",
  autoSwitchTheme: false,
  smoothCaret: "medium",
  words: 50,
  time: 30,
  mode: "time",
  language: "english",
  fontSize: 2,
  indicateTypos: "off",
  keymapMode: "off",
  fontFamily: "Roboto_Mono",
  capsLockWarning: true,
  playSoundOnError: "off",
  playSoundOnClick: "off",
  soundVolume: 0.5,
  showOutOfFocusWarning: true,
  resultSaving: true,
};

export function getDefaultConfig(): Config {
  return structuredClone(obj);
}
