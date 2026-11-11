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
  NAME_MAX,
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
 * backdrop closes it -- after asking, when the box holds a text not saved. Its keys stop at the dialog, or the test page would
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
  // what the box held when it opened, so leaving it can tell whether
  // anything typed since would be lost
  const [baseline, setBaseline] = createSignal({ draft: "", name: "" });
  // where the typist was going when the box stopped them to ask: a draft
  // they have not saved is lost on the way out, so the way out asks first
  const [leaving, setLeaving] = createSignal<"close" | "list" | null>(null);
  const words = (): number => wordsOf(draft()).length;
  const editing = (): string | null => {
    const v = view();
    return v.kind === "edit" ? v.editing : null;
  };

  const edit = (editing: string | null, text: string, title: string): void => {
    setDraft(text);
    setName(title);
    setBaseline({ draft: text, name: title });
    setLeaving(null);
    setView({ kind: "edit", editing });
  };

  // the backdrop is the dialog element itself, and so is the card's padding:
  // a click counts as outside only by where it lands. And only when it was
  // pressed out there too, or text selected in the box with the button let
  // go past its edge would read as a click on the backdrop.
  let pressedOutside = false;
  const outside = (e: MouseEvent): boolean => {
    const el = dialog();
    if (el === undefined || e.target !== el) return false;
    const r = el.getBoundingClientRect();
    return (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    );
  };

  const unsaved = (): boolean =>
    view().kind === "edit" &&
    (draft() !== baseline().draft || name() !== baseline().name);

  // the box takes the focus each time it is shown, once it is in the page,
  // and back from the question when the typist stays: the button they
  // pressed is gone, and the focus would fall out of the dialog with it
  createEffect(
    on([view, box, leaving], ([v, el, asking]) => {
      if (v.kind === "edit" && asking === null) el?.focus();
    }),
  );

  const showList = (): void => {
    setConfirming(null);
    setLeaving(null);
    setView({ kind: "list" });
  };

  // the backdrop, Escape, the × and the arrow back all go through here: a
  // click beside the card is easy to make by accident, a page of text typed
  // out by hand is not easy to make again
  const leave = (to: "close" | "list"): void => {
    if (unsaved()) {
      setLeaving(to);
    } else if (to === "close") {
      setOpen(false);
    } else {
      showList();
    }
  };
  // asked already, Escape answers "keep editing"
  const escape = (): void => {
    if (leaving() === null) {
      leave("close");
    } else {
      setLeaving(null);
    }
  };
  const discard = (): void => {
    const to = leaving();
    setLeaving(null);
    setBaseline({ draft: draft(), name: name() });
    if (to !== null) leave(to);
  };

  // on opening only: saving writes the store the draft is read from, and must
  // not throw away what is in the box
  createEffect(
    on([dialog, open], ([el, isOpen]) => {
      if (el === undefined) return;
      if (isOpen) {
        setLeaving(null);
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
    // Escape is answered here, the browser's own close held back: Chrome lets
    // a dialog refuse its `cancel` only once without a click or key between,
    // and the second Escape would close it over a draft not saved
    if (e.key === "Escape") {
      e.preventDefault();
      escape();
      return;
    }
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
        onCancel={(e) => {
          e.preventDefault();
          escape();
        }}
        onPointerDown={(e) => {
          pressedOutside = outside(e);
        }}
        onClick={(e) => {
          if (pressedOutside && outside(e)) leave("close");
        }}
      >
        <div class="bt-custom-head">
          <Show when={view().kind === "edit" && savedTexts().length > 0}>
            <button
              type="button"
              class="bt-custom-icon-button"
              aria-label={t("customTextBack")}
              onClick={() => leave("list")}
            >
              <Icon name="arrow-left" />
            </button>
          </Show>
          <div class="bt-settings-title">{title()}</div>
          <button
            type="button"
            class="bt-custom-icon-button"
            aria-label={t("close")}
            onClick={() => leave("close")}
          >
            <Icon name="x" />
          </button>
        </div>

        <Show
          when={view().kind === "edit"}
          fallback={
            <>
              <ul
                class="bt-custom-saved"
                ref={(el) =>
                  // the text running now, in sight however long the list
                  queueMicrotask(() =>
                    el
                      .querySelector("[aria-current]")
                      ?.scrollIntoView({ block: "nearest" }),
                  )
                }
              >
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
          <Show
            when={leaving() === null}
            fallback={
              <div
                class="bt-custom-actions bt-custom-leave"
                role="group"
                aria-label={t("customTextDiscardAsk")}
              >
                <span class="bt-custom-confirm-warning">
                  {t("customTextDiscardAsk")}
                </span>
                <button
                  type="button"
                  class="bt-settings-choice bt-custom-delete"
                  onClick={discard}
                >
                  {t("customTextDiscard")}
                </button>
                <button
                  type="button"
                  class="bt-settings-choice"
                  // staying is the answer to a slip of the hand
                  ref={(el) => queueMicrotask(() => el.focus())}
                  onClick={() => setLeaving(null)}
                >
                  {t("customTextKeepEditing")}
                </button>
              </div>
            }
          >
            <div class="bt-custom-actions">
              <span class="bt-custom-name-field">
                <input
                  ref={(el) => {
                    el.spellcheck = false;
                    setNameBox(el);
                  }}
                  class="bt-custom-name"
                  type="text"
                  maxLength={NAME_MAX}
                  value={name()}
                  placeholder={t("customTextName")}
                  aria-label={t("customTextName")}
                  autocomplete="off"
                  onInput={(e) => setName(e.currentTarget.value)}
                />
                {/* the name stands in the options bar, so it has a limit,
                    shown before it is reached */}
                <span class="bt-custom-name-count" aria-hidden="true">
                  {[...name()].length}/{NAME_MAX}
                </span>
              </span>
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
        </Show>
      </dialog>
    </Portal>
  );
}
