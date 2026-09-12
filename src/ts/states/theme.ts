import { createSignal } from "solid-js";
import { Theme } from "../constants/themes";
import { ThemeName } from "../schemas/configs";

export type ThemeIdentifier = ThemeName;
const defaultTheme: Theme & { name: ThemeIdentifier } = {
  name: "keybear_light",
  bg: "#f4f0f0",
  caret: "#3d475c",
  main: "#3d475c",
  sub: "#7a7786",
  subAlt: "#e9e1e1",
  text: "#282640",
  error: "#ff3333",
  errorExtra: "#ff0000",
  colorfulError: "#ff3333",
  colorfulErrorExtra: "#ff0000",
};

export const [getTheme, setTheme] = createSignal(defaultTheme);
