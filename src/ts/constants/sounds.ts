import { PlaySoundOnClick, PlaySoundOnError } from "../schemas/configs";

/**
 * The typing sounds on offer: keybear's click, five of upstream's sets of
 * recordings, each a few takes of one key played at random, and one synth
 * note that needs no file. Upstream's ids are kept, so their files keep their
 * paths under `static/sounds/`.
 *
 * keybear's click and blip come from keybr (AGPL-3.0), by way of keybear.
 */
export const soundsConfig: SoundConfigType = {
  keybear: { files: ["../sounds/keybear/click.mp3"] },
  1: { numberOfSounds: 3 },
  3: { numberOfSounds: 3 },
  4: { numberOfSounds: 6 },
  5: { numberOfSounds: 6 },
  6: { numberOfSounds: 3 },
  8: { oscillatorType: "sine" },
};

type ClickSoundConfig = { numberOfSounds: number } | { files: string[] };

export type SupportedOscillatorTypes = Exclude<OscillatorType, "custom">;
type OscillatorSoundConfig = {
  oscillatorType: SupportedOscillatorTypes;
};

type SoundConfigType = Record<
  Exclude<PlaySoundOnClick, "off">,
  ClickSoundConfig | OscillatorSoundConfig
>;

/** The files of each recorded set. */
export function clickSoundFiles(
  id: Exclude<PlaySoundOnClick, "off">,
): string[] {
  const config = soundsConfig[id];
  if ("files" in config) return config.files;
  if (!("numberOfSounds" in config)) return [];
  return new Array(config.numberOfSounds)
    .fill(0)
    .map((_, index) => `../sounds/click${id}/${index + 1}.wav`);
}

/** The sound of a wrong key: keybear's blip, or upstream's first. */
export const errorSoundFiles: Record<
  Exclude<PlaySoundOnError, "off">,
  string
> = {
  keybear: "../sounds/keybear/blip.mp3",
  1: "../sounds/error1/1.wav",
};
