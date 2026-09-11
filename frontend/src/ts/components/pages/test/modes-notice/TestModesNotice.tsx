import { getFocus, isRepeated } from "../../../../states/test";
import { cn } from "../../../../utils/cn";
import { Notice } from "./Notice";

// beartype keeps only the notice that can still be true: every other one
// describes a setting or an account this app no longer has, and the
// language already shows in the options bar, as in keybear. The pace caret
// is gone.
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
    </div>
  );
}

function Repeated() {
  return (
    <Notice
      when={isRepeated()}
      class="text-error"
      icon="fa-sync-alt"
      text="bài gõ lại"
    />
  );
}
