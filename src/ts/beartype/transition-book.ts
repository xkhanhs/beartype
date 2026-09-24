import { createSignal } from "solid-js";
import { z } from "zod";
import type { TestEventNoMs } from "../test/events/types";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { telexKeysOf } from "./telex-keys";

/**
 * The book of **key moves**: how long each pair and each triple of Telex keys
 * typed in a row inside a word takes, and how often its last key misses.
 * Ported from keybear's Colemak screen (`colemak/transition-book.ts`); keep
 * the two in step, and the JSON they export the same shape.
 *
 * It answers what a layout model can only guess: which moves *these hands*
 * find hard. The frequency tables and cost grids of keybear's
 * `scripts/layout-eval-vi.mjs` are assumptions; this is a measurement, and
 * after some weeks of real typing it can correct them -- `exportBook`.
 *
 * **One page per layout**, picked on the result screen: the same two letters
 * are a different move on another layout. The browser cannot tell which
 * layout the system is on -- VTX sends every key with code 0 -- so the typist
 * says so.
 *
 * **Recent rounds weigh more.** Each round, the old figures are multiplied by
 * `DECAY` first: hands learning a layout get faster by the week, and a book
 * that only ever adds up keeps telling the story of the first week. At 0.98 a
 * round the last fifty or so carry most of the weight, and the book stays the
 * same size.
 *
 * Only Vietnamese rounds, and only keys inside a word: the space is the thumb,
 * not the layout, and across it the move is a pause between two words.
 */

export const LAYOUTS = ["dh-viet", "dh-viet-vb", "dh-viet-vt"] as const;
export type Layout = (typeof LAYOUTS)[number];

const DECAY = 0.98;

/** Moves seen fewer times than this (after decay) leave the book. */
const DROP_BELOW = 0.05;

/** `gram: [seen, ms, timed, missed]`: seen and timed are decayed counts. */
const GramsSchema = z.record(
  z.tuple([z.number(), z.number(), z.number(), z.number()]),
);

const PageSchema = z.object({
  rounds: z.number(),
  bigrams: GramsSchema,
  trigrams: GramsSchema,
});

const BookSchema = z.object({
  layout: z.enum(LAYOUTS),
  pages: z.record(PageSchema),
});

export type Grams = z.infer<typeof GramsSchema>;
export type Page = z.infer<typeof PageSchema>;
type Book = z.infer<typeof BookSchema>;

export const EMPTY_PAGE: Page = { rounds: 0, bigrams: {}, trigrams: {} };

const storage = new LocalStorageWithSchema<Book>({
  key: "beartype:v1:transitions",
  schema: BookSchema,
  fallback: { layout: "dh-viet", pages: {} },
});

const [book, setBook] = createSignal<Book>(storage.get());

/**
 * One key the typist pressed, as far as the event log can tell: `key` is
 * `null` where a run of keys breaks -- a new word, a correction, input the
 * app made up -- so no move is counted across it.
 */
export type Stroke =
  | { key: string; ms: number | null; miss: boolean }
  | { key: null };

const BREAK: Stroke = { key: null };

/** The Telex keys of a word as typed so far, `a` to `z` only. */
function keysOf(value: string): string[] {
  const keys: string[] = [];
  for (const char of value) {
    for (const key of telexKeysOf(char)) {
      const lower = key.toLowerCase();
      if (lower >= "a" && lower <= "z") keys.push(lower);
    }
  }
  return keys;
}

/**
 * The one key that turns `before` into `after`: `"same"` when the keys did
 * not change (an input method rewriting what is there, `too` into `tô`), or
 * `null` when it is not one key added -- a deletion, a jump of several.
 * Counted as a multiset, not a sequence: a tone typed at the end of a word
 * lands inside a letter (`tôt` plus `s` is `tốt`).
 */
function addedKey(
  before: readonly string[],
  after: readonly string[],
): string | "same" | null {
  const count = new Map<string, number>();
  for (const key of after) count.set(key, (count.get(key) ?? 0) + 1);
  for (const key of before) {
    const left = (count.get(key) ?? 0) - 1;
    if (left < 0) return null;
    count.set(key, left);
  }
  const extra = [...count].filter(([, n]) => n > 0);
  if (extra.length === 0) return "same";
  if (extra.length === 1 && extra[0]?.[1] === 1) return extra[0][0];
  return null;
}

/**
 * Input events that belong to one key press. An input method answers one key
 * with a burst -- delete the old letters, insert the new -- all on the same
 * clock tick, and only the state after the burst is the key's result.
 */
const SAME_PRESS_MS = 2;

/**
 * The keys of a round, recovered from its event log. The log holds no key
 * names (VTX sends every key with code 0), only what the input read after
 * each change, so a key is what the Telex keys of the word gained: `to` to
 * `tô` is `o`, `tôt` to `tốt` is `s`.
 */
export function strokesOf(events: readonly TestEventNoMs[]): Stroke[] {
  const strokes: Stroke[] = [];
  let word = -1;
  let keys: string[] = [];
  let lastAt: number | null = null;
  const inputs = events.filter((event) => event.type === "input");
  for (let index = 0; index < inputs.length; index++) {
    const event = inputs[index];
    if (event?.type !== "input") continue;
    // Fold the rest of this press's burst into it.
    let last = event;
    let miss = event.data.inputType === "insertText" && !event.data.correct;
    let automatic = event.data.automatic === true;
    for (;;) {
      const next = inputs[index + 1];
      if (
        next?.type !== "input" ||
        next.data.wordIndex !== event.data.wordIndex ||
        next.testMs - last.testMs > SAME_PRESS_MS
      ) {
        break;
      }
      last = next;
      miss ||= next.data.inputType === "insertText" && !next.data.correct;
      automatic ||= next.data.automatic === true;
      index++;
    }
    const after = keysOf(last.data.inputValue.trimEnd());
    if (event.data.wordIndex !== word) {
      word = event.data.wordIndex;
      keys = [];
      lastAt = null;
      strokes.push(BREAK);
    }
    const key = automatic ? null : addedKey(keys, after);
    keys = after;
    if (key === "same") continue;
    if (key === null) {
      strokes.push(BREAK);
      lastAt = null;
      continue;
    }
    strokes.push({
      key,
      ms: lastAt === null ? null : last.testMs - lastAt,
      miss,
    });
    lastAt = last.testMs;
    // A miss is followed by a correction: nothing after it is a clean move.
    if (miss) {
      strokes.push(BREAK);
      lastAt = null;
    }
  }
  return strokes;
}

type Sample = { gram: string; ms: number | null; miss: boolean };

/**
 * The pairs and triples in a run of strokes. A move's time runs from its
 * first key to its last; one ending on a miss counts as a miss with no time.
 */
export function movesOf(strokes: readonly Stroke[]): {
  bigrams: Sample[];
  trigrams: Sample[];
} {
  const bigrams: Sample[] = [];
  const trigrams: Sample[] = [];
  let run: { key: string; ms: number | null }[] = [];
  for (const stroke of strokes) {
    if (stroke.key === null) {
      run = [];
      continue;
    }
    const [second, first] = [run.at(-1), run.at(-2)];
    if (second !== undefined) {
      bigrams.push({
        gram: second.key + stroke.key,
        ms: stroke.miss ? null : stroke.ms,
        miss: stroke.miss,
      });
      if (first !== undefined) {
        trigrams.push({
          gram: first.key + second.key + stroke.key,
          ms:
            stroke.miss || stroke.ms === null || second.ms === null
              ? null
              : second.ms + stroke.ms,
          miss: stroke.miss,
        });
      }
    }
    run = [...run.slice(-1), { key: stroke.key, ms: stroke.ms }];
  }
  return { bigrams, trigrams };
}

function merge(grams: Grams, samples: readonly Sample[]): Grams {
  const next: Grams = {};
  for (const [gram, [seen, ms, timed, missed]] of Object.entries(grams)) {
    if (seen * DECAY >= DROP_BELOW) {
      next[gram] = [seen * DECAY, ms * DECAY, timed * DECAY, missed * DECAY];
    }
  }
  for (const { gram, ms, miss } of samples) {
    const [seen, total, timed, missed] = next[gram] ?? [0, 0, 0, 0];
    next[gram] = [
      seen + 1,
      total + (ms ?? 0),
      timed + (ms === null ? 0 : 1),
      missed + (miss ? 1 : 0),
    ];
  }
  // Rounded so the book stays small; the figures are averages of many.
  for (const [gram, [seen, ms, timed, missed]] of Object.entries(next)) {
    next[gram] = [round2(seen), Math.round(ms), round2(timed), round2(missed)];
  }
  return next;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** A page with one more round in it. A round with no pair leaves it as is. */
export function addRound(page: Page, events: readonly TestEventNoMs[]): Page {
  const { bigrams, trigrams } = movesOf(strokesOf(events));
  if (bigrams.length === 0) return page;
  return {
    rounds: page.rounds + 1,
    bigrams: merge(page.bigrams, bigrams),
    trigrams: merge(page.trigrams, trigrams),
  };
}

/** The layout the typist says the system is on. */
export function currentLayout(): Layout {
  return book().layout;
}

export function setCurrentLayout(layout: Layout): void {
  const next = { ...book(), layout };
  storage.set(next);
  setBook(next);
}

export function pageFor(layout: Layout): Page {
  return book().pages[layout] ?? EMPTY_PAGE;
}

/** Writes a finished Vietnamese round into the page of the current layout. */
export function recordTransitions(events: readonly TestEventNoMs[]): void {
  const layout = currentLayout();
  const page = addRound(pageFor(layout), events);
  if (page === pageFor(layout)) return;
  const next = { ...book(), pages: { ...book().pages, [layout]: page } };
  storage.set(next);
  setBook(next);
}

/**
 * A page as JSON for keybear's layout model: the same shape keybear's
 * Colemak screen exports, `gram: [seen, ms, timed, missed]`.
 */
export function exportPage(layout: Layout): string {
  const page = pageFor(layout);
  return JSON.stringify({ variant: layout, source: "beartype", ...page });
}
