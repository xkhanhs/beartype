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

//pin implementations
const random = Math.random;
const ceil = Math.ceil;
const floor = Math.floor;

/**
 * Rounds a number to one decimal places.
 * @param num The number to round.
 * @returns The input number rounded to one decimal places.
 */
export function roundTo1(num: number): number {
  return Math.round((num + Number.EPSILON) * 10) / 10;
}

/**
 * Rounds a number to two decimal places.
 * @param num The number to round.
 * @returns The input number rounded to two decimal places.
 */
export function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates the mean (average) of an array of numbers.
 * @param array An array of numbers.
 * @returns The mean of the input array.
 */
export function mean(array: number[]): number {
  try {
    return (
      array.reduce((previous, current) => (current += previous)) / array.length
    );
  } catch (e) {
    return 0;
  }
}

/**
 * Calculates the standard deviation of an array of numbers.
 * @param array An array of numbers.
 * @returns The standard deviation of the input array.
 */
export function stdDev(array: number[]): number {
  try {
    const n = array.length;
    const meanValue = mean(array);
    return Math.sqrt(
      array.map((x) => Math.pow(x - meanValue, 2)).reduce((a, b) => a + b) / n,
    );
  } catch (e) {
    return 0;
  }
}

/**
 * Calculates the median of an array of numbers.
 * https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-88.php
 * @param arr An array of numbers.
 * @returns The median of the input array.
 */
export function median(arr: number[]): number {
  try {
    const mid = Math.floor(arr.length / 2),
      nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0
      ? (nums[mid] as number)
      : ((nums[mid - 1] as number) + (nums[mid] as number)) / 2;
  } catch (e) {
    return 0;
  }
}

/**
 * Calculates consistency by mapping COV from [0, +infinity) to [100, 0).
 * The mapping function is a version of the sigmoid function tanh(x) that is closer to the identity function tanh(arctanh(x)) in [0, 1).
 * @param cov The coefficient of variation of an array of numbers (standard deviation / mean).
 * @returns Consistency
 */
export function kogasa(cov: number): number {
  return (
    100 * (1 - Math.tanh(cov + Math.pow(cov, 3) / 3 + Math.pow(cov, 5) / 5))
  );
}

/**
 * Gets an integer between min and max, both are inclusive.
 * @param min
 * @param max
 * @returns Random integer betwen min and max.
 */
export function randomIntFromRange(min: number, max: number): number {
  const minNorm = ceil(min);
  const maxNorm = floor(max);
  return floor(random() * (maxNorm - minNorm + 1) + minNorm);
}

/**
 * Maps a value from one range to another.
 * @param value The value to map.
 * @param inMin Input range minimum.
 * @param inMax Input range maximum.
 * @param outMin Output range minimum.
 * @param outMax Output range maximum.
 * @param clamp If true, the result is clamped to the output range. Default true.
 * @returns The mapped value.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clamp = true,
): number {
  if (inMin === inMax) {
    return outMin;
  }

  const result =
    ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

  if (clamp) {
    if (outMin < outMax) {
      return Math.min(Math.max(result, outMin), outMax);
    } else {
      return Math.max(Math.min(result, outMin), outMax);
    }
  }

  return result;
}

/**
 * Checks if a value is a safe number. Safe numbers are finite and not NaN.
 * @param value The value to check.
 * @returns True if the value is a safe number, false otherwise.
 */
export function isSafeNumber(value: unknown): value is number {
  if (typeof value === "number") {
    return !isNaN(value) && isFinite(value);
  }
  return false;
}

/**
 * Converts a number to a safe number or undefined. NaN, Infinity, and -Infinity are converted to undefined.
 * @param value The value to convert.
 * @returns The input number if it is safe, undefined otherwise.
 */
export function safeNumber(
  value: number | undefined | null,
): number | undefined {
  if (isSafeNumber(value)) {
    return value;
  }
  return undefined;
}
