import { logTestEvent } from "../../test/events/data";
import { getTestEventCode } from "../../test/events/helpers";

export async function onKeyup(event: KeyboardEvent): Promise<void> {
  const now = performance.now();
  logTestEvent("keyup", now, {
    code: getTestEventCode(event),
    ctrl: event.ctrlKey ? true : undefined,
    shift: event.shiftKey ? true : undefined,
    alt: event.altKey ? true : undefined,
    meta: event.metaKey ? true : undefined,
  });

  if (
    event.key === "Home" ||
    event.key === "End" ||
    event.key === "PageUp" ||
    event.key === "PageDown" ||
    event.key.startsWith("Arrow")
  ) {
    event.preventDefault();
    return;
  }
}
