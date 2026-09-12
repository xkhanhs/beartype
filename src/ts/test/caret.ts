import { Config } from "../config/store";
import { getCurrentInput } from "./events/data";
import { getActiveWordIndex } from "../states/test";
import { configEvent } from "../events/config";
import { Caret } from "../elements/caret";
import * as CompositionState from "../legacy-states/composition";
import { qsr } from "../utils/dom";
import * as TestWords from "./test-words";
import { caretIndex, inTargetStyle } from "../beartype/scoring";

export function stopAnimation(): void {
  caret.stopBlinking();
}

export function startAnimation(): void {
  caret.startBlinking();
}

export function hide(): void {
  caret.hide();
}

export function resetPosition(): void {
  caret.stopAllAnimations();
  caret.clearMargins();
  caret.goTo({
    wordIndex: 0,
    letterIndex: 0,
    animate: false,
  });
}

export function updatePosition(noAnim = false): void {
  // beartype: the caret stands after the last letter a key reached, the way
  // the word is drawn (beartype/word-html.ts). Counting typed characters sends
  // it forward and back while an input method rewrites a letter: `thaa` is
  // four characters for the three letters of `thầ`.
  const target = TestWords.words.getCurrent()?.display ?? "";
  const input = getCurrentInput();
  caret.goTo({
    wordIndex: getActiveWordIndex(),
    letterIndex:
      caretIndex(target, inTargetStyle(target, input)) +
      CompositionState.getData().length,
    animate: Config.smoothCaret !== "off" && !noAnim,
  });
}

export const caret = new Caret(qsr("#caret"));

configEvent.subscribe(({ key }) => {
  if (key === "smoothCaret") {
    caret.updateBlinkingAnimation();
  }
});

export function show(noAnim = false): void {
  caret.show();
  updatePosition(noAnim);
  startAnimation();
}
