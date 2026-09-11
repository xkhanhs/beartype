import { z } from "zod";
import { DifficultySchema, ModeSchema } from "@monkeytype/schemas/shared";
import type { CompletedEvent } from "@monkeytype/schemas/results";
import type { Difficulty, Mode, Mode2 } from "@monkeytype/schemas/shared";
import type { FunboxMetadata } from "@monkeytype/funbox";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

/**
 * The result history, kept in this browser and nowhere else.
 *
 * Upstream keeps it on its server and reads it back as the account's
 * snapshot; the personal best, the pace caret's "average" and "pb", and the
 * "today" counter all come from there. beartype has no accounts, so this is
 * the one place those questions are answered.
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
  punctuation: z.boolean(),
  numbers: z.boolean(),
  difficulty: DifficultySchema,
  lazyMode: z.boolean(),
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
    punctuation: event.punctuation,
    numbers: event.numbers,
    difficulty: event.difficulty,
    lazyMode: event.lazyMode,
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
  punctuation: boolean;
  numbers: boolean;
  language: string;
  difficulty: Difficulty;
  lazyMode: boolean;
};

function matching(filter: SettingsFilter): LocalResult[] {
  return storage
    .get()
    .filter(
      (r) =>
        r.mode === filter.mode &&
        r.mode2 === filter.mode2 &&
        r.punctuation === filter.punctuation &&
        r.numbers === filter.numbers &&
        r.language === filter.language &&
        r.difficulty === filter.difficulty &&
        r.lazyMode === filter.lazyMode,
    );
}

/** Same contract as upstream's `DB.getLocalPB`. */
export function getLocalPB<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean,
  funboxes: FunboxMetadata[],
): { wpm: number; acc: number } | undefined {
  if (!funboxes.every((f) => f.canGetPb)) {
    return undefined;
  }
  let best: LocalResult | undefined;
  for (const r of matching({
    mode,
    mode2,
    punctuation,
    numbers,
    language,
    difficulty,
    lazyMode,
  })) {
    if (best === undefined || r.wpm > best.wpm) {
      best = r;
    }
  }
  return best === undefined ? undefined : { wpm: best.wpm, acc: best.acc };
}

function average(results: LocalResult[]): { wpm: number; acc: number } {
  if (results.length === 0) return { wpm: 0, acc: 0 };
  const sum = results.reduce(
    (acc, r) => ({ wpm: acc.wpm + r.wpm, acc: acc.acc + r.acc }),
    { wpm: 0, acc: 0 },
  );
  return { wpm: sum.wpm / results.length, acc: sum.acc / results.length };
}

/** Same contract as upstream's `getUserAverage10Once`. */
export async function getUserAverage10Once(
  filter: SettingsFilter,
): Promise<{ wpm: number; acc: number }> {
  return average(matching(filter).slice(-10));
}

/** Same contract as upstream's `getUserDailyBestOnce`. */
export async function getUserDailyBestOnce(
  filter: SettingsFilter,
): Promise<{ wpm: number; acc: number }> {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  let best: LocalResult | undefined;
  for (const r of matching(filter)) {
    if (r.timestamp >= since && (best === undefined || r.wpm > best.wpm)) {
      best = r;
    }
  }
  return best === undefined
    ? { wpm: 0, acc: 0 }
    : { wpm: best.wpm, acc: best.acc };
}
