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
import { getLanguage } from "./utils/json-data";
import { replaceUnderscoresWithSpaces } from "./utils/strings";
import { getResultVisible } from "./states/test";

async function applyFontFamily(): Promise<void> {
  const font = replaceUnderscoresWithSpaces(Config.fontFamily);

  const preferredFont = (await getLanguage(Config.language))?.preferredFont;

  const fonts = [
    `"${font}"`,
    preferredFont !== undefined
      ? `"${replaceUnderscoresWithSpaces(preferredFont)}"`
      : undefined,
    '"Roboto Mono"',
    "monospace",
  ].filter((it) => it !== undefined);

  document.documentElement.style.setProperty("--font", fonts.join(","));
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

configEvent.subscribe(async ({ key }) => {
  if (key === "fontFamily" || key === "language") {
    await applyFontFamily();
  }
});
