import {
  createEffect,
  createSignal,
  For,
  JSXElement,
  on,
  onCleanup,
  Show,
} from "solid-js";
import { Portal } from "solid-js/web";

import {
  customText,
  deleteText,
  savedTexts,
  saveText,
  setCustomText,
  wordsOf,
} from "../../beartype/custom-text";
import { t } from "../../beartype/strings";
import { setConfig } from "../../config/setters";
import { restartTestEvent } from "../../events/test";
import * as PractiseWords from "../../test/practise-words";
import { Icon } from "./Icon";

const [open, setOpen] = createSignal(false);

/** Opens the card: the custom mode's pill in the options bar does this. */
export function openCustomTextEditor(): void {
  setOpen(true);
}

/**
 * The custom mode's card, upstream's custom text modal cut down to what is
 * typed here: a box for the text, a start button, and the texts kept for
 * later, which load back into the box with a click. The mode only turns on
 * from "start", so it never runs with nothing to type.
 *
 * A native `<dialog>`: it holds the focus, and Escape or a click on the
 * backdrop closes it. Its keys stop at the dialog, or the test page would
 * take them -- any key focuses the words, and Enter on the result starts a
 * new test. Ctrl or Cmd + Enter starts from anywhere in it; Enter in the
 * name box saves.
 */
export function CustomTextEditor(): JSXElement {
  const [dialog, setDialog] = createSignal<HTMLDialogElement>();
  const [box, setBox] = createSignal<HTMLTextAreaElement>();
  const [nameBox, setNameBox] = createSignal<HTMLInputElement>();
  const [draft, setDraft] = createSignal("");
  const [name, setName] = createSignal("");
  // the saved text whose × was pressed, waiting for a second, deliberate
  // press: a text typed out by hand is gone for good once deleted
  const [confirming, setConfirming] = createSignal<string | null>(null);
  const words = (): number => wordsOf(draft()).length;

  // on opening only: saving writes the store the draft is read from, and must
  // not throw away what is in the box
  createEffect(
    on([dialog, open], ([el, isOpen]) => {
      if (el === undefined) return;
      if (isOpen) {
        setDraft(customText());
        setName("");
        setConfirming(null);
        el.showModal();
        box()?.focus();
      } else if (el.open) {
        el.close();
      }
    }),
  );

  // native, not Solid's `onKeyDown`: Solid's handlers sit on the document,
  // past the point where this one stops the key
  const onKeyDown = (e: KeyboardEvent): void => {
    e.stopPropagation();
    if (e.key !== "Enter") return;
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      start();
    } else if (e.target === nameBox()) {
      e.preventDefault();
      save();
    }
  };
  createEffect(() => {
    const el = dialog();
    if (el === undefined) return;
    el.addEventListener("keydown", onKeyDown);
    onCleanup(() => el.removeEventListener("keydown", onKeyDown));
  });

  const start = (): void => {
    if (words() === 0) return;
    setCustomText(draft());
    setOpen(false);
    // a drill runs in this mode too, and would otherwise go on
    PractiseWords.resetBefore();
    setConfig("mode", "custom");
    restartTestEvent.dispatch();
  };

  const save = (): void => {
    if (words() === 0) return;
    saveText(name(), draft());
    setName("");
  };

  return (
    <Portal>
      <dialog
        ref={setDialog}
        class="bt-custom-card"
        aria-label={t("customText")}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialog()) setOpen(false);
        }}
      >
        <div class="bt-custom-head">
          <div class="bt-settings-title">{t("customText")}</div>
          <button
            type="button"
            class="bt-custom-icon-button"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          >
            <Icon name="x" />
          </button>
        </div>
        <textarea
          ref={(el) => {
            // Vietnamese without its dictionary is red from end to end
            el.spellcheck = false;
            setBox(el);
          }}
          class="bt-custom-box"
          value={draft()}
          placeholder={t("customTextPlaceholder")}
          autocomplete="off"
          onInput={(e) => setDraft(e.currentTarget.value)}
        ></textarea>
        <div class="bt-custom-meta">
          <span>{t("customTextWords", words())}</span>
          <span>{t("customTextCase")}</span>
        </div>
        <div class="bt-custom-actions">
          <input
            ref={(el) => {
              el.spellcheck = false;
              setNameBox(el);
            }}
            class="bt-custom-name"
            type="text"
            value={name()}
            placeholder={t("customTextName")}
            autocomplete="off"
            onInput={(e) => setName(e.currentTarget.value)}
          />
          <button
            type="button"
            class="bt-settings-choice"
            disabled={words() === 0}
            onClick={save}
          >
            {t("customTextSave")}
          </button>
          <button
            type="button"
            class="bt-settings-choice bt-custom-start"
            disabled={words() === 0}
            onClick={start}
          >
            {t("customTextStart")}
          </button>
        </div>
        <Show when={savedTexts().length > 0}>
          <div class="bt-custom-saved">
            <div class="bt-settings-row-name">{t("customTextSaved")}</div>
            <ul>
              <For each={savedTexts()}>
                {(saved) => (
                  <li>
                    <button
                      type="button"
                      class="bt-custom-saved-load"
                      onClick={() => {
                        setDraft(saved.text);
                        setName(saved.name);
                        box()?.focus();
                      }}
                    >
                      <span class="bt-custom-saved-name">{saved.name}</span>
                      <span class="bt-custom-saved-count">
                        {t("customTextWords", wordsOf(saved.text).length)}
                      </span>
                    </button>
                    <Show
                      when={confirming() === saved.name}
                      fallback={
                        <button
                          type="button"
                          class="bt-custom-icon-button"
                          aria-label={t("customTextDelete", saved.name)}
                          onClick={() => setConfirming(saved.name)}
                        >
                          <Icon name="x" />
                        </button>
                      }
                    >
                      <div
                        class="bt-custom-confirm"
                        role="group"
                        aria-label={t("customTextDelete", saved.name)}
                      >
                        <button
                          type="button"
                          class="bt-settings-choice bt-custom-delete"
                          ref={(el) => queueMicrotask(() => el.focus())}
                          onClick={() => {
                            deleteText(saved.name);
                            setConfirming(null);
                          }}
                        >
                          {t("customTextConfirmDelete")}
                        </button>
                        <button
                          type="button"
                          class="bt-settings-choice"
                          onClick={() => setConfirming(null)}
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </Show>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
      </dialog>
    </Portal>
  );
}
