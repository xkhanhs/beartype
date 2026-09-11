// Ported from keybear (packages/page-practice/lib/typetest/miss-book.ts),
// without the per-child profiles. Keep the rules in step.
import { createSignal } from "solid-js";
import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { compareWord, inTargetStyle } from "./scoring";
import { statsLanguage } from "./stats-language";

/**
 * The book of **words** this pair of hands keeps missing, to type them again
 * on their own.
 *
 * Words, not letters: the stumble is usually a join rather than a key --
 * `nghiêng` is only hard where `iê` meets `ng`, and drilling `ê` alone never
 * touches that. A word committed without its marks counts as missed: the mark
 * really was dropped. Kept per language, since a drill that jumps between
 * Vietnamese and English jumps between two input methods -- and only per
 * language: a word missed in a time test is drilled with those from a words
 * test.
 */
const MissWordSchema = z.object({
  /** Right-typed rounds still owed before the word leaves the book. */
  n: z.number(),
  /** The last time it was missed, `Date.now` scale. */
  at: z.number(),
});

type MissWord = z.infer<typeof MissWordSchema>;
type MissPage = Record<string, MissWord>;
type MissBook = Record<string, MissPage>;

/**
 * Missing a word many times makes it owe more, up to a cap: a word owing
 * twenty would stay all year, and a book that never empties makes a drill
 * that never changes.
 */
const MAX_DEBT = 3;

/** Words kept per language; past that the longest-untouched one goes. */
const MAX_WORDS = 60;

/** Below this there are not enough words to build a drill from. */
export const MIN_DRILL_WORDS = 4;

const storage = new LocalStorageWithSchema<MissBook>({
  key: "beartype:v1:missbook",
  schema: z.record(z.record(MissWordSchema)),
  fallback: {},
});

const [book, setBook] = createSignal<MissBook>(storage.get());

/**
 * The page for `language`'s pool (see `statsLanguage`): one for Vietnamese
 * and one for English, merged from any page a browser still keeps under an
 * old list's name. A word on two of them keeps the larger debt.
 */
function pageOf(current: MissBook, language: string): MissPage {
  const pool = statsLanguage(language);
  const page: MissPage = {};
  for (const [name, words] of Object.entries(current)) {
    if (statsLanguage(name) !== pool) continue;
    for (const [word, entry] of Object.entries(words)) {
      const kept = page[word];
      if (kept === undefined || entry.n > kept.n) page[word] = entry;
    }
  }
  return page;
}

/** The book's words for a language, the ones owing most first. */
export function missWords(language: string): string[] {
  return Object.entries(pageOf(book(), language))
    .sort((a, b) => b[1].n - a[1].n || b[1].at - a[1].at)
    .map(([word]) => word);
}

/** Whether the word came out wrong anywhere -- a missing mark included. */
function missed(target: string, typed: string): boolean {
  return compareWord(target, inTargetStyle(target, typed)).some(
    ({ state }) => state !== "correct" && state !== "pending",
  );
}

/**
 * When the book is full the word stumbled on longest ago leaves, not the one
 * owing least: a word owing once from today is still a stumble, one owing
 * three times from last month has passed.
 */
function evict(page: MissPage): MissPage {
  const entries = Object.entries(page);
  if (entries.length <= MAX_WORDS) {
    return page;
  }
  return Object.fromEntries(
    entries.sort((a, b) => b[1].at - a[1].at).slice(0, MAX_WORDS),
  );
}

/**
 * A page of the book after a round: a word typed wrong owes one more, a word
 * owing and typed right owes one less, and paid off it leaves. `typed[i]` is
 * what was committed for `words[i]`; only committed words are passed in, since
 * the word the clock cut short says nothing about the hands.
 *
 * `stumbled[i]` says a wrong key went into `words[i]` on the way, even if it
 * was rubbed out before the space. keybear's test has no backspace, so there
 * a stumble always shows in what is committed; here the typist fixes it and
 * commits the word right, and a book that only read the committed word stayed
 * empty for anyone who corrects as they go.
 */
export function applyMisses(
  page: MissPage,
  words: readonly string[],
  typed: readonly string[],
  now: number,
  stumbled: readonly boolean[] = [],
): MissPage {
  const next: MissPage = { ...page };
  for (let index = 0; index < typed.length; index++) {
    const target = words[index];
    const value = typed[index];
    if (target === undefined || value === undefined) continue;
    const owing = next[target];
    if (stumbled[index] === true || missed(target, value)) {
      next[target] = { n: Math.min((owing?.n ?? 0) + 1, MAX_DEBT), at: now };
    } else if (owing !== undefined) {
      if (owing.n > 1) {
        next[target] = { n: owing.n - 1, at: owing.at };
      } else {
        // oxlint-disable-next-line typescript/no-dynamic-delete
        delete next[target];
      }
    }
  }
  return evict(next);
}

/** Writes a finished round into the book. */
export function recordMisses(
  language: string,
  words: readonly string[],
  typed: readonly string[],
  stumbled: readonly boolean[],
): void {
  const current = book();
  const pool = statsLanguage(language);
  const page = applyMisses(
    pageOf(current, pool),
    words,
    typed,
    Date.now(),
    stumbled,
  );
  // the merged page replaces every page it was merged from
  const next: MissBook = { [pool]: page };
  for (const [name, other] of Object.entries(current)) {
    if (statsLanguage(name) !== pool) next[name] = other;
  }
  storage.set(next);
  setBook(next);
}

/**
 * The words a round actually committed, ready for `recordMisses`. A word is
 * committed by its trailing space -- or, for the last word of a words test,
 * by being typed in full, since that test ends without one. `stumbledAt`
 * holds the indices of the words a wrong key went into.
 */
export function committedWords(
  targets: readonly string[],
  history: readonly string[],
  stumbledAt: ReadonlySet<number> = new Set(),
): { words: string[]; typed: string[]; stumbled: boolean[] } {
  const words: string[] = [];
  const typed: string[] = [];
  const stumbled: boolean[] = [];
  history.forEach((input, index) => {
    const target = targets[index];
    if (target === undefined) return;
    const bare = input.replace(/[ \n]$/, "");
    const isLast = index === history.length - 1;
    const complete = inTargetStyle(target, bare) === target;
    if (bare !== input || (isLast && complete)) {
      words.push(target);
      typed.push(bare);
      stumbled.push(stumbledAt.has(index));
    }
  });
  return { words, typed, stumbled };
}
