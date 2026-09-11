import { JSXElement } from "solid-js";

import { LoaderBar } from "./LoaderBar";
import { Notifications } from "./Notifications";

export function Overlays(): JSXElement {
  return (
    <>
      <Notifications />
      <LoaderBar />
    </>
  );
}
