import { For, JSXElement, Show } from "solid-js";

import {
  LANGUAGES,
  MODES,
  TIMES,
  WORD_COUNTS,
} from "../../../beartype/config-lock";
import { configMetadata } from "../../../config/metadata";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { restartTestEvent } from "../../../events/test";
import { getResultVisible, getFocus } from "../../../states/test";
import { FaObject } from "../../../types/font-awesome";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";

// beartype: upstream's bar also carried punctuation, numbers, quote, zen,
// custom text and a custom length behind a modal. What is left is the test's
// length and its language, and it shows at every width, because the modal
// that stood in for it on narrow screens is gone.

const variables = cn(
  "[--card-gap:0.5em] [--font-size:0.6em] [--horizontal-padding:0.45em] [--vertical-padding:0.6rem]",
  "lg:[--card-gap:1em] lg:[--font-size:0.75em] lg:[--horizontal-padding:0.5em] lg:[--vertical-padding:0.75rem]",
  "xl:[--card-gap:2em] xl:[--horizontal-padding:1em]",
);
const buttonClass = "px-(--horizontal-padding) py-(--vertical-padding)";
const cardClass =
  "card flex rounded-(--roundness) bg-sub-alt px-(--horizontal-padding)";

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
        variables,
        "relative mx-auto mb-8 flex w-max flex-wrap justify-center gap-(--card-gap) place-self-center [font-size:var(--font-size)]",
        "transition-opacity duration-125",
        getFocus() || getResultVisible() ? "pointer-events-none opacity-0" : "",
      )}
      data-ui-element="testConfig"
    >
      <div class={cardClass}>
        <For each={LANGUAGES}>
          {(language) => (
            <TCButton
              fa={{ icon: "fa-globe-americas" }}
              text={LANGUAGE_LABELS[language]}
              active={getConfig.language === language}
              onClick={() => {
                setConfig("language", language);
                restartTestEvent.dispatch();
              }}
            />
          )}
        </For>
      </div>
      <div class={cardClass}>
        <For each={MODES}>
          {(mode) => (
            <TCButton
              fa={
                configMetadata.mode.optionsMetadata?.[mode]?.fa ??
                configMetadata.mode.fa
              }
              text={MODE_LABELS[mode]}
              active={getConfig.mode === mode}
              onClick={() => {
                setConfig("mode", mode);
                restartTestEvent.dispatch();
              }}
            />
          )}
        </For>
      </div>
      <div class={cardClass}>
        <Show
          when={getConfig.mode === "words"}
          fallback={
            <For each={TIMES}>
              {(time) => (
                <TCButton
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
              <TCButton
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
    </div>
  );
}

function TCButton(props: {
  fa?: FaObject;
  text: string;
  active: boolean;
  onClick: () => void;
}): JSXElement {
  return (
    <Button
      variant="text"
      class={buttonClass}
      fa={props.fa ? { ...props.fa, fixedWidth: true } : undefined}
      text={props.text}
      active={props.active}
      onClick={props.onClick}
      disabled={getFocus() || getResultVisible()}
    />
  );
}
