/**
 * Converts a value in rem units to pixels based on the root element's font size.
 * https://stackoverflow.com/questions/36532307/rem-px-in-javascript
 * @param rem The value in rem units to convert to pixels.
 * @returns The equivalent value in pixels.
 */
export function convertRemToPixels(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
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
