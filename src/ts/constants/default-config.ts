import { Config } from "../schemas/configs";

const obj: Config = {
  // keybear's palettes, following the computer's light or dark setting
  theme: "keybear_light",
  autoSwitchTheme: true,
  randomTheme: "off",
  // the caret this app was measured against on monkeytype.com
  smoothCaret: "slow",
  words: 50,
  time: 30,
  mode: "time",
  language: "vietnamese",
  fontSize: 2,
  indicateTypos: "off",
  keymapMode: "off",
};

export function getDefaultConfig(): Config {
  return structuredClone(obj);
}
