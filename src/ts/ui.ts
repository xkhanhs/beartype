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

configEvent.subscribe(({ key }) => {
  if (key === "language") applyTypingFont();
});
