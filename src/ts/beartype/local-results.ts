import { z } from "zod";
import { ModeSchema } from "../schemas/shared";
import type { CompletedEvent } from "../schemas/results";
import type { Mode, Mode2 } from "../schemas/shared";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

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

export function saveResult(event: CompletedEvent): void {
  const results = storage.get();
  results.push({
    timestamp: event.timestamp,
    mode: event.mode,
    mode2: event.mode2,
    language: event.language,
    wpm: event.wpm,
    acc: event.acc,
    rawWpm: event.rawWpm,
    consistency: event.consistency,
    testDuration: event.testDuration,
    afkDuration: event.afkDuration,
    incompleteTestSeconds: event.incompleteTestSeconds,
  });
  storage.set(results.slice(-MAX_RESULTS));
}

export type SettingsFilter = {
  mode: Mode;
  mode2: Mode2<Mode>;
  language: string;
};

function matching(filter: SettingsFilter): LocalResult[] {
  return storage
    .get()
    .filter(
      (r) =>
        r.mode === filter.mode &&
        r.mode2 === filter.mode2 &&
        r.language === filter.language,
    );
}

/** Same contract as upstream's `DB.getLocalPB`. */
export function getLocalPB<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  language: string,
): { wpm: number; acc: number } | undefined {
  let best: LocalResult | undefined;
  for (const r of matching({
    mode,
    mode2,
    language,
  })) {
    if (best === undefined || r.wpm > best.wpm) {
      best = r;
    }
  }
  return best === undefined ? undefined : { wpm: best.wpm, acc: best.acc };
}

/** How many recent tests the result screen draws a bar for. */
const RECENT = 20;

export type RecentTest = { wpm: number; acc: number; timestamp: number };

export type RecentSummary = {
  best: number;
  usual: number;
  usualAcc: number;
  /** Every test with these settings, not only the ones drawn. */
  count: number;
  /** The last `RECENT` tests, oldest first, the one just typed last. */
  recent: RecentTest[];
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[middle] as number)
    : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

/**
 * The count, the best and the usual speed over every test with the same
 * settings, and the last `RECENT` of them for the chart, as keybear's
 * `testStats` does. `current` is included -- it is not saved until the
 * result screen has been drawn; `null` when it will not be saved at all.
 * "Usual" is the median: one interrupted test should not drag it down the way
 * it drags a mean.
 */
export function recentSummary(
  filter: SettingsFilter,
  current: RecentTest | null,
): RecentSummary | null {
  const tests: RecentTest[] = matching(filter).map(
    ({ wpm, acc, timestamp }) => ({ wpm, acc, timestamp }),
  );
  if (current !== null) tests.push(current);
  if (tests.length === 0) return null;
  const speeds = tests.map((t) => t.wpm);
  return {
    best: Math.max(...speeds),
    usual: median(speeds),
    usualAcc: median(tests.map((t) => t.acc)),
    count: tests.length,
    recent: tests.slice(-RECENT),
  };
}

export const __testing = {
  reset: (): void => {
    storage.set([]);
  },
};
