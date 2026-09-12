/**
 * beartype: what to write on a fill of the accent colour.
 *
 * The pills that are picked -- the options above the words, the drill button --
 * are filled with `--main-color` and lettered with `--kb-on-accent`. Taking the
 * page colour for that, as keybear does, only reads well while the accent is
 * far from the page: on monkeytype's carbon or vscode the two sit close enough
 * that the label greys out. So the colour is measured here instead, per
 * palette, and the palette's own colours are kept whenever one of them is
 * legible.
 *
 * The measure is APCA (the perceptual contrast of the WCAG 3 draft), not the
 * WCAG 2 ratio. The ratio divides two luminances and so reads a pale label and
 * a dark one on the same accent as equally good; the eye does not. On a
 * saturated mid-tone -- the reds and oranges of bushido, 8008, modern ink -- a
 * white label is plainly easier to read than a black one, and the ratio scores
 * it far worse. APCA models the two directions apart, so it agrees with what
 * the page actually looks like.
 */

/** The screen luminance APCA works from: sRGB with its own clamp near black. */
function screenLuminance(hex: string): number {
  let digits = hex.replace("#", "");
  if (digits.length === 3) {
    digits = [...digits].map((d) => d + d).join("");
  }
  const channels = [0, 2, 4].map(
    (i) => (parseInt(digits.slice(i, i + 2), 16) / 255) ** 2.4,
  );
  const y =
    0.2126729 * (channels[0] as number) +
    0.7151522 * (channels[1] as number) +
    0.072175 * (channels[2] as number);
  // dark colours are lifted a little: the screen never reaches true black
  return y < 0.022 ? y + (0.022 - y) ** 1.414 : y;
}

/**
 * How readable `text` is on `bg`, on APCA's Lc scale: 0 where the two cannot
 * be told apart, around 100 for black on white. APCA signs the number by
 * direction; the sign carries nothing here, so it comes back positive.
 */
export function readability(text: string, bg: string): number {
  const ink = screenLuminance(text);
  const paper = screenLuminance(bg);
  if (paper > ink) {
    // dark ink on pale paper
    const sapc = (paper ** 0.56 - ink ** 0.57) * 1.14;
    return sapc < 0.1 ? 0 : (sapc - 0.027) * 100;
  }
  // pale ink on dark paper, which the eye reads on its own curve
  const sapc = (paper ** 0.65 - ink ** 0.62) * 1.14;
  return sapc > -0.1 ? 0 : -(sapc + 0.027) * 100;
}

/**
 * What APCA asks of the pills: they are 1rem and bold, which sits at the top
 * of the band where Lc 60 is enough.
 */
export const MIN_READABILITY = 60;

/**
 * The lettering for a fill of `main`. The page colour comes first, as keybear
 * writes it, then the palette's text colour, so a palette keeps its own
 * colours wherever they can be read. Only when neither can does black or white
 * come in -- and then the most readable of the four wins outright, so the
 * fallback is never a step down from the palette colour it replaces.
 */
export function textOnAccent(main: string, bg: string, text: string): string {
  if (readability(bg, main) >= MIN_READABILITY) return bg;
  if (readability(text, main) >= MIN_READABILITY) return text;

  return [bg, text, "#ffffff", "#000000"].reduce((best, candidate) =>
    readability(candidate, main) > readability(best, main) ? candidate : best,
  );
}
