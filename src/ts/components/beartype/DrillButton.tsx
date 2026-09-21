import { createMemo, JSXElement, Show } from "solid-js";

import { MIN_DRILL_WORDS } from "../../beartype/miss-book";
import { t } from "../../beartype/strings";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { getFocus } from "../../states/test";
import {
  DrillKind,
  drillKind,
  drillWords,
  initFromWords,
} from "../../test/practise-words";
import { cn } from "../../utils/cn";
import { buildBalloonHtmlProperties } from "../common/Balloon";

// keybear's icons, Material Design Icons (Apache-2.0): target, a slow
// speedometer and close
const ICONS: Record<DrillKind, string> = {
  miss: "M11,2V4.07C7.38,4.53 4.53,7.38 4.07,11H2V13H4.07C4.53,16.62 7.38,19.47 11,19.93V22H13V19.93C16.62,19.47 19.47,16.62 19.93,13H22V11H19.93C19.47,7.38 16.62,4.53 13,4.07V2M11,6.08V8H13V6.09C15.5,6.5 17.5,8.5 17.92,11H16V13H17.91C17.5,15.5 15.5,17.5 13,17.92V16H11V17.91C8.5,17.5 6.5,15.5 6.08,13H8V11H6.09C6.5,8.5 8.5,6.5 11,6.08M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11Z",
  slow: "M12 16C13.66 16 15 14.66 15 13C15 11.88 14.39 10.9 13.5 10.39L3.79 4.77L9.32 14.35C9.82 15.33 10.83 16 12 16M12 3C10.19 3 8.5 3.5 7.03 4.32L9.13 5.53C10 5.19 11 5 12 5C16.42 5 20 8.58 20 13C20 15.21 19.11 17.21 17.66 18.65H17.65C17.26 19.04 17.26 19.67 17.65 20.06C18.04 20.45 18.68 20.45 19.07 20.07C20.88 18.26 22 15.76 22 13C22 7.5 17.5 3 12 3M2 13C2 15.76 3.12 18.26 4.93 20.07C5.32 20.45 5.95 20.45 6.34 20.06C6.73 19.67 6.73 19.04 6.34 18.65C4.89 17.2 4 15.21 4 13C4 12 4.19 11 4.54 10.1L3.33 8C2.5 9.5 2 11.18 2 13Z",
};
const CLOSE_ICON =
  "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";

/**
 * Starts a round of nothing but one book's words, in the language on screen:
 * the words this pair of hands keeps missing (`miss`), or the ones it types
 * right but slowly (`slow`). It stands beside the restart button from the
 * moment the page opens, not only after a test: the book outlives the tab.
 * On the result screen it stands beside "next" and "again", as in keybear.
 * Until the book holds a word it is not there at all.
 *
 * While its drill runs it is keybear's `DrillButton` switched on: the accent,
 * a cross, and the way out of the drill. Otherwise the typist is stuck in a
 * narrow set of words without knowing why they keep coming back. The other
 * book's button stays as it is, and pressing it switches drills. A drill is
 * upstream's custom mode, which nothing else in beartype reaches.
 */
export function DrillButton(props: { kind: DrillKind }): JSXElement {
  const words = createMemo(() => drillWords(props.kind, getConfig.language));
  const ready = (): boolean => words().length >= MIN_DRILL_WORDS;
  const active = (): boolean =>
    getConfig.mode === "custom" && drillKind() === props.kind;

  // the button carries no label, so its balloon says both what it does and
  // how many words the book holds
  const hint = (): string => {
    const slow = props.kind === "slow";
    if (active()) {
      return slow ? t("slowDrillRunningHint") : t("drillRunningHint");
    }
    if (!ready()) return t("drillNeedsWords", MIN_DRILL_WORDS);
    return slow
      ? t("slowDrillCount", words().length)
      : t("drillCount", words().length);
  };

  return (
    <Show when={active() || words().length > 0}>
      <button
        type="button"
        class={cn("bt-action bt-action-bare transition-opacity", {
          "bt-action-on": active(),
          "pointer-events-none opacity-0": getFocus(),
        })}
        aria-pressed={active()}
        disabled={!active() && !ready()}
        {...buildBalloonHtmlProperties({ text: hint(), position: "down" })}
        onClick={() => {
          // the way out: back to the settings from before the drill
          if (active()) {
            restartTestEvent.dispatch({ leaveDrill: true });
            return;
          }
          if (!ready()) return;
          if (initFromWords(words(), props.kind)) {
            restartTestEvent.dispatch({ practise: true });
          }
        }}
      >
        <svg class="bt-action-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d={active() ? CLOSE_ICON : ICONS[props.kind]}></path>
        </svg>
      </button>
    </Show>
  );
}
