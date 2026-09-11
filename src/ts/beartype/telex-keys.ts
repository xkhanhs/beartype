// Ported from keybear (packages/keybr-lesson/lib/speedupwords.ts `telexKeysOf`
// and the recipes in telexsteps.ts). Keep the two in step.
import { marksOf, STROKE_MARK } from "./vietnamese";

/**
 * What each mark costs in Telex, the input method this scoring counts in. A
 * shape mark is typed by repeating or following the base letter (`aa`, `aw`,
 * `ow`); a tone is one key typed anywhere in the syllable.
 *
 * Counting in Telex keys is a yardstick, not a claim about the typist's input
 * method: VNI spends the same number of keys on every letter (`a1`, `a6`), so
 * the score comes out the same either way.
 */
const MARK_KEYS: readonly { mark: string; keys: readonly string[] }[] = [
  { mark: "́", keys: ["s"] }, // sắc
  { mark: "̀", keys: ["f"] }, // huyền
  { mark: "̉", keys: ["r"] }, // hỏi
  { mark: "̃", keys: ["x"] }, // ngã
  { mark: "̣", keys: ["j"] }, // nặng
  { mark: "̂", keys: ["aa", "ee", "oo"] }, // mũ: â ê ô
  { mark: "̆", keys: ["aw"] }, // á: ă
  { mark: "̛", keys: ["ow", "uw"] }, // móc: ơ ư
  { mark: STROKE_MARK, keys: ["dd"] }, // nét gạch: đ
];

/** A mark typed by writing more of the base letter: `aa` `ee` `oo` `aw` `ow`. */
function isShapeMark(mark: string, base: string): boolean {
  return (
    MARK_KEYS.find((item) => item.mark === mark)?.keys.some((recipe) =>
      recipe.startsWith(base),
    ) ?? false
  );
}

/** The keys a mark adds on top of the base letter `base`. */
function markKeysOf(mark: string, base: string): string {
  const step = MARK_KEYS.find((item) => item.mark === mark);
  if (step === undefined) {
    return "";
  }
  const own = step.keys.find((recipe) => recipe.startsWith(base));
  if (own !== undefined) {
    return own.slice(base.length);
  }
  return step.keys.find((recipe) => recipe.length === 1) ?? "";
}

/**
 * The physical keys that write a letter: `a` is `"a"`, `ạ` is `"aj"`, `ế` is
 * `"ees"`, `đ` is `"dd"`.
 *
 * Shape marks come before tones: the shape belongs to the base letter (`oo`
 * gives `ô`), so it has to be there before anything sits on top of it.
 * Without the sort `ộ` would come out `ojo`, because NFD puts the dot below
 * ahead of the circumflex -- that is Unicode's order, not the typing order.
 */
export function telexKeysOf(char: string): string {
  const lower = char.toLowerCase();
  if (lower === STROKE_MARK) {
    return "dd";
  }
  const base = [...lower.normalize("NFD")][0] ?? "";
  const marks = [...marksOf(lower)];
  const shapes = marks.filter((mark) => isShapeMark(mark, base));
  const tones = marks.filter((mark) => !isShapeMark(mark, base));
  return (
    base + [...shapes, ...tones].map((mark) => markKeysOf(mark, base)).join("")
  );
}
