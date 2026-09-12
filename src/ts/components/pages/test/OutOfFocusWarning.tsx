import { For, Show } from "solid-js";

import { t } from "../../../beartype/strings";
import {
  outOfFocusMaxHeight,
  showOutOfFocusWarning,
  testFocusState,
} from "../../../states/test";
import { Icon } from "../../beartype/Icon";

export function OutOfFocusWarning() {
  // beartype: the halves of the sentence, each kept whole: a narrow screen
  // breaks between them, never inside one
  const message = (): string[] =>
    testFocusState() === "unfocusedWindow"
      ? [t("unfocusedWindow")]
      : [t("unfocusedWordsTap"), t("unfocusedWordsType")];

  return (
    <Show when={showOutOfFocusWarning()}>
      <div
        class="pointer-events-none absolute z-999 flex h-full w-full place-content-center items-center gap-2 text-center text-base select-none"
        style={{
          "max-height":
            outOfFocusMaxHeight() !== undefined
              ? `${outOfFocusMaxHeight()}px`
              : undefined,
        }}
      >
        {/* beartype: keybear's `PauseNotice` pill. The click still falls
            through to the words under it, which is what takes the focus. */}
        <div class="bt-pause-notice">
          <span class="bt-pause-icon">
            <Icon name="pause" />
          </span>
          <span class="bt-pause-text">
            <For each={message()}>{(clause) => <span>{clause}</span>}</For>
          </span>
        </div>
      </div>
    </Show>
  );
}
