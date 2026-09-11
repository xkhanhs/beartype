import { createMemo, For, JSXElement, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import {
  getKeymapFlashState,
  keymapLayoutObject,
  setKeymapFlashState,
} from "../../../states/test";
import { getTheme } from "../../../states/theme";
import { Anime } from "../../common/anime";
import { convertLayoutToKeymap, KeyDefinition } from "./keymapLayouts";

/**
 * The on-screen keyboard under the words, upstream's `react` keymap: a key
 * lights up in the accent when pressed, in the error colour when it made a
 * mistake. Upstream's other modes and board styles are gone; see
 * `keymapLayouts.ts`.
 */
export function Keymap(): JSXElement {
  return (
    <Show when={getConfig.keymapMode === "react" && keymapLayoutObject()}>
      {(layout) => {
        const keyboardDef = createMemo(() => convertLayoutToKeymap(layout()));
        return (
          <div
            data-ui-element="keymap"
            class="flex w-full flex-col items-center py-8 text-sm text-sub"
          >
            <div class="bt-keymap w-fit">
              <For each={keyboardDef()}>
                {(keys) => (
                  <div class="flex h-8 flex-row">
                    <For each={keys}>{(key) => <Key {...key} />}</For>
                  </div>
                )}
              </For>
            </div>
          </div>
        );
      }}
    </Show>
  );
}

function Key(props: KeyDefinition): JSXElement {
  const flash = createMemo(() => getKeymapFlashState[props.code]);

  // Don't apply reduced motion. If the user turns the keymap on they want
  // the animation.
  const animation = createMemo(() => {
    const entry = flash();
    const theme = getTheme();
    if (entry === undefined) {
      return {
        "--keybgcolor": [theme.subAlt],
        "--keycolor": [theme.sub],
        duration: 0,
      };
    }
    return {
      "--keybgcolor": [entry.correct ? theme.main : theme.error, theme.subAlt],
      "--keycolor": [theme.bg, theme.sub],
      duration: 250,
    };
  });

  return (
    <Anime
      class="relative flex items-center justify-center rounded border-2 border-bg bg-sub-alt"
      style={{
        "--keybgcolor": getTheme().subAlt,
        "--keycolor": getTheme().sub,
        height: "2rem",
        width: `${(props.width ?? 1) * 2}rem`,
        "margin-left": `${(props.x ?? 0) * 2}rem`,
        "background-color": "var(--keybgcolor)",
        color: "var(--keycolor)",
      }}
      respectReducedMotion={false}
      animation={{
        "--keybgcolor": animation()["--keybgcolor"],
        "--keycolor": animation()["--keycolor"],
        duration: animation().duration,
        onComplete: () => setKeymapFlashState(props.code, undefined),
      }}
    >
      {props.legend}
      <Show when={props.isHoming}>
        <div class="absolute bottom-0.75 left-auto h-0.5 w-2 rounded bg-bg"></div>
      </Show>
    </Anime>
  );
}
