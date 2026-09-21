import { createSignal } from "solid-js";
import { z } from "zod";
import type { TestEventNoMs } from "../test/events/types";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { median } from "./local-results";
import { inTargetStyle, wordCost } from "./scoring";
import { statsLanguage } from "./stats-language";

/**
 * The book of words this pair of hands types **right but slowly**, to type
 * them again on their own.
 *
 * The miss book (`miss-book.ts`) holds the words that come out wrong. This one
 * never sees them: a word only gives a speed when it went in clean -- no wrong
 * key on the way, none rubbed out -- because the question is "how fast am I
 * when I get it", and fumbles counted in would drag every figure down.
 *
 * Slow is measured against **this typist**, not a fixed number: a word is
 * slow when it runs well under the typist's own median. A fixed bar is right
 * for about a week; then the hands are faster and it says nothing. Taken from
 * keybear's Colemak screen (`colemak/word-speed.ts`), without its FSRS
 * schedule: with a few hundred words to a list, random picking already meets
 * each of them often, and a schedule would have nothing left to order.
 */

/**
 * A word's time runs from the commit of the word before to its own, so it
 * holds the step between words too -- reading the next one, lifting the
 * hands -- which is where a real hesitation often sits. That step costs about
 * the same for every word, so per key a short word always looks slower than a
 * long one. Each word is therefore held against the words that cost **the
 * same number of keys**, not against one median for all: with a single bar
 * the book fills up with `à`, `có` and `the`.
 */

/** Samples kept per word; newer ones push older ones out. */
const PER_WORD = 5;

/**
 * Fewer samples than this and a word is not judged: one hesitation on one
 * typing is a slip, not a slow word.
 */
const MIN_WORD_SAMPLES = 3;

/**
 * Clean words kept for the bar, per language. Enough for a median per key
 * count, and recent enough that the bar is the hands of today.
 */
const RECENT = 500;

/** Under this many recent samples there is no bar yet, and no slow word. */
const MIN_BAR_SAMPLES = 100;

/** A key count with fewer samples than this borrows from its neighbours. */
const MIN_BUCKET = 20;

/**
 * Slow is under this share of the bar. Not the bar itself: by definition
 * half of everything sits under a median, and a book that always holds half
 * the words points at nothing.
 */
const SLOW_BELOW = 0.85;

const SlowPageSchema = z.object({
  /** The last speeds of each word, oldest first, wpm. */
  words: z.record(z.array(z.number())),
  /** The last clean words of any kind, as `[keys, wpm]`, oldest first. */
  recent: z.array(z.tuple([z.number(), z.number()])),
});

type SlowPage = z.infer<typeof SlowPageSchema>;
type SlowBook = Record<string, SlowPage>;

/** A clean word and how fast it went in, wpm at five keys a word. */
export type WordSpeed = { word: string; wpm: number };

const EMPTY: SlowPage = { words: {}, recent: [] };

const storage = new LocalStorageWithSchema<SlowBook>({
  key: "beartype:v1:slowbook",
  schema: z.record(SlowPageSchema),
  fallback: {},
});

const [book, setBook] = createSignal<SlowBook>(storage.get());

/**
 * The speed of each word a round committed clean. `history[i]` is what was
 * typed for `targets[i]`, `events` the round's event log and `stumbledAt` the
 * words a wrong key went into.
 *
 * A word is left out when there is nothing true to measure: the first word,
 * which has no commit before it; a word typed wrong or fixed on the way; a
 * word the typist came back to after committing it; a time of zero, which is
 * a whole run arriving at once from the input method; and the word the clock
 * cut short.
 */
export function wordSpeeds(
  targets: readonly string[],
  history: readonly string[],
  events: readonly TestEventNoMs[],
  stumbledAt: ReadonlySet<number>,
): WordSpeed[] {
  const commits = commitTimes(history, targets, events);
  const speeds: WordSpeed[] = [];
  for (let index = 1; index < history.length; index++) {
    const target = targets[index];
    const at = commits.get(index);
    const before = commits.get(index - 1);
    if (target === undefined || at === undefined || before === undefined) {
      continue;
    }
    const typed = (history[index] ?? "").replace(/[ \n]$/, "");
    if (stumbledAt.has(index) || inTargetStyle(target, typed) !== target) {
      continue;
    }
    const ms = at - before;
    if (!(ms > 0)) continue;
    const wpm = wordCost(target) / 5 / (ms / 60000);
    speeds.push({ word: target, wpm: Math.round(wpm * 10) / 10 });
  }
  return speeds;
}

/**
 * When each word was committed, on the test clock: its space, or for the
 * last word of a words test -- which ends without one -- the key that
 * finished it. A word typed into again after its commit has no time, nor
 * does one with input the app made up itself.
 */
function commitTimes(
  history: readonly string[],
  targets: readonly string[],
  events: readonly TestEventNoMs[],
): Map<number, number> {
  const commits = new Map<number, number>();
  const spoilt = new Set<number>();
  const lastInput = new Map<number, number>();
  for (const event of events) {
    if (event.type !== "input") continue;
    const { wordIndex } = event.data;
    if (event.data.automatic === true || commits.has(wordIndex)) {
      spoilt.add(wordIndex);
    }
    lastInput.set(wordIndex, event.testMs);
    if (
      event.data.inputType === "insertText" &&
      event.data.commitsWord === true &&
      !commits.has(wordIndex)
    ) {
      commits.set(wordIndex, event.testMs);
    }
  }
  const last = history.length - 1;
  const lastTarget = targets[last];
  const lastAt = lastInput.get(last);
  if (
    !commits.has(last) &&
    lastTarget !== undefined &&
    lastAt !== undefined &&
    inTargetStyle(lastTarget, history[last] ?? "") === lastTarget
  ) {
    commits.set(last, lastAt);
  }
  for (const index of spoilt) commits.delete(index);
  return commits;
}

/**
 * The bar a word costing `keys` is held against: the median speed of the
 * recent clean words that cost as much, widened to the key counts either
 * side until there are enough of them. `null` while there are too few
 * samples to have a bar at all.
 */
export function barFor(
  keys: number,
  recent: readonly (readonly [number, number])[],
): number | null {
  if (recent.length < MIN_BAR_SAMPLES) return null;
  for (let reach = 0; ; reach++) {
    const near = recent
      .filter(([cost]) => Math.abs(cost - keys) <= reach)
      .map(([, wpm]) => wpm);
    if (near.length >= MIN_BUCKET || near.length === recent.length) {
      return median(near);
    }
  }
}

/** The page after a round: each word's new speeds, and the bar's. */
export function addSpeeds(
  page: SlowPage,
  speeds: readonly WordSpeed[],
): SlowPage {
  const words = { ...page.words };
  const recent = [...page.recent];
  for (const { word, wpm } of speeds) {
    words[word] = [...(words[word] ?? []), wpm].slice(-PER_WORD);
    recent.push([wordCost(word), wpm]);
  }
  return { words, recent: recent.slice(-RECENT) };
}

/**
 * The slow words of a page, slowest against its bar first. A word leaves by
 * itself: typed at pace again, its newer speeds lift its median past the bar.
 */
export function slowIn(page: SlowPage): string[] {
  const slow: [string, number][] = [];
  for (const [word, speeds] of Object.entries(page.words)) {
    if (speeds.length < MIN_WORD_SAMPLES) continue;
    const bar = barFor(wordCost(word), page.recent);
    if (bar === null || bar <= 0) continue;
    const share = median(speeds) / bar;
    if (share < SLOW_BELOW) slow.push([word, share]);
  }
  return slow.sort((a, b) => a[1] - b[1]).map(([word]) => word);
}

function pageOf(language: string): SlowPage {
  return book()[statsLanguage(language)] ?? EMPTY;
}

/** The slow words for a language, slowest first. */
export function slowWords(language: string): string[] {
  return slowIn(pageOf(language));
}

/** How many words of a language have been typed enough to be judged. */
export function measuredCount(language: string): number {
  return Object.values(pageOf(language).words).filter(
    (speeds) => speeds.length >= MIN_WORD_SAMPLES,
  ).length;
}

/** Writes a finished round's speeds into the book. */
export function recordSpeeds(
  language: string,
  speeds: readonly WordSpeed[],
): void {
  if (speeds.length === 0) return;
  const pool = statsLanguage(language);
  const next = { ...book(), [pool]: addSpeeds(pageOf(pool), speeds) };
  storage.set(next);
  setBook(next);
}
