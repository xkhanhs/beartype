import { JSXElement } from "solid-js";

import { getIsScreenshotting } from "../../../states/core";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { Logo } from "./Logo";

export function Header(): JSXElement {
  return (
    <header
      class={cn("flex place-items-center justify-center gap-2", {
        "opacity-0": getIsScreenshotting(),
      })}
      data-ui-element="header"
      data-focused={getFocus() ? "" : undefined}
    >
      <Logo />
    </header>
  );
}
