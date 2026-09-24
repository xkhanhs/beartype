import { createMemo, createSignal, For, JSXElement, Show } from "solid-js";

import { t } from "../../beartype/strings";
import {
  currentLayout,
  exportPage,
  type Layout,
  LAYOUTS,
  pageFor,
  setCurrentLayout,
} from "../../beartype/transition-book";
import {
  type BigramKind,
  type GramRow,
  type Row,
  transitionReport,
  type TrigramKind,
} from "../../beartype/transition-kinds";

/**
 * Where the hand slows down, read from the book of key moves
 * (`beartype/transition-book.ts`): by kind of move, then the slowest pairs
 * and triples. After keybear's `TransitionCard` on its Colemak screen.
 *
 * Folded away under its title: the result screen is for the number just
 * typed, and this is a table to open now and then, not after every test.
 * The layout pills sit inside it because the book is per layout and only the
 * typist knows which one the system is on.
 */

/** Tests on a layout before its table opens: early on one stumble tops it. */
const MIN_ROUNDS = 10;

/** Lines in each "slowest" list. */
const LIST_LENGTH = 8;

const LAYOUT_LABEL: Record<Layout, () => string> = {
  "dh-viet": () => "DH-Việt",
  "dh-viet-vb": () => t("movesVb"),
  "dh-viet-vt": () => t("movesVt"),
};

const KIND_LABEL: Record<BigramKind | TrigramKind, () => string> = {
  "sfb-far": () => t("moveSfbFar"),
  "sfb-near": () => t("moveSfbNear"),
  scissor: () => t("moveScissor"),
  "roll-in": () => t("moveRollIn"),
  "roll-out": () => t("moveRollOut"),
  alternate: () => t("moveAlternate"),
  repeat: () => t("moveRepeat"),
  redirect: () => t("moveRedirect"),
  sfs: () => t("moveSfs"),
  roll: () => t("moveRoll"),
  split: () => t("moveSplit"),
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function relative(value: number): string {
  const delta = Math.round((value - 1) * 100);
  return delta > 0 ? `+${delta}%` : `${delta}%`;
}

/** Slow enough to look at. */
const slow = (value: number): boolean => value >= 1.25;

export function TransitionPanel(): JSXElement {
  const layout = createMemo(currentLayout);
  const page = createMemo(() => pageFor(layout()));
  const report = createMemo(() => transitionReport(page(), layout()));
  const [copied, setCopied] = createSignal(false);

  return (
    <details class="bt-moves">
      <summary class="bt-moves-title">{t("movesTitle")}</summary>
      <div class="bt-moves-layouts" role="group" aria-label={t("movesLayout")}>
        <span
          class="bt-moves-label"
          aria-label={t("movesLayoutHint")}
          data-balloon-pos="up"
          data-balloon-length="large"
        >
          {t("movesLayout")}
        </span>
        <For each={LAYOUTS}>
          {(id) => (
            <button
              type="button"
              class="bt-moves-pill"
              classList={{ "bt-moves-pill-on": layout() === id }}
              aria-pressed={layout() === id}
              onClick={() => {
                setCurrentLayout(id);
                setCopied(false);
              }}
            >
              {LAYOUT_LABEL[id]()}
            </button>
          )}
        </For>
      </div>
      <Show when={page().rounds >= MIN_ROUNDS}>
        <p class="bt-moves-note">{t("movesRounds", page().rounds)}</p>
      </Show>
      <Show
        when={page().rounds >= MIN_ROUNDS}
        fallback={
          <p class="bt-moves-note">
            {t("movesEmpty", page().rounds, MIN_ROUNDS)}
          </p>
        }
      >
        <p class="bt-moves-note">{t("movesLegend")}</p>
        <KindTable title={t("movesPairs")} rows={report().bigrams.kinds} />
        <KindTable title={t("movesTriples")} rows={report().trigrams.kinds} />
        <div class="bt-moves-lists">
          <SlowList
            title={t("movesSlowPairs")}
            rows={report().bigrams.slowest.slice(0, LIST_LENGTH)}
          />
          <SlowList
            title={t("movesSlowTriples")}
            rows={report().trigrams.slowest.slice(0, LIST_LENGTH)}
          />
        </div>
        <div class="bt-moves-lists">
          <MissList
            title={t("movesMissedPairs")}
            rows={report().bigrams.missed.slice(0, LIST_LENGTH)}
          />
          <MissList
            title={t("movesMissedTriples")}
            rows={report().trigrams.missed.slice(0, LIST_LENGTH)}
          />
        </div>
      </Show>
      <Show when={page().rounds > 0}>
        <button
          type="button"
          class="bt-moves-pill"
          onClick={() => {
            void navigator.clipboard.writeText(exportPage(layout())).then(
              () => setCopied(true),
              () => undefined,
            );
          }}
        >
          {copied() ? t("movesCopied") : t("movesCopy")}
        </button>
      </Show>
    </details>
  );
}

function KindTable(props: {
  title: string;
  rows: Row<BigramKind | TrigramKind>[];
}): JSXElement {
  return (
    <table class="bt-moves-table">
      <caption>{props.title}</caption>
      <thead>
        <tr>
          <th></th>
          <th>{t("movesShare")}</th>
          <th>ms</th>
          <th>{t("movesRelative")}</th>
          <th>{t("movesMissed")}</th>
        </tr>
      </thead>
      <tbody>
        <For each={props.rows}>
          {(row) => (
            <tr>
              <th scope="row">{KIND_LABEL[row.kind]()}</th>
              <td>{percent(row.count)}</td>
              <td>{Math.round(row.ms)}</td>
              <td classList={{ "bt-moves-slow": slow(row.relative) }}>
                {relative(row.relative)}
              </td>
              <td>{percent(row.missRate)}</td>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
}

function SlowList(props: {
  title: string;
  rows: GramRow<BigramKind | TrigramKind>[];
}): JSXElement {
  return (
    <div>
      <div class="bt-moves-caption">{props.title}</div>
      <ol class="bt-moves-list">
        <For each={props.rows}>
          {(row) => (
            <li>
              <span class="bt-moves-gram">{row.gram}</span>
              <span classList={{ "bt-moves-slow": slow(row.relative) }}>
                {relative(row.relative)}
              </span>
              <span class="bt-moves-kind">{KIND_LABEL[row.kind]()}</span>
            </li>
          )}
        </For>
      </ol>
    </div>
  );
}

/** Counts shown whole: the book holds decayed ones, `0.73` is one slip. */
const whole = (value: number): number => Math.max(1, Math.round(value));

function MissList(props: {
  title: string;
  rows: GramRow<BigramKind | TrigramKind>[];
}): JSXElement {
  return (
    <div>
      <div class="bt-moves-caption">{props.title}</div>
      <ol class="bt-moves-list">
        <For each={props.rows}>
          {(row) => (
            <li>
              <span class="bt-moves-gram">{row.gram}</span>
              <span>{percent(row.missRate)}</span>
              <span class="bt-moves-kind">
                {t(
                  "movesMissCount",
                  whole(row.count * row.missRate),
                  whole(row.count),
                )}
              </span>
            </li>
          )}
        </For>
      </ol>
    </div>
  );
}
