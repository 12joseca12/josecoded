import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChannelCard } from "@/components/contact/ChannelCard/ChannelCard";
import { ChatChannel } from "@/components/contact/ChatChannel/ChatChannel";
import { buildContactFormLabels } from "@/components/contact/ContactForm/labels";
import { FormChannel } from "@/components/contact/FormChannel/FormChannel";
import { WayChannel } from "@/components/contact/WayChannel/WayChannel";
import { PageGraph } from "@/components/seo/PageGraph/PageGraph";
import { Breadcrumbs } from "@/components/site/Breadcrumbs/Breadcrumbs";
import { PageHead } from "@/components/site/PageHead/PageHead";
import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { contact } from "@/config/contact";
import { site } from "@/config/site";
import { isLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { hasLiveChannel, resolveChannels } from "@/lib/contact/channels";
import { isContactAvailable, readContactClientConfig } from "@/lib/contact/env";
import { parseSelection } from "@/lib/contact/selection";
import { resolveInitialWay } from "@/lib/contact/ways";
import { buildBreadcrumbList, buildContactPage } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { localePath } from "@/lib/seo/routes";
import { extraCopyKeys, offerCopyKeys, priceOf } from "@/lib/services/offers";
import { isPilotRequest } from "@/lib/services/pilot";
import type { WayId } from "@/types/services";

import styles from "./page.module.css";

const wayKeys: Record<WayId, { title: MessageKey; hint: MessageKey }> = {
  contratacion: {
    title: "contactPage.ways.contratacion.title",
    hint: "contactPage.ways.contratacion.hint",
  },
  freelance: { title: "contactPage.ways.freelance.title", hint: "contactPage.ways.freelance.hint" },
  project: { title: "contactPage.ways.project.title", hint: "contactPage.ways.project.hint" },
};

interface ContactProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: ContactProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "/contacto",
    title: "contactPage.meta.title",
    description: "contactPage.meta.description",
    indexable: hasLiveChannel(contact),
  });
}

export default async function ContactPage({ params, searchParams }: ContactProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  const channels = resolveChannels(contact, t("contactChooser.whatsappMessage"));
  const emails = Object.fromEntries(
    contact.ways.map((entry) => [entry.way, entry.email]),
  ) as Record<WayId, string>;

  const parsed = parseSelection(query);
  const price = parsed
    ? priceOf(
        parsed.offers,
        parsed.extras.filter((slug) => slug !== "maintenance"),
      )
    : null;
  const selection =
    parsed && price
      ? {
          offers: parsed.offers,
          extras: parsed.extras,
          summary: [
            ...parsed.offers.map((slug) => t(offerCopyKeys(slug).name)),
            ...parsed.extras.map((slug) => t(extraCopyKeys(slug).name)),
          ].join(" + "),
          price: price.once,
          monthly: parsed.extras.includes("maintenance")
            ? priceOf(parsed.offers, ["maintenance"]).monthly
            : null,
          provisional: price.provisional,
          changeHref: `/${locale}/servicios/a-medida#recomendador`,
        }
      : null;

  const initialWay = resolveInitialWay(query);
  const formChannel = (
    <FormChannel
      title={t("contactPage.form.title")}
      hint={t("contactPage.form.hint")}
      locale={locale}
      labels={buildContactFormLabels(t)}
      emails={emails}
      initialWay={initialWay}
      initialMessage={isPilotRequest(query) ? t("contactPage.form.pilotMessage") : undefined}
      selection={selection}
      privacyHref={`/${locale}/legal/privacidad`}
      newTabLabel={t("contactPage.form.newTab")}
      turnstile={isContactAvailable(process.env) ? readContactClientConfig(process.env) : null}
    />
  );

  const crumbs = [
    { label: t("nav.home"), href: localePath(locale, "") },
    { label: t("nav.contact"), href: localePath(locale, "/contacto") },
  ];

  return (
    <>
      <PageGraph
        nodes={[
          buildBreadcrumbList(
            site.origin,
            crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })),
          ),
          buildContactPage(site.origin, locale, "/contacto", {
            name: t("contactPage.meta.title"),
            description: t("contactPage.meta.description"),
          }),
        ]}
      />
      <PageHead
        title={t("contactPage.head.title")}
        accent={t("contactPage.head.accent")}
        lead={t("contactPage.head.lead")}
        breadcrumbs={<Breadcrumbs label={t("breadcrumbs.label")} items={crumbs} />}
      />
      <section className={styles.channels} aria-label={t("contactPage.channelsLabel")}>
        <ul className={styles.list}>
          {initialWay ? formChannel : null}
          <ChatChannel
            title={t("contactPage.chat.title")}
            hint={t("contactPage.chat.hint")}
            openLabel={t("contactPage.chat.open")}
            soonLabel={t("contactPage.chat.soon")}
          />
          {channels.whatsappHref ? (
            <ChannelCard
              title={t("contactPage.whatsapp.title")}
              hint={t("contactPage.whatsapp.hint")}
            >
              <Button
                href={channels.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                icon={<ArrowIcon />}
              >
                {t("contactPage.whatsapp.open")}
              </Button>
            </ChannelCard>
          ) : null}
          {channels.ways.map((entry) => (
            <WayChannel
              key={entry.way}
              id={entry.way}
              title={t(wayKeys[entry.way].title)}
              hint={t(wayKeys[entry.way].hint)}
              email={entry.email}
              href={entry.href}
              openLabel={t("contactPage.mail.open")}
              copyLabel={t("contactPage.copy.label")}
              copyAriaLabel={t("contactPage.copy.aria").replace("{email}", entry.email)}
              copiedLabel={t("contactPage.copy.done")}
            />
          ))}
          {initialWay ? null : formChannel}
        </ul>
      </section>
    </>
  );
}
