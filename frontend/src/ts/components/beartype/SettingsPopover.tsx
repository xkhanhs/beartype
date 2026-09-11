import { createSignal, JSXElement, onCleanup, Show } from "solid-js";

import { PACE_CARETS, SMOOTH_CARETS } from "../../beartype/config-lock";
import { setConfig } from "../../config/setters";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { getFocus } from "../../states/test";
import { cn } from "../../utils/cn";
import { Button } from "../common/Button";
import { SettingsRow } from "./SettingsRow";

/**
 * The only settings left, behind the gear in the footer. Upstream's settings
 * page had a hundred rows; this has the ones that shape how typing feels and
 * that a person here actually changes.
 */

const SMOOTH_CARET_LABELS: Record<(typeof SMOOTH_CARETS)[number], string> = {
  off: "tắt",
  slow: "chậm",
  medium: "vừa",
  fast: "nhanh",
};

const PACE_CARET_LABELS: Record<(typeof PACE_CARETS)[number], string> = {
  off: "tắt",
  average: "trung bình",
  pb: "tốt nhất",
  last: "bài trước",
};

export function SettingsPopover(props: { rows?: JSXElement }): JSXElement {
  const [open, setOpen] = createSignal(false);
  const [root, setRoot] = createSignal<HTMLDivElement>();

  const onPointerDown = (e: PointerEvent): void => {
    if (!(root()?.contains(e.target as Node) ?? false)) setOpen(false);
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") setOpen(false);
  };
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);
  onCleanup(() => {
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div
      ref={setRoot}
      class={cn("relative transition-opacity", {
        "pointer-events-none opacity-0": getFocus(),
      })}
    >
      <Button
        variant="text"
        fa={{ icon: "fa-cog", fixedWidth: true }}
        text="cài đặt"
        active={open()}
        onClick={() => setOpen(!open())}
      />
      <Show when={open()}>
        <div
          class="absolute bottom-full left-1/2 z-50 mb-2 grid w-max -translate-x-1/2 gap-4 rounded-(--roundness) bg-sub-alt p-4 text-sm text-text shadow-lg"
          role="dialog"
          aria-label="cài đặt"
        >
          {props.rows}
          <SettingsRow
            label="con trỏ mượt"
            options={SMOOTH_CARETS}
            labels={SMOOTH_CARET_LABELS}
            value={getConfig.smoothCaret}
            onPick={(value) => setConfig("smoothCaret", value)}
          />
          <SettingsRow
            label="con trỏ nhịp"
            options={PACE_CARETS}
            labels={PACE_CARET_LABELS}
            value={getConfig.paceCaret}
            onPick={(value) => {
              setConfig("paceCaret", value);
              // the pace caret is set up when a test starts
              restartTestEvent.dispatch();
            }}
          />
        </div>
      </Show>
    </div>
  );
}
