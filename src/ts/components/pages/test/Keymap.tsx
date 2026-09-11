import { createMemo, For, JSXElement, onCleanup, Show } from "solid-js";
import { reconcile } from "solid-js/store";

import { getConfig } from "../../../config/store";
import { keymapEvent } from "../../../events/keymap";
import { LayoutObject } from "../../../schemas/layouts";
import {
  getKeymapFlashState,
  keymapLayoutObject,
  setKeymapFlashState,
} from "../../../states/test";
import { getTheme } from "../../../states/theme";
import { Anime } from "../../common/anime";
import {
  codeOfTypedChar,
  convertLayoutToKeymap,
  KeyDefinition,
  keyCodeToLight,
} from "./keymapLayouts";

/**
 * The on-screen keyboard under the words, upstream's `react` keymap: a key
 * lights up in the accent when typed, in the error colour when it made a
 * mistake. Upstream's other modes and board styles are gone; see
 * `keymapLayouts.ts`.
 */
export function Keymap(): JSXElement {
  return (
    <Show
      when={
        getConfig.keymapMode === "react" &&
        keymapLayoutObject.state === "ready" &&
        keymapLayoutObject()
      }
    >
      {(layout) => {
        const keyboardDef = createMemo(() => convertLayoutToKeymap(layout()));
        listenForKeys(layout);
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

function flashKey(code: string, correct: boolean): void {
  const existing = getKeymapFlashState[code];
  setKeymapFlashState(code, {
    tick: existing ? existing.tick + 1 : 1,
    correct,
  });
}

/** Lights keys while the keymap is shown. */
function listenForKeys(layout: () => LayoutObject): void {
  let lastCode: string | undefined;
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    if ((event.target as HTMLElement | null)?.id !== "wordsInput") return;
    lastCode = keyCodeToLight(event, layout());
    if (lastCode !== undefined) flashKey(lastCode, true);
  };
  document.addEventListener("keydown", onKeyDown);
  onCleanup(() => {
    document.removeEventListener("keydown", onKeyDown);
    // a flash cut short would otherwise replay when the keymap comes back
    setKeymapFlashState(reconcile({}));
  });

  // the typing code tells which characters were wrong; the key that typed
  // the wrong one turns red -- found from the character, since the last
  // keydown may be another key (the space that commits a composition, or
  // the last letter of a syllable an input method rewrote)
  keymapEvent.useListener(({ key, correct }) => {
    if (correct !== false) return;
    const code = codeOfTypedChar(layout(), key) ?? lastCode;
    if (code !== undefined) flashKey(code, false);
  });
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
