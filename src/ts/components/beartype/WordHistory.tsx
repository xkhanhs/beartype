import { createSignal, For, JSXElement, Show } from "solid-js";

import type { WordRun } from "../../beartype/word-history";

import { t } from "../../beartype/strings";
import { cn } from "../../utils/cn";

/**
 * Every word of the round just typed, under the result, after upstream's
 * words history with its burst heatmap turned on: each word in the shade of
 * how fast it went against words of its length, and red when a wrong key
 * went in. It answers "which words held me up" for the round on screen,
 * where the books below answer it over many rounds.
 *
 * Folded behind a button, as upstream folds it: the result screen is read
 * for its two figures first, and a long text would push everything else
 * down. Once opened it stays open for the rounds after, until folded again.
 * Open, the words sit in a box of capped height that scrolls, so a text of
 * hundreds of words fits too -- which is why a word says its speed in the
 * line under the box rather than in a balloon: a scroll box cuts off the
 * balloons of its top row.
 *
 * `test-logic.ts` sets the words when a round ends.
 */

const [runs, setRuns] = createSignal<readonly WordRun[]>([]);
export { setRuns as setWordHistory };

const [open, setOpen] = createSignal(false);

const LEVELS = [0, 1, 2, 3, 4] as const;

function detail(run: WordRun): string {
  const parts = [run.target];
  if (run.wrong) parts.push(t("wordHistoryTyped", run.typed));
  parts.push(run.wpm === null ? t("wordHistoryNoSpeed") : `${run.wpm} wpm`);
  return parts.join(" · ");
}

export function WordHistory(): JSXElement {
  const [pointed, setPointed] = createSignal<WordRun | null>(null);

  return (
    <Show when={runs().length > 0}>
      <div class="bt-words-history">
        <button
          type="button"
          class="bt-settings-choice bt-words-history-toggle"
          aria-expanded={open()}
          onClick={() => setOpen(!open())}
        >
          {open() ? t("wordHistoryHide") : t("wordHistoryShow", runs().length)}
        </button>
        <Show when={open()}>
          <p
            class="bt-words-history-list"
            onMouseLeave={() => setPointed(null)}
          >
            <For each={runs()}>
              {(run) => (
                <span
                  class={cn("bt-wh-word", {
                    "bt-wh-wrong": run.wrong,
                    [`bt-wh-l${run.level}`]: !run.wrong && run.level !== null,
                  })}
                  tabIndex={0}
                  aria-label={detail(run)}
                  onMouseEnter={() => setPointed(run)}
                  onFocus={() => setPointed(run)}
                >
                  {run.target}
                </span>
              )}
            </For>
          </p>
          <p class="bt-words-history-detail" aria-live="polite">
            {pointed() === null
              ? t("wordHistoryPoint")
              : detail(pointed() as WordRun)}
          </p>
          <p class="bt-words-history-legend">
            <span>{t("wordHistorySlow")}</span>
            <For each={LEVELS}>
              {(level) => (
                <span
                  class={`bt-wh-swatch bt-wh-l${level}`}
                  aria-hidden="true"
                ></span>
              )}
            </For>
            <span>{t("wordHistoryFast")}</span>
            <span class="bt-wh-legend-wrong">{t("wordHistoryWrong")}</span>
          </p>
        </Show>
      </div>
    </Show>
  );
}
