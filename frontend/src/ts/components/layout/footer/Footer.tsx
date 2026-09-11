import { JSXElement } from "solid-js";

import { getIsScreenshotting } from "../../../states/core";
import { cn } from "../../../utils/cn";
import { Keytips } from "./Keytips";

export function Footer(): JSXElement {
  return (
    <footer
      class={cn("relative text-xs text-sub", {
        "opacity-0": getIsScreenshotting(),
      })}
    >
      <Keytips />
    </footer>
  );
}
