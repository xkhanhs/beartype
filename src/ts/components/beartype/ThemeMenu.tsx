import { createSignal, For, JSXElement, onCleanup, Show } from "solid-js";

import { THEMES } from "../../beartype/config-lock";
import { t } from "../../beartype/strings";
import { setConfig } from "../../config/setters";
import { getConfig } from "../../config/store";
import { themes } from "../../constants/themes";
import * as ThemeController from "../../controllers/theme-controller";
import { getFocus } from "../../states/test";
import { getTheme } from "../../states/theme";
import { cn } from "../../utils/cn";
import { isColorDark } from "../../utils/colors";
import { Icon } from "./Icon";

/**
 * keybear's colour pill, at the foot of the page next to the gear: one pill
 * shows the palette in use, and opens upward into the list. Every name
 * carries a dot split between that palette's background and its accent, so
 * the list shows what each one looks like before it is picked; resting the
 * pointer on a name also dresses the whole page in it for a look. The list is
 * long enough to scroll, so it is cut into the pale palettes and the dark
 * ones, the same two groups the rotation draws from.
 */

const OPTIONS = ["system", ...THEMES] as const;
type Option = (typeof OPTIONS)[number];

// keybear's own names for its palettes, so the two apps call them the same;
// the palettes taken from monkeytype keep the names monkeytype gave them.
// keybear's Light and Dark are the two exceptions: alone in a list that
// already holds solarized light, vesper light and repose light, those two say
// nothing, so they are named for the hour they look like.
const LABELS: Partial<Record<Option, string>> = {
  keybear_light: "daylight",
  keybear_dark: "nightfall",
  keybear_princess: "princess",
  keybear_ocean: "ocean",
  keybear_forest: "forest",
  keybear_racing: "racing",
  keybear_dracula: "dracula",
  keybear_pixel: "pixel",
  keybear_hero: "hero",
};

function label(option: Option): string {
  if (option === "system") return t("themeSystem");
  return LABELS[option] ?? option.replace(/_/g, " ");
}

const LIGHT_THEMES = THEMES.filter((name) => !isColorDark(themes[name].bg));
const DARK_THEMES = THEMES.filter((name) => isColorDark(themes[name].bg));

const GROUPS: { title: () => string; options: readonly Option[] }[] = [
  { title: () => t("themeGroupSystem"), options: ["system"] },
  { title: () => t("themeGroupLight"), options: LIGHT_THEMES },
  { title: () => t("themeGroupDark"), options: DARK_THEMES },
];

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

  /** The option the list ticks: what was chosen, rotation or not. */
  const current = (): Option =>
    getConfig.autoSwitchTheme
      ? "system"
      : (OPTIONS.find((o) => o === getConfig.theme) ?? "keybear_light");

  /**
   * What the pill shows: under a rotation the palette actually on screen,
   * which changes with every test, otherwise the chosen one.
   */
  const worn = (): Option =>
    getConfig.randomTheme === "off" ? current() : getTheme().name;

  const close = (): void => {
    if (!open()) return;
    setOpen(false);
    void ThemeController.clearPreview();
  };

  const pick = (option: Option): void => {
    // picking a colour by hand is the end of the rotation, otherwise the next
    // test would paint over the choice
    setConfig("randomTheme", "off");
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
        aria-label={t("themeButton")}
        data-balloon-pos="up"
        onClick={() => (open() ? close() : setOpen(true))}
      >
        <Dot option={worn()} />
        <span class="bt-theme-pill-name">{label(worn())}</span>
        <Icon name="chevron-down" class="bt-theme-chevron" />
      </button>
      <Show when={open()}>
        <div
          class="bt-theme-menu"
          role="menu"
          aria-label={t("themeMenu")}
          onMouseLeave={() => void ThemeController.clearPreview()}
        >
          <For each={GROUPS}>
            {(group) => (
              <div
                class="bt-theme-group"
                role="group"
                aria-label={group.title()}
              >
                <div class="bt-theme-group-title">{group.title()}</div>
                <For each={group.options}>
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
                      <span class="bt-theme-item-name">{label(option)}</span>
                      <Show when={option === current()}>
                        <Icon name="check" class="bt-theme-check" />
                      </Show>
                    </button>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
