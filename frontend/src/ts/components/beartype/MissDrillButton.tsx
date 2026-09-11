import { createMemo, JSXElement } from "solid-js";

import { MIN_DRILL_WORDS, missWords } from "../../beartype/miss-book";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { getFocus } from "../../states/test";
import { initFromWords } from "../../test/practise-words";
import { cn } from "../../utils/cn";
import { Button } from "../common/Button";

/**
 * Starts a round of nothing but the words this pair of hands keeps missing,
 * in the language on screen. It stands beside the restart button from the
 * moment the page opens, not only after a test: the book outlives the tab.
 */
export function MissDrillButton(): JSXElement {
  const words = createMemo(() => missWords(getConfig.language));
  const ready = (): boolean => words().length >= MIN_DRILL_WORDS;

  return (
    <Button
      variant="text"
      class={cn("px-4 py-2 transition-opacity", {
        "pointer-events-none opacity-0": getFocus(),
      })}
      fa={{ icon: "fa-exclamation-triangle", fixedWidth: true }}
      text={`luyện từ hay sai · ${words().length}`}
      disabled={!ready()}
      balloon={{
        text: ready()
          ? "gõ lại những từ hay gõ sai"
          : `cần ít nhất ${MIN_DRILL_WORDS} từ trong sổ`,
        position: "down",
      }}
      onClick={() => {
        if (!ready()) return;
        if (initFromWords(words())) {
          restartTestEvent.dispatch({ practiseMissed: true });
        }
      }}
    />
  );
}
