import { applyReducedMotion } from "../utils/misc";
import { qs } from "../utils/dom";

export function hide(): void {
  visible = false;
  qs("#result .stats .wpm .crown")?.setStyle({ opacity: "0" })?.hide();
}

let visible = false;

export function show(): void {
  if (visible) return;
  visible = true;
  const el = qs("#result .stats .wpm .crown");

  el?.animate({
    opacity: [0, 1],
    duration: applyReducedMotion(125),
    onBegin: () => {
      el?.show();
    },
  });
}
