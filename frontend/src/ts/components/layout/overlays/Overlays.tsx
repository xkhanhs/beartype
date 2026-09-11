import { JSXElement } from "solid-js";

import { LoaderBar } from "./LoaderBar";

// beartype: no pop-up notices. The result screen already says in words why a
// test was not kept, and the rest of upstream's notices belong to features
// that are gone, so the list of them is not drawn at all. Code still calls
// `showNoticeNotification` and friends; the calls go into the store and stop
// there.
export function Overlays(): JSXElement {
  return <LoaderBar />;
}
