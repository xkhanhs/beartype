import { z } from "zod";
import { ModeSchema } from "../schemas/shared";
import type { CompletedEvent } from "../schemas/results";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { statsLanguage } from "./stats-language";

/**
 * The result history, kept in this browser and nowhere else.
 *
 * Upstream keeps it on its server and reads it back as the account's
 * snapshot; the personal best and the "today" counter come from there.
 * beartype has no accounts, so this is the one place those questions are
 * answered.
 *
 * Only what those questions need is stored -- the whole `CompletedEvent`
 * carries per-second chart data and every key timing, and a few hundred of
 * them would fill `localStorage`.
 */
const LocalResultSchema = z.object({
  timestamp: z.number(),
  mode: ModeSchema,
  mode2: z.string(),
  language: z.string(),
  wpm: z.number(),
  acc: z.number(),
  rawWpm: z.number(),
  consistency: z.number(),
  testDuration: z.number(),
  afkDuration: z.number(),
  incompleteTestSeconds: z.number(),
  /**
   * The kind of round it was, as `testShape` names it. Absent on results
   * kept before rounds were told apart; `shapeOf` reads those off their mode.
   */
  shape: z.string().optional(),
});

export type LocalResult = z.infer<typeof LocalResultSchema>;

/** Enough for a year of daily practice; the oldest go first. */
const MAX_RESULTS = 1000;

const storage = new LocalStorageWithSchema({
  key: "beartype:v1:results",
  schema: z.array(LocalResultSchema),
  fallback: [],
});

export function getResults(): LocalResult[] {
  return storage.get();
}

/**
 * The kind of round a test is, and the one thing its figures are compared
 * against: 10 words is not read against 60 seconds, nor a text run for 30
 * seconds against the same text run through once. A word list round is its
 * mode and length (`time 30`, `words 10`); a text round is `custom` with how
 * long the text was set to run (`custom time 30`, `custom words 25`,
 * `custom text`).
 */
export function testShape(
  mode: string,
  time: number,
  words: number,
  textLength: "time" | "words" | "text",
): string {
  if (mode === "custom") {
    if (textLength === "text") return "custom text";
    return `custom ${textLength} ${textLength === "time" ? time : words}`;
  }
  return `${mode} ${mode === "time" ? time : words}`;
}

/**
 * The shape a kept result was. One kept before shapes were stored is read off
 * its mode, which says it all for the word list; a text round from then
 * stored only `custom` and matches no shape of today.
 */
function shapeOf(r: LocalResult): string {
  return r.shape ?? `${r.mode} ${r.mode2}`;
}

/**
 * Keeps a test. `pool` stands in for its language when the words were not
 * the word list's: a saved text's rounds are kept under the text's own pool.
 */
export function saveResult(
  event: CompletedEvent,
  shape: string,
  pool: string = event.language,
): void {
  const results = storage.get();
  results.push({
    timestamp: event.timestamp,
    mode: event.mode,
    mode2: event.mode2,
    language: pool,
    wpm: event.wpm,
    acc: event.acc,
    rawWpm: event.rawWpm,
    consistency: event.consistency,
    testDuration: event.testDuration,
    afkDuration: event.afkDuration,
    incompleteTestSeconds: event.incompleteTestSeconds,
    shape,
  });
  storage.set(results.slice(-MAX_RESULTS));
}

/** Throws away every test in a pool: a saved text deleted takes its rounds. */
export function forgetPool(pool: string): void {
  storage.set(storage.get().filter((r) => statsLanguage(r.language) !== pool));
}

/** How many tests a pool holds. */
export function countIn(pool: string): number {
  return matching(pool).length;
}

/** Every test in `language`'s pool, whatever its mode and length. */
function matching(language: string): LocalResult[] {
  const pool = statsLanguage(language);
  return storage.get().filter((r) => statsLanguage(r.language) === pool);
}

/** Every test in `language`'s pool of the same shape (see `testShape`). */
function matchingShape(language: string, shape: string): LocalResult[] {
  return matching(language).filter((r) => shapeOf(r) === shape);
}

/**
 * Upstream's `DB.getLocalPB`, one best per language and shape, as upstream
 * keeps one per mode and length: the crown agrees with the best figure the
 * result screen prints under it.
 */
export function getLocalPB(
  language: string,
  shape: string,
): { wpm: number; acc: number } | undefined {
  let best: LocalResult | undefined;
  for (const r of matchingShape(language, shape)) {
    if (best === undefined || r.wpm > best.wpm) {
      best = r;
    }
  }
  return best === undefined ? undefined : { wpm: best.wpm, acc: best.acc };
}

/** How many recent tests the result screen draws a bar for. */
const RECENT = 20;

/**
 * The usual figures are read over enough rounds to hold about this many
 * words: twenty 10-word sprints are two minutes of typing and their median
 * still swings by luck, while twenty one-minute tests are twenty minutes and
 * hold steady. So the window grows for short rounds, from `RECENT` up to
 * `USUAL_MAX`, never past it: a window of a week's rounds lags behind hands
 * that are getting faster, and the pace caret runs on it.
 */
const USUAL_WORDS = 500;
const USUAL_MAX = 50;

/** Words a round held, from its speed and length. */
function wordsTyped(t: RecentTest): number {
  return (t.wpm * t.testDuration) / 60;
}

/**
 * The last rounds the usual figures read: back from the newest until they
 * hold `USUAL_WORDS` words, at least `RECENT` of them and at most
 * `USUAL_MAX`.
 */
function usualWindow(tests: RecentTest[]): RecentTest[] {
  let words = 0;
  let count = 0;
  for (let i = tests.length - 1; i >= 0 && count < USUAL_MAX; i--) {
    if (count >= RECENT && words >= USUAL_WORDS) break;
    words += wordsTyped(tests[i] as RecentTest);
    count++;
  }
  return tests.slice(-count);
}

export type RecentTest = {
  wpm: number;
  acc: number;
  consistency: number;
  timestamp: number;
  mode: string;
  mode2: string;
  testDuration: number;
};

export type RecentSummary = {
  best: number;
  usual: number;
  usualAcc: number;
  usualConsistency: number;
  /** How many rounds the usual figures were read over. */
  usualCount: number;
  /**
   * Seconds typed over every test in this language, whatever its shape, not
   * only the ones drawn.
   * Tests run from ten words to two minutes, so a count of them says little
   * about how much practice went in; the time does.
   */
  practiceSeconds: number;
  /** The last `RECENT` tests, oldest first, the one just typed last. */
  recent: RecentTest[];
};

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[middle] as number)
    : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

/**
 * The practice time over every test in the same language, whatever its mode
 * and length (see `statsLanguage`), and the best and the last `RECENT` over
 * the tests of the same shape only (see `testShape`): the speed of a 10-word
 * sprint swings over a wide range and runs well above what the hands hold
 * for a minute, so set against a mix of both it reads as nothing. The usual
 * figures come from the last few only (see `usualWindow`): over hundreds of
 * tests a median no longer moves, and it should say how fast you type now,
 * not since the first day. `current` is
 * included -- it is not saved until the result screen has been drawn; `null`
 * when it will not be saved at all.
 * "Usual" is the median: one interrupted test should not drag it down the way
 * it drags a mean.
 */
export function recentSummary(
  language: string,
  shape: string,
  current: RecentTest | null,
): RecentSummary | null {
  const tests: RecentTest[] = matchingShape(language, shape).map(
    ({ wpm, acc, consistency, timestamp, mode, mode2, testDuration }) => ({
      wpm,
      acc,
      consistency,
      timestamp,
      mode,
      mode2,
      testDuration,
    }),
  );
  if (current !== null) tests.push(current);
  if (tests.length === 0) return null;
  const recent = tests.slice(-RECENT);
  const usual = usualWindow(tests);
  const practised = [
    ...matching(language),
    ...(current === null ? [] : [current]),
  ];
  return {
    best: Math.max(...tests.map((t) => t.wpm)),
    usual: median(usual.map((t) => t.wpm)),
    usualAcc: median(usual.map((t) => t.acc)),
    usualConsistency: median(usual.map((t) => t.consistency)),
    usualCount: usual.length,
    practiceSeconds: practised.reduce((sum, t) => sum + t.testDuration, 0),
    recent,
  };
}

export const __testing = {
  reset: (): void => {
    storage.set([]);
  },
};
