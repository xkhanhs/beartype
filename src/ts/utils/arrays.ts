import { randomIntFromRange } from "./numbers";

/**
 * Shuffle an array of elements using the Fisher–Yates algorithm.
 * This function mutates the input array.
 * @param elements
 */
export function shuffle(elements: unknown[]): void {
  for (let i = elements.length - 1; i > 0; --i) {
    const j = randomIntFromRange(0, i);
    const temp = elements[j];
    elements[j] = elements[i];
    elements[i] = temp;
  }
}

/**
 * Returns a random element from an array.
 * @param array The input array.
 * @returns A random element from the array.
 */
export function randomElementFromArray<T>(array: T[]): T {
  return array[randomIntFromRange(0, array.length - 1)] as T;
}

/**
 * Returns the element at the specified index from an array.
 * Negative index values count from the end of the array.
 * @param array The input array.
 * @param index The index of the element to return.
 * @returns The element at the specified index, or undefined if the index is out of bounds.
 */
export function nthElementFromArray<T>(
  array: T[],
  index: number,
): T | undefined {
  index = index < 0 ? array.length + index : index;
  return array[index];
}
