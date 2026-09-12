const elem = document.querySelector<HTMLElement>(".pageTest #testInitFailed");
const testElem = document.querySelector<HTMLElement>(".pageTest #typingTest");
const textElem = document.querySelector<HTMLElement>(
  ".pageTest #testInitFailed div.text",
);
const errorElem = document.querySelector<HTMLElement>(
  ".pageTest #testInitFailed .error",
);
const restartElem = document.querySelector<HTMLElement>(
  ".pageTest #testInitFailed button.restart",
);

// beartype: notifications are not mounted, so the reason is written here,
// and the restart button takes focus so Enter tries again
export function show(text: string, error?: string): void {
  if (textElem) textElem.innerText = text;
  if (errorElem) {
    errorElem.classList.toggle("hidden", error === undefined);
    errorElem.innerText = error ?? "";
  }
  if (elem && testElem) {
    elem.classList.remove("hidden");
    testElem.classList.add("hidden");
  }
  restartElem?.focus();
}

export function hide(): void {
  if (elem && testElem) {
    elem.classList.add("hidden");
    testElem.classList.remove("hidden");
  }
}
