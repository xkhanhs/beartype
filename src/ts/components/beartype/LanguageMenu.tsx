import { JSXElement } from "solid-js";

import { t, uiLanguage } from "../../beartype/strings";
import { TYPING_LANGUAGE, type UiLanguage } from "../../beartype/ui-language";
import { setConfig } from "../../config/setters";
import { restartTestEvent } from "../../events/test";
import { getFocus } from "../../states/test";
import { cn } from "../../utils/cn";
import { buildBalloonHtmlProperties } from "../common/Balloon";
import { Icon } from "./Icon";

/**
 * Which language the page speaks, at the foot of it before the link to the
 * source. With two languages there is nothing to open: the pill is the
 * switch, and it says which language it is in rather than which one it would
 * turn into -- the same way the colour pill shows the palette in use. The
 * balloon names the other one, so the switch is not a guess.
 *
 * Picking a language also picks the word list to match and starts a new test
 * on it: whoever puts the page into English came to type English words. The
 * options bar above still holds both, so reading the page in one language and
 * typing the other stays one click away.
 */

/** The other language, of the two. */
function other(language: UiLanguage): UiLanguage {
  return language === "vi" ? "en" : "vi";
}

export function LanguageMenu(): JSXElement {
  const pick = (): void => {
    const next = other(uiLanguage());
    setConfig("uiLanguage", next);
    setConfig("language", TYPING_LANGUAGE[next]);
    restartTestEvent.dispatch();
  };

  return (
    <button
      type="button"
      data-ui-element="languageMenu"
      class={cn("bt-footer-pill transition-opacity", {
        "pointer-events-none opacity-0": getFocus(),
      })}
      {...buildBalloonHtmlProperties({
        text: t("switchLanguage"),
        position: "up",
      })}
      onClick={() => pick()}
    >
      <Icon name="languages" />
      <span class="bt-language-pill-name">{uiLanguage()}</span>
    </button>
  );
}
