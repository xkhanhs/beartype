import { JSXElement } from "solid-js";

/** The name and hint on the left of a settings row. */
export function SettingsRowText(props: {
  label: string;
  hint: string;
}): JSXElement {
  return (
    <div class="bt-settings-row-text">
      <div class="bt-settings-row-name">{props.label}</div>
      <div class="bt-settings-row-hint">{props.hint}</div>
    </div>
  );
}
