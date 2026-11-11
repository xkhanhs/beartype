import {
  createSignal,
  For,
  JSXElement,
  onCleanup,
  Show,
  type Accessor,
} from "solid-js";

import {
  DIFFICULTIES,
  LANGUAGES,
  TIMES,
  WORD_COUNTS,
} from "../../../beartype/config-lock";
import {
  type CustomLength,
  customLength,
  customShuffle,
  customText,
  savedTextName,
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
// and a custom length behind a modal. What is left is three pills in one
// rounded strip, each saying what is set and nothing more: the words (a
// language, or the typist's own text), how long the test runs (a clock or a
// hash beside the number), and how much a mistake costs (an icon). Pointing
// at a pill drops a card under it with everything that pill stands for, in
// rows, named -- so the strip stays short however many choices there are,
// and the same strip fits a phone.
//
// A card has to survive the trip from its pill down into it. It hangs centred
// under its own pill, where the hand goes straight down to it: the pointer
// leaves the strip downward, never across a neighbour. A transparent strip
// over its top edge fills the gap, and leaving waits CLOSE_DELAY before it
// closes, for a hand that cuts the corner. A tap or a click opens it as well (a touch
// screen points at nothing), and so does the focus arriving by tab; a tap
// outside it or Escape closes it.

/** How long a card stays after the pointer leaves it and its pill. */
const CLOSE_DELAY = 400;

type Segment = "words" | "length" | "difficulty";
type WordsChoice = (typeof LANGUAGES)[number] | "custom";

const WORDS_CHOICES: readonly WordsChoice[] = [...LANGUAGES, "custom"];

const WORDS_LABELS: Record<WordsChoice, () => string> = {
  vietnamese: () => t("languageVietnamese"),
  english: () => t("languageEnglish"),
  custom: () => t("modeCustom"),
};

/** The language in the two letters of its tag, for a screen too narrow even
 * for its name. The same in both languages of the page, so not in `strings`. */
const LANGUAGE_TAGS: Record<(typeof LANGUAGES)[number], string> = {
  vietnamese: "vi",
  english: "en",
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

type Difficulty = (typeof DIFFICULTIES)[number];

const DIFFICULTY_ICONS: Record<Difficulty, IconName> = {
  normal: "feather",
  hard: "flame",
  expert: "skull",
};

const DIFFICULTY_LABELS: Record<Difficulty, () => string> = {
  normal: () => t("difficultyNormal"),
  hard: () => t("difficultyHard"),
  expert: () => t("difficultyExpert"),
};

const DIFFICULTY_RULES: Record<Difficulty, () => string> = {
  normal: () => t("difficultyNormalRule"),
  hard: () => t("difficultyHardRule"),
  expert: () => t("difficultyExpertRule"),
};

// a drill runs as upstream's custom mode, but on its source's words and as
// long as the test it stands in for: the bar names the source it came from
// and that length, so the typist still sees how long the round is
function isCustom(): boolean {
  return customSource() || textDrill();
}

function wordsChoice(): WordsChoice {
  return isCustom() ? "custom" : getConfig.language;
}

/** What the words pill says: the language, or the saved text by its name. */
function wordsName(): string {
  if (isCustom()) return savedTextName(customText()) ?? t("modeCustom");
  return WORDS_LABELS[getConfig.language]();
}

/** What the test counts: time or words, or the whole of a custom text. */
function kind(): CustomLength {
  if (customSource()) return customLength();
  // a text run once through has no length a drill shares: it takes a count
  if (textDrill()) return customLength() === "time" ? "time" : "words";
  const mode = drillBaseMode() ?? getConfig.mode;
  return mode === "words" ? "words" : "time";
}

/** What the test is set to run for, in the unit it counts. */
function length(): number {
  if (kind() === "text") return wordsOf(customText()).length;
  return kind() === "words" ? getConfig.words : getConfig.time;
}

// every choice in here changes the test, so each one starts a new one the
// moment it is made.
//
// Leaving the custom text for a word list keeps the length the text had; a
// whole text has no length of the list's, which falls back on time. Picking
// the custom text again, or with none written yet, opens its card.
const pickWords = (value: WordsChoice): void => {
  if (value === "custom") {
    if (isCustom() || wordsOf(customText()).length === 0) {
      openCustomTextEditor();
    } else {
      startCustomText();
    }
    return;
  }
  const leaving = getConfig.mode === "custom";
  const counted = kind() === "words" ? "words" : "time";
  setConfig("language", value);
  if (leaving) setConfig("mode", counted);
  restartTestEvent.dispatch();
};
// a time or a count picks what the test counts and how much in one go
const pickLength = (
  unit: "time" | "words",
  value: (typeof TIMES)[number] | (typeof WORD_COUNTS)[number],
): void => {
  if (isCustom()) {
    setCustomLength(unit);
  } else {
    setConfig("mode", unit);
  }
  setConfig(unit, value);
  restartTestEvent.dispatch();
};
const pickWholeText = (): void => {
  setCustomLength("text");
  restartTestEvent.dispatch();
};
const pickDifficulty = (value: Difficulty): void => {
  setConfig("difficulty", value);
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

export function TestConfig(): JSXElement {
  const [open, setOpen] = createSignal<Segment | null>(null);
  const [root, setRoot] = createSignal<HTMLDivElement>();

  const onPointerDown = (e: PointerEvent): void => {
    if (!(root()?.contains(e.target as Node) ?? false)) setOpen(null);
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape") setOpen(null);
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
      class={cn(
        "relative mx-auto mb-8 w-max max-w-[calc(100%-2rem)] place-self-center",
        "transition-opacity duration-125",
        // it stays on the result, which says what the test just taken was
        getFocus() ? "pointer-events-none opacity-0" : "",
      )}
      data-ui-element="testConfig"
    >
      <div class="bt-options">
        <Pill
          id="words"
          open={open}
          setOpen={setOpen}
          label={`${t("optionsSource")}: ${wordsName()}`}
          face={
            <span class="bt-options-face">
              <Show when={isCustom()}>
                <Icon name="pencil" />
              </Show>
              <span class="bt-options-name">{wordsName()}</span>
              <Show when={!isCustom()}>
                <span class="bt-options-tag">
                  {LANGUAGE_TAGS[getConfig.language]}
                </span>
              </Show>
            </span>
          }
        >
          <WordsCard />
        </Pill>
        <span class="bt-options-divider"></span>
        <Pill
          id="length"
          open={open}
          setOpen={setOpen}
          label={`${KIND_LABELS[kind()]()}: ${length()}`}
          face={
            <span class="bt-options-face bt-options-face-accent">
              <Icon name={KIND_ICONS[kind()]} />
              {length()}
            </span>
          }
        >
          <LengthCard />
        </Pill>
        <span class="bt-options-divider"></span>
        <Pill
          id="difficulty"
          open={open}
          setOpen={setOpen}
          label={`${t("optionsDifficulty")}: ${DIFFICULTY_LABELS[
            getConfig.difficulty
          ]()}`}
          face={
            <span
              class="bt-options-face bt-options-face-icon"
              data-difficulty={getConfig.difficulty}
            >
              <Icon name={DIFFICULTY_ICONS[getConfig.difficulty]} />
            </span>
          }
        >
          <DifficultyCard />
        </Pill>
      </div>
      <CustomTextEditor />
    </div>
  );
}

/**
 * One pill of the strip and the card it drops. Which card is open is held by
 * the strip, so pointing at the next pill swaps one card for the other at
 * once instead of showing both while the first waits out its delay.
 */
function Pill(props: {
  id: Segment;
  open: Accessor<Segment | null>;
  setOpen: (value: Segment | null) => void;
  /** What a screen reader hears for the pill: the name and what is set. */
  label: string;
  face: JSXElement;
  children: JSXElement;
}): JSXElement {
  let closing: ReturnType<typeof setTimeout> | undefined;
  let hovered = false;
  const isOpen = (): boolean => props.open() === props.id && !getFocus();

  const show = (): void => {
    clearTimeout(closing);
    props.setOpen(props.id);
  };
  const hideLater = (): void => {
    clearTimeout(closing);
    closing = setTimeout(() => {
      if (props.open() === props.id) props.setOpen(null);
    }, CLOSE_DELAY);
  };
  onCleanup(() => clearTimeout(closing));

  // a finger has no hover: on a touch screen the tap opens the card, and a
  // pointerleave after every lifted finger must not close it again
  const onEnter = (e: PointerEvent): void => {
    if (e.pointerType === "touch") return;
    hovered = true;
    show();
  };
  const onLeave = (e: PointerEvent): void => {
    if (e.pointerType === "touch") return;
    hovered = false;
    hideLater();
  };
  // a pick restarts the test, and the restart takes the focus to the words:
  // the card under the pointer stays all the same
  const onFocusOut = (e: FocusEvent): void => {
    const to = e.relatedTarget as Node | null;
    if (hovered || (e.currentTarget as Node).contains(to)) return;
    if (props.open() === props.id) props.setOpen(null);
  };

  return (
    <div
      class="bt-options-segment"
      ref={(el) => {
        // the focus events that bubble, which JSX has no attribute for
        el.addEventListener("focusin", show);
        el.addEventListener("focusout", onFocusOut);
      }}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <button
        type="button"
        class="bt-options-pill"
        aria-expanded={isOpen()}
        aria-label={props.label}
        disabled={getFocus()}
        onClick={show}
      >
        {props.face}
      </button>
      <Show when={isOpen()}>
        <div class="bt-options-card" role="group" aria-label={props.label}>
          {props.children}
        </div>
      </Show>
    </div>
  );
}

function WordsCard(): JSXElement {
  return (
    <>
      <SettingsRow
        label={t("optionsSource")}
        options={WORDS_CHOICES}
        labels={{
          vietnamese: WORDS_LABELS.vietnamese(),
          english: WORDS_LABELS.english(),
          custom: WORDS_LABELS.custom(),
        }}
        value={wordsChoice()}
        onPick={pickWords}
      />
      <Show when={isCustom()}>
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
    </>
  );
}

/** A time and a count, one row each, and for a text of one's own its whole. */
function LengthCard(): JSXElement {
  return (
    <>
      <SettingsRow
        label={t("modeTime")}
        options={TIMES}
        labels={numberLabels(TIMES)}
        value={kind() === "time" ? getConfig.time : ""}
        onPick={(value) => pickLength("time", value)}
      />
      <SettingsRow
        label={t("modeWords")}
        options={WORD_COUNTS}
        labels={numberLabels(WORD_COUNTS)}
        value={kind() === "words" ? getConfig.words : ""}
        onPick={(value) => pickLength("words", value)}
      />
      <Show when={customSource()}>
        <div class="bt-settings-row">
          <div class="bt-settings-row-name">{t("modeText")}</div>
          <div class="bt-settings-choices">
            <button
              type="button"
              class="bt-settings-choice"
              aria-pressed={kind() === "text"}
              onClick={pickWholeText}
            >
              {t("customTextWords", wordsOf(customText()).length)}
            </button>
          </div>
        </div>
      </Show>
    </>
  );
}

/** The three difficulties, each with the rule it plays by. */
function DifficultyCard(): JSXElement {
  return (
    <div class="bt-difficulty-list">
      <For each={DIFFICULTIES}>
        {(option) => (
          <button
            type="button"
            class="bt-difficulty-choice"
            data-difficulty={option}
            aria-pressed={getConfig.difficulty === option}
            onClick={() => pickDifficulty(option)}
          >
            <Icon name={DIFFICULTY_ICONS[option]} />
            <span class="bt-difficulty-name">
              {DIFFICULTY_LABELS[option]()}
            </span>
            <span class="bt-difficulty-rule">{DIFFICULTY_RULES[option]()}</span>
          </button>
        )}
      </For>
    </div>
  );
}
