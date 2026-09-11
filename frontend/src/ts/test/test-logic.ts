import * as TestUI from "./test-ui";
import * as Strings from "../utils/strings";
import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import * as Numbers from "../utils/numbers";
import {
  showNoticeNotification,
  showErrorNotification,
} from "../states/notifications";
import * as CustomText from "./custom-text";
import * as PractiseWords from "./practise-words";
import * as TestTimer from "./test-timer";
import * as LocalResults from "../beartype/local-results";
import { learnToneStyle } from "../beartype/tone-style";
import { committedWords, recordMisses } from "../beartype/miss-book";
import * as Result from "./result";
import { getActivePage } from "../states/core";
import {
  setIsDirectionReversed,
  setIsLanguageRightToLeft,
  setKoreanStatus,
  setLastEventLog,
  setIsTestRestarting,
  isTestRestarting,
  getIncompleteSeconds,
  getIncompleteTests,
  getRestartCount,
  isRepeated,
  isTestActive,
  pushIncompleteTest,
  resetIncompleteTests,
  setIsRepeated,
  setIsTestInvalid,
  setLastResult,
  getActiveWordIndex,
  resetActiveWordIndex,
  getBailedOut,
  isResultCalculating,
  setBailedOut,
  setResultCalculating,
  setResultVisible,
  setTestActive,
  setWordsHaveNewline,
  setWordsHaveNumbers,
  setWordsHaveTab,
  getResultVisible,
} from "../states/test";
import { restartTestEvent } from "../events/test";
import * as TestWords from "./test-words";
import * as WordsGenerator from "./words-generator";
import * as PageTransition from "../legacy-states/page-transition";
import { configEvent } from "../events/config";
import { timerEvent } from "../events/timer";
import { highlight } from "../events/keymap";
import { CompletedEvent, CompletedEventCustomText } from "../schemas/results";
import * as CompositionState from "../legacy-states/composition";
import { WordGenError } from "../utils/word-gen-error";
import { tryCatch } from "../utils/trycatch";
import { showLoaderBar, hideLoaderBar } from "../states/loader-bar";
import * as TestInitFailed from "../elements/test-init-failed";
import { setInputElementValue } from "../input/input-element";
import { qs } from "../utils/dom";
import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import {
  resetTestEvents,
  cleanupData,
  logEventsDataToTheConsoleTable,
  forceReleaseAllKeys,
  buildEventLog,
} from "./events/data";
import {
  getKeypressDurations,
  getChars,
  getBurstHistory,
  getLastKeypressToEndMs,
  getStartToFirstKeypressMs,
  getTestDurationMs,
  getAccuracy,
  getKeypressOverlap,
  getErrorCountHistory,
  getWpmHistory,
  getAfkDuration,
  getIncompleteTestSeconds,
  getDateBasedTestDurationMs,
  getInputHistory,
  getKeypressesPerSecond,
  getKeypressSpacing,
} from "./events/stats";
import { getLiveCachedAccuracy } from "./events/live-cache";
import { calculateWpm } from "../utils/numbers";
import { isDevEnvironment } from "../utils/env";
import { EventLog } from "./events/types";
import { resetModifierState } from "../states/modifiers";
import { nthElementFromArray } from "../utils/arrays";

let failReason = "";

export function startTest(now: number): boolean {
  if (PageTransition.get()) {
    return false;
  }

  setTestActive(true);
  TestTimer.clear();

  //use a recursive self-adjusting timer to avoid time drift
  void TestTimer.start(now);
  TestUI.onTestStart();
  return true;
}

type RestartOptions = {
  withSameWordset?: boolean;
  nosave?: boolean;
  event?: KeyboardEvent;
  practiseMissed?: boolean;
  // beartype: the drill button turning a drill off
  leaveDrill?: boolean;
  noAnim?: boolean;
};

export async function restart(options = {} as RestartOptions): Promise<void> {
  const defaultOptions = {
    withSameWordset: false,
    practiseMissed: false,
    noAnim: false,
    nosave: false,
  };

  options = { ...defaultOptions, ...options };

  // guards

  if (isTestRestarting() || isResultCalculating()) {
    options.event?.preventDefault();
    return;
  }
  if (isTestActive()) {
    // close out the abandoned test

    if (isRepeated()) {
      options.withSameWordset = true;
    }

    if (Config.resultSaving) {
      // Finalize the abandoned test before measuring it: logging the timer
      // "end" event gives getAfkDuration its interval boundaries, so idle time
      // is actually subtracted. Without it AFK is always 0 and the full
      // wall-clock lifetime (incl. unbounded idle) leaks into the result.
      TestTimer.clear(true);
      const liveEventLog = buildEventLog();
      const tt = getIncompleteTestSeconds(liveEventLog);
      const acc = Numbers.roundTo2(getLiveCachedAccuracy());
      pushIncompleteTest({ acc, seconds: tt });
    }
  }

  // beartype: a new test during a drill is the drill's next round, built
  // again from the book (`continueDrill`); only the drill button's
  // `leaveDrill`, or a book too thin to drill, goes back to the settings
  // from before
  if (
    PractiseWords.before.mode !== null &&
    !options.withSameWordset &&
    !options.practiseMissed &&
    (options.leaveDrill === true || !PractiseWords.continueDrill())
  ) {
    showNoticeNotification("Thôi luyện từ hay sai, quay về bài thường.");
    setConfig("mode", PractiseWords.before.mode);
    PractiseWords.resetBefore();
  }

  // reset state

  resetTestEvents();
  TestTimer.clear();
  setIsTestInvalid(false);
  resetModifierState();
  setTestActive(false);
  setBailedOut(false);
  setKoreanStatus(false);
  CompositionState.setComposing(false);
  CompositionState.setData("");
  Strings.clearWordDirectionCache();
  testReinitCount = 0;
  failReason = "";

  setIsRepeated(options.withSameWordset ?? false);

  // restart

  const source: "testPage" | "resultPage" = getResultVisible()
    ? "resultPage"
    : "testPage";
  const noAnim = options.noAnim ?? false;

  setIsTestRestarting(true);

  await TestUI.fadeOutForRestart(source, noAnim);

  setResultVisible(false);
  setInputElementValue("");

  const initResult = await init();

  if (!initResult) {
    setIsTestRestarting(false);
    return;
  }

  TestUI.onTestRestart(source);

  await TestUI.fadeInAfterRestart(noAnim);
  setIsTestRestarting(false);
}

let lastInitError: Error | null = null;
let testReinitCount = 0;

async function init(): Promise<boolean> {
  console.debug("Initializing test");
  testReinitCount++;
  if (testReinitCount > 3) {
    if (lastInitError) {
      console.error(lastInitError);
      TestInitFailed.showError(
        `${lastInitError.name}: ${lastInitError.message}`,
      );
    }
    TestInitFailed.show();
    setIsTestRestarting(false);
    return false;
  }

  TestWords.words.reset();
  resetActiveWordIndex();

  showLoaderBar();
  const { data: language, error } = await tryCatch(
    JSONData.getLanguage(Config.language),
  );
  hideLoaderBar();

  if (error) {
    // beartype: only the words change
    showErrorNotification("Không tải được bộ từ", { error });
  }

  if (!language || language.name !== Config.language) {
    return await init();
  }

  if (Config.mode === "custom") {
    console.debug("Custom text", CustomText.getData());
  }

  console.log("Inializing test", {
    language: {
      ...language,
      words: `${language.words.length} words`,
    },
    customText: {
      ...CustomText.getData(),
      text: `${CustomText.getText().length} words`,
    },
    mode: Config.mode,
    mode2: Misc.getMode2(Config),
  });

  let wordsHaveTab = false;
  let wordsHaveNewline = false;
  let allRightToLeft: boolean | undefined = undefined;
  let allJoiningScript: boolean | undefined = undefined;
  let generatedWords: string[] = [];
  let generatedSectionIndexes: number[] = [];
  try {
    const gen = await WordsGenerator.generateWords(language);
    generatedWords = gen.words;
    generatedSectionIndexes = gen.sectionIndexes;
    wordsHaveTab = gen.hasTab;
    wordsHaveNewline = gen.hasNewline;
    ({ allRightToLeft, allJoiningScript } = gen);
  } catch (e) {
    hideLoaderBar();
    if (e instanceof WordGenError || e instanceof Error) {
      lastInitError = e;
    }
    console.error(e);
    if (e instanceof WordGenError) {
      if (e.message.length > 0) {
        showNoticeNotification(e.message, {
          important: true,
        });
      }
    } else {
      // beartype: only the words change
      showErrorNotification("Không tạo được bài gõ", {
        error: e,
        important: true,
      });
    }

    return await init();
  }

  let hasNumbers = false;

  for (const word of generatedWords) {
    if (/\d/g.test(word) && !hasNumbers) {
      hasNumbers = true;
    }
  }

  setWordsHaveNumbers(hasNumbers);
  setWordsHaveTab(wordsHaveTab);
  setWordsHaveNewline(wordsHaveNewline);

  if (
    generatedWords
      .join()
      .normalize()
      .match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g,
      )
  ) {
    setKoreanStatus(true);
  }

  for (let i = 0; i < generatedWords.length; i++) {
    TestWords.words.push(
      generatedWords[i] as string,
      generatedSectionIndexes[i] as number,
    );
  }

  if (WordsGenerator.areAllWordsGenerated()) {
    TestWords.words.removeCommitCharacterFromLastWord();
  }

  if (Config.keymapMode === "next") {
    highlight(
      nthElementFromArray(
        // ignoring for now but this might need a different approach
        // oxlint-disable-next-line no-misused-spread
        [...(TestWords.words.getCurrent()?.text ?? "")],
        0,
      ) as string,
    );
  }

  TestUI.setJoiningClass(allJoiningScript ?? language.joiningScript ?? false);

  const isLanguageRTL = allRightToLeft ?? language.rightToLeft ?? false;
  setIsLanguageRightToLeft(isLanguageRTL);
  setIsDirectionReversed(false);

  console.debug("Test initialized with words", TestWords.words.get());
  console.debug(
    "Test initialized with section indexes",
    generatedSectionIndexes,
  );
  return true;
}

//add word during the test
export async function addWord(): Promise<void> {
  const bound = 100; // how many extra words to aim for AFTER the current word

  if (TestWords.words.length - (getActiveWordIndex() + 1) > bound) {
    console.debug("Not adding word, enough words already");
    return;
  }
  if (WordsGenerator.areAllWordsGenerated()) {
    console.debug("Not adding word, all words generated");
    return;
  }

  try {
    const randomWord = await WordsGenerator.getNextWord(
      TestWords.words.length,
      bound,
      TestWords.words.get(TestWords.words.length - 1)?.text ?? "",
      TestWords.words.get(TestWords.words.length - 2)?.text,
    );

    const newWord = TestWords.words.push(
      randomWord.word,
      randomWord.sectionIndex,
    );
    TestUI.addWord(newWord.display);
  } catch (e) {
    timerEvent.dispatch({ key: "fail", value: "word generation error" });
    showErrorNotification(
      "Error while getting next word. Please try again later",
      {
        error: e,
        important: true,
      },
    );
  }

  // strip the trailing commit separator once the final word has been generated
  // (covers the section and lazy paths)
  if (WordsGenerator.areAllWordsGenerated()) {
    TestWords.words.removeCommitCharacterFromLastWord();
  }
}

function buildCompletedEvent(
  eventLog: EventLog,
): Omit<CompletedEvent, "hash" | "uid"> {
  const chars = getChars(eventLog);

  // beartype: there are no tags
  const activeTagsIds: string[] = [];

  const language = Config.language;

  let customText: CompletedEventCustomText | undefined = undefined;
  if (Config.mode === "custom") {
    const temp = CustomText.getData();
    customText = {
      textLen: temp.text.length,
      mode: temp.mode,
      pipeDelimiter: temp.pipeDelimiter,
      limit: temp.limit,
    };
  }

  let duration = getTestDurationMs(eventLog) / 1000;

  const rawPerSecond = getBurstHistory(eventLog);
  const afkDuration = getAfkDuration(eventLog);
  const stddev = Numbers.stdDev(rawPerSecond);
  const avg = Numbers.mean(rawPerSecond);
  let consistency = Numbers.roundTo2(Numbers.kogasa(stddev / avg));
  if (!consistency || isNaN(consistency)) {
    consistency = 0;
  }

  const keypressSpacing = getKeypressSpacing(eventLog);

  let keyConsistencyArray = [...keypressSpacing];
  if (keypressSpacing.length > 0) {
    keyConsistencyArray = keyConsistencyArray.slice(
      0,
      keyConsistencyArray.length - 1,
    );
  }
  const keyStddev = Numbers.stdDev(keyConsistencyArray);
  const keyAvg = Numbers.mean(keyConsistencyArray);
  let keyConsistency = Numbers.roundTo2(Numbers.kogasa(keyStddev / keyAvg));
  if (!keyConsistency || isNaN(keyConsistency)) {
    keyConsistency = 0;
  }

  const wpmHistory = getWpmHistory(eventLog);
  const wpmCons = Numbers.roundTo2(
    Numbers.kogasa(Numbers.stdDev(wpmHistory) / Numbers.mean(wpmHistory)),
  );
  const wpmConsistency = isNaN(wpmCons) ? 0 : wpmCons;

  const chartData = {
    wpm: wpmHistory,
    burst: rawPerSecond,
    err: getErrorCountHistory(eventLog),
  };

  const completedEvent: Omit<CompletedEvent, "hash" | "uid"> = {
    wpm: Numbers.roundTo2(calculateWpm(chars.correctWord, duration)),
    rawWpm: Numbers.roundTo2(
      calculateWpm(chars.allCorrect + chars.incorrect + chars.extra, duration),
    ),
    charStats: [chars.correctWord, chars.incorrect, chars.extra, chars.missed],
    charTotal: chars.allCorrect + chars.incorrect + chars.extra,
    acc: Numbers.roundTo2(getAccuracy(eventLog).percentage),
    language: language,
    testDuration: duration,
    lastKeyToEnd: getLastKeypressToEndMs(eventLog),
    startToFirstKey: getStartToFirstKeypressMs(eventLog),
    afkDuration: afkDuration,
    customText: customText,
    tags: activeTagsIds,
    timestamp: Date.now(),
    mode: Config.mode,
    mode2: Misc.getMode2(Config),
    bailedOut: getBailedOut(),
    restartCount: getRestartCount(),
    incompleteTests: getIncompleteTests(),
    incompleteTestSeconds:
      getIncompleteSeconds() < 0 ? 0 : Numbers.roundTo2(getIncompleteSeconds()),

    consistency: consistency,
    wpmConsistency: wpmConsistency,
    keyConsistency: keyConsistency,
    chartData: chartData,

    keySpacing: keypressSpacing,
    keyDuration: getKeypressDurations(eventLog),
    keyOverlap: getKeypressOverlap(eventLog),
  };

  if (completedEvent.mode !== "custom") delete completedEvent.customText;

  return completedEvent;
}

export async function finish(difficultyFailed = false): Promise<void> {
  if (!isTestActive()) return;
  setResultCalculating(true);
  const now = performance.now();
  TestTimer.clear(true, now);

  // fade out the test and show loading
  // because the css animation has a delay,
  // if the test calculation is fast the loading will not show
  await Misc.promiseAnimate("#typingTest", {
    opacity: 0,
    duration: Misc.applyReducedMotion(125),
  });
  qs(".pageTest #typingTest")?.hide();
  qs(".pageTest .loading")?.show();
  await Misc.sleep(0); //allow ui update

  TestUI.onTestFinish();

  forceReleaseAllKeys();

  setResultVisible(true);
  setTestActive(false);

  cleanupData();

  if (isDevEnvironment()) {
    logEventsDataToTheConsoleTable();
  }

  const eventLog = buildEventLog();
  const ce = buildCompletedEvent(eventLog);

  console.debug("Completed event object", ce);

  function countUndefined(input: unknown): number {
    if (typeof input === "number") {
      return isNaN(input) ? 1 : 0;
    } else if (typeof input === "undefined") {
      return 1;
    } else if (typeof input === "object" && input !== null) {
      return Object.values(input).reduce(
        (a, b) => (a + countUndefined(b)) as number,
        0,
      ) as number;
    } else {
      return 0;
    }
  }

  let dontSave = false;

  if (countUndefined(ce) > 0) {
    console.log(ce);
    showErrorNotification(
      "Failed to build result object: One of the fields is undefined or NaN",
    );
    dontSave = true;
  }

  const completedEvent = structuredClone(ce) as CompletedEvent;

  setLastEventLog(eventLog);
  setLastResult(structuredClone(completedEvent));

  ///////// completed event ready

  //afk check
  let afkDetected = getKeypressesPerSecond(eventLog)
    .slice(-5)
    .every((kps) => kps === 0);
  if (getBailedOut()) afkDetected = false;

  const mode2Number = parseInt(completedEvent.mode2);

  // beartype: the result screen says what was wrong with a test, in
  // Vietnamese, under the figures (`updateOther` in result.ts); upstream's
  // English pop-up said it a second time. The checks below are upstream's,
  // untouched -- only their pop-up is silenced, for this function alone.
  const showNoticeNotification = (..._args: unknown[]): void => undefined;

  let tooShort = false;
  //fail checks
  const dateDur = getDateBasedTestDurationMs(eventLog) / 1000;
  if (
    Config.mode === "time" &&
    !getBailedOut() &&
    (ce.testDuration < dateDur - 0.1 || ce.testDuration > dateDur + 0.1) &&
    ce.testDuration <= 120
  ) {
    showNoticeNotification("Test invalid - inconsistent test duration");
    console.error("Test duration inconsistent", ce.testDuration, dateDur);
    setIsTestInvalid(true);
    dontSave = true;
  } else if (difficultyFailed) {
    showNoticeNotification(`Test failed - ${failReason}`, {
      durationMs: 1000,
    });
    dontSave = true;
  } else if (
    completedEvent.testDuration < 1 ||
    (Config.mode === "time" && mode2Number < 15 && mode2Number > 0) ||
    (Config.mode === "time" &&
      mode2Number === 0 &&
      completedEvent.testDuration < 15) ||
    (Config.mode === "words" && mode2Number < 10 && mode2Number > 0) ||
    (Config.mode === "words" &&
      mode2Number === 0 &&
      completedEvent.testDuration < 15) ||
    (Config.mode === "custom" &&
      (CustomText.getLimitMode() === "word" ||
        CustomText.getLimitMode() === "section") &&
      CustomText.getLimitValue() < 10) ||
    (Config.mode === "custom" &&
      CustomText.getLimitMode() === "time" &&
      CustomText.getLimitValue() < 15)
  ) {
    showNoticeNotification("Test invalid - too short");
    setIsTestInvalid(true);
    tooShort = true;
    dontSave = true;
  } else if (afkDetected) {
    showNoticeNotification("Test invalid - AFK detected");
    setIsTestInvalid(true);
    dontSave = true;
  } else if (isRepeated()) {
    showNoticeNotification("Test invalid - repeated");
    setIsTestInvalid(true);
    dontSave = true;
  } else if (
    completedEvent.wpm < 0 ||
    (completedEvent.wpm > 350 &&
      completedEvent.mode !== "words" &&
      completedEvent.mode2 !== "10") ||
    (completedEvent.wpm > 420 &&
      completedEvent.mode === "words" &&
      completedEvent.mode2 === "10")
  ) {
    showNoticeNotification("Test invalid - wpm");
    setIsTestInvalid(true);
    dontSave = true;
  } else if (
    completedEvent.rawWpm < 0 ||
    (completedEvent.rawWpm > 350 &&
      completedEvent.mode !== "words" &&
      completedEvent.mode2 !== "10") ||
    (completedEvent.rawWpm > 420 &&
      completedEvent.mode === "words" &&
      completedEvent.mode2 === "10")
  ) {
    showNoticeNotification("Test invalid - raw");
    setIsTestInvalid(true);
    dontSave = true;
  } else if (completedEvent.acc < 75 || completedEvent.acc > 100) {
    showNoticeNotification("Test invalid - accuracy");
    setIsTestInvalid(true);
    dontSave = true;
  }

  // test is valid

  if (isRepeated() || difficultyFailed) {
    if (Config.resultSaving) {
      pushIncompleteTest({
        acc: completedEvent.acc,
        seconds: getIncompleteTestSeconds(eventLog),
      });
    }
  }

  // beartype: there is no account to save to. A valid result is kept in this
  // browser, and only after the result screen has compared it with the best
  // kept so far -- saved first, it would always be its own personal best.
  if (!dontSave) {
    resetIncompleteTests();
  }

  const resultUpdatePromise = Result.update(
    completedEvent,
    difficultyFailed,
    failReason,
    afkDetected,
    isRepeated(),
    tooShort,
    dontSave,
  );

  await resultUpdatePromise;
  // a drill from the miss book is practice, not a test to measure against
  if (!dontSave && Config.mode !== "custom") {
    LocalResults.saveResult(completedEvent);
  }
  // beartype: the words this round missed go into the book behind the drill
  // button; see beartype/miss-book.ts. A wrong key counts even when it was
  // rubbed out before the space; `correct` is judged by keybear's key rule,
  // so a mark still on its way is not one.
  const history = getInputHistory(eventLog);
  const stumbledAt = new Set<number>();
  for (const event of eventLog.events) {
    if (
      event.type === "input" &&
      event.data.inputType === "insertText" &&
      !event.data.correct
    ) {
      stumbledAt.add(event.data.wordIndex);
    }
  }
  const round = committedWords(
    TestWords.words.get().map((word) => word.text),
    history,
    stumbledAt,
  );
  recordMisses(Config.language, round.words, round.typed, round.stumbled);
  learnToneStyle(history);
}

export function fail(reason: string): void {
  failReason = reason;
  void finish(true);
}

qs(".pageTest")?.onChild("click", "#testInitFailed button.restart", () => {
  void restart();
});

qs(".pageTest")?.onChild("click", "#restartTestButton", () => {
  if (isResultCalculating()) return;
  void restart();
});

qs(".pageTest")?.onChild("click", "#nextTestButton", () => {
  void restart();
});

qs(".pageTest")?.onChild("click", "#restartTestButtonWithSameWordset", () => {
  void restart({
    withSameWordset: true,
  });
});

// little roadblock for basic cheating
window.addEventListener("focus", () => {
  if (
    !isTestActive() &&
    !getResultVisible() &&
    (Config.mode === "time" || Config.mode === "words")
  ) {
    void restart({
      noAnim: true,
      // beartype: a repeat keeps its words; they are known already
      withSameWordset: isRepeated(),
    });
  }
});

// little roadblock for basic cheating
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  if (
    !isTestActive() &&
    !getResultVisible() &&
    (Config.mode === "time" || Config.mode === "words")
  ) {
    void restart({
      noAnim: true,
      // beartype: a repeat keeps its words; they are known already
      withSameWordset: isRepeated(),
    });
  }
});

restartTestEvent.subscribe((event) => void restart(event));

// ===============================

configEvent.subscribe(({ key, newValue }) => {
  if (getActivePage() === "test") {
    if (key === "language") {
      void restart();
    }

    if (key === "keymapMode" && newValue === "next") {
      setTimeout(() => {
        highlight(
          nthElementFromArray(
            // ignoring for now but this might need a different approach
            // oxlint-disable-next-line no-misused-spread
            [...(TestWords.words.getCurrent()?.text ?? "")],
            0,
          ) as string,
        );
      }, 0);
    }
  }
});

timerEvent.subscribe(({ key: eventKey, value: eventValue }) => {
  if (eventKey === "fail" && eventValue !== undefined) fail(eventValue);
  if (eventKey === "finish") void finish();
});
