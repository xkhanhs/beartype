import { debounce } from "throttle-debounce";
import { showSuccessNotification } from "../states/notifications";
import { connectionEvent } from "../events/connection";
import { onDOMReady } from "../utils/dom";
import { addBanner, removeBanner } from "../states/banners";
import { isTestActive } from "../states/test";

let state = navigator.onLine;

export function get(): boolean {
  return state;
}

let noInternetBannerId: number | undefined = undefined;

let bannerAlreadyClosed = false;

export function showOfflineBanner(): void {
  if (bannerAlreadyClosed) return;
  noInternetBannerId ??= addBanner({
    level: "notice",
    text: "Mất kết nối mạng",
    icon: "fas fa-exclamation-triangle",
    onClose: () => {
      bannerAlreadyClosed = true;
      noInternetBannerId = undefined;
    },
  });
}

const throttledHandleState = debounce(5000, () => {
  if (state) {
    if (noInternetBannerId !== undefined) {
      showSuccessNotification("Đã có mạng trở lại", {
        customTitle: "kết nối",
      });
      removeBanner(noInternetBannerId);
      noInternetBannerId = undefined;
    }
    bannerAlreadyClosed = false;
  } else if (!isTestActive()) {
    showOfflineBanner();
  }
});

connectionEvent.subscribe((newState) => {
  state = newState;
  throttledHandleState();
});

onDOMReady(() => {
  state = navigator.onLine;
  if (!state) {
    showOfflineBanner();
  }
});
