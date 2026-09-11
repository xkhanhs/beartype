import { z } from "zod";
import { customEnumErrorHandler } from "./util";

export const ThemeNameSchema = z.enum(
  [
    // beartype: keybear's palettes, see frontend/src/ts/constants/themes.ts
    "keybear_light",
    "keybear_dark",
    "keybear_princess",
    "keybear_ocean",
    "keybear_forest",
    "keybear_racing",
    "keybear_dracula",
    "keybear_pixel",
    "keybear_hero",
  ],
  {
    errorMap: customEnumErrorHandler("Must be a known theme"),
  },
);
