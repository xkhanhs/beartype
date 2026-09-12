import { z, ZodSchema } from "zod";
import * as Shared from "./shared";
import * as Themes from "./themes";
import { LanguageSchema } from "./languages";

export const SmoothCaretSchema = z.enum(["off", "slow", "medium", "fast"]);

export const IndicateTyposSchema = z.enum(["off", "below"]);

export const KeymapModeSchema = z.enum(["off", "react"]);

/** Which palettes a new test may pick from, or "off" to keep the chosen one. */
export const RandomThemeSchema = z.enum(["off", "light", "dark", "all"]);

const ThemeNameSchema = Themes.ThemeNameSchema;
export type ThemeName = z.infer<typeof ThemeNameSchema>;

const TimeConfigSchema = z.number().int().nonnegative();

const WordCountSchema = z.number().int().nonnegative();

const FontSizeSchema = z.number().positive();

export const ConfigSchema = z
  .object({
    // test
    words: WordCountSchema,
    time: TimeConfigSchema,
    mode: Shared.ModeSchema,
    language: LanguageSchema,

    // input
    indicateTypos: IndicateTyposSchema,

    // caret
    smoothCaret: SmoothCaretSchema,

    // appearance
    fontSize: FontSizeSchema,
    keymapMode: KeymapModeSchema,

    // theme
    autoSwitchTheme: z.boolean(),
    theme: ThemeNameSchema,
    randomTheme: RandomThemeSchema,
  } satisfies Record<string, ZodSchema>)
  .strict();

export type Config = z.infer<typeof ConfigSchema>;
const ConfigKeySchema = ConfigSchema.keyof();
export type ConfigKey = z.infer<typeof ConfigKeySchema>;

export const PartialConfigSchema = ConfigSchema.partial();
export type PartialConfig = z.infer<typeof PartialConfigSchema>;
