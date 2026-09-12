import { z } from "zod";
import {
  CustomTextLimitModeSchema,
  CustomTextModeSchema,
  IdSchema,
  PercentageSchema,
  token,
  WpmSchema,
} from "./util";
import { LanguageSchema } from "./languages";
import { Mode2Schema, ModeSchema } from "./shared";
import { ChallengeNameSchema } from "./challenges";

const IncompleteTestSchema = z.object({
  acc: PercentageSchema,
  seconds: z.number().nonnegative(),
});
export type IncompleteTest = z.infer<typeof IncompleteTestSchema>;

const ChartDataSchema = z.object({
  wpm: z.array(z.number().nonnegative()).max(122),
  burst: z.array(z.number().int().nonnegative()).max(122),
  err: z.array(z.number().nonnegative()).max(122),
});

const CompletedEventCustomTextSchema = z.object({
  textLen: z.number().int().nonnegative(),
  mode: CustomTextModeSchema,
  pipeDelimiter: z.boolean(),
  limit: z.object({
    mode: CustomTextLimitModeSchema,
    value: z.number().nonnegative(),
  }),
});
export type CompletedEventCustomText = z.infer<
  typeof CompletedEventCustomTextSchema
>;

export const CustomTextSettingsSchema = CompletedEventCustomTextSchema.omit({
  textLen: true,
}).extend({
  text: z.array(z.string()).min(1),
});

export type CustomTextSettings = z.infer<typeof CustomTextSettingsSchema>;

const CharStatsSchema = z.tuple([
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
]);

const ResultBaseSchema = z.object({
  wpm: WpmSchema,
  rawWpm: WpmSchema,
  charStats: CharStatsSchema,
  acc: PercentageSchema.min(50),
  mode: ModeSchema,
  mode2: Mode2Schema,
  timestamp: z.number().int().nonnegative(),
  testDuration: z.number().min(1),
  consistency: PercentageSchema,
  keyConsistency: PercentageSchema,
  chartData: ChartDataSchema.or(z.literal("toolong")),
  uid: IdSchema,

  //required on POST but optional in the database and might be removed to save space
  restartCount: z.number().int().nonnegative().optional(),
  incompleteTestSeconds: z.number().nonnegative().optional(),
  afkDuration: z.number().nonnegative().optional(),
  tags: z.array(IdSchema).optional(),
  language: LanguageSchema.optional(),
});

const CompletedEventSchema = ResultBaseSchema.required({
  restartCount: true,
  incompleteTestSeconds: true,
  afkDuration: true,
  tags: true,
  language: true,
})
  .extend({
    charTotal: z.number().int().nonnegative(),
    challenge: ChallengeNameSchema.optional(),
    customText: CompletedEventCustomTextSchema.optional(),
    hash: token().max(100),
    keyDuration: z.array(z.number().nonnegative()).or(z.literal("toolong")),
    keySpacing: z.array(z.number().nonnegative()).or(z.literal("toolong")),
    keyOverlap: z.number().nonnegative(),
    lastKeyToEnd: z.number().nonnegative(),
    startToFirstKey: z.number().nonnegative(),
    wpmConsistency: PercentageSchema,
    incompleteTests: z.array(IncompleteTestSchema),
  })
  .strict();

export type CompletedEvent = z.infer<typeof CompletedEventSchema>;
