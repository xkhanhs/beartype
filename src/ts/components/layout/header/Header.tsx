import { JSXElement } from "solid-js";

import { getFocus } from "../../../states/test";
import { Logo } from "./Logo";

export function Header(): JSXElement {
  return (
    <header
      class="flex place-items-center justify-center gap-2"
      data-ui-element="header"
      data-focused={getFocus() ? "" : undefined}
    >
      <Logo />
    </header>
  );
}
