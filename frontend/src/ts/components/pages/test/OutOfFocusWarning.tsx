import { Show } from "solid-js";

import {
  outOfFocusMaxHeight,
  showOutOfFocusWarning,
  testFocusState,
} from "../../../states/test";
import { Fa } from "../../common/Fa";

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
        <div>
          <Fa icon="fa-mouse-pointer" fixedWidth />
        </div>
        <div>{message()}</div>
      </div>
    </Show>
  );
}
