import { literal, z } from "zod";
import { StringNumberSchema } from "./util";
import { LanguageSchema } from "./languages";

//used by config and shared
export const DifficultySchema = z.enum(["normal", "expert", "master"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

//used by user and config
export const PersonalBestSchema = z.object({
  acc: z.number().nonnegative().max(100),
  consistency: z.number().nonnegative().max(100),
  difficulty: DifficultySchema,
  lazyMode: z.boolean().optional(),
  language: LanguageSchema,
  punctuation: z.boolean().optional(),
  numbers: z.boolean().optional(),
  raw: z.number().nonnegative(),
  wpm: z.number().nonnegative(),
  timestamp: z.number().nonnegative(),
});
export type PersonalBest = z.infer<typeof PersonalBestSchema>;

//used by user and config
export const PersonalBestsSchema = z.object({
  time: z.record(
    StringNumberSchema.describe("Number of seconds as string"),
    z.array(PersonalBestSchema),
  ),
  words: z.record(
    StringNumberSchema.describe("Number of words as string"),
    z.array(PersonalBestSchema),
  ),
  quote: z.record(StringNumberSchema, z.array(PersonalBestSchema)),
  custom: z.record(z.literal("custom"), z.array(PersonalBestSchema)),
  zen: z.record(z.literal("zen"), z.array(PersonalBestSchema)),
});
export type PersonalBests = z.infer<typeof PersonalBestsSchema>;

export const DefaultWordsModeSchema = z.union([
  z.literal("10"),
  z.literal("25"),
  z.literal("50"),
  z.literal("100"),
]);

export const DefaultTimeModeSchema = z.union([
  z.literal("15"),
  z.literal("30"),
  z.literal("60"),
  z.literal("120"),
]);

export const QuoteLengthSchema = z.union([
  z.literal("short"),
  z.literal("medium"),
  z.literal("long"),
  z.literal("thicc"),
]);

/**
 * beartype: quote and zen are gone (dead under `lockConfig`'s MODES). Custom
 * stays -- it is not user-reachable either, but the miss-book drill
 * (`beartype/miss-book.ts`, `test/practise-words.ts#initFromWords`) sets it
 * directly to run a shuffled test of the words this pair of hands keeps
 * missing, bypassing the lock the way `nosave` config changes always could.
 */
export const ModeSchema = z.enum(["time", "words", "custom"]);
export type Mode = z.infer<typeof ModeSchema>;

export const Mode2Schema = z.union([StringNumberSchema, literal("custom")], {
  errorMap: () => ({
    message: 'Needs to be either a number or "custom".',
  }),
});

export type Mode2<M extends Mode> = M extends M
  ? keyof PersonalBests[M]
  : never;
