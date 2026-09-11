import { createEvent } from "../hooks/createEvent";

export type KeymapEventData = {
  key: string;
  correct?: boolean;
};

/** A character went into the test, and whether it was right. */
export const keymapEvent = createEvent<KeymapEventData>();

export function flash(key: string, correct?: boolean): void {
  keymapEvent.dispatch({ key, correct });
}
