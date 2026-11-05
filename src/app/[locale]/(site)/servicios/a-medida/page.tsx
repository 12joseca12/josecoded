import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { FaqWithNexo } from "@/components/chat/FaqWithNexo/FaqWithNexo";
import { ExtraList } from "@/components/services/ExtraList/ExtraList";
import { OfferCompare } from "@/components/services/OfferCompare/OfferCompare";
import { buildRecommenderCopy } from "@/components/services/OfferRecommender/copy";
import { OfferRecommender } from "@/components/services/OfferRecommender/OfferRecommender";
import { ServicePage } from "@/components/services/ServicePage/ServicePage";
import { WarrantyPlans } from "@/components/services/WarrantyPlans/WarrantyPlans";
import { PageSection } from "@/components/site/PageSection/PageSection";
import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { Link } from "@/components/ui/Link/Link";
import { site } from "@/config/site";
import { isLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { buildContactHref } from "@/lib/contact/ways";
import { guideScriptKeys } from "@/lib/nexo/guide";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildFaqItems } from "@/lib/services/faq";
import {
  extraCopyKeys,
  extraOf,
  extras,
  hasProvisionalOffers,
  isProvisional,
  offerCopyKeys,
  offerOf,
  offers,
  offersOn,
  platforms,
} from "@/lib/services/offers";
import { applyForm, hasFormAction, toSearch } from "@/lib/services/recommender-url";
import type {
  ExtraChipItem,
  MaintenancePlan,
  OfferCardItem,
  OfferTabGroup,
} from "@/types/services";

import styles from "./page.module.css";

interface OffersProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const key = (path: string) => `offersPage.${path}` as MessageKey;

export async function generateMetadata({ params, searchParams }: OffersProps): Promise<Metadata> {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "/servicios/a-medida",
    title: "offersPage.meta.title",
    description: "offersPage.meta.description",
    indexable: query.q === undefined && !hasFormAction(query),
  });
}

export default async function OffersPage({ params, searchParams }: OffersProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const basePath = `/${locale}/servicios/a-medida`;

  if (hasFormAction(query)) {
    const search = toSearch(applyForm(query));
    redirect(`${basePath}${search ? `?${search}` : ""}#recomendador`);
  }

  const t = await getTranslator(locale);
  const faq = buildFaqItems(t, "offers");
  const weeks = (min: number, max: number) =>
    t(key("compare.weeks")).replace("{min}", String(min)).replace("{max}", String(max));

  const cardFor = (slug: (typeof offers)[number]["slug"]): OfferCardItem => {
    const offer = offerOf(slug);
    const copy = offerCopyKeys(slug);
    const name = t(copy.name);
    return {
      slug,
      name,
      audience: t(copy.audience),
      includes: copy.includes.map((entry) => t(entry)),
      excludes: copy.excludes.map((entry) => t(entry)),
      price: offer.from,
      provisional: isProvisional(offer),
      weeks: weeks(offer.weeksMin, offer.weeksMax),
      ctaHref: buildContactHref(locale, "project", { offers: [slug], extras: [] }),
      ctaLabel: t(key("compare.ctaFor")).replace("{name}", name),
    };
  };

  const groups: OfferTabGroup[] = platforms.map((platform) => ({
    id: platform,
    label: t(key(platform === "web" ? "compare.tabWeb" : "compare.tabApp")),
    items: offersOn(platform).map((offer) => cardFor(offer.slug)),
  }));

  const nameOf = (slug: (typeof offers)[number]["slug"]) => t(offerCopyKeys(slug).name);
  const chips: ExtraChipItem[] = extras.map((extra) => {
    const copy = extraCopyKeys(extra.slug);
    const onlyWeb = extra.applies.every((slug) => slug.startsWith("web"));
    const onlyApp = extra.applies.every((slug) => slug.startsWith("app"));
    const tags = [
      ...(onlyWeb ? [t(key("extras.onlyWeb"))] : []),
      ...(onlyApp ? [t(key("extras.onlyApp"))] : []),
      ...(extra.billing === "monthly" ? [t(key("extras.monthly"))] : []),
      ...(extra.billing === "per_unit" ? [t(key("extras.perUnit"))] : []),
    ];
    return {
      slug: extra.slug,
      name: t(copy.name),
      text: t(copy.text),
      forWho: t(copy.forWho),
      applies: [...extra.applies],
      tags,
      included:
        extra.includedIn.length > 0
          ? t(key("extras.includedIn")).replace("{offers}", extra.includedIn.map(nameOf).join(", "))
          : t(key("extras.includedNowhere")),
    };
  });

  const maintenance = extraOf("maintenance");
  const plans: MaintenancePlan[] = (["S", "M", "L"] as const).map((size) => ({
    id: size,
    name: t(key(`warranty.size${size}.name`)),
    hours: t(key(`warranty.size${size}.hours`)),
    text: t(key(`warranty.size${size}.text`)),
  }));

  const guideScript = Object.fromEntries(
    Object.entries(guideScriptKeys).map(([id, messageKey]) => [id, t(messageKey)]),
  );

  return (
    <ServicePage
      locale={locale}
      page="offers"
      head={{
        title: "offersPage.head.title",
        accent: "offersPage.head.accent",
        lead: "offersPage.head.lead",
      }}
      faq={faq}
    >
      <PageSection
        id="comparador"
        title={t(key("compare.title"))}
        lead={t(key("compare.lead"))}
        size="wide"
      >
        <OfferCompare
          labels={{
            tabs: t(key("compare.tabsLabel")),
            from: t(key("compare.from")),
            unit: t(key("compare.unit")),
            price: t(key("compare.price")),
            audience: t(key("compare.audience")),
            includes: t(key("compare.includes")),
            excludes: t(key("compare.excludes")),
            delivery: t(key("compare.delivery")),
            provisional: t("services.rates.provisional"),
          }}
          groups={groups}
        />
        <p className={styles.note}>
          {hasProvisionalOffers(offers) ? `${t("services.rates.provisionalNote")} ` : ""}
          {t(key("compare.scopeNote"))}
        </p>
        <p>
          {t(key("compare.notSure"))}{" "}
          <Link href="#recomendador" variant="arrow">
            {t(key("compare.notSureLink"))}
          </Link>
        </p>
      </PageSection>
      <PageSection
        id="recomendador"
        title={t(key("recommender.title"))}
        lead={t(key("recommender.lead"))}
        size="wide"
      >
        <OfferRecommender
          locale={locale}
          basePath={basePath}
          origin={site.origin}
          initial={{
            q: typeof query.q === "string" ? query.q : undefined,
            paso: typeof query.paso === "string" ? query.paso : undefined,
          }}
          copy={buildRecommenderCopy(t)}
          guideScript={guideScript}
          guideLabels={{
            avatar: t("nexoGuide.label"),
            name: t("nexoGuide.name"),
            role: t("nexoGuide.role"),
            disclosure: t("nexoGuide.disclosure"),
          }}
        />
      </PageSection>
      <PageSection
        id="extras"
        title={t(key("extras.title"))}
        lead={t(key("extras.lead"))}
        size="wide"
      >
        <ExtraList
          action={`/${locale}/contacto#formulario`}
          legend={t(key("extras.legend"))}
          cta={t(key("extras.cta"))}
          hint={t(key("extras.hint"))}
          showAll={t(key("extras.showAll"))}
          items={chips}
          initialQuery={typeof query.q === "string" ? query.q : undefined}
        />
      </PageSection>
      <PageSection
        id="garantia"
        title={t(key("warranty.title"))}
        lead={t(key("warranty.lead"))}
        size="wide"
      >
        <WarrantyPlans
          warranty={{
            title: t(key("warranty.includedTitle")),
            text: t(key("warranty.includedText")),
          }}
          plans={{
            title: t(key("warranty.plansTitle")),
            lead: t(key("warranty.plansLead")),
            items: plans,
          }}
          price={{
            from: t(key("warranty.from")),
            amount: isProvisional(maintenance) ? "000" : maintenance.from,
            unit: t(key("warranty.perMonth")),
            provisional: t("services.rates.provisional"),
          }}
          note={t(key("warranty.note"))}
        />
      </PageSection>
      <PageSection id="preguntas" title={t("services.faq.title")} size="wide">
        <FaqWithNexo locale={locale} items={faq} />
      </PageSection>
      <PageSection id="contacto" title={t(key("closing.title"))} lead={t(key("closing.text"))}>
        <div className={styles.actions}>
          <Button href={buildContactHref(locale, "project")} icon={<ArrowIcon />}>
            {t(key("closing.cta"))}
          </Button>
          <Button href={`/${locale}/como-trabajo`} variant="ghost" icon={<ArrowIcon />}>
            {t(key("closing.more"))}
          </Button>
        </div>
      </PageSection>
    </ServicePage>
  );
}
