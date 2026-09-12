import { Config } from "./config/store";
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

// beartype: the page's own language shows in two places outside the
// components -- the tab and the `lang` attribute a screen reader reads the
// page with. Both are set here, where the rest of the whole-page settings
// are. The config values are the language tags themselves, so `lang` takes
// one as it stands. `applyConfig` sets every key on load, so this runs then
// too; `index.html` ships the attribute the page starts with.
function applyUiLanguage(): void {
  document.documentElement.lang = Config.uiLanguage;
  updateTitle();
  translateDom();
}

configEvent.subscribe(({ key }) => {
  if (key === "language") applyTypingFont();
  if (key === "uiLanguage") applyUiLanguage();
});
