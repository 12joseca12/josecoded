import NextLink from "next/link";

import { PageSection } from "@/components/site/PageSection/PageSection";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { Link } from "@/components/ui/Link/Link";
import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { startValues } from "@/lib/services/recommender";
import { toSearch } from "@/lib/services/recommender-url";

import styles from "./RecommenderTeaser.module.css";

interface RecommenderTeaserProps {
  locale: Locale;
}

const optionKeys = {
  idea: {
    label: "offersPage.recommender.questions.start.options.idea.label",
    hint: "offersPage.recommender.questions.start.options.idea.hint",
  },
  defined: {
    label: "offersPage.recommender.questions.start.options.defined.label",
    hint: "offersPage.recommender.questions.start.options.defined.hint",
  },
  existing: {
    label: "offersPage.recommender.questions.start.options.existing.label",
    hint: "offersPage.recommender.questions.start.options.existing.hint",
  },
} as const satisfies Record<(typeof startValues)[number], { label: MessageKey; hint: MessageKey }>;

const legendId = "teaser-legend";

export async function RecommenderTeaser({ locale }: RecommenderTeaserProps) {
  const t = await getTranslator(locale);
  const base = `/${locale}/servicios/a-medida`;

  return (
    <PageSection
      id="empezar"
      title={t("offersPage.recommender.title")}
      lead={t("home.recommender.lead")}
      size="wide"
      fit="content"
    >
      <div role="group" aria-labelledby={legendId} className={styles.group}>
        <p id={legendId} className={styles.legend}>
          {t("offersPage.recommender.questions.start.legend")}
        </p>
        <ul className={styles.options}>
          {startValues.map((value) => {
            const hintId = `teaser-${value}-hint`;
            return (
              <li key={value} className={styles.item}>
                <NextLink
                  className={styles.option}
                  href={`${base}?${toSearch({ draft: { start: value } })}#recomendador`}
                  aria-describedby={hintId}
                >
                  <span>{t(optionKeys[value].label)}</span>
                  <span className={styles.icon}>
                    <ArrowIcon />
                  </span>
                </NextLink>
                <span id={hintId} className={styles.hint}>
                  {t(optionKeys[value].hint)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <Link href={`${base}#recomendador`} variant="arrow">
          {t("home.recommender.more")}
        </Link>
      </div>
    </PageSection>
  );
}
