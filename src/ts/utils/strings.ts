/**
 * Returns a display string for the given language, optionally removing the size indicator.
 * @param language The language string.
 * @param noSizeString Whether to remove the size indicator from the language string. Default is false.
 * @returns A display string for the language.
 */
export function getLanguageDisplayString(
  language: string,
  noSizeString = false,
): string {
  let out = "";
  if (noSizeString) {
    out = removeLanguageSize(language);
  } else {
    out = language;
  }
  return replaceUnderscoresWithSpaces(out);
}

/**
 * Removes the size indicator from a language string. This works on any
 * string, not just beartype's two selectable languages, so tests can still
 * exercise it with upstream's larger set of language names.
 * @param language The language string.
 * @returns The language string with the size indicator removed.
 */
export function removeLanguageSize(language: string): string {
  return language.replace(/_\d*k$/g, "");
}

/**
 * Split a string into characters. This supports multi-byte characters outside of the [Basic Multilinugal Plane](https://en.wikipedia.org/wiki/Plane_(Unicode).
 * Using  `string.length` and `string[index]` does not work.
 * @param s string to be tokenized into characters
 * @returns array of characters
 */
export function splitIntoCharacters(s: string): string[] {
  const result: string[] = [];
  for (const t of s) {
    result.push(t);
  }

  return result;
}

const CHAR_EQUIVALENCE_SETS = [
  new Set(["’", "‘", "'", "ʼ", "׳", "ʻ", "᾽", "᾽"]),
  new Set([`"`, "”", "“", "„"]),
  new Set(["–", "—", "-", "‐", "‑"]),
  new Set([",", "‚"]),
];

/**
 * Checks if two characters are visually/typographically equivalent for typing purposes.
 * This allows users to type different variants of the same character and still be considered correct.
 * @param char1 The first character to compare
 * @param char2 The second character to compare
 * @returns true if the characters are equivalent, false otherwise
 */
export function areCharactersVisuallyEqual(
  char1: string,
  char2: string,
): boolean {
  // If characters are exactly the same, they're equivalent
  if (char1 === char2) {
    return true;
  }

  // Treat any Unicode space as equivalent to the regular U+0020 separator.
  // This lets IME-produced spaces (e.g. U+3000) match stored word separators.
  // The U+0020 guard short-circuits the common non-space case before calling isSpace.
  if ((char1 === " " || char2 === " ") && isSpace(char1) && isSpace(char2)) {
    return true;
  }

  // Check each equivalence map
  for (const map of CHAR_EQUIVALENCE_SETS) {
    if (map.has(char1) && map.has(char2)) {
      return true;
    }
  }

  return false;
}

// hoisted to module scope so isSpace doesn't allocate a Set on every call
// (it runs per keystroke via areCharactersVisuallyEqual)
const SPACE_CODE_POINTS = new Set([
  0x0020, // Regular space (spacebar)
  0x2002, // En space (Option+Space on Mac)
  0x2003, // Em space (Option+Shift+Space on Mac)
  0x2009, // Thin space (various input methods)
  0x3000, // Ideographic space (CJK input methods)
  0x00a0, // Non-breaking space (Alt+0160 on Windows, Option+Space on Mac)
  0x1680, // Ogham space mark (rare, but included for completeness)
  0x202f, // Narrow no-break space (various input methods)
  0xfeff, // Zero width no-break space (various input methods)
  0x2007, // Figure space (various input methods)
  0x2008, // Punctuation space (various input methods)
  0x2004, // Three-per-em space (various input methods)
  0x200a, // Hair space (various input methods)
  0x200b, // Zero width space (various input methods)
]);

/**
 * Checks if a character is a directly typable space character on a standard keyboard.
 * These are space characters that can be typed without special input methods or copy-pasting.
 * @param char The character to check.
 * @returns True if the character is a directly typable space, false otherwise.
 */
export function isSpace(char: string): boolean {
  if (char.length !== 1) return false;

  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) return false;

  return SPACE_CODE_POINTS.has(codePoint);
}

function replaceUnderscoresWithSpaces(text: string): string {
  return text.replace(/_/g, " ");
}

export type CharCounts = {
  allCorrect: number;
  correctWord: number;
  incorrect: number;
  extra: number;
  missed: number;
};
