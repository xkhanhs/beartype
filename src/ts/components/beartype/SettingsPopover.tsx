import { createSignal, JSXElement, onCleanup, Show } from "solid-js";

import {
  CLICK_SOUNDS,
  ERROR_SOUNDS,
  FONT_SIZES,
  FONTS,
  KEYMAP_MODES,
  SMOOTH_CARETS,
  TYPO_INDICATORS,
} from "../../beartype/config-lock";
import { setConfig } from "../../config/setters";
import { getConfig } from "../../config/store";
import { previewClick, previewError } from "../../controllers/sound-controller";
import { getFocus } from "../../states/test";
import { cn } from "../../utils/cn";
import { Fa } from "../common/Fa";
import { SettingsRow } from "./SettingsRow";
import { SettingsSliderRow } from "./SettingsSliderRow";

/**
 * The only settings left, behind the gear in the footer. Upstream's settings
 * page had a hundred rows; this has the ones that shape how typing feels and
 * that a person here actually changes: the caret, as in keybear the font of
 * the words and their size, the sounds of the keys and the keyboard under
 * the words. It is one of keybear's settings cards;
 * the colours have their own pill beside it, as in keybear.
 */

const SMOOTH_CARET_LABELS: Record<(typeof SMOOTH_CARETS)[number], string> = {
  off: "tắt",
  slow: "chậm",
  medium: "vừa",
  fast: "nhanh",
};

// the CSS family names; the config spells them with underscores, which
// `applyFontFamily` turns back into spaces
const FONT_LABELS: Record<(typeof FONTS)[number], string> = {
  Roboto_Mono: "Roboto Mono",
  IBM_Plex_Mono: "IBM Plex Mono",
  Be_Vietnam_Pro: "Be Vietnam Pro",
  Lexend: "Lexend",
  Open_Sans: "Open Sans",
  Quicksand: "Quicksand",
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

// upstream's names for its sets; a sound has no Vietnamese name to give it
const CLICK_SOUND_LABELS: Record<(typeof CLICK_SOUNDS)[number], string> = {
  off: "tắt",
  keybear: "keybear",
  1: "click",
  3: "pop",
  4: "nk creams",
  5: "typewriter",
  6: "osu",
  8: "sine",
};

const ERROR_SOUND_LABELS: Record<(typeof ERROR_SOUNDS)[number], string> = {
  off: "tắt",
  keybear: "keybear",
  1: "monkeytype",
};

const KEYMAP_MODE_LABELS: Record<(typeof KEYMAP_MODES)[number], string> = {
  off: "tắt",
  react: "bật",
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
        class="bt-footer-pill"
        aria-expanded={open()}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open())}
      >
        <Fa icon="fa-cog" fixedWidth />
        <span>cài đặt</span>
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
            label="phông chữ"
            hint="chữ của bài gõ; mỗi tên viết bằng chính phông ấy"
            options={FONTS}
            labels={FONT_LABELS}
            fontOf={(font) => `"${FONT_LABELS[font]}"`}
            value={getConfig.fontFamily}
            onPick={(value) => setConfig("fontFamily", value)}
          />
          <SettingsRow
            label="cỡ chữ"
            hint="cỡ chữ của bài gõ"
            options={FONT_SIZES}
            labels={FONT_SIZE_LABELS}
            value={getConfig.fontSize}
            onPick={(value) => setConfig("fontSize", value)}
          />
          <SettingsRow
            label="tiếng gõ"
            hint="một tiếng mỗi phím; chọn là nghe thử"
            options={CLICK_SOUNDS}
            labels={CLICK_SOUND_LABELS}
            value={getConfig.playSoundOnClick}
            onPick={(value) => {
              setConfig("playSoundOnClick", value);
              void previewClick(value);
            }}
          />
          <SettingsRow
            label="tiếng báo gõ sai"
            hint="phím gõ sai kêu một tiếng riêng"
            options={ERROR_SOUNDS}
            labels={ERROR_SOUND_LABELS}
            value={getConfig.playSoundOnError}
            onPick={(value) => {
              setConfig("playSoundOnError", value);
              if (value !== "off") void previewError(value);
            }}
          />
          <SettingsSliderRow
            label="âm lượng"
            hint="của tiếng gõ và tiếng báo gõ sai"
            value={getConfig.soundVolume}
            onInput={(value) => setConfig("soundVolume", value)}
            onChange={() => void previewClick(getConfig.playSoundOnClick)}
          />
          <SettingsRow
            label="hiện phím gõ sai"
            hint="chữ đã gõ nhầm hiện nhỏ dưới chữ đích"
            options={TYPO_INDICATORS}
            labels={TYPO_INDICATOR_LABELS}
            value={getConfig.indicateTypos}
            onPick={(value) => setConfig("indicateTypos", value)}
          />
          <SettingsRow
            label="bàn phím ảo"
            hint="bàn phím QWERTY dưới bài gõ; phím sáng lên khi gõ"
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
