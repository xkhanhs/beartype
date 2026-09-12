import { createSignal, JSXElement, onCleanup, Show } from "solid-js";

import {
  FONT_SIZES,
  KEYMAP_MODES,
  RANDOM_THEMES,
  SMOOTH_CARETS,
  TYPO_INDICATORS,
} from "../../beartype/config-lock";
import { setConfig } from "../../config/setters";
import { getConfig } from "../../config/store";
import { getFocus } from "../../states/test";
import { cn } from "../../utils/cn";
import { Icon } from "./Icon";
import { SettingsRow } from "./SettingsRow";

/**
 * The only settings left, behind the gear in the footer. Upstream's settings
 * page had a hundred rows; this has the ones that shape how typing feels and
 * that a person here actually changes: the caret, the size of the words, the
 * typos under them and the keyboard below. It is one of keybear's settings
 * cards; the colours have their own pill beside it, as in keybear. The gear
 * stands alone, without its name: the page stays quiet, and the balloon says
 * what it opens.
 */

const SMOOTH_CARET_LABELS: Record<(typeof SMOOTH_CARETS)[number], string> = {
  off: "tắt",
  slow: "chậm",
  medium: "vừa",
  fast: "nhanh",
};

// as Chrome's zoom names them: a share of the usual size
const FONT_SIZE_LABELS: Record<(typeof FONT_SIZES)[number], string> = {
  1.6: "80%",
  1.8: "90%",
  2: "100%",
  2.2: "110%",
  2.5: "125%",
  3: "150%",
  3.5: "175%",
  4: "200%",
};

const KEYMAP_MODE_LABELS: Record<(typeof KEYMAP_MODES)[number], string> = {
  off: "tắt",
  react: "bật",
};

const RANDOM_THEME_LABELS: Record<(typeof RANDOM_THEMES)[number], string> = {
  off: "tắt",
  auto: "theo máy",
  light: "màu sáng",
  dark: "màu tối",
  all: "lẫn lộn",
};

const TYPO_INDICATOR_LABELS: Record<(typeof TYPO_INDICATORS)[number], string> =
  {
    off: "tắt",
    below: "bật",
  };

export function SettingsPopover(): JSXElement {
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
      {/* the same pill as the colours beside it, as keybear pairs them */}
      <button
        type="button"
        class="bt-footer-pill bt-footer-icon"
        aria-label="cài đặt"
        data-balloon-pos="up"
        aria-expanded={open()}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open())}
      >
        <Icon name="settings" />
      </button>
      <Show when={open()}>
        <div class="bt-settings-card" role="dialog" aria-label="cài đặt">
          <div class="bt-settings-title">cài đặt</div>
          <SettingsRow
            label="con trỏ mượt"
            hint="con trỏ trượt sang chữ kế tiếp thay vì nhảy"
            options={SMOOTH_CARETS}
            labels={SMOOTH_CARET_LABELS}
            value={getConfig.smoothCaret}
            onPick={(value) => setConfig("smoothCaret", value)}
          />
          <SettingsRow
            label="cỡ chữ"
            options={FONT_SIZES}
            labels={FONT_SIZE_LABELS}
            value={getConfig.fontSize}
            onPick={(value) => setConfig("fontSize", value)}
          />
          <SettingsRow
            label="hiện phím gõ sai"
            hint="chữ gõ nhầm hiện nhỏ dưới chữ đích"
            options={TYPO_INDICATORS}
            labels={TYPO_INDICATOR_LABELS}
            value={getConfig.indicateTypos}
            onPick={(value) => setConfig("indicateTypos", value)}
          />
          <SettingsRow
            label="xoay màu"
            hint="mỗi bài mới lấy ngẫu nhiên một màu trong nhóm đã chọn"
            options={RANDOM_THEMES}
            labels={RANDOM_THEME_LABELS}
            value={getConfig.randomTheme}
            onPick={(value) => setConfig("randomTheme", value)}
          />
          <SettingsRow
            label="bàn phím ảo"
            hint="bàn phím QWERTY dưới bài gõ, sáng lên theo phím"
            options={KEYMAP_MODES}
            labels={KEYMAP_MODE_LABELS}
            value={getConfig.keymapMode}
            onPick={(value) => setConfig("keymapMode", value)}
          />
        </div>
      </Show>
    </div>
  );
}
