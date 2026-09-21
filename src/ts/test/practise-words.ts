import { createSignal } from "solid-js";

import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import * as CustomText from "./custom-text";
import { configEvent } from "../events/config";
import { Mode } from "../schemas/shared";
import { MIN_DRILL_WORDS, missWords } from "../beartype/miss-book";
import { slowWords } from "../beartype/slow-words";

/** Which book a drill is built from: words typed wrong, or right but slow. */
export type DrillKind = "miss" | "slow";

/** The words of `kind`'s book for a language, as a drill takes them. */
export function drillWords(kind: DrillKind, language: string): string[] {
  return kind === "slow" ? slowWords(language) : missWords(language);
}

type Before = {
  mode: Mode | null;
};

export const before: Before = {
  mode: null,
};

// beartype: `before.mode` as a signal, so the options bar can light the mode
// a drill runs in -- time or words -- instead of neither. Kept in step with
// the plain field wherever it is written.
const [drillBaseMode, setDrillBaseMode] = createSignal<Mode | null>(null);
export { drillBaseMode };

// beartype: the book the drill that is on was built from, so each drill
// button lights only for its own drill, and the next round is built again
// from the same book
const [drillKind, setDrillKind] = createSignal<DrillKind | null>(null);
export { drillKind };

/**
 * beartype: a drill built from a given list of words -- one book's.
 * Runs the words as a custom test that `restart` reverts from afterwards, as
 * long as the test it replaces, shuffled on every pass so the hands learn the
 * words, not the order.
 */
export function initFromWords(
  words: readonly string[],
  kind: DrillKind,
): boolean {
  if (words.length === 0) return false;

  const mode = before.mode ?? Config.mode;
  const byTime = mode === "time";
  const length = byTime ? Config.time : Config.words;

  setConfig("mode", "custom", {
    nosave: true,
  });
  CustomText.setPipeDelimiter(false);
  CustomText.setText([...words]);
  CustomText.setMode("shuffle");
  CustomText.setLimitMode(byTime ? "time" : "word");
  CustomText.setLimitValue(length);

  before.mode = mode;
  setDrillBaseMode(mode);
  setDrillKind(kind);

  return true;
}

/**
 * beartype: the next round of a drill that is on -- "next", tab + enter, the
 * logo -- built again from the book, which the round just finished has
 * changed. A drill stays on until the typist turns it off or picks another
 * mode; it ends by itself only when the book (for the language on screen)
 * no longer holds enough words, and then `false` sends `restart` back to the
 * settings from before.
 */
export function continueDrill(): boolean {
  const kind = drillKind() ?? "miss";
  const words = drillWords(kind, Config.language);
  return words.length >= MIN_DRILL_WORDS && initFromWords(words, kind);
}

export function resetBefore(): void {
  before.mode = null;
  setDrillBaseMode(null);
  setDrillKind(null);
}

configEvent.subscribe(({ key }) => {
  if (key === "mode") resetBefore();
});
