import { Config } from "../schemas/configs";
import { Mode, Mode2 } from "../schemas/shared";
import { animate, AnimationParams } from "animejs";
import { isDevEnvironment } from "./env";

export function escapeHTML<T extends string | null | undefined>(str: T): T {
  if (str === null || str === undefined) {
    return str;
  }

  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
  };

  return str.replace(/[&<>"'/`]/g, (char) => escapeMap[char] as string) as T;
}

export function clearTimeouts(timeouts: (number | NodeJS.Timeout)[]): void {
  timeouts.forEach((to) => {
    if (typeof to === "number") clearTimeout(to);
    else clearTimeout(to);
  });
}

export function getMode2<M extends Mode>(config: Config): Mode2<M> {
  const mode = config.mode;
  let retVal: string;

  if (mode === "time") {
    retVal = config.time.toString();
  } else if (mode === "words") {
    retVal = config.words.toString();
  } else if (mode === "custom") {
    retVal = "custom";
  } else {
    throw new Error("Invalid mode");
  }

  return retVal as Mode2<M>;
}

function isElementVisible(query: string): boolean {
  const el = document.querySelector(query);
  if (!el) {
    return false;
  }
  // const style = window.getComputedStyle(el);
  return !!el.getClientRects().length;
}

function isPopupVisible(popupId: string): boolean {
  return (
    isElementVisible(`#popups #${popupId}`) ||
    isElementVisible(`#solidmodals #${popupId}`)
  );
}

export function isAnyPopupVisible(): boolean {
  const popups = document.querySelectorAll(
    "#popups .popupWrapper, #popups .backdrop, #popups .modalWrapper, #solidmodals dialog",
  );
  let popupVisible = false;
  for (const popup of popups) {
    if (isPopupVisible(popup.id)) {
      popupVisible = true;
      break;
    }
  }
  return popupVisible;
}

export async function promiseAnimate(
  el: HTMLElement | string,
  options: AnimationParams,
): Promise<void> {
  return new Promise((resolve) => {
    animate(el, {
      ...options,
      onComplete: (self, e) => {
        options.onComplete?.(self, e);
        resolve();
      },
    });
  });
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function updateTitle(title?: string): void {
  const local = isDevEnvironment() ? "localhost - " : "";

  if (title === undefined || title === "") {
    document.title = `${local}beartype · đo tốc độ gõ tiếng Việt`;
  } else {
    document.title = local + title;
  }
}

export function isObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
}

function prefersReducedMotion(): boolean {
  return matchMedia?.("(prefers-reduced-motion)")?.matches;
}

/**
 * Reduce the animation time based on the browser preference `prefers-reduced-motion`.
 * @param animationTime
 * @returns `0` if user prefers reduced-motion, else the given animationTime
 */
export function applyReducedMotion(animationTime: number): number {
  return prefersReducedMotion() ? 0 : animationTime;
}

/**
 * Creates a promise with resolvers.
 * This is useful for creating a promise that can be resolved or rejected from outside the promise itself.
 * The returned promise reference stays constant even after reset() - it will always await the current internal promise.
 * Note: Promise chains created via .then()/.catch()/.finally() will always follow the current internal promise state, even if created before reset().
 */
export function promiseWithResolvers<T = void>(): {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  promise: Promise<T>;
  reset: () => void;
} {
  let innerResolve!: (value: T) => void;
  let innerReject!: (reason?: unknown) => void;
  let currentPromise = new Promise<T>((res, rej) => {
    innerResolve = res;
    innerReject = rej;
  });

  /**
   * This was fully AI generated to make the reset function work. Black magic, but its unit-tested and works.
   */

  const promiseLike = {
    // oxlint-disable-next-line no-thenable promise-function-async require-await
    async then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?:
        | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
        | null,
    ): Promise<TResult1 | TResult2> {
      return currentPromise.then(onfulfilled, onrejected);
    },
    async catch<TResult = never>(
      onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
    ): Promise<T | TResult> {
      return currentPromise.catch(onrejected);
    },
    async finally(onfinally?: (() => void) | null): Promise<T> {
      return currentPromise.finally(onfinally);
    },
    [Symbol.toStringTag]: "Promise" as const,
  };

  const reset = (): void => {
    currentPromise = new Promise<T>((res, rej) => {
      innerResolve = res;
      innerReject = rej;
    });
  };

  // Wrapper functions that always call the current resolver/rejecter
  const resolve = (value: T): void => {
    innerResolve(value);
  };

  const reject = (reason?: unknown): void => {
    innerReject(reason);
  };

  return {
    resolve,
    reject,
    promise: promiseLike,
    reset,
  };
}

/**
 * Wrap a function so only one call runs at a time. While a call is running, new
 * calls will not run and only the latest one will be queued, any prior queued
 * calls are skipped. Once the running call finishes, the queued call runs.
 * @param fn the function to debounce
 * @param options - `rejectSkippedCalls`: if false, promises returned by skipped
 * calls will be resolved to null, otherwise will be rejected (defaults to true).
 * @returns debounced version of the original function. This debounced function
 * returns a promise that resolves to the original return value. Promises of skipped
 * calls will be rejected, (or resolved to null if `options.rejectSkippedCalls` was false).
 */
export function debounceUntilResolved<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  options?: { rejectSkippedCalls?: true },
): (...args: TArgs) => Promise<TResult>;
export function debounceUntilResolved<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  options: { rejectSkippedCalls: false },
): (...args: TArgs) => Promise<TResult | null>;
export function debounceUntilResolved<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  { rejectSkippedCalls = true }: { rejectSkippedCalls?: boolean } = {},
): (...args: TArgs) => Promise<TResult | null> {
  let isLocked = false;
  let next: {
    args: TArgs;
    resolve: (value: TResult | null) => void;
    reject: (reason?: unknown) => void;
  } | null = null;

  async function run(...args: TArgs): Promise<TResult> {
    isLocked = true;
    try {
      return await Promise.resolve(fn(...args));
    } finally {
      isLocked = false;

      const queued = next;
      next = null;
      if (queued) run(...queued.args).then(queued.resolve, queued.reject);
    }
  }

  return async function debounced(...args: TArgs): Promise<TResult | null> {
    if (isLocked) {
      // drop previously queued call
      if (next) {
        if (rejectSkippedCalls) {
          next.reject(
            new Error("skipped call: call was superseded by a more recent one"),
          );
        } else {
          next.resolve(null);
        }
      }

      // queue the new call
      return new Promise<TResult | null>((resolve, reject) => {
        next = { args, resolve, reject };
      });
    }
    // no running instances, run immediately
    return run(...args);
  };
}

export function triggerResize(): void {
  window.dispatchEvent(new Event("resize"));
}

export function scrollToCenterOrTop(el: HTMLElement | null): void {
  if (!el) return;

  const elementHeight = el.offsetHeight;
  const windowHeight = window.innerHeight;

  el.scrollIntoView({
    block: elementHeight < windowHeight ? "center" : "start",
  });
}
export function addToGlobal(items: Record<string, unknown>): void {
  for (const [name, item] of Object.entries(items)) {
    //@ts-expect-error dev
    window[name] = item;
  }
}

export function getTotalInlineMargin(element: HTMLElement): number {
  const computedStyle = window.getComputedStyle(element);
  return (
    parseInt(computedStyle.marginRight) + parseInt(computedStyle.marginLeft)
  );
}

// DO NOT ALTER GLOBAL OBJECTSONSTRUCTOR, IT WILL BREAK RESULT HASHES
