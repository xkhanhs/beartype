import { STRING_KEYS, type StringKey, t } from "./strings";

/**
 * The words in the pages under `src/html`, which are plain HTML with no
 * component around them to redraw.
 *
 * A node says which string it holds -- `data-i18n` for its text,
 * `data-i18n-label` for its `aria-label` -- and this writes them in the
 * language the page is in, at startup and again whenever that changes
 * (`applyUiLanguage` in ui.ts). The key stays in the markup, beside the words
 * it replaces, rather than in a list somewhere else that has to be kept in
 * step with it.
 */
export function translateDom(root: ParentNode = document): void {
  for (const element of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = stringKey(element.dataset["i18n"]);
    if (key !== null) element.textContent = t(key);
  }
  for (const element of root.querySelectorAll<HTMLElement>(
    "[data-i18n-label]",
  )) {
    const key = stringKey(element.dataset["i18nLabel"]);
    if (key !== null) element.setAttribute("aria-label", t(key));
  }
}

/**
 * An attribute is only a string until it is read. A key that names nothing
 * would otherwise write the word "undefined" onto the page; leave the markup
 * as it stands and say so where whoever mistyped it will look.
 */
function stringKey(value: string | undefined): StringKey | null {
  if (
    value !== undefined &&
    (STRING_KEYS as readonly string[]).includes(value)
  ) {
    return value as StringKey;
  }
  console.error(`No string named "${value}" -- see beartype/strings.ts`);
  return null;
}
