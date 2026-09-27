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

/** A colour in OKLab: lightness, then the two axes its hue and chroma sit on. */
function oklab(hex: string): [number, number, number] {
  let digits = hex.replace("#", "");
  if (digits.length === 3) {
    digits = [...digits].map((d) => d + d).join("");
  }
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(digits.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/**
 * Below this OKLab chroma a colour reads as a grey, and a grey has no hue to
 * be mistaken for red.
 */
const GREY_CHROMA = 0.04;

/**
 * How far apart two hues must be, in degrees, before a letter in one is not
 * taken for a letter in the other. The accents that fall inside are the reds,
 * pinks, oranges and peaches: bushido and modern ink sit on their own red,
 * carbon and vesper light at 20 to 25 degrees, vesper's peach at 39. Gruvbox's
 * mustard, at 47, is the nearest that stays.
 */
const MIN_HUE_APART = 45;

/** Whether `a` and `b` share a hue closely enough to be taken for each other. */
export function sameHue(a: string, b: string): boolean {
  const [, a1, a2] = oklab(a);
  const [, b1, b2] = oklab(b);
  if (Math.hypot(a1, a2) < GREY_CHROMA || Math.hypot(b1, b2) < GREY_CHROMA) {
    return false;
  }
  let apart =
    Math.abs(Math.atan2(a2, a1) - Math.atan2(b2, b1)) * (180 / Math.PI);
  if (apart > 180) apart = 360 - apart;
  return apart < MIN_HUE_APART;
}

/**
 * What APCA asks of large text, which the words are: below it the letters
 * already typed would grey out against the page.
 */
export const MIN_TYPED_READABILITY = 45;

/**
 * The colour of a letter typed right. The accent, so the words already typed
 * carry the palette, as monkeytype's colourful mode has it -- unless the
 * accent is a red, where a right letter would look like a wrong one, or too
 * faint on the page to read (serika's yellow, midnight's blue-grey, which
 * that palette lifted its text away from). There they keep the text colour.
 */
export function typedLetterColor(
  main: string,
  bg: string,
  error: string,
  text: string,
): string {
  if (sameHue(main, error)) return text;
  if (readability(main, bg) < MIN_TYPED_READABILITY) return text;
  return main;
}
