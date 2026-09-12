import { JSXElement } from "solid-js";

import { LoaderBar } from "./LoaderBar";

// beartype has no pop-up notices: what the typist needs to know is written on
// the page itself, like the reason a result was not kept.
export function Overlays(): JSXElement {
  return <LoaderBar />;
}
