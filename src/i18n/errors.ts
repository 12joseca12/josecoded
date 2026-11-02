import type { ErrorCopy } from "@/types/errors";

import en from "../../messages/en.json";
import es from "../../messages/es.json";
import type { Locale } from "./config";

const copies: Record<Locale, ErrorCopy> = { es: es.errors, en: en.errors };

export function getErrorCopy(locale: Locale): ErrorCopy {
  return copies[locale];
}
