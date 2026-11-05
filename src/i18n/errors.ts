import type { ErrorCopy } from "@/types/errors";

import type { Locale } from "./config";
import { errorCopies } from "./errors.generated";

export function getErrorCopy(locale: Locale): ErrorCopy {
  return errorCopies[locale];
}
