import { Config } from "../config/store";
import { configEvent } from "../events/config";
import { randomElementFromArray } from "../utils/arrays";
import { isCapsLockOn } from "@leonabcd123/modern-caps-lock";

import type { Howl } from "howler";
import { PlaySoundOnClick } from "../schemas/configs";
import {
  clickSoundFiles,
  errorSoundFile,
  soundsConfig,
  SupportedOscillatorTypes,
} from "../constants/sounds";
import { getModifierState } from "../states/modifiers";

// Nothing here loads until a sound is switched on: howler itself, then only
// the files of the set that was picked.
let howlerModulePromise: Promise<typeof import("howler")> | null = null;
async function getHowlerModule(): Promise<typeof import("howler")> {
  howlerModulePromise ??= (async () => {
    const howler = await import("howler");
    howler.Howler.volume(Config.soundVolume);
    return howler;
  })();
  return howlerModulePromise;
}

const howlers: Record<string, Promise<Howl>> = {};

async function getHowl(src: string): Promise<Howl> {
  howlers[src] ??= (async () => {
    const { Howl } = await getHowlerModule();
    return new Howl({ src });
  })();

  return howlers[src];
}

async function loadClickSounds(clickId: PlaySoundOnClick): Promise<Howl[]> {
  if (clickId === "off") return [];
  return Promise.all(clickSoundFiles(clickId).map(getHowl));
}

function playHowl(howl: Howl | undefined): void {
  if (howl === undefined) return;
  howl.seek(0);
  howl.play();
}

export async function previewClick(clickId: PlaySoundOnClick): Promise<void> {
  if (clickId === "off") return;

  const config = soundsConfig[clickId];
  if ("oscillatorType" in config) {
    playNote({ codeOverride: "KeyQ", oscillatorType: config.oscillatorType });
    return;
  }

  const [first] = await loadClickSounds(clickId);
  playHowl(first);
}

export async function previewError(): Promise<void> {
  playHowl(await getHowl(errorSoundFile));
}

let currentCode = "KeyA";

document.addEventListener("keydown", (event) => {
  currentCode = event.code || "KeyA";
});

type ValidNotes =
  | "C"
  | "Db"
  | "D"
  | "Eb"
  | "E"
  | "F"
  | "Gb"
  | "G"
  | "Ab"
  | "A"
  | "Bb"
  | "B";

const notes: Record<ValidNotes, ValidFrequencies> = {
  C: [16.35, 32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093.0, 4186.01],
  Db: [17.32, 34.65, 69.3, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92],
  D: [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.64],
  Eb: [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03],
  E: [20.6, 41.2, 82.41, 164.81, 329.63, 659.26, 1318.51, 2637.02],
  F: [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83],
  Gb: [23.12, 46.25, 92.5, 185.0, 369.99, 739.99, 1479.98, 2959.96],
  G: [24.5, 49.0, 98.0, 196.0, 392.0, 783.99, 1567.98, 3135.96],
  Ab: [25.96, 51.91, 103.83, 207.65, 415.3, 830.61, 1661.22, 3322.44],
  A: [27.5, 55.0, 110.0, 220.0, 440.0, 880.0, 1760.0, 3520.0],
  Bb: [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31],
  B: [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07],
} as const;

type ValidFrequencies = number[];

type GetNoteFrequencyCallback = (octave: number) => number;

function bindToNote(
  noteFrequencies: ValidFrequencies,
  octaveOffset = 0,
): GetNoteFrequencyCallback {
  return (octave: number): number => {
    return noteFrequencies[octave + octaveOffset] ?? 0;
  };
}

const codeToNote: Record<string, GetNoteFrequencyCallback> = {
  KeyZ: bindToNote(notes.C),
  KeyS: bindToNote(notes.Db),
  KeyX: bindToNote(notes.D),
  KeyD: bindToNote(notes.Eb),
  KeyC: bindToNote(notes.E),
  KeyV: bindToNote(notes.F),
  KeyG: bindToNote(notes.Gb),
  KeyB: bindToNote(notes.G),
  KeyH: bindToNote(notes.Ab),
  KeyN: bindToNote(notes.A),
  KeyJ: bindToNote(notes.Bb),
  KeyM: bindToNote(notes.B),
  Comma: bindToNote(notes.C, 1),
  KeyL: bindToNote(notes.Db, 1),
  Period: bindToNote(notes.D, 1),
  Semicolon: bindToNote(notes.Eb, 1),
  Slash: bindToNote(notes.E, 1),
  KeyQ: bindToNote(notes.C, 1),
  Digit2: bindToNote(notes.Db, 1),
  KeyW: bindToNote(notes.D, 1),
  Digit3: bindToNote(notes.Eb, 1),
  KeyE: bindToNote(notes.E, 1),
  KeyR: bindToNote(notes.F, 1),
  Digit5: bindToNote(notes.Gb, 1),
  KeyT: bindToNote(notes.G, 1),
  Digit6: bindToNote(notes.Ab, 1),
  KeyY: bindToNote(notes.A, 1),
  Digit7: bindToNote(notes.Bb, 1),
  KeyU: bindToNote(notes.B, 1),
  KeyI: bindToNote(notes.C, 2),
  Digit9: bindToNote(notes.Db, 2),
  KeyO: bindToNote(notes.D, 2),
  Digit0: bindToNote(notes.Eb, 2),
  KeyP: bindToNote(notes.E, 2),
  BracketLeft: bindToNote(notes.F, 2),
  Equal: bindToNote(notes.Gb, 2),
  BracketRight: bindToNote(notes.G, 2),
};

let audioCtx: AudioContext | undefined | null;

function initAudioContext(): void {
  if (audioCtx === null) return;
  try {
    audioCtx = new AudioContext();
  } catch (e) {
    audioCtx = null;
    console.error("Error initializing audio context. Notes will not play.", e);
  }
}

export async function clearAllSounds(): Promise<void> {
  // with no sound ever switched on, howler was never loaded: nothing to stop
  if (howlerModulePromise === null) return;
  const { Howler } = await howlerModulePromise;
  Howler.stop();
}

function playNote(options: {
  codeOverride?: string;
  oscillatorType: SupportedOscillatorTypes;
}): void {
  if (audioCtx === undefined) {
    initAudioContext();
  }
  if (!audioCtx) return;

  currentCode = options.codeOverride ?? currentCode;
  if (!(currentCode in codeToNote)) {
    return;
  }

  const baseOctave = 3;
  const { shift } = getModifierState();
  const octave = baseOctave + (shift || isCapsLockOn() ? 1 : 0);
  const currentFrequency = codeToNote[currentCode]?.(octave);

  const oscillatorNode = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillatorNode.type = options.oscillatorType;
  gainNode.gain.value = Config.soundVolume / 10;

  oscillatorNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillatorNode.frequency.value = currentFrequency as number;
  oscillatorNode.start(audioCtx.currentTime);
  gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.15); //remove click sound
  oscillatorNode.stop(audioCtx.currentTime + 0.5);
}

export async function playClick(codeOverride?: string): Promise<void> {
  const val = Config.playSoundOnClick;
  if (val === "off") return;

  const config = soundsConfig[val];
  if ("oscillatorType" in config) {
    playNote({ codeOverride, oscillatorType: config.oscillatorType });
    return;
  }

  const sounds = await loadClickSounds(val);
  playHowl(randomElementFromArray(sounds));
}

export async function playError(): Promise<void> {
  if (Config.playSoundOnError === "off") return;
  playHowl(await getHowl(errorSoundFile));
}

async function setVolume(val: number): Promise<void> {
  if (howlerModulePromise === null) return;
  const { Howler } = await howlerModulePromise;
  Howler.volume(val);
}

// Load a set when it is picked (or when the stored config switches it on), so
// the first key of a test does not wait on the network.
configEvent.subscribe(({ key, newValue }) => {
  if (key === "playSoundOnClick") void loadClickSounds(newValue);
  if (key === "playSoundOnError" && newValue !== "off") {
    void getHowl(errorSoundFile);
  }
  if (key === "soundVolume") {
    void setVolume(newValue);
  }
});
