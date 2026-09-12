import { Config } from "../schemas/configs";

const obj: Config = {
  // a new palette every test, from the pale ones or the dark ones as the
  // computer is set; whoever picks a colour by hand turns the rotation off and
  // falls back to these two
  randomTheme: "auto",
  theme: "keybear_light",
  autoSwitchTheme: true,
  // the caret this app was measured against on monkeytype.com
  smoothCaret: "slow",
  words: 50,
  time: 30,
  mode: "time",
  language: "vietnamese",
  // what the page has always spoken; a first visit overrides both this and
  // the word list above from the browser's own preference, in
  // beartype/config-lock.ts
  uiLanguage: "vi",
  fontSize: 2,
  indicateTypos: "off",
  keymapMode: "off",
};

export function getDefaultConfig(): Config {
  return structuredClone(obj);
}
