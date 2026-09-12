import { Show } from "solid-js";

import {
  outOfFocusMaxHeight,
  showOutOfFocusWarning,
  testFocusState,
} from "../../../states/test";
import { Icon } from "../../beartype/Icon";

export function OutOfFocusWarning() {
  const message = () =>
    testFocusState() === "unfocusedWindow"
      ? "bấm vào đâu đó để quay lại cửa sổ"
      : "bấm vào đây hoặc gõ một phím để tiếp tục";

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
          <span>{message()}</span>
        </div>
      </div>
    </Show>
  );
}
