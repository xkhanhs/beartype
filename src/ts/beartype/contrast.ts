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
 */

/** WCAG relative luminance of a `#rgb` or `#rrggbb` colour. */
function luminance(hex: string): number {
  let digits = hex.replace("#", "");
  if (digits.length === 3) {
    digits = [...digits].map((d) => d + d).join("");
  }
  const channels = [0, 2, 4].map((i) => {
    const value = parseInt(digits.slice(i, i + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (
    0.2126 * (channels[0] as number) +
    0.7152 * (channels[1] as number) +
    0.0722 * (channels[2] as number)
  );
}

/** WCAG contrast between two colours, from 1 (same) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** What WCAG asks of text this size: the pills are 1rem and bold. */
export const MIN_CONTRAST = 4.5;

/**
 * The lettering for a fill of `main`. The page colour comes first, as keybear
 * writes it, then the palette's text colour; black or white is the last resort,
 * for an accent neither of them can be read on. That resort keeps the
 * palette's own direction -- a palette that writes pale on dark stays pale --
 * so a dark label never lands on a dark accent while a legible pale one exists.
 */
export function textOnAccent(main: string, bg: string, text: string): string {
  if (contrastRatio(bg, main) >= MIN_CONTRAST) return bg;
  if (contrastRatio(text, main) >= MIN_CONTRAST) return text;

  const palePalette = luminance(text) > luminance(bg);
  const inKeeping = palePalette ? "#ffffff" : "#000000";
  const against = palePalette ? "#000000" : "#ffffff";
  return contrastRatio(inKeeping, main) >= MIN_CONTRAST ? inKeeping : against;
}
