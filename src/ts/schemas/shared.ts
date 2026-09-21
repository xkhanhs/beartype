import { literal, z } from "zod";
import { StringNumberSchema } from "./util";

/**
 * A person picks time or words (`MODES` in `beartype/config-lock.ts`). Custom
 * is the drills': `test/practise-words.ts#initFromWords` sets it directly,
 * unsaved, to run a shuffled test of the words kept being missed, or of the
 * words typed right but slowly.
 */
export const ModeSchema = z.enum(["time", "words", "custom"]);
export type Mode = z.infer<typeof ModeSchema>;

export const Mode2Schema = z.union([StringNumberSchema, literal("custom")], {
  errorMap: () => ({
    message: 'Needs to be either a number or "custom".',
  }),
});

/** The test length as text: seconds or words, or "custom" for a drill. */
export type Mode2<M extends Mode> = M extends "custom" ? "custom" : string;
