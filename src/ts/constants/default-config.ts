import { Config } from "../schemas/configs";

const obj: Config = {
  theme: "keybear_light",
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
  playSoundOnError: "off",
  playSoundOnClick: "off",
  soundVolume: 0.5,
};

export function getDefaultConfig(): Config {
  return structuredClone(obj);
}
