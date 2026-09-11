import { createSignal } from "solid-js";
import { PageName } from "../pages/page";

export const [getActivePage, setActivePage] = createSignal<PageName>("loading");

export const [getGlobalOffsetTop, setGlobalOffsetTop] = createSignal(0);
export const [getIsScreenshotting, setIsScreenshotting] = createSignal(false);
