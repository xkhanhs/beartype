import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  JSXElement,
  on,
  onCleanup,
  Show,
} from "solid-js";

import type { RecentSummary, RecentTest } from "../../beartype/local-results";

import {
  measuredCount,
  MIN_WORD_SAMPLES,
  SLOW_BELOW,
  slowWords,
} from "../../beartype/slow-words";
import { locale, t } from "../../beartype/strings";
import { getConfig } from "../../config/store";
import Format from "../../singletons/format";
import { getLanguage } from "../../utils/json-data";

/**
 * The foot of the result screen, after keybear's `TypeTestStats`: how long
 * this language has been practised (time and words alike), the best on a
 * standard test, the usual speed, accuracy and consistency, and a
 * bar for each of the last few. It answers the question that comes after the number just typed:
 * is that good, for me?
 *
 * `result.ts` sets the summary when it draws the result.
 */

const [summary, setSummary] = createSignal<RecentSummary | null>(null);
export { setSummary as setResultHistory };

/**
 * Below this many tests there is no chart: four fat bars side by side read
 * as a broken progress bar, and the four figures above already say it all.
 */
const MIN_BARS = 5;

function wpm(value: number): string {
  return Format.typingSpeed(value);
}

/**
 * A bar is a few pixels wide and its balloon many times that, so centred on
 * the bars at either end it hangs off the edge of a narrow screen. Those open
 * inwards instead, as keybear's `Tooltip` does with `atStart` and `atEnd`.
 */
function balloonPos(index: number, count: number): string {
  if (index < 2) return "up-left";
  if (index >= count - 2) return "up-right";
  return "up";
}

export function ResultHistory(): JSXElement {
  return (
    <Show when={summary()}>
      {(s) => (
        <div class="bt-history">
          <div class="bt-history-row">
            <Figure
              value={s().best === null ? "-" : wpm(s().best as number)}
              label={t("historyBest")}
              hint={t("historyBestHint")}
            />
            <Figure value={wpm(s().usual)} label={t("historyUsual")} />
            <Figure
              value={`${Math.round(s().usualAcc)}%`}
              label={t("accuracy")}
            />
            <Figure
              value={practiceTime(s().practiceSeconds)}
              label={t("historyPractice")}
            />
            <Figure
              value={`${Math.round(s().usualConsistency)}%`}
              label={t("consistency")}
            />
          </div>
          <Show when={s().recent.length >= MIN_BARS}>
            <SpeedChart recent={s().recent} usual={s().usual} />
          </Show>
          <SlowWordsBar />
        </div>
      )}
    </Show>
  );
}

/**
 * Room either side of a count printed in its part: a number touching both
 * edges reads as squeezed, so the part must be this much wider to print it.
 */
const COUNT_PAD = 8;

type SlowPart = {
  key: "caughtUp" | "slow" | "unmeasured";
  count: number;
  label: () => string;
};

/**
 * The word list as one strip, after keybear's memory bar on its Colemak
 * screen: the words typed at pace, the slow ones, and the ones not typed
 * enough yet to judge, which add up to the whole list. "Not measured" is
 * drawn rather than dropped: it is the way still to go, and without it the
 * strip reads full after a week. See `beartype/slow-words.ts`.
 *
 * Each part prints its count when it has room -- measured, not guessed from
 * its share, since the share knows neither the strip's width nor the digits
 * -- and its balloon says the rest: the count, the share of the list, and
 * the rule that put a word there. The bar a word is held against is not the
 * usual speed shown above it, and differs with the word's length, so the
 * balloon names the rule rather than a number.
 */
function SlowWordsBar(): JSXElement {
  const [list] = createResource(
    () => getConfig.language,
    async (language) => new Set((await getLanguage(language)).words).size,
  );
  const measured = createMemo(() => measuredCount(getConfig.language));
  const slow = createMemo(() => slowWords(getConfig.language));
  const parts = createMemo((): SlowPart[] => {
    const total = list() ?? 0;
    return [
      {
        key: "caughtUp",
        count: measured() - slow().length,
        label: () => t("slowCaughtUp"),
      },
      { key: "slow", count: slow().length, label: () => t("slowSlow") },
      {
        key: "unmeasured",
        count: Math.max(0, total - measured()),
        label: () => t("slowUnmeasured"),
      },
    ];
  });
  // an empty part has nothing to point at, and would throw off which part
  // is first and last for the rounded ends and the balloons
  const drawn = createMemo(() => parts().filter((part) => part.count > 0));
  const total = (): number => Math.max(1, list() ?? 0);

  const balloon = (part: SlowPart): string => {
    const share = Math.round((100 * part.count) / total());
    const head = t("slowPart", part.label(), part.count, share);
    const percent = Math.round(SLOW_BELOW * 100);
    const rule =
      part.key === "unmeasured"
        ? t("slowUnmeasuredRule", MIN_WORD_SAMPLES)
        : part.key === "slow"
          ? t("slowSlowRule", percent)
          : t("slowCaughtUpRule", percent);
    return `${head}\n${rule}`;
  };

  // a signal, not a plain ref: the strip only exists once the word list has
  // loaded, which is after this component mounts
  const [bar, setBar] = createSignal<HTMLDivElement>();
  // a count that does not fit turns see-through rather than going away, so
  // the next measurement still has something to measure
  const fitCounts = (): void => {
    for (const label of bar()?.querySelectorAll<HTMLElement>("[data-count]") ??
      []) {
      const room = label.parentElement?.clientWidth ?? 0;
      label.classList.toggle(
        "bt-slow-count-hidden",
        label.scrollWidth + COUNT_PAD > room,
      );
    }
  };
  createEffect(on(drawn, () => queueMicrotask(fitCounts)));
  createEffect(() => {
    const node = bar();
    if (node === undefined) return;
    const observer = new ResizeObserver(fitCounts);
    observer.observe(node);
    onCleanup(() => observer.disconnect());
  });

  return (
    <Show when={measured() > 0 && list() !== undefined}>
      <div class="bt-slow">
        <div class="bt-slow-bar" ref={setBar}>
          <For each={drawn()}>
            {(part, index) => (
              <span
                class="bt-slow-slot"
                style={{ "inline-size": `${(100 * part.count) / total()}%` }}
                tabIndex={0}
                aria-label={balloon(part)}
                data-balloon-pos={
                  index() === 0
                    ? "up-left"
                    : index() === drawn().length - 1
                      ? "up-right"
                      : "up"
                }
                data-balloon-break=""
              >
                <span class={`bt-slow-part bt-slow-${part.key}`}>
                  <span class="bt-slow-count" data-count="" aria-hidden="true">
                    {part.count}
                  </span>
                </span>
              </span>
            )}
          </For>
        </div>
        <p class="bt-slow-legend">
          <For each={parts()}>
            {(part) => (
              <span class="bt-slow-legend-item">
                <span class={`bt-slow-dot bt-slow-${part.key}`}></span>
                {part.label()}
                <span class="bt-slow-legend-count">{part.count}</span>
              </span>
            )}
          </For>
        </p>
      </div>
    </Show>
  );
}

function practiceTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return t("practiceTime", Math.floor(minutes / 60), minutes % 60);
}

function Figure(props: {
  value: string;
  label: string;
  hint?: string;
}): JSXElement {
  return (
    <div
      class="bt-history-figure"
      aria-label={props.hint}
      data-balloon-pos={props.hint === undefined ? undefined : "down"}
    >
      <div class="bt-history-value">{props.value}</div>
      <div class="bt-history-label">{props.label}</div>
    </div>
  );
}

/**
 * The last few tests, oldest on the left.
 *
 * The axis starts at zero, so a bar's height is its speed. keybear floors it
 * at the slowest test drawn to show small differences, but then 46 stood as
 * a stub beside a tall 49: a bar's length is read as its value, whatever the
 * axis says. Every bar still carries its number in a balloon, the last prints
 * it, and a dashed line marks the usual speed.
 *
 * The balloon hangs off the bar's whole column, not the bar, as keybear's
 * `Tooltip` wraps the column: every balloon opens at the same height, over
 * the top of the chart, and the column answers to the pointer anywhere in it.
 */
function SpeedChart(props: {
  recent: RecentTest[];
  usual: number;
}): JSXElement {
  // the usual line stays inside the chart, even over every bar drawn
  const ceil = (): number =>
    Math.max(...props.recent.map((t) => t.wpm), props.usual);
  // the slowest bar keeps a stub, to be seen and to be pointed at
  const height = (value: number): number =>
    ceil() > 0 ? Math.max(4, (100 * value) / ceil()) : 4;

  return (
    <div class="bt-chart">
      <div class="bt-chart-plot">
        <span
          class="bt-chart-usual"
          style={{ bottom: `${height(props.usual)}%` }}
          aria-hidden="true"
        ></span>
        <For each={props.recent}>
          {(test, index) => (
            <div
              class="bt-chart-slot"
              classList={{
                "bt-chart-slot-last": index() === props.recent.length - 1,
              }}
              tabIndex={0}
              aria-label={t(
                "historyBar",
                wpm(test.wpm),
                Math.round(test.acc),
                new Date(test.timestamp).toLocaleString(locale(), {
                  day: "numeric",
                  month: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              )}
              data-balloon-pos={balloonPos(index(), props.recent.length)}
              data-balloon-break=""
            >
              <span
                class="bt-chart-bar"
                style={{ height: `${height(test.wpm)}%` }}
              >
                <Show when={index() === props.recent.length - 1}>
                  <span class="bt-chart-value">{wpm(test.wpm)}</span>
                </Show>
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
