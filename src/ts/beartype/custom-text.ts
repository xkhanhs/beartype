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
 */
const SavedTextSchema = z.object({
  name: z.string(),
  text: z.string(),
});

type SavedText = z.infer<typeof SavedTextSchema>;

const CustomTextSchema = z.object({
  /** The text the custom mode runs. */
  text: z.string(),
  saved: z.array(SavedTextSchema),
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
