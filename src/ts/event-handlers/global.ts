import * as Misc from "../utils/misc";
import * as PageTransition from "../legacy-states/page-transition";
import { getActivePage } from "../states/core";
import { ModifierKeys } from "../constants/modifier-keys";
import { focusWords } from "../test/test-ui";
import { isInputElementFocused } from "../input/input-element";
import { getResultVisible } from "../states/test";
import { isDevEnvironment } from "../utils/env";

document.addEventListener("keydown", (e) => {
  if (PageTransition.get()) return;
  if (e.key === undefined) return;

  if (isDevEnvironment()) {
    if (
      (document.activeElement as HTMLElement | undefined)?.dataset[
        "uiElement"
      ] === "signalDevtoolsInput"
    ) {
      return;
    }
  }

  const pageTestActive: boolean = getActivePage() === "test";
  if (pageTestActive && !getResultVisible() && !isInputElementFocused()) {
    const popupVisible: boolean = Misc.isAnyPopupVisible();
    // this is nested because isAnyPopupVisible is a bit expensive
    // and we don't want to call it during the test
    if (
      !popupVisible &&
      !["Enter", " ", "Escape", "Tab", ...ModifierKeys].includes(e.key) &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      //autofocus
      focusWords();
      e.preventDefault();
    }
  }
});

//stop space scrolling
window.addEventListener("keydown", function (e) {
  if (
    e.code === "Space" &&
    (e.target === document.body || (e.target as HTMLElement)?.id === "result")
  ) {
    e.preventDefault();
  }
});
