"use client";

import "@/styles/tokens.css";
import "@/styles/base.css";

import { lazy, Suspense } from "react";

import { defaultLocale } from "@/i18n/config";
import { preloadLater } from "@/lib/preload-later";
import { interTight } from "@/styles/font";

const loadRetryErrorPage = () =>
  import("@/components/ui/ErrorPage/RetryErrorPage").then((module) => ({
    default: module.RetryErrorPage,
  }));
const RetryErrorPage = lazy(loadRetryErrorPage);
preloadLater(loadRetryErrorPage);

export default function GlobalError() {
  return (
    <html lang={defaultLocale} className={interTight.variable}>
      <body>
        <main>
          <Suspense fallback={null}>
            <RetryErrorPage locale={defaultLocale} />
          </Suspense>
        </main>
      </body>
    </html>
  );
}
