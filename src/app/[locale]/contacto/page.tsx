import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChannelCard } from "@/components/contact/ChannelCard/ChannelCard";
import { ChatChannel } from "@/components/contact/ChatChannel/ChatChannel";
import { PageHead } from "@/components/site/PageHead/PageHead";
import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { contact } from "@/config/contact";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { hasLiveChannel, resolveChannels } from "@/lib/contact/channels";
import { buildPageMetadata } from "@/lib/seo/metadata";

import styles from "./page.module.css";

interface ContactProps {
  params: Promise<{ locale: string }>;
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

export default async function ContactPage({ params }: ContactProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  const channels = resolveChannels(contact, t("contactChooser.whatsappMessage"));

  return (
    <>
      <PageHead
        title={t("contactPage.head.title")}
        accent={t("contactPage.head.accent")}
        lead={t("contactPage.head.lead")}
      />
      <section className={styles.channels} aria-label={t("contactPage.channelsLabel")}>
        <ul className={styles.list}>
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
          {channels.emailHref ? (
            <ChannelCard title={t("contactPage.email.title")} hint={t("contactPage.email.hint")}>
              <Button href={channels.emailHref} icon={<ArrowIcon />}>
                {t("contactPage.email.open")}
              </Button>
            </ChannelCard>
          ) : null}
        </ul>
      </section>
    </>
  );
}
