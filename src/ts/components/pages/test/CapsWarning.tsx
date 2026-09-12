import { Show } from "solid-js";

import { isCapsLockOn } from "../../../states/modifiers";
import { Icon } from "../../beartype/Icon";

export function CapsWarning() {
  return (
    <Show when={isCapsLockOn()}>
      <div class="pointer-events-none absolute -top-10 left-1/2 z-999 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-(--roundness) bg-main p-4 px-8 text-base text-bg">
        <Icon name="lock" />
        Caps Lock
      </div>
    </Show>
  );
}
