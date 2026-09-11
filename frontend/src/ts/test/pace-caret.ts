import * as TestWords from "./test-words";
import { Config } from "../config/store";
// beartype: results live in this browser, not in an account snapshot
import * as DB from "../beartype/local-results";
import { keyCost } from "../beartype/scoring";
import * as Misc from "../utils/misc";
import { configEvent } from "../events/config";
import { getActiveFunboxes } from "./funbox/list";
import { Caret } from "../elements/caret";
import { qsr } from "../utils/dom";
import {
  getUserAverage10Once,
  getUserDailyBestOnce,
} from "../beartype/local-results";
import {
  isDirectionReversed,
  isLanguageRightToLeft,
  getActiveWordIndex,
  getCurrentQuote,
  getResultVisible,
  isPaceRepeat,
  isTestActive,
  setPaceCaretWpm,
} from "../states/test";

type Settings = {
  wpm: number;
  cps: number;
  spc: number;
  correction: number;
  currentWordIndex: number;
  currentLetterIndex: number;
  wordsStatus: Record<number, true | undefined>;
  timeout: NodeJS.Timeout | null;
};

let startTimestamp = 0;

let settings: Settings | null = null;

export const caret = new Caret(qsr("#paceCaret"), Config.paceCaretStyle);

let lastTestWpm = 0;

export function setLastTestWpm(wpm: number): void {
  if (!isPaceRepeat() || (isPaceRepeat() && wpm > lastTestWpm)) {
    lastTestWpm = wpm;
  }
}

export function resetCaretPosition(): void {
  if (Config.paceCaret === "off" && !isPaceRepeat()) return;
  if (Config.mode === "zen") return;

  caret.hide();
  caret.stopAllAnimations();
  caret.clearMargins();

  caret.goTo({
    wordIndex: 0,
    letterIndex: 0,
    isLanguageRightToLeft: isLanguageRightToLeft(),
    isDirectionReversed: isDirectionReversed(),
    animate: false,
  });
}

export async function init(): Promise<void> {
  caret.hide();
  const mode2 = Misc.getMode2(Config, getCurrentQuote());
  let wpm = 0;
  if (Config.paceCaret === "pb") {
    wpm =
      DB.getLocalPB(
        Config.mode,
        mode2,
        Config.punctuation,
        Config.numbers,
        Config.language,
        Config.difficulty,
        Config.lazyMode,
        getActiveFunboxes(),
      )?.wpm ?? 0;
  } else if (Config.paceCaret === "tagPb") {
    // beartype: no tags, so there is no tag pb to pace against
    wpm = 0;
  } else if (Config.paceCaret === "average") {
    wpm = Math.round((await getUserAverage10Once({ ...Config, mode2 })).wpm);
  } else if (Config.paceCaret === "daily") {
    wpm = Math.round((await getUserDailyBestOnce({ ...Config, mode2 })).wpm);
  } else if (Config.paceCaret === "custom") {
    wpm = Config.paceCaretCustomSpeed;
  } else if (Config.paceCaret === "last" || isPaceRepeat()) {
    wpm = lastTestWpm;
  }
  if (wpm === undefined || wpm < 1 || Number.isNaN(wpm)) {
    settings = null;
    setPaceCaretWpm(undefined);
    return;
  }

  const characters = wpm * 5;
  const cps = characters / 60; //characters per step
  const spc = 60 / characters; //seconds per character

  settings = {
    wpm: wpm,
    cps: cps,
    spc: spc,
    correction: 0,
    currentWordIndex: 0,
    currentLetterIndex: 0,
    wordsStatus: {},
    timeout: null,
  };
  setPaceCaretWpm(wpm);
}

export async function update(expectedStepEnd: number): Promise<void> {
  const currentSettings = settings;
  if (currentSettings === null || !isTestActive() || getResultVisible()) {
    return;
  }

  if (caret.isHidden()) {
    caret.show();
  }

  incrementLetterIndex();

  try {
    const now = performance.now();
    const absoluteStepEnd = startTimestamp + expectedStepEnd;
    const duration = absoluteStepEnd - now;

    caret.goTo({
      wordIndex: currentSettings.currentWordIndex,
      letterIndex: currentSettings.currentLetterIndex,
      isLanguageRightToLeft: isLanguageRightToLeft(),
      isDirectionReversed: isDirectionReversed(),
      animate: true,
      animationOptions: {
        duration,
        easing: "linear",
      },
    });

    currentSettings.timeout = setTimeout(
      () => {
        if (settings !== currentSettings) return;
        update(expectedStepEnd + stepSeconds(currentSettings) * 1000).catch(
          () => {
            if (settings === currentSettings) settings = null;
          },
        );
      },
      Math.max(0, duration),
    );
  } catch (e) {
    console.error(e);
    caret.hide();
    return;
  }
}

export function reset(): void {
  if (settings?.timeout !== null && settings?.timeout !== undefined) {
    clearTimeout(settings.timeout);
  }
  settings = null;
  startTimestamp = 0;
}

function incrementLetterIndex(): void {
  if (settings === null) return;

  try {
    if (
      settings.currentLetterIndex >=
      // oxlint-disable-next-line typescript/no-non-null-assertion let it throw if undefined
      TestWords.words.get(settings.currentWordIndex)!.text.length
    ) {
      //go to the next word
      settings.currentLetterIndex = -1;
      settings.currentWordIndex++;
    }
    settings.currentLetterIndex++;

    if (!Config.blindMode) {
      if (settings.correction < 0) {
        while (settings.correction < 0) {
          settings.currentLetterIndex--;
          if (settings.currentLetterIndex <= -1) {
            //go to the previous word
            settings.currentLetterIndex =
              // oxlint-disable-next-line typescript/no-non-null-assertion let it throw if undefined
              TestWords.words.get(settings.currentWordIndex - 1)!.text.length;
            settings.currentWordIndex--;
          }
          settings.correction++;
        }
      } else if (settings.correction > 0) {
        while (settings.correction > 0) {
          settings.currentLetterIndex++;
          if (
            settings.currentLetterIndex >=
            // oxlint-disable-next-line typescript/no-non-null-assertion let it throw if undefined
            TestWords.words.get(settings.currentWordIndex)!.text.length + 1
          ) {
            //go to the next word
            settings.currentLetterIndex = 0;
            settings.currentWordIndex++;
          }
          settings.correction--;
        }
      }
    }
  } catch (e) {
    //out of words
    settings = null;
    console.log("pace caret out of words");
    caret.hide();
    return;
  }
}

export function handleSpace(correct: boolean, currentWord: string): void {
  if (correct) {
    if (
      settings?.wordsStatus[getActiveWordIndex()] === true &&
      !Config.blindMode
    ) {
      settings.wordsStatus[getActiveWordIndex()] = undefined;
      settings.correction -= currentWord.length;
    }
  } else {
    if (
      settings !== null &&
      settings.wordsStatus[getActiveWordIndex()] === undefined &&
      !Config.blindMode
    ) {
      settings.wordsStatus[getActiveWordIndex()] = true;
      settings.correction += currentWord.length;
    }
  }
}

export function start(): void {
  const now = performance.now();
  startTimestamp = now;
  void update(settings === null ? 0 : stepSeconds(settings) * 1000);
}

/**
 * beartype: how long the pace caret takes to cross the next letter. The speed
 * is counted in keys (beartype/scoring.ts), so `ế` -- three keys in Telex --
 * takes three times as long as `e`; upstream gives every character the same
 * time, which runs ahead of a typist exactly as fast as it claims to be.
 * English letters and spaces are one key each, so nothing changes there.
 */
function stepSeconds(current: Settings): number {
  const word = TestWords.words.get(current.currentWordIndex)?.text;
  const char = word?.[current.currentLetterIndex];
  return current.spc * (char === undefined ? 1 : keyCost(char));
}

configEvent.subscribe(({ key }) => {
  if (key === "paceCaret") void init();
  if (key === "paceCaretStyle") {
    caret.setStyle(Config.paceCaretStyle);
  }
});
