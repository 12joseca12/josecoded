"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { ErrorPage } from "@/components/ui/ErrorPage/ErrorPage";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getErrorCopy } from "@/i18n/errors";

export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  const { locale: param } = useParams<{ locale: string }>();
  const locale = isLocale(param) ? param : defaultLocale;
  const [retrying, setRetrying] = useState(false);

  return (
    <main>
      <ErrorPage
        variant="serverError"
        copy={getErrorCopy(locale)}
        locale={locale}
        retrying={retrying}
        onRetry={() => {
          setRetrying(true);
          reset();
        }}
      />
    </main>
  );
}
