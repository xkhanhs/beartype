import * as Misc from "./utils/misc";
import { configLoadPromise } from "./config/lifecycle";
import { animate } from "animejs";
import { onDOMReady, qs } from "./utils/dom";

onDOMReady(async () => {
  await configLoadPromise;

  //this line goes back to pretty much the beginning of the project and im pretty sure its here
  //to make sure the initial theme application doesnt animate the background color
  qs("body")?.setStyle({
    transition: "background .25s, transform .05s",
  });

  const app = document.querySelector("#app") as HTMLElement;
  app?.classList.remove("hidden");
  animate(app, {
    opacity: [0, 1],
    duration: Misc.applyReducedMotion(250),
  });

  // beartype ships no service worker. Drop any left behind on this origin, or
  // it keeps answering from its cache and a new release never shows up.
  void navigator.serviceWorker?.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });
});
