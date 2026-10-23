import { createSignal } from "solid-js";

import { Config, getConfig } from "../config/store";
import { setConfig } from "../config/setters";
import * as CustomText from "./custom-text";
import { configEvent } from "../events/config";
import { Mode } from "../schemas/shared";
import { customLength, customText, savedTextId } from "../beartype/custom-text";
import { MIN_DRILL_WORDS, missWords } from "../beartype/miss-book";
import { slowWords } from "../beartype/slow-words";
import { statsLanguage, textPool } from "../beartype/stats-language";

/** Which book a drill is built from: words typed wrong, or right but slow. */
export type DrillKind = "miss" | "slow";

/** The words of `kind`'s book for a pool, as a drill takes them. */
export function drillWords(kind: DrillKind, pool: string | null): string[] {
  if (pool === null) return [];
  return kind === "slow" ? slowWords(pool) : missWords(pool);
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

/** Whether the words come from the typist's own text, not the word list. */
export function customSource(): boolean {
  return getConfig.mode === "custom" && drillBaseMode() === null;
}

/** Whether a drill is on, built from the books of a saved text. */
export function textDrill(): boolean {
  return getConfig.mode === "custom" && drillBaseMode() === "custom";
}

// beartype: the pool the drill that is on was built from, so its next round
// comes from the same books even when the text has since changed
const [drillPool, setDrillPool] = createSignal<string | null>(null);

/**
 * The pool what is on screen is measured in, and the drill buttons draw
 * from: the language of the word list, a saved text's own, or the one the
 * drill that is on came from. `null` for a text not saved, which keeps no
 * books.
 */
export function statsPool(): string | null {
  if (getConfig.mode === "custom" && drillBaseMode() !== null) {
    return drillPool();
  }
  if (customSource()) {
    const id = savedTextId(customText());
    return id === null ? null : textPool(id);
  }
  return statsLanguage(getConfig.language);
}

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

  const pool = statsPool();
  const mode = before.mode ?? Config.mode;
  // a text's drill runs as long as the text is set to, but a text run once
  // through to its end has no length a drill can share, and takes a count
  const byTime =
    mode === "custom" ? customLength() === "time" : mode === "time";
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
  setDrillPool(pool);

  return true;
}

/**
 * beartype: the next round of a drill that is on -- "next", tab + enter, the
 * logo -- built again from the book, which the round just finished has
 * changed. A drill stays on until the typist turns it off or picks another
 * mode; it ends by itself only when the book it was built from no longer
 * holds enough words, and then `false` sends `restart` back to the
 * settings from before.
 */
export function continueDrill(): boolean {
  const kind = drillKind() ?? "miss";
  const words = drillWords(kind, drillPool());
  return words.length >= MIN_DRILL_WORDS && initFromWords(words, kind);
}

export function resetBefore(): void {
  before.mode = null;
  setDrillBaseMode(null);
  setDrillKind(null);
  setDrillPool(null);
}

configEvent.subscribe(({ key }) => {
  if (key === "mode") resetBefore();
});
