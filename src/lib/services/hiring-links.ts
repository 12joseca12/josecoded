import { features } from "@/config/features";
import { getCv } from "@/content/cv";
import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { resolveCvHref } from "@/lib/about/cv";
import { buildContactHref } from "@/lib/contact/ways";
import type { BentoLinkData } from "@/types/services";

export function buildHiringLinks(
  t: (key: MessageKey) => string,
  locale: Locale,
): { cta: BentoLinkData; more: BentoLinkData[] } {
  const cvEs = resolveCvHref(getCv().file, "es", features.cvDownload);
  const trajectory: BentoLinkData = {
    href: `/${locale}/sobre-mi`,
    label: t("services.bento.hiring.trajectory"),
  };
  const availability: BentoLinkData = {
    href: buildContactHref(locale, "contratacion"),
    label: t("services.bento.hiring.availability"),
  };
  const cta: BentoLinkData = cvEs
    ? { href: cvEs, label: t("services.bento.hiring.cv"), download: true }
    : trajectory;
  return { cta, more: [...(cvEs ? [trajectory] : []), availability] };
}
