import { createSignal } from "solid-js";
import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

/**
 * The typist's own text, for the custom mode: the one on the test, and the
 * ones kept to type another day.
 *
 * Upstream kept the text in `customTextSettings`, but here that store is only
 * the buffer the test is built from, and a drill writes its words there too:
 * the text lives on its own, and `test-logic`'s `init` copies it into the
 * buffer each time the custom mode runs.
 *
 * The words are typed as written, capitals and punctuation included: the
 * custom mode is the one mode the generator does not lower-case, and the
 * scoring counts `H` and `h` as different keys.
 *
 * The text is one of the test's two sources, beside the app's word list, and
 * runs for as long as the list would: for a time or a number of words, the
 * same `Config.time` and `Config.words` -- or, which only a text of one's own
 * can do, once through to its end. It is typed in order, or shuffled.
 */
const SavedTextSchema = z.object({
  name: z.string(),
  text: z.string(),
});

type SavedText = z.infer<typeof SavedTextSchema>;

/** How long the text runs: for a time, for a number of words, or once. */
export const CUSTOM_LENGTHS = ["time", "words", "text"] as const;
export type CustomLength = (typeof CUSTOM_LENGTHS)[number];

const CustomTextSchema = z.object({
  /** The text the custom mode runs. */
  text: z.string(),
  saved: z.array(SavedTextSchema),
  // both came later: a store written before them runs the text once, in
  // order, as it always did
  by: z.enum(CUSTOM_LENGTHS).optional(),
  shuffle: z.boolean().optional(),
});

type CustomText = z.infer<typeof CustomTextSchema>;

const storage = new LocalStorageWithSchema<CustomText>({
  key: "beartype:v1:customtext",
  schema: CustomTextSchema,
  fallback: { text: "", saved: [] },
});

const [store, setStore] = createSignal<CustomText>(storage.get());

function write(next: CustomText): void {
  storage.set(next);
  setStore(next);
}

/** A text as the words of a test: split on any run of white space. */
export function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter((word) => word !== "");
}

/** The text the custom mode runs. */
export function customText(): string {
  return store().text;
}

export function setCustomText(text: string): void {
  write({ ...store(), text });
}

/** How long the custom mode runs. */
export function customLength(): CustomLength {
  return store().by ?? "text";
}

export function setCustomLength(by: CustomLength): void {
  write({ ...store(), by });
}

/** Whether the custom mode shuffles the text's words. */
export function customShuffle(): boolean {
  return store().shuffle ?? false;
}

export function setCustomShuffle(shuffle: boolean): void {
  write({ ...store(), shuffle });
}

/**
 * The generator's settings for a text of `words` words: shuffled on every
 * pass or in order (and from the top again when a time or a count outruns
 * the text), for `time` seconds, `count` words, or the text's own length.
 */
export function customRun(
  words: number,
  by: CustomLength,
  shuffle: boolean,
  time: number,
  count: number,
): {
  mode: "shuffle" | "repeat";
  limitMode: "time" | "word";
  limitValue: number;
} {
  return {
    mode: shuffle ? "shuffle" : "repeat",
    limitMode: by === "time" ? "time" : "word",
    limitValue: by === "time" ? time : by === "words" ? count : words,
  };
}

/** The texts kept for later, newest first. */
export function savedTexts(): readonly SavedText[] {
  return store().saved;
}

/** How a text is listed when it was saved without a name: its first words. */
function defaultName(text: string): string {
  const words = wordsOf(text);
  const head = words.slice(0, 4).join(" ");
  return words.length > 4 ? `${head}…` : head;
}

/**
 * Keeps `text` under `name` (its first words when blank). A new text goes to
 * the top; `replacing` names the saved text being edited, which keeps its
 * place in the list under its new name and words. Either way a name already
 * on the list is overwritten, as upstream did.
 */
export function saveText(name: string, text: string, replacing?: string): void {
  const entry = { name: name.trim() || defaultName(text), text };
  const saved = store().saved;
  const at = saved.findIndex((s) => s.name === replacing);
  const kept = saved.filter(
    (s) => s.name !== entry.name && s.name !== replacing,
  );
  const place = at === -1 ? 0 : Math.min(at, kept.length);
  write({
    ...store(),
    saved: [...kept.slice(0, place), entry, ...kept.slice(place)],
  });
}

export function deleteText(name: string): void {
  write({ ...store(), saved: store().saved.filter((s) => s.name !== name) });
}
