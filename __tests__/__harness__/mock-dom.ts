import { vi } from "vitest";
import { ElementsWithUtils, ElementWithUtils } from "../../src/ts/utils/dom";

// Mock dom-utils to always return a mock element
vi.mock("../../src/ts/utils/dom", async (importOriginal) => {
  const createMockElement = (): ElementWithUtils => {
    return {
      setAttribute: vi.fn().mockReturnThis(),
      hide: vi.fn().mockReturnThis(),
      show: vi.fn().mockReturnThis(),
      isHidden: vi.fn().mockReturnValue(false),
      isVisible: vi.fn().mockReturnValue(true),
      scrollIntoView: vi.fn().mockReturnThis(),
      focus: vi.fn().mockReturnThis(),
      addClass: vi.fn().mockReturnThis(),
      removeClass: vi.fn().mockReturnThis(),
      hasClass: vi.fn().mockReturnValue(false),
      on: vi.fn().mockReturnThis(),
      onChild: vi.fn().mockReturnThis(),
      setHtml: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      setStyle: vi.fn().mockReturnThis(),
      getStyle: vi.fn().mockReturnValue({}),
      qs: vi.fn().mockImplementation(() => createMockElement()),
      qsa: vi.fn().mockImplementation(() => new ElementsWithUtils()),
      empty: vi.fn().mockReturnThis(),
      appendHtml: vi.fn().mockReturnThis(),
      dispatch: vi.fn().mockReturnThis(),
      getOuterHeight: vi.fn().mockReturnValue(0),
      getChildren: vi.fn().mockImplementation(() => new ElementsWithUtils()),
      getOffsetWidth: vi.fn().mockReturnValue(0),
      getOffsetHeight: vi.fn().mockReturnValue(0),
      getOffsetTop: vi.fn().mockReturnValue(0),
      getOffsetLeft: vi.fn().mockReturnValue(0),
      animate: vi.fn().mockResolvedValue(null),
      promiseAnimate: vi.fn().mockResolvedValue(null),
      native: document.createElement("div"),
    };
  };

  const actual = (await importOriginal()) as any;

  // oxlint-disable-next-line typescript/no-unsafe-return
  return {
    ...actual,
    qsr: vi.fn().mockImplementation(() => createMockElement()),
    qs: vi.fn().mockImplementation(() => createMockElement()),
    qsa: vi.fn().mockImplementation(() => new ElementsWithUtils()),
  };
});

// Mock document.querySelector to return a div
// oxlint-disable-next-line typescript/no-deprecated
globalThis.document.querySelector = vi
  .fn()
  .mockReturnValue(document.createElement("div"));
