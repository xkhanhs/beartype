import { ElementWithUtils } from "../utils/dom";

// beartype: typedEffect is pinned to "keep", so the joining-script line break
// this module used to apply for the "dots" effect can never trigger. The
// reset stays, since it just clears classes applyIfNeeded used to add.
function reset(wordEl: ElementWithUtils): void {
  if (!wordEl.hasClass("broken-joining")) return;
  wordEl.removeClass("broken-joining");
  wordEl.removeClass("needs-wrap");
  wordEl.setStyle({ width: "" });
}

export function set(wordEl: ElementWithUtils, joiningBroken: boolean): void {
  if (joiningBroken) return;
  reset(wordEl);
}

export function update(_key: string, wordsEl: ElementWithUtils): void {
  const words = wordsEl.qsa(".word.typed");
  words.forEach(reset);
}
