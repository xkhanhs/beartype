import { createEvent } from "../hooks/createEvent";

export const restartTestEvent = createEvent<
  // beartype: practise lets a drill button start a drill, and leaveDrill
  // lets it turn one off; every other restart keeps a drill on
  { practise?: boolean; leaveDrill?: boolean } | undefined
>();
