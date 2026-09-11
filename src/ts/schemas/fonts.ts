import { z } from "zod";
import { customEnumErrorHandler } from "./util";

export const KnownFontNameSchema = z.enum(["Roboto_Mono", "IBM_Plex_Mono"], {
  errorMap: customEnumErrorHandler("Must be a known font family"),
});
export type KnownFontName = z.infer<typeof KnownFontNameSchema>;

export const FontNameSchema = KnownFontNameSchema.or(
  z
    .string()
    .max(50)
    .regex(/^[a-zA-Z0-9_\-+.]+$/),
);
