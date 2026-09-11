import { createSignal, JSXElement, onCleanup, Show } from "solid-js";

import { PACE_CARETS, SMOOTH_CARETS, THEMES } from "../../beartype/config-lock";
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

const THEME_OPTIONS = ["system", ...THEMES] as const;

// keybear's names for its palettes, so the two apps call them the same
const THEME_LABELS: Record<(typeof THEME_OPTIONS)[number], string> = {
  system: "tự động",
  keybear_light: "ban ngày",
  keybear_dark: "ban đêm",
  keybear_princess: "hồng phấn",
  keybear_ocean: "biển xanh",
  keybear_forest: "rừng cây",
  keybear_racing: "đua xe",
  keybear_dracula: "ma cà rồng",
  keybear_pixel: "pixel",
  keybear_hero: "siêu nhân",
};

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
      data-ui-element="settings"
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
          class="fixed bottom-16 left-1/2 z-50 grid w-max max-w-[92vw] -translate-x-1/2 gap-4 rounded-(--roundness) bg-sub-alt p-4 text-sm text-text shadow-lg"
          role="dialog"
          aria-label="cài đặt"
        >
          {props.rows}
          <SettingsRow
            label="màu"
            options={THEME_OPTIONS}
            labels={THEME_LABELS}
            value={getConfig.autoSwitchTheme ? "system" : getConfig.theme}
            onPick={(value) => {
              if (value === "system") {
                setConfig("autoSwitchTheme", true);
              } else {
                setConfig("autoSwitchTheme", false);
                setConfig("theme", value);
              }
            }}
          />
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
