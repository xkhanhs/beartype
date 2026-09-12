import { For, JSXElement, Show } from "solid-js";

import { Icon } from "./Icon";

/**
 * One row of keybear's settings card: the name, then the choices. What a
 * setting does is a sentence most people read once and never again, so it
 * hides behind a small `i` beside the name and comes back on hover -- the
 * card is short enough to take in at a glance. A row whose name says it all
 * carries no `i`.
 */
export function SettingsRow<T extends string | number>(props: {
  label: string;
  hint?: string;
  options: readonly T[];
  labels: Record<T, string>;
  /** The current setting, which may hold values this row does not offer. */
  value: string | number;
  onPick: (value: T) => void;
}): JSXElement {
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
      <div class="bt-settings-choices" role="group" aria-label={props.label}>
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
    </div>
  );
}
