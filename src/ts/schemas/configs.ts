import { z, ZodSchema } from "zod";
import * as Shared from "./shared";
import * as Themes from "./themes";
import { LanguageSchema } from "./languages";
import { FontNameSchema } from "./fonts";

export const SmoothCaretSchema = z.enum(["off", "slow", "medium", "fast"]);

const CaretStyleSchema = z.enum([
  "off",
  "default",
  "block",
  "outline",
  "underline",
  "carrot",
  "banana",
  "monkey",
]);
export type CaretStyle = z.infer<typeof CaretStyleSchema>;

export const IndicateTyposSchema = z.enum(["off", "below"]);

export const KeymapModeSchema = z.enum(["off", "react"]);

// upstream's ids, so the sound files keep their paths; see constants/sounds.ts
export const PlaySoundOnErrorSchema = z.enum(["off", "1"]);

export const PlaySoundOnClickSchema = z.enum([
  "off",
  "1",
  "3",
  "4",
  "5",
  "6",
  "8",
]);
export type PlaySoundOnClick = z.infer<typeof PlaySoundOnClickSchema>;

const SoundVolumeSchema = z.number().min(0).max(1);

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

    // behavior
    resultSaving: z.boolean(),

    // input
    indicateTypos: IndicateTyposSchema,

    // sound
    soundVolume: SoundVolumeSchema,
    playSoundOnClick: PlaySoundOnClickSchema,
    playSoundOnError: PlaySoundOnErrorSchema,

    // caret
    smoothCaret: SmoothCaretSchema,

    // appearance
    fontSize: FontSizeSchema,
    fontFamily: FontNameSchema,
    keymapMode: KeymapModeSchema,

    // theme
    autoSwitchTheme: z.boolean(),
    themeLight: ThemeNameSchema,
    themeDark: ThemeNameSchema,
    theme: ThemeNameSchema,

    // hide elements
    showOutOfFocusWarning: z.boolean(),
    capsLockWarning: z.boolean(),
  } satisfies Record<string, ZodSchema>)
  .strict();

export type Config = z.infer<typeof ConfigSchema>;
const ConfigKeySchema = ConfigSchema.keyof();
export type ConfigKey = z.infer<typeof ConfigKeySchema>;

export const PartialConfigSchema = ConfigSchema.partial();
export type PartialConfig = z.infer<typeof PartialConfigSchema>;
