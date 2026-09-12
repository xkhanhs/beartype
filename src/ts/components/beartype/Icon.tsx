import { JSXElement } from "solid-js";

import { cn } from "../../utils/cn";

/** The icons in src/html/icons.html, by their id without the `i-`. */
export type IconName =
  | "arrow-right"
  | "check"
  | "chevron-down"
  | "corner-down-left"
  | "crown"
  | "github"
  | "info"
  | "loader-circle"
  | "lock"
  | "pause"
  | "rotate-cw"
  | "settings"
  | "x";

/** One of the page's icons, as tall as the text around it. */
export function Icon(props: { name: IconName; class?: string }): JSXElement {
  return (
    <svg class={cn("bt-icon", props.class)} aria-hidden="true">
      <use href={`#i-${props.name}`}></use>
    </svg>
  );
}
