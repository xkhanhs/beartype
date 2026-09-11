import { createEvent } from "../hooks/createEvent";

export const restartTestEvent = createEvent<
  // beartype: practiseMissed lets the miss-book button start a drill
  { isQuickRestart?: boolean; practiseMissed?: boolean } | undefined
>();
