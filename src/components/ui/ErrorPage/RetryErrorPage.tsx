"use client";

import { useState } from "react";

import type { Locale } from "@/i18n/config";
import { getErrorCopy } from "@/i18n/errors";

import { ErrorPage } from "./ErrorPage";

interface RetryErrorPageProps {
  locale: Locale;
  reset?: () => void;
}

export function RetryErrorPage({ locale, reset }: RetryErrorPageProps) {
  const [retrying, setRetrying] = useState(false);

  return (
    <ErrorPage
      variant="serverError"
      copy={getErrorCopy(locale)}
      locale={locale}
      retrying={retrying}
      onRetry={
        reset
          ? () => {
              setRetrying(true);
              reset();
            }
          : undefined
      }
    />
  );
}
