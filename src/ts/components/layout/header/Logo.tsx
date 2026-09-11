import { JSXElement } from "solid-js";

import { restartTestEvent } from "../../../events/test";
import { getActivePage } from "../../../states/core";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";

// beartype: upstream's keycap mark, with the keys inside spelling "bt" instead
// of "mt" -- the tall stem of the b rises over the t the way an ascender
// does. It is drawn in the theme's accent, not in colours of its own, so it
// sits as quietly on every palette as the rest of the page, and fades to the
// sub colour while typing, as upstream's does. No tagline under the name.
export function Logo(): JSXElement {
  return (
    <a
      href={`${location.origin}/`}
      class="-m-2 flex h-7 w-max items-center gap-2 rounded-[0.8rem] p-2"
      aria-label="beartype"
      router-link
      style={{ "box-sizing": "content-box" }}
      data-ui-element="logo"
      onClick={() => {
        if (getActivePage() === "test") restartTestEvent.dispatch();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-680 -1030 300 180"
        class={cn("h-full fill-[currentColor] text-main transition-colors", {
          "text-sub": getFocus(),
        })}
        aria-hidden="true"
      >
        {/* the keycap */}
        <path d="M -660 -910 L -680 -910 L -680 -980 C -680 -1007.596 -657.596 -1030 -630 -1030 L -430 -1030 C -402.404 -1030 -380 -1007.596 -380 -980 L -380 -900 C -380 -872.404 -402.404 -850 -430 -850 L -630 -850 C -657.596 -850 -680 -872.404 -680 -900 L -680 -920 L -660 -920 L -660 -900 C -660 -883.443 -646.557 -870 -630 -870 L -430 -870 C -413.443 -870 -400 -883.443 -400 -900 L -400 -980 C -400 -996.557 -413.443 -1010 -430 -1010 L -630 -1010 C -646.557 -1010 -660 -996.557 -660 -980 L -660 -910 Z"></path>
        {/* b: a stem the full height of the keys, and a round bowl; the counter
            runs the other way round, which is what cuts it out */}
        <path d="M -640 -980 A 10 10 0 0 1 -620 -980 V -950 H -590 A 30 30 0 0 1 -590 -890 H -630 A 10 10 0 0 1 -640 -900 Z M -620 -930 V -910 H -590 A 10 10 0 0 0 -590 -930 Z"></path>
        {/* t */}
        <path d="M -460 -930 L -460 -900 C -460 -894.481 -464.481 -890 -470 -890 L -470 -890 C -475.519 -890 -480 -894.481 -480 -900 L -480 -930 L -508.82 -930 C -514.99 -930 -520 -934.481 -520 -940 L -520 -940 C -520 -945.519 -514.99 -950 -508.82 -950 L -431.18 -950 C -425.01 -950 -420 -945.519 -420 -940 L -420 -940 C -420 -934.481 -425.01 -930 -431.18 -930 L -460 -930 Z"></path>
        {/* the loose keys around them */}
        <path d="M -590 -990 H -555 A 10 10 0 0 1 -555 -970 H -590 A 10 10 0 0 1 -590 -990 Z"></path>
        <path d="M -515 -990 H -510 A 10 10 0 0 1 -510 -970 H -515 A 10 10 0 0 1 -515 -990 Z"></path>
        <path d="M -470 -990 H -430 A 10 10 0 0 1 -430 -970 H -470 A 10 10 0 0 1 -470 -990 Z"></path>
        <path d="M -530 -910 H -510 A 10 10 0 0 1 -510 -890 H -530 A 10 10 0 0 1 -530 -910 Z"></path>
        <path d="M -430 -910 A 10 10 0 0 1 -430 -890 A 10 10 0 0 1 -430 -910 Z"></path>
      </svg>
      <h1
        class={cn(
          "m-0 text-[1.9rem] leading-none font-bold text-text transition-colors duration-250",
          { "text-sub": getFocus() },
        )}
        data-ui-element="logoText"
      >
        beartype
      </h1>
    </a>
  );
}
