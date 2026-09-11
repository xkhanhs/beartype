import { z } from "zod";

const KeyLegendsSchema = z.array(z.string().length(1)).min(1).max(4);

const commonLayoutSchema = z
  .object({
    keymapShowTopRow: z.boolean(),
    matrixShowRightColumn: z.boolean().optional(),
  })
  .strict();

const ansiLayoutSchema = commonLayoutSchema
  .extend({
    type: z.literal("ansi"),
    keys: z
      .object({
        row1: z.array(KeyLegendsSchema).length(13),
        row2: z.array(KeyLegendsSchema).length(13),
        row3: z.array(KeyLegendsSchema).length(11),
        row4: z.array(KeyLegendsSchema).length(10),
        row5: z.array(KeyLegendsSchema).min(1).max(2),
      })
      .strict(),
  })
  .strict();

const isoLayoutSchema = commonLayoutSchema
  .extend({
    type: z.literal("iso"),
    keys: z
      .object({
        row1: z.array(KeyLegendsSchema).length(13),
        row2: z.array(KeyLegendsSchema).length(12),
        row3: z.array(KeyLegendsSchema).length(12),
        row4: z.array(KeyLegendsSchema).length(11),
        row5: z.array(KeyLegendsSchema).min(1).max(2),
      })
      .strict(),
  })
  .strict();

const LayoutObjectSchema = ansiLayoutSchema.or(isoLayoutSchema);

export type LayoutObject = z.infer<typeof LayoutObjectSchema>;
