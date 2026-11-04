import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { devPagesEnabled } from "@/config/dev";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { cardTones, linkVariants } from "@/types/ui";

import { ButtonsDemo } from "./buttons-demo";
import styles from "./page.module.css";
import { StatesDemo } from "./states-demo";

export const dynamic = "force-dynamic";

const cardToneLabels = {
  panel: "dev.ui.cardPanel",
  glass: "dev.ui.cardGlass",
  error: "dev.ui.cardError",
} as const;

const coralRules = [
  "dev.ui.coralNav",
  "dev.ui.coralMarker",
  "dev.ui.coralLinks",
  "dev.ui.coralFocus",
  "dev.ui.coralDetails",
] as const;

export default async function UiCatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!devPagesEnabled || !isLocale(locale)) notFound();
  const t = await getTranslator(locale);

  return (
    <div className={styles.page}>
      <Heading level={1} size="h2">
        {t("dev.ui.title")}
      </Heading>

      <section className={styles.section} aria-labelledby="ui-coral">
        <Heading level={2} size="h4" id="ui-coral" marker>
          {t("dev.ui.coral")}
        </Heading>
        <p className={styles.note}>{t("dev.ui.coralText")}</p>
        <ul className={styles.rules}>
          {coralRules.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
        <div className={styles.cells}>
          <Heading level={3} size="h2" marker>
            {t("dev.ui.coralMarkerDemo")}
          </Heading>
          <Heading level={3} size="h4" marker>
            {t("dev.ui.coralMarkerSmall")}
          </Heading>
          <Link href="#ui-coral">{t("dev.ui.linkInternal")}</Link>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="ui-buttons">
        <Heading level={2} size="h4" id="ui-buttons">
          {t("dev.ui.buttons")}
        </Heading>
        <ButtonsDemo
          labels={{
            stateDefault: t("dev.ui.stateDefault"),
            withoutIcon: t("dev.ui.withoutIcon"),
            sizeSmall: t("dev.ui.sizeSmall"),
            stateDisabled: t("dev.ui.stateDisabled"),
            stateLoading: t("dev.ui.stateLoading"),
            loading: t("dev.ui.loading"),
            asLink: t("dev.ui.asLink"),
            forceHover: t("dev.ui.forceHover"),
            forcePressed: t("dev.ui.forcePressed"),
            roles: {
              primary: t("dev.ui.role_primary"),
              accent: t("dev.ui.role_accent"),
              light: t("dev.ui.role_light"),
              quiet: t("dev.ui.role_quiet"),
              ghost: t("dev.ui.role_ghost"),
            },
          }}
        />
        <p className={styles.note}>{t("dev.ui.interactiveStates")}</p>
      </section>

      <section className={styles.section} aria-labelledby="ui-cards">
        <Heading level={2} size="h4" id="ui-cards">
          {t("dev.ui.cards")}
        </Heading>
        <p className={styles.note}>{t("dev.ui.cardText")}</p>
        <div className={styles.cardGrid}>
          {cardTones.map((tone) => (
            <Card key={tone} tone={tone}>
              <Heading level={3} size="h4">
                {t(cardToneLabels[tone])}
              </Heading>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="ui-links">
        <Heading level={2} size="h4" id="ui-links">
          {t("dev.ui.links")}
        </Heading>
        <div className={styles.cells}>
          <Link href="#ui-links">{t("dev.ui.linkInternal")}</Link>
          <Link href="https://example.com" external newTabLabel={t("dev.ui.newTab")}>
            {t("dev.ui.linkExternal")}
          </Link>
          {linkVariants.map((variant) => (
            <Link key={variant} href="#ui-links" variant={variant}>
              {t(`dev.ui.link_${variant}`)}
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="ui-headings">
        <Heading level={2} size="h4" id="ui-headings">
          {t("dev.ui.headings")}
        </Heading>
        <Heading level={2} size="h1" accent={t("dev.ui.accent")}>
          {t("dev.ui.headingDisplay")}
        </Heading>
        <Heading level={2} size="h2" accent={t("dev.ui.accent")}>
          {t("dev.ui.headingTitle")}
        </Heading>
        <Heading level={3} accent={t("dev.ui.accent")}>
          {t("dev.ui.headingSub")}
        </Heading>
        <Heading level={4}>{t("dev.ui.headingSmall")}</Heading>
      </section>

      <StatesDemo
        labels={{
          skeleton: t("dev.ui.skeleton"),
          skeletonText: t("dev.ui.skeletonText"),
          skeletonBlock: t("dev.ui.skeletonBlock"),
          skeletonCircle: t("dev.ui.skeletonCircle"),
          loadingRegion: t("dev.ui.loadingRegion"),
          loadingRegionLabel: t("dev.ui.loadingRegionLabel"),
          toggleLoading: t("dev.ui.toggleLoading"),
          loadedContent: t("dev.ui.loadedContent"),
          empty: t("dev.ui.empty"),
          emptyTitle: t("dev.ui.emptyTitle"),
          emptyText: t("dev.ui.emptyText"),
          emptyAction: t("dev.ui.emptyAction"),
          error: t("dev.ui.error"),
          errorTitle: t("dev.ui.errorTitle"),
          errorText: t("dev.ui.errorText"),
          errorRetry: t("dev.ui.errorRetry"),
          errorRetried: t("dev.ui.errorRetried"),
          loading: t("dev.ui.loading"),
          toasts: t("dev.ui.toasts"),
          toastRegion: t("dev.ui.toastRegion"),
          toastClose: t("dev.ui.toastClose"),
          tones: {
            success: {
              trigger: t("dev.ui.toastSuccess"),
              title: t("dev.ui.toastSuccessTitle"),
              text: t("dev.ui.toastSuccessText"),
            },
            error: {
              trigger: t("dev.ui.toastError"),
              title: t("dev.ui.toastErrorTitle"),
              text: t("dev.ui.toastErrorText"),
            },
            info: {
              trigger: t("dev.ui.toastInfo"),
              title: t("dev.ui.toastInfoTitle"),
              text: t("dev.ui.toastInfoText"),
            },
          },
        }}
      />
    </div>
  );
}
