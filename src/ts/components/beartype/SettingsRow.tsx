import { For, JSXElement } from "solid-js";

import { SettingsRowText as RowText } from "./SettingsRowText";

/** One row of keybear's settings card: name and hint, then the choices. */
export function SettingsRow<T extends string | number>(props: {
  label: string;
  hint: string;
  options: readonly T[];
  labels: Record<T, string>;
  /** Draws each choice in its own font, for a row that picks one. */
  fontOf?: (option: T) => string;
  /** The current setting, which may hold values this row does not offer. */
  value: string | number;
  onPick: (value: T) => void;
}): JSXElement {
  return (
    <div class="bt-settings-row">
      <RowText label={props.label} hint={props.hint} />
      <div class="bt-settings-choices" role="group" aria-label={props.label}>
        <For each={props.options}>
          {(option) => (
            <button
              type="button"
              class="bt-settings-choice"
              aria-pressed={props.value === option}
              style={{ "font-family": props.fontOf?.(option) }}
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
