import { caretIndex, compareWord, inTargetStyle } from "./scoring";

function escape(char: string): string {
  if (char === "<") return "&lt;";
  if (char === ">") return "&gt;";
  if (char === "&") return "&amp;";
  return char;
}

/**
 * The letters of the word being typed, as upstream's `updateWordLetters`
 * would build them, but laid out by keybear's alignment.
 *
 * Upstream draws one letter per typed character and compares it with the
 * target character at the same index. An input method breaks both halves:
 * `e` under `ế` is a letter still being built, not a wrong one, and `cuooc`
 * -- held while the input method waits to see whether it is `coong` -- is
 * five characters for the four letters of `cuộc`, which pushed `c` onto the
 * wrong letter and drew an extra one. Here every letter of the target gets
 * one cell whatever the input looks like, and a letter on its way to its
 * mark is drawn `partial`.
 *
 * The target letter is what shows, never the typed one -- the typist needs
 * to see what to type -- except for extra letters, which have no target.
 * The class names are upstream's, so its styles apply unchanged.
 */
export function wordHtml(
  target: string,
  input: string,
  compositionData: string,
): string {
  const typed = inTargetStyle(target, input);
  const cells = compareWord(target, typed);
  const reached = caretIndex(target, typed);
  const targetChars = [...target];

  let html = "";
  cells.forEach((cell, index) => {
    if (index >= reached) return;
    const char = escape(cell.char);
    if (cell.state === "correct") {
      html += `<letter class="correct">${char}</letter>`;
    } else if (cell.state === "partial") {
      html += `<letter class="correct partial">${char}</letter>`;
    } else if (cell.state === "wrong") {
      html += `<letter class="incorrect">${char}</letter>`;
    } else if (cell.state === "extra") {
      html += `<letter class="incorrect extra">${char}</letter>`;
    }
  });

  // Text an input method is still composing sits where the next letters go,
  // as upstream draws it.
  const composing = [...compositionData];
  composing.forEach((char, i) => {
    const correct = char === targetChars[reached + i] ? "correct" : "";
    const shown = char === " " ? "_" : escape(char);
    html += `<letter class="dead ${correct}">${shown}</letter>`;
  });

  for (let i = reached + composing.length; i < targetChars.length; i++) {
    html += `<letter>${escape(targetChars[i] as string)}</letter>`;
  }

  return html;
}

/**
 * What to hang under the word when `indicateTypos` is `below`: each letter
 * typed wrong, by its index among the letters `wordHtml` draws, with the
 * character typed there. `test-ui` escapes it as it draws the hint.
 *
 * Only a `wrong` letter gets one. A letter still on its way to its mark
 * (`partial`, the `e` of `ế`) is not a typo, and an extra letter already
 * shows what was typed.
 */
export function typoHints(
  target: string,
  input: string,
): { index: number; typed: string }[] {
  const hints: { index: number; typed: string }[] = [];
  compareWord(target, inTargetStyle(target, input)).forEach((cell, index) => {
    if (cell.state === "wrong" && cell.typed !== undefined) {
      hints.push({ index, typed: cell.typed });
    }
  });
  return hints;
}
