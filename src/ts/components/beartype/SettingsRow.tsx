import { For, JSXElement, Match, Show, Switch } from "solid-js";

import { t } from "../../beartype/strings";
import { Icon } from "./Icon";

/**
 * One row of keybear's settings card: the name, then the choices. What a
 * setting does is a sentence most people read once and never again, so it
 * hides behind a small `i` beside the name and comes back on hover -- the
 * card is short enough to take in at a glance. A row whose name says it all
 * carries no `i`.
 *
 * A row of two whose first is `off` is a plain on and off, and is drawn as a
 * switch, as iOS does, rather than two pills: one control, read at a glance.
 * A row of many steps of one scale (the size of the words) is a stepper, and
 * a row of many long names a dropdown, so every row stays on one line.
 */
export function SettingsRow<T extends string | number>(props: {
  label: string;
  hint?: string;
  options: readonly T[];
  labels: Record<T, string>;
  /** The current setting, which may hold values this row does not offer. */
  value: string | number;
  onPick: (value: T) => void;
  /** How a row of more than two is drawn; pills unless said otherwise. */
  control?: "stepper" | "select";
}): JSXElement {
  const index = (): number => props.options.findIndex((o) => o === props.value);
  const step = (by: number): void => {
    const next = props.options[index() + by];
    if (next !== undefined) props.onPick(next);
  };

  return (
    <div class="bt-settings-row">
      <div class="bt-settings-row-name">
        {props.label}
        <Show when={props.hint}>
          {(hint) => (
            <button
              type="button"
              class="bt-settings-info"
              aria-label={hint()}
              data-balloon-pos="down"
              data-balloon-length="medium"
            >
              <Icon name="info" />
            </button>
          )}
        </Show>
      </div>
      <Switch
        fallback={
          <div
            class="bt-settings-choices"
            role="group"
            aria-label={props.label}
          >
            <For each={props.options}>
              {(option) => (
                <button
                  type="button"
                  class="bt-settings-choice"
                  aria-pressed={props.value === option}
                  onClick={() => props.onPick(option)}
                >
                  {props.labels[option]}
                </button>
              )}
            </For>
          </div>
        }
      >
        <Match when={props.options.length === 2 && props.options[0] === "off"}>
          <button
            type="button"
            role="switch"
            class="bt-switch"
            aria-checked={props.value === props.options[1]}
            aria-label={props.label}
            onClick={() =>
              props.onPick(
                (props.value === props.options[1]
                  ? props.options[0]
                  : props.options[1]) as T,
              )
            }
          >
            <span class="bt-switch-knob"></span>
          </button>
        </Match>
        <Match when={props.control === "stepper"}>
          <div class="bt-stepper" role="group" aria-label={props.label}>
            <button
              type="button"
              class="bt-stepper-button"
              aria-label={t("stepDown")}
              disabled={index() <= 0}
              onClick={() => step(-1)}
            >
              −
            </button>
            <output class="bt-stepper-value" aria-live="polite">
              {index() === -1
                ? props.value
                : props.labels[props.options[index()] as T]}
            </output>
            <button
              type="button"
              class="bt-stepper-button"
              aria-label={t("stepUp")}
              disabled={index() >= props.options.length - 1}
              onClick={() => step(1)}
            >
              +
            </button>
          </div>
        </Match>
        <Match when={props.control === "select"}>
          <select
            class="bt-settings-select"
            aria-label={props.label}
            value={String(props.value)}
            onChange={(e) => {
              const picked = props.options.find(
                (o) => String(o) === e.currentTarget.value,
              );
              if (picked !== undefined) props.onPick(picked);
            }}
          >
            <For each={props.options}>
              {(option) => (
                <option value={String(option)}>{props.labels[option]}</option>
              )}
            </For>
          </select>
        </Match>
      </Switch>
    </div>
  );
}
