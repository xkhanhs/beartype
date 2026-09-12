import { JSXElement } from "solid-js";

import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { Icon } from "../../beartype/Icon";
import { SettingsPopover } from "../../beartype/SettingsPopover";
import { ThemeMenu } from "../../beartype/ThemeMenu";

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
            two pills, and its balloon only names where it goes. */}
        <a
          class="bt-footer-pill bt-footer-icon"
          href="https://github.com/xkhanhs/beartype"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="mã nguồn"
          data-balloon-pos="up"
        >
          <Icon name="github" />
        </a>
      </div>
    </footer>
  );
}
