import {
  animate as animejsAnimate,
  AnimationParams,
  JSAnimation,
} from "animejs";

/**
 * list of deferred callbacks to be executed once we reached ready state
 */
let readyList: (() => void)[] | undefined;
let isReady = false;

/**
 * Execute a callback function when the DOM is fully loaded.
 * Tries to mimic the ready function of jQuery https://github.com/jquery/jquery/blob/main/src/core/ready.js
 * If the document is already loaded, the callback is executed in the next event loop
 */
export function onDOMReady(callback: () => void): void {
  bindReady();
  if (isReady) {
    setTimeout(callback);
  } else {
    readyList?.push(callback);
  }
}

/**
 * initialize the readyList and bind the necessary events
 */
function bindReady(): void {
  // do nothing if we are bound already
  if (readyList !== undefined) return;

  readyList = [];

  if (document.readyState !== "loading") {
    // DOM is already loaded handle ready in the next event loop
    // Handle it asynchronously to allow scripts the opportunity to delay ready
    setTimeout(handleReady);
  } else {
    // register a single event listener for both events.
    document.addEventListener("DOMContentLoaded", handleReady);
    //load  event is used as a fallback "that will always work" according to jQuery source code
    window.addEventListener("load", handleReady);
  }
}

/**
 * call all deferred ready callbacks and cleanup the event listener
 */
function handleReady(): void {
  //make sure we only run once
  if (isReady) return;

  isReady = true;

  //cleanup event listeners that are no longer needed
  document.removeEventListener("DOMContentLoaded", handleReady);
  window.removeEventListener("load", handleReady);

  //call deferred callbacks and empty the list
  //flush the list in a loop in case callbacks were added during the execution
  while (readyList !== undefined && readyList.length > 0) {
    const callbacks = readyList;
    readyList = [];
    callbacks.forEach((it) => {
      //jQuery lets the callbacks fail independently
      try {
        it();
      } catch (e) {
        setTimeout(() => {
          throw e;
        });
      }
    });
  }
  readyList = undefined;
}

/**
 * Query Selector
 *
 * Query the document for a single element matching the selector.
 * @returns An ElementWithUtils wrapping the found element, null if not found.
 */
export function qs<T extends HTMLElement = HTMLElement>(
  selector: string,
): ElementWithUtils<T> | null {
  checkUniqueSelector(selector);
  const el = document.querySelector<T>(selector);
  return el ? new ElementWithUtils(el) : null;
}

/**
 * Query Selector All
 *
 * Query the document for all elements matching the selector.
 * @returns An ArrayWithUtils containing ElementWithUtils wrapping each found element.
 */
export function qsa<T extends HTMLElement = HTMLElement>(
  selector: string,
): ElementsWithUtils<T> {
  const elements = Array.from(document.querySelectorAll<T>(selector))
    .filter((el) => el !== null)
    .map((el) => new ElementWithUtils(el));
  return new ElementsWithUtils<T>(...elements);
}

/**
 * Query Selector Required
 *
 * Query the document for a single element matching the selector.
 * Useful for elements that are guaranteed to exist,
 * as you don't need to handle the null case.
 * @returns An ElementWithUtils wrapping the found element.
 * @throws Error if the element is not found.
 */
export function qsr<T extends HTMLElement = HTMLElement>(
  selector: string,
): ElementWithUtils<T> {
  checkUniqueSelector(selector);
  const el = document.querySelector<T>(selector);
  if (el === null) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return new ElementWithUtils(el);
}

export type OnChildEvent<T extends Event = Event> = T & {
  /**
   * target element matching the selector.
   */
  childTarget: EventTarget | null;
};

type OnChildEventListenerOrEventListenerObject =
  | { (evt: OnChildEvent): void }
  | { handleEvent(object: OnChildEvent): void };

export class ElementWithUtils<T extends HTMLElement = HTMLElement> {
  /**
   * The native dom element
   */
  public native: T;

  constructor(native: T) {
    this.native = native;
  }

  /**
   * Set attribute value
   */
  setAttribute(qualifiedName: string, value: string): this {
    this.native.setAttribute(qualifiedName, value);
    return this;
  }

  /**
   * Add the "hidden" class to the element
   */
  hide(): this {
    this.addClass("hidden");
    return this;
  }

  /**
   * Remove the "hidden" class from the element
   */
  show(): this {
    this.removeClass("hidden");
    return this;
  }

  /**
   * Check if the element has the "hidden" class
   */
  isHidden(): boolean {
    return this.hasClass("hidden");
  }

  /**
   * Check if element is visible
   */
  isVisible(): boolean {
    return this.native.offsetWidth > 0 || this.native.offsetHeight > 0;
  }

  /**
   * Make element visible by scrolling the element's ancestor containers
   */
  scrollIntoView(options?: ScrollIntoViewOptions): this {
    this.native.scrollIntoView(options);
    return this;
  }

  /**
   * Add a class to the element
   */
  addClass(className: string | string[]): this {
    if (Array.isArray(className)) {
      this.native.classList.add(...className);
    } else {
      if (className.includes(" ")) {
        return this.addClass(
          className.split(" ").filter((cn) => cn.length > 0),
        );
      }
      this.native.classList.add(className);
    }
    return this;
  }

  /**
   * Remove a class from the element
   */
  removeClass(className: string | string[]): this {
    if (Array.isArray(className)) {
      this.native.classList.remove(...className);
    } else {
      if (className.includes(" ")) {
        return this.removeClass(
          className.split(" ").filter((cn) => cn.length > 0),
        );
      }
      this.native.classList.remove(className);
    }
    return this;
  }

  /**
   * Check if the element has a class
   */
  hasClass(className: string): boolean {
    if (className.includes(" ")) {
      return className
        .split(" ")
        .filter((cn) => cn.length > 0)
        .every((cn) => this.hasClass(cn));
    }
    return this.native.classList.contains(className);
  }

  /**
   * Attach an event listener to the element
   */
  on<K extends keyof HTMLElementEventMap>(
    event: K,
    handler: (this: T, ev: HTMLElementEventMap[K]) => void,
  ): this;
  on(event: string, handler: EventListenerOrEventListenerObject): this;
  on(
    event: keyof HTMLElementEventMap | string,
    handler:
      | EventListenerOrEventListenerObject
      | ((this: T, ev: Event) => void),
  ): this {
    // this type was some AI magic but if it works it works
    this.native.addEventListener(event, handler);
    return this;
  }

  /**
   * Attach an event listener to child elements matching the selector.
   * Useful for dynamically added elements.
   *
   * The handler is not called when the event occurs directly on the bound element, but only for descendants (inner elements)
   * that match the selector. Bubbles the event from the event target up to the element where the handler is attached
   * (i.e., innermost to outermost element) and runs the handler for any elements along that path matching the selector.
   */
  onChild<K extends keyof HTMLElementEventMap>(
    event: K,
    /**
     * A selector string to filter the descendants of the selected elements that will call the handler.
     */
    selector: string,
    handler: (
      this: HTMLElement,
      ev: OnChildEvent<HTMLElementEventMap[K]>,
    ) => void,
  ): this;
  onChild(
    event: string,
    /**
     * A selector string to filter the descendants of the selected elements that will call the handler.
     */
    selector: string,
    handler: OnChildEventListenerOrEventListenerObject,
  ): this;
  onChild(
    event: keyof HTMLElementEventMap | string,
    /**
     * A selector string to filter the descendants of the selected elements that will call the handler.
     */
    selector: string,
    handler:
      | OnChildEventListenerOrEventListenerObject
      | ((this: HTMLElement, ev: OnChildEvent) => void),
  ): this {
    this.native.addEventListener(event, (e) => {
      const target = e.target as HTMLElement;
      if (target === null) return; //ignore event

      let childTarget = target.closest(selector);
      //bubble up until no match found or the parent element is reached
      while (
        childTarget !== null &&
        childTarget !== this.native && //stop on parent
        this.native?.contains(childTarget) //stop above parent
      ) {
        if (typeof handler === "function") {
          handler.call(
            childTarget as HTMLElement,
            Object.assign(e, { childTarget }),
          );
        } else {
          handler.handleEvent(Object.assign(e, { childTarget }));
        }

        childTarget =
          childTarget.parentElement !== null
            ? childTarget.parentElement.closest(selector)
            : null;
      }
    });
    return this;
  }

  /**
   * Set innerHTML of the element
   */
  setHtml(content: string): this {
    this.native.innerHTML = content;
    return this;
  }

  /**
   * Set textContent of the element
   */
  setText(content: string): this {
    this.native.textContent = content;
    return this;
  }

  /**
   * Remove the element from the DOM
   */
  remove(): void {
    if (this.native.parentNode) {
      this.native.parentNode.removeChild(this.native);
    }
  }

  /**
   * Set multiple style properties on the element.
   * Empty object clears all styles.
   */
  setStyle(object: Partial<CSSStyleDeclaration>): this {
    const entries = Object.entries(object);
    if (entries.length === 0) {
      this.native.style.cssText = "";
      return this;
    }
    for (const [key, value] of entries) {
      if (value !== undefined) {
        //@ts-expect-error -- Index signature issue
        this.native.style[key] = value;
      }
    }
    return this;
  }

  /**
   * Get the element's style object
   */
  getStyle(): CSSStyleDeclaration {
    return this.native.style;
  }

  /**
   * Query the element for a child element matching the selector
   */
  qs<U extends HTMLElement>(selector: string): ElementWithUtils<U> | null {
    checkUniqueSelector(selector, this);
    const found = this.native.querySelector<U>(selector);
    return found ? new ElementWithUtils(found) : null;
  }

  /**
   * Query the element for all child elements matching the selector
   */
  qsa<U extends HTMLElement = HTMLElement>(
    selector: string,
  ): ElementsWithUtils<U> {
    const elements = Array.from(this.native.querySelectorAll<U>(selector))
      .filter((el) => el !== null)
      .map((el) => new ElementWithUtils(el));

    return new ElementsWithUtils<U>(...elements);
  }

  /**
   * Empty the element's innerHTML
   */
  empty(): this {
    this.native.innerHTML = "";
    return this;
  }

  /**
   * Append HTML string to the element's innerHTML
   */
  appendHtml(htmlString: string): this {
    this.native.insertAdjacentHTML("beforeend", htmlString);
    return this;
  }

  /**
   * Dispatch an event on the element
   */
  dispatch(event: keyof HTMLElementEventMap, eventInitDict?: EventInit): this {
    this.native.dispatchEvent(new Event(event, eventInitDict));
    return this;
  }

  /**
   * Get the element's height + margin
   */
  getOuterHeight(): number {
    const style = getComputedStyle(this.native);

    return (
      this.native.getBoundingClientRect().height +
      parseFloat(style.marginTop) +
      parseFloat(style.marginBottom)
    );
  }

  /**
   * Get the element's width
   */
  getOffsetWidth(): number {
    return this.native.offsetWidth;
  }

  /**
   * Get the element's height
   */
  getOffsetHeight(): number {
    return this.native.offsetHeight;
  }

  /**
   * Get the element's top offset relative to its offsetParent
   */
  getOffsetTop(): number {
    return this.native.offsetTop;
  }

  /**
   * Get the element's left offset relative to its offsetParent
   */
  getOffsetLeft(): number {
    return this.native.offsetLeft;
  }

  /**
   * Get the element's children wrapped in ElementWithUtils instances.
   *
   * Note: This method returns a new array of wrappers, but each wrapper maintains
   * a reference to the actual DOM element. Any operations performed on the returned
   * children (e.g., addClass, remove, setHtml) will modify the actual DOM elements
   * and reflect their live DOM state.
   *
   * @returns An ElementsWithUtils array containing wrapped child elements
   */
  getChildren(): ElementsWithUtils {
    const children = Array.from(this.native.children);
    const convertedChildren = new ElementsWithUtils(
      ...children.map((child) => new ElementWithUtils(child as HTMLElement)),
    );
    return convertedChildren;
  }

  /**
   * Animate the element using Anime.js
   * @param animationParams The Anime.js animation parameters
   * @returns The JSAnimation instance created by Anime.js
   */
  animate(animationParams: AnimationParams): JSAnimation {
    return animejsAnimate(this.native, animationParams);
  }

  /**
   * Animate the element using Anime.js
   * @param animationParams The Anime.js animation parameters
   */
  async promiseAnimate(animationParams: AnimationParams): Promise<void> {
    return new Promise((resolve) => {
      animejsAnimate(this.native, {
        ...animationParams,
        onComplete: (self, e) => {
          animationParams.onComplete?.(self, e);
          resolve();
        },
      });
    });
  }

  /**
   * Focus the element
   */
  focus(options?: FocusOptions): this {
    this.native.focus(options);
    return this;
  }
}

/**
 * An array of ElementWithUtils with utility methods that operate on all elements in the array.
 */
export class ElementsWithUtils<
  T extends HTMLElement = HTMLElement,
> extends Array<ElementWithUtils<T>> {
  /**
   * Array of native DOM elements
   */
  public native: T[];

  constructor(...items: ElementWithUtils<T>[]) {
    super(...items);
    this.native = items.map((item) => item.native);
  }

  /**
   * Remove all elements in the array from the DOM
   */
  remove(): void {
    for (const item of this) {
      item.remove();
    }
  }

  /**
   * Remove a class from all elements in the array
   */
  removeClass(className: string | string[]): this {
    for (const item of this) {
      item.removeClass(className);
    }
    return this;
  }

  /**
   * Add a class to all elements in the array
   */
  addClass(className: string | string[]): this {
    for (const item of this) {
      item.addClass(className);
    }
    return this;
  }

  /**
   * Set innerHTML of all elements in the array
   */
  setHtml(htmlString: string): this {
    for (const item of this) {
      item.setHtml(htmlString);
    }
    return this;
  }

  /**
   * Add the "hidden" class to all elements in the array
   */
  hide(): this {
    for (const item of this) {
      item.hide();
    }
    return this;
  }

  /**
   * Remove the "hidden" class from all elements in the array
   */
  show(): this {
    for (const item of this) {
      item.show();
    }
    return this;
  }

  /**
   * Set multiple style properties on all elements in the array.
   * An empty object clears all styles.
   */
  setStyle(object: Partial<CSSStyleDeclaration>): this {
    for (const item of this) {
      item.setStyle(object);
    }
    return this;
  }

  /**
   * Attach an event listener to all elements in the array
   */
  on<K extends keyof HTMLElementEventMap>(
    event: K,
    handler: (this: T, ev: HTMLElementEventMap[K]) => void,
  ): this;
  on(event: string, handler: EventListenerOrEventListenerObject): this;
  on(
    event: keyof HTMLElementEventMap | string,
    handler:
      | EventListenerOrEventListenerObject
      | ((this: T, ev: Event) => void),
  ): this {
    for (const item of this) {
      item.on(event, handler);
    }
    return this;
  }

  /**
   * Set attribute value on all elements in the array
   */
  setAttribute(key: string, value: string): this {
    for (const item of this) {
      item.setAttribute(key, value);
    }
    return this;
  }

  /**
   * Append HTML string to all elements in the array
   */
  appendHtml(htmlString: string): this {
    for (const item of this) {
      item.appendHtml(htmlString);
    }
    return this;
  }

  override indexOf(element: ElementWithUtils<T>): number {
    return this.native.indexOf(element.native);
  }
}

function checkUniqueSelector(
  selector: string,
  parent?: ElementWithUtils,
): void {
  if (!import.meta.env.DEV) return;
  const elements = parent ? parent.qsa(selector) : qsa(selector);
  if (elements.length > 1) {
    console.warn(
      `Multiple elements found for selector "${selector}". Did you mean to use QSA? If not, try making the query more specific.`,
      elements.native,
    );
    console.trace("Stack trace for qs/qsr call:");
  }
}

export const __testing = {
  resetReady: () => {
    isReady = false;
    readyList = undefined;
  },
};
