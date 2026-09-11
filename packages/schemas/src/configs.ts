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

export const RandomThemeSchema = z.enum([
  "off",
  "on",
  "fav",
  "light",
  "dark",
  "custom",
  "auto",
]);
export type RandomTheme = z.infer<typeof RandomThemeSchema>;

export const KeymapModeSchema = z.enum(["off", "static", "react", "next"]);
export type KeymapMode = z.infer<typeof KeymapModeSchema>;

export const PlaySoundOnErrorSchema = z.enum(["off", "1", "2", "3", "4"]);
export type PlaySoundOnError = z.infer<typeof PlaySoundOnErrorSchema>;

export const PlaySoundOnClickSchema = z.enum([
  "off",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
]);
export type PlaySoundOnClick = z.infer<typeof PlaySoundOnClickSchema>;

export const SoundVolumeSchema = z.number().min(0).max(1);
export type SoundVolume = z.infer<typeof SoundVolumeSchema>;

export const AdsSchema = z.enum(["off", "result", "on", "sellout"]);
export type Ads = z.infer<typeof AdsSchema>;

export const CustomBackgroundSizeSchema = z.enum(["cover", "contain", "max"]);
export type CustomBackgroundSize = z.infer<typeof CustomBackgroundSizeSchema>;

export const CustomBackgroundFilterSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);
export type CustomBackgroundFilter = z.infer<
  typeof CustomBackgroundFilterSchema
>;

export const MonkeyPowerLevelSchema = z.enum(["off", "1", "2", "3", "4"]);
export type MonkeyPowerLevel = z.infer<typeof MonkeyPowerLevelSchema>;

export const ColorHexValueSchema = z.string().regex(/^#([\da-f]{3}){1,2}$/i);
export type ColorHexValue = z.infer<typeof ColorHexValueSchema>;

export const DifficultySchema = Shared.DifficultySchema;
export type Difficulty = Shared.Difficulty;

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

export const FavThemesSchema = z.array(ThemeNameSchema);
export type FavThemes = z.infer<typeof FavThemesSchema>;

export const TimeConfigSchema = z.number().int().nonnegative();
export type TimeConfig = z.infer<typeof TimeConfigSchema>;

export const WordCountSchema = z.number().int().nonnegative();
export type WordCount = z.infer<typeof WordCountSchema>;

export const FontSizeSchema = z.number().positive();
export type FontSize = z.infer<typeof FontSizeSchema>;

export const CustomBackgroundSchema = z
  .string()
  .url("Needs to be an URI")
  .regex(/^(https|http):\/\/.*/, "Unsupported protocol")
  .regex(/^[^`'"]*$/, "May not contain quotes")
  .regex(/.+(\.png|\.gif|\.jpeg|\.jpg|\.webp)/gi, "Unsupported image format")
  .max(2048, "URL is too long")
  .or(z.literal(""));
export type CustomBackground = z.infer<typeof CustomBackgroundSchema>;

export const PlayTimeWarningSchema = z
  .enum(["off", "1", "3", "5", "10"])
  .describe(
    "How many seconds before the end of the test to play a warning sound.",
  );
export type PlayTimeWarning = z.infer<typeof PlayTimeWarningSchema>;

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
    playTimeWarning: PlayTimeWarningSchema,

    // caret
    smoothCaret: SmoothCaretSchema,

    // appearance
    fontSize: FontSizeSchema,
    fontFamily: FontNameSchema,
    keymapMode: KeymapModeSchema,

    // theme
    customBackground: CustomBackgroundSchema,
    customBackgroundSize: CustomBackgroundSizeSchema,
    customBackgroundFilter: CustomBackgroundFilterSchema,
    autoSwitchTheme: z.boolean(),
    themeLight: ThemeNameSchema,
    themeDark: ThemeNameSchema,
    randomTheme: RandomThemeSchema,
    favThemes: FavThemesSchema,
    theme: ThemeNameSchema,
    customTheme: z.boolean(),
    customThemeColors: CustomThemeColorsSchema,

    // hide elements
    showOutOfFocusWarning: z.boolean(),
    capsLockWarning: z.boolean(),

    // other (hidden)
    monkey: z.boolean(),
    monkeyPowerLevel: MonkeyPowerLevelSchema,

    // ads
    ads: AdsSchema,
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
  "hidden",
  "ads",
]);
export type ConfigGroupName = z.infer<typeof ConfigGroupNameSchema>;
