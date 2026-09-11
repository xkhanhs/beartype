import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, Show } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAnimate } = vi.hoisted(() => ({
  mockAnimate: vi.fn().mockReturnValue({
    pause: vi.fn(),
    then: vi.fn(async (_cb: unknown) => Promise.resolve()),
  }),
}));

vi.mock("animejs", () => ({
  animate: mockAnimate,
}));

// Mock applyReducedMotion
vi.mock("../../../../src/ts/utils/misc", () => ({
  applyReducedMotion: vi.fn((duration: number) => duration),
}));

import { Anime } from "../../../../src/ts/components/common/anime/Anime";
import { AnimePresence } from "../../../../src/ts/components/common/anime/AnimePresence";

describe("Anime", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders a div wrapper by default", () => {
    const { container } = render(() => (
      <Anime animation={{ opacity: 1 }}>
        <span>content</span>
      </Anime>
    ));
    expect(container.querySelector("div")).toBeTruthy();
    expect(container.querySelector("span")).toHaveTextContent("content");
  });

  it("renders with custom tag via `as` prop", () => {
    const { container } = render(() => (
      <Anime animation={{ opacity: 1 }} as="section">
        <span>hi</span>
      </Anime>
    ));
    expect(container.querySelector("section")).toBeTruthy();
    expect(container.querySelector("div")).toBeNull();
  });

  it("applies className and style props", () => {
    const { container } = render(() => (
      <Anime
        animation={{ opacity: 1 }}
        class="my-class"
        style={{ color: "red" }}
      >
        <span />
      </Anime>
    ));
    const el = container.querySelector(".my-class");
    expect(el).toBeTruthy();
  });

  it("calls animejsAnimate on mount with animation prop", () => {
    render(() => (
      <Anime animation={{ opacity: 1, duration: 300 }}>
        <div />
      </Anime>
    ));
    expect(mockAnimate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: 1, duration: 300 }),
    );
  });

  it("applies initial state with duration:0 then animates to animate prop", () => {
    render(() => (
      <Anime initial={{ opacity: 0 }} animate={{ opacity: 1, duration: 300 }}>
        <div />
      </Anime>
    ));

    // First call: initial state (duration: 0)
    expect(mockAnimate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: 0, duration: 0 }),
    );
    // Second call: full animation
    expect(mockAnimate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: 1, duration: 300 }),
    );
  });

  it("re-runs animation when reactive signal changes", () => {
    const [opacity, setOpacity] = createSignal(1);

    render(() => (
      <Anime animation={{ opacity: opacity(), duration: 200 }}>
        <div />
      </Anime>
    ));

    const callsBefore = mockAnimate.mock.calls.length;
    setOpacity(0);

    expect(mockAnimate.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});

describe("AnimePresence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders children", () => {
    const { container } = render(() => (
      <AnimePresence>
        <div data-testid="child">hello</div>
      </AnimePresence>
    ));
    expect(container.querySelector("[data-testid='child']")).toBeTruthy();
  });

  it("renders children in list mode", () => {
    const { container } = render(() => (
      <AnimePresence mode="list">
        <div data-testid="item-1">one</div>
        <div data-testid="item-2">two</div>
      </AnimePresence>
    ));
    expect(container.querySelector("[data-testid='item-1']")).toBeTruthy();
    expect(container.querySelector("[data-testid='item-2']")).toBeTruthy();
  });

  it("list mode wraps children in a display:contents div", () => {
    const { container } = render(() => (
      <AnimePresence mode="list">
        <div>child</div>
      </AnimePresence>
    ));
    const wrapper = container.querySelector("div");
    expect(wrapper?.style.display).toBe("contents");
  });

  it("mounts and unmounts Show child without errors", async () => {
    const [show, setShow] = createSignal(true);

    expect(() => {
      render(() => (
        <AnimePresence>
          <Show when={show()}>
            <Anime animate={{ opacity: 1, duration: 0 }}>
              <div data-testid="toggled">toggled</div>
            </Anime>
          </Show>
        </AnimePresence>
      ));
    }).not.toThrow();

    expect(() => setShow(false)).not.toThrow();
  });

  it("exitBeforeEnter mode does not throw on child switch", () => {
    const [view, setView] = createSignal<"a" | "b">("a");

    expect(() => {
      render(() => (
        <AnimePresence exitBeforeEnter>
          <Show when={view() === "a"}>
            <Anime exit={{ opacity: 0, duration: 0 }}>
              <div>View A</div>
            </Anime>
          </Show>
          <Show when={view() === "b"}>
            <Anime exit={{ opacity: 0, duration: 0 }}>
              <div>View B</div>
            </Anime>
          </Show>
        </AnimePresence>
      ));
    }).not.toThrow();

    expect(() => setView("b")).not.toThrow();
  });
});
