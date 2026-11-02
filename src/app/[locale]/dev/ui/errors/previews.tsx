"use client";

import { ErrorPage } from "@/components/ui/ErrorPage/ErrorPage";
import type { Locale } from "@/i18n/config";
import type { ErrorCopy, ErrorVariant } from "@/types/errors";

const noop = () => undefined;

export function ErrorPreviews({
  variants,
  copy,
  locale,
}: {
  variants: readonly ErrorVariant[];
  copy: ErrorCopy;
  locale: Locale;
}) {
  return variants.map((variant) => (
    <ErrorPage
      key={variant}
      variant={variant}
      copy={copy}
      locale={locale}
      layout="inline"
      headingLevel={2}
      focusOnLoad={false}
      onRetry={variant === "maintenance" ? undefined : noop}
    />
  ));
}
