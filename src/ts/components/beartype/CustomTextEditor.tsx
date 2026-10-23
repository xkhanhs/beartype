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
  measuredOn,
  savedTexts,
  saveText,
  setCustomLength,
  setCustomText,
  wordsOf,
} from "../../beartype/custom-text";
import { t } from "../../beartype/strings";
import { setConfig } from "../../config/setters";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import * as PractiseWords from "../../test/practise-words";
import { cn } from "../../utils/cn";
import { Icon } from "./Icon";

const [open, setOpen] = createSignal(false);

/** Opens the card: the custom mode's pill in the options bar does this. */
export function openCustomTextEditor(): void {
  setOpen(true);
}

/**
 * What the card shows: the list of saved texts, or the box a text is written
 * in -- a new one (`editing: null`), or the saved text of that name. Kept
 * apart so a text loaded from the list is never mistaken for a new one: the
 * box always says which of the two it holds, and saving writes back to the
 * same entry.
 */
type View = { kind: "list" } | { kind: "edit"; editing: string | null };

/**
 * Runs the custom test -- on `text` when given, else on the text it last ran
 * -- closing the card. Coming from the word list, or a drill, the test keeps
 * the length it had: 30 seconds of the list become 30 seconds of the text.
 */
export function startCustomText(text = customText()): void {
  if (wordsOf(text).length === 0) return;
  setCustomText(text);
  setOpen(false);
  if (!PractiseWords.customSource()) {
    const base = PractiseWords.drillBaseMode() ?? getConfig.mode;
    setCustomLength(base === "words" ? "words" : "time");
  }
  // a drill runs in this mode too, and would otherwise go on
  PractiseWords.resetBefore();
  setConfig("mode", "custom");
  restartTestEvent.dispatch();
}

/**
 * What deleting a saved text also throws away -- its rounds and its books --
 * said before the second press, or `null` when it was never measured.
 */
function lost(id: string): string | null {
  const { rounds, words } = measuredOn(id);
  if (rounds === 0 && words === 0) return null;
  return t("customTextDeleteWarning", rounds, words);
}

/** The custom test running now, from outside a drill. */
function running(text: string): boolean {
  return PractiseWords.customSource() && text === customText();
}

/**
 * The custom mode's card, upstream's custom text and saved texts modals made
 * into one card with two faces. It opens on the saved texts, where a press
 * starts one, the pencil edits it and the × deletes it after asking -- and,
 * when the text has rounds or books, after saying they go with it; "new
 * text" opens an empty box. With nothing saved it opens straight on the box,
 * holding whatever text the mode last ran. The mode only turns on from a
 * start, so it never runs with nothing to type.
 *
 * A native `<dialog>`: it holds the focus, and Escape or a click on the
 * backdrop closes it. Its keys stop at the dialog, or the test page would
 * take them -- any key focuses the words, and Enter on the result starts a
 * new test. In the box, Ctrl or Cmd + Enter starts; Enter in the name saves.
 */
export function CustomTextEditor(): JSXElement {
  const [dialog, setDialog] = createSignal<HTMLDialogElement>();
  const [box, setBox] = createSignal<HTMLTextAreaElement>();
  const [nameBox, setNameBox] = createSignal<HTMLInputElement>();
  const [view, setView] = createSignal<View>({ kind: "list" });
  const [draft, setDraft] = createSignal("");
  const [name, setName] = createSignal("");
  // the saved text whose × was pressed, waiting for a second, deliberate
  // press: a text typed out by hand is gone for good once deleted
  const [confirming, setConfirming] = createSignal<string | null>(null);
  const words = (): number => wordsOf(draft()).length;
  const editing = (): string | null => {
    const v = view();
    return v.kind === "edit" ? v.editing : null;
  };

  const edit = (editing: string | null, text: string, title: string): void => {
    setDraft(text);
    setName(title);
    setView({ kind: "edit", editing });
  };

  // the box takes the focus each time it is shown, once it is in the page
  createEffect(
    on([view, box], ([v, el]) => {
      if (v.kind === "edit") el?.focus();
    }),
  );

  const showList = (): void => {
    setConfirming(null);
    setView({ kind: "list" });
  };

  // on opening only: saving writes the store the draft is read from, and must
  // not throw away what is in the box
  createEffect(
    on([dialog, open], ([el, isOpen]) => {
      if (el === undefined) return;
      if (isOpen) {
        if (savedTexts().length === 0) {
          edit(null, customText(), "");
        } else {
          showList();
        }
        el.showModal();
      } else if (el.open) {
        el.close();
      }
    }),
  );

  const save = (): void => {
    if (words() === 0) return;
    saveText(name(), draft(), editing() ?? undefined);
    showList();
  };

  // native, not Solid's `onKeyDown`: Solid's handlers sit on the document,
  // past the point where this one stops the key
  const onKeyDown = (e: KeyboardEvent): void => {
    e.stopPropagation();
    if (e.key !== "Enter" || view().kind !== "edit") return;
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      startCustomText(draft());
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

  const title = (): string => {
    if (view().kind === "list") return t("customText");
    const editingName = editing();
    return editingName === null
      ? t("customTextNew")
      : t("customTextEditing", editingName);
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
          <Show when={view().kind === "edit" && savedTexts().length > 0}>
            <button
              type="button"
              class="bt-custom-icon-button"
              aria-label={t("customTextBack")}
              onClick={showList}
            >
              <Icon name="arrow-left" />
            </button>
          </Show>
          <div class="bt-settings-title">{title()}</div>
          <button
            type="button"
            class="bt-custom-icon-button"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          >
            <Icon name="x" />
          </button>
        </div>

        <Show
          when={view().kind === "edit"}
          fallback={
            <>
              <ul class="bt-custom-saved">
                <For each={savedTexts()}>
                  {(saved) => (
                    <li>
                      <button
                        type="button"
                        class="bt-custom-saved-load"
                        aria-label={t("customTextPlay", saved.name)}
                        aria-current={running(saved.text) ? "true" : undefined}
                        onClick={() => startCustomText(saved.text)}
                      >
                        <Icon name="play" />
                        <span class="bt-custom-saved-name">{saved.name}</span>
                        <span class="bt-custom-saved-count">
                          {t("customTextWords", wordsOf(saved.text).length)}
                        </span>
                      </button>
                      <button
                        type="button"
                        class="bt-custom-icon-button"
                        aria-label={t("customTextEditOne", saved.name)}
                        onClick={() => edit(saved.name, saved.text, saved.name)}
                      >
                        <Icon name="pencil" />
                      </button>
                      <button
                        type="button"
                        class="bt-custom-icon-button"
                        aria-label={t("customTextDelete", saved.name)}
                        onClick={() => setConfirming(saved.name)}
                      >
                        <Icon name="x" />
                      </button>
                      {/* laid over the row's end rather than in place of the
                          buttons, so nothing in the row or the list moves */}
                      <Show when={confirming() === saved.name}>
                        <div
                          class={cn("bt-custom-confirm", {
                            "bt-custom-confirm-wide": lost(saved.id) !== null,
                          })}
                          role="group"
                          aria-label={t("customTextDelete", saved.name)}
                        >
                          <Show when={lost(saved.id)}>
                            {(warning) => (
                              <span class="bt-custom-confirm-warning">
                                {warning()}
                              </span>
                            )}
                          </Show>
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
              <div class="bt-custom-actions bt-custom-actions-end">
                <button
                  type="button"
                  class="bt-settings-choice bt-custom-start"
                  onClick={() => edit(null, "", "")}
                >
                  {t("customTextAdd")}
                </button>
              </div>
            </>
          }
        >
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
              aria-label={t("customTextName")}
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
              onClick={() => startCustomText(draft())}
            >
              {t("customTextStart")}
            </button>
          </div>
        </Show>
      </dialog>
    </Portal>
  );
}
