import type { Grams, Layout, Page } from "./transition-book";

/**
 * Which **kind** a key move is, by the layout's real geometry: an ANSI
 * row-staggered board, fingers by column. Ported from keybear
 * (`colemak/transition-kinds.ts`, `practice/keyboard-layouts.ts`); keep the
 * kinds and the layout rows in step, so the hand's measurements and keybear's
 * layout model speak the same language.
 *
 * - `sfb-near` / `sfb-far`: two keys, one finger. Split by distance, because
 *   the hands here find `eu` (next key, one row apart) easy and a jump from
 *   top row to bottom row not;
 * - `scissor`: two neighbouring fingers where the longer one (middle, ring)
 *   reaches to the lower row -- `tr` on DH-Việt;
 * - `roll-in` / `roll-out`: one hand, two fingers, towards the index or away;
 * - `alternate`: the other hand; `repeat`: the same key again (`dd`, `ee`).
 *
 * For triples: `redirect` is one hand changing direction, `sfs` the first and
 * last key on one finger, `roll` one hand one way, `alternate` two hand
 * switches, `split` the rest (two keys one hand, one the other).
 */
export type BigramKind =
  | "sfb-far"
  | "sfb-near"
  | "scissor"
  | "roll-in"
  | "roll-out"
  | "alternate"
  | "repeat";

export type TrigramKind = "redirect" | "sfs" | "roll" | "split" | "alternate";

const BIGRAM_KINDS: readonly BigramKind[] = [
  "sfb-far",
  "sfb-near",
  "scissor",
  "roll-in",
  "roll-out",
  "alternate",
  "repeat",
];

const TRIGRAM_KINDS: readonly TrigramKind[] = [
  "redirect",
  "sfs",
  "roll",
  "split",
  "alternate",
];

/**
 * The letter rows of each layout, blanks as `.`, so an index in a row is the
 * column on the board. Copied from keybear's `keyboard-layouts.ts`.
 */
const ROWS: Record<Layout, readonly [string, string, string]> = {
  "dh-viet": ["qwfgb.luyx", "ahstpmneoi", "jvrczkd..."],
  "dh-viet-vb": ["qwfgb.luyx", "ahstpmneoi", "jzrcvkd..."],
  "dh-viet-vt": ["qwfgv.luyx", "ahstpmneoi", "jbrczkd..."],
};

/** How far each row starts to the right, in keys: ANSI's stagger. */
const ROW_OFFSETS = [0, 0.25, 0.75] as const;

/** Finger of each column, 0 left pinky to 7 right pinky. */
const COLUMN_FINGERS = [0, 1, 2, 3, 3, 4, 4, 5, 6, 7] as const;

type Place = { row: number; x: number; finger: number };

const placeCache = new Map<Layout, ReadonlyMap<string, Place>>();

function placesOf(layout: Layout): ReadonlyMap<string, Place> {
  let places = placeCache.get(layout);
  if (places === undefined) {
    const next = new Map<string, Place>();
    ROWS[layout].forEach((chars, row) => {
      [...chars].forEach((label, column) => {
        if (label !== ".") {
          next.set(label, {
            row,
            x: column + (ROW_OFFSETS[row] ?? 0),
            finger: COLUMN_FINGERS[column] ?? 0,
          });
        }
      });
    });
    placeCache.set(layout, (places = next));
  }
  return places;
}

const leftHand = (place: Place): boolean => place.finger < 4;
/** Middle and ring fingers are longer than index and pinky. */
const longFinger = (place: Place): boolean =>
  [1, 2, 5, 6].includes(place.finger);
const distance = (a: Place, b: Place): number =>
  Math.hypot(a.x - b.x, a.row - b.row);

/** Next key or a jump: one row off is ~1.03 keys, diagonal ~1.12. */
const NEAR = 1.3;

export function bigramKind(gram: string, layout: Layout): BigramKind | null {
  const places = placesOf(layout);
  const [first = "", second = ""] = [...gram];
  const a = places.get(first);
  const b = places.get(second);
  if (a === undefined || b === undefined) return null;
  if (first === second) return "repeat";
  if (leftHand(a) !== leftHand(b)) return "alternate";
  if (a.finger === b.finger) {
    return distance(a, b) < NEAR ? "sfb-near" : "sfb-far";
  }
  if (Math.abs(a.finger - b.finger) === 1 && a.row !== b.row) {
    const [lower, upper] = a.row > b.row ? [a, b] : [b, a];
    if (longFinger(lower) && !longFinger(upper)) return "scissor";
  }
  // Inward is towards the index: left hand rightwards, right hand leftwards.
  const inward = leftHand(a) ? b.finger > a.finger : b.finger < a.finger;
  return inward ? "roll-in" : "roll-out";
}

export function trigramKind(gram: string, layout: Layout): TrigramKind | null {
  const places = placesOf(layout);
  const letters = [...gram];
  const [a, b, c] = letters.map((char) => places.get(char));
  if (a === undefined || b === undefined || c === undefined) return null;
  if (
    letters[0] !== letters[2] &&
    a.finger === c.finger &&
    b.finger !== a.finger
  ) {
    return "sfs";
  }
  const [ha, hb, hc] = [leftHand(a), leftHand(b), leftHand(c)];
  if (ha !== hb && hb !== hc) return "alternate";
  if (
    ha === hb &&
    hb === hc &&
    a.finger !== b.finger &&
    b.finger !== c.finger &&
    a.finger !== c.finger
  ) {
    return (b.finger - a.finger) * (c.finger - b.finger) < 0
      ? "redirect"
      : "roll";
  }
  return "split";
}

/**
 * A move against **this hand's usual pace** on the layout, never raw
 * milliseconds: hands learning a layout get faster by the week, and only a
 * ratio compares this week with next month. The usual pace is the mean over
 * every move of the same size (pairs against pairs, triples against triples),
 * repeats left out -- the same key again is far faster than any real move and
 * would pull the bar down under everything else.
 */
export type Row<K> = {
  kind: K;
  /** Share of all moves for a kind; times seen for a single move. */
  count: number;
  ms: number;
  /** Divided by the usual pace: `1.3` is 30% slower than usual. */
  relative: number;
  missRate: number;
};

export type GramRow<K> = Row<K> & { gram: string };

/** A move has to be timed this often to be ranked. */
const MIN_TIMED = 6;

function summarize<K extends string>(
  grams: Grams,
  kindOf: (gram: string) => K | null,
  kinds: readonly K[],
  inBaseline: (gram: string) => boolean,
): { kinds: Row<K>[]; slowest: GramRow<K>[] } {
  let baseMs = 0;
  let baseTimed = 0;
  for (const [gram, [, ms, timed]] of Object.entries(grams)) {
    if (inBaseline(gram)) {
      baseMs += ms;
      baseTimed += timed;
    }
  }
  const baseline = baseTimed > 0 ? baseMs / baseTimed : 0;
  const totals = new Map<K, [number, number, number, number]>();
  const slowest: GramRow<K>[] = [];
  let all = 0;
  for (const [gram, [seen, ms, timed, missed]] of Object.entries(grams)) {
    const kind = kindOf(gram);
    if (kind === null) continue;
    all += seen;
    const [s, m, t, x] = totals.get(kind) ?? [0, 0, 0, 0];
    totals.set(kind, [s + seen, m + ms, t + timed, x + missed]);
    if (timed >= MIN_TIMED && baseline > 0) {
      slowest.push({
        gram,
        kind,
        count: seen,
        ms: ms / timed,
        relative: ms / timed / baseline,
        missRate: seen > 0 ? missed / seen : 0,
      });
    }
  }
  return {
    kinds: kinds.flatMap((kind) => {
      const total = totals.get(kind);
      if (total === undefined || total[2] === 0 || baseline === 0) return [];
      const [seen, ms, timed, missed] = total;
      return [
        {
          kind,
          count: all > 0 ? seen / all : 0,
          ms: ms / timed,
          relative: ms / timed / baseline,
          missRate: seen > 0 ? missed / seen : 0,
        },
      ];
    }),
    slowest: slowest.sort((x, y) => y.relative - x.relative),
  };
}

/** A page read by kind of move and by its slowest moves. */
export function transitionReport(
  page: Page,
  layout: Layout,
): {
  bigrams: ReturnType<typeof summarize<BigramKind>>;
  trigrams: ReturnType<typeof summarize<TrigramKind>>;
} {
  return {
    bigrams: summarize(
      page.bigrams,
      (gram) => bigramKind(gram, layout),
      BIGRAM_KINDS,
      (gram) => new Set(gram).size > 1,
    ),
    trigrams: summarize(
      page.trigrams,
      (gram) => trigramKind(gram, layout),
      TRIGRAM_KINDS,
      () => true,
    ),
  };
}
