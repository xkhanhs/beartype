import type { TestEventNoMs } from "../test/events/types";
import { median } from "./local-results";
import { inTargetStyle, wordCost } from "./scoring";
import { commitTimes, SLOW_BELOW } from "./slow-words";

/**
 * Every word of a round as it went, for the strip under the result: what was
 * typed, how fast, and whether it came out wrong. Upstream's words history
 * with its burst heatmap, measured the way the slow word book measures.
 *
 * A word's speed runs from the commit of the word before to its own, in
 * keys, as in `slow-words.ts`; the first word runs from its own first key.
 * Its colour says how that speed stands against the bar for words costing
 * as many keys -- the slow book's bar when the pool has one, else the
 * round's own median -- not against one figure for all: with a single
 * figure `à` and `có` would always come out slowest.
 */

/** How a word's speed stands against its bar, slowest to fastest. */
export type SpeedLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Where each level starts, as a share of the bar. `SLOW_BELOW` is the slow
 * book's own line, so a word drawn in the two slowest shades is one the book
 * would call slow.
 */
const LEVEL_FROM = [0.7, SLOW_BELOW, 1.15, 1.3] as const;

export type WordRun = {
  target: string;
  /** What was committed, without its space. */
  typed: string;
  /** wpm at five keys a word, or `null` when there is no true time. */
  wpm: number | null;
  /** A wrong key went in, or the word was committed wrong. */
  wrong: boolean;
  /** `null` when the word has no speed. */
  level: SpeedLevel | null;
};

export function levelOf(share: number): SpeedLevel {
  let level = 0;
  for (const from of LEVEL_FROM) {
    if (share >= from) level++;
  }
  return level as SpeedLevel;
}

/**
 * The round's words. `history[i]` is what was typed for `targets[i]`,
 * `stumbledAt` the words a wrong key went into, and `barFor` the pool's bar
 * for a word of so many keys, `null` when it has none.
 */
export function wordRuns(
  targets: readonly string[],
  history: readonly string[],
  events: readonly TestEventNoMs[],
  stumbledAt: ReadonlySet<number>,
  barFor: (keys: number) => number | null,
): WordRun[] {
  const commits = commitTimes(history, targets, events);
  const firstKey = new Map<number, number>();
  for (const event of events) {
    if (event.type !== "input" || event.data.automatic === true) continue;
    if (!firstKey.has(event.data.wordIndex)) {
      firstKey.set(event.data.wordIndex, event.testMs);
    }
  }

  const runs: WordRun[] = [];
  history.forEach((input, index) => {
    const target = targets[index];
    if (target === undefined || input === "") return;
    const typed = input.replace(/[ \n]$/, "");
    const at = commits.get(index);
    const from = index === 0 ? firstKey.get(0) : commits.get(index - 1);
    const ms = at !== undefined && from !== undefined ? at - from : 0;
    const wpm = ms > 0 ? wordCost(target) / 5 / (ms / 60000) : null;
    // the word the clock cut short is not wrong for being unfinished
    const committed = typed !== input || at !== undefined;
    runs.push({
      target,
      typed,
      wpm: wpm === null ? null : Math.round(wpm),
      wrong:
        stumbledAt.has(index) ||
        (committed && inTargetStyle(target, typed) !== target),
      level: null,
    });
  });

  // the round's own bar, for a pool with too few samples for one: the clean
  // words only, as the slow book would take them
  const clean = runs
    .filter((run) => !run.wrong && run.wpm !== null)
    .map((run) => run.wpm as number);
  const fallback = clean.length === 0 ? null : median(clean);
  for (const run of runs) {
    if (run.wpm === null) continue;
    const bar = barFor(wordCost(run.target)) ?? fallback;
    if (bar !== null && bar > 0) run.level = levelOf(run.wpm / bar);
  }
  return runs;
}
