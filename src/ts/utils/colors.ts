/**
 * Utility functions for color conversions and operations.
 */

/**
 * Converts a hexadecimal color string to its HSL (Hue, Saturation, Lightness) representation.
 * @param hex The hexadecimal color string (e.g., "#ff0000", "#f00", "#ff0000ff", or "#f00f").
 * @returns An object with 'hue', 'sat', 'lgt', 'alpha', and 'string' properties representing the HSL values and an HSL string representation.
 */
function hexToHSL(hex: string): {
  hue: number;
  sat: number;
  lgt: number;
  alpha?: number;
  string: string;
} {
  // Convert hex to RGB first
  let r: number;
  let g: number;
  let b: number;
  let a: number | undefined;

  if (hex.length === 4) {
    // #RGB format
    r = `0x${hex[1]}${hex[1]}` as unknown as number;
    g = `0x${hex[2]}${hex[2]}` as unknown as number;
    b = `0x${hex[3]}${hex[3]}` as unknown as number;
  } else if (hex.length === 5) {
    // #RGBA format
    r = `0x${hex[1]}${hex[1]}` as unknown as number;
    g = `0x${hex[2]}${hex[2]}` as unknown as number;
    b = `0x${hex[3]}${hex[3]}` as unknown as number;
    a = (`0x${hex[4]}${hex[4]}` as unknown as number) / 255;
  } else if (hex.length === 7) {
    // #RRGGBB format
    r = `0x${hex[1]}${hex[2]}` as unknown as number;
    g = `0x${hex[3]}${hex[4]}` as unknown as number;
    b = `0x${hex[5]}${hex[6]}` as unknown as number;
  } else if (hex.length === 9) {
    // #RRGGBBAA format
    r = `0x${hex[1]}${hex[2]}` as unknown as number;
    g = `0x${hex[3]}${hex[4]}` as unknown as number;
    b = `0x${hex[5]}${hex[6]}` as unknown as number;
    a = (`0x${hex[7]}${hex[8]}` as unknown as number) / 255;
  } else {
    r = 0x00;
    g = 0x00;
    b = 0x00;
  }

  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  const result: {
    hue: number;
    sat: number;
    lgt: number;
    alpha?: number;
    string: string;
  } = {
    hue: h,
    sat: s,
    lgt: l,
    string:
      a !== undefined
        ? `hsla(${h}, ${s}%, ${l}%, ${a.toFixed(3)})`
        : `hsl(${h}, ${s}%, ${l}%)`,
  };

  if (a !== undefined) {
    result.alpha = a;
  }

  return result;
}

/**
 * Checks if a color is considered dark based on its hexadecimal representation.
 * @param hex The hexadecimal color string.
 * @returns True if the color is considered dark, false otherwise.
 */
export function isColorDark(hex: string): boolean {
  const hsl = hexToHSL(hex);
  return hsl.lgt < 50;
}
