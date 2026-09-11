import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { type ToneStyle, toneStyleOf } from "./vietnamese";

/**
 * Which tone style this computer's input method writes: `hoà` (new) or `hòa`
 * (old). It is a checkbox in the input method, not the typist's choice, so
 * the words are drawn in whatever style comes out of it -- a word shown the
 * other way is a word typed right and drawn wrong.
 *
 * Nothing can be asked: the style is learned from what the typist actually
 * types, and until a word has said which one it is, the words come out in the
 * new style.
 */
const storage = new LocalStorageWithSchema<ToneStyle>({
  key: "beartype:v1:toneStyle",
  schema: z.enum(["new", "old"]),
  fallback: "new",
});

export function getToneStyle(): ToneStyle {
  return storage.get();
}

/** Keeps the style of the last typed word that had one to show. */
export function learnToneStyle(typedWords: readonly string[]): void {
  let learned: ToneStyle | null = null;
  for (const word of typedWords) {
    learned = toneStyleOf(word.trim()) ?? learned;
  }
  if (learned !== null && learned !== storage.get()) {
    storage.set(learned);
  }
}
