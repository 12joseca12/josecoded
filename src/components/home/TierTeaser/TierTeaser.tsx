import { PageSection } from "@/components/site/PageSection/PageSection";
import { Button } from "@/components/ui/Button/Button";
import { Link } from "@/components/ui/Link/Link";
import { PriceState } from "@/components/ui/PriceState/PriceState";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { getCatalog } from "@/lib/catalog/load";
import { isProvisional, offerCopyKeys, offersOn, platforms } from "@/lib/services/offers";

import styles from "./TierTeaser.module.css";

interface TierTeaserProps {
  locale: Locale;
}

export async function TierTeaser({ locale }: TierTeaserProps) {
  const [t, catalog] = await Promise.all([getTranslator(locale), getCatalog()]);
  const base = `/${locale}/servicios/a-medida`;

  return (
    <PageSection
      id="a-medida"
      title={t("services.ways.project.title")}
      accent={t("home.tiers.accent")}
      size="wide"
      fit="content"
    >
      <div className={styles.tiers}>
        {platforms.map((platform) => {
          const headingId = `home-tiers-${platform}`;
          return (
            <section
              key={platform}
              className={styles.group}
              data-platform={platform}
              aria-labelledby={headingId}
            >
              <h3 id={headingId} className={styles.groupTitle}>
                {t(platform === "web" ? "offersPage.compare.tabWeb" : "offersPage.compare.tabApp")}
              </h3>
              <ul className={styles.list}>
                {offersOn(platform, catalog.offers).map((offer) => (
                  <li key={offer.slug} className={styles.tier}>
                    <strong className={styles.name}>{t(offerCopyKeys(offer.slug).name)}</strong>
                    {isProvisional(offer) ? (
                      <PriceState variant="review" label={t("services.price.review")} />
                    ) : (
                      <PriceState
                        variant="final"
                        prefix={t("offersPage.compare.from")}
                        amount={offer.from}
                        unit={t("offersPage.compare.unit")}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <div className={styles.foot}>
        <Button href={base} variant="ghost">
          {t("services.ways.project.cta")}
        </Button>
        <p className={styles.notSure}>
          {t("offersPage.compare.notSure")}{" "}
          <Link href={`${base}#recomendador`} variant="arrow">
            {t("offersPage.compare.notSureLink")}
          </Link>
        </p>
      </div>
    </PageSection>
  );
}
