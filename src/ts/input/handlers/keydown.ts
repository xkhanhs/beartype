import { emulateInsertText } from "./insert-text";
import { wordsHaveTab } from "../../states/test";

import { logTestEvent } from "../../test/events/data";
import { getTestEventCode } from "../../test/events/helpers";

async function handleTab(e: KeyboardEvent, now: number): Promise<void> {
  if (wordsHaveTab() && !e.shiftKey) {
    await emulateInsertText({ data: "\t", now });
    e.preventDefault();
    return;
  }
}

export async function onKeydown(event: KeyboardEvent): Promise<void> {
  if (event.repeat) {
    // just ignore all repeats
    return;
  }

  const now = performance.now();

  logTestEvent("keydown", now, {
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

  if (event.key === "Tab") {
    await handleTab(event, now);
  }
}
