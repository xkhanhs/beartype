import { JSXElement } from "solid-js";

import { SettingsRowText as RowText } from "./SettingsRowText";

/** A row whose setting is a share from 0 to 1, picked on a slider. */
export function SettingsSliderRow(props: {
  label: string;
  hint: string;
  value: number;
  /** While the slider moves. */
  onInput: (value: number) => void;
  /** Once it is let go. */
  onChange?: (value: number) => void;
}): JSXElement {
  return (
    <div class="bt-settings-row">
      <RowText label={props.label} hint={props.hint} />
      <div class="bt-settings-slider">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          aria-label={props.label}
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.valueAsNumber)}
          onChange={(e) => props.onChange?.(e.currentTarget.valueAsNumber)}
        />
        <span>{Math.round(props.value * 100)}%</span>
      </div>
    </div>
  );
}
