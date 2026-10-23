import {
  createSignal,
  For,
  JSXElement,
  Match,
  onCleanup,
  Show,
  Switch,
  type Accessor,
} from "solid-js";

import { LANGUAGES, TIMES, WORD_COUNTS } from "../../../beartype/config-lock";
import {
  CUSTOM_LENGTHS,
  type CustomLength,
  customLength,
  customShuffle,
  customText,
  setCustomLength,
  setCustomShuffle,
  wordsOf,
} from "../../../beartype/custom-text";
import { t } from "../../../beartype/strings";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { restartTestEvent } from "../../../events/test";
import { getFocus } from "../../../states/test";
import {
  customSource,
  drillBaseMode,
  textDrill,
} from "../../../test/practise-words";
import { cn } from "../../../utils/cn";
import {
  CustomTextEditor,
  openCustomTextEditor,
  startCustomText,
} from "../../beartype/CustomTextEditor";
import { Icon, type IconName } from "../../beartype/Icon";
import { SettingsRow } from "../../beartype/SettingsRow";

// beartype: upstream's bar also carried punctuation, numbers, quote, zen
// and a custom length behind a modal. What is left is drawn as keybear's
// options bar -- one rounded strip, the groups split by a thin rule, the
// choice in use filled with the accent. It opens on where the words come
// from, two tabs: the word list, or the typist's own text. The group after
// it belongs to the tab: the list's language, or the text's pencil and
// shuffle -- a text of one's own has no language to pick, and its typing
// font follows its marks (`ui.ts`). Then what the test counts (a time, a
// number of words, or for a text of one's own, the whole of it) and how
// much.
//
// The strip is at most about 52rem wide (the Vietnamese page, the word list
// by time), and wants an inch of air on each side, so under 55rem it folds into one
// pill saying what is set -- the language (or "custom"), then the length in
// the accent with a clock, a hash or a pencil for which of the three it
// counts. The
// pill opens a card with the same choices in rows, where they are free to
// wrap. A strip that scrolled sideways instead would hide the choices at its
// end with nothing to say they are there.

const NARROW_SCREEN = "(width < 55rem)";

const SOURCES = ["random", "custom"] as const;
type Source = (typeof SOURCES)[number];

const SOURCE_LABELS: Record<Source, () => string> = {
  random: () => t("sourceRandom"),
  custom: () => t("modeCustom"),
};

const KIND_LABELS: Record<CustomLength, () => string> = {
  time: () => t("modeTime"),
  words: () => t("modeWords"),
  text: () => t("modeText"),
};

const KIND_ICONS: Record<CustomLength, IconName> = {
  time: "clock",
  words: "hash",
  text: "pencil",
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

// a drill runs as upstream's custom mode, but on its source's words and as
// long as the test it stands in for: the bar lights the source it came from
// and that length, so the typist still sees how long the round is
function source(): Source {
  return customSource() || textDrill() ? "custom" : "random";
}

/** What the test counts: time or words, or the whole of a custom text. */
function kind(): CustomLength {
  if (customSource()) return customLength();
  // a text run once through has no length a drill shares: it takes a count
  if (textDrill()) return customLength() === "time" ? "time" : "words";
  const mode = drillBaseMode() ?? getConfig.mode;
  return mode === "words" ? "words" : "time";
}

/** The kinds on offer: only a text of one's own has a whole to run through. */
function kinds(): readonly CustomLength[] {
  return source() === "custom" ? CUSTOM_LENGTHS : ["time", "words"];
}

/** What the test is set to run for, in the unit it counts. */
function length(): number {
  if (kind() === "text") return wordsOf(customText()).length;
  return kind() === "words" ? getConfig.words : getConfig.time;
}

/** What the folded pill names first: the list's language, or the text. */
function sourceName(): string {
  return source() === "custom"
    ? SOURCE_LABELS.custom()
    : LANGUAGE_LABELS[getConfig.language]();
}

// every choice in here changes what the words are, so each one starts a new
// test the moment it is made
const pickLanguage = (value: (typeof LANGUAGES)[number]): void => {
  setConfig("language", value);
  restartTestEvent.dispatch();
};
// the word list keeps the length the text had, and the text the list's; a
// whole text has no length of the list's, which falls back on time. Picking
// the custom text again, or with none written yet, opens its card.
const pickSource = (value: Source): void => {
  if (value === "custom") {
    if (source() === "custom" || wordsOf(customText()).length === 0) {
      openCustomTextEditor();
    } else {
      startCustomText();
    }
    return;
  }
  if (getConfig.mode !== "custom") return;
  setConfig("mode", kind() === "words" ? "words" : "time");
  restartTestEvent.dispatch();
};
const pickKind = (value: CustomLength): void => {
  if (source() === "custom") {
    setCustomLength(value);
  } else if (value !== "text") {
    setConfig("mode", value);
  }
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
const toggleShuffle = (): void => {
  setCustomShuffle(!customShuffle());
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
      <Group label={t("optionsSource")}>
        <For each={SOURCES}>
          {(option) => (
            <Pill
              text={SOURCE_LABELS[option]()}
              active={source() === option}
              onClick={() => pickSource(option)}
            />
          )}
        </For>
      </Group>
      <span class="bt-options-divider"></span>
      <Show
        when={source() === "custom"}
        fallback={
          <Group label={t("optionsLanguage")}>
            <For each={LANGUAGES}>
              {(language) => (
                <Pill
                  text={LANGUAGE_LABELS[language]()}
                  active={getConfig.language === language}
                  onClick={() => pickLanguage(language)}
                />
              )}
            </For>
          </Group>
        }
      >
        {/* each icon names itself in its own balloon */}
        <Group label={t("customText")} balloon={false}>
          <Pill
            icon="pencil"
            label={t("customTextEdit")}
            active={false}
            onClick={openCustomTextEditor}
          />
          <Pill
            icon="shuffle"
            label={t("shuffle")}
            active={customShuffle()}
            onClick={toggleShuffle}
          />
        </Group>
      </Show>
      <span class="bt-options-divider"></span>
      <Group label={t("optionsMode")}>
        <For each={kinds()}>
          {(option) => (
            <Pill
              text={KIND_LABELS[option]()}
              active={kind() === option}
              onClick={() => pickKind(option)}
            />
          )}
        </For>
      </Group>
      <span class="bt-options-divider"></span>
      <Group label={t("optionsLength")}>
        <Switch>
          <Match when={kind() === "text"}>
            <Pill
              text={t("customTextWords", length())}
              icon="pencil"
              label={t("customTextEdit")}
              active={false}
              onClick={openCustomTextEditor}
            />
          </Match>
          <Match when={kind() === "words"}>
            <For each={WORD_COUNTS}>
              {(count) => (
                <Pill
                  text={`${count}`}
                  active={getConfig.words === count}
                  onClick={() => pickWords(count)}
                />
              )}
            </For>
          </Match>
          <Match when={kind() === "time"}>
            <For each={TIMES}>
              {(time) => (
                <Pill
                  text={`${time}`}
                  active={getConfig.time === time}
                  onClick={() => pickTime(time)}
                />
              )}
            </For>
          </Match>
        </Switch>
      </Group>
    </div>
  );
}

/**
 * One group of the strip. The strip names none of its groups -- the card a
 * narrow screen opens has a name on each row, the strip has no room -- so
 * each says what it is in a balloon, wherever the pointer rests on it.
 */
function Group(props: {
  label: string;
  /** Off for a group whose pills each carry a balloon of their own. */
  balloon?: boolean;
  children: JSXElement;
}): JSXElement {
  return (
    <div
      class="bt-options-group"
      role="group"
      aria-label={props.label}
      data-balloon-pos={props.balloon === false ? undefined : "down"}
    >
      {props.children}
    </div>
  );
}

function Pill(props: {
  /** Left out for an icon alone, which then names itself in a balloon. */
  text?: string;
  icon?: IconName;
  /** What a screen reader hears, when the text alone does not say it. */
  label?: string;
  active: boolean;
  onClick: () => void;
}): JSXElement {
  return (
    <button
      type="button"
      class={cn(
        "bt-options-pill",
        props.text === undefined && "bt-options-pill-icon",
      )}
      aria-pressed={props.active}
      aria-label={props.label}
      data-balloon-pos={props.text === undefined ? "down" : undefined}
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
        aria-label={`${t("testOptions")}: ${sourceName()}, ${KIND_LABELS[
          kind()
        ]()}, ${length()}`}
        disabled={getFocus()}
        onClick={() => setOpen(!open())}
      >
        <span class="bt-options-summary-name">{sourceName()}</span>
        <span class="bt-options-summary-tag">
          <Show
            when={source() === "custom"}
            fallback={LANGUAGE_TAGS[getConfig.language]}
          >
            <Icon name="pencil" />
          </Show>
        </span>
        <span class="bt-options-summary-dot" aria-hidden="true">
          ·
        </span>
        <span class="bt-options-summary-length">
          <Icon name={KIND_ICONS[kind()]} />
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
            label={t("optionsSource")}
            options={SOURCES}
            labels={{
              random: SOURCE_LABELS.random(),
              custom: SOURCE_LABELS.custom(),
            }}
            value={source()}
            onPick={pickSource}
          />
          <Show
            when={source() === "custom"}
            fallback={
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
            }
          >
            <div class="bt-settings-row">
              <div class="bt-settings-row-name">{t("customText")}</div>
              <div class="bt-settings-choices">
                <button
                  type="button"
                  class="bt-settings-choice"
                  aria-label={t("customTextEdit")}
                  onClick={openCustomTextEditor}
                >
                  <Icon name="pencil" />
                  {t("customTextWords", wordsOf(customText()).length)}
                </button>
              </div>
            </div>
            <SettingsRow
              label={t("shuffle")}
              options={["off", "on"] as const}
              labels={{ off: t("off"), on: t("on") }}
              value={customShuffle() ? "on" : "off"}
              onPick={(value) => {
                if ((value === "on") !== customShuffle()) toggleShuffle();
              }}
            />
          </Show>
          <SettingsRow
            label={t("optionsMode")}
            options={kinds()}
            labels={{
              time: KIND_LABELS.time(),
              words: KIND_LABELS.words(),
              text: KIND_LABELS.text(),
            }}
            value={kind()}
            onPick={pickKind}
          />
          {/* a whole text is as long as it is: the row above edits it */}
          <Switch>
            <Match when={kind() === "words"}>
              <SettingsRow
                label={t("optionsLength")}
                options={WORD_COUNTS}
                labels={numberLabels(WORD_COUNTS)}
                value={getConfig.words}
                onPick={pickWords}
              />
            </Match>
            <Match when={kind() === "time"}>
              <SettingsRow
                label={t("optionsLength")}
                options={TIMES}
                labels={numberLabels(TIMES)}
                value={getConfig.time}
                onPick={pickTime}
              />
            </Match>
          </Switch>
        </div>
      </Show>
    </div>
  );
}
