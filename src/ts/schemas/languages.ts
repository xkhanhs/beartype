import { z } from "zod";
import { KnownFontNameSchema } from "./fonts";
import { customEnumErrorHandler } from "./util";

export const LanguageSchema = z.enum(
  [
    // beartype: only vietnamese and english ship word lists, see
    // frontend/static/languages
    "english",
    "vietnamese",
  ],
  {
    errorMap: customEnumErrorHandler("Must be a supported language"),
  },
);

export type Language = z.infer<typeof LanguageSchema>;

export const LanguageObjectSchema = z
  .object({
    name: LanguageSchema,
    rightToLeft: z.boolean().optional(),
    noLazyMode: z.boolean().optional(),
    joiningScript: z.boolean().optional(),
    orderedByFrequency: z.boolean().optional(),
    words: z.array(z.string()).min(1),
    additionalAccents: z
      .array(z.tuple([z.string().min(1), z.string().min(1)]))
      .optional(),
    bcp47: z.string().optional(),
    preferredFont: KnownFontNameSchema.optional(),
    originalPunctuation: z.boolean().optional(),
  })
  .strict();
export type LanguageObject = z.infer<typeof LanguageObjectSchema>;
