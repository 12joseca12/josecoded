import { notFound } from "next/navigation";

import { Heading } from "@/components/ui/Heading/Heading";
import { devPagesEnabled } from "@/config/dev";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import {
  aiSwitchLabels,
  consentBadgeLabels,
  memberListLabels,
  roomLabels,
} from "@/lib/chat/room-labels";

import styles from "./page.module.css";
import { RoomDemo } from "./room-demo";

export const dynamic = "force-dynamic";

export default async function RoomKitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!devPagesEnabled || !isLocale(locale)) notFound();
  const t = await getTranslator(locale);

  return (
    <section className={styles.page}>
      <Heading level={1} size="h2">
        {t("dev.room.title")}
      </Heading>
      <p className={styles.intro}>{t("dev.room.intro")}</p>
      <RoomDemo
        locale={locale}
        room={roomLabels(t)}
        members={memberListLabels(t)}
        ai={aiSwitchLabels(t)}
        consent={consentBadgeLabels(t)}
        dev={{
          incoming: t("dev.room.incoming"),
          incomingBody: t("dev.room.incomingBody"),
          switchSection: t("dev.room.switchSection"),
          ownName: t("dev.room.ownName"),
          otherName: t("dev.room.otherName"),
        }}
      />
    </section>
  );
}
