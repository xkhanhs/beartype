/**
 * Converts a value in rem units to pixels based on the root element's font size.
 * https://stackoverflow.com/questions/36532307/rem-px-in-javascript
 * @param rem The value in rem units to convert to pixels.
 * @returns The equivalent value in pixels.
 */
export function convertRemToPixels(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

/**
 * Abbreviates a large number with a suffix (k, m, b, etc.) representing its order of magnitude.
 * @param num The number to abbreviate.
 * @param decimalPoints The number of decimal points to include in the result. Default is 1.
 * @returns The abbreviated number as a string with the appropriate suffix.
 */
export function abbreviateNumber(num: number, decimalPoints = 1): string {
  if (num < 1000) {
    return num.toFixed(decimalPoints);
  }

  const exp = Math.floor(Math.log(num) / Math.log(1000));
  const pre = "kmbtqQsSond".charAt(exp - 1);
  return (num / Math.pow(1000, exp)).toFixed(decimalPoints) + pre;
}

/**
 * Parses a string into an integer if it is not null or undefined, otherwise returns undefined.
 *
 * @param  The string to parse or null or undefined.
 * @param radix A value between 2 and 36 that specifies the base of the number in `string`.
 * @returns  A number if a string is provided, otherwise undefined.
 */
export function parseIntOptional<T extends string | null | undefined>(
  value: T,
  radix: number = 10,
): T extends string ? number : undefined {
  return (
    value !== null && value !== undefined ? parseInt(value, radix) : undefined
  ) as T extends string ? number : undefined;
}

export function calculateWpm(
  charCount: number,
  durationSeconds: number,
): number {
  if (durationSeconds <= 0) return 0;
  return charCount / 5 / (durationSeconds / 60);
}
