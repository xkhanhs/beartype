import {
  isCapsLockOn as checkCapsLockOn,
  onCapsLockChange,
} from "@leonabcd123/modern-caps-lock";
import { createSignal } from "solid-js";

const [isCapsLockOn, setCapsLockOn] = createSignal<boolean>(checkCapsLockOn());
export { isCapsLockOn };

onCapsLockChange((state) => setCapsLockOn(state));
