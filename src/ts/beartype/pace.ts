import type { Config } from "../schemas/configs";
import { telexKeysOf } from "./telex-keys";

/**
 * The pace to type against, and where it has got to.
 *
 * Both are counted in **keys**, because that is what this app's speed is
 * counted in (`events/stats.ts`): `ế` costs three keys and one letter, so a
 * pace walked in letters would run a Vietnamese word out at nearly three
 * times the speed it claims. The caret is drawn at a letter all the same,
 * which is what `pacePosition` converts between.
 */

/** Where the pace caret stands: a word of the test, and a letter of it. */
export type PacePosition = { wordIndex: number; letterIndex: number };

/**
 * The speed to run at, from the usual speed on this browser in the language
 * being typed. `null` when there is nothing to run at: the setting is off, or
 * this browser has no test behind it yet to take a usual speed from.
 */
export function paceTargetWpm(
  usual: number | null,
  setting: Config["paceCaret"],
): number | null {
  if (setting === "off" || usual === null || usual <= 0) return null;
  return (usual * Number(setting)) / 100;
}

/** The keys a word costs, marks included. */
export function keyCost(word: string): number {
  let keys = 0;
  for (const letter of word) keys += telexKeysOf(letter).length;
  return keys;
}

/**
 * Where `keys` keystrokes into the test lands, given the words as they are
 * drawn. A word is followed by a space, which is a keystroke of its own.
 *
 * Past the last word generated so far it stops at the end of it rather than
 * running off the board: in a timed test the words after the ones on screen
 * do not exist until they are typed towards, and the caller keeps counting,
 * so the pace catches up by itself once they do.
 */
export function pacePosition(
  words: readonly string[],
  keys: number,
): PacePosition {
  let left = Math.max(0, keys);
  for (let index = 0; index < words.length; index++) {
    const letters = [...(words[index] ?? "")];
    let used = 0;
    for (let letter = 0; letter < letters.length; letter++) {
      const cost = telexKeysOf(letters[letter] as string).length;
      if (left < used + cost) return { wordIndex: index, letterIndex: letter };
      used += cost;
    }
    const last = index === words.length - 1;
    if (left === used || last) {
      return { wordIndex: index, letterIndex: letters.length };
    }
    // the space that commits the word is a keystroke too
    left -= used + 1;
  }
  return { wordIndex: 0, letterIndex: 0 };
}
