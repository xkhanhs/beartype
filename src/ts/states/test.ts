import { createMemo, createResource, createSignal } from "solid-js";
import { getConfig } from "../config/store";
import { EventLog } from "../test/events/types";

import { IncompleteTest } from "../schemas/results";
import { createStore } from "solid-js/store";
import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import { getLayout } from "../utils/json-data";
import { clearTimeouts } from "../utils/misc";

export const [wordsHaveNewline, setWordsHaveNewline] = createSignal(false);
export const [wordsHaveTab, setWordsHaveTab] = createSignal(false);

export const [getResultVisible, setResultVisible] = createSignal(false);
// True from the first line of TestLogic.finish() until the result is built, so
// it covers the words fade-out that getResultVisible() is still false during.
export const [isResultCalculating, setResultCalculating] = createSignal(false);
export const [getFocus, setFocus] = createSignal(false);
// #words is still vanilla so it's blurred imperatively (see test/test-ui);
// OutOfFocusWarning reads this signal.
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
  () => testFocusState() !== "focused",
);

// max-height of the warning, kept in sync with the words wrapper by test-ui.
export const [outOfFocusMaxHeight, setOutOfFocusMaxHeight] = createSignal<
  number | undefined
>(undefined);

export const [isTestInvalid, setIsTestInvalid] = createSignal(false);
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

/**
 * The keymap's layout, fetched only once the keymap is switched on. beartype
 * draws QWERTY alone, whatever the typist's own layout.
 */
export const getKeymapLayout = createMemo(() =>
  getConfig.keymapMode === "off" ? undefined : "qwerty",
);

export const [keymapLayoutObject] = createResource(getKeymapLayout, getLayout);

export type FlashEntry = { tick: number; correct: boolean };

/** The keys lit on the keymap, by the `code` of the key drawn. */
const [getKeymapFlashState, setKeymapFlashState] = createStore<
  Record<string, FlashEntry | undefined>
>({});

export { getKeymapFlashState, setKeymapFlashState };

export const [isLanguageRightToLeft, setIsLanguageRightToLeft] =
  createSignal(false);
export const [isDirectionReversed, setIsDirectionReversed] =
  createSignal(false);
export const [isTestRestarting, setIsTestRestarting] = createSignal(false);
export const [getLastEventLog, setLastEventLog] = createSignal<EventLog | null>(
  null,
);
