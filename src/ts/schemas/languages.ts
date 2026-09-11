import { z } from "zod";
import { customEnumErrorHandler } from "./util";

export const LanguageSchema = z.enum(
  [
    // beartype: only vietnamese and english ship word lists, see
    // static/languages
    "english",
    "vietnamese",
  ],
  {
    errorMap: customEnumErrorHandler("Must be a supported language"),
  },
);

export type Language = z.infer<typeof LanguageSchema>;

const LanguageObjectSchema = z
  .object({
    name: LanguageSchema,
    words: z.array(z.string()).min(1),
  })
  .strict();
export type LanguageObject = z.infer<typeof LanguageObjectSchema>;
