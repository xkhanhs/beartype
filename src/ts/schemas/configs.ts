import { z, ZodSchema } from "zod";
import * as Shared from "./shared";
import * as Themes from "./themes";
import { LanguageSchema } from "./languages";
import { FontNameSchema } from "./fonts";

export const SmoothCaretSchema = z.enum(["off", "slow", "medium", "fast"]);
export type SmoothCaret = z.infer<typeof SmoothCaretSchema>;

export const CaretStyleSchema = z.enum([
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

export const IndicateTyposSchema = z.enum(["off", "below", "replace", "both"]);
export type IndicateTypos = z.infer<typeof IndicateTyposSchema>;

export const KeymapModeSchema = z.enum(["off", "static", "react", "next"]);
export type KeymapMode = z.infer<typeof KeymapModeSchema>;

// upstream's ids, so the sound files keep their paths; see constants/sounds.ts
export const PlaySoundOnErrorSchema = z.enum(["off", "1"]);
export type PlaySoundOnError = z.infer<typeof PlaySoundOnErrorSchema>;

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

export const SoundVolumeSchema = z.number().min(0).max(1);
export type SoundVolume = z.infer<typeof SoundVolumeSchema>;

export const ColorHexValueSchema = z.string().regex(/^#([\da-f]{3}){1,2}$/i);
export type ColorHexValue = z.infer<typeof ColorHexValueSchema>;

export const CustomThemeColorsSchema = z.tuple([
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
  ColorHexValueSchema,
]);
export type CustomThemeColors = z.infer<typeof CustomThemeColorsSchema>;

export const ThemeNameSchema = Themes.ThemeNameSchema;
export type ThemeName = z.infer<typeof ThemeNameSchema>;

export const TimeConfigSchema = z.number().int().nonnegative();
export type TimeConfig = z.infer<typeof TimeConfigSchema>;

export const WordCountSchema = z.number().int().nonnegative();
export type WordCount = z.infer<typeof WordCountSchema>;

export const FontSizeSchema = z.number().positive();
export type FontSize = z.infer<typeof FontSizeSchema>;

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
export const ConfigKeySchema = ConfigSchema.keyof();
export type ConfigKey = z.infer<typeof ConfigKeySchema>;
export type ConfigValue = Config[keyof Config];

export const PartialConfigSchema = ConfigSchema.partial();
export type PartialConfig = z.infer<typeof PartialConfigSchema>;

export const ConfigGroupNameSchema = z.enum([
  "test",
  "behavior",
  "input",
  "sound",
  "caret",
  "appearance",
  "theme",
  "hideElements",
]);
export type ConfigGroupName = z.infer<typeof ConfigGroupNameSchema>;
