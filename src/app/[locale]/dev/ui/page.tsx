import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { PlayIcon } from "@/components/ui/icons/PlayIcon";
import { Link } from "@/components/ui/Link/Link";
import { devPagesEnabled } from "@/config/dev";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { buttonVariants, linkVariants } from "@/types/ui";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function UiCatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!devPagesEnabled || !isLocale(locale)) notFound();
  const t = await getTranslator(locale);

  return (
    <main className={styles.page}>
      <Heading level={1} size="h2">
        {t("dev.ui.title")}
      </Heading>

      <section className={styles.section} aria-labelledby="ui-buttons">
        <Heading level={2} size="h4" id="ui-buttons">
          {t("dev.ui.buttons")}
        </Heading>
        {buttonVariants.map((variant) => {
          const icon = variant === "ghost" ? <PlayIcon /> : <ArrowIcon />;
          return (
            <div key={variant} className={styles.row}>
              <code className={styles.name}>{variant}</code>
              <div className={styles.cells}>
                <Button variant={variant} icon={icon}>
                  {t("dev.ui.stateDefault")}
                </Button>
                <Button variant={variant}>{t("dev.ui.withoutIcon")}</Button>
                <Button variant={variant} size="sm" icon={icon}>
                  {t("dev.ui.sizeSmall")}
                </Button>
                <Button variant={variant} icon={icon} disabled>
                  {t("dev.ui.stateDisabled")}
                </Button>
                <Button variant={variant} icon={icon} loading loadingLabel={t("dev.ui.loading")}>
                  {t("dev.ui.stateLoading")}
                </Button>
                <Button variant={variant} icon={icon} href="#ui-buttons">
                  {t("dev.ui.asLink")}
                </Button>
              </div>
            </div>
          );
        })}
        <p className={styles.note}>{t("dev.ui.interactiveStates")}</p>
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
    </main>
  );
}
