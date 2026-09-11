import { Language } from "../schemas/languages";

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

/**
 * Detect if a word contains RTL (Right-to-Left) characters.
 * This is for test scenarios where individual words may have different directions.
 * Uses a simple regex pattern that covers all common RTL scripts.
 * @param word the word to check for RTL characters
 * @returns true if the word contains RTL characters, false otherwise
 */
function hasRTLCharacters(word: string): [boolean, number] {
  if (!word || word.length === 0) {
    return [false, 0];
  }

  // This covers Arabic, Farsi, Urdu, and other RTL scripts
  const rtlPattern =
    /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/;

  const result = rtlPattern.exec(word);
  return [result !== null, result?.[0].length ?? 0];
}

/**
 * Cache for word direction to avoid repeated calculations per word
 * Keyed by the stripped core of the word; can be manually cleared when needed
 */
let wordDirectionCache: Map<string, [boolean, number]> = new Map();

export function clearWordDirectionCache(): void {
  wordDirectionCache.clear();
}

export function isWordRightToLeft(
  word: string | undefined,
  languageRTL: boolean,
  reverseDirection?: boolean,
): [boolean, boolean] {
  if (word === undefined || word.length === 0) {
    return reverseDirection ? [!languageRTL, false] : [languageRTL, false];
  }

  // Strip leading/trailing punctuation and whitespace so attached opposite-direction
  // punctuation like "word؟" or "،word" doesn't flip the direction detection
  // and if only punctuation/symbols/whitespace, use main language direction
  const core = word.replace(/^[\p{P}\p{S}\s]+|[\p{P}\p{S}\s]+$/gu, "");
  if (core.length === 0) {
    return reverseDirection ? [!languageRTL, false] : [languageRTL, false];
  }

  // cache by core to handle variants like "word" vs "word؟"
  const cached = wordDirectionCache.get(core);
  if (cached !== undefined) {
    return reverseDirection
      ? [!cached[0], false]
      : [cached[0], cached[1] === word.length];
  }

  const result = hasRTLCharacters(core);
  wordDirectionCache.set(core, result);

  return reverseDirection
    ? [!result[0], false]
    : [result[0], result[1] === word.length];
}

const CHAR_EQUIVALENCE_SETS = [
  new Set(["’", "‘", "'", "ʼ", "׳", "ʻ", "᾽", "᾽"]),
  new Set([`"`, "”", "“", "„"]),
  new Set(["–", "—", "-", "‐", "‑"]),
  new Set([",", "‚"]),
];

// beartype: only vietnamese and english are selectable, and neither needs a
// language-specific equivalence set (upstream had one for russian).
const LANGUAGE_EQUIVALENCE_SETS: Partial<Record<Language, Set<string>>> = {};

/**
 * Checks if two characters are visually/typographically equivalent for typing purposes.
 * This allows users to type different variants of the same character and still be considered correct.
 * @param char1 The first character to compare
 * @param char2 The second character to compare
 * @param language Optional language context to check for language-specific equivalences
 * @returns true if the characters are equivalent, false otherwise
 */
export function areCharactersVisuallyEqual(
  char1: string,
  char2: string,
  language?: Language,
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

  if (language !== undefined) {
    const langMap =
      LANGUAGE_EQUIVALENCE_SETS[removeLanguageSize(language) as Language];
    if (langMap !== undefined) {
      if (langMap.has(char1) && langMap.has(char2)) {
        return true;
      }
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

export function replaceUnderscoresWithSpaces(text: string): string {
  return text.replace(/_/g, " ");
}

export type CharCounts = {
  allCorrect: number;
  correctWord: number;
  incorrect: number;
  extra: number;
  missed: number;
};

export function countChars(
  inputWord: string,
  targetWord: string,
  creditPartial: boolean,
): CharCounts {
  let allCorrect = 0;
  let correctWord = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  const wordCorrect = inputWord === targetWord;
  const wordPartiallyCorrect = targetWord.startsWith(inputWord);

  for (let i = 0; i < Math.max(inputWord.length, targetWord.length); i++) {
    const inputChar = inputWord[i];
    const targetChar = targetWord[i];

    if (inputChar === targetChar) {
      if (targetChar === " " && !wordCorrect) {
        extra += 1;
      } else {
        allCorrect += 1;
      }
      if (wordCorrect || (creditPartial && wordPartiallyCorrect)) {
        correctWord += 1;
      }
    } else if (inputChar === undefined) {
      //missed char
      if (!creditPartial) {
        missed += 1;
      }
    } else if (
      targetChar === undefined ||
      (targetChar === " " && inputChar !== " " && !inputWord.includes(" "))
    ) {
      //extra char (past target, or typed in place of word-ending space)
      extra += 1;
    } else {
      //incorrect char
      incorrect += 1;
    }
  }

  return {
    allCorrect,
    correctWord,
    incorrect,
    extra,
    missed,
  };
}

// Export testing utilities for unit tests
export const __testing = {
  hasRTLCharacters,
};
