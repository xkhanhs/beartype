import {
  createSignal,
  For,
  JSXElement,
  onCleanup,
  Show,
  type Accessor,
} from "solid-js";

import {
  LANGUAGES,
  MODES,
  TIMES,
  WORD_COUNTS,
} from "../../../beartype/config-lock";
import { customText, wordsOf } from "../../../beartype/custom-text";
import { t } from "../../../beartype/strings";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { restartTestEvent } from "../../../events/test";
import { getFocus } from "../../../states/test";
import { drillBaseMode } from "../../../test/practise-words";
import { cn } from "../../../utils/cn";
import {
  CustomTextEditor,
  openCustomTextEditor,
} from "../../beartype/CustomTextEditor";
import { Icon, type IconName } from "../../beartype/Icon";
import { SettingsRow } from "../../beartype/SettingsRow";

// beartype: upstream's bar also carried punctuation, numbers, quote, zen
// and a custom length behind a modal. What is left is the test's language,
// its length and the custom text, drawn as keybear's options bar: one rounded
// strip, the groups split by a thin rule, the choice in use filled with the
// accent. In the custom mode the lengths give way to one pill with the text's
// word count, which opens the text's card.
//
// The strip is at most about 44rem wide (the Vietnamese page, counting
// words), and wants an inch of air on each side, so under 47rem it folds into
// one pill saying what is set -- the language, then the length in the accent
// with a clock, a hash or a pencil for which of the three it counts. The pill
// opens a card with the same choices in rows, where they are free to wrap. A
// strip that scrolled sideways instead would hide the choices at its end with
// nothing to say they are there.

const NARROW_SCREEN = "(width < 47rem)";

const MODE_LABELS: Record<(typeof MODES)[number], () => string> = {
  time: () => t("modeTime"),
  words: () => t("modeWords"),
  custom: () => t("modeCustom"),
};

const LANGUAGE_LABELS: Record<(typeof LANGUAGES)[number], () => string> = {
  vietnamese: () => t("languageVietnamese"),
  english: () => t("languageEnglish"),
};

/** The language in the two letters of its tag, for a screen too narrow even
 * for its name. The same in both languages of the page, so not in `strings`. */
const LANGUAGE_TAGS: Record<(typeof LANGUAGES)[number], string> = {
  vietnamese: "vi",
  english: "en",
};

// a drill runs as upstream's custom mode, but as long as the test
// it stands in for; the bar lights that one, time or words, so the typist
// still sees how long the round is
function mode(): string {
  return getConfig.mode === "custom"
    ? (drillBaseMode() ?? getConfig.mode)
    : getConfig.mode;
}

/** The mode's own name, for the label a screen reader hears. */
function modeLabel(): string {
  return MODE_LABELS[mode() as (typeof MODES)[number]]();
}

/** What the test is set to run for, in the unit the mode counts. */
function length(): number {
  if (mode() === "custom") return wordsOf(customText()).length;
  return mode() === "words" ? getConfig.words : getConfig.time;
}

// every choice in here changes what the words are, so each one starts a new
// test the moment it is made
const pickLanguage = (value: (typeof LANGUAGES)[number]): void => {
  setConfig("language", value);
  restartTestEvent.dispatch();
};
// the custom mode opens its card instead, and turns on from there once
// there is a text to type -- again, when it is on, to change the text
const pickMode = (value: (typeof MODES)[number]): void => {
  if (value === "custom") {
    openCustomTextEditor();
    return;
  }
  setConfig("mode", value);
  restartTestEvent.dispatch();
};
const pickTime = (value: (typeof TIMES)[number]): void => {
  setConfig("time", value);
  restartTestEvent.dispatch();
};
const pickWords = (value: (typeof WORD_COUNTS)[number]): void => {
  setConfig("words", value);
  restartTestEvent.dispatch();
};

/** Numbers are their own labels, whichever language the page speaks. */
function numberLabels<T extends number>(
  options: readonly T[],
): Record<T, string> {
  return Object.fromEntries(options.map((n) => [n, `${n}`])) as Record<
    T,
    string
  >;
}

function createNarrow(): Accessor<boolean> {
  const query = window.matchMedia(NARROW_SCREEN);
  const [narrow, setNarrow] = createSignal(query.matches);
  const onChange = (e: MediaQueryListEvent): void => {
    setNarrow(e.matches);
  };
  query.addEventListener("change", onChange);
  onCleanup(() => query.removeEventListener("change", onChange));
  return narrow;
}

export function TestConfig(): JSXElement {
  const narrow = createNarrow();

  return (
    <div
      class={cn(
        "relative mx-auto mb-8 w-max max-w-[calc(100%-2rem)] place-self-center",
        "transition-opacity duration-125",
        // it stays on the result, which says what the test just taken was
        getFocus() ? "pointer-events-none opacity-0" : "",
      )}
      data-ui-element="testConfig"
    >
      <Show when={narrow()} fallback={<Strip />}>
        <Summary />
      </Show>
      <CustomTextEditor />
    </div>
  );
}

/** The whole bar, every choice in reach: one strip of pills. */
function Strip(): JSXElement {
  return (
    <div class="bt-options">
      <For each={LANGUAGES}>
        {(language) => (
          <Pill
            text={LANGUAGE_LABELS[language]()}
            active={getConfig.language === language}
            onClick={() => pickLanguage(language)}
          />
        )}
      </For>
      <span class="bt-options-divider"></span>
      <For each={MODES}>
        {(option) => (
          <Pill
            text={MODE_LABELS[option]()}
            active={mode() === option}
            onClick={() => pickMode(option)}
          />
        )}
      </For>
      <span class="bt-options-divider"></span>
      <Show
        when={mode() !== "custom"}
        fallback={
          <Pill
            text={t("customTextWords", length())}
            icon="pencil"
            label={t("customTextEdit")}
            active={false}
            onClick={openCustomTextEditor}
          />
        }
      >
        <Show
          when={mode() === "words"}
          fallback={
            <For each={TIMES}>
              {(time) => (
                <Pill
                  text={`${time}`}
                  active={getConfig.time === time}
                  onClick={() => pickTime(time)}
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
                onClick={() => pickWords(count)}
              />
            )}
          </For>
        </Show>
      </Show>
    </div>
  );
}

function Pill(props: {
  text: string;
  icon?: IconName;
  /** What a screen reader hears, when the text alone does not say it. */
  label?: string;
  active: boolean;
  onClick: () => void;
}): JSXElement {
  return (
    <button
      type="button"
      class="bt-options-pill"
      aria-pressed={props.active}
      aria-label={props.label}
      onClick={() => props.onClick()}
      disabled={getFocus()}
    >
      <Show when={props.icon}>{(icon) => <Icon name={icon()} />}</Show>
      {props.text}
    </button>
  );
}

/**
 * The bar on a narrow screen: one pill saying what is set, and the card of
 * rows it opens. The card is keybear's settings card, closed the same two
 * ways -- a tap outside it or Escape. A choice leaves it open: language,
 * mode and length are often changed together, and the typist says when they
 * are done by tapping away.
 */
function Summary(): JSXElement {
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
    <div ref={setRoot} class="contents">
      <button
        type="button"
        class="bt-options-summary"
        aria-expanded={open()}
        aria-haspopup="dialog"
        aria-label={`${t("testOptions")}: ${LANGUAGE_LABELS[
          getConfig.language
        ]()}, ${modeLabel()}, ${length()}`}
        disabled={getFocus()}
        onClick={() => setOpen(!open())}
      >
        <span class="bt-options-summary-name">
          {LANGUAGE_LABELS[getConfig.language]()}
        </span>
        <span class="bt-options-summary-tag">
          {LANGUAGE_TAGS[getConfig.language]}
        </span>
        <span class="bt-options-summary-dot" aria-hidden="true">
          ·
        </span>
        <span class="bt-options-summary-length">
          <Icon
            name={
              mode() === "custom"
                ? "pencil"
                : mode() === "words"
                  ? "hash"
                  : "clock"
            }
          />
          {length()}
        </span>
      </button>
      <Show when={open() && !getFocus()}>
        <div
          class="bt-options-card"
          role="dialog"
          aria-label={t("testOptions")}
        >
          <SettingsRow
            label={t("optionsLanguage")}
            options={LANGUAGES}
            labels={{
              vietnamese: LANGUAGE_LABELS.vietnamese(),
              english: LANGUAGE_LABELS.english(),
            }}
            value={getConfig.language}
            onPick={pickLanguage}
          />
          <SettingsRow
            label={t("optionsMode")}
            options={MODES}
            labels={{
              time: MODE_LABELS.time(),
              words: MODE_LABELS.words(),
              custom: MODE_LABELS.custom(),
            }}
            value={mode()}
            onPick={pickMode}
          />
          <Show
            when={mode() !== "custom"}
            fallback={
              <div class="bt-settings-row">
                <div class="bt-settings-row-name">{t("customText")}</div>
                <div class="bt-settings-choices">
                  <button
                    type="button"
                    class="bt-settings-choice"
                    aria-label={t("customTextEdit")}
                    onClick={openCustomTextEditor}
                  >
                    {t("customTextWords", length())}
                  </button>
                </div>
              </div>
            }
          >
            <Show
              when={mode() === "words"}
              fallback={
                <SettingsRow
                  label={t("optionsLength")}
                  options={TIMES}
                  labels={numberLabels(TIMES)}
                  value={getConfig.time}
                  onPick={pickTime}
                />
              }
            >
              <SettingsRow
                label={t("optionsLength")}
                options={WORD_COUNTS}
                labels={numberLabels(WORD_COUNTS)}
                value={getConfig.words}
                onPick={pickWords}
              />
            </Show>
          </Show>
        </div>
      </Show>
    </div>
  );
}
