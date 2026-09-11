import { JSXElement } from "solid-js";

import { getIsScreenshotting } from "../../../states/core";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { SettingsPopover } from "../../beartype/SettingsPopover";
import { Keytips } from "./Keytips";

export function Footer(): JSXElement {
  return (
    <footer
      class={cn("relative text-xs text-sub", {
        "opacity-0": getIsScreenshotting(),
      })}
    >
      <Keytips />
      <div
        class={cn(
          "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 transition-opacity",
          { "opacity-0": getFocus() },
        )}
      >
        <SettingsPopover />
        {/* GPL-3.0: the source travels with every copy of this page */}
        <a
          class="text-sub hover:text-text hover:underline"
          href="https://github.com/xkhanhs/beartype"
          target="_blank"
          rel="noopener noreferrer"
        >
          mã nguồn · fork của monkeytype · GPL-3.0
        </a>
      </div>
    </footer>
  );
}
