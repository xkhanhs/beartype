import { createSignal, For, JSXElement, Show } from "solid-js";

import type { RecentSummary, RecentTest } from "../../beartype/local-results";

import Format from "../../singletons/format";

/**
 * The foot of the result screen, after keybear's `TypeTestStats`: how many
 * tests with these settings, the best, the usual, and a bar for each of the
 * last few. It answers the question that comes after the number just typed:
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
            <Figure value={wpm(s().best)} label="tốt nhất" />
            <Figure value={wpm(s().usual)} label="thường" />
            <Figure value={`${Math.round(s().usualAcc)}%`} label="chính xác" />
            <Figure value={`${s().count}`} label="số bài" />
          </div>
          <Show when={s().recent.length >= MIN_BARS}>
            <SpeedChart recent={s().recent} usual={s().usual} />
          </Show>
        </div>
      )}
    </Show>
  );
}

function Figure(props: { value: string; label: string }): JSXElement {
  return (
    <div class="bt-history-figure">
      <div class="bt-history-value">{props.value}</div>
      <div class="bt-history-label">{props.label}</div>
    </div>
  );
}

/**
 * The last few tests, oldest on the left.
 *
 * The axis does not start at zero. One pair of hands types inside a narrow
 * band -- 52 to 63 is a real week of progress -- and an axis from zero
 * squeezes that band into the top few pixels, so every bar looks the same.
 * The floor is the slowest test drawn and the ceiling the fastest, so what
 * shows is the difference, the one thing here worth seeing. Such an axis
 * cannot be read as a scale, so every bar carries its number in a balloon,
 * the last prints it, and a dashed line marks the usual speed.
 */
function SpeedChart(props: {
  recent: RecentTest[];
  usual: number;
}): JSXElement {
  const bounds = (): [number, number] => {
    const speeds = props.recent.map((t) => t.wpm);
    // the usual line stays inside the band, or it would stick to an edge
    return [Math.min(...speeds, props.usual), Math.max(...speeds, props.usual)];
  };
  // the lowest bar keeps a stub, to be seen and to be pointed at
  const height = (value: number): number => {
    const [floor, ceil] = bounds();
    return ceil > floor ? 14 + (86 * (value - floor)) / (ceil - floor) : 60;
  };

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
            <div class="bt-chart-slot">
              <span
                class="bt-chart-bar"
                classList={{
                  "bt-chart-bar-last": index() === props.recent.length - 1,
                }}
                style={{ height: `${height(test.wpm)}%` }}
                tabIndex={0}
                aria-label={`${wpm(test.wpm)} wpm · ${Math.round(test.acc)}% chính xác\n${new Date(
                  test.timestamp,
                ).toLocaleString("vi-VN", {
                  day: "numeric",
                  month: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
                data-balloon-pos={balloonPos(index(), props.recent.length)}
                data-balloon-break=""
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
