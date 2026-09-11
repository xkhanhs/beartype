import { createMemo } from "solid-js";

import { getConfig } from "../../../../config/store";
import { getFormatting } from "../../../../states/core";
import {
  getFocus,
  getPaceCaretWpm,
  isPaceRepeat,
  isRepeated,
} from "../../../../states/test";
import { cn } from "../../../../utils/cn";
import { getLanguageDisplayString } from "../../../../utils/strings";
import { Notice } from "./Notice";

// beartype keeps only the notices that can still be true: every other one
// describes a setting, a funbox or an account this app no longer has.
export function TestModesNotice() {
  return (
    <div
      class={cn(
        "flex flex-wrap justify-center gap-x-4 text-base text-sub transition-opacity duration-125 select-none",
        {
          "opacity-0": getFocus(),
        },
      )}
    >
      <Repeated />
      <Language />
      <PaceCaretNotice />
    </div>
  );
}

function Repeated() {
  return (
    <Notice
      when={isRepeated() && getConfig.mode !== "quote"}
      class="text-error"
      icon="fa-sync-alt"
      text="repeated"
    />
  );
}

function Language() {
  return (
    <Notice
      when={getConfig.mode !== "zen"}
      icon="fa-globe-americas"
      text={getLanguageDisplayString(
        getConfig.language,
        getConfig.mode === "quote",
      )}
    />
  );
}

function PaceCaretNotice() {
  const displaySpeed = createMemo(() => {
    let type: string = getConfig.paceCaret;
    if (type === "off") type = "custom";
    else if (type === "tagPb") type = "tag pb";

    const format = getFormatting();
    const speed = format.typingSpeed(getPaceCaretWpm() ?? 0, {
      showDecimalPlaces: false,
      suffix: ` ${getConfig.typingSpeedUnit}`,
    });

    return `${type} pace ${speed}`;
  });

  return (
    <Notice
      when={
        getConfig.paceCaret !== "off" ||
        (getConfig.repeatedPace && isPaceRepeat())
      }
      icon="fa-tachometer-alt"
      text={displaySpeed()}
    />
  );
}
