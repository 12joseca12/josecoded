"use client";

import "@/styles/tokens.css";
import "@/styles/base.css";

import { ErrorPage } from "@/components/ui/ErrorPage/ErrorPage";
import { defaultLocale } from "@/i18n/config";
import { getErrorCopy } from "@/i18n/errors";
import { interTight } from "@/styles/font";

export default function GlobalError() {
  return (
    <html lang={defaultLocale} className={interTight.variable}>
      <body>
        <main>
          <ErrorPage variant="serverError" copy={getErrorCopy(defaultLocale)} />
        </main>
      </body>
    </html>
  );
}
