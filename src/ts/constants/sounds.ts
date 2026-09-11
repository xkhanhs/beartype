import { PlaySoundOnClick } from "../schemas/configs";

/**
 * The typing sounds on offer: five of upstream's sets of recordings, each a
 * few takes of one key played at random, and one synth note that needs no
 * file. The ids are upstream's, so their files keep their paths under
 * `static/sounds/`.
 */
export const soundsConfig: SoundConfigType = {
  1: { numberOfSounds: 3 },
  3: { numberOfSounds: 3 },
  4: { numberOfSounds: 6 },
  5: { numberOfSounds: 6 },
  6: { numberOfSounds: 3 },
  8: { oscillatorType: "sine" },
};

type ClickSoundConfig = {
  numberOfSounds: number;
};

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
  if (!("numberOfSounds" in config)) return [];
  return new Array(config.numberOfSounds)
    .fill(0)
    .map((_, index) => `../sounds/click${id}/${index + 1}.wav`);
}

export const errorSoundFile = "../sounds/error1/1.wav";
