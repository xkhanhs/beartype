import { z, ZodSchema } from "zod";
import * as Shared from "./shared";
import * as Themes from "./themes";
import { LanguageSchema } from "./languages";

export const SmoothCaretSchema = z.enum(["off", "slow", "medium", "fast"]);

export const IndicateTyposSchema = z.enum(["off", "below"]);

export const KeymapModeSchema = z.enum(["off", "react"]);

/**
 * A second caret running at a share of the usual speed on this browser, to
 * type against. "80" is the accuracy drill, "120" the overtraining one.
 */
export const PaceCaretSchema = z.enum(["off", "80", "100", "120"]);

/** Whether one wrong key ends the test. */
export const StrictAccuracySchema = z.enum(["off", "on"]);

/**
 * Which language the page itself speaks, as opposed to the words being typed.
 * See beartype/ui-language.ts.
 */
export const UiLanguageSchema = z.enum(["vi", "en"]);

/**
 * Which palettes a new test may pick from, or "off" to keep the chosen one.
 * "auto" is the pale ones or the dark ones, whichever the computer is set to.
 */
export const RandomThemeSchema = z.enum([
  "off",
  "auto",
  "light",
  "dark",
  "all",
]);

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

    // interface
    uiLanguage: UiLanguageSchema,

    // input
    indicateTypos: IndicateTyposSchema,

    // caret
    smoothCaret: SmoothCaretSchema,
    paceCaret: PaceCaretSchema,

    // difficulty
    strictAccuracy: StrictAccuracySchema,

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
