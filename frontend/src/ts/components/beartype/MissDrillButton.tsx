import { createMemo, JSXElement, Show } from "solid-js";

import { MIN_DRILL_WORDS, missWords } from "../../beartype/miss-book";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { getFocus } from "../../states/test";
import { initFromWords } from "../../test/practise-words";
import { cn } from "../../utils/cn";
import { buildBalloonHtmlProperties } from "../common/Balloon";
import { Fa } from "../common/Fa";

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
        <Fa icon="fa-exclamation-triangle" fixedWidth />
        {`luyện từ hay sai · ${words().length}`}
      </button>
    </Show>
  );
}
