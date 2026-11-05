"use client";

import { useParams } from "next/navigation";
import { lazy, Suspense } from "react";

import { defaultLocale, isLocale } from "@/i18n/config";
import { preloadLater } from "@/lib/preload-later";

const loadRetryErrorPage = () =>
  import("@/components/ui/ErrorPage/RetryErrorPage").then((module) => ({
    default: module.RetryErrorPage,
  }));
const RetryErrorPage = lazy(loadRetryErrorPage);
preloadLater(loadRetryErrorPage);

export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  const { locale: param } = useParams<{ locale: string }>();
  const locale = isLocale(param) ? param : defaultLocale;

  return (
    <Suspense fallback={null}>
      <RetryErrorPage locale={locale} reset={reset} />
    </Suspense>
  );
}
