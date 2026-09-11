import { JSXElement } from "solid-js";

import { restartTestEvent } from "../../../events/test";
import { getActivePage } from "../../../states/core";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { isDevEnvironment } from "../../../utils/env";

// beartype: keybear's bear-and-keyboard mark and the app's own name, in
// place of upstream's keyboard logo and wordmark.
export function Logo(): JSXElement {
  return (
    <a
      href={`${location.origin}/`}
      class="-m-2 flex h-8 w-max items-center gap-2 rounded-[0.8rem] p-2 focus-visible:**:data-[ui-element='logoSubtext']:text-transparent"
      aria-label="beartype"
      router-link
      style={{ "box-sizing": "content-box" }}
      data-ui-element="logo"
      onClick={() => {
        if (getActivePage() === "test") restartTestEvent.dispatch();
      }}
    >
      <img
        src="/images/beartype.svg"
        alt=""
        class={cn("h-full transition-opacity", { "opacity-50": getFocus() })}
      />
      <div class="grid leading-none">
        <div
          class={cn("text-[0.7rem] text-sub transition-colors duration-125", {
            "text-transparent": getFocus(),
          })}
          data-ui-element="logoSubtext"
        >
          {isDevEnvironment() ? "localhost" : "đo tốc độ gõ"}
        </div>
        <h1
          class={cn(
            "m-0 text-[1.75rem] font-bold text-text transition-colors duration-250",
            { "text-sub": getFocus() },
          )}
          data-ui-element="logoText"
        >
          beartype
        </h1>
      </div>
    </a>
  );
}
