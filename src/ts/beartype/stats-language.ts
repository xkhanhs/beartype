/**
 * The pool a result or a missed word is counted in. The speed figures and the
 * miss book answer "how do I type Vietnamese" and "how do I type English", not
 * "how do I type 30 seconds of it": time or words, 15 or 60, it is one pool
 * per language. Every Vietnamese list a browser may still have results from
 * (`vietnamese_1k` and the like) counts as Vietnamese, and likewise English.
 */
export function statsLanguage(language: string): string {
  if (language.startsWith("vietnamese")) return "vietnamese";
  if (language.startsWith("english")) return "english";
  return language;
}
