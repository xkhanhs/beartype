import { Config, getConfig } from "./config/store";
import * as Caret from "./test/caret";
import { configEvent } from "./events/config";
import { debounce, throttle } from "throttle-debounce";
import * as TestUI from "./test/test-ui";
import { getActivePage } from "./states/core";
import { isDevEnvironment } from "./utils/env";
import { qs, qsr } from "./utils/dom";
import { createEffect } from "solid-js";
import { convertRemToPixels } from "./utils/numbers";
import { getResultVisible } from "./states/test";
import { translateDom } from "./beartype/dom-strings";
import { updateTitle } from "./utils/misc";

// One typing font per language, each falling back to a system font of the
// same kind; see the @font-face rules in beartype.scss.
function applyTypingFont(): void {
  const font =
    Config.language === "vietnamese"
      ? '"Be Vietnam Pro", system-ui, sans-serif'
      : '"Roboto Mono", ui-monospace, monospace';
  document.documentElement.style.setProperty("--font", font);
}

if (isDevEnvironment()) {
  qs("head title")?.setText(
    `${qs("head title")?.native.textContent ?? ""} (localhost)`,
  );
  // beartype: no "local" watermarks in the corners -- they sat on the logo
  // and the footer; the tab title says it is localhost
}

const debouncedEvent = debounce(250, () => {
  if (getActivePage() === "test" && !getResultVisible()) {
    void TestUI.centerActiveLine();
    void TestUI.updateHintsPositionDebounced();
    setTimeout(() => {
      TestUI.updateWordsInputPosition();
      TestUI.focusWords();
      Caret.show();
    }, 250);
  }
});

const throttledEvent = throttle(250, () => {
  Caret.hide();
});

window.addEventListener("resize", () => {
  throttledEvent();
  debouncedEvent();
});

createEffect(() => {
  qsr("#app").setStyle({
    paddingTop: `${convertRemToPixels(2)}px`,
  });
});

// beartype: what the page says outside the components -- the tab, the `lang`
// a screen reader reads it with, and the pages under src/html, which have no
// component around them to redraw.
//
// An effect rather than a config event, because `setConfig` dispatches its
// event *before* it writes the store, and `t` reads the store: on the event
// every one of these would still be written in the language just left. The
// effect runs once at startup too, so the pages start in the right language.
// The config value is the language tag itself, so `lang` takes it as it is.
createEffect(() => {
  document.documentElement.lang = getConfig.uiLanguage;
  updateTitle();
  translateDom();
});

configEvent.subscribe(({ key }) => {
  if (key === "language") applyTypingFont();
});
