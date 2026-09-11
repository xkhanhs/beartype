import { For, JSXElement, Show } from "solid-js";

import {
  LANGUAGES,
  MODES,
  TIMES,
  WORD_COUNTS,
} from "../../../beartype/config-lock";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { restartTestEvent } from "../../../events/test";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";

// beartype: upstream's bar also carried punctuation, numbers, quote, zen,
// custom text and a custom length behind a modal. What is left is the test's
// length and its language, and it shows at every width, because the modal
// that stood in for it on narrow screens is gone. It is drawn as keybear's
// options bar: one rounded strip, the groups split by a thin rule, the
// choice in use filled with the accent.

const MODE_LABELS: Record<(typeof MODES)[number], string> = {
  time: "thời gian",
  words: "số từ",
};

const LANGUAGE_LABELS: Record<(typeof LANGUAGES)[number], string> = {
  vietnamese: "tiếng việt",
  english: "english",
};

export function TestConfig(): JSXElement {
  return (
    <div
      class={cn(
        "bt-options relative mx-auto mb-8 w-max max-w-[calc(100%-2rem)] place-self-center",
        "transition-opacity duration-125",
        // it stays on the result, which says what the test just taken was
        getFocus() ? "pointer-events-none opacity-0" : "",
      )}
      data-ui-element="testConfig"
    >
      <For each={LANGUAGES}>
        {(language) => (
          <Pill
            text={LANGUAGE_LABELS[language]}
            active={getConfig.language === language}
            onClick={() => {
              setConfig("language", language);
              restartTestEvent.dispatch();
            }}
          />
        )}
      </For>
      <span class="bt-options-divider"></span>
      <For each={MODES}>
        {(mode) => (
          <Pill
            text={MODE_LABELS[mode]}
            active={getConfig.mode === mode}
            onClick={() => {
              setConfig("mode", mode);
              restartTestEvent.dispatch();
            }}
          />
        )}
      </For>
      <span class="bt-options-divider"></span>
      <Show
        when={getConfig.mode === "words"}
        fallback={
          <For each={TIMES}>
            {(time) => (
              <Pill
                text={`${time}`}
                active={getConfig.time === time}
                onClick={() => {
                  setConfig("time", time);
                  restartTestEvent.dispatch();
                }}
              />
            )}
          </For>
        }
      >
        <For each={WORD_COUNTS}>
          {(count) => (
            <Pill
              text={`${count}`}
              active={getConfig.words === count}
              onClick={() => {
                setConfig("words", count);
                restartTestEvent.dispatch();
              }}
            />
          )}
        </For>
      </Show>
    </div>
  );
}

function Pill(props: {
  text: string;
  active: boolean;
  onClick: () => void;
}): JSXElement {
  return (
    <button
      type="button"
      class="bt-options-pill"
      aria-pressed={props.active}
      onClick={() => props.onClick()}
      disabled={getFocus()}
    >
      {props.text}
    </button>
  );
}
