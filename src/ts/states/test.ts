import { createEffect, createMemo, createSignal } from "solid-js";
import { getConfig } from "../config/store";
import { EventLog } from "../test/events/types";

import { LayoutObject } from "../schemas/layouts";
import { CompletedEvent, IncompleteTest } from "../schemas/results";
import { createStore } from "solid-js/store";
import { keymapEvent } from "../events/keymap";
import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import * as CustomText from "../test/custom-text";
import { getLayout } from "../utils/json-data";
import { canQuickRestart } from "../utils/quick-restart";
import { replaceUnderscoresWithSpaces } from "../utils/strings";
import { getActivePage } from "./core";
import { useResourceWithPromise } from "../hooks/useResourceWithPromise";
import { clearTimeouts } from "../utils/misc";

export const [wordsHaveNewline, setWordsHaveNewline] = createSignal(false);
export const [wordsHaveTab, setWordsHaveTab] = createSignal(false);
export const [wordsHaveNumbers, setWordsHaveNumbers] = createSignal(false);

export const [getResultVisible, setResultVisible] = createSignal(false);
// True from the first line of TestLogic.finish() until the result is built, so
// it covers the words fade-out that getResultVisible() is still false during.
export const [isResultCalculating, setResultCalculating] = createSignal(false);
// Set when the user bails out of a test early; reset by TestLogic.restart().
export const [getBailedOut, setBailedOut] = createSignal(false);
export const [getFocus, setFocus] = createSignal(false);
// #words is still vanilla so it's blurred imperatively (see test/test-ui);
// the Solid-owned composition display + OutOfFocusWarning read this signal.
const outOfFocusTimeouts: (number | NodeJS.Timeout)[] = [];
export type TestFocusState = "focused" | "unfocused" | "unfocusedWindow";
export const [testFocusState, { setTestFocusState }] =
  createSignalWithSetters<TestFocusState>("focused")({
    setTestFocusState: (set, val: TestFocusState) => {
      if (val === "focused") {
        clearTimeouts(outOfFocusTimeouts);
        set(val);
      } else {
        outOfFocusTimeouts.push(
          setTimeout(() => {
            set(val);
          }, 1000),
        );
      }
    },
  });

export const showOutOfFocusWarning = createMemo(
  () => getConfig.showOutOfFocusWarning && testFocusState() !== "focused",
);

// max-height of the warning, kept in sync with the words wrapper by test-ui.
export const [outOfFocusMaxHeight, setOutOfFocusMaxHeight] = createSignal<
  number | undefined
>(undefined);

// live IME composition text, pushed from the compositionupdate/end events.
export const [getCompositionText, setCompositionText] = createSignal("");
export const [isTestInvalid, setIsTestInvalid] = createSignal(false);
export const [isLongTest, setIsLongTest] = createSignal(false);
export const [getLastResult, setLastResult] = createSignal<Omit<
  CompletedEvent,
  "hash" | "uid"
> | null>(null);
export const [
  getIncompleteTests,
  { push: pushIncompleteTest, reset: resetIncompleteTests },
] = createSignalWithSetters<IncompleteTest[]>([])({
  push: (set, val: IncompleteTest) => set((arr) => [...arr, val]),
  reset: (set) => set([]),
});
export const getRestartCount = createMemo(() => getIncompleteTests().length);
export const getIncompleteSeconds = createMemo(() =>
  getIncompleteTests().reduce((sum, test) => sum + test.seconds, 0),
);

export const [isRepeated, setIsRepeated] = createSignal(false);

export const [getLastSignedOutResult, setLastSignedOutResult] =
  createSignal<CompletedEvent | null>(null);

export const [isTestActive, setTestActive] = createSignal(false);

export const [
  getActiveWordIndex,
  {
    increase: increaseActiveWordIndex,
    decrease: decreaseActiveWordIndex,
    reset: resetActiveWordIndex,
  },
] = createSignalWithSetters<number>(0)({
  increase: (set) => set((n) => n + 1),
  decrease: (set) => set((n) => n - 1),
  reset: (set) => set(0),
});

/**
 * Live test stats, rendered by the Solid live stat displays (the mini and text
 * variants and the progress bar). The test engine is still vanilla, so it pushes
 * plain numbers in here as it goes; everything shown on screen is derived below.
 * `undefined` means "no data yet" and is what the displays fall back to defaults on.
 */
export const [currentLiveStats, setCurrentLiveStats] = createStore<{
  wpm?: number;
  acc?: number;
  raw?: number;
  burst?: number;
  seconds?: number;
}>({});

createEffect(() => {
  getActivePage(); // depend on active page
  setIsLongTest(
    !canQuickRestart(
      getConfig.mode,
      getConfig.words,
      getConfig.time,
      CustomText.getData(),
    ),
  );
});

export const getKeymapLayout = createMemo<{
  layout: string;
  layoutNameDisplayString: string;
  isMirrored: boolean;
}>(() => {
  // beartype: this used to sync to the input layout emulator's own setting,
  // and to the keymapLayout config -- both are gone now, so this is always
  // qwerty.
  return {
    layout: "qwerty",
    layoutNameDisplayString: replaceUnderscoresWithSpaces("default"),
    isMirrored: false,
  };
});

const [getKeymapHighlightKey, setKeymapHighlightKey] = createSignal<
  string | undefined
>(undefined);

export { getKeymapHighlightKey };

export type FlashEntry = { tick: number; correct: boolean };

const [getKeymapFlashState, setKeymapFlashState] = createStore<
  Record<string, FlashEntry | undefined>
>({});

export { getKeymapFlashState, setKeymapFlashState };

keymapEvent.useListener(({ mode, key, correct }) => {
  const mappedKey = key === "" ? " " : key;
  setKeymapHighlightKey(mode === "highlight" ? mappedKey : undefined);

  if (mode === "flash" && getConfig.keymapMode === "react") {
    const existing = getKeymapFlashState[mappedKey];
    setKeymapFlashState(mappedKey, {
      tick: existing ? existing.tick + 1 : 1,
      correct: correct ?? true,
    });
  }
});

const [keymapLayoutObject, keymapLayoutPromise] = useResourceWithPromise(
  getKeymapLayout,
  async (layout) => {
    return await getLayout(layout.layout);
  },
);
export { keymapLayoutObject };

/**
 * Used for non reactive access. Do not use in Solid components.
 */
export const __nonReactive = {
  getKeymapLayout: async (): Promise<LayoutObject> => {
    await keymapLayoutPromise.promise;
    const result = keymapLayoutObject();
    if (result === undefined) {
      throw new Error("Failed to load keymap layout");
    }
    return result;
  },
};

export const [isLanguageRightToLeft, setIsLanguageRightToLeft] =
  createSignal(false);
export const [isDirectionReversed, setIsDirectionReversed] =
  createSignal(false);
export const [isTestRestarting, setIsTestRestarting] = createSignal(false);
export const [getKoreanStatus, setKoreanStatus] = createSignal(false);
export const [getLastEventLog, setLastEventLog] = createSignal<EventLog | null>(
  null,
);
