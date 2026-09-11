import { KnownFontName } from "@monkeytype/schemas/fonts";

/**
 * The typing fonts served from `static/webfonts` (their latin letters; the
 * vietnamese subsets and keybear's other fonts live in `beartype.scss`).
 */
export const Fonts: Record<KnownFontName, { fileName: string }> = {
  Roboto_Mono: {
    fileName: "RobotoMono-Regular.woff2",
  },
  IBM_Plex_Mono: {
    fileName: "IBMPlexMono-Regular.woff2",
  },
};
