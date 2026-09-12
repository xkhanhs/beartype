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
    // beartype: monkeytype dark palettes, colours copied from its
    // frontend/src/ts/constants/themes.ts (none of them needs a css file)
    "serika_dark",
    "carbon",
    "bento",
    "nord",
    "olivia",
    "rose_pine",
    "terminal",
    "matrix",
    "monokai",
    "gruvbox_dark",
    "vscode",
    "iceberg_dark",
    "sonokai",
    "midnight",
    "vesper",
    "modern_dolch",
    "nautilus",
    "alduin",
  ],
  {
    errorMap: customEnumErrorHandler("Must be a known theme"),
  },
);
