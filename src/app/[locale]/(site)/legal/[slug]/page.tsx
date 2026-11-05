import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalDoc } from "@/components/legal/LegalDoc/LegalDoc";
import { PageGraph } from "@/components/seo/PageGraph/PageGraph";
import { site } from "@/config/site";
import { getLegal } from "@/content";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { isLegalIndexed, isLegalSlug, legalPages, legalPath, legalSlugs } from "@/lib/legal/pages";
import { buildBreadcrumbList } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { localePath } from "@/lib/seo/routes";

interface LegalProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return legalSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: LegalProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const entry = getLegal(slug);
  if (!isLocale(locale) || !isLegalSlug(slug) || !entry) return {};
  return buildPageMetadata({
    locale,
    path: legalPath(slug),
    title: legalPages[slug].title,
    description: legalPages[slug].description,
    indexable: isLegalIndexed(slug, entry.meta),
  });
}

export default async function LegalPage({ params }: LegalProps) {
  const { locale, slug } = await params;
  const entry = getLegal(slug);
  if (!isLocale(locale) || !isLegalSlug(slug) || !entry) notFound();
  const [t, { default: Body }] = await Promise.all([getTranslator(locale), entry.load()]);
  const updated = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(entry.meta.updated),
  );

  return (
    <>
      <PageGraph
        nodes={[
          buildBreadcrumbList(site.origin, [
            { name: t("nav.home"), path: localePath(locale, "") },
            { name: entry.meta.title, path: localePath(locale, legalPath(slug)) },
          ]),
        ]}
      />
      <LegalDoc
        title={entry.meta.title}
        updated={t("legal.updated").replace("{date}", updated)}
        breadcrumbs={{
          label: t("breadcrumbs.label"),
          items: [
            { label: t("nav.home"), href: localePath(locale, "") },
            { label: t("footer.legalLabel") },
            { label: entry.meta.title },
          ],
        }}
        draft={
          entry.meta.draft ? { title: t("legal.draft.title"), text: t("legal.draft.text") } : null
        }
        summary={
          entry.meta.summary.length > 0
            ? { title: t("legal.summary.title"), items: entry.meta.summary }
            : null
        }
        toc={{
          label: t("legal.toc.label"),
          title: t("legal.toc.title"),
          items: entry.headings,
        }}
      >
        <Body />
      </LegalDoc>
    </>
  );
}
