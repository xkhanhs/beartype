import { Config } from "../config/store";
import { Caret } from "../elements/caret";
import { qsr } from "../utils/dom";
import * as TestWords from "./test-words";
import { recentSummary } from "../beartype/local-results";
import { pacePosition, paceTargetWpm } from "../beartype/pace";

/**
 * beartype: a second caret running at a share of the usual speed on this
 * browser, to type against. 80% is the accuracy drill and 120% the
 * overtraining one, the two exercises that move a speed that has stopped
 * moving; 100% is the pace already being held.
 *
 * It never touches the input path. It reads the words, walks a clock and
 * moves an element of its own, so a test typed with it on is scored exactly
 * as one typed with it off.
 */
export const paceCaret = new Caret(qsr("#paceCaret"));

let timer: ReturnType<typeof setTimeout> | null = null;
let msPerKey = 0;
let startedAt = 0;

/** Take the pace off the screen and stop its clock. */
export function reset(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  paceCaret.stopAllAnimations();
  paceCaret.clearMargins();
  paceCaret.hide();
}

/**
 * Start the pace for the test about to be typed. It does nothing at all when
 * the setting is off, and nothing when this browser has no test behind it in
 * this language: a pace taken from no measurement is a number made up.
 */
export function start(): void {
  reset();
  const usual = recentSummary(Config.language, null)?.usual ?? null;
  const wpm = paceTargetWpm(usual, Config.paceCaret);
  if (wpm === null) return;

  // a word is five keys, the same unit the speed itself is counted in
  msPerKey = 60000 / (wpm * 5);
  startedAt = performance.now();
  paceCaret.show();
  draw(0);
  schedule();
}

function schedule(): void {
  timer = setTimeout(step, msPerKey);
}

/**
 * Where the pace stands is read off the clock rather than counted in steps,
 * so a late timer costs no distance: a browser that starves this timeout for
 * half a second catches the pace up on the next tick instead of quietly
 * slowing it down.
 */
function step(): void {
  draw(Math.floor((performance.now() - startedAt) / msPerKey));
  schedule();
}

function draw(keys: number): void {
  const words = TestWords.words.get().map((word) => word.display);
  if (words.length === 0) return;
  const { wordIndex, letterIndex } = pacePosition(words, keys);
  paceCaret.goTo({
    wordIndex,
    letterIndex,
    animate: true,
    // it glides the whole way to the next key rather than hopping and
    // waiting, which is what makes it read as a pace and not as a cursor
    animationOptions: { duration: msPerKey, easing: "linear" },
  });
}
