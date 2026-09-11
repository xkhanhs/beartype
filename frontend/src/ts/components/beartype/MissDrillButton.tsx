import { createMemo, JSXElement, Show } from "solid-js";

import { MIN_DRILL_WORDS, missWords } from "../../beartype/miss-book";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { getFocus } from "../../states/test";
import { initFromWords } from "../../test/practise-words";
import { cn } from "../../utils/cn";
import { buildBalloonHtmlProperties } from "../common/Balloon";

// keybear's icons, Material Design Icons (Apache-2.0): target and close
const TARGET_ICON =
  "M11,2V4.07C7.38,4.53 4.53,7.38 4.07,11H2V13H4.07C4.53,16.62 7.38,19.47 11,19.93V22H13V19.93C16.62,19.47 19.47,16.62 19.93,13H22V11H19.93C19.47,7.38 16.62,4.53 13,4.07V2M11,6.08V8H13V6.09C15.5,6.5 17.5,8.5 17.92,11H16V13H17.91C17.5,15.5 15.5,17.5 13,17.92V16H11V17.91C8.5,17.5 6.5,15.5 6.08,13H8V11H6.09C6.5,8.5 8.5,6.5 11,6.08M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11Z";
const CLOSE_ICON =
  "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";

/**
 * Starts a round of nothing but the words this pair of hands keeps missing,
 * in the language on screen. It stands beside the restart button from the
 * moment the page opens, not only after a test: the book outlives the tab.
 * On the result screen it stands beside "next" and "again", as in keybear.
 * Until the book holds a word it is not there at all.
 *
 * While a drill runs it is keybear's `DrillButton` switched on: the accent,
 * a cross, and the way out of the drill. Otherwise the typist is stuck in a
 * narrow set of words without knowing why they keep coming back. A drill is
 * upstream's custom mode, which nothing else in beartype reaches.
 */
export function MissDrillButton(): JSXElement {
  const words = createMemo(() => missWords(getConfig.language));
  const ready = (): boolean => words().length >= MIN_DRILL_WORDS;
  const active = (): boolean => getConfig.mode === "custom";

  const hint = (): string => {
    if (active()) return "quay về bài thường";
    return ready()
      ? "gõ lại những từ hay gõ sai"
      : `cần ít nhất ${MIN_DRILL_WORDS} từ trong sổ`;
  };

  return (
    <Show when={active() || words().length > 0}>
      <button
        type="button"
        class={cn("bt-action transition-opacity", {
          "bt-action-on": active(),
          "pointer-events-none opacity-0": getFocus(),
        })}
        aria-pressed={active()}
        disabled={!active() && !ready()}
        {...buildBalloonHtmlProperties({ text: hint(), position: "down" })}
        onClick={() => {
          // a plain restart puts the settings from before the drill back
          if (active()) {
            restartTestEvent.dispatch();
            return;
          }
          if (!ready()) return;
          if (initFromWords(words())) {
            restartTestEvent.dispatch({ practiseMissed: true });
          }
        }}
      >
        <svg class="bt-action-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d={active() ? CLOSE_ICON : TARGET_ICON}></path>
        </svg>
        {active()
          ? "đang luyện từ hay sai"
          : `luyện ${words().length} từ hay sai`}
      </button>
    </Show>
  );
}
