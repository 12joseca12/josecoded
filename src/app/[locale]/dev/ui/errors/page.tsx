import { notFound } from "next/navigation";

import { Heading } from "@/components/ui/Heading/Heading";
import { devPagesEnabled } from "@/config/dev";
import { isLocale } from "@/i18n/config";
import { getErrorCopy } from "@/i18n/errors";
import { getTranslator } from "@/i18n/messages";

import { ErrorPreviews } from "./previews";

const previews = ["serverError", "rateLimited", "maintenance"] as const;

export default async function ErrorsPreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!devPagesEnabled || !isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  const copy = getErrorCopy(locale);

  return (
    <main>
      <Heading level={1} size="h2">
        {t("dev.errors.title")}
      </Heading>
      <ErrorPreviews variants={previews} copy={copy} locale={locale} />
    </main>
  );
}
