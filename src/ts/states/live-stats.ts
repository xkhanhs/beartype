import { createMemo } from "solid-js";

import { getConfig } from "../config/store";
import * as CustomText from "../test/custom-text";
import * as TestWords from "../test/test-words";
import { secondsToString } from "../utils/date-and-time";
import {
  currentLiveStats,
  getActiveWordIndex,
  getFocus,
  isTestActive,
} from "./test";

/** Whether this test counts down a time limit rather than a number of words. */
function isTimeLimitedTest(): boolean {
  return (
    getConfig.mode === "time" ||
    (getConfig.mode === "custom" && CustomText.getLimitMode() === "time")
  );
}

/** Seconds the test counts down from. Only meaningful when {@link isTimeLimitedTest}. */
function getTestTimeLimit(): number {
  return getConfig.mode === "custom"
    ? CustomText.getLimitValue()
    : getConfig.time;
}

/**
 * Words completed so far. Derived from the activeWordIndex signal, so it must be
 * read inside a computation — never snapshotted into the store, since the input
 * handlers advance the index *after* the live stat updates run.
 */
function getCurrentWordCount(): number {
  if (getConfig.mode === "custom" && CustomText.getLimitMode() === "section") {
    const sectionIndex =
      TestWords.words.get(getActiveWordIndex())?.sectionIndex;
    return sectionIndex === undefined ? 0 : sectionIndex - 1;
  }
  return getActiveWordIndex();
}

function getWordsTotal(): number {
  if (getConfig.mode === "words") return getConfig.words;
  if (getConfig.mode === "custom") return CustomText.getLimitValue();
  return TestWords.words.length;
}

export const showLiveStats = createMemo(() => isTestActive() && getFocus());

/** Countdown / word counter shown by the timer displays. */
export const getTimerText = createMemo(() => {
  if (isTimeLimitedTest()) {
    const limit = getTestTimeLimit();
    const seconds = currentLiveStats.seconds ?? 0;
    return secondsToString(limit === 0 ? seconds : limit - seconds);
  }
  // read the signal first so the memo subscribes to it on every branch below
  const wordCount = getCurrentWordCount();
  const wordsTotal = getWordsTotal();
  if (wordsTotal === 0) {
    return `${getActiveWordIndex()}`;
  }
  return `${wordCount}/${wordsTotal}`;
});
/**
 * The flash timer styles only reveal the time every 15 seconds; beartype only
 * offers the plain mini timer, so the flash gate never hides it.
 */
export const isTimerFlashHidden = createMemo(() => false);
