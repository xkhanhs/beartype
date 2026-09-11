import type { EventLog } from "../test/events/types";

/**
 * Pauses that keep a test out of the record and out of the miss book.
 *
 * Upstream only drops a test whose last five seconds had no key: walk away
 * and let the clock run out. A test with a long stop in the middle, or a
 * words test hung on one word, was kept and dragged the figures down, though
 * it says nothing about how fast these hands type.
 */

/** A single stop this long, anywhere in the test. */
const MAX_PAUSE_MS = 5000;

/** Or seconds without a key adding up to more than this share of the test. */
const MAX_IDLE_SHARE = 0.2;

/**
 * The longest stretch between two keys, or between the last key and the end
 * of the test. It starts at the first key, since that is what starts the test.
 */
export function longestPauseMs(eventLog: EventLog): number {
  let last: number | undefined;
  let longest = 0;
  for (const event of eventLog.events) {
    const isKey = event.type === "keydown" || event.type === "input";
    const isEnd = event.type === "timer" && event.data.event === "end";
    if (!isKey && !isEnd) continue;
    if (last !== undefined) longest = Math.max(longest, event.testMs - last);
    if (isEnd) break;
    last = event.testMs;
  }
  return longest;
}

/**
 * Why a test sat idle too long to be kept, in the words the result screen
 * shows, or `null` when it did not. `afkSeconds` counts the seconds of the
 * test without a key, as upstream's `afkDuration` does.
 */
export function idleReason(
  eventLog: EventLog,
  afkSeconds: number,
  testSeconds: number,
): string | null {
  const pause = longestPauseMs(eventLog);
  if (pause >= MAX_PAUSE_MS) {
    return `có lúc ngừng gõ liền ${Math.floor(pause / 1000)} giây`;
  }
  if (testSeconds > 0 && afkSeconds / testSeconds > MAX_IDLE_SHARE) {
    return `ngừng gõ ${Math.round((100 * afkSeconds) / testSeconds)}% thời gian bài`;
  }
  return null;
}
