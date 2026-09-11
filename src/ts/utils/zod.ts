import {
  ZodBranded,
  ZodDefault,
  ZodEffects,
  ZodError,
  ZodNullable,
  ZodOptional,
  ZodTypeAny,
} from "zod";

//from https://github.com/colinhacks/zod/pull/3819
export function isZodError(error: unknown): error is ZodError {
  if (!(error instanceof Error)) return false;

  if (error instanceof ZodError) return true;
  if (error.constructor.name === "ZodError") return true;
  if ("issues" in error && Array.isArray(error.issues)) return true;

  return false;
}

/**
 * Unwraps a Zod schema by removing wrappers like optional, default, nullable,
 * returning the underlying inner schema.
 **/
export function unwrapSchema(schema: ZodTypeAny): ZodTypeAny {
  let current = schema;

  while (true) {
    if (current instanceof ZodOptional) {
      current = current.unwrap() as ZodTypeAny;
      continue;
    }
    if (current instanceof ZodDefault) {
      current = current.removeDefault() as ZodTypeAny;
      continue;
    }
    if (current instanceof ZodNullable) {
      current = current.unwrap() as ZodTypeAny;
      continue;
    }
    if (current instanceof ZodEffects) {
      current = current.innerType() as ZodTypeAny;
      continue;
    }
    if (current instanceof ZodBranded) {
      current = current.unwrap() as ZodTypeAny;
      continue;
    }

    break;
  }

  return current;
}
