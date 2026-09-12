import { createSignal, JSXElement, onCleanup, Show } from "solid-js";

import {
  FONT_SIZES,
  KEYMAP_MODES,
  PACE_CARETS,
  RANDOM_THEMES,
  SMOOTH_CARETS,
  STRICT_ACCURACIES,
  TYPO_INDICATORS,
} from "../../beartype/config-lock";
import { t } from "../../beartype/strings";
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

// beartype: each of these is read again whenever the page changes language,
// so they are functions of the moment rather than tables built at load
const smoothCaretLabels = (): Record<
  (typeof SMOOTH_CARETS)[number],
  string
> => ({
  off: t("off"),
  slow: t("slow"),
  medium: t("medium"),
  fast: t("fast"),
});

// a share of the usual speed, and the same three figures in both languages
const PACE_CARET_LABELS: Record<(typeof PACE_CARETS)[number], string> = {
  off: "",
  80: "80%",
  100: "100%",
  120: "120%",
};

const paceCaretLabels = (): Record<(typeof PACE_CARETS)[number], string> => ({
  ...PACE_CARET_LABELS,
  off: t("off"),
});

const strictAccuracyLabels = (): Record<
  (typeof STRICT_ACCURACIES)[number],
  string
> => ({
  off: t("off"),
  on: t("on"),
});

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

const keymapModeLabels = (): Record<(typeof KEYMAP_MODES)[number], string> => ({
  off: t("off"),
  react: t("on"),
});

const randomThemeLabels = (): Record<
  (typeof RANDOM_THEMES)[number],
  string
> => ({
  off: t("off"),
  auto: t("rotateAuto"),
  light: t("rotateLight"),
  dark: t("rotateDark"),
  all: t("rotateAll"),
});

const typoIndicatorLabels = (): Record<
  (typeof TYPO_INDICATORS)[number],
  string
> => ({
  off: t("off"),
  below: t("on"),
});

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
        aria-label={t("settings")}
        data-balloon-pos="up"
        aria-expanded={open()}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open())}
      >
        <Icon name="settings" />
      </button>
      <Show when={open()}>
        <div class="bt-settings-card" role="dialog" aria-label={t("settings")}>
          <div class="bt-settings-title">{t("settings")}</div>
          <SettingsRow
            label={t("smoothCaret")}
            hint={t("smoothCaretHint")}
            options={SMOOTH_CARETS}
            labels={smoothCaretLabels()}
            value={getConfig.smoothCaret}
            onPick={(value) => setConfig("smoothCaret", value)}
          />
          <SettingsRow
            label={t("paceCaret")}
            hint={t("paceCaretHint")}
            options={PACE_CARETS}
            labels={paceCaretLabels()}
            value={getConfig.paceCaret}
            onPick={(value) => setConfig("paceCaret", value)}
          />
          <SettingsRow
            label={t("strictAccuracy")}
            hint={t("strictAccuracyHint")}
            options={STRICT_ACCURACIES}
            labels={strictAccuracyLabels()}
            value={getConfig.strictAccuracy}
            onPick={(value) => setConfig("strictAccuracy", value)}
          />
          <SettingsRow
            label={t("fontSize")}
            options={FONT_SIZES}
            labels={FONT_SIZE_LABELS}
            value={getConfig.fontSize}
            onPick={(value) => setConfig("fontSize", value)}
          />
          <SettingsRow
            label={t("indicateTypos")}
            hint={t("indicateTyposHint")}
            options={TYPO_INDICATORS}
            labels={typoIndicatorLabels()}
            value={getConfig.indicateTypos}
            onPick={(value) => setConfig("indicateTypos", value)}
          />
          <SettingsRow
            label={t("randomTheme")}
            hint={t("randomThemeHint")}
            options={RANDOM_THEMES}
            labels={randomThemeLabels()}
            value={getConfig.randomTheme}
            onPick={(value) => setConfig("randomTheme", value)}
          />
          <SettingsRow
            label={t("keymap")}
            hint={t("keymapHint")}
            options={KEYMAP_MODES}
            labels={keymapModeLabels()}
            value={getConfig.keymapMode}
            onPick={(value) => setConfig("keymapMode", value)}
          />
        </div>
      </Show>
    </div>
  );
}
