import { For, JSXElement } from "solid-js";

import { Button } from "../common/Button";

export function SettingsRow<T extends string>(props: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  /** The current setting, which may hold values this row does not offer. */
  value: string;
  onPick: (value: T) => void;
}): JSXElement {
  return (
    <div class="grid gap-1">
      <div class="text-sub">{props.label}</div>
      <div class="flex flex-wrap gap-1">
        <For each={props.options}>
          {(option) => (
            <Button
              class="px-3 py-1"
              text={props.labels[option]}
              active={props.value === option}
              onClick={() => props.onPick(option)}
            />
          )}
        </For>
      </div>
    </div>
  );
}
