import { createEvent } from "../hooks/createEvent";

export const restartTestEvent = createEvent<
  // beartype: practiseMissed lets the miss-book button start a drill, and
  // leaveDrill lets it turn one off; every other restart keeps a drill on
  { practiseMissed?: boolean; leaveDrill?: boolean } | undefined
>();
