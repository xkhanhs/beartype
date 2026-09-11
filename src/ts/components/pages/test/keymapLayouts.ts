import { lastTelexKey } from "../../../beartype/telex-keys";
import { LayoutObject } from "../../../schemas/layouts";

/**
 * Upstream's keymap, cut down to the one board beartype draws: QWERTY in the
 * `staggered` style with its default `minimal` keys -- the three rows of
 * letters and the space bar, no number row, no modifiers.
 */
export type KeyDefinition = {
  /** `KeyboardEvent.code` of the key; the lit keys are kept by it. */
  code: string;
  legend: string;
  /** width in u */
  width?: number;
  /** x-offset in u */
  x?: number;
  isHoming?: boolean;
};
export type KeyboardDefinition = KeyDefinition[][];

type LetterRow = "row2" | "row3" | "row4";

// the physical keys under each row of upstream's layout file, left to right
const CODES: Record<LetterRow, string[]> = {
  row2: [
    "KeyQ",
    "KeyW",
    "KeyE",
    "KeyR",
    "KeyT",
    "KeyY",
    "KeyU",
    "KeyI",
    "KeyO",
    "KeyP",
    "BracketLeft",
    "BracketRight",
  ],
  row3: [
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyJ",
    "KeyK",
    "KeyL",
    "Semicolon",
    "Quote",
  ],
  row4: [
    "KeyZ",
    "KeyX",
    "KeyC",
    "KeyV",
    "KeyB",
    "KeyN",
    "KeyM",
    "Comma",
    "Period",
    "Slash",
  ],
};

/**
 * Each row starts further right, as the keys of a real board do; the
 * offsets and the homing bumps on `f` and `j` are upstream's.
 */
export function convertLayoutToKeymap(
  layout: LayoutObject,
): KeyboardDefinition {
  const row = (name: LetterRow, x: number): KeyDefinition[] =>
    CODES[name].map((code, col) => ({
      code,
      // the unshifted legend: upstream's default `lowercase` legend style
      legend: layout.keys[name][col]?.[0] ?? "",
      ...(col === 0 ? { x } : {}),
      ...(name === "row3" && (col === 3 || col === 6)
        ? { isHoming: true }
        : {}),
    }));

  return [
    row("row2", 0.5),
    row("row3", 1),
    row("row4", 1.5),
    [{ code: "Space", legend: "", width: 6, x: 3.5 }],
  ];
}

/**
 * The drawn key that `char` was typed with: its last Telex key (see
 * `lastTelexKey`), looked up by label. `undefined` for a character no drawn
 * key carries, such as a digit.
 */
export function codeOfTypedChar(
  layout: LayoutObject,
  char: string,
): string | undefined {
  return codeOfLegend(layout, lastTelexKey(char));
}

/**
 * The key to light for a keydown: the key labelled with what the system typed,
 * not the key under the finger.
 *
 * The character is the only part of the event to trust. The typist's layout
 * may not be QWERTY (Colemak here), so the physical key names the wrong
 * letter; and an input method that types for them -- VTX in its tap mode --
 * posts every character as a made-up key with virtual keycode 0, which the
 * browser reports as `KeyA` whatever was typed. Only an event with no
 * character (`Process`, while an input method composes) falls back to the
 * physical key.
 */
export function keyCodeToLight(
  event: Pick<KeyboardEvent, "key" | "code">,
  layout: LayoutObject,
): string | undefined {
  if ([...event.key].length !== 1) return event.code;
  return codeOfTypedChar(layout, event.key);
}

/** The code of the drawn key labelled `char`, shifted or not. */
function codeOfLegend(layout: LayoutObject, char: string): string | undefined {
  if (char === " ") return "Space";
  for (const name of ["row2", "row3", "row4"] as const) {
    const col = layout.keys[name].findIndex((legends) =>
      legends.includes(char),
    );
    if (col >= 0) return CODES[name][col];
  }
  return undefined;
}
