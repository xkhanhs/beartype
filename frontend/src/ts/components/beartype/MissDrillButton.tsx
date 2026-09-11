import { createMemo, JSXElement, Show } from "solid-js";

import { MIN_DRILL_WORDS, missWords } from "../../beartype/miss-book";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { getFocus } from "../../states/test";
import { initFromWords } from "../../test/practise-words";
import { cn } from "../../utils/cn";
import { buildBalloonHtmlProperties } from "../common/Balloon";

/**
 * Starts a round of nothing but the words this pair of hands keeps missing,
 * in the language on screen. It stands beside the restart button from the
 * moment the page opens, not only after a test: the book outlives the tab.
 * On the result screen it stands beside "next" and "again", as in keybear.
 * Until the book holds a word it is not there at all.
 */
export function MissDrillButton(): JSXElement {
  const words = createMemo(() => missWords(getConfig.language));
  const ready = (): boolean => words().length >= MIN_DRILL_WORDS;

  return (
    <Show when={words().length > 0}>
      <button
        type="button"
        class={cn("bt-action transition-opacity", {
          "pointer-events-none opacity-0": getFocus(),
        })}
        disabled={!ready()}
        {...buildBalloonHtmlProperties({
          text: ready()
            ? "gõ lại những từ hay gõ sai"
            : `cần ít nhất ${MIN_DRILL_WORDS} từ trong sổ`,
          position: "down",
        })}
        onClick={() => {
          if (!ready()) return;
          if (initFromWords(words())) {
            restartTestEvent.dispatch({ practiseMissed: true });
          }
        }}
      >
        {/* keybear's target, Material Design Icons (Apache-2.0) */}
        <svg class="bt-action-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11,2V4.07C7.38,4.53 4.53,7.38 4.07,11H2V13H4.07C4.53,16.62 7.38,19.47 11,19.93V22H13V19.93C16.62,19.47 19.47,16.62 19.93,13H22V11H19.93C19.47,7.38 16.62,4.53 13,4.07V2M11,6.08V8H13V6.09C15.5,6.5 17.5,8.5 17.92,11H16V13H17.91C17.5,15.5 15.5,17.5 13,17.92V16H11V17.91C8.5,17.5 6.5,15.5 6.08,13H8V11H6.09C6.5,8.5 8.5,6.5 11,6.08M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11Z"></path>
        </svg>
        {`luyện ${words().length} từ hay sai`}
      </button>
    </Show>
  );
}
