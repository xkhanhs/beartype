import { showErrorNotification } from "../states/notifications";
import { ZodSchema } from "zod";

export function invalid(
  key: string,
  val: unknown,
  customMessage?: string,
): void {
  let message = `Invalid value for ${key} (${val}). Please try to change this setting again.`;

  if (customMessage !== undefined) {
    message = `Invalid value for ${key} (${val}). ${customMessage}`;
  }

  showErrorNotification(message);
  console.error(message);
}

export function isConfigValueValid<T>(
  key: string,
  val: T,
  schema: ZodSchema<T>,
): boolean {
  const isValid = schema.safeParse(val).success;
  if (!isValid) invalid(key, val, undefined);

  return isValid;
}
