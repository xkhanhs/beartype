import { Config } from "../../config/store";
import { type CommitCharacterType } from "./util";
import { isWrongKey } from "../../beartype/scoring";
import { isSpace } from "../../utils/strings";

/**
 * Check if the input data is correct
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value (use getCurrentInput(), not input element value)
 * @param options.targetWord - Target word
 * @param options.correctShiftUsed - Whether the correct shift state was used. Null means disabled
 */
export function isCharCorrect(options: {
  data: string;
  inputValue: string;
  targetWord: string;
  correctShiftUsed: boolean | null; //null means disabled
}): boolean {
  const { data, inputValue, targetWord, correctShiftUsed } = options;

  if (Config.mode === "zen") return true;
  if (correctShiftUsed === false) return false;

  // beartype: a letter is wrong when it makes a new mistake in the word.
  // Upstream compares the character at the same index, which calls `e` wrong
  // where `ế` stands -- but an input method builds `ế` out of exactly that
  // `e`, so it is unfinished, not wrong. Spaces keep upstream's rule, so a
  // word cut short still shows up as an error.
  if (!isSpace(data) && data !== "\n") {
    const target = targetWord.replace(/[ \n]$/, "");
    return !isWrongKey(target, inputValue, inputValue + data);
  }

  const targetChar = targetWord[inputValue.length];

  if (targetChar === undefined) {
    return false;
  }

  return data === targetChar;
}

/**
 * Check if the input data should move to the next word
 * @param options - Options object
 * @param options.data - Input data
 * @param options.inputValue - Current input value
 * @param options.targetWord - Target word
 * @param options.commitCharacterType - Type of the commit character, false if not a commit character
 * @returns Whether to move to the next word
 */
export function shouldGoToNextWord(options: {
  data: string;
  inputValue: string;
  targetWord: string;
  commitCharacterType: CommitCharacterType | false;
}): boolean {
  const {
    inputValue,
    targetWord,
    data,
    commitCharacterType: commitType,
  } = options;

  if (commitType === false) return false;

  if (Config.mode === "zen") return true;

  //strict space: a leading separator on empty input must not skip the word.
  //nospace commits (final letter of a 1-letter word) are legitimate here.
  if (
    inputValue.length === 0 &&
    commitType === "separator" &&
    (Config.strictSpace || Config.difficulty !== "normal")
  ) {
    return false;
  }

  const correct = inputValue + data === targetWord;

  //stop on error
  if (Config.stopOnError === "word" && !correct) {
    return false;
  }

  if (Config.stopOnError === "letter" && !correct) {
    return false;
  }

  //delete on error
  if (Config.deleteOnError !== "off" && !correct) {
    return false;
  }

  return true;
}
