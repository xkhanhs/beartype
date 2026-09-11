import { Language } from "@monkeytype/schemas/languages";

// beartype types Vietnamese and English only. The schema still names every
// upstream language, since the typing code and its tests refer to them; these
// two lists are the ones the app actually ships word lists for.
export const LanguageList: Language[] = ["english", "vietnamese"];

export const LanguageGroups: Record<string, Language[]> = {
  english: ["english"],
  vietnamese: ["vietnamese"],
};

export type LanguageGroupName = keyof typeof LanguageGroups;
export const LanguageGroupNames: LanguageGroupName[] = Array.from(
  Object.keys(LanguageGroups),
);

/**
 * Fetches the language group for a given language.
 * @param language The language code.
 * @returns the language group.
 */
export function getGroupForLanguage(
  language: Language,
): LanguageGroupName | undefined {
  return LanguageGroupNames.find((group) => group.includes(language));
}
