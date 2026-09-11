import { JSXElement } from "solid-js";

import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { SettingsPopover } from "../../beartype/SettingsPopover";
import { ThemeMenu } from "../../beartype/ThemeMenu";
import { Fa } from "../../common/Fa";

export function Footer(): JSXElement {
  return (
    <footer class="relative text-sm text-sub">
      <div
        class={cn(
          "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 transition-opacity",
          { "opacity-0": getFocus() },
        )}
      >
        <ThemeMenu />
        <SettingsPopover />
        {/* GPL-3.0: the source travels with every copy of this page. The
            repository says the rest -- a fork of monkeytype, its licence --
            so the footer keeps only a way there, as a round icon beside the
            two pills. */}
        <a
          class="bt-footer-pill bt-footer-icon"
          href="https://github.com/xkhanhs/beartype"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="mã nguồn · fork của monkeytype · GPL-3.0"
          data-balloon-pos="up"
        >
          <Fa icon="fa-github" variant="brand" />
        </a>
      </div>
    </footer>
  );
}
