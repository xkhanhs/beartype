import * as TestLogic from "../test/test-logic";
import * as PageTransition from "../legacy-states/page-transition";
import * as Focus from "../test/focus";
import { setActivePage } from "../states/core";
import { resetIncompleteTests } from "../states/test";
import { applyReducedMotion, updateTitle } from "../utils/misc";
import { qsr } from "../utils/dom";

/**
 * beartype has one page. Upstream's router matched a URL, loaded the target
 * page module and ran its lifecycle through a generic multi-page transition
 * (fade out the current page, run its hooks, fade in the next one, run
 * that page's hooks). With only the test page reachable, this does that
 * transition directly: fade out the loading screen, reset the test, fade
 * in the test page. `PageTransition` still guards input the same way it did
 * during that transition (see `test/focus.ts`, `test/test-logic.ts`).
 */
export async function start(): Promise<void> {
  PageTransition.set(true);

  const loadingEl = qsr(".page.pageLoading");
  const testEl = qsr(".page.pageTest");
  const totalDuration = applyReducedMotion(250);

  await loadingEl.promiseAnimate({
    opacity: "0",
    duration: totalDuration / 2,
  });
  loadingEl.hide();

  updateTitle();
  setActivePage("test");
  Focus.set(false);

  resetIncompleteTests();
  void TestLogic.restart({ noAnim: true });

  testEl.show().setStyle({ opacity: "0" });
  await testEl.promiseAnimate({
    opacity: "1",
    duration: totalDuration / 2,
  });
  testEl.addClass("active");

  PageTransition.set(false);
  document.body.classList.remove("loading");
}
