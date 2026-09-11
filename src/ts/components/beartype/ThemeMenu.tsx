import { createSignal, For, JSXElement, onCleanup, Show } from "solid-js";

import { THEMES } from "../../beartype/config-lock";
import { setConfig } from "../../config/setters";
import { getConfig } from "../../config/store";
import { themes } from "../../constants/themes";
import * as ThemeController from "../../controllers/theme-controller";
import { getFocus } from "../../states/test";
import { cn } from "../../utils/cn";
import { Fa } from "../common/Fa";

/**
 * keybear's colour pill, at the foot of the page next to the gear: one pill
 * shows the palette in use, and opens upward into the list. Every name
 * carries a dot split between that palette's background and its accent, so
 * the list shows what each one looks like before it is picked; resting the
 * pointer on a name also dresses the whole page in it for a look.
 */

const OPTIONS = ["system", ...THEMES] as const;
type Option = (typeof OPTIONS)[number];

// keybear's names for its palettes, so the two apps call them the same
const LABELS: Record<Option, string> = {
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

/** The two halves of a dot, read from the palettes themselves. */
function dotColors(option: Option): [string, string] {
  if (option === "system") {
    return [themes.keybear_light.bg, themes.keybear_dark.bg];
  }
  return [themes[option].bg, themes[option].main];
}

function Dot(props: { option: Option }): JSXElement {
  const colors = (): [string, string] => dotColors(props.option);
  return (
    <span
      class="bt-theme-dot"
      style={{ "--dot-a": colors()[0], "--dot-b": colors()[1] }}
    ></span>
  );
}

export function ThemeMenu(): JSXElement {
  const [open, setOpen] = createSignal(false);
  const [root, setRoot] = createSignal<HTMLDivElement>();

  const current = (): Option =>
    getConfig.autoSwitchTheme
      ? "system"
      : (OPTIONS.find((o) => o === getConfig.theme) ?? "keybear_light");

  const close = (): void => {
    if (!open()) return;
    setOpen(false);
    void ThemeController.clearPreview();
  };

  const pick = (option: Option): void => {
    if (option === "system") {
      setConfig("autoSwitchTheme", true);
    } else {
      setConfig("autoSwitchTheme", false);
      setConfig("theme", option);
    }
    setOpen(false);
    // picking the palette already in use sends no config event, so the look
    // taken on the way here would otherwise stay flagged as a preview
    void ThemeController.clearPreview();
  };

  const onPointerDown = (e: PointerEvent): void => {
    if (!(root()?.contains(e.target as Node) ?? false)) close();
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") close();
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
      data-ui-element="themeMenu"
      class={cn("relative transition-opacity", {
        "pointer-events-none opacity-0": getFocus(),
      })}
    >
      <button
        type="button"
        class="bt-footer-pill"
        aria-expanded={open()}
        aria-haspopup="menu"
        title="đổi màu"
        onClick={() => (open() ? close() : setOpen(true))}
      >
        <Dot option={current()} />
        <span class="bt-theme-pill-name">{LABELS[current()]}</span>
        <Fa icon="fa-chevron-down" class="bt-theme-chevron" />
      </button>
      <Show when={open()}>
        <div
          class="bt-theme-menu"
          role="menu"
          aria-label="màu"
          onMouseLeave={() => void ThemeController.clearPreview()}
        >
          <For each={OPTIONS}>
            {(option) => (
              <button
                type="button"
                role="menuitemradio"
                aria-checked={option === current()}
                class="bt-theme-item"
                onMouseEnter={() => {
                  if (option === "system") {
                    void ThemeController.clearPreview();
                  } else {
                    ThemeController.preview(option);
                  }
                }}
                onClick={() => pick(option)}
              >
                <Dot option={option} />
                <span class="bt-theme-item-name">{LABELS[option]}</span>
                <Show when={option === current()}>
                  <Fa icon="fa-check" class="bt-theme-check" />
                </Show>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
